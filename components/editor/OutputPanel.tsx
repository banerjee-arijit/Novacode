"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Maximize2, Terminal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Language, WorkspaceFile } from "@/lib/types";
import { RunResult, buildPreview } from "@/lib/runCode";
import { Terminal as WebContainerTerminal } from "./Terminal";
import { WebContainer } from "@webcontainer/api";

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
  webContainerInstance: WebContainer | null;
  previewUrl: string;
  onCommandReady?: (cb: (cmd: string) => void) => void;
  onWriteTextReady?: (cb: (text: string) => void) => void;
};

function OutputPanelComponent({ 
  visible, 
  result, 
  activeFile, 
  files, 
  position, 
  size, 
  currentPath, 
  onTogglePosition, 
  onResizeStart, 
  onClose, 
  onCommand, 
  viewMode,
  webContainerInstance,
  previewUrl,
  onCommandReady,
  onWriteTextReady
}: OutputPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Terminal tabs states
  const [terminalTabs, setTerminalTabs] = useState<Array<{ id: string, name: string }>>([
    { id: "1", name: "bash" }
  ]);
  const [activeTerminalTabId, setActiveTerminalTabId] = useState("1");

  const preview = useMemo(() => buildPreview(activeFile, files), [activeFile, files]);

  // Synchronize static html/css preview srcdoc
  useEffect(() => {
    if (!visible || previewUrl || activeFile.language === "markdown" || !iframeRef.current) return;
    if (result?.type === "preview" || viewMode === "preview") {
      iframeRef.current.srcdoc = result?.html ?? preview;
    }
  }, [preview, result?.html, result?.type, visible, activeFile.language, previewUrl, viewMode]);

  const handleAddTab = () => {
    const newId = String(Date.now());
    const nextTabs = [...terminalTabs, { id: newId, name: `bash (${terminalTabs.length + 1})` }];
    setTerminalTabs(nextTabs);
    setActiveTerminalTabId(newId);
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (terminalTabs.length === 1) return; // Keep at least one
    const nextTabs = terminalTabs.filter(t => t.id !== tabId);
    setTerminalTabs(nextTabs);
    if (activeTerminalTabId === tabId) {
      setActiveTerminalTabId(nextTabs[nextTabs.length - 1].id);
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
      
      {/* Terminal / Preview Header Bar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-3">
        <div className="flex h-full items-center gap-2 text-[11px]">
          {activeFile.language === "markdown" ? (
            <span className="text-[var(--muted)] font-semibold uppercase text-[10px] tracking-wider px-3 select-none">
              Markdown Preview
            </span>
          ) : (
            <div className="flex items-center gap-1.5 pl-1">
              <span className="text-[var(--muted)] font-semibold uppercase text-[9px] tracking-wider pr-2 border-r border-[var(--line)] select-none">
                Terminals
              </span>
              {terminalTabs.map(tab => {
                const isActive = tab.id === activeTerminalTabId;
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTerminalTabId(tab.id)}
                    className={`flex items-center gap-1.5 h-6 px-2 rounded cursor-pointer text-xs select-none transition-all ${
                      isActive 
                        ? "bg-[var(--line)] text-[var(--foreground)] border border-[var(--line)]" 
                        : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/30"
                    }`}
                  >
                    <Terminal size={11} className="text-[var(--accent)]" />
                    <span>{tab.name}</span>
                    {terminalTabs.length > 1 && (
                      <span
                        onClick={(e) => handleCloseTab(tab.id, e)}
                        className="p-0.5 rounded-sm hover:bg-[var(--line)] hover:text-rose-400"
                      >
                        <X size={10} />
                      </span>
                    )}
                  </div>
                );
              })}
              <button
                onClick={handleAddTab}
                title="New Terminal"
                className="flex items-center justify-center h-6 w-6 rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45 transition-colors cursor-pointer"
              >
                <span className="text-sm font-semibold">+</span>
              </button>
            </div>
          )}
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
        <div className="flex-1 h-[calc(100%-2.25rem)] w-full bg-[#05070a] p-1.5 relative">
          {webContainerInstance ? (
            terminalTabs.map(tab => {
              const isActive = tab.id === activeTerminalTabId;
              return (
                <div 
                  key={tab.id} 
                  className="w-full h-full"
                  style={{ display: isActive ? "block" : "none" }}
                >
                  <WebContainerTerminal 
                    instance={webContainerInstance} 
                    visible={visible && isActive}
                    size={size}
                    // Bind Run button hooks to the first tab (Bash)
                    onCommandReady={tab.id === "1" ? onCommandReady : undefined}
                    onWriteTextReady={tab.id === "1" ? onWriteTextReady : undefined}
                  />
                </div>
              );
            })
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-xs text-[var(--muted)] animate-pulse">
              <Loader2 size={16} className="animate-spin mr-2 mb-1" />
              <span>Booting StackBlitz WebContainer node runtime...</span>
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
    prevProps.webContainerInstance === nextProps.webContainerInstance &&
    prevProps.previewUrl === nextProps.previewUrl
  );
});
