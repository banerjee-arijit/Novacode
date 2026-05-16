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

const themeVars = {
  dark: {
    "--background": "#05070a",
    "--foreground": "#e6edf7",
    "--panel": "#0a0f17",
    "--panel-2": "#0e1520",
    "--line": "#1b2735",
    "--muted": "#8b9bb2",
    "--accent": "#37d5ff",
    "--primary": "#f8fafc",
    "--primary-foreground": "#020617",
  },
  light: {
    "--background": "#f4f7fb",
    "--foreground": "#101827",
    "--panel": "#ffffff",
    "--panel-2": "#eef3f9",
    "--line": "#cbd5e1",
    "--muted": "#64748b",
    "--accent": "#0284c7",
    "--primary": "#111827",
    "--primary-foreground": "#ffffff",
  },
  blueish: {
    "--background": "#07111f",
    "--foreground": "#e6f3ff",
    "--panel": "#0b1626",
    "--panel-2": "#10223a",
    "--line": "#1d3a5f",
    "--muted": "#93aeca",
    "--accent": "#60a5fa",
    "--primary": "#3b82f6",
    "--primary-foreground": "#ffffff",
  },
  graphite: {
    "--background": "#101010",
    "--foreground": "#f4f4f5",
    "--panel": "#171717",
    "--panel-2": "#222222",
    "--line": "#333333",
    "--muted": "#a1a1aa",
    "--accent": "#a3e635",
    "--primary": "#f4f4f5",
    "--primary-foreground": "#18181b",
  },
  "high-contrast": {
    "--background": "#000000",
    "--foreground": "#ffffff",
    "--panel": "#050505",
    "--panel-2": "#101010",
    "--line": "#ffffff",
    "--muted": "#d4d4d4",
    "--accent": "#00ffff",
    "--primary": "#ffffff",
    "--primary-foreground": "#000000",
  },
} as const;

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
    Object.entries(themeVars[settings.theme]).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
  }, [settings, isInitialized]);

  return { settings, setSettings };
}
