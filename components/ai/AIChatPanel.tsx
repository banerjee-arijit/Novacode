"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { Sparkles, MoreVertical, Plus, Trash2, ZapOff } from "lucide-react";
import { AIInput } from "@/components/ai/AIInput";
import { AIMessage } from "@/components/ai/AIMessage";
import { ChatMessage, EditorSettings, WorkspaceFile } from "@/lib/types";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

type AIChatPanelProps = {
  messages: ChatMessage[];
  loading: boolean;
  activeFile: WorkspaceFile;
  selectedCode: string;
  settings: EditorSettings;
  onPrompt: (message: string, mode?: string) => void;
  onInsert: (code: string) => void;
  onClearChat: () => void;
};

export function AIChatPanel({ messages, loading, onPrompt, onInsert, onClearChat }: AIChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-[var(--line)] bg-[var(--panel)]">
      <div className="flex h-14 items-center justify-between border-b border-[var(--line)] px-4 bg-[var(--panel)]">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-md border border-[var(--line)] bg-[var(--panel-2)]">
            <Image src="/icons/novacode-mark.svg" alt="Novacode AI" width={22} height={22} className="relative z-10" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-sm font-bold text-[var(--foreground)] tracking-tight">Novacode AI</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--muted)] hover:bg-[var(--line)] hover:text-[var(--foreground)] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[var(--panel-2)] border-[var(--line)] shadow-xl rounded-xl p-1">
              <div className="flex items-center justify-between px-2 py-2.5 mb-1 bg-[var(--panel)] rounded-lg border border-[var(--line)] m-1">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--foreground)]">Credits</span>
                  <span className="text-[10px] text-[var(--muted)] mt-0.5">Renews in 14 days</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                  <Sparkles size={12} className="text-indigo-400" />
                  2,500
                </div>
              </div>
              <DropdownMenuSeparator className="bg-[var(--line)] mx-1" />
              <DropdownMenuItem onClick={onClearChat} className="cursor-pointer gap-2 rounded-md text-[var(--foreground)] focus:bg-[var(--line)] focus:text-[var(--foreground)]">
                <Plus size={15} />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onClearChat} className="cursor-pointer gap-2 rounded-md text-rose-400 focus:bg-[var(--line)] focus:text-rose-400">
                <Trash2 size={15} />
                Delete current chat
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[var(--line)] mx-1" />
              <DropdownMenuItem disabled className="gap-2 rounded-md text-[var(--muted)]">
                <ZapOff size={15} />
                Use other models
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto p-3">
        {messages.length === 0 && !loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h2 className="text-lg text-[var(--foreground)] tracking-tight">How can I help?</h2>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >
              <AIMessage message={message} onInsert={onInsert} />
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="flex w-full flex-col px-2 py-3">
            <div className="flex-1 min-w-0 space-y-3 mt-1">
              <div className="h-3 w-24 animate-pulse rounded bg-[var(--accent)]/30" />
              <div className="h-3 w-full animate-pulse rounded bg-[var(--muted)]/20" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--muted)]/20" />
            </div>
          </div>
        )}
            <div ref={bottomRef} className="h-2" />
          </div>
        )}
      </div>

      <AIInput disabled={loading} onSend={(message) => onPrompt(message)} />
    </aside>
  );
}
