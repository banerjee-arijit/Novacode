import React from "react";
import { GitBranch, Rows3, Cpu } from "lucide-react";
import { EditorSettings, Language, languageLabels } from "@/lib/types";
import { byteSize } from "@/lib/utils";

type StatusBarProps = {
  line: number;
  column: number;
  language: Language;
  content: string;
  settings: EditorSettings;
};

function StatusBarComponent({ line, column, language, content, settings }: StatusBarProps) {
  return (
    <footer className="flex h-6 shrink-0 items-center justify-between bg-[var(--accent)] px-4 text-[10px] font-medium text-zinc-950 select-none">
      <div className="flex items-center gap-4 opacity-90">
        <span className="hover:opacity-100 transition-opacity cursor-default flex items-center gap-1">
          <Cpu size={9} className="opacity-70" />
          NovaCode AI
        </span>
        <span className="hover:opacity-100 transition-opacity cursor-default">Ln {line}, Col {column}</span>
        <span className="hover:opacity-100 transition-opacity cursor-default">{languageLabels[language]}</span>
        <span className="hover:opacity-100 transition-opacity cursor-default opacity-75">{byteSize(content)}</span>
      </div>
      <div className="flex items-center gap-4 opacity-90">
        <span className="flex items-center gap-1 hover:opacity-100 cursor-pointer transition-opacity">
          <Rows3 size={9} className="opacity-70" />
          {settings.indentWithTabs ? "Tabs" : `Spaces: ${settings.tabSize}`}
        </span>
        <span className="flex items-center gap-1 hover:opacity-100 cursor-pointer transition-opacity">
          <GitBranch size={9} className="opacity-70" />
          main
        </span>
      </div>
    </footer>
  );
}

export const StatusBar = React.memo(StatusBarComponent, (prevProps, nextProps) => {
  return (
    prevProps.line === nextProps.line &&
    prevProps.column === nextProps.column &&
    prevProps.language === nextProps.language &&
    prevProps.content === nextProps.content &&
    prevProps.settings === nextProps.settings
  );
});
