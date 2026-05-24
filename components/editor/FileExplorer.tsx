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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [rootOpen, setRootOpen] = useState(true);


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
              "group flex h-[22px] items-center gap-1.5 pr-2 text-[13px] text-[var(--muted)] hover:bg-[var(--line)]/30 hover:text-[var(--foreground)] cursor-pointer select-none",
              active && "bg-[var(--accent)]/15 text-[var(--foreground)]"
            )}
            style={{ paddingLeft: `${depth * 14 + 22}px` }}
          >
            <FileIcon name={file.name} size={15} className="shrink-0" />
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
                  className={cn("h-5 text-xs py-0 px-1 bg-[var(--panel-2)]/65 border border-[var(--line)]/45 focus-visible:ring-[var(--accent)]/30 rounded-sm", error && "border-red-500 focus-visible:ring-red-500")}
                />
                {error && (
                  <div className="absolute left-0 top-full z-50 mt-1 whitespace-nowrap rounded bg-red-500 px-2 py-0.5 text-[10px] text-white shadow-md">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <button className={cn("min-w-0 flex-1 truncate text-left outline-none cursor-pointer", active && "text-[var(--accent)]")} onClick={() => onSelect(file.id)} title={file.name}>
                {file.name}
              </button>
            )}
            <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
              <Button size="icon" variant="ghost" className="h-5 w-5 text-[var(--muted)] hover:text-[var(--foreground)] rounded" title="Rename" onClick={(e) => { e.stopPropagation(); startRename({ type: "file", id: file.id }, file.name); }}>
                <Pencil size={11} />
              </Button>
              <Button size="icon" variant="ghost" className="h-5 w-5 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded" title="Delete" onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id); }}>
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
        
        let folderColor = "text-[var(--accent)]";
        const lowerName = folder.name.toLowerCase();
        if (lowerName === "node_modules") folderColor = "text-green-500";
        else if (lowerName === "server" || lowerName === "api" || lowerName === "build") folderColor = "text-orange-400";
        else if (lowerName === "public" || lowerName === "static") folderColor = "text-blue-400";
        else if (lowerName.startsWith(".")) folderColor = "text-zinc-500";

        return (
          <div key={folder.id}>
            <div
              className="group flex h-[22px] items-center gap-1 pr-1.5 text-[13px] text-[var(--muted)] hover:bg-[var(--line)]/30 hover:text-[var(--foreground)] cursor-pointer select-none"
              style={{ paddingLeft: `${depth * 14 + 4}px` }}
              onClick={() => toggleFolder(folder.id)}
            >
              <button className="text-[var(--muted)] p-0.5 hover:text-[var(--foreground)] outline-none cursor-pointer flex items-center justify-center w-[18px] h-[18px] shrink-0">
                {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>
              <Folder size={14} className={cn("shrink-0", folderColor)} fill={open ? "currentColor" : "none"} fillOpacity={open ? 0.2 : 0} />
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
                    className={cn("h-5 text-xs py-0 px-1 bg-[var(--panel-2)]/65 border border-[var(--line)]/45 focus-visible:ring-[var(--accent)]/30 rounded-sm", error && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {error && (
                    <div className="absolute left-0 top-full z-50 mt-1 whitespace-nowrap rounded bg-red-500 px-2 py-0.5 text-[10px] text-white shadow-md">
                      {error}
                    </div>
                  )}
                </div>
              ) : (
                <button className="min-w-0 flex-1 truncate text-left outline-none cursor-pointer" title={folder.name}>
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
                <Button size="icon" variant="ghost" className="h-5 w-5 text-[var(--muted)] hover:text-[var(--foreground)] rounded" title="Rename" onClick={(e) => { e.stopPropagation(); startRename({ type: "folder", id: folder.id }, folder.name); }}>
                  <Pencil size={11} />
                </Button>
                <Button size="icon" variant="ghost" className="h-5 w-5 text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded" title="Delete" onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}>
                  <Trash2 size={11} />
                </Button>
              </div>
            </div>
            {open && (
              <div>
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
        <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider">
          Explorer
        </div>
        <div className="flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="More actions" title="More Actions" size="icon" variant="ghost" className="h-5.5 w-5.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--line)]/30 rounded">
                <span className="text-[10px] font-bold pb-1 text-[var(--muted)]">...</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-[var(--panel-2)] border border-[var(--line)] p-1 text-xs text-[var(--foreground)] rounded-md">
              <DropdownMenuItem className="cursor-pointer py-1.5 px-2 rounded-md hover:bg-[var(--line)]" onClick={() => setRootOpen(true)}>Expand Workspace</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer py-1.5 px-2 rounded-md hover:bg-[var(--line)]" onClick={() => setRootOpen(false)}>Collapse Workspace</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-2">
        {/* Collapsible Root Folder Wrapper */}
        <div 
          className="group flex h-[22px] items-center gap-1 pr-3 text-[13px] text-[var(--muted)] hover:bg-[var(--line)]/20 cursor-pointer select-none transition-none"
          style={{ paddingLeft: "4px" }}
          onClick={() => setRootOpen(!rootOpen)}
        >
          <span className="text-[var(--muted)] mr-0.5 flex items-center justify-center w-[18px] h-[18px] shrink-0">
            {rootOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className="font-bold text-[13px] truncate text-[var(--foreground)] ml-0.5">ai-code-editor</span>
          
          <div className="hidden group-hover:flex items-center gap-0.5 ml-auto shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button size="icon" variant="ghost" className="h-5 w-5 text-[var(--muted)] hover:text-[var(--foreground)] rounded" title="New file" onClick={() => { setRootOpen(true); handleCreateFile(null); }}>
              <FilePlus2 size={11} />
            </Button>
            <Button size="icon" variant="ghost" className="h-5 w-5 text-[var(--muted)] hover:text-[var(--foreground)] rounded" title="New folder" onClick={() => { setRootOpen(true); handleCreateFolder(null); }}>
              <FolderPlus size={11} />
            </Button>
          </div>
        </div>

        {rootOpen && (
          <div>
            {renderFolders(null, 1)}
            {renderFiles(null, 1)}
          </div>
        )}
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
