"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Loader2, LogIn, LogOut, PanelLeftOpen, PanelRightOpen, Play, Settings, Upload } from "lucide-react";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { CodeEditor } from "@/components/editor/CodeEditor";
import { FileExplorer } from "@/components/editor/FileExplorer";
import { OutputPanel, runCode } from "@/components/editor/OutputPanel";
import { StatusBar } from "@/components/editor/StatusBar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAI } from "@/lib/hooks/useAI";
import { useFiles } from "@/lib/hooks/useFiles";
import { useSettings } from "@/lib/hooks/useSettings";
import { Language } from "@/lib/types";
import { detectLanguage } from "@/lib/utils";

export default function EditorPage() {
  const filesApi = useFiles();
  const { settings } = useSettings();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  }
  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [selectedCode, setSelectedCode] = useState("");
  const [outputVisible, setOutputVisible] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<Awaited<ReturnType<typeof runCode>> | null>(null);
  const [leftWidth, setLeftWidth] = useState(260);
  const [rightWidth, setRightWidth] = useState(360);
  const [terminalOutput, setTerminalOutput] = useState<string>("Welcome to NovaCode Terminal v1.0.0\nType 'help' for available commands.\n");
  const [terminalPosition, setTerminalPosition] = useState<"bottom" | "right">("bottom");
  const [terminalSize, setTerminalSize] = useState(250);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"files" | "editor" | "ai">("editor");
  const [copied, setCopied] = useState(false);
  const [highlightRange, setHighlightRange] = useState<{ from: number; to: number } | null>(null);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
  const currentPath = useMemo(() => {
    if (!currentFolderId) return "~";
    const path: string[] = [];
    let currId: string | null = currentFolderId;
    while (currId) {
      const folder = filesApi.folders.find(f => f.id === currId);
      if (folder) {
        path.unshift(folder.name);
        currId = folder.parentId;
      } else {
        currId = null;
      }
    }
    return "~/" + path.join("/");
  }, [currentFolderId, filesApi.folders]);

  const ai = useAI(filesApi.activeFile, selectedCode, settings);

  const activeFile = filesApi.activeFile;
  const editorStyle = useMemo(
    () => ({ "--editor-font-size": `${settings.fontSize}px` }) as React.CSSProperties,
    [settings.fontSize],
  );

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editingText = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (editingText || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "n") return;

      event.preventDefault();
      if (event.shiftKey) {
        filesApi.createFolder(null);
        setLeftCollapsed(false);
        setMobilePanel("files");
      } else {
        filesApi.createFile("javascript", null);
        setLeftCollapsed(false);
        setMobilePanel("editor");
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [filesApi]);

  if (!activeFile) return null;

  function exportFile() {
    const blob = new Blob([activeFile.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = activeFile.name;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const content = await file.text();
      filesApi.importFile(file.name, content);
    };
    input.click();
  }

  async function formatCode() {
    setIsFormatting(true);
    try {
      const prettier = await import("prettier/standalone");
      let plugins = [];
      let parser = "babel";

      switch (activeFile.language) {
        case "javascript":
        case "typescript":
          plugins = [await import("prettier/plugins/babel"), await import("prettier/plugins/estree")];
          parser = "babel";
          break;
        case "html":
          plugins = [await import("prettier/plugins/html")];
          parser = "html";
          break;
        case "css":
          plugins = [await import("prettier/plugins/postcss")];
          parser = "css";
          break;
        default:
          throw new Error("Unsupported language for Prettier");
      }

      const formatted = await prettier.format(activeFile.content, {
        parser,
        plugins,
        useTabs: settings.indentWithTabs,
        tabWidth: settings.tabSize || 2,
      });

      filesApi.updateFile(activeFile.id, { content: formatted });
    } catch {
      // Fallback simple formatter
      const content = activeFile.content;
      const formatted = activeFile.language === "css" || activeFile.language === "html"
        ? content.replace(/>\s+</g, ">\n<").trim()
        : content.replace(/[ \t]+$/gm, "").trimEnd() + "\n";
      filesApi.updateFile(activeFile.id, { content: formatted });
    } finally {
      setIsFormatting(false);
    }
  }

  async function runActiveFile() {
    const language = inferRunLanguage(activeFile.name, activeFile.content, activeFile.language);
    if (language !== activeFile.language) {
      filesApi.updateFile(activeFile.id, { language });
    }
    setOutputVisible(true);
    setRunResult(null);
    setIsRunning(true);
    const result = await runCode(language, activeFile.content);
    setRunResult(result);
    setTerminalOutput(prev => prev + `\n[Executing ${activeFile.name}...]\n${result.output}\n`);
    setIsRunning(false);
  }

  async function handleCommand(command: string) {
    if (!outputVisible) setOutputVisible(true);
    setTerminalOutput(prev => prev + `\nnovacode:${currentPath}$ ${command}`);
    
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    
    if (cmd === "help") {
      setTerminalOutput(prev => prev + `\nAvailable commands:\n  help      - Show this message\n  ls        - List files and folders\n  cd        - Change directory\n  mkdir     - Create one or more directories\n  touch     - Create one or more files\n  clear     - Clear terminal\n  npx       - Run project generators (e.g., npx create-react-app)\n`);
    } else if (cmd === "clear") {
      setTerminalOutput(`novacode:${currentPath}$ `);
    } else if (cmd === "ls") {
      const items = [
        ...filesApi.folders.filter(f => f.parentId === currentFolderId).map(f => `\x1b[34m${f.name}/\x1b[0m`),
        ...filesApi.files.filter(f => f.parentId === currentFolderId).map(f => f.name)
      ].join("  ");
      setTerminalOutput(prev => prev + `\n${items || "Directory is empty"}`);
    } else if (cmd === "cd") {
      const target = args[0];
      if (!target || target === "~") {
        setCurrentFolderId(null);
      } else if (target === "..") {
        if (currentFolderId) {
          const folder = filesApi.folders.find(f => f.id === currentFolderId);
          setCurrentFolderId(folder?.parentId ?? null);
        }
      } else {
        const folder = filesApi.folders.find(f => f.parentId === currentFolderId && f.name === target);
        if (folder) {
          setCurrentFolderId(folder.id);
        } else {
          setTerminalOutput(prev => prev + `\ncd: no such directory: ${target}`);
        }
      }
    } else if (cmd === "mkdir") {
      if (args.length === 0) {
        setTerminalOutput(prev => prev + `\nmkdir: missing operand`);
      } else {
        args.forEach(name => {
          filesApi.createFolder(currentFolderId, name);
        });
        setTerminalOutput(prev => prev + `\nCreated ${args.length} director${args.length > 1 ? "ies" : "y"}.`);
      }
    } else if (cmd === "touch") {
      if (args.length === 0) {
        setTerminalOutput(prev => prev + `\ntouch: missing file operand`);
      } else {
        args.forEach(name => {
          filesApi.importFile(name, "", currentFolderId);
        });
        setTerminalOutput(prev => prev + `\nCreated ${args.length} file${args.length > 1 ? "s" : ""}.`);
      }
    } else if (cmd === "npx" && (args[0] === "create-react-app" || args[0] === "create-next-app")) {
      const projectName = args[1] || "my-app";
      setTerminalOutput(prev => prev + `\n\x1b[33mCreating ${args[0]} project '${projectName}'...\x1b[0m\nInstalling dependencies...\n[####################] 100%`);
      
      setTimeout(() => {
        const folderId = filesApi.createFolder(currentFolderId, projectName);
        
        // Populate with common files
        filesApi.importFile("package.json", JSON.stringify({ name: projectName, version: "1.0.0", dependencies: { react: "^18.0.0" } }, null, 2), folderId);
        filesApi.importFile("App.js", "import React from 'react';\n\nexport default function App() {\n  return <div>Hello World</div>;\n}", folderId);
        filesApi.importFile("index.css", "body { background: #000; color: #fff; }", folderId);
        
        setTerminalOutput(prev => prev + `\n\x1b[32mSuccess! Created ${projectName} project.\x1b[0m\nType 'cd ${projectName}' to enter the project directory.`);
      }, 1000);
    } else {
      setTerminalOutput(prev => prev + `\nsh: command not found: ${cmd}`);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleInsertCode(code: string) {
    const currentContent = activeFile.content;
    const newContent = currentContent ? `${currentContent}\n\n${code}` : code;
    
    const startLine = currentContent ? currentContent.split("\n").length + 2 : 1;
    const endLine = startLine + code.split("\n").length - 1;
    
    filesApi.updateFile(activeFile.id, { content: newContent });
    
    // Slight delay to ensure CodeMirror has updated its document before we apply the highlight
    setTimeout(() => {
      setHighlightRange({ from: startLine, to: endLine });
      setTimeout(() => setHighlightRange(null), 3000);
    }, 50);
  }

  function startResize(panel: "left" | "right" | "terminal") {
    const onMove = (event: MouseEvent) => {
      if (panel === "left") setLeftWidth(Math.min(380, Math.max(200, event.clientX)));
      if (panel === "right") setRightWidth(Math.min(520, Math.max(300, window.innerWidth - event.clientX)));
      if (panel === "terminal") {
        if (terminalPosition === "bottom") {
          setTerminalSize(Math.min(window.innerHeight - 100, Math.max(100, window.innerHeight - event.clientY)));
        } else {
          setTerminalSize(Math.min(window.innerWidth - 300, Math.max(200, window.innerWidth - event.clientX)));
        }
      }
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--background)] text-[var(--foreground)]" style={editorStyle}>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md border border-[var(--line)] bg-[var(--panel-2)]">
            <Image src="/icons/novacode-mark.svg" alt="NovaCode AI" width={22} height={22} priority />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">NovaCode </p>
          </div>
        </div>
        <nav className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={handleImport} title="Import file">
            <Upload size={15} />
            Import
          </Button>
          <Button size="sm" variant="ghost" onClick={exportFile} title="Export active file">
            <Download size={15} />
            Export
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="gap-2 px-1.5 hover:bg-[var(--line)] rounded-full">
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-white font-bold text-[10px] shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate text-xs font-semibold mr-1">{user.name.split(' ')[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--panel-2)] border-[var(--line)] shadow-xl rounded-xl p-1">
                <div className="px-3 py-2.5 mb-1 bg-[var(--panel)] rounded-lg border border-[var(--line)] m-1">
                  <p className="text-xs font-bold text-[var(--foreground)]">{user.name}</p>
                  <p className="text-[10px] text-[var(--muted)] truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-[var(--line)] mx-1" />
                <Link href="/settings">
                  <DropdownMenuItem className="gap-2 cursor-pointer rounded-md">
                    <Settings size={15} /> Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-[var(--line)] mx-1" />
                <DropdownMenuItem className="gap-2 cursor-pointer rounded-md text-rose-400 focus:text-rose-400 focus:bg-rose-400/10" onClick={handleLogout}>
                  <LogOut size={15} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/auth">
              <Button size="sm" variant="secondary" className="rounded-full px-4">
                <LogIn size={15} />
                Sign in
              </Button>
            </Link>
          )}
        </nav>
      </header>

      <div className="hidden h-11 shrink-0 border-b border-[var(--line)] bg-[var(--panel)] p-1 max-md:flex">
        {(["files", "editor", "ai"] as const).map((panel) => (
          <button
            key={panel}
            className={`flex-1 rounded-md text-sm capitalize ${mobilePanel === panel ? "bg-[var(--accent)] text-[var(--background)]" : "text-[var(--muted)]"}`}
            onClick={() => setMobilePanel(panel)}
          >
            {panel}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {!leftCollapsed && (
          <div className="hidden lg:block" style={{ width: leftWidth }}>
            <FileExplorer
              files={filesApi.files}
              folders={filesApi.folders}
              activeFileId={filesApi.activeFileId}
              onSelect={filesApi.setActiveFileId}
              onCreateFile={(parentId) => filesApi.createFile("javascript", parentId)}
              onCreateFolder={filesApi.createFolder}
              onRenameFile={filesApi.renameFile}
              onRenameFolder={filesApi.renameFolder}
              onDeleteFile={filesApi.deleteFile}
              onDeleteFolder={filesApi.deleteFolder}
            />
          </div>
        )}
        <div className={`${mobilePanel === "files" ? "block" : "hidden"} w-full md:hidden`}>
          <FileExplorer
            files={filesApi.files}
            folders={filesApi.folders}
            activeFileId={filesApi.activeFileId}
            onSelect={(id) => {
              filesApi.setActiveFileId(id);
              setMobilePanel("editor");
            }}
            onCreateFile={(parentId) => filesApi.createFile("javascript", parentId)}
            onCreateFolder={filesApi.createFolder}
            onRenameFile={filesApi.renameFile}
            onRenameFolder={filesApi.renameFolder}
            onDeleteFile={filesApi.deleteFile}
            onDeleteFolder={filesApi.deleteFolder}
          />
        </div>
        {!leftCollapsed && <div
          className="group relative w-2 shrink-0 cursor-col-resize max-lg:hidden flex items-center justify-center -mx-[0.5px] z-10"
          onMouseDown={() => startResize("left")}
          role="separator"
          aria-orientation="vertical"
        >
          <div className="h-full w-[1px] bg-[var(--line)] group-hover:bg-cyan-400 group-hover:w-[2px] transition-all" />
        </div>}

        <section className={`${mobilePanel === "editor" ? "max-md:flex" : "max-md:hidden"} flex min-w-0 flex-1 flex-col bg-[var(--background)]`}>
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--line)] px-3">
            <div className="flex min-w-0 items-center gap-2">
              <Button size="icon" variant="ghost" title={leftCollapsed ? "Open workspace" : "Collapse workspace"} onClick={() => setLeftCollapsed((value) => !value)}>
                <PanelLeftOpen size={16} />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--foreground)]">{activeFile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={runActiveFile} disabled={isRunning || activeFile.language === "plaintext"}>
                {isRunning ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                Run
              </Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setOutputVisible(true);
                setRunResult(null);
              }}>
                Terminal
              </Button>
              <Button size="sm" variant="ghost" onClick={formatCode} disabled={isFormatting || activeFile.language === "plaintext"}>
                {isFormatting ? <Loader2 size={15} className="animate-spin" /> : "Format"}
              </Button>
              <Button size="icon" variant="ghost" title="Copy code" onClick={handleCopy} className="relative">
                {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                {copied && (
                  <span className="absolute -top-8 right-0 rounded bg-[var(--foreground)] px-2 py-1 text-xs font-medium text-[var(--background)] shadow-sm">
                    Copied
                  </span>
                )}
              </Button>
              <Button size="icon" variant="ghost" title={rightCollapsed ? "Open AI" : "Collapse AI"} onClick={() => setRightCollapsed((value) => !value)}>
                <PanelRightOpen size={16} />
              </Button>
            </div>
          </div>

          <div className={`flex min-h-0 flex-1 ${terminalPosition === "right" ? "flex-row" : "flex-col"}`}>
            <div className="min-h-0 flex-1 relative">
              <CodeEditor
                key={`${activeFile.id}-${settings.theme}-${settings.fontFamily}-${settings.autocomplete}-${settings.ghostSuggestions}`}
                value={activeFile.content}
                language={activeFile.language}
                settings={settings}
                onChange={(content) => filesApi.updateFile(activeFile.id, { content })}
                onCursorChange={(line, column) => setCursor({ line, column })}
                onSelectionChange={setSelectedCode}
                highlightRange={highlightRange}
              />
            </div>
            <OutputPanel
              visible={outputVisible}
              result={runResult || { type: "console", output: terminalOutput }}
              activeFile={activeFile}
              files={filesApi.files}
              position={terminalPosition}
              size={terminalSize}
              currentPath={currentPath}
              onTogglePosition={() => setTerminalPosition(p => p === "bottom" ? "right" : "bottom")}
              onResizeStart={() => startResize("terminal")}
              onClose={() => setOutputVisible(false)}
              onCommand={handleCommand}
            />
          </div>
          <StatusBar line={cursor.line} column={cursor.column} language={activeFile.language} content={activeFile.content} settings={settings} />
        </section>

        {!rightCollapsed && <div
          className="group relative w-2 shrink-0 cursor-col-resize max-md:hidden flex items-center justify-center -mx-[0.5px] z-10"
          onMouseDown={() => startResize("right")}
          role="separator"
          aria-orientation="vertical"
        >
          <div className="h-full w-[1px] bg-[var(--line)] group-hover:bg-cyan-400 group-hover:w-[2px] transition-all" />
        </div>}
        {!rightCollapsed && <div className={mobilePanel === "ai" ? "max-md:block" : "max-md:hidden"} style={{ width: `min(100%, ${rightWidth}px)` }}>
          <AIChatPanel
            messages={ai.messages}
            loading={ai.loading}
            activeFile={activeFile}
            selectedCode={selectedCode}
            settings={settings}
            onPrompt={ai.sendMessage}
            onInsert={handleInsertCode}
            onClearChat={ai.clearMessages}
          />
        </div>}
      </div>
    </main>
  );
}

function inferRunLanguage(filename: string, content: string, currentLanguage: Language): Language {
  const byName = detectLanguage(filename);
  if (byName !== "plaintext") return byName;
  if (/\b(public\s+)?class\s+[A-Za-z_$][\w$]*\b/.test(content) || /\bpublic\s+static\s+void\s+main\s*\(/.test(content)) {
    return "java";
  }
  return currentLanguage;
}
