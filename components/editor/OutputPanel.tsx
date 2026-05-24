"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Maximize2, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Language, WorkspaceFile } from "@/lib/types";
import { RunResult, buildPreview } from "@/lib/runCode";

import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

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
  viewMode?: "code" | "design" | "preview";
};

function OutputPanelComponent({ visible, result, activeFile, files, position, size, currentPath, onTogglePosition, onResizeStart, onClose, onCommand, viewMode }: OutputPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [command, setCommand] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const historyIndexRef = useRef<number | null>(null);
  const draftCommandRef = useRef("");
  const preview = useMemo(() => buildPreview(activeFile, files), [activeFile, files]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [result?.output, currentPath]);

  useEffect(() => {
    if (!visible || result?.type !== "preview" || activeFile.language === "markdown" || !iframeRef.current) return;
    iframeRef.current.srcdoc = result.html ?? preview;
  }, [preview, result?.html, result?.type, visible, activeFile.language]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && command.trim() && onCommand) {
      const nextCommand = command.trim();
      onCommand(nextCommand);
      setHistory((current) => [...current, nextCommand]);
      historyIndexRef.current = null;
      draftCommandRef.current = "";
      setCommand("");
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyIndexRef.current === null) draftCommandRef.current = command;
      const nextIndex = historyIndexRef.current === null ? history.length - 1 : Math.max(0, historyIndexRef.current - 1);
      historyIndexRef.current = nextIndex;
      setCommand(history[nextIndex]);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndexRef.current === null) return;
      const nextIndex = historyIndexRef.current + 1;
      if (nextIndex >= history.length) {
        historyIndexRef.current = null;
        setCommand(draftCommandRef.current);
        return;
      }
      historyIndexRef.current = nextIndex;
      setCommand(history[nextIndex]);
    }
  };

  if (!visible) return null;

  const isFullscreenPreview = viewMode === "preview";

  return (
    <section 
      className={`shrink-0 bg-[var(--panel-2)] relative flex flex-col ${isFullscreenPreview ? "flex-1 border-none w-full h-full" : position === "bottom" ? "border-t border-[var(--line)]" : "border-l border-[var(--line)]"}`}
      style={isFullscreenPreview ? undefined : { [position === "bottom" ? "height" : "width"]: size }}
    >
      {!isFullscreenPreview && (
        <div 
           className={`absolute z-10 hover:bg-[var(--accent)] transition-colors ${position === "bottom" ? "top-0 left-0 right-0 h-1 -mt-[1px] cursor-row-resize" : "left-0 top-0 bottom-0 w-1 -ml-[1px] cursor-col-resize"}`} 
           onMouseDown={onResizeStart} 
           role="separator"
        />
      )}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-3">
        <div className="flex h-full items-center gap-5 text-[11px]">
          <button className="h-full whitespace-nowrap border-b-2 border-[var(--accent)] px-3 pt-0.5 text-[var(--foreground)] font-semibold text-xs hover:text-white transition-colors">
            {activeFile.language === "markdown" ? "Markdown Preview" : "Terminal & Preview"}
          </button>
        </div>
        <div className="flex items-center gap-1 text-[var(--muted)]">
          <Button size="icon" variant="ghost" aria-label="Maximize terminal" title="Maximize terminal" className="h-6 w-6 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-all">
            <Maximize2 size={14} />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Close output" title="Close terminal" onClick={onClose} className="h-6 w-6 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-all">
            <X size={15} />
          </Button>
        </div>
      </div>
      {activeFile.language === "markdown" ? (
        <div className="flex-1 h-[calc(100%-2.25rem)] w-full bg-[var(--background)] overflow-y-auto p-6 md:p-8 markdown-body text-xs md:text-sm select-text scrollbar-thin animate-in fade-in duration-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {activeFile.content}
          </ReactMarkdown>
        </div>
      ) : result?.type === "preview" ? (
        <iframe ref={iframeRef} title="Live preview" className="h-[calc(100%-2.25rem)] w-full bg-white" sandbox="allow-scripts" />
      ) : (
        <div
          ref={scrollRef}
          className="flex h-[calc(100%-2.25rem)] flex-col overflow-auto bg-[var(--background)] px-5 py-3 font-mono text-xs leading-6 text-[var(--foreground)]/90 selection:bg-[var(--accent)]/20 scrollbar-thin scrollbar-thumb-[var(--line)] hover:scrollbar-thumb-[var(--muted)]/50 scrollbar-track-transparent transition-all"
          onClick={() => inputRef.current?.focus()}
        >
          <pre className="m-0 min-h-0 shrink whitespace-pre-wrap break-words font-mono text-xs leading-6 text-[var(--foreground)]/90">
            {result === null ? (
              <span className="flex items-center gap-2 text-[var(--muted)] animate-pulse">
                <Loader2 size={14} className="animate-spin" />
                Executing...
              </span>
            ) : (
              result.output
            )}
          </pre>
          <div className="flex min-h-6 items-center gap-1.5 font-mono text-xs leading-6 text-[var(--foreground)]/90 mt-1">
            <Terminal size={13} className="shrink-0 text-[var(--accent)]" />
            <span className="shrink-0 text-slate-500 font-bold select-none">PS </span>
            <span className="shrink-0 text-sky-400/90 select-none">E:\personal_project\ai-code-editor</span>
            {currentPath !== "~" && (
              <span className="shrink-0 text-[var(--accent)] select-none">
                \{currentPath.replace("~/", "").replaceAll("/", "\\")}
              </span>
            )}
            <span className="shrink-0 text-emerald-400 font-bold select-none">&gt;</span>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => {
                historyIndexRef.current = null;
                draftCommandRef.current = e.target.value;
                setCommand(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              className="min-w-[12ch] flex-1 border-none bg-transparent p-0 font-mono text-xs leading-6 text-[var(--foreground)] caret-[var(--accent)] outline-none placeholder:text-transparent"
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>
      )}
    </section>
  );
}

export const OutputPanel = React.memo(OutputPanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.result === nextProps.result &&
    prevProps.activeFile === nextProps.activeFile &&
    prevProps.files === nextProps.files &&
    prevProps.position === nextProps.position &&
    prevProps.size === nextProps.size &&
    prevProps.currentPath === nextProps.currentPath &&
    prevProps.viewMode === nextProps.viewMode
  );
});
