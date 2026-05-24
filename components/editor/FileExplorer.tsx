"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus2,
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceFile, WorkspaceFolder } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FileIcon } from "./FileIcon";

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

function FileExplorerComponent({
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
        const active = file.id === activeFileId;
        const isEditing = editing?.type === "file" && editing.id === file.id;
        return (
          <div
            key={file.id}
            className={cn(
              "group flex h-7 items-center gap-1.5 rounded-lg px-2 mx-1.5 text-xs text-[var(--muted)] hover:bg-[var(--line)]/30 hover:text-[var(--foreground)] transition-all cursor-pointer select-none",
              active && "bg-[var(--line)]/50 text-[var(--foreground)] shadow-sm font-medium"
            )}
          >
            <FileIcon name={file.name} size={14} className="shrink-0" />
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
                  className={cn("h-5 text-xs py-0 px-1 bg-[var(--panel-2)]/65 border border-[var(--line)]/45 focus-visible:ring-[var(--accent)]/30 rounded-md", error && "border-red-500 focus-visible:ring-red-500")}
                />
                {error && (
                  <div className="absolute left-0 top-full z-50 mt-1 whitespace-nowrap rounded bg-red-500 px-2 py-0.5 text-[10px] text-white shadow-md">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <button className="min-w-0 flex-1 truncate text-left text-xs outline-none cursor-pointer" onClick={() => onSelect(file.id)} title={file.name}>
                {file.name}
              </button>
            )}
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              <Button size="icon" variant="ghost" className="h-5 w-5 text-[var(--muted)] hover:text-[var(--foreground)] rounded" title="Rename" onClick={() => startRename({ type: "file", id: file.id }, file.name)}>
                <Pencil size={11} />
              </Button>
              <Button size="icon" variant="ghost" className="h-5 w-5 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded" title="Delete" onClick={() => onDeleteFile(file.id)}>
                <Trash2 size={11} />
              </Button>
            </div>
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
              className="group flex h-7 items-center gap-1 rounded-lg px-1.5 mx-1.5 text-xs text-[var(--muted)] hover:bg-[var(--line)]/30 hover:text-[var(--foreground)] transition-all cursor-pointer select-none"
            >
              <button onClick={() => toggleFolder(folder.id)} className="text-[var(--muted)] p-0.5 hover:text-[var(--foreground)] outline-none cursor-pointer">
                {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              <Folder size={13} className="text-[var(--accent)] shrink-0" />
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
                    className={cn("h-5 text-xs py-0 px-1 bg-[var(--panel-2)]/65 border border-[var(--line)]/45 focus-visible:ring-[var(--accent)]/30 rounded-md", error && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {error && (
                    <div className="absolute left-0 top-full z-50 mt-1 whitespace-nowrap rounded bg-red-500 px-2 py-0.5 text-[10px] text-white shadow-md">
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                <button className="min-w-0 flex-1 truncate text-left text-xs outline-none cursor-pointer" onClick={() => toggleFolder(folder.id)} title={folder.name}>
                  {folder.name}
                </button>
              )}
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <Button size="icon" variant="ghost" className="h-5 w-5 text-[var(--muted)] hover:text-[var(--foreground)] rounded" title="New file" onClick={(e) => { e.stopPropagation(); handleCreateFile(folder.id); }}>
                  <FilePlus2 size={11} />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 text-[var(--muted)] hover:text-[var(--foreground)] rounded" title="New folder" onClick={(e) => { e.stopPropagation(); handleCreateFolder(folder.id); }}>
                  <FolderPlus size={11} />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 text-[var(--muted)] hover:text-[var(--foreground)] rounded" title="Rename" onClick={() => startRename({ type: "folder", id: folder.id }, folder.name)}>
                  <Pencil size={11} />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded" title="Delete" onClick={() => onDeleteFolder(folder.id)}>
                  <Trash2 size={11} />
                </Button>
              </div>
            </div>
            {open && (
              <div className="ml-3.5 pl-2 border-l border-[var(--line)]/25 flex flex-col gap-0.5 my-0.5">
                {renderFolders(folder.id, depth + 1)}
                {renderFiles(folder.id, depth + 1)}
              </div>
            )}
          </div>
        );
      });
  }

  return (
    <aside className="flex h-full min-h-0 flex-col border-none bg-transparent select-none">
      <div className="flex h-9 items-center justify-between border-b border-[var(--line)]/25 px-3 bg-transparent shrink-0">
        <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)]">
          Workspace Explorer
        </div>
        <div className="flex items-center gap-0.5">
          <Button aria-label="Create file" title="New File" size="icon" variant="ghost" className="h-6 w-6 text-[var(--muted)] hover:text-[var(--foreground)] rounded" onClick={() => handleCreateFile(null)}>
            <FilePlus2 size={13} />
          </Button>
          <Button aria-label="Create folder" title="New Folder" size="icon" variant="ghost" className="h-6 w-6 text-[var(--muted)] hover:text-[var(--foreground)] rounded" onClick={() => handleCreateFolder(null)}>
            <FolderPlus size={13} />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-2">
        {renderFolders(null, 0)}
        {renderFiles(null, 0)}
      </div>
    </aside>
  );
}

export const FileExplorer = React.memo(FileExplorerComponent, (prevProps, nextProps) => {
  return (
    prevProps.activeFileId === nextProps.activeFileId &&
    prevProps.files === nextProps.files &&
    prevProps.folders === nextProps.folders
  );
});
