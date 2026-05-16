"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { Check, ClipboardPlus, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/lib/types";
import { stripCodeFence } from "@/lib/utils";

type AIMessageProps = {
  message: ChatMessage;
  onInsert: (code: string) => void;
};

export function AIMessage({ message, onInsert }: AIMessageProps) {
  const [copied, setCopied] = useState(false);
  const assistant = message.role === "assistant";

  if (!assistant) {
    return (
      <div className="flex w-full justify-end px-2 py-3">
        <div className="max-w-[85%] rounded-2xl bg-[#1d4ed8] px-4 py-2.5 text-[15px] leading-relaxed text-white shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <article className="flex w-full flex-col px-2 py-3 group">
      <div className="markdown-body text-[15px] leading-7 text-[var(--foreground)]">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {message.content}
        </ReactMarkdown>
      </div>
      <div className="mt-2 flex items-center justify-end gap-1">
        <Button size="icon" variant="ghost" title="Copy to clipboard" onClick={() => {
          navigator.clipboard.writeText(stripCodeFence(message.content));
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-[var(--foreground)]">
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </Button>
        <Button size="icon" variant="ghost" title="Insert into workspace" onClick={() => onInsert(stripCodeFence(message.content))} className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--muted)] hover:text-[var(--foreground)]">
          <ClipboardPlus size={14} />
        </Button>
      </div>
    </article>
  );
}
