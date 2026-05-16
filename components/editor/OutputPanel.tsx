"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, PanelBottom, PanelRight, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Language, WorkspaceFile } from "@/lib/types";

type RunResult = {
  type: "console" | "preview";
  output: string;
};

type OutputPanelProps = {
  visible: boolean;
  result: RunResult | null;
  activeFile: WorkspaceFile;
  files: WorkspaceFile[];
  position: "bottom" | "right";
  size: number;
  onTogglePosition: () => void;
  onResizeStart: () => void;
  onClose: () => void;
  onCommand?: (command: string) => void;
  currentPath: string;
};

const JS_TIMEOUT_MS = 3000;
const PY_TIMEOUT_MS = 8000;

export function buildPreview(activeFile: WorkspaceFile, files: WorkspaceFile[]) {
  const html = activeFile.language === "html" ? activeFile.content : files.find((file) => file.language === "html")?.content ?? "<main></main>";
  const css = activeFile.language === "css" ? activeFile.content : files.find((file) => file.language === "css")?.content ?? "";
  return `<!doctype html><html><head><style>${css}</style></head><body>${html}</body></html>`;
}

export async function runCode(language: Language, content: string): Promise<RunResult> {
  if (language === "html" || language === "css") return { type: "preview", output: "" };
  if (language === "plaintext") return { type: "console", output: "Cannot run plain text files." };
  if (language === "java") return runServerCode(language, content);
  if (language === "python") {
    const serverResult = await runServerCode(language, content);
    if (!serverResult.output.includes("spawn python ENOENT")) return serverResult;
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

export function OutputPanel({ visible, result, activeFile, files, position, size, currentPath, onTogglePosition, onResizeStart, onClose, onCommand }: OutputPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollRef = useRef<HTMLPreElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState("");
  const preview = useMemo(() => buildPreview(activeFile, files), [activeFile, files]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result?.output, currentPath]);

  useEffect(() => {
    if (!visible || result?.type !== "preview" || !iframeRef.current) return;
    iframeRef.current.srcdoc = preview;
  }, [preview, result?.type, visible]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && command.trim() && onCommand) {
      onCommand(command.trim());
      setCommand("");
    }
  };

  if (!visible) return null;

  return (
    <section 
      className={`shrink-0 bg-[var(--panel-2)] relative flex flex-col ${position === "bottom" ? "border-t border-[var(--line)]" : "border-l border-[var(--line)]"}`}
      style={{ [position === "bottom" ? "height" : "width"]: size }}
    >
      <div 
         className={`absolute z-10 hover:bg-cyan-400 transition-colors ${position === "bottom" ? "top-0 left-0 right-0 h-1 -mt-[1px] cursor-row-resize" : "left-0 top-0 bottom-0 w-1 -ml-[1px] cursor-col-resize"}`} 
         onMouseDown={onResizeStart} 
         role="separator"
      />
      <div className="flex h-10 items-center justify-between border-b border-[var(--line)] px-3 shrink-0">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
          <Terminal size={16} className="text-[var(--accent)]" />
          Terminal
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Toggle terminal position" onClick={onTogglePosition}>
            {position === "bottom" ? <PanelRight size={16} className="text-[var(--muted)]" /> : <PanelBottom size={16} className="text-[var(--muted)]" />}
          </Button>
          <Button size="icon" variant="ghost" aria-label="Close output" onClick={onClose}>
            <X size={16} className="text-[var(--muted)]" />
          </Button>
        </div>
      </div>
      {result?.type === "preview" ? (
        <iframe ref={iframeRef} title="Live preview" className="h-[calc(100%-2.5rem)] w-full bg-white" sandbox="allow-scripts" />
      ) : (
        <div className="flex flex-col h-[calc(100%-2.5rem)] bg-[var(--panel-2)]">
          <pre ref={scrollRef} className="flex-1 overflow-auto p-4 font-mono text-xs text-[var(--foreground)] selection:bg-[var(--accent)]/30 scrollbar-thin scrollbar-thumb-[var(--line)]">
            {result === null ? (
              <span className="flex items-center gap-2 text-[var(--muted)] animate-pulse">
                <Loader2 size={14} className="animate-spin" />
                Executing...
              </span>
            ) : (
              result.output
            )}
          </pre>
          <div className="flex items-center gap-2 border-t border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 shrink-0">
            <span className="text-[var(--accent)] font-bold text-[10px] opacity-80">novacode:{currentPath}$</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted)]/40"
              placeholder="Type a command..."
              autoFocus
            />
          </div>
        </div>
      )}
    </section>
  );
}
