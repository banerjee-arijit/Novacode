"use client";

import React, { useState } from "react";
import { Settings, Sparkles, Keyboard, Sliders, Type, Check, ChevronRight, ChevronDown, SlidersHorizontal } from "lucide-react";
import { EditorSettings, ThemeMode, AIModel, AIResponseStyle, KeybindingMode } from "@/lib/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SettingsTabProps = {
  settings: EditorSettings;
  setSettings: React.Dispatch<React.SetStateAction<EditorSettings>>;
};

interface SettingDef {
  id: string;
  key?: keyof EditorSettings;
  category: string;
  subcategory: string;
  label: string;
  description: string;
  type: "select" | "number" | "checkbox" | "mock_select" | "mock_checkbox";
  section: "user" | "workspace" | "antigravity";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  isExperimental?: boolean;
  defaultValue?: any;
}

export function SettingsTab({ settings, setSettings }: SettingsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"user" | "workspace" | "antigravity">("user");
  const [activeCategory, setActiveCategory] = useState<string>("common");
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);

  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    editor: true,
    workbench: true,
    ai: true,
  });

  const [mockValues, setMockValues] = useState<Record<string, any>>({
    devServerAuto: false,
    askChatLocation: "chatView",
  });

  const updateSetting = <K extends keyof EditorSettings>(key: K, value: EditorSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const updateMockSetting = (id: string, value: any) => {
    setMockValues((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const categories = [
    { id: "common", label: "Commonly Used" },
    { id: "editor", label: "Text Editor", subcategories: ["Font", "Formatting", "Suggestions"] },
    { id: "workbench", label: "Workbench", subcategories: ["Appearance", "Files"] },
    { id: "ai", label: "AI Assistant", subcategories: ["Gemini Model", "Response Style"] },
    { id: "shortcuts", label: "Keyboard Shortcuts" }
  ] as const;

  const themes: Array<{ value: ThemeMode; label: string }> = [
    { value: "dark", label: "Dark+" },
    { value: "light", label: "Light+" },
    { value: "blueish", label: "Night Owl" },
    { value: "graphite", label: "Dim (Monokai)" },
    { value: "high-contrast", label: "High Contrast" },
  ];

  const aiModels: Array<{ value: AIModel; label: string }> = [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
    { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  ];

  const responseStyles: Array<{ value: AIResponseStyle; label: string }> = [
    { value: "concise", label: "Concise (Direct answers & code)" },
    { value: "detailed", label: "Detailed (Full explanations)" },
  ];

  const keybindingModes: Array<{ value: KeybindingMode; label: string }> = [
    { value: "default", label: "VSCode Default" },
    { value: "vim", label: "Vim Keybindings" },
    { value: "emacs", label: "Emacs Keybindings" },
  ];

  const settingsDefs: SettingDef[] = [
    // --- USER SETTINGS ---
    {
      id: "theme",
      key: "theme",
      category: "Workbench",
      subcategory: "Appearance",
      label: "Color Theme",
      description: "Choose a visual theme for the editor and application UI.",
      type: "select",
      section: "user",
      options: themes,
    },
    {
      id: "fontSize",
      key: "fontSize",
      category: "Text Editor",
      subcategory: "Font",
      label: "Font Size",
      description: "Controls the font size in pixels for the code editor.",
      type: "number",
      section: "user",
      min: 10,
      max: 30,
    },
    {
      id: "fontFamily",
      key: "fontFamily",
      category: "Text Editor",
      subcategory: "Font",
      label: "Font Family",
      description: "Configure the monospace font family used by the code editor.",
      type: "select",
      section: "user",
      options: [
        { value: "Geist Mono", label: "Geist Mono" },
        { value: "JetBrains Mono", label: "JetBrains Mono" },
        { value: "Fira Code", label: "Fira Code" }
      ],
    },
    {
      id: "tabSize",
      key: "tabSize",
      category: "Text Editor",
      subcategory: "Formatting",
      label: "Tab Size",
      description: "The number of spaces a tab is equal to.",
      type: "select",
      section: "user",
      options: [
        { value: "2", label: "2" },
        { value: "4", label: "4" }
      ],
    },
    {
      id: "indentWithTabs",
      key: "indentWithTabs",
      category: "Text Editor",
      subcategory: "Formatting",
      label: "Indent With Tabs",
      description: "Insert tab characters instead of spaces when pressing tab.",
      type: "checkbox",
      section: "user",
    },
    {
      id: "keybindings",
      key: "keybindings",
      category: "Text Editor",
      subcategory: "Keybindings",
      label: "Keyboard Mode",
      description: "Modify the default editor shortcuts to use Vim or Emacs keybindings.",
      type: "select",
      section: "user",
      options: keybindingModes,
    },
    {
      id: "autocomplete",
      key: "autocomplete",
      category: "Text Editor",
      subcategory: "Suggestions",
      label: "Autocomplete Suggestions",
      description: "Enable autocomplete suggestions as you type code.",
      type: "checkbox",
      section: "user",
    },
    {
      id: "ghostSuggestions",
      key: "ghostSuggestions",
      category: "Text Editor",
      subcategory: "Suggestions",
      label: "Ghost Suggestions",
      description: "Show faint ghost text suggestions inside the editor.",
      type: "checkbox",
      section: "user",
    },
    {
      id: "autoSave",
      key: "autoSave",
      category: "Workbench",
      subcategory: "Files",
      label: "Auto Save Files",
      description: "Automatically persist files to memory and local storage on save or changes.",
      type: "checkbox",
      section: "user",
    },

    // --- WORKSPACE SETTINGS ---
    {
      id: "devServerAuto",
      category: "Workbench",
      subcategory: "Dev Server",
      label: "Auto Start",
      description: "Controls whether the development server starts automatically on project load.",
      type: "mock_checkbox",
      section: "workspace",
      defaultValue: false,
    },

    // --- ANTIGRAVITY SETTINGS ---
    {
      id: "aiModel",
      key: "aiModel",
      category: "AI Assistant",
      subcategory: "Gemini Model",
      label: "AI Model",
      description: "Select the underlying Google Gemini model for chat assistance.",
      type: "select",
      section: "antigravity",
      options: aiModels,
    },
    {
      id: "aiStyle",
      key: "aiStyle",
      category: "AI Assistant",
      subcategory: "Response Style",
      label: "AI Response Style",
      description: "Customize whether responses should be highly concise or explain topics fully.",
      type: "select",
      section: "antigravity",
      options: responseStyles,
    },
    {
      id: "askChatLocation",
      category: "AI Assistant",
      subcategory: "Experimental",
      label: "Ask Chat Location",
      description: "Controls where the command palette should ask chat questions.",
      type: "mock_select",
      section: "antigravity",
      options: [
        { value: "chatView", label: "chatView" },
        { value: "editorInline", label: "editorInline" }
      ],
      defaultValue: "chatView",
      isExperimental: true,
    }
  ];

  // Filtering settings
  const filteredDefs = settingsDefs.filter((def) => {
    // Tab filter
    if (def.section !== activeTab) return false;

    // Search filter
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        def.category.toLowerCase().includes(q) ||
        def.subcategory.toLowerCase().includes(q) ||
        def.label.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q)
      );
    }

    // Sidebar Category Filter
    if (activeCategory === "common") {
      return ["theme", "fontSize", "keybindings", "aiModel"].includes(def.id);
    }
    if (activeCategory === "shortcuts") {
      return false; // Rendered as table below
    }

    const cat = categories.find((c) => c.id === activeCategory);
    if (!cat) return false;

    // Matches category name
    const matchesCategory = def.category.toLowerCase() === cat.label.toLowerCase();
    if (!matchesCategory) return false;

    // Matches subcategory if selected
    if (activeSubcategory) {
      return def.subcategory.toLowerCase() === activeSubcategory.toLowerCase();
    }

    return true;
  });

  const getActiveTitle = () => {
    if (searchQuery.trim() !== "") return "Search Results";
    if (activeCategory === "common") return "Commonly Used";
    if (activeCategory === "shortcuts") return "Keyboard Shortcuts";

    const cat = categories.find((c) => c.id === activeCategory);
    if (!cat) return "Settings";

    if (activeSubcategory) {
      return `${cat.label}: ${activeSubcategory}`;
    }
    return cat.label;
  };

  return (
    <div className="flex flex-col h-full w-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden select-none animate-fade-in-soft">
      {/* 1. Top Search Header */}
      <div className="px-6 pt-4 pb-3 border-b border-[var(--line)]/20 flex flex-col gap-3 bg-[var(--panel)]/15 shrink-0">
        {/* Search Input Box */}
        <div className="relative w-full max-w-3xl flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings"
            className="w-full h-8 pl-3 pr-24 text-xs bg-[var(--panel-2)]/90 border border-[var(--line)]/50 focus:border-[var(--accent)] outline-none rounded text-[var(--foreground)] placeholder-[var(--muted)]"
          />
          {/* Right side icons within input */}
          <div className="absolute right-2 flex items-center gap-1.5 text-[var(--muted)]">
            <button className="p-1 hover:bg-[var(--line)]/30 rounded cursor-pointer transition-colors" title="AI Filters">
              <Sparkles size={11} className="text-[var(--accent)]" />
            </button>
            <button className="p-1 hover:bg-[var(--line)]/30 rounded cursor-pointer transition-colors" title="Show Modified Settings">
              <Check size={11} />
            </button>
            <button className="p-1 hover:bg-[var(--line)]/30 rounded cursor-pointer transition-colors" title="More Filters">
              <SlidersHorizontal size={11} />
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex items-center gap-6 text-xs text-[var(--muted)] pl-1">
          {[
            { id: "user", label: "User" },
            { id: "workspace", label: "Workspace" },
            { id: "antigravity", label: "Antigravity IDE Settings" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSearchQuery("");
                setActiveCategory("common");
                setActiveSubcategory(null);
              }}
              className={`pb-1 px-0.5 border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-[var(--accent)] text-[var(--foreground)] font-semibold"
                  : "border-transparent hover:text-[var(--foreground)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left Tree Sidebar */}
        <aside className="w-56 border-r border-[var(--line)]/20 bg-transparent flex flex-col shrink-0 overflow-y-auto py-3">
          <nav className="px-3 flex flex-col gap-0.5">
            {/* Commonly Used */}
            <button
              onClick={() => {
                setActiveCategory("common");
                setActiveSubcategory(null);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left cursor-pointer transition-all ${
                activeCategory === "common" && !activeSubcategory
                  ? "bg-[var(--line)]/30 text-[var(--foreground)] font-semibold"
                  : "text-[var(--muted)] hover:bg-[var(--line)]/15 hover:text-[var(--foreground)]"
              }`}
            >
              Commonly Used
            </button>

            {/* Tree Categories */}
            {categories
              .filter((c) => c.id !== "common" && c.id !== "shortcuts")
              .map((cat) => {
                const isExpanded = !!expanded[cat.id];
                const hasSub = "subcategories" in cat;
                const isSelected = activeCategory === cat.id && !activeSubcategory;

                return (
                  <div key={cat.id} className="flex flex-col">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-left cursor-pointer transition-all ${
                        isSelected
                          ? "bg-[var(--line)]/30 text-[var(--foreground)] font-semibold"
                          : "text-[var(--muted)] hover:bg-[var(--line)]/15 hover:text-[var(--foreground)]"
                      }`}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setActiveSubcategory(null);
                      }}
                    >
                      {hasSub && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpanded((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }));
                          }}
                          className="p-0.5 hover:bg-[var(--line)]/25 rounded cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                        </button>
                      )}
                      <span>{cat.label}</span>
                    </div>

                    {/* Subcategories (if expanded) */}
                    {hasSub && isExpanded && (
                      <div className="flex flex-col ml-4 pl-2 border-l border-[var(--line)]/15 gap-0.5 mt-0.5 mb-1">
                        {cat.subcategories.map((sub) => {
                          const isSubSelected = activeCategory === cat.id && activeSubcategory === sub;
                          return (
                            <button
                              key={sub}
                              onClick={() => {
                                setActiveCategory(cat.id);
                                setActiveSubcategory(sub);
                              }}
                              className={`px-2.5 py-1 rounded text-[11px] text-left cursor-pointer transition-all ${
                                isSubSelected
                                  ? "bg-[var(--line)]/20 text-[var(--accent)] font-semibold"
                                  : "text-[var(--muted)] hover:bg-[var(--line)]/10 hover:text-[var(--foreground)]"
                              }`}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Keyboard Shortcuts */}
            <button
              onClick={() => {
                setActiveCategory("shortcuts");
                setActiveSubcategory(null);
              }}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-left cursor-pointer transition-all mt-1 ${
                activeCategory === "shortcuts" && !activeSubcategory
                  ? "bg-[var(--line)]/30 text-[var(--foreground)] font-semibold"
                  : "text-[var(--muted)] hover:bg-[var(--line)]/15 hover:text-[var(--foreground)]"
              }`}
            >
              Keyboard Shortcuts
            </button>
          </nav>
        </aside>

        {/* Right Settings Content Area */}
        <main 
          key={`${activeCategory}-${activeSubcategory}-${searchQuery}`}
          className="flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl bg-transparent animate-fade-in-soft"
        >
          {/* Section Header Title */}
          <div className="mb-6 pb-2 border-b border-[var(--line)]/20">
            <h1 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">{getActiveTitle()}</h1>
          </div>

          {/* Keybindings Table Render */}
          {activeCategory === "shortcuts" && searchQuery.trim() === "" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--line)]/25 text-[var(--muted)] font-medium">
                    <th className="pb-3 font-semibold text-[11px] uppercase tracking-wider">Action</th>
                    <th className="pb-3 font-semibold text-[11px] uppercase tracking-wider text-right">Shortcut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]/15 text-[var(--foreground)]">
                  <tr className="hover:bg-[var(--line)]/10 transition-colors">
                    <td className="py-3 text-xs">Toggle Sidebar Panel</td>
                    <td className="py-3 text-right">
                      <kbd className="bg-[var(--line)]/40 border border-[var(--line)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">Ctrl + B</kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--line)]/10 transition-colors">
                    <td className="py-3 text-xs">Global File Search</td>
                    <td className="py-3 text-right">
                      <kbd className="bg-[var(--line)]/40 border border-[var(--line)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">Ctrl + Shift + F</kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--line)]/10 transition-colors">
                    <td className="py-3 text-xs">Open Editor Settings</td>
                    <td className="py-3 text-right">
                      <kbd className="bg-[var(--line)]/40 border border-[var(--line)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">Ctrl + ,</kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--line)]/10 transition-colors">
                    <td className="py-3 text-xs">Create New File</td>
                    <td className="py-3 text-right">
                      <kbd className="bg-[var(--line)]/40 border border-[var(--line)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">Ctrl + N</kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--line)]/10 transition-colors">
                    <td className="py-3 text-xs">Create New Folder</td>
                    <td className="py-3 text-right">
                      <kbd className="bg-[var(--line)]/40 border border-[var(--line)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">Ctrl + Shift + N</kbd>
                    </td>
                  </tr>
                  <tr className="hover:bg-[var(--line)]/10 transition-colors">
                    <td className="py-3 text-xs">Save Current File</td>
                    <td className="py-3 text-right">
                      <kbd className="bg-[var(--line)]/40 border border-[var(--line)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">Ctrl + S</kbd>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* Render filtered settings items */
            <div className="flex flex-col gap-7">
              {filteredDefs.length === 0 ? (
                <div className="text-xs text-[var(--muted)] italic py-4">No settings found matching your criteria.</div>
              ) : (
                filteredDefs.map((def) => {
                  const isReal = !!def.key;
                  const val = isReal ? settings[def.key!] : mockValues[def.id];

                  const onChange = (newVal: any) => {
                    if (isReal) {
                      updateSetting(def.key!, newVal);
                    } else {
                      updateMockSetting(def.id, newVal);
                    }
                  };

                  const isCheckbox = def.type === "checkbox" || def.type === "mock_checkbox";

                  return (
                    <div key={def.id} className="flex flex-col gap-1 transition-colors duration-200">
                      {/* Setting Header Layout */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-[var(--muted)]">
                          {def.category} › {def.subcategory}:
                        </span>
                        <span className="text-xs font-bold text-[var(--foreground)]">
                          {def.label}
                        </span>
                        {def.isExperimental && (
                          <span className="bg-[var(--line)]/40 border border-[var(--line)]/30 text-[var(--foreground)] text-[9px] px-1 rounded font-mono uppercase tracking-wide opacity-75">
                            Experimental
                          </span>
                        )}
                      </div>

                      {/* Control placement */}
                      {isCheckbox ? (
                        /* Checkbox renders next to the description text */
                        <div className="mt-1 flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={!!val}
                            onChange={(e) => onChange(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border border-[var(--line)] bg-[var(--panel-2)] text-[var(--accent)] accent-[var(--accent)] cursor-pointer focus:ring-0 focus:ring-offset-0 focus-visible:outline-none transition-all"
                          />
                          <span className="text-[11px] text-[var(--muted)] leading-relaxed max-w-2xl">
                            {def.description}
                          </span>
                        </div>
                      ) : (
                        /* Select/Number render control below the description text */
                        <div className="flex flex-col gap-1.5 mt-0.5">
                          <p className="text-[11px] text-[var(--muted)] leading-relaxed max-w-2xl">
                            {def.description}
                          </p>
                          <div className="mt-0.5">
                            {def.type === "number" ? (
                              <Input
                                type="number"
                                min={def.min}
                                max={def.max}
                                value={val ?? ""}
                                onChange={(e) => onChange(Math.max(def.min ?? 10, Math.min(def.max ?? 30, Number(e.target.value))))}
                                className="w-48 text-xs h-8 bg-[var(--panel-2)] border border-[var(--line)]/50 focus-visible:ring-1 focus-visible:ring-[var(--accent)]/50 focus-visible:border-[var(--accent)]/50 rounded"
                              />
                            ) : (
                              <Select
                                value={val ?? ""}
                                onValueChange={onChange}
                              >
                                <SelectTrigger className="w-64 text-xs h-8 bg-[var(--panel-2)]/95 border border-[var(--line)]/50 cursor-pointer hover:bg-[var(--line)]/25 hover:text-[var(--foreground)] focus:ring-0 rounded transition-colors justify-between text-left">
                                  <SelectValue placeholder="Select value" />
                                </SelectTrigger>
                                <SelectContent className="bg-[var(--panel-2)] border border-[var(--line)] text-[var(--foreground)] rounded">
                                  {def.options?.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-xs cursor-pointer focus:bg-[var(--line)]/40 focus:text-[var(--foreground)]">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
