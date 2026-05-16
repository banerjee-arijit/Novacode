import { GitBranch, Rows3 } from "lucide-react";
import { EditorSettings, Language, languageLabels } from "@/lib/types";
import { byteSize } from "@/lib/utils";

type StatusBarProps = {
  line: number;
  column: number;
  language: Language;
  content: string;
  settings: EditorSettings;
};

export function StatusBar({ line, column, language, content, settings }: StatusBarProps) {
  return (
    <footer className="flex h-8 items-center justify-between border-t border-[var(--line)] bg-[var(--panel)] px-3 text-xs text-[var(--muted)]">
      <div className="flex items-center gap-3">
        <span>Ln {line}, Col {column}</span>
        <span>{languageLabels[language]}</span>
        <span>{byteSize(content)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1"><Rows3 size={13} /> {settings.indentWithTabs ? "Tabs" : `Spaces: ${settings.tabSize}`}</span>
        <span className="flex items-center gap-1"><GitBranch size={13} /> Guest workspace</span>
      </div>
    </footer>
  );
}
