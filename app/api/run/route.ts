import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);
const RUN_TIMEOUT_MS = 3500;

export async function POST(request: Request) {
  const { language, code } = (await request.json()) as { language?: string; code?: string };
  if (!code || !language) return NextResponse.json({ error: "language and code are required." }, { status: 400 });

  // In production, proxy Java/Python execution to the Render runner
  const runnerUrl = process.env.NEXT_PUBLIC_RUNNER_URL;
  if (runnerUrl && (language === "java" || language === "python")) {
    try {
      const resp = await fetch(`${runnerUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
        signal: AbortSignal.timeout(12000),
      });
      const data = await resp.json();
      return NextResponse.json(data);
    } catch (error) {
      return NextResponse.json({
        output: "Runner service is unavailable. Please try again in a moment.",
      });
    }
  }

  // Fallback: run locally (works in local dev if runtimes are installed)
  if (language === "java") return runJava(code);
  if (language === "python") return runPython(code);

  return NextResponse.json({ error: `Server runner does not support ${language}.` }, { status: 400 });
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
  const dir = await mkdtemp(join(tmpdir(), "forge-python-"));
  const sourcePath = join(dir, "main.py");

  try {
    await writeFile(sourcePath, code, "utf8");
    const { stdout, stderr } = await execFileAsync(process.env.PYTHON_BIN ?? "python", [sourcePath], {
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
