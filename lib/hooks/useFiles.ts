"use client";

import { useEffect, useMemo, useState } from "react";
import { Language, WorkspaceDraftFile, WorkspaceFile, WorkspaceFolder } from "@/lib/types";
import { detectLanguage, filenameForLanguage, uid } from "@/lib/utils";

const STORAGE_KEY = "forge-ai-code-editor-files";

const starterFolders: WorkspaceFolder[] = [
  { id: "dir_node_modules", parentId: null, name: "node_modules", createdAt: new Date().toISOString() },
  { id: "dir_public", parentId: null, name: "public", createdAt: new Date().toISOString() },
  { id: "dir_src", parentId: null, name: "src", createdAt: new Date().toISOString() },
  { id: "dir_assets", parentId: "dir_src", name: "assets", createdAt: new Date().toISOString() },
  { id: "dir_styles", parentId: "dir_src", name: "styles", createdAt: new Date().toISOString() },
  { id: "dir_components", parentId: "dir_src", name: "components", createdAt: new Date().toISOString() },
  { id: "dir_pages", parentId: "dir_src", name: "pages", createdAt: new Date().toISOString() },
  { id: "dir_admin", parentId: "dir_src", name: "admin", createdAt: new Date().toISOString() },
  { id: "dir_divine_core", parentId: "dir_src", name: "divine-core", createdAt: new Date().toISOString() },
  { id: "dir_css", parentId: "dir_src", name: "css", createdAt: new Date().toISOString() },
  { id: "dir_javascript", parentId: "dir_src", name: "javascript", createdAt: new Date().toISOString() },
  { id: "dir_languages", parentId: "dir_src", name: "languages", createdAt: new Date().toISOString() },
];

const starterFiles: WorkspaceFile[] = [
  {
    id: "file_banner_tsx",
    parentId: "dir_components",
    name: "banner.tsx",
    language: "typescript",
    content: `import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";

const slides = [
  {
    id: 1,
    title: "AT TAXFARM. WE TURN YOUR CRYPTO TAXES INTO ACTUAL LAND",
    subtitle: "EVERY SFARM TOKEN YOU HOLD BUYS REAL LAND, GROWS REAL CROPS, AND PAYS YOU REAL MONEY FROM EACH HARVEST.",
    buttonText: "Shop now",
  },
  {
    id: 2,
    title: "GROW YOUR WEALTH WITH REAL WORLD ASSETS",
    subtitle: "NFTs BACKED BY REAL FARM LAND AND YIELD GENERATING AGRICULTURAL CONTRACTS.",
    buttonText: "Invest Now",
  },
  {
    id: 3,
    title: "AUTOMATED HARVEST YIELDS DIRECTLY TO YOUR WALLET",
    subtitle: "TRANSPARENT ON-CHAIN AGRICULTURAL YIELDS PAID OUT MONTHLY.",
    buttonText: "Learn More",
  }
];

export function Banner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="relative w-full h-[550px] overflow-hidden bg-zinc-950 font-sans flex items-center">
      {/* Background slide decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
      </div>

      {/* Slide content */}
      <div className="relative z-10 max-w-4xl mx-auto px-8 w-full">
        <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest bg-cyan-950/40 px-2.5 py-1 rounded border border-cyan-800/30">
          Slide {slides[currentSlide].id}
        </span>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mt-4 max-w-2xl leading-[1.15] uppercase">
          {slides[currentSlide].title}
        </h1>
        <p className="text-sm text-zinc-400 mt-4 max-w-xl leading-relaxed font-medium">
          {slides[currentSlide].subtitle}
        </p>
        <div className="flex items-center gap-4 mt-8">
          <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-semibold h-10 px-5 rounded-md flex items-center gap-2 transition-all">
            {slides[currentSlide].buttonText}
            <ArrowRight size={14} />
          </Button>
          <div className="flex gap-1">
            {slides.map((_, i) => (
              <button 
                key={i} 
                className={"h-1 rounded-full transition-all " + (currentSlide === i ? "w-6 bg-cyan-400" : "w-2 bg-zinc-700")}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Slide controls */}
      <button 
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-zinc-800 bg-black/40 text-zinc-400 hover:text-white hover:bg-black/80 transition-colors"
        onClick={prevSlide}
      >
        <ChevronLeft size={18} />
      </button>
      <button 
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full border border-zinc-800 bg-black/40 text-zinc-400 hover:text-white hover:bg-black/80 transition-colors"
        onClick={nextSlide}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "file_header_tsx",
    parentId: "dir_components",
    name: "header.tsx",
    language: "typescript",
    content: `import React from "react";

export function Header() {
  return (
    <header className="w-full py-4 px-6 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold text-sm">C</div>
        <span className="font-bold text-white tracking-tight">Codient</span>
      </div>
      <nav className="flex items-center gap-6 text-xs text-zinc-400">
        <a href="#features" className="hover:text-white transition-colors">Features</a>
        <a href="#about" className="hover:text-white transition-colors">About</a>
        <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
      </nav>
      <button className="bg-white hover:bg-zinc-200 text-black font-semibold text-xs py-1.5 px-3.5 rounded transition-all">
        Launch App
      </button>
    </header>
  );
}
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "file_codeeditor_tsx",
    parentId: "dir_components",
    name: "codeeditor.tsx",
    language: "typescript",
    content: `import React from "react";

export function CodeEditor() {
  return (
    <div className="flex-1 bg-black border border-zinc-900 rounded-xl p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-900">
        <span>editor.tsx</span>
        <span className="text-cyan-400">TypeScript</span>
      </div>
      <pre className="text-xs text-zinc-400 font-mono leading-relaxed mt-2">
        <code>{\`const editor = {
  theme: "codient-dark",
  font: "JetBrains Mono"
};\`}</code>
      </pre>
    </div>
  );
}
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "file_footer_tsx",
    parentId: "dir_components",
    name: "footer.tsx",
    language: "typescript",
    content: `import React from "react";

export function Footer() {
  return (
    <footer className="w-full py-6 px-6 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-600">
      <span>&copy; {new Date().getFullYear()} Codient Inc. All rights reserved.</span>
      <div className="flex gap-4">
        <a href="#" className="hover:text-zinc-400">Privacy</a>
        <a href="#" className="hover:text-zinc-400">Terms</a>
      </div>
    </footer>
  );
}
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "file_global_css",
    parentId: "dir_styles",
    name: "global.css",
    language: "css",
    content: `@import "tailwindcss";

body {
  background-color: #09090c;
  color: #f4f4f8;
  font-family: Inter, sans-serif;
}
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "file_product_js",
    parentId: "dir_src",
    name: "product.js",
    language: "javascript",
    content: `export const products = [
  { id: 1, name: "Premium Farm Lot", price: "$4,500", apr: "12%" },
  { id: 2, name: "Greenhouse Share", price: "$1,200", apr: "14.5%" }
];
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "file_router_tsx",
    parentId: "dir_src",
    name: "router.tsx",
    language: "typescript",
    content: `import React from "react";
// Simple mock routing
export const routes = {
  "/": "Home",
  "/editor": "Editor",
  "/settings": "Settings"
};
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "file_index_html",
    parentId: "dir_src",
    name: "index.html",
    language: "html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Codient - RWA Agriculture Platform</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>
`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useFiles() {
  const [files, setFiles] = useState<WorkspaceFile[]>(starterFiles);
  const [folders, setFolders] = useState<WorkspaceFolder[]>(starterFolders);
  const [activeFileId, setActiveFileId] = useState<string>("file_banner_tsx");
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const hasV2 = window.localStorage.getItem("novacode-files-initialized-v2");
    if (saved && hasV2) {
      try {
        const parsed = JSON.parse(saved) as { files: WorkspaceFile[]; folders?: WorkspaceFolder[]; activeFileId?: string };
        if (parsed.files?.length) {
          const uniqueFiles: WorkspaceFile[] = [];
          const seenFiles = new Set<string>();
          for (const file of parsed.files) {
            if (!seenFiles.has(file.id)) {
              seenFiles.add(file.id);
              uniqueFiles.push({ ...file, parentId: file.parentId ?? null });
            }
          }
          setFiles(uniqueFiles);

          const uniqueFolders: WorkspaceFolder[] = [];
          const seenFolders = new Set<string>();
          for (const folder of parsed.folders ?? []) {
            if (!seenFolders.has(folder.id)) {
              seenFolders.add(folder.id);
              uniqueFolders.push({ ...folder, parentId: folder.parentId ?? null });
            }
          }
          setFolders(uniqueFolders);

          setActiveFileId(parsed.activeFileId ?? uniqueFiles[0]?.id ?? "file_banner_tsx");
        }
      } catch (e) {
        console.error("Failed to load files from storage", e);
      }
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ files: starterFiles, folders: starterFolders, activeFileId: "file_banner_tsx" }));
      window.localStorage.setItem("novacode-open-tabs", JSON.stringify(["file_banner_tsx", "file_product_js", "file_index_html"]));
      window.localStorage.setItem("novacode-files-initialized-v2", "true");
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const handler = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ files, folders, activeFileId }));
    }, 800);
    return () => clearTimeout(handler);
  }, [files, folders, activeFileId, isInitialized]);

  const activeFile = useMemo(
    () => files.find((file) => file.id === activeFileId) ?? files[0],
    [activeFileId, files],
  );

  function updateFile(id: string, patch: Partial<WorkspaceFile>) {
    setFiles((current) =>
      current.map((file) =>
        file.id === id ? { ...file, ...patch, updatedAt: new Date().toISOString() } : file,
      ),
    );
  }

  function createFile(language: Language = "plaintext", parentId: string | null = null) {
    const now = new Date().toISOString();
    const baseName = filenameForLanguage(language, files.length + 1);
    
    let name = baseName;
    let counter = 1;
    while (files.some((f) => f.parentId === parentId && f.name === name)) {
      const parts = baseName.split(".");
      const ext = parts.pop();
      name = `${parts.join(".")}-${counter}.${ext}`;
      counter++;
    }

    let content = "";
    if (language === "java") {
      const className = name.replace(/\.java$/, "").replace(/[^a-zA-Z0-9]/g, "_");
      const validClassName = /^[0-9]/.test(className) ? `JavaClass_${className}` : className;
      content = `public class ${validClassName} {\n    public static void main(String[] args) {\n        System.out.println("Hello from ${name}!");\n    }\n}\n`;
    }

    const file: WorkspaceFile = {
      id: uid("file"),
      parentId,
      name,
      language,
      content,
      createdAt: now,
      updatedAt: now,
    };
    setFiles((current) => [...current, file]);
    setActiveFileId(file.id);
    return file.id;
  }

  function importFile(name: string, content: string, parentId: string | null = null) {
    const now = new Date().toISOString();
    let finalName = name;
    let counter = 1;
    while (files.some((f) => f.parentId === parentId && f.name === finalName)) {
      const parts = name.split(".");
      const ext = parts.length > 1 ? parts.pop() : "";
      const base = parts.join(".");
      finalName = ext ? `${base}-${counter}.${ext}` : `${base}-${counter}`;
      counter++;
    }

    let finalContent = content;
    const language = detectLanguage(finalName);

    if (language === "java" && content.trim() === "") {
      const className = finalName.replace(/\.java$/, "").replace(/[^a-zA-Z0-9]/g, "_");
      const validClassName = /^[0-9]/.test(className) ? `JavaClass_${className}` : className;
      finalContent = `public class ${validClassName} {\n    public static void main(String[] args) {\n        System.out.println("Hello from ${finalName}!");\n    }\n}\n`;
    }

    const file: WorkspaceFile = {
      id: uid("file"),
      parentId,
      name: finalName,
      language,
      content: finalContent,
      createdAt: now,
      updatedAt: now,
    };
    setFiles((current) => [...current, file]);
    setActiveFileId(file.id);
    return file.id;
  }

  function createFolder(parentId: string | null = null, name?: string) {
    const baseName = name || `folder-${folders.length + 1}`;
    let finalName = baseName;
    let counter = 1;
    while (folders.some((f) => f.parentId === parentId && f.name === finalName)) {
      finalName = `${baseName}-${counter}`;
      counter++;
    }

    const folder: WorkspaceFolder = {
      id: uid("folder"),
      parentId,
      name: finalName,
      createdAt: new Date().toISOString(),
    };
    setFolders((current) => [...current, folder]);
    return folder.id;
  }

  function ensureFolderPath(path: string, parentId: string | null = null) {
    const parts = path.split("/").map((part) => part.trim()).filter(Boolean);
    let cursor = parentId;

    for (const part of parts) {
      const existing = folders.find((folder) => folder.parentId === cursor && folder.name === part);
      cursor = existing?.id ?? createFolder(cursor, part);
    }

    return cursor;
  }

  function importProjectFiles(projectName: string, projectFiles: WorkspaceDraftFile[], parentId: string | null = null) {
    const projectFolderId = createFolder(parentId, projectName);
    const folderIds = new Map<string, string>([["", projectFolderId]]);
    const now = new Date().toISOString();
    const nextFiles: WorkspaceFile[] = [];

    function getFolderId(path: string) {
      const normalized = path.replace(/\\/g, "/").split("/").filter(Boolean).join("/");
      if (folderIds.has(normalized)) return folderIds.get(normalized)!;

      const parts = normalized.split("/");
      let cursorPath = "";
      let cursorId = projectFolderId;

      for (const part of parts) {
        cursorPath = cursorPath ? `${cursorPath}/${part}` : part;
        const knownId = folderIds.get(cursorPath);
        if (knownId) {
          cursorId = knownId;
          continue;
        }

        const folder: WorkspaceFolder = {
          id: uid("folder"),
          parentId: cursorId,
          name: part,
          createdAt: now,
        };
        folderIds.set(cursorPath, folder.id);
        cursorId = folder.id;
        setFolders((current) => [...current, folder]);
      }

      return cursorId;
    }

    projectFiles.forEach((file) => {
      const normalizedPath = file.path.replace(/\\/g, "/");
      const parts = normalizedPath.split("/").filter(Boolean);
      const name = parts.pop();
      if (!name) return;

      const parentPath = parts.join("/");
      const fileParentId = getFolderId(parentPath);
      nextFiles.push({
        id: uid("file"),
        parentId: fileParentId,
        name,
        language: detectLanguage(name),
        content: file.content,
        createdAt: now,
        updatedAt: now,
      });
    });

    setFiles((current) => [...current, ...nextFiles]);
    const firstEditableFile = nextFiles.find((file) => file.name === "App.jsx" || file.name === "App.tsx") ?? nextFiles[0];
    if (firstEditableFile) setActiveFileId(firstEditableFile.id);
    return projectFolderId;
  }

  function renameFolder(id: string, name: string): boolean {
    const target = folders.find((f) => f.id === id);
    if (!target) return false;
    if (folders.some((f) => f.id !== id && f.parentId === target.parentId && f.name === name)) {
      return false;
    }
    setFolders((current) => current.map((folder) => (folder.id === id ? { ...folder, name } : folder)));
    return true;
  }

  function deleteFolder(id: string) {
    const childFolderIds = new Set<string>([id]);
    let changed = true;
    while (changed) {
      changed = false;
      folders.forEach((folder) => {
        if (folder.parentId && childFolderIds.has(folder.parentId) && !childFolderIds.has(folder.id)) {
          childFolderIds.add(folder.id);
          changed = true;
        }
      });
    }
    setFolders((current) => current.filter((folder) => !childFolderIds.has(folder.id)));
    setFiles((current) => {
      const next = current.filter((file) => !file.parentId || !childFolderIds.has(file.parentId));
      if (!next.find((file) => file.id === activeFileId) && next[0]) setActiveFileId(next[0].id);
      return next.length ? next : current;
    });
  }

  function renameFile(id: string, name: string): boolean {
    const target = files.find((f) => f.id === id);
    if (!target) return false;
    if (files.some((f) => f.id !== id && f.parentId === target.parentId && f.name === name)) {
      return false;
    }

    const newLanguage = detectLanguage(name);
    const updates: Partial<WorkspaceFile> = { name, language: newLanguage };

    if (newLanguage === "java" && target.content.trim() === "") {
      const className = name.replace(/\.java$/, "").replace(/[^a-zA-Z0-9]/g, "_");
      const validClassName = /^[0-9]/.test(className) ? `JavaClass_${className}` : className;
      updates.content = `public class ${validClassName} {\n    public static void main(String[] args) {\n        System.out.println("Hello from ${name}!");\n    }\n}\n`;
    }

    updateFile(id, updates);
    return true;
  }

  function deleteFile(id: string) {
    setFiles((current) => {
      if (current.length === 1) return current;
      const next = current.filter((file) => file.id !== id);
      if (id === activeFileId) setActiveFileId(next[0].id);
      return next;
    });
  }

  return {
    files,
    folders,
    activeFile,
    activeFileId,
    setActiveFileId,
    updateFile,
    createFile,
    importFile,
    createFolder,
    ensureFolderPath,
    importProjectFiles,
    renameFile,
    renameFolder,
    deleteFile,
    deleteFolder,
    setFiles,
    setFolders,
    isInitialized,
  };
}
