const express = require("express");
const { execFile } = require("child_process");
const { mkdtemp, rm, writeFile } = require("fs/promises");
const { tmpdir } = require("os");
const { join } = require("path");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);
const app = express();
const PORT = process.env.PORT || 4000;
const RUN_TIMEOUT_MS = 8000;

app.use(express.json());

// CORS — allow requests from your Vercel domain
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/run", async (req, res) => {
  const { language, code } = req.body;
  if (!code || !language) {
    return res.status(400).json({ error: "language and code are required." });
  }

  if (language === "java") return runJava(code, res);
  if (language === "python") return runPython(code, res);

  return res.status(400).json({ error: `Runner does not support ${language}.` });
});

async function runJava(code, res) {
  const dir = await mkdtemp(join(tmpdir(), "novacode-java-"));
  const className =
    code.match(/public\s+class\s+([A-Za-z_$][\w$]*)/)?.[1] ||
    code.match(/class\s+([A-Za-z_$][\w$]*)/)?.[1] ||
    "Main";
  const sourcePath = join(dir, `${className}.java`);

  try {
    await writeFile(sourcePath, code, "utf8");
    await execFileAsync("javac", [sourcePath], { timeout: RUN_TIMEOUT_MS });
    const { stdout, stderr } = await execFileAsync("java", ["-cp", dir, className], {
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 1024 * 512,
    });
    const output = [stdout, stderr].filter(Boolean).join("\n") || "Program finished without console output.";
    return res.json({ output });
  } catch (error) {
    return res.json({ output: formatError(error) });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function runPython(code, res) {
  const dir = await mkdtemp(join(tmpdir(), "novacode-python-"));
  const sourcePath = join(dir, "main.py");

  try {
    await writeFile(sourcePath, code, "utf8");
    const pythonBin = process.env.PYTHON_BIN || "python3";
    const { stdout, stderr } = await execFileAsync(pythonBin, [sourcePath], {
      timeout: RUN_TIMEOUT_MS,
      maxBuffer: 1024 * 512,
    });
    const output = [stdout, stderr].filter(Boolean).join("\n") || "Program finished without console output.";
    return res.json({ output });
  } catch (error) {
    return res.json({ output: formatError(error) });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function formatError(error) {
  if (error?.killed) return `Execution stopped after ${RUN_TIMEOUT_MS / 1000}s. Possible infinite loop.`;
  if (error?.stderr?.trim()) return error.stderr.trim();
  if (error instanceof Error) return error.message;
  return "Unknown runtime error.";
}

app.listen(PORT, () => console.log(`NovaCode runner listening on port ${PORT}`));
