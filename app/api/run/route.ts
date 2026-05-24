import { execFile, spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

const execFileAsync = promisify(execFile);
const RUN_TIMEOUT_MS = 3500;

// In-Memory Execution Cache (LRU, TTL 5 minutes)
const RUN_CACHE = new Map<string, { output: string; timestamp: number }>();
const CACHE_MAX_SIZE = 100;
const CACHE_TTL_MS = 5 * 60 * 1000;

function getCache(key: string): string | null {
  const item = RUN_CACHE.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    RUN_CACHE.delete(key);
    return null;
  }
  return item.output;
}

function setCache(key: string, output: string) {
  if (RUN_CACHE.size >= CACHE_MAX_SIZE) {
    const oldestKey = RUN_CACHE.keys().next().value;
    if (oldestKey !== undefined) RUN_CACHE.delete(oldestKey);
  }
  RUN_CACHE.set(key, { output, timestamp: Date.now() });
}

// Executes processes directly via stdin stream without disk writing
function runProcessWithStdin(
  command: string,
  args: string[],
  input: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; killed: boolean }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = "";
    let stderr = "";
    let killed = false;

    const timeout = setTimeout(() => {
      killed = true;
      child.kill("SIGKILL");
    }, timeoutMs);

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", () => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, killed });
    });

    // Write input script and close stdin stream
    child.stdin.write(input, "utf8");
    child.stdin.end();
  });
}

export async function POST(request: Request) {
  const { language, code } = (await request.json()) as { language?: string; code?: string };
  if (!code || !language) return NextResponse.json({ error: "language and code are required." }, { status: 400 });

  // 1. Check in-memory Cache
  const cacheKey = createHash("sha256").update(`${language}:${code}`).digest("hex");
  const cachedOutput = getCache(cacheKey);
  if (cachedOutput !== null) {
    return NextResponse.json({ output: cachedOutput });
  }

  let result: NextResponse;

  // In production, proxy Java/Python execution to the Render runner if online
  const runnerUrl = process.env.RUNNER_URL;
  if (runnerUrl && (language === "java" || language === "python")) {
    try {
      const resp = await fetch(`${runnerUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
        signal: AbortSignal.timeout(3000), // Quick fallback if unreachable
      });
      if (resp.ok) {
        const data = await resp.json();
        result = NextResponse.json(data);
        if (data.output) setCache(cacheKey, data.output);
        return result;
      }
    } catch {
      console.log("Runner proxy failed (offline), falling back to local compilation.");
    }
  }

  // Local compilation & execution fallback (works offline)
  if (language === "java") result = await runJava(code);
  else if (language === "python") result = await runPython(code);
  else if (language === "cpp") result = await runCpp(code);
  else {
    return NextResponse.json({ error: `Server runner does not support ${language}.` }, { status: 400 });
  }

  // Cache output if compilation/run succeeded
  try {
    const data = await result.clone().json();
    if (data.output && !data.output.includes("runtime error") && !data.output.includes("Compilation error")) {
      setCache(cacheKey, data.output);
    }
  } catch {}

  return result;
}

async function runJava(code: string) {
  const dir = await mkdtemp(join(tmpdir(), "forge-java-"));
  const className = code.match(/public\s+class\s+([A-Za-z_$][\w$]*)/)?.[1] ?? code.match(/class\s+([A-Za-z_$][\w$]*)/)?.[1] ?? "Main";
  const sourcePath = join(dir, `${className}.java`);

  try {
    await writeFile(sourcePath, code, "utf8");
    await execFileAsync("javac", [sourcePath], { timeout: RUN_TIMEOUT_MS, windowsHide: true });
    const { stdout, stderr } = await execFileAsync("java", ["-cp", dir, className], {
      timeout: RUN_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 512,
    });
    return NextResponse.json({ output: [stdout, stderr].filter(Boolean).join("\n") || "Program finished without console output." });
  } catch (error) {
    return NextResponse.json({ output: formatRunnerError(error) });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function runPython(code: string) {
  try {
    let stdout = "";
    let stderr = "";
    let runError: any = null;
    let killed = false;

    // Try primary command (python or PYTHON_BIN) via stdin to completely avoid disk writes/cleanup
    try {
      const res = await runProcessWithStdin(process.env.PYTHON_BIN ?? "python", ["-"], code, RUN_TIMEOUT_MS);
      stdout = res.stdout;
      stderr = res.stderr;
      killed = res.killed;
    } catch (err: any) {
      if (err.code === "ENOENT" && !process.env.PYTHON_BIN) {
        // Fallback to 'py' (Windows Python Launcher)
        try {
          const res = await runProcessWithStdin("py", ["-"], code, RUN_TIMEOUT_MS);
          stdout = res.stdout;
          stderr = res.stderr;
          killed = res.killed;
        } catch (err2: any) {
          if (err2.code === "ENOENT") {
            // Fallback to 'python3' (macOS / Linux)
            try {
              const res = await runProcessWithStdin("python3", ["-"], code, RUN_TIMEOUT_MS);
              stdout = res.stdout;
              stderr = res.stderr;
              killed = res.killed;
            } catch (err3: any) {
              runError = err3;
            }
          } else {
            runError = err2;
          }
        }
      } else {
        runError = err;
      }
    }

    if (runError) {
      throw runError;
    }

    if (killed) {
      return NextResponse.json({ output: `Execution stopped after ${RUN_TIMEOUT_MS / 1000}s. Possible infinite loop.` });
    }

    return NextResponse.json({ output: [stdout, stderr].filter(Boolean).join("\n") || "Program finished without console output." });
  } catch (error) {
    return NextResponse.json({ output: formatRunnerError(error) });
  }
}

async function runCpp(code: string) {
  const dir = await mkdtemp(join(tmpdir(), "forge-cpp-"));
  const sourcePath = join(dir, "main.cpp");
  const outputPath = join(dir, "main.exe");

  try {
    await writeFile(sourcePath, code, "utf8");
    // Compile using g++ without O2 flag for fast compilation speed
    await execFileAsync("g++", [sourcePath, "-o", outputPath], { timeout: RUN_TIMEOUT_MS, windowsHide: true });
    const { stdout, stderr } = await execFileAsync(outputPath, [], {
      timeout: RUN_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 512,
    });
    return NextResponse.json({ output: [stdout, stderr].filter(Boolean).join("\n") || "Program finished without console output." });
  } catch (error) {
    return NextResponse.json({ output: formatRunnerError(error) });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function formatRunnerError(error: unknown) {
  if (typeof error === "object" && error && "killed" in error && error.killed) {
    return `Execution stopped after ${RUN_TIMEOUT_MS / 1000}s. Possible infinite loop or long-running program.`;
  }
  if (typeof error === "object" && error && "stderr" in error && typeof error.stderr === "string" && error.stderr.trim()) {
    return error.stderr.trim();
  }
  if (error instanceof Error) return error.message;
  return "Unknown runtime error.";
}
