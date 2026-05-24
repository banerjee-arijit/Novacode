"use client";

import { useEffect, useState } from "react";
import { EditorSettings } from "@/lib/types";

const STORAGE_KEY = "forge-ai-code-editor-settings";

export const defaultSettings: EditorSettings = {
  theme: "dark",
  fontSize: 14,
  tabSize: 2,
  indentWithTabs: false,
  fontFamily: "Geist Mono",
  aiStyle: "concise",
  aiModel: "gemini-2.5-flash",
  keybindings: "default",
  autoSave: true,
  autocomplete: true,
  ghostSuggestions: true,
};

export function useSettings() {
  const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(saved) });
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.style.setProperty("--editor-font-size", `${settings.fontSize}px`);
    document.documentElement.style.setProperty("--editor-font-family", `"${settings.fontFamily}", var(--font-geist-mono), monospace`);
  }, [settings, isInitialized]);

  return { settings, setSettings };
}
