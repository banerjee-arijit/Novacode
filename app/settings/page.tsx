"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Zap, Command, Keyboard, RotateCcw, Save, Settings2, Sparkles, Type, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defaultSettings, useSettings } from "@/lib/hooks/useSettings";
import { AIModel, AIResponseStyle, EditorSettings, KeybindingMode, ThemeMode } from "@/lib/types";

type Section = "general" | "keybindings" | "ai";

const themes: Array<{ value: ThemeMode; label: string; hint: string }> = [
  { value: "dark", label: "Dark", hint: "Low light default" },
  { value: "light", label: "Light", hint: "Clean daylight" },
  { value: "blueish", label: "Blueish", hint: "Cool cyan workspace" },
  { value: "graphite", label: "Graphite", hint: "Neutral dark gray" },
  { value: "high-contrast", label: "High Contrast", hint: "Maximum clarity" },
];

const aiModels: Array<{ value: AIModel; label: string }> = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { value: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
];

export default function SettingsPage() {
  const { settings, setSettings } = useSettings();
  const [active, setActive] = useState<Section>("general");
  const [draft, setDraft] = useState<EditorSettings>(settings);

  function save() {
    setSettings(draft);
  }

  function resetAll() {
    setDraft(defaultSettings);
    setSettings(defaultSettings);
  }

  return (
    <main className="flex h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      <aside className="w-72 shrink-0 border-r border-[var(--line)] bg-[var(--panel)]">
        <div className="border-b border-[var(--line)] p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-[var(--line)] bg-[var(--panel-2)]">
              <UserRound size={18} />
            </div>
            <div>
              <h1 className="text-sm font-semibold">Profile</h1>
              <p className="text-xs text-[var(--muted)]">Guest workspace</p>
            </div>
          </div>
        </div>
        <nav className="p-3">
          <SideItem active={active === "general"} icon={Type} label="General" onClick={() => setActive("general")} />
          <SideItem active={active === "keybindings"} icon={Keyboard} label="Keybindings" onClick={() => setActive("keybindings")} />
          <SideItem active={active === "ai"} icon={Zap} label="AI Feature" onClick={() => setActive("ai")} />
        </nav>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-4">
          <div className="flex items-center gap-3">
            <Link href="/editor">
              <Button variant="ghost" size="icon" aria-label="Back to editor">
                <ArrowLeft size={16} />
              </Button>
            </Link>
            <div>
              <h2 className="text-sm font-semibold">
                {active === "general" ? "General" : active === "keybindings" ? "Keybindings" : "AI Feature"}
              </h2>
              <p className="text-xs text-[var(--muted)]">Minimal controls for your editor profile.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetAll}>
              <RotateCcw size={15} />
              Reset All
            </Button>
            <Button onClick={save}>
              <Save size={15} />
              Save
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-6">
          {active === "general" && (
            <div className="grid max-w-5xl gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings2 size={17} className="text-[var(--muted)]" />
                    <CardTitle>Appearance</CardTitle>
                  </div>
                  <CardDescription>Choose a theme and editor typography.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Setting label="Theme" description="Five carefully tuned workspace themes.">
                    <Select value={draft.theme} onValueChange={(value) => setDraft((s) => ({ ...s, theme: value as ThemeMode }))}>
                      <SelectTrigger className="w-64 ">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {themes.map((theme) => (
                          <SelectItem key={theme.value} value={theme.value}>
                            {theme.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Setting>
                  <Setting label="Font size" description="Editor text size in pixels.">
                    <Input
                      type="number"
                      min={12}
                      max={22}
                      value={draft.fontSize}
                      onChange={(event) => setDraft((s) => ({ ...s, fontSize: Number(event.target.value) }))}
                      className="max-w-32"
                    />
                  </Setting>
                  <Setting label="Font family" description="Monospace font used by CodeMirror.">
                    <Select value={draft.fontFamily} onValueChange={(value) => setDraft((s) => ({ ...s, fontFamily: value as typeof draft.fontFamily }))}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Geist Mono">Geist Mono</SelectItem>
                        <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                        <SelectItem value="Fira Code">Fira Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </Setting>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Command size={17} className="text-[var(--muted)]" />
                    <CardTitle>Editor Behavior</CardTitle>
                  </div>
                  <CardDescription>Save behavior and indentation.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Setting label="Auto save" description="Persist the guest workspace in local storage.">
                    <Select value={draft.autoSave ? "enabled" : "disabled"} onValueChange={(value) => setDraft((s) => ({ ...s, autoSave: value === "enabled" }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </Setting>
                  <Setting label="Autocomplete" description="Show completion popup suggestions while typing.">
                    <Select value={draft.autocomplete ? "enabled" : "disabled"} onValueChange={(value) => setDraft((s) => ({ ...s, autocomplete: value === "enabled" }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </Setting>
                  <Setting label="Ghost suggestions" description="Show faint inline suggestions beside your cursor.">
                    <Select value={draft.ghostSuggestions ? "enabled" : "disabled"} onValueChange={(value) => setDraft((s) => ({ ...s, ghostSuggestions: value === "enabled" }))}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="enabled">Enabled</SelectItem>
                        <SelectItem value="disabled">Disabled</SelectItem>
                      </SelectContent>
                    </Select>
                  </Setting>
                  <Setting label="Indent mode" description="Pick spaces or tabs for indentation.">
                    <div className="flex gap-2">
                      <Button variant={!draft.indentWithTabs ? "default" : "outline"} onClick={() => setDraft((s) => ({ ...s, indentWithTabs: false }))}>Spaces</Button>
                      <Button variant={draft.indentWithTabs ? "default" : "outline"} onClick={() => setDraft((s) => ({ ...s, indentWithTabs: true }))}>Tabs</Button>
                      <Button variant={draft.tabSize === 2 ? "default" : "outline"} onClick={() => setDraft((s) => ({ ...s, tabSize: 2 }))}>2</Button>
                      <Button variant={draft.tabSize === 4 ? "default" : "outline"} onClick={() => setDraft((s) => ({ ...s, tabSize: 4 }))}>4</Button>
                    </div>
                  </Setting>
                </CardContent>
              </Card>
            </div>
          )}

          {active === "keybindings" && (
            <div className="grid max-w-5xl gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Keyboard size={17} className="text-[var(--muted)]" />
                    <CardTitle>Keybindings</CardTitle>
                  </div>
                  <CardDescription>Configure your editor keyboard interaction style and view shortcuts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Setting label="Key binding mode" description="Choose keyboard interaction style.">
                    <Select value={draft.keybindings} onValueChange={(value) => setDraft((s) => ({ ...s, keybindings: value as KeybindingMode }))}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select keybinding" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="vim">Vim</SelectItem>
                        <SelectItem value="emacs">Emacs</SelectItem>
                      </SelectContent>
                    </Select>
                  </Setting>

                  <div className="rounded-md border border-[var(--line)] bg-[var(--panel)] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--line)] bg-[var(--panel-2)] text-left text-[var(--muted)]">
                          <th className="px-4 py-3 font-medium">Action</th>
                          <th className="px-4 py-3 font-medium">Shortcut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--line)]">
                        {(draft.keybindings === "vim"
                          ? [
                            { action: "New file", key: "Alt / Opt + N" },
                            { action: "New folder", key: "Alt / Opt + Shift + N" },
                            { action: "Insert mode", key: "i" },
                            { action: "Normal mode", key: "Esc" },
                            { action: "Save file", key: ":w" },
                            { action: "Quit", key: ":q" },
                            { action: "Find forward", key: "/" },
                            { action: "Undo", key: "u" },
                          ]
                          : draft.keybindings === "emacs"
                            ? [
                              { action: "New file", key: "Alt / Opt + N" },
                              { action: "New folder", key: "Alt / Opt + Shift + N" },
                              { action: "Save file", key: "Ctrl + X, Ctrl + S" },
                              { action: "Find file", key: "Ctrl + X, Ctrl + F" },
                              { action: "Undo", key: "Ctrl + /" },
                              { action: "Search forward", key: "Ctrl + S" },
                              { action: "Kill line", key: "Ctrl + K" },
                              { action: "Yank", key: "Ctrl + Y" },
                            ]
                            : [
                              { action: "New file", key: "Alt / Opt + N" },
                              { action: "New folder", key: "Alt / Opt + Shift + N" },
                              { action: "Save file", key: "Ctrl / Cmd + S" },
                              { action: "Find", key: "Ctrl / Cmd + F" },
                              { action: "Find next", key: "Ctrl / Cmd + G" },
                              { action: "Replace", key: "Ctrl / Cmd + Shift + F" },
                              { action: "Undo", key: "Ctrl / Cmd + Z" },
                              { action: "Redo", key: "Ctrl / Cmd + Y" },
                            ]
                        ).map((sc, i) => (
                          <tr key={i} className="transition-colors hover:bg-[var(--panel-2)]">
                            <td className="px-4 py-3 text-[var(--foreground)]">{sc.action}</td>
                            <td className="px-4 py-3">
                              <kbd className="rounded border border-[var(--line)] bg-[var(--panel-2)] px-2 py-1 text-xs text-[var(--foreground)] shadow-sm">
                                {sc.key}
                              </kbd>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {active === "ai" && (
            <div className="grid max-w-5xl gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Assistant</CardTitle>
                  <CardDescription>Control how Novacode AI responds beside your code.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <Setting label="Model" description="Choose a free-tier-friendly Gemini model.">
                    <Select value={draft.aiModel} onValueChange={(value) => setDraft((s) => ({ ...s, aiModel: value as AIModel }))}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {aiModels.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Setting>
                  <Setting label="AI response style" description="Choose how much explanation Novacode AI returns.">
                    <Select value={draft.aiStyle} onValueChange={(value) => setDraft((s) => ({ ...s, aiStyle: value as AIResponseStyle }))}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="Select style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concise">Concise</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </Setting>
                  <Setting label="View credit" description="Current usage balance for the assistant.">
                    <div className="inline-flex items-center gap-2 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-2 text-sm">
                      <Sparkles size={15} className="text-[var(--accent)]" />
                      2,500 credits remaining
                    </div>
                  </Setting>
                  <Setting label="Upgrade plan" description="Unlock larger context windows and higher monthly limits.">
                    <Button>Upgrade Plan</Button>
                  </Setting>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SideItem({ active, icon: Icon, label, onClick }: { active: boolean; icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`mb-1 flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm transition-colors ${active ? "bg-[var(--panel-2)] text-[var(--foreground)]" : "text-[var(--muted)] hover:bg-[var(--panel-2)]"
        }`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

function Setting({ label, description, children }: { label: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 border-t border-[var(--line)] pt-5 first:border-t-0 first:pt-0 md:grid-cols-[260px_1fr]">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-1 text-xs leading-5 text-[var(--muted)]">{description}</div>
      </div>
      <div className="flex items-center">{children}</div>
    </div>
  );
}
