"use client";

import { useEffect, useMemo, useState } from "react";
import { Language, WorkspaceFile, WorkspaceFolder } from "@/lib/types";
import { detectLanguage, filenameForLanguage, uid } from "@/lib/utils";

const STORAGE_KEY = "forge-ai-code-editor-files";

const starterFiles: WorkspaceFile[] = [
  {
    id: uid("file"),
    parentId: null,
    name: "main.ts",
    language: "typescript",
    content: `type User = {\n  id: number;\n  name: string;\n  active: boolean;\n};\n\nconst users: User[] = [\n  { id: 1, name: "Ada", active: true },\n  { id: 2, name: "Grace", active: false },\n  { id: 3, name: "Linus", active: true },\n];\n\nfunction getActiveUsers(items: User[]) {\n  return items.filter((user) => user.active).map((user) => user.name);\n}\n\nconsole.log(getActiveUsers(users));\n`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uid("file"),
    parentId: null,
    name: "preview.html",
    language: "html",
    content: `<main>\n  <h1>Hello from Novacode</h1>\n  <p>Edit this HTML and click Run to preview it.</p>\n</main>\n`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uid("file"),
    parentId: null,
    name: "styles.css",
    language: "css",
    content: `body {\n  margin: 0;\n  min-height: 100vh;\n  display: grid;\n  place-items: center;\n  background: #07111d;\n  color: #dff7ff;\n  font-family: Inter, system-ui, sans-serif;\n}\n\nmain {\n  max-width: 520px;\n  padding: 48px;\n}\n`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useFiles() {
  const [files, setFiles] = useState<WorkspaceFile[]>(starterFiles);
  const [folders, setFolders] = useState<WorkspaceFolder[]>([]);
  const [activeFileId, setActiveFileId] = useState<string>(starterFiles[0].id);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { files: WorkspaceFile[]; folders?: WorkspaceFolder[]; activeFileId?: string };
        if (parsed.files?.length) {
          setFiles(parsed.files.map((file) => ({ ...file, parentId: file.parentId ?? null })));
          setFolders(parsed.folders ?? []);
          setActiveFileId(parsed.activeFileId ?? parsed.files[0].id);
        }
      } catch (e) {
        console.error("Failed to load files from storage", e);
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ files, folders, activeFileId }));
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

  function createFile(language: Language = "javascript", parentId: string | null = null) {
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
    renameFile,
    renameFolder,
    deleteFile,
    deleteFolder,
    setFiles,
  };
}
