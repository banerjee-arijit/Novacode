"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, Copy, Download, Loader2, LogIn, LogOut, PanelLeftOpen, PanelRightOpen, Play, Settings, Upload, File, Folder, FolderPlus, FileUp, Share2, PanelBottom, Terminal as TerminalIcon, X, Trash2, Files, Search, Bot, User, ChevronRight, Code2, Sparkles, Keyboard, Eye, Puzzle } from "lucide-react";
import dynamic from "next/dynamic";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAI } from "@/lib/hooks/useAI";
import { useFiles } from "@/lib/hooks/useFiles";
import { useSettings } from "@/lib/hooks/useSettings";
import { createProjectTemplate, detectProjectCommand, findRunnableProject } from "@/lib/projectTemplates";
import { Language } from "@/lib/types";
import { detectLanguage, cn } from "@/lib/utils";
import { FileIcon } from "@/components/editor/FileIcon";
import { RunResult, runCode } from "@/lib/runCode";
import { AIEditModal } from "@/components/editor/AIEditModal";
import { AIEditTooltip } from "@/components/editor/AIEditTooltip";

// Lazy-loaded components (Client-side only) with shimmer skeletons
const CodeEditor = dynamic(() => import("@/components/editor/CodeEditor").then(mod => mod.CodeEditor), {
  ssr: false,
  loading: () => (
    <div className="flex-grow h-full bg-[var(--background)] p-4 flex flex-col gap-3.5 select-none font-mono">
      <div className="flex gap-2">
        <div className="h-4.5 w-16 loading-shimmer" />
        <div className="h-4.5 w-32 loading-shimmer" />
      </div>
      <div className="flex-1 space-y-3.5 pt-4">
        <div className="h-4 w-3/4 loading-shimmer" />
        <div className="h-4 w-1/2 loading-shimmer" />
        <div className="h-4 w-5/6 loading-shimmer" />
        <div className="h-4 w-2/3 loading-shimmer" />
        <div className="h-4 w-11/12 loading-shimmer" />
      </div>
    </div>
  )
});

const AIChatPanel = dynamic(() => import("@/components/ai/AIChatPanel").then(mod => mod.AIChatPanel), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[var(--panel)] p-4 flex flex-col justify-between select-none">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="h-4.5 w-24 loading-shimmer" />
        <div className="h-4.5 w-4.5 loading-shimmer rounded-full" />
      </div>
      <div className="flex-1 space-y-4 pt-5">
        <div className="flex flex-col gap-2">
          <div className="h-3 w-16 loading-shimmer self-end" />
          <div className="h-10 w-2/3 loading-shimmer self-end rounded-lg" />
        </div>
        <div className="flex flex-col gap-2">
          <div className="h-3 w-20 loading-shimmer" />
          <div className="h-20 w-3/4 loading-shimmer rounded-lg" />
        </div>
      </div>
      <div className="h-10 w-full loading-shimmer rounded-lg mt-4" />
    </div>
  )
});

const FileExplorer = dynamic(() => import("@/components/editor/FileExplorer").then(mod => mod.FileExplorer), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[var(--panel)] p-4 space-y-4 select-none">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
        <div className="h-4.5 w-20 loading-shimmer" />
        <div className="flex gap-2">
          <div className="h-4 w-4 loading-shimmer" />
          <div className="h-4 w-4 loading-shimmer" />
        </div>
      </div>
      <div className="space-y-3 pt-2">
        {[45, 60, 35, 70, 50, 40].map((width, idx) => (
          <div key={idx} className="flex items-center gap-2 pl-1">
            <div className="h-3.5 w-3.5 loading-shimmer" />
            <div className="h-3.5 loading-shimmer" style={{ width: `${width}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
});

const SearchPanel = dynamic(() => import("@/components/editor/SearchPanel").then(mod => mod.SearchPanel), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[var(--panel)] p-4 space-y-4 select-none">
      <div className="h-4.5 w-20 loading-shimmer" />
      <div className="h-9 w-full loading-shimmer rounded" />
      <div className="space-y-2">
        <div className="h-3.5 w-1/2 loading-shimmer" />
        <div className="h-3.5 w-2/3 loading-shimmer" />
      </div>
    </div>
  )
});

const OutputPanel = dynamic(() => import("@/components/editor/OutputPanel").then(mod => mod.OutputPanel), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-[var(--panel-2)] p-4 space-y-3.5 select-none font-mono">
      <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
        <div className="h-4.5 w-32 loading-shimmer" />
        <div className="flex gap-2">
          <div className="h-4 w-4 loading-shimmer" />
          <div className="h-4 w-4 loading-shimmer" />
        </div>
      </div>
      <div className="space-y-2 pt-3">
        <div className="h-4 w-2/3 loading-shimmer" />
        <div className="h-4 w-3/4 loading-shimmer" />
        <div className="h-4 w-1/2 loading-shimmer" />
      </div>
    </div>
  )
});

const SettingsTab = dynamic(() => import("@/components/editor/SettingsTab").then(mod => mod.SettingsTab), { ssr: false });

const StatusBar = dynamic(() => import("@/components/editor/StatusBar").then(mod => mod.StatusBar), {
  ssr: false,
  loading: () => (
    <div className="h-6 w-full bg-[var(--accent)] flex items-center justify-between px-4 select-none">
      <div className="h-3 w-32 bg-zinc-950/20 rounded animate-pulse" />
      <div className="h-3 w-24 bg-zinc-950/20 rounded animate-pulse" />
    </div>
  )
});

export default function EditorPage() {
  const filesApi = useFiles();
  const { settings, setSettings } = useSettings();
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string>("");

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

  // VSCode Multi-tab & Sidebar states
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");
  const [activeSidebarTab, setActiveSidebarTab] = useState<"explorer" | "search">("explorer");
  const [isTabsLoaded, setIsTabsLoaded] = useState(false);

  const [viewMode, setViewMode] = useState<"code" | "design" | "preview">("code");

  const [cursor, setCursor] = useState({ line: 1, column: 1 });
  const [selectedCode, setSelectedCode] = useState("");
  const [selectedLines, setSelectedLines] = useState<{ start: number; end: number } | null>(null);
  const [selectionPos, setSelectionPos] = useState<{ x: number; y: number } | null>(null);
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [outputVisible, setOutputVisible] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(300);
  const [terminalOutput, setTerminalOutput] = useState<string>("Welcome to NovaCode Terminal v1.0.0\nType 'help' for available commands.\n");
  const [terminalPosition, setTerminalPosition] = useState<"bottom" | "right">("bottom");
  const [terminalSize, setTerminalSize] = useState(250);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"files" | "editor" | "ai">("editor");
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
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



  // Load tabs from LocalStorage
  useEffect(() => {
    if (!filesApi.isInitialized) return;

    const saved = window.localStorage.getItem("novacode-open-tabs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fileIds = new Set(filesApi.files.map(f => f.id));
          const uniqueParsed = Array.from(new Set(parsed)).filter(
            id => id === "settings" || fileIds.has(id)
          ) as string[];

          if (uniqueParsed.length > 0) {
            setOpenFileIds(uniqueParsed);
            if (filesApi.activeFileId && uniqueParsed.includes(filesApi.activeFileId)) {
              setActiveTabId(filesApi.activeFileId);
            } else {
              setActiveTabId(uniqueParsed[0]);
            }
          } else if (filesApi.activeFileId) {
            setOpenFileIds([filesApi.activeFileId]);
            setActiveTabId(filesApi.activeFileId);
          }
        }
      } catch (e) { }
    } else if (filesApi.activeFileId) {
      setOpenFileIds([filesApi.activeFileId]);
      setActiveTabId(filesApi.activeFileId);
    }
    setIsTabsLoaded(true);
  }, [filesApi.isInitialized]);

  // Save tabs to LocalStorage
  useEffect(() => {
    if (isTabsLoaded) {
      window.localStorage.setItem("novacode-open-tabs", JSON.stringify(openFileIds));
    }
  }, [openFileIds, isTabsLoaded]);

  // 1. Synchronize tab states when active file changes inside the filesApi hook
  useEffect(() => {
    if (!filesApi.isInitialized || !filesApi.activeFileId || !isTabsLoaded) return;

    setOpenFileIds(prev => {
      if (prev.includes(filesApi.activeFileId)) return prev;
      return [...prev, filesApi.activeFileId];
    });

    setActiveTabId(filesApi.activeFileId);
  }, [filesApi.activeFileId, filesApi.isInitialized, isTabsLoaded]);

  // 2. Sync tabs with files list changes (e.g. deletion)
  useEffect(() => {
    if (!isTabsLoaded || !filesApi.isInitialized) return;

    const fileIds = new Set(filesApi.files.map(f => f.id));

    setOpenFileIds(prev => {
      const nextTabs = prev.filter(id => id === "settings" || fileIds.has(id));
      const changed = nextTabs.length !== prev.length || nextTabs.some((id, i) => id !== prev[i]);
      return changed ? nextTabs : prev;
    });

    if (activeTabId && activeTabId !== "settings" && !fileIds.has(activeTabId)) {
      setActiveTabId(filesApi.activeFileId || "");
    }
  }, [filesApi.files, isTabsLoaded, filesApi.isInitialized, activeTabId, filesApi.activeFileId]);

  // Sync filesApi active file with activeTabId
  useEffect(() => {
    if (activeTabId && activeTabId !== "settings") {
      filesApi.setActiveFileId(activeTabId);
    }
  }, [activeTabId]);

  // Method to close tabs
  const handleCloseTab = (idToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openFileIds.filter(id => id !== idToClose);
    setOpenFileIds(nextTabs);

    if (activeTabId === idToClose) {
      if (nextTabs.length > 0) {
        const index = openFileIds.indexOf(idToClose);
        const nextActiveIndex = Math.min(nextTabs.length - 1, Math.max(0, index - 1));
        setActiveTabId(nextTabs[nextActiveIndex]);
      } else {
        setActiveTabId("");
      }
    }
  };

  // Breadcrumbs calculation
  const breadcrumbs = useMemo(() => {
    if (activeTabId === "settings") {
      return [
        { type: "settings", name: "User Settings", id: "settings" }
      ];
    }
    const file = filesApi.files.find(f => f.id === activeTabId);
    if (!file) return [];

    const path: Array<{ type: "root" | "folder" | "file" | "settings"; name: string; id: string }> = [
      { type: "file", name: file.name, id: file.id }
    ];
    let currFolderId = file.parentId;
    while (currFolderId) {
      const folder = filesApi.folders.find(f => f.id === currFolderId);
      if (folder) {
        path.unshift({ type: "folder", name: folder.name, id: folder.id });
        currFolderId = folder.parentId;
      } else {
        break;
      }
    }
    path.unshift({ type: "root", name: "workspace", id: "root" });
    return path;
  }, [activeTabId, filesApi.files, filesApi.folders]);

  // Navigate to a matching line from search results
  const handleSelectSearchMatch = (fileId: string, lineNumber: number) => {
    setOpenFileIds(prev => prev.includes(fileId) ? prev : [...prev, fileId]);
    setActiveTabId(fileId);
    // Add a highlight animation
    setHighlightRange({ from: lineNumber, to: lineNumber });
    setTimeout(() => setHighlightRange(null), 3000);
  };

  const activeFile = useMemo(() => {
    return filesApi.files.find(f => f.id === activeTabId);
  }, [activeTabId, filesApi.files]);

  // Sync viewMode changes to layout and run code previews
  useEffect(() => {
    if (viewMode === "preview") {
      setOutputVisible(true);
      if (activeFile) {
        setIsRunning(true);
        runCode(activeFile.language, activeFile.content).then(res => {
          setRunResult(res);
          setIsRunning(false);
        });
      }
    } else if (viewMode === "design") {
      setOutputVisible(true);
      setTerminalPosition("right");
      if (activeFile) {
        setIsRunning(true);
        runCode(activeFile.language, activeFile.content).then(res => {
          setRunResult(res);
          setIsRunning(false);
        });
      }
    } else {
      setOutputVisible(false);
    }
  }, [viewMode, activeFile]);

  const ai = useAI(activeFile, selectedCode, settings);

  const editorStyle = useMemo(
    () => ({ "--editor-font-size": `${settings.fontSize}px` }) as React.CSSProperties,
    [settings.fontSize],
  );

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const editingText = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (editingText) return;

      const isModifier = event.ctrlKey || event.metaKey;

      if (isModifier && event.key.toLowerCase() === "n" && !event.shiftKey) {
        event.preventDefault();
        const newId = filesApi.createFile("plaintext", null);
        if (newId) {
          setOpenFileIds(prev => prev.includes(newId) ? prev : [...prev, newId]);
          setActiveTabId(newId);
        }
        setLeftCollapsed(false);
        setMobilePanel("editor");
      }

      if (isModifier && event.shiftKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        filesApi.createFolder(null);
        setLeftCollapsed(false);
        setMobilePanel("files");
      }

      if (isModifier && event.key.toLowerCase() === "b") {
        event.preventDefault();
        setLeftCollapsed(prev => !prev);
      }

      if (isModifier && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setLeftCollapsed(false);
        setActiveSidebarTab("search");
      }

      if (isModifier && event.key === ",") {
        event.preventDefault();
        setActiveTabId("settings");
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [filesApi, openFileIds]);

  function exportFile() {
    if (!activeFile) return;
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
      const newId = filesApi.importFile(file.name, content);
      if (newId) {
        setOpenFileIds(prev => prev.includes(newId) ? prev : [...prev, newId]);
        setActiveTabId(newId);
      }
    };
    input.click();
  }

  async function formatCode() {
    if (!activeFile) return;
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

  const getWorkspacePath = (fileId: string): string => {
    const file = filesApi.files.find(f => f.id === fileId);
    if (!file) return "";
    
    const pathParts = [file.name];
    let currentParentId = file.parentId;
    
    while (currentParentId) {
      const folder = filesApi.folders.find(f => f.id === currentParentId);
      if (folder) {
        pathParts.unshift(folder.name);
        currentParentId = folder.parentId;
      } else {
        break;
      }
    }
    
    return pathParts.join("/");
  };

  async function runActiveFile() {
    if (!activeFile) return;
    const language = inferRunLanguage(activeFile.name, activeFile.content, activeFile.language);
    if (language !== activeFile.language) {
      filesApi.updateFile(activeFile.id, { language });
    }
    
    setOutputVisible(true);
    setRunResult(null);
    setIsRunning(true);
    
    if (language === "html" || language === "css") {
      setViewMode("preview");
    } else {
      const result = await runCode(language, activeFile.content);
      setRunResult(result);
    }
    
    setIsRunning(false);
  }

  async function handleCommand(command: string) {
    if (!outputVisible) setOutputVisible(true);
    setRunResult(null);
    setTerminalOutput(prev => prev + `\nnovacode:${currentPath}$ ${command}`);

    const parts = command.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const projectCommand = detectProjectCommand(command);

    if (cmd === "help") {
      setTerminalOutput(prev => prev + `\nAvailable commands:\n  help                                Show this message\n  ls                                  List files and folders\n  cd <folder>                         Change directory\n  mkdir <name...>                     Create one or more directories\n  touch <name...>                     Create one or more files\n  npm create vite@latest my-app -- --template react-ts\n  npx create-react-app my-app         Create a React project structure\n  npm install                         Mark dependencies as ready for preview\n  npm run dev                         Preview the current React/Vite project\n  npm start                           Preview the current React app\n  clear                               Clear terminal\n\nUse Up and Down arrows to cycle through previous commands.\n`);
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
    } else if (projectCommand) {
      const files = createProjectTemplate(projectCommand.projectName, projectCommand.template);
      filesApi.importProjectFiles(projectCommand.projectName, files, currentFolderId);
      setTerminalOutput(prev => prev + `\nCreating ${projectCommand.tool} project '${projectCommand.projectName}'...\nCreated ${files.length} files.\nDone. Type 'cd ${projectCommand.projectName}' and then 'npm run dev' to preview it.`);
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
    } else if (cmd === "npm" && args[0] === "install") {
      const project = findRunnableProject(currentFolderId, filesApi.files, filesApi.folders);
      if (!project) {
        setTerminalOutput(prev => prev + `\nNo package.json found in ${currentPath}.`);
        return;
      }
      setTerminalOutput(prev => prev + `\nDependencies resolved in the browser workspace.\nRun 'npm run dev' to start ${project.name}.`);
    } else if ((cmd === "npm" && args[0] === "run" && args[1] === "dev") || (cmd === "npm" && args[0] === "start")) {
      const project = findRunnableProject(currentFolderId, filesApi.files, filesApi.folders);
      if (!project) {
        setTerminalOutput(prev => prev + `\nNo runnable React/Vite project found in ${currentPath}. Run this inside a folder with package.json and src/App.jsx or src/App.tsx.`);
        return;
      }
      setTerminalOutput(prev => prev + `\nStarting development server for ${project.name}...\nLocal preview is ready.`);
      setRunResult({ type: "preview", output: `Previewing ${project.name}`, html: project.html });
    } else {
      setTerminalOutput(prev => prev + `\nsh: command not found: ${cmd}`);
    }
  }

  function handleCopy() {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  function handleExit() {
    if (confirm("Are you sure you want to exit NovaCode?")) {
      window.location.href = "/";
    }
  }

  function handleInsertCode(code: string) {
    if (!activeFile) return;
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

  /** Apply AI edit: replace selected code in the active file with the AI-generated replacement */
  function handleApplyAIEdit(newCode: string) {
    if (!activeFile || !selectedCode) return;
    const content = activeFile.content;
    const selectionIndex = content.indexOf(selectedCode);
    if (selectionIndex === -1) {
      // fallback: append at end
      handleInsertCode(newCode);
      return;
    }
    const before = content.slice(0, selectionIndex);
    const after = content.slice(selectionIndex + selectedCode.length);
    const updated = before + newCode + after;
    filesApi.updateFile(activeFile.id, { content: updated });
    setSelectedCode("");
    setSelectionPos(null);
    // highlight new code
    const startLine = (before.match(/\n/g) || []).length + 1;
    const endLine = startLine + newCode.split("\n").length - 1;
    setTimeout(() => {
      setHighlightRange({ from: startLine, to: endLine });
      setTimeout(() => setHighlightRange(null), 3000);
    }, 50);
  }

  const handleCreateTemplate = (templateType: "vite-react" | "vite-react-ts" | "react-app") => {
    const name = templateType === "react-app" ? "my-react-app" : templateType === "vite-react-ts" ? "vite-react-ts-project" : "vite-react-project";
    const draftFiles = createProjectTemplate(name, templateType);
    filesApi.importProjectFiles(name, draftFiles, currentFolderId);
    setLeftCollapsed(false);
  };

  function startResize(panel: "left" | "right" | "terminal") {
    const onMove = (event: MouseEvent) => {
      if (panel === "left") {
        // Subtract 48px to account for Activity Bar width
        setLeftWidth(Math.min(380, Math.max(200, event.clientX - 48)));
      }
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
      {/* 1. Header (Codient Title Bar) */}
      <header className="relative flex h-11 shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] px-3 select-none z-30">
        {/* Left Side: Logo + Menus */}
        <div className="flex items-center gap-2">
          {/* Static geometric Logo */}
          <div className="flex items-center gap-1.5 shrink-0 mr-2">
            <svg className="h-4.5 w-4.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" fill="currentColor" fillOpacity="0.15" />
              <line x1="12" y1="22" x2="12" y2="15.5" />
              <polyline points="22 8.5 12 15.5 2 8.5" />
              <line x1="12" y1="2" x2="12" y2="8.5" />
            </svg>
          </div>

          {/* Menus: File, View, Terminal, Help */}
          <div className="flex items-center gap-0.5">
            {/* File Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2 rounded text-xs font-normal text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45 transition-colors cursor-pointer focus:outline-none">
                  File
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg p-1 text-xs z-50">
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={() => {
                  const newId = filesApi.createFile("plaintext", null);
                  if (newId) {
                    setOpenFileIds(prev => prev.includes(newId) ? prev : [...prev, newId]);
                    setActiveTabId(newId);
                  }
                }}>
                  <File className="w-3.5 h-3.5 text-[var(--accent)] opacity-80" />
                  <span>New File</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={() => filesApi.createFolder(null)}>
                  <FolderPlus className="w-3.5 h-3.5 text-[var(--accent)] opacity-80" />
                  <span>New Folder</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--line)]/30" />
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={handleImport}>
                  <FileUp className="w-3.5 h-3.5 opacity-80" />
                  <span>Import File</span>
                </DropdownMenuItem>
                {activeFile && (
                  <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={exportFile}>
                    <Download className="w-3.5 h-3.5 opacity-80" />
                    <span>Export File</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--accent)] hover:bg-[var(--line)]/40 focus:text-[var(--accent)]" onClick={handleShare}>
                  <Share2 className="w-3.5 h-3.5 opacity-80" />
                  <span>Share Workspace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* View Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2 rounded text-xs font-normal text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45 transition-colors cursor-pointer focus:outline-none">
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg p-1 text-xs z-50">
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={() => setLeftCollapsed(!leftCollapsed)}>
                  <span>Toggle Sidebar</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={() => setOutputVisible(!outputVisible)}>
                  <span>Toggle Terminal</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={() => setRightCollapsed(!rightCollapsed)}>
                  <span>Toggle AI Panel</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--line)]/30" />
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={() => {
                  setOpenFileIds(prev => prev.includes("settings") ? prev : [...prev, "settings"]);
                  setActiveTabId("settings");
                }}>
                  <span>Open Settings</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Terminal Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2 rounded text-xs font-normal text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45 transition-colors cursor-pointer focus:outline-none">
                  Terminal
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg p-1 text-xs z-50">
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={() => setOutputVisible(true)}>
                  <span>New Terminal</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Help Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7 px-2 rounded text-xs font-normal text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45 transition-colors cursor-pointer focus:outline-none">
                  Help
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 bg-[var(--panel-2)] border border-[var(--line)] rounded-lg p-1 text-xs z-50">
                <DropdownMenuItem className="gap-2 cursor-pointer rounded py-1.5 px-2.5 text-xs text-[var(--foreground)] hover:bg-[var(--line)]/40" onClick={() => alert("NovaCode v1.0.0 - Premium AI Code Editor")}>
                  <span>About NovaCode</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Center Side: Active Workspace & Filename */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] text-zinc-400 font-medium font-sans truncate max-w-[280px] sm:max-w-[400px] pointer-events-none">
          {activeFile ? `ai-code-editor - ${activeFile.name}` : "ai-code-editor"}
        </div>

        {/* Right Side: Layout Toggles + Profile */}
        <div className="flex items-center gap-1.5 z-10">
          {/* Quick Layout Toggles */}
          <div className="hidden sm:flex items-center gap-0.5 border-r border-[var(--line)]/30 pr-2 mr-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn("h-7 w-7 rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45", !leftCollapsed && "text-[var(--accent)] bg-[var(--accent)]/5")}
              title="Toggle Sidebar (Ctrl+B)"
              onClick={() => setLeftCollapsed(!leftCollapsed)}
            >
              <PanelLeftOpen size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn("h-7 w-7 rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45", outputVisible && "text-[var(--accent)] bg-[var(--accent)]/5")}
              title="Toggle Terminal"
              onClick={() => setOutputVisible(!outputVisible)}
            >
              <PanelBottom size={14} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className={cn("h-7 w-7 rounded text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/45", !rightCollapsed && "text-[var(--accent)] bg-[var(--accent)]/5")}
              title="Toggle AI Chat"
              onClick={() => setRightCollapsed(!rightCollapsed)}
            >
              <PanelRightOpen size={14} />
            </Button>
          </div>

          {/* User profile / Auth */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7.5 w-7.5 p-0 hover:bg-[var(--line)]/45 rounded-full cursor-pointer focus:outline-none flex items-center justify-center shrink-0">
                  <div className="relative h-6.5 w-6.5 overflow-hidden rounded-full border border-[var(--line)] bg-cyan-600 text-white font-bold text-xs flex items-center justify-center select-none shadow-sm hover:border-[var(--accent)] transition-all">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--panel-2)]/95 border border-[var(--line)]/45 rounded-xl p-1.5 text-xs backdrop-blur-md m-1 animate-in fade-in duration-200">
                <div className="px-3 py-2 mb-1 bg-[var(--panel)]/55 rounded-lg border border-[var(--line)]/30 m-0.5">
                  <p className="font-semibold text-[12.5px] text-[var(--foreground)]">{user.name}</p>
                  <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">{user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-[var(--line)]/30 mx-1" />
                <DropdownMenuItem asChild className="gap-2.5 cursor-pointer rounded-md m-0.5 py-2 px-3 text-xs">
                  <button onClick={() => {
                    setOpenFileIds(prev => prev.includes("settings") ? prev : [...prev, "settings"]);
                    setActiveTabId("settings");
                  }} className="flex w-full items-center gap-2 text-left cursor-pointer">
                    <Settings size={13} /> Settings
                  </button>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[var(--line)]/30 mx-1" />
                <DropdownMenuItem className="gap-2.5 cursor-pointer rounded-md text-rose-400 focus:text-rose-400 focus:bg-rose-400/10 m-0.5 py-2 px-3 text-xs" onClick={handleLogout}>
                  <LogOut size={13} /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-7.5 w-7.5 p-0 hover:bg-[var(--line)]/45 rounded-full cursor-pointer focus:outline-none flex items-center justify-center shrink-0">
                  <div className="relative h-6.5 w-6.5 overflow-hidden rounded-full border border-[var(--line)] bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center select-none shadow-sm hover:border-[var(--accent)] transition-all">
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[var(--panel-2)]/95 border border-[var(--line)]/45 rounded-xl p-1.5 text-xs backdrop-blur-md m-1 animate-in fade-in duration-200">
                <div className="px-3 py-2 mb-1 bg-[var(--panel)]/55 rounded-lg border border-[var(--line)]/30 m-0.5">
                  <p className="font-semibold text-[12.5px] text-[var(--foreground)]">Guest User</p>
                  <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">Not signed in</p>
                </div>
                <DropdownMenuSeparator className="bg-[var(--line)]/30 mx-1" />
                <DropdownMenuItem asChild className="gap-2.5 cursor-pointer rounded-md m-0.5 py-2 px-3 text-xs">
                  <Link href="/auth" className="flex w-full items-center gap-2 text-left cursor-pointer">
                    <LogIn size={13} /> Sign in
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      {/* Mobile Selector Panel */}
      <div className="hidden h-10 shrink-0 border-b border-[var(--line)] bg-[var(--panel)] p-1 max-md:flex">
        {(["files", "editor", "ai"] as const).map((panel) => (
          <button
            key={panel}
            className={`flex-1 rounded text-xs capitalize ${mobilePanel === panel ? "bg-[var(--accent)] text-[var(--background)] font-medium" : "text-[var(--muted)]"}`}
            onClick={() => setMobilePanel(panel)}
          >
            {panel}
          </button>
        ))}
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex min-h-0 flex-1 relative overflow-hidden bg-[var(--background)]">
        {/* A. VSCode Activity Bar (Far Left) */}
        <div className="vscode-activitybar max-md:hidden">
          <div className="flex flex-col items-center w-full gap-0.5">
            <button
              onClick={() => {
                if (leftCollapsed) {
                  setLeftCollapsed(false);
                  setActiveSidebarTab("explorer");
                } else if (activeSidebarTab === "explorer") {
                  setLeftCollapsed(true);
                } else {
                  setActiveSidebarTab("explorer");
                }
              }}
              className={cn("vscode-activitybar-btn", !leftCollapsed && activeSidebarTab === "explorer" && "active")}
              title="Explorer (Ctrl+B)"
            >
              <Folder size={20} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => {
                if (leftCollapsed) {
                  setLeftCollapsed(false);
                  setActiveSidebarTab("search");
                } else if (activeSidebarTab === "search") {
                  setLeftCollapsed(true);
                } else {
                  setActiveSidebarTab("search");
                }
              }}
              className={cn("vscode-activitybar-btn", !leftCollapsed && activeSidebarTab === "search" && "active")}
              title="Extensions (Search)"
            >
              <Puzzle size={20} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => {
                alert("GitHub Integration Mock");
              }}
              className="vscode-activitybar-btn"
              title="GitHub"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col items-center w-full pb-2">
            <button
              onClick={() => setRightCollapsed(prev => !prev)}
              className={cn("vscode-activitybar-btn", !rightCollapsed && "active")}
              title="AI Chat"
            >
              <Bot size={20} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => {
                setOpenFileIds(prev => prev.includes("settings") ? prev : [...prev, "settings"]);
                setActiveTabId("settings");
              }}
              className={cn("vscode-activitybar-btn", activeTabId === "settings" && "active")}
              title="Settings (Ctrl+,)"
            >
              <Settings size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* B. Left Sidebar */}
        {!leftCollapsed && (
          <div
            className="hidden md:flex flex-col shrink-0 overflow-hidden animate-slide-left border-r border-[var(--line)] bg-[var(--panel)]"
            style={{ width: leftWidth }}
          >
            {activeSidebarTab === "explorer" ? (
              <FileExplorer
                files={filesApi.files}
                folders={filesApi.folders}
                activeFileId={filesApi.activeFileId}
                onSelect={(id) => {
                  setOpenFileIds(prev => prev.includes(id) ? prev : [...prev, id]);
                  setActiveTabId(id);
                }}
                onCreateFile={(parentId) => filesApi.createFile("plaintext", parentId)}
                onCreateFolder={filesApi.createFolder}
                onRenameFile={filesApi.renameFile}
                onRenameFolder={filesApi.renameFolder}
                onDeleteFile={filesApi.deleteFile}
                onDeleteFolder={filesApi.deleteFolder}
              />
            ) : (
              <SearchPanel
                files={filesApi.files}
                onSelectMatch={handleSelectSearchMatch}
              />
            )}
          </div>
        )}

        {/* Mobile View Sidebar */}
        <div className={`${mobilePanel === "files" ? "block" : "hidden"} w-full md:hidden`}>
          {activeSidebarTab === "explorer" ? (
            <FileExplorer
              files={filesApi.files}
              folders={filesApi.folders}
              activeFileId={filesApi.activeFileId}
              onSelect={(id) => {
                setOpenFileIds(prev => prev.includes(id) ? prev : [...prev, id]);
                setActiveTabId(id);
                setMobilePanel("editor");
              }}
              onCreateFile={(parentId) => filesApi.createFile("plaintext", parentId)}
              onCreateFolder={filesApi.createFolder}
              onRenameFile={filesApi.renameFile}
              onRenameFolder={filesApi.renameFolder}
              onDeleteFile={filesApi.deleteFile}
              onDeleteFolder={filesApi.deleteFolder}
            />
          ) : (
            <SearchPanel
              files={filesApi.files}
              onSelectMatch={(fileId, line) => {
                handleSelectSearchMatch(fileId, line);
                setMobilePanel("editor");
              }}
            />
          )}
        </div>

        {/* C. Resizer Handle */}
        {!leftCollapsed && (
          <div
            className="group relative w-1.5 shrink-0 cursor-col-resize max-md:hidden flex items-center justify-center z-10 select-none"
            onMouseDown={() => startResize("left")}
            role="separator"
            aria-orientation="vertical"
          >
            <div className="h-12 w-0.5 rounded-full bg-[var(--line)] group-hover:bg-[var(--accent)] group-hover:w-1 transition-all duration-200" />
          </div>
        )}

        {/* D. Editor Pane */}
        <section className={cn("flex-1 min-w-0 flex flex-col border-r border-[var(--line)] bg-[var(--panel)]", mobilePanel === "editor" ? "flex" : "hidden md:flex")}>
          {/* Tab Bar Container */}
          <div className="flex h-9 shrink-0 items-center justify-between border-b border-[var(--line)] bg-[var(--panel)] select-none">
            {/* Scrollable Tabs */}
            <div className="vscode-tabbar">
              {openFileIds.map((id) => {
                const isSettings = id === "settings";
                const isActive = activeTabId === id;
                const file = filesApi.files.find((f) => f.id === id);
                if (!file && !isSettings) return null;

                return (
                  <div
                    key={id}
                    className={cn("vscode-tab", isActive && "active")}
                    onClick={() => setActiveTabId(id)}
                  >
                    {isSettings ? (
                      <Settings size={13} className="shrink-0 text-[var(--muted)]" />
                    ) : (
                      <FileIcon name={file!.name} size={13} className="shrink-0" />
                    )}
                    <span className="truncate text-xs font-normal">
                      {isSettings ? "Settings" : file!.name}
                    </span>
                    <button
                      className="vscode-tab-close"
                      onClick={(e) => handleCloseTab(id, e)}
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Editor Action Buttons (Run, Copy, etc. aligned right) */}
            {activeFile && (
              <div className="flex items-center gap-1 px-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1 animate-in fade-in duration-200"
                  onClick={runActiveFile}
                  disabled={isRunning || activeFile.language === "plaintext"}
                >
                  {isRunning ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : activeFile.language === "markdown" ? (
                    <Eye size={13} />
                  ) : (
                    <Play size={13} />
                  )}
                  <span className="hidden sm:inline">
                    {activeFile.language === "markdown" ? "Preview" : "Run"}
                  </span>
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-[var(--muted)] hover:text-[var(--foreground)] relative"
                  title="Copy code"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check size={13} className="text-green-500" />
                  ) : (
                    <Copy size={13} />
                  )}
                  {copied && (
                    <span className="absolute -top-7 right-0 rounded bg-[var(--foreground)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--background)]">
                      Copied
                    </span>
                  )}
                </Button>

                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-[var(--muted)] hover:text-[var(--foreground)]"
                  title={rightCollapsed ? "Open AI" : "Collapse AI"}
                  onClick={() => setRightCollapsed((v) => !v)}
                >
                  <Bot size={14} />
                </Button>
              </div>
            )}
          </div>

          {/* Breadcrumbs Bar */}
          {breadcrumbs.length > 0 && (
            <div className="vscode-breadcrumbs select-none">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id || idx}>
                  {idx > 0 && <ChevronRight size={10} className="text-[var(--muted)]/55 shrink-0" />}
                  <span className="vscode-breadcrumb-item truncate max-w-[120px] flex items-center gap-1">
                    {crumb.type === "root" && <Folder size={11} className="text-[var(--muted)] shrink-0" />}
                    {crumb.type === "folder" && <Folder size={11} className="text-[var(--accent)] shrink-0" />}
                    {crumb.type === "file" && <FileIcon name={crumb.name} size={11} className="shrink-0" />}
                    {crumb.type === "settings" && <Settings size={11} className="text-[var(--muted)] shrink-0" />}
                    <span>{crumb.name}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Editor Area Content */}
          <div className="flex-1 min-h-0 flex flex-col relative">
            {activeTabId === "settings" ? (
              <SettingsTab settings={settings} setSettings={setSettings} />
            ) : activeFile ? (
              <div className={`flex min-h-0 flex-1 animate-fade-in-soft ${viewMode === "preview" ? "flex-col" : terminalPosition === "right" ? "flex-row" : "flex-col"}`}>
                {viewMode !== "preview" && (
                  <div className="min-h-0 flex-1 relative bg-[var(--background)]">
                    <CodeEditor
                      key={`${activeFile.id}-${settings.theme}-${settings.fontFamily}-${settings.autocomplete}-${settings.ghostSuggestions}`}
                      value={activeFile.content}
                      language={activeFile.language}
                      settings={settings}
                      onChange={(content) => filesApi.updateFile(activeFile.id, { content })}
                      onCursorChange={(line, column) => setCursor({ line, column })}
                      onSelectionChange={(code) => {
                        setSelectedCode(code);
                        if (!code.trim()) setSelectionPos(null);
                      }}
                      onSelectionPosition={(pos) => {
                        if (!aiEditOpen) setSelectionPos(pos);
                      }}
                      onSelectionLinesChange={setSelectedLines}
                      highlightRange={highlightRange}
                    />
                  </div>
                )}
                <OutputPanel
                  visible={outputVisible}
                  result={runResult}
                  activeFile={activeFile}
                  files={filesApi.files}
                  position={terminalPosition}
                  size={terminalSize}
                  currentPath={currentPath}
                  onTogglePosition={() => setTerminalPosition(p => p === "bottom" ? "right" : "bottom")}
                  onResizeStart={() => startResize("terminal")}
                  onClose={() => setOutputVisible(false)}
                  viewMode={viewMode}
                  previewUrl={previewUrl}
                  isRunning={isRunning}
                />
              </div>
            ) : (
              /* Welcome Dashboard Screen */
              <div className="flex-1 overflow-y-auto bg-[var(--background)] select-none flex flex-col items-center justify-center animate-fade-in-soft">
                <div className="flex flex-col items-center justify-center -mt-10">
                  {/* Antigravity Logo */}
                  <svg className="w-[52px] h-[52px] text-[var(--foreground)] mb-4 opacity-90 drop-shadow-sm" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C9 3 7 9 5 14C3.8 17 2.5 20 1 20C4.5 19.5 7 16 8.5 12C9.5 15.5 11 17 12 17C13 17 14.5 15.5 15.5 12C17 16 19.5 19.5 23 20C21.5 20 20.2 17 19 14C17 9 15 3 12 3Z" />
                  </svg>

                  <h1 className="text-[20px] text-[var(--foreground)] font-normal mb-16 tracking-wide drop-shadow-sm">
                    Antigravity IDE
                  </h1>

                  <div className="flex items-center gap-[120px] text-[var(--muted)] text-[13px] hover:text-[var(--foreground)] transition-colors cursor-pointer" onClick={() => setAiEditOpen(true)}>
                    <span>Code with Agent</span>
                    <kbd className="font-mono text-[11px] px-2 py-0.5 bg-zinc-800/40 border border-zinc-700/50 rounded shadow-sm">Ctrl + L</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* E. Right AI Panel */}
        {!rightCollapsed && (
          <div
            className="group relative w-1.5 shrink-0 cursor-col-resize max-md:hidden flex items-center justify-center z-10 select-none"
            onMouseDown={() => startResize("right")}
            role="separator"
            aria-orientation="vertical"
          >
            <div className="h-12 w-0.5 rounded-full bg-[var(--line)] group-hover:bg-[var(--accent)] group-hover:w-1 transition-all duration-200" />
          </div>
        )}
        {!rightCollapsed && (
          <>
            {/* Desktop Right AI Panel */}
            <div
              className="hidden md:flex flex-col shrink-0 overflow-hidden animate-slide-right border-l border-[var(--line)] bg-[var(--panel)]"
              style={{ width: `min(100%, ${rightWidth}px)` }}
            >
              <AIChatPanel
                messages={ai.messages}
                loading={ai.loading}
                activeFile={activeFile}
                selectedCode={selectedCode}
                selectedLines={selectedLines}
                settings={settings}
                onPrompt={ai.sendMessage}
                onInsert={handleInsertCode}
                onClearChat={ai.clearMessages}
              />
            </div>
            {/* Mobile Right AI Panel */}
            <div className={cn("block md:hidden w-full h-full", mobilePanel === "ai" ? "block animate-slide-right" : "hidden")}>
              <AIChatPanel
                messages={ai.messages}
                loading={ai.loading}
                activeFile={activeFile}
                selectedCode={selectedCode}
                selectedLines={selectedLines}
                settings={settings}
                onPrompt={ai.sendMessage}
                onInsert={handleInsertCode}
                onClearChat={ai.clearMessages}
              />
            </div>
          </>
        )}
      </div>

      {/* 3. Full-width VSCode Status Bar at the bottom */}
      <StatusBar
        line={cursor.line}
        column={cursor.column}
        language={activeFile ? activeFile.language : "plaintext"}
        content={activeFile ? activeFile.content : ""}
        settings={settings}
      />

      {shared && (
        <div className="fixed bottom-16 right-5 z-50 flex items-center gap-2 rounded-lg bg-[var(--panel-2)] border border-[var(--line)] px-4 py-3 text-xs text-[var(--foreground)] animate-in fade-in slide-in-from-bottom-5 duration-200">
          <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-ping" />
          <span>Workspace share link copied to clipboard!</span>
        </div>
      )}

      {/* Edit with AI Modal */}
      {aiEditOpen && activeFile && (
        <AIEditModal
          selectedCode={selectedCode}
          language={activeFile.language}
          onClose={() => {
            setAiEditOpen(false);
            setSelectionPos(null);
          }}
          onApply={handleApplyAIEdit}
          onSendEditRequest={async (instruction, code) => {
            return ai.editCode(instruction, code);
          }}
        />
      )}
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
