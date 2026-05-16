"use client";

import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { editorExtensions, languageCompartment, languageExtension, tabSizeCompartment } from "@/lib/codemirror/extensions";
import { EditorSettings, Language } from "@/lib/types";

type CodeEditorProps = {
  value: string;
  language: Language;
  settings: EditorSettings;
  onChange: (value: string) => void;
  onCursorChange: (line: number, column: number) => void;
  onSelectionChange: (value: string) => void;
  highlightRange?: { from: number; to: number } | null;
};

import { highlightEffect } from "@/lib/codemirror/extensions";

export function CodeEditor({
  value,
  language,
  settings,
  onChange,
  onCursorChange,
  onSelectionChange,
  highlightRange,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const changeRef = useRef(onChange);
  const cursorRef = useRef(onCursorChange);
  const selectionRef = useRef(onSelectionChange);

  useEffect(() => {
    changeRef.current = onChange;
    cursorRef.current = onCursorChange;
    selectionRef.current = onSelectionChange;
  }, [onChange, onCursorChange, onSelectionChange]);

  useEffect(() => {
    if (!hostRef.current) return;
    const state = EditorState.create({
      doc: value,
      extensions: editorExtensions(
        language,
        settings,
        (next) => changeRef.current(next),
        (line, column) => {
          cursorRef.current(line, column);
          const view = viewRef.current;
          if (!view) return;
          const range = view.state.selection.main;
          selectionRef.current(range.empty ? "" : view.state.sliceDoc(range.from, range.to));
        },
      ),
    });
    const view = new EditorView({ state, parent: hostRef.current });
    viewRef.current = view;
    return () => view.destroy();
    // CodeMirror owns this DOM subtree; prop changes are reconfigured by the focused effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view || view.state.doc.toString() === value) return;
    view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: languageCompartment.reconfigure(languageExtension(language)),
    });
  }, [language]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: tabSizeCompartment.reconfigure(EditorState.tabSize.of(settings.tabSize)),
    });
  }, [settings.tabSize]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: highlightEffect.of(highlightRange ?? null),
    });
  }, [highlightRange]);

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />;
}
