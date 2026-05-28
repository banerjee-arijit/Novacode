"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Loader2, Maximize2, X, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceFile } from "@/lib/types";
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
  currentPath: string;
  viewMode?: "code" | "design" | "preview";
  previewUrl: string;
  isRunning?: boolean;
};

function OutputPanelComponent({ 
  visible, 
  result, 
  activeFile, 
  files, 
  position, 
  size, 
  onTogglePosition, 
  onResizeStart, 
  onClose, 
  viewMode,
  previewUrl,
  isRunning = false
}: OutputPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const preview = useMemo(() => buildPreview(activeFile, files), [activeFile, files]);

  // Synchronize static html/css preview srcdoc
  useEffect(() => {
    if (!visible || previewUrl || activeFile.language === "markdown" || !iframeRef.current) return;
    if (result?.type === "preview" || viewMode === "preview") {
      iframeRef.current.srcdoc = result?.html ?? preview;
    }
  }, [preview, result?.html, result?.type, visible, activeFile.language, previewUrl, viewMode]);

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
      
      {/* Console Header Bar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-3 select-none">
        <div className="flex h-full items-center gap-2 text-[11px]">
          {activeFile.language === "markdown" ? (
            <span className="text-[var(--muted)] font-semibold uppercase text-[10px] tracking-wider px-3">
              Markdown Preview
            </span>
          ) : result?.type === "preview" || viewMode === "preview" ? (
            <span className="text-[var(--muted)] font-semibold uppercase text-[10px] tracking-wider px-3">
              Web Preview
            </span>
          ) : (
            <div className="flex items-center gap-1.5 px-3 text-[var(--muted)] font-semibold uppercase text-[10px] tracking-wider">
              <Terminal size={12} className="text-[var(--accent)] mr-1" />
              <span>Console Output</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-[var(--muted)]">
          <Button size="icon" variant="ghost" aria-label="Toggle position" title="Toggle position" onClick={onTogglePosition} className="h-6 w-6 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-all">
            <Maximize2 size={13} />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Close output" title="Close console" onClick={onClose} className="h-6 w-6 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/50 transition-all">
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Main panel content */}
      {activeFile.language === "markdown" ? (
        <div className="flex-1 h-[calc(100%-2.25rem)] w-full bg-[var(--background)] overflow-y-auto p-6 md:p-8 markdown-body text-xs md:text-sm select-text scrollbar-thin animate-in fade-in duration-200">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
            {activeFile.content}
          </ReactMarkdown>
        </div>
      ) : result?.type === "preview" || viewMode === "preview" ? (
        previewUrl ? (
          <iframe 
            src={previewUrl} 
            title="Live preview" 
            className="h-[calc(100%-2.25rem)] w-full bg-white border-none" 
            sandbox="allow-scripts allow-same-origin allow-popups" 
          />
        ) : (
          <iframe 
            ref={iframeRef} 
            title="Live preview" 
            className="h-[calc(100%-2.25rem)] w-full bg-white border-none" 
            sandbox="allow-scripts allow-same-origin"
          />
        )
      ) : (
        <div className="flex-grow h-[calc(100%-2.25rem)] w-full bg-[#05070a] p-4 font-mono text-xs overflow-y-auto select-text scrollbar-thin relative">
          {isRunning ? (
            <div className="flex h-full w-full flex-col items-center justify-center text-xs text-[var(--muted)] animate-pulse">
              <Loader2 size={16} className="animate-spin mr-2 mb-1" />
              <span>Running code...</span>
            </div>
          ) : result ? (
            <pre className="whitespace-pre-wrap break-all text-[#e6edf7] leading-relaxed font-mono">
              {result.output}
            </pre>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-[var(--muted)] text-center px-4">
              <Terminal size={24} className="opacity-25 mb-2 text-[var(--muted)]" />
              <span>No output. Click "Run" at the top to execute this code.</span>
            </div>
          )}
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
    prevProps.viewMode === nextProps.viewMode &&
    prevProps.previewUrl === nextProps.previewUrl &&
    prevProps.isRunning === nextProps.isRunning
  );
});
