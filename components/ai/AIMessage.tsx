"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { Check, Copy, ClipboardPlus, ChevronDown, ChevronUp } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { stripCodeFence } from "@/lib/utils";

type AIMessageProps = {
  message: ChatMessage;
  onInsert: (code: string) => void;
};

function CodeBlock({ children, language }: { children: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group my-2 rounded-lg overflow-hidden border border-[var(--line)] bg-[var(--panel-2)]">
      {language && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--line)] bg-[var(--panel-3)]">
          <span className="text-[10px] text-[var(--muted)] font-mono uppercase tracking-wider">{language}</span>
          <button
            onClick={copy}
            className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors opacity-0 group-hover:opacity-100"
          >
            {copied ? <><Check size={10} className="text-emerald-400" />Copied</> : <><Copy size={10} />Copy</>}
          </button>
        </div>
      )}
      <pre className="p-3 text-[11.5px] leading-relaxed font-mono overflow-x-auto text-[var(--foreground)]/90">
        <code>{children}</code>
      </pre>
    </div>
  );
}

export function AIMessage({ message, onInsert }: AIMessageProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const assistant = message.role === "assistant";

  // User message
  if (!assistant) {
    return (
      <div className="flex w-full justify-end px-1 py-2">
        <div className="max-w-[88%] rounded-2xl rounded-br-sm bg-[var(--accent)] px-3.5 py-2 text-[12.5px] leading-relaxed text-white">
          {message.content}
        </div>
      </div>
    );
  }

  // Detect if response is mostly code (for collapsing long responses)
  const isLong = message.content.length > 1200;

  return (
    <article className="group flex w-full flex-col px-1 py-2">
      <div className={`markdown-body text-[12.5px] leading-relaxed text-[var(--foreground)] ${isLong && collapsed ? "max-h-[200px] overflow-hidden relative" : ""}`}>
        {isLong && collapsed && (
          <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[var(--panel)] to-transparent pointer-events-none" />
        )}
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            // Override code blocks for better styling
            pre: ({ children }) => <>{children}</>,
            code: ({ className, children, ...props }) => {
              const match = /language-(\w+)/.exec(className || "");
              const lang = match?.[1];
              const code = String(children).replace(/\n$/, "");
              
              // Inline code
              if (!className) {
                return (
                  <code
                    className="font-mono text-[11px] bg-[var(--panel-3)] text-[var(--foreground)] px-1 py-0.5 rounded"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              
              // Block code
              return <CodeBlock language={lang}>{code}</CodeBlock>;
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>

      {/* Action bar */}
      <div className="mt-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {isLong && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-1 h-6 px-2 rounded text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-2)] transition-colors"
          >
            {collapsed ? <><ChevronDown size={11} />Expand</> : <><ChevronUp size={11} />Collapse</>}
          </button>
        )}
        <button
          onClick={() => {
            navigator.clipboard.writeText(stripCodeFence(message.content));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex items-center gap-1 h-6 px-2 rounded text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-2)] transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <><Check size={10} className="text-emerald-400" />Copied</> : <><Copy size={10} />Copy</>}
        </button>
        <button
          onClick={() => onInsert(stripCodeFence(message.content))}
          className="flex items-center gap-1 h-6 px-2 rounded text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-2)] transition-colors"
          title="Insert into editor"
        >
          <ClipboardPlus size={10} />
          Insert
        </button>
      </div>
    </article>
  );
}
