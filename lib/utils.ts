import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Language, languageExtensions } from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function detectLanguage(name: string): Language {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "ts" || ext === "tsx") return "typescript";
  if (ext === "py") return "python";
  if (ext === "html" || ext === "htm") return "html";
  if (ext === "css") return "css";
  if (ext === "js" || ext === "jsx" || ext === "mjs" || ext === "cjs") return "javascript";
  if (ext === "java") return "java";
  if (ext === "cpp" || ext === "cc" || ext === "cxx" || ext === "h" || ext === "hpp") return "cpp";
  if (ext === "md" || ext === "markdown") return "markdown";
  return "plaintext";
}

export function filenameForLanguage(language: Language, index: number) {
  return `untitled-${index}.${languageExtensions[language]}`;
}

export function byteSize(value: string) {
  const bytes = new TextEncoder().encode(value).length;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function stripCodeFence(markdown: string) {
  const match = markdown.match(/```(?:\w+)?\n([\s\S]*?)```/);
  return match?.[1]?.trimEnd() ?? markdown;
}
