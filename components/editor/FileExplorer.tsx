"use client";

import { useEffect, useState } from "react";
import {
  Braces,
  ChevronDown,
  ChevronRight,
  Code2,
  FileCode2,
  FilePlus2,
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Language, WorkspaceFile, WorkspaceFolder } from "@/lib/types";
import { cn } from "@/lib/utils";

const iconMap: Record<Language, React.ElementType> = {
  javascript: Braces,
  typescript: Code2,
  python: FileCode2,
  html: FileCode2,
  css: FileCode2,
  java: FileCode2,
  plaintext: FileText,
};

type FileExplorerProps = {
  files: WorkspaceFile[];
  folders: WorkspaceFolder[];
  activeFileId: string;
  onSelect: (id: string) => void;
  onCreateFile: (parentId?: string | null) => string | undefined | void;
  onCreateFolder: (parentId?: string | null) => string | undefined | void;
  onRenameFile: (id: string, name: string) => boolean | void;
  onRenameFolder: (id: string, name: string) => boolean | void;
  onDeleteFile: (id: string) => void;
  onDeleteFolder: (id: string) => void;
};

type EditingTarget = { type: "file" | "folder"; id: string } | null;

export function FileExplorer({
  files,
  folders,
  activeFileId,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onRenameFile,
  onRenameFolder,
  onDeleteFile,
  onDeleteFolder,
}: FileExplorerProps) {
  const [editing, setEditing] = useState<EditingTarget>(null);
  const [draft, setDraft] = useState("");
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(folders.map((folder) => folder.id)));

  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function startRename(target: EditingTarget, name: string) {
    setEditing(target);
    setDraft(name);
    setError(null);
  }

  function commitRename() {
    if (editing && draft.trim()) {
      let success = true;
      if (editing.type === "file") success = onRenameFile(editing.id, draft.trim()) !== false;
      if (editing.type === "folder") success = onRenameFolder(editing.id, draft.trim()) !== false;
      
      if (!success) {
        setError("Name already exists");
        return;
      }
    }
    setEditing(null);
    setError(null);
  }

  function handleCreateFile(parentId: string | null = null) {
    const newId = onCreateFile(parentId);
    if (typeof newId === "string") {
      if (parentId) setOpenFolders((prev) => new Set(prev).add(parentId));
      setTimeout(() => {
        const file = files.find(f => f.id === newId);
        startRename({ type: "file", id: newId }, file?.name || "");
      }, 0);
    }
  }

  function handleCreateFolder(parentId: string | null = null) {
    const newId = onCreateFolder(parentId);
    if (typeof newId === "string") {
      if (parentId) setOpenFolders((prev) => new Set(prev).add(parentId));
      setTimeout(() => {
        const folder = folders.find(f => f.id === newId);
        startRename({ type: "folder", id: newId }, folder?.name || "");
      }, 0);
    }
  }

  function toggleFolder(id: string) {
    setOpenFolders((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderFiles(parentId: string | null, depth: number) {
    return files
      .filter((file) => file.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((file) => {
        const Icon = iconMap[file.language];
        const active = file.id === activeFileId;
        const isEditing = editing?.type === "file" && editing.id === file.id;
        return (
          <div
            key={file.id}
            className={cn(
              "group flex h-8 items-center gap-1 rounded px-2 text-sm text-[var(--muted)] hover:bg-[var(--panel-2)]",
              active && "bg-[var(--panel-2)] text-[var(--foreground)]",
            )}
            style={{ paddingLeft: 8 + depth * 14 }}
          >
            <Icon size={14} className={active ? "text-[var(--accent)]" : "text-[var(--muted)]"} />
            {isEditing ? (
              <div className="relative flex-1">
                <Input
                  value={draft}
                  autoFocus
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setError(null);
                  }}
                  onBlur={commitRename}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitRename();
                    if (event.key === "Escape") {
                      setEditing(null);
                      setError(null);
                    }
                  }}
                  className={cn("h-6", error && "border-red-500 focus-visible:ring-red-500")}
                />
                {error && (
                  <div className="absolute left-0 top-full z-50 mt-1 whitespace-nowrap rounded bg-red-500 px-2 py-1 text-xs text-white shadow-md">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <button className="min-w-0 flex-1 truncate text-left" onClick={() => onSelect(file.id)} title={file.name}>
                {file.name}
              </button>
            )}
            <Button size="icon" variant="ghost" className="hidden h-6 w-6 group-hover:inline-flex" title="Rename" onClick={() => startRename({ type: "file", id: file.id }, file.name)}>
              <Pencil size={12} />
            </Button>
            <Button size="icon" variant="ghost" className="hidden h-6 w-6 group-hover:inline-flex" title="Delete" onClick={() => onDeleteFile(file.id)}>
              <Trash2 size={12} />
            </Button>
          </div>
        );
      });
  }

  function renderFolders(parentId: string | null, depth: number): React.ReactNode {
    return folders
      .filter((folder) => folder.parentId === parentId)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((folder) => {
        const open = openFolders.has(folder.id);
        const isEditing = editing?.type === "folder" && editing.id === folder.id;
        return (
          <div key={folder.id}>
            <div
              className="group flex h-8 items-center gap-1 rounded px-2 text-sm text-[var(--muted)] hover:bg-[var(--panel-2)]"
              style={{ paddingLeft: 6 + depth * 14 }}
            >
              <button onClick={() => toggleFolder(folder.id)} className="text-[var(--muted)]">
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <Folder size={14} className="text-[var(--accent)]" />
              {isEditing ? (
                <div className="relative flex-1">
                  <Input
                    value={draft}
                    autoFocus
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setError(null);
                    }}
                    onBlur={commitRename}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitRename();
                      if (event.key === "Escape") {
                        setEditing(null);
                        setError(null);
                      }
                    }}
                    className={cn("h-6", error && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {error && (
                    <div className="absolute left-0 top-full z-50 mt-1 whitespace-nowrap rounded bg-red-500 px-2 py-1 text-xs text-white shadow-md">
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                <button className="min-w-0 flex-1 truncate text-left" onClick={() => toggleFolder(folder.id)} title={folder.name}>
                  {folder.name}
                </button>
              )}
              <Button size="icon" variant="ghost" className="hidden h-6 w-6 group-hover:inline-flex" title="New file" onClick={(e) => { e.stopPropagation(); handleCreateFile(folder.id); }}>
                <FilePlus2 size={12} />
              </Button>
              <Button size="icon" variant="ghost" className="hidden h-6 w-6 group-hover:inline-flex" title="New folder" onClick={(e) => { e.stopPropagation(); handleCreateFolder(folder.id); }}>
                <FolderPlus size={12} />
              </Button>
              <Button size="icon" variant="ghost" className="hidden h-6 w-6 group-hover:inline-flex" title="Rename" onClick={() => startRename({ type: "folder", id: folder.id }, folder.name)}>
                <Pencil size={12} />
              </Button>
              <Button size="icon" variant="ghost" className="hidden h-6 w-6 group-hover:inline-flex" title="Delete" onClick={() => onDeleteFolder(folder.id)}>
                <Trash2 size={12} />
              </Button>
            </div>
            {open && (
              <>
                {renderFolders(folder.id, depth + 1)}
                {renderFiles(folder.id, depth + 1)}
              </>
            )}
          </div>
        );
      });
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-[var(--line)] bg-[var(--panel)]">
      <div className="flex h-12 items-center justify-between border-b border-[var(--line)] px-3">
        <div className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
          <Folder size={16} className="text-[var(--accent)]" />
          Workspace
        </div>
        <div className="flex items-center">
          <Button aria-label="Create file" title="Create file" size="icon" variant="ghost" onClick={() => handleCreateFile(null)}>
            <FilePlus2 size={16} />
          </Button>
          <Button aria-label="Create folder" title="Create folder" size="icon" variant="ghost" onClick={() => handleCreateFolder(null)}>
            <FolderPlus size={16} />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {isMounted && (
          <>
            {renderFolders(null, 0)}
            {renderFiles(null, 0)}
          </>
        )}
      </div>
    </aside>
  );
}
