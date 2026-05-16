"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, Plus, FileUp, ImageIcon, Loader2, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [value]);

  return (
    <form onSubmit={submit} className="shrink-0 bg-[var(--panel)] p-4 pb-6">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-[26px] opacity-0 group-focus-within:opacity-20 blur-md transition-opacity duration-500"></div>
        
        <div className="relative flex flex-col gap-1 rounded-[24px] border border-[var(--line)] bg-[var(--panel-2)] p-1.5 focus-within:border-blue-500/40 focus-within:bg-[var(--background)] transition-all duration-300">
          <div className="flex items-end gap-2 px-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  type="button" 
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--line)]/50 text-[var(--muted)] transition-all hover:bg-[var(--line)] hover:text-[var(--foreground)] mb-[2px]"
                >
                  <Plus size={18} className="transition-transform group-focus-within:rotate-90 duration-500" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-[var(--panel-2)] border-[var(--line)] shadow-xl rounded-xl p-1 mb-2">
                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-[var(--foreground)] focus:bg-[var(--line)]">
                  <FileUp size={16} className="text-blue-400" />
                  <span>Upload File</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer rounded-lg text-[var(--foreground)] focus:bg-[var(--line)]">
                  <ImageIcon size={16} className="text-purple-400" />
                  <span>Upload Image</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <textarea
              ref={textareaRef}
              value={value}
              disabled={disabled}
              onChange={(event) => setValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) submit(event);
              }}
              placeholder="Message Novacode..."
              rows={1}
              className="flex-1 max-h-[120px] resize-none self-center bg-transparent py-1.5 text-[14px] leading-snug text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]/50"
              style={{ height: "36px" }}
            />
            
            <div className="flex items-center gap-2 mb-[2px]">
              <button 
                type="button" 
                onClick={toggleVoice}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all hover:bg-[var(--line)] ${isListening ? "text-red-500 animate-pulse bg-red-500/10" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
              >
                {isListening ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
              </button>
              
              <button 
                type="submit" 
                disabled={disabled || !value.trim()} 
                aria-label="Send message"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
                  value.trim() 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-100 hover:bg-blue-500" 
                    : "bg-[var(--line)] text-[var(--muted)] scale-95 opacity-50"
                }`}
              >
                <ArrowUp size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>
          
          {isListening && (
            <div className="flex items-center gap-2 px-3 pb-0.5 text-[9px] font-medium text-blue-500/80 animate-in fade-in slide-in-from-bottom-1">
              <Sparkles size={10} className="animate-spin-slow" />
              Listening...
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
