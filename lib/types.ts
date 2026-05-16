export type Language = "javascript" | "typescript" | "python" | "html" | "css" | "java" | "plaintext";

export type ThemeMode = "dark" | "light" | "blueish" | "graphite" | "high-contrast";
export type AIResponseStyle = "concise" | "detailed";
export type AIModel = "gemini-2.5-flash" | "gemini-2.5-flash-lite" | "gemini-2.0-flash" | "gemini-2.0-flash-lite";
export type KeybindingMode = "default" | "vim" | "emacs";

export type WorkspaceFile = {
  id: string;
  parentId: string | null;
  name: string;
  language: Language;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceFolder = {
  id: string;
  parentId: string | null;
  name: string;
  createdAt: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type EditorSettings = {
  theme: ThemeMode;
  fontSize: number;
  tabSize: 2 | 4;
  indentWithTabs: boolean;
  fontFamily: "JetBrains Mono" | "Fira Code" | "Geist Mono";
  aiStyle: AIResponseStyle;
  aiModel: AIModel;
  keybindings: KeybindingMode;
  autoSave: boolean;
  autocomplete: boolean;
  ghostSuggestions: boolean;
};

export const languageLabels: Record<Language, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  html: "HTML",
  css: "CSS",
  java: "Java",
  plaintext: "Plain Text",
};

export const languageExtensions: Record<Language, string> = {
  javascript: "js",
  typescript: "ts",
  python: "py",
  html: "html",
  css: "css",
  java: "java",
  plaintext: "txt",
};
