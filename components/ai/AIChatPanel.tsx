"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Sparkles, MoreVertical, Plus, Trash2, MessageSquare, Lightbulb, Bug, Code2 } from "lucide-react";
import { AIInput } from "@/components/ai/AIInput";
import { AIMessage } from "@/components/ai/AIMessage";
import { ChatMessage, EditorSettings, WorkspaceFile } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type AIChatPanelProps = {
  messages: ChatMessage[];
  loading: boolean;
  activeFile?: WorkspaceFile;
  selectedCode: string;
  settings: EditorSettings;
  onPrompt: (message: string, mode?: string) => void;
  onInsert: (code: string) => void;
  onClearChat: () => void;
};

const QUICK_ACTIONS = [
  { icon: Bug, label: "Fix bugs", prompt: "Find and fix any bugs in the current code", color: "text-red-400" },
  { icon: Lightbulb, label: "Explain", prompt: "Explain what this code does", color: "text-yellow-400" },
  { icon: Code2, label: "Refactor", prompt: "Refactor this code to be cleaner and more maintainable", color: "text-blue-400" },
  { icon: Sparkles, label: "Optimize", prompt: "Optimize this code for better performance", color: "text-violet-400" },
];

function AIChatPanelComponent({ messages, loading, activeFile, selectedCode, onPrompt, onInsert, onClearChat }: AIChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <aside className="flex h-full min-h-0 flex-col bg-[var(--panel)]">
      {/* Header */}
      <div className="flex h-11 items-center justify-between border-b border-[var(--line)] px-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)]/15">
            <Image src="/icons/novacode-mark.svg" alt="Novacode AI" width={14} height={14} className="relative z-10" />
          </div>
          <span className="text-[13px] font-semibold text-[var(--foreground)] tracking-tight">Novacode AI</span>
          <span className="text-[9px] text-[var(--muted)] bg-[var(--panel-2)] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider border border-[var(--line)]">
            Gemini
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--panel-2)] hover:text-[var(--foreground)] transition-colors outline-none">
              <MoreVertical size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 bg-[var(--panel-2)] border-[var(--line)] rounded-lg p-1 text-xs">
            <DropdownMenuItem
              onClick={onClearChat}
              className="cursor-pointer gap-2 rounded-md py-1.5 px-2 text-[var(--foreground)] focus:bg-[var(--panel-3)] text-xs"
            >
              <Plus size={13} />
              New Chat
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[var(--line)] my-0.5" />
            <DropdownMenuItem
              onClick={onClearChat}
              className="cursor-pointer gap-2 rounded-md py-1.5 px-2 text-rose-400 focus:bg-rose-400/10 focus:text-rose-400 text-xs"
            >
              <Trash2 size={13} />
              Clear chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages area */}
      <div className="relative min-h-0 flex-1 overflow-auto">
        {messages.length === 0 && !loading ? (
          <div className="flex flex-col h-full p-3 gap-3">
            {/* Empty state with quick actions */}
            <div className="flex flex-col items-center text-center pt-6 pb-4 gap-2">
              <div className="h-10 w-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-1">
                <Sparkles size={18} className="text-[var(--accent)]" />
              </div>
              <p className="text-[13px] font-medium text-[var(--foreground)]">
                {activeFile ? `Working on ${activeFile.name}` : "How can I help?"}
              </p>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed max-w-[200px]">
                Ask me anything about your code, or use a quick action below.
              </p>
            </div>

            {/* Quick action chips */}
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onPrompt(action.prompt)}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] text-[11px] text-[var(--foreground)] hover:border-[var(--accent)]/40 hover:bg-[var(--panel-3)] transition-all text-left cursor-pointer"
                >
                  <action.icon size={12} className={action.color} />
                  <span>{action.label}</span>
                </button>
              ))}
            </div>

            {/* Context indicator */}
            {selectedCode && (
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--accent)]/8 border border-[var(--accent)]/20 text-[11px] text-[var(--muted)]">
                <Code2 size={11} className="text-[var(--accent)] shrink-0" />
                <span>
                  <span className="text-[var(--accent)]">{selectedCode.split("\n").length} lines</span> selected — ask me about it!
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-0 p-2">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                >
                  <AIMessage message={message} onInsert={onInsert} />
                </motion.div>
              ))}
            </AnimatePresence>

            {loading && (
              <div className="flex flex-col px-2 py-3 gap-2">
                <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                  <div className="h-4 w-4 rounded-full bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
                    <Sparkles size={9} className="text-[var(--accent)]" />
                  </div>
                  <span>Thinking</span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1 w-1 rounded-full bg-[var(--accent)]/60 inline-block animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
                <div className="space-y-2 pl-6">
                  <div className="h-2.5 loading-shimmer w-3/4" />
                  <div className="h-2.5 loading-shimmer w-full" />
                  <div className="h-2.5 loading-shimmer w-4/5" />
                </div>
              </div>
            )}

            <div ref={bottomRef} className="h-1" />
          </div>
        )}
      </div>

      <AIInput disabled={loading} onSend={(message) => onPrompt(message)} />
    </aside>
  );
}

export const AIChatPanel = React.memo(AIChatPanelComponent, (prevProps, nextProps) => {
  return (
    prevProps.messages === nextProps.messages &&
    prevProps.loading === nextProps.loading &&
    prevProps.selectedCode === nextProps.selectedCode &&
    prevProps.activeFile === nextProps.activeFile
  );
});
