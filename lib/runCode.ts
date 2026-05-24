import { Language, WorkspaceFile } from "@/lib/types";

export type RunResult = {
  type: "console" | "preview";
  output: string;
  html?: string;
};

const JS_TIMEOUT_MS = 3000;
const PY_TIMEOUT_MS = 8000;

export function buildPreview(activeFile: WorkspaceFile, files: WorkspaceFile[]) {
  const html = activeFile.language === "html" ? activeFile.content : files.find((file) => file.language === "html")?.content ?? "<main></main>";
  const css = activeFile.language === "css" ? activeFile.content : files.find((file) => file.language === "css")?.content ?? "";
  return `<!doctype html><html><head><style>${css}</style></head><body>${html}</body></html>`;
}

export async function runCode(language: Language, content: string): Promise<RunResult> {
  if (language === "html" || language === "css" || language === "markdown") return { type: "preview", output: "" };
  if (language === "plaintext") return { type: "console", output: "Cannot run plain text files." };
  if (language === "java" || language === "cpp") return runServerCode(language, content);
  if (language === "python") {
    const serverResult = await runServerCode(language, content);
    if (!serverResult.output.includes("spawn python ENOENT") && !serverResult.output.includes("Unable to reach runner")) return serverResult;
    return runPythonInWorker(content);
  }
  return runJavaScriptInWorker(language === "typescript" ? stripTypes(content) : content);
}

async function runServerCode(language: Language, content: string): Promise<RunResult> {
  try {
    const response = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code: content }),
    });
    const data = (await response.json()) as { output?: string; error?: string };
    return { type: "console", output: data.output ?? data.error ?? "Runner returned no output." };
  } catch (error) {
    return { type: "console", output: error instanceof Error ? error.message : "Unable to reach runner." };
  }
}

function runJavaScriptInWorker(code: string): Promise<RunResult> {
  const workerSource = `
    const logs = [];
    const format = (items) => items.map((item) => {
      try { return typeof item === "string" ? item : JSON.stringify(item); }
      catch { return String(item); }
    }).join(" ");
    self.console = {
      log: (...args) => logs.push(format(args)),
      warn: (...args) => logs.push("Warning: " + format(args)),
      error: (...args) => logs.push("Error: " + format(args))
    };
    try {
      new Function(${JSON.stringify(code)})();
      self.postMessage({ output: logs.join("\\n") || "Program finished without console output." });
    } catch (error) {
      self.postMessage({ output: error && error.message ? error.message : "Unknown runtime error." });
    }
  `;
  return runWorker(workerSource, JS_TIMEOUT_MS);
}

function runPythonInWorker(code: string): Promise<RunResult> {
  const workerSource = `
    const logs = [];
    async function main() {
      importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
      const pyodide = await loadPyodide();
      pyodide.setStdout({ batched: (text) => logs.push(text) });
      pyodide.setStderr({ batched: (text) => logs.push("Error: " + text) });
      await pyodide.runPythonAsync(${JSON.stringify(code)});
      self.postMessage({ output: logs.join("\\n") || "Program finished without console output." });
    }
    main().catch((error) => self.postMessage({ output: error && error.message ? error.message : "Unknown Python runtime error." }));
  `;
  return runWorker(workerSource, PY_TIMEOUT_MS);
}

function runWorker(source: string, timeoutMs: number): Promise<RunResult> {
  return new Promise((resolve) => {
    const blob = new Blob([source], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);
    const timeout = window.setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ type: "console", output: `Execution stopped after ${timeoutMs / 1000}s. Possible infinite loop or long-running program.` });
    }, timeoutMs);
    worker.onmessage = (event: MessageEvent<{ output: string }>) => {
      window.clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ type: "console", output: event.data.output });
    };
    worker.onerror = (event) => {
      window.clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      resolve({ type: "console", output: event.message });
    };
  });
}

function stripTypes(content: string) {
  return content
    .replace(/type\s+\w+\s*=\s*{[\s\S]*?};?/g, "")
    .replace(/interface\s+\w+\s*{[\s\S]*?}/g, "")
    .replace(/:\s*[A-Za-z_$][\w$<>,\s\[\]|]*(?=[,)=;])/g, "");
}
