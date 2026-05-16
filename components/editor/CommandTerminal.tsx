"use client";

import { FormEvent, useRef, useState } from "react";
import { Loader2, PanelBottom, PanelRight, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type TerminalEntry = {
  command: string;
  output: string;
};

type CommandTerminalProps = {
  visible: boolean;
  position: "bottom" | "right";
  size: number;
  onTogglePosition: () => void;
  onResizeStart: () => void;
  onClose: () => void;
};

const examples = [
  "npx create-next-app@latest my-app --typescript --tailwind --eslint --app --use-npm",
  "npm create vite@latest my-react-app -- --template react-ts",
  "npm install",
  "npm run dev",
];

export function CommandTerminal({ visible, position, size, onTogglePosition, onResizeStart, onClose }: CommandTerminalProps) {
  const [command, setCommand] = useState("");
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!visible) return null;

  async function runCommand(event: FormEvent) {
    event.preventDefault();
    const nextCommand = command.trim();
    if (!nextCommand || running) return;

    setCommand("");
    setRunning(true);
    try {
      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: nextCommand }),
      });
      const data = (await response.json()) as { output?: string; error?: string };
      setEntries((current) => [...current, { command: nextCommand, output: data.output ?? data.error ?? "No output." }]);
    } catch (error) {
      setEntries((current) => [...current, { command: nextCommand, output: error instanceof Error ? error.message : "Command failed." }]);
    } finally {
      setRunning(false);
      inputRef.current?.focus();
    }
  }

  return (
    <section
      className={`relative flex shrink-0 flex-col bg-[var(--panel-2)] ${position === "bottom" ? "border-t border-[var(--line)]" : "border-l border-[var(--line)]"}`}
      style={{ [position === "bottom" ? "height" : "width"]: size }}
    >
      <div
        className={`absolute z-10 transition-colors hover:bg-cyan-400 ${position === "bottom" ? "left-0 right-0 top-0 -mt-px h-1 cursor-row-resize" : "bottom-0 left-0 top-0 -ml-px w-1 cursor-col-resize"}`}
        onMouseDown={onResizeStart}
        role="separator"
      />
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-[var(--line)] px-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Terminal size={16} className="text-[var(--accent)]" />
          Terminal
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" aria-label="Toggle terminal position" onClick={onTogglePosition}>
            {position === "bottom" ? <PanelRight size={16} /> : <PanelBottom size={16} />}
          </Button>
          <Button size="icon" variant="ghost" aria-label="Close terminal" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-sm">
        {entries.length === 0 && (
          <div className="space-y-2 text-[var(--muted)]">
            <p>Run workspace commands here. Project generators should use non-interactive flags.</p>
            <div className="grid gap-1">
              {examples.map((example) => (
                <button key={example} className="truncate rounded border border-[var(--line)] px-2 py-1 text-left hover:bg-[var(--panel)]" onClick={() => setCommand(example)}>
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {entries.map((entry, index) => (
          <div key={`${entry.command}-${index}`} className="mb-4">
            <div className="text-[var(--accent)]">$ {entry.command}</div>
            <pre className="mt-1 whitespace-pre-wrap text-[var(--foreground)]">{entry.output}</pre>
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-2 text-[var(--muted)]">
            <Loader2 size={14} className="animate-spin" />
            Running command...
          </div>
        )}
      </div>

      <form onSubmit={runCommand} className="flex shrink-0 items-center gap-2 border-t border-[var(--line)] p-2 font-mono text-sm">
        <span className="text-[var(--accent)]">$</span>
        <input
          ref={inputRef}
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="npm create vite@latest my-react-app -- --template react-ts"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--muted)]"
        />
        <Button type="submit" size="sm" disabled={running || !command.trim()}>
          Run
        </Button>
      </form>
    </section>
  );
}
