"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, ArrowRight, Code2, Check, Loader2 } from "lucide-react";

type AIEditModalProps = {
  selectedCode: string;
  language: string;
  onClose: () => void;
  onApply: (newCode: string) => void;
  onSendEditRequest: (instruction: string, selectedCode: string) => Promise<string>;
};

export function AIEditModal({ selectedCode, language, onClose, onApply, onSendEditRequest }: AIEditModalProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    promptRef.current?.focus();
  }, []);

  async function handleGenerate() {
    if (!instruction.trim() || loading) return;
    setLoading(true);
    setGeneratedCode(null);
    try {
      const result = await onSendEditRequest(instruction.trim(), selectedCode);
      setGeneratedCode(result);
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!generatedCode) return;
    onApply(generatedCode);
    setApplied(true);
    setTimeout(onClose, 600);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleGenerate();
    }
    if (e.key === "Escape") onClose();
  }

  return (
    <div className="ai-edit-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ai-edit-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--line)]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)]/15">
              <Sparkles size={13} className="text-[var(--accent)]" />
            </div>
            <span className="text-sm font-semibold text-[var(--foreground)]">Edit with AI</span>
            <span className="text-[10px] text-[var(--muted)] bg-[var(--panel-2)] px-2 py-0.5 rounded-full border border-[var(--line)] font-mono uppercase tracking-wide">
              {language}
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-2)] transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Selected code preview */}
        <div className="px-4 pt-3 pb-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Code2 size={10} className="text-[var(--muted)]" />
            <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Selected Code</span>
          </div>
          <div className="bg-[var(--panel-2)] border border-[var(--line)] rounded-lg overflow-hidden">
            <pre className="p-3 text-[11px] font-mono text-[var(--foreground)]/80 overflow-x-auto max-h-[120px] overflow-y-auto leading-relaxed whitespace-pre scrollbar-thin">
              {selectedCode.length > 600 
                ? selectedCode.slice(0, 600) + "\n... (" + (selectedCode.length - 600) + " more chars)"
                : selectedCode}
            </pre>
          </div>
        </div>

        {/* Instruction input */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles size={10} className="text-[var(--accent)]" />
            <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Your Instruction</span>
          </div>
          <div className="relative flex items-end gap-2 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg p-2 focus-within:border-[var(--accent)]/50 transition-colors">
            <textarea
              ref={promptRef}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Add error handling, optimize for performance, convert to TypeScript..."
              rows={2}
              className="flex-1 resize-none bg-transparent text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted)]/50 outline-none leading-relaxed min-h-[42px] max-h-[120px] py-0.5"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !instruction.trim()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
                instruction.trim() && !loading
                  ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90"
                  : "bg-[var(--panel-3)] text-[var(--muted)] cursor-not-allowed"
              }`}
            >
              {loading ? (
                <><Loader2 size={12} className="animate-spin" />Generating</>
              ) : (
                <><ArrowRight size={12} />Generate</>
              )}
            </button>
          </div>
          <p className="text-[10px] text-[var(--muted-2)] mt-1">Ctrl+Enter to generate</p>
        </div>

        {/* Generated code result */}
        {(loading || generatedCode) && (
          <div className="px-4 pt-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] animate-pulse" />
              <span className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">
                {loading ? "Generating..." : "Generated Code"}
              </span>
            </div>
            <div className="bg-[var(--panel-2)] border border-[var(--line)] rounded-lg overflow-hidden">
              {loading ? (
                <div className="p-3 space-y-2">
                  <div className="h-3 loading-shimmer w-3/4" />
                  <div className="h-3 loading-shimmer w-full" />
                  <div className="h-3 loading-shimmer w-4/5" />
                  <div className="h-3 loading-shimmer w-2/3" />
                </div>
              ) : (
                <pre className="p-3 text-[11px] font-mono text-[var(--foreground)]/90 overflow-x-auto max-h-[180px] overflow-y-auto leading-relaxed whitespace-pre scrollbar-thin">
                  {generatedCode}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between px-4 py-3 mt-3 border-t border-[var(--line)]">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--panel-2)] transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {generatedCode && !loading && (
              <button
                onClick={() => {
                  setGeneratedCode(null);
                  setInstruction("");
                  promptRef.current?.focus();
                }}
                className="px-3 py-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--panel-2)] transition-colors border border-[var(--line)]"
              >
                Try again
              </button>
            )}
            <button
              onClick={handleApply}
              disabled={!generatedCode || loading || applied}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                generatedCode && !loading && !applied
                  ? "bg-emerald-600 text-white hover:bg-emerald-500"
                  : applied
                  ? "bg-emerald-600/50 text-white"
                  : "bg-[var(--panel-3)] text-[var(--muted)] cursor-not-allowed"
              }`}
            >
              {applied ? (
                <><Check size={12} />Applied!</>
              ) : (
                <><Check size={12} />Apply Changes</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
