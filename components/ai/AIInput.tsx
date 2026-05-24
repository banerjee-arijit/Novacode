"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, Loader2 } from "lucide-react";

type AIInputProps = {
  disabled?: boolean;
  onSend: (message: string) => void;
};

export function AIInput({ disabled, onSend }: AIInputProps) {
  const [value, setValue] = useState("");
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function submit(event: FormEvent | React.KeyboardEvent) {
    event.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue("");
  }

  function toggleVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setValue((prev) => prev + (prev ? " " : "") + transcript);
    };

    recognition.start();
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 130)}px`;
    }
  }, [value]);

  return (
    <form onSubmit={submit} className="shrink-0 border-t border-[var(--line)] bg-[var(--panel)] p-2">
      <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 focus-within:border-[var(--accent)]/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) submit(e);
          }}
          placeholder="Ask about your code..."
          rows={1}
          className="flex-1 max-h-[100px] resize-none bg-transparent text-[12.5px] leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/50"
          style={{ minHeight: "24px" }}
        />
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={toggleVoice}
            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
              isListening
                ? "text-red-400 bg-red-400/10"
                : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-3)]"
            }`}
          >
            {isListening ? <Loader2 size={12} className="animate-spin" /> : <Mic size={12} />}
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--muted-2)] hidden sm:inline">⏎ Send · Shift+⏎ Newline</span>
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className={`flex h-6 w-6 items-center justify-center rounded-md transition-all duration-200 ${
                value.trim() && !disabled
                  ? "bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 scale-100"
                  : "bg-[var(--panel-3)] text-[var(--muted)] scale-95 opacity-50 cursor-not-allowed"
              }`}
            >
              <ArrowUp size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
