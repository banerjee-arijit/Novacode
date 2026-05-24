"use client";

import React, { useState, useMemo } from "react";
import { Search as SearchIcon, ChevronDown, ChevronRight, X, File } from "lucide-react";
import { WorkspaceFile } from "@/lib/types";
import { FileIcon } from "./FileIcon";
import { cn } from "@/lib/utils";

type SearchPanelProps = {
  files: WorkspaceFile[];
  onSelectMatch: (fileId: string, lineNumber: number) => void;
};

function SearchPanelComponent({ files, onSelectMatch }: SearchPanelProps) {
  const [query, setQuery] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: Array<{
      file: WorkspaceFile;
      matches: Array<{
        lineNumber: number;
        lineContent: string;
        matchStart: number;
        matchEnd: number;
      }>;
    }> = [];

    // Escape regex characters if regex mode is off
    const escapeRegExp = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    };

    let regex: RegExp;
    try {
      let pattern = query;
      if (!useRegex) {
        pattern = escapeRegExp(query);
      }
      if (wholeWord) {
        pattern = `\\b${pattern}\\b`;
      }
      const flags = "gd" in RegExp.prototype ? "gd" : "g"; // Use standard global search
      const caseFlag = caseSensitive ? "" : "i";
      regex = new RegExp(pattern, flags + caseFlag);
    } catch (e) {
      // Invalid regex pattern
      return [];
    }

    for (const file of files) {
      const lines = file.content.split("\n");
      const fileMatches: Array<{
        lineNumber: number;
        lineContent: string;
        matchStart: number;
        matchEnd: number;
      }> = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        regex.lastIndex = 0;
        
        // Match the line
        const match = regex.exec(line);
        if (match) {
          fileMatches.push({
            lineNumber: i + 1,
            lineContent: line,
            matchStart: match.index,
            matchEnd: match.index + match[0].length,
          });
        }
      }

      if (fileMatches.length > 0) {
        results.push({
          file,
          matches: fileMatches,
        });
      }
    }

    return results;
  }, [files, query, caseSensitive, wholeWord, useRegex]);

  const totalMatches = useMemo(() => {
    return searchResults.reduce((acc, result) => acc + result.matches.length, 0);
  }, [searchResults]);

  const toggleFileCollapse = (fileId: string) => {
    setCollapsedFiles((current) => {
      const next = new Set(current);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  };

  const highlightMatchInSnippet = (content: string, start: number, end: number) => {
    const trimmed = content.trimStart();
    const leadingWhitespaceLen = content.length - trimmed.length;
    const adjStart = Math.max(0, start - leadingWhitespaceLen);
    const adjEnd = Math.max(0, end - leadingWhitespaceLen);
    
    // Limit width of display line if very long
    let displayStr = trimmed;
    let finalStart = adjStart;
    let finalEnd = adjEnd;
    
    if (displayStr.length > 100) {
      if (adjStart > 40) {
        displayStr = "..." + displayStr.slice(adjStart - 30);
        finalStart = 33; // 3 dots + 30 chars
        finalEnd = finalStart + (adjEnd - adjStart);
      }
      if (displayStr.length > 100) {
        displayStr = displayStr.slice(0, 97) + "...";
      }
    }

    const before = displayStr.slice(0, finalStart);
    const matchText = displayStr.slice(finalStart, finalEnd);
    const after = displayStr.slice(finalEnd);

    return (
      <span className="truncate">
        {before}
        <mark className="bg-[var(--accent)]/20 text-[var(--foreground)] border border-[var(--accent)]/30 rounded-md px-1 py-0.5 mx-0.5 font-medium">{matchText}</mark>
        {after}
      </span>
    );
  };

  return (
    <aside className="flex h-full min-h-0 flex-col border-none bg-transparent">
      <div className="flex h-9 items-center justify-between border-b border-[var(--line)]/25 px-3 bg-transparent shrink-0">
        <div className="text-[10px] uppercase tracking-wider font-bold text-[var(--muted)]">
          Search Workspace
        </div>
      </div>

      <div className="p-3 shrink-0 flex flex-col gap-2 border-b border-[var(--line)]/25">
        <div className="relative flex items-center bg-[var(--panel-2)]/65 border border-[var(--line)]/45 rounded-lg focus-within:border-[var(--accent)]/55 focus-within:ring-1 focus-within:ring-[var(--accent)]/30 transition-all">
          <input
            type="text"
            placeholder="Search text..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none py-1.5 pl-3 pr-24 text-xs text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
            spellCheck={false}
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              onClick={() => setCaseSensitive(!caseSensitive)}
              className={cn(
                "w-5 h-5 text-[10px] font-mono font-semibold rounded-md flex items-center justify-center transition-all cursor-pointer",
                caseSensitive
                  ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/25"
                  : "text-[var(--muted)] hover:bg-[var(--line)]/50 hover:text-[var(--foreground)] border border-transparent"
              )}
              title="Match Case (Aa)"
            >
              Aa
            </button>
            <button
              onClick={() => setWholeWord(!wholeWord)}
              className={cn(
                "w-5 h-5 text-[10px] font-mono font-semibold rounded-md flex items-center justify-center transition-all cursor-pointer",
                wholeWord
                  ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/25"
                  : "text-[var(--muted)] hover:bg-[var(--line)]/50 hover:text-[var(--foreground)] border border-transparent"
              )}
              title="Match Whole Word (ab)"
            >
              ab
            </button>
            <button
              onClick={() => setUseRegex(!useRegex)}
              className={cn(
                "w-5 h-5 text-[10px] font-mono font-semibold rounded-md flex items-center justify-center transition-all cursor-pointer",
                useRegex
                  ? "bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/25"
                  : "text-[var(--muted)] hover:bg-[var(--line)]/50 hover:text-[var(--foreground)] border border-transparent"
              )}
              title="Use Regular Expression (.*)"
            >
              .*
            </button>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[var(--muted)] hover:text-[var(--foreground)] p-0.5 rounded-md hover:bg-[var(--line)]/50 cursor-pointer"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {query && (
          <div className="text-[10px] text-[var(--muted)] px-1">
            {totalMatches > 0 ? (
              <span>
                Found {totalMatches} match{totalMatches > 1 ? "es" : ""} in {searchResults.length} file{searchResults.length > 1 ? "s" : ""}
              </span>
            ) : (
              <span>No results found.</span>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-2">
        {searchResults.map(({ file, matches }) => {
          const collapsed = collapsedFiles.has(file.id);
          return (
            <div key={file.id} className="mb-2">
              {/* File header */}
              <button
                onClick={() => toggleFileCollapse(file.id)}
                className="flex items-center gap-1.5 w-full text-left rounded-lg hover:bg-[var(--line)]/30 p-1.5 px-2 text-xs text-[var(--foreground)] font-medium group transition-all cursor-pointer"
              >
                <span className="text-[var(--muted)] cursor-pointer">
                  {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
                </span>
                <FileIcon name={file.name} size={14} />
                <span className="truncate flex-1" title={file.name}>
                  {file.name}
                </span>
                <span className="text-[10px] bg-[var(--line)]/50 px-2 py-0.5 rounded-full text-[var(--muted)] shrink-0 font-mono">
                  {matches.length}
                </span>
              </button>

              {/* Match list */}
              {!collapsed && (
                <div className="mt-1 pl-3.5 flex flex-col gap-0.5 border-l border-[var(--line)]/25 ml-2.5">
                  {matches.map((match, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectMatch(file.id, match.lineNumber)}
                      className="flex items-center gap-2.5 w-full text-left rounded-md hover:bg-[var(--line)]/40 py-1.5 px-2 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-all font-mono cursor-pointer"
                    >
                      <span className="text-[10px] text-[var(--accent)] font-semibold shrink-0 w-6 text-right font-sans opacity-85">
                        {match.lineNumber}
                      </span>
                      {highlightMatchInSnippet(
                        match.lineContent,
                        match.matchStart,
                        match.matchEnd
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export const SearchPanel = React.memo(SearchPanelComponent, (prevProps, nextProps) => {
  return prevProps.files === nextProps.files;
});
