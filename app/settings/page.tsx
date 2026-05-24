"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, RotateCcw, Save, Sparkles, UserRound, ChevronRight, ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultSettings, useSettings } from "@/lib/hooks/useSettings";
import { AIModel, AIResponseStyle, EditorSettings, KeybindingMode, ThemeMode } from "@/lib/types";

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

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const [draft, setDraft] = useState<EditorSettings>(settings);
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
    workspaceTrust: true,
    devServerAuto: false,
    zoomLevel: "0",
    askChatLocation: "chatView",
  });

  function save() {
    setSettings(draft);
  }

  function resetAll() {
    setDraft(defaultSettings);
    setSettings(defaultSettings);
  }

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
    { id: "window", label: "Window", subcategories: ["Zoom Level"] },
    { id: "security", label: "Security", subcategories: ["Workspace Trust"] },
    { id: "shortcuts", label: "Keyboard Shortcuts" }
  ] as const;

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
      id: "workspaceTrust",
      category: "Security",
      subcategory: "Workspace Trust",
      label: "Trust Workspace",
      description: "Controls whether this workspace is trusted automatically. Untrusted workspaces disable automatic code running.",
      type: "mock_checkbox",
      section: "workspace",
      defaultValue: true,
    },
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
    {
      id: "zoomLevel",
      category: "Window",
      subcategory: "Zoom Level",
      label: "Zoom Level",
      description: "Controls the zoom level of the editor window. Each increment shifts the zoom by 20%.",
      type: "mock_select",
      section: "workspace",
      options: [
        { value: "0", label: "Default" },
        { value: "1", label: "+20%" },
        { value: "2", label: "+40%" },
        { value: "-1", label: "-20%" }
      ],
      defaultValue: "0",
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
    <main className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] select-none animate-fade-in-soft">
      {/* Settings Left Panel */}
      <aside className="w-56 border-r border-[var(--line)]/25 bg-transparent flex flex-col shrink-0">
        <div className="p-4 border-b border-[var(--line)]/25 flex items-center gap-2.5 shrink-0">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[var(--line)]/40 text-[var(--foreground)] border border-[var(--line)]/20">
            <UserRound size={13} />
          </div>
          <div className="min-w-0">
            <h1 className="text-xs font-medium text-[var(--foreground)] truncate">Profile</h1>
            <p className="text-[10px] text-[var(--muted)] truncate">Guest workspace</p>
          </div>
        </div>

        <nav className="p-2 flex flex-col gap-0.5 overflow-y-auto">
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

      {/* Settings Scrollable View */}
      <section className="flex min-w-0 flex-1 flex-col bg-transparent">
        {/* Header */}
        <header className="flex h-10 items-center justify-between border-b border-[var(--line)]/25 bg-transparent px-4 shrink-0">
          <div className="flex items-center gap-3">
            <Link href="/editor">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md hover:bg-[var(--line)]/40" aria-label="Back to editor">
                <ArrowLeft size={14} />
              </Button>
            </Link>
            <div>
              <h2 className="text-xs font-semibold text-[var(--foreground)]">Settings</h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45 transition-colors cursor-pointer" onClick={resetAll}>
              <RotateCcw size={12} className="mr-1.5" />
              Reset All
            </Button>
            <Button size="sm" className="h-7 px-3 text-xs bg-[var(--accent)] text-[var(--background)] hover:bg-[var(--accent)]/90 transition-colors cursor-pointer font-medium rounded-md" onClick={save}>
              <Save size={12} className="mr-1.5" />
              Save Changes
            </Button>
          </div>
        </header>

        {/* 1. Top Search Header */}
        <div className="px-6 pt-4 pb-3 border-b border-[var(--line)]/20 flex flex-col gap-3 bg-[var(--panel)]/15 shrink-0">
          <div className="relative w-full max-w-3xl flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search settings"
              className="w-full h-8 pl-3 pr-24 text-xs bg-[var(--panel-2)]/90 border border-[var(--line)]/50 focus:border-[var(--accent)] outline-none rounded text-[var(--foreground)] placeholder-[var(--muted)]"
            />
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

        {/* 2. Main Content Scroll View */}
        <div 
          key={`${activeTab}-${activeCategory}-${activeSubcategory}-${searchQuery}`}
          className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8 max-w-4xl bg-transparent animate-fade-in-soft"
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
                  {(draft.keybindings === "vim"
                    ? [
                        { action: "New File", key: "Alt + N" },
                        { action: "New Folder", key: "Alt + Shift + N" },
                        { action: "Insert Mode", key: "i" },
                        { action: "Normal Mode", key: "Esc" },
                        { action: "Save File", key: ":w" },
                        { action: "Quit", key: ":q" },
                        { action: "Find Forward", key: "/" },
                        { action: "Undo", key: "u" },
                      ]
                    : draft.keybindings === "emacs"
                      ? [
                          { action: "New File", key: "Alt + N" },
                          { action: "New Folder", key: "Alt + Shift + N" },
                          { action: "Save File", key: "Ctrl + X, Ctrl + S" },
                          { action: "Find File", key: "Ctrl + X, Ctrl + F" },
                          { action: "Undo", key: "Ctrl + /" },
                          { action: "Search Forward", key: "Ctrl + S" },
                          { action: "Kill Line", key: "Ctrl + K" },
                          { action: "Yank", key: "Ctrl + Y" },
                        ]
                      : [
                          { action: "New File", key: "Alt + N" },
                          { action: "New Folder", key: "Alt + Shift + N" },
                          { action: "Save File", key: "Ctrl + S" },
                          { action: "Find", key: "Ctrl + F" },
                          { action: "Find Next", key: "Ctrl + G" },
                          { action: "Replace", key: "Ctrl + Shift + F" },
                          { action: "Undo", key: "Ctrl + Z" },
                          { action: "Redo", key: "Ctrl + Y" },
                        ]
                  ).map((sc, i) => (
                    <tr key={i} className="hover:bg-[var(--line)]/10 transition-colors">
                      <td className="py-3 text-xs">{sc.action}</td>
                      <td className="py-3 text-right">
                        <kbd className="bg-[var(--line)]/40 border border-[var(--line)]/30 rounded px-1.5 py-0.5 text-[10px] font-mono text-[var(--foreground)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                          {sc.key}
                        </kbd>
                      </td>
                    </tr>
                  ))}
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
                  const val = isReal ? draft[def.key!] : mockValues[def.id];

                  const onChange = (newVal: any) => {
                    if (isReal) {
                      setDraft((prev) => ({
                        ...prev,
                        [def.key!]: newVal,
                      }));
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
        </div>
      </section>
    </main>
  );
}
