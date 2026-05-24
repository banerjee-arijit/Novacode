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
  onSelectionPosition?: (coords: { x: number; y: number } | null) => void;
  onSelectionLinesChange?: (lines: { start: number; end: number } | null) => void;
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
  onSelectionPosition,
  onSelectionLinesChange,
  highlightRange,
}: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const changeRef = useRef(onChange);
  const cursorRef = useRef(onCursorChange);
  const selectionRef = useRef(onSelectionChange);
  const selectionPositionRef = useRef(onSelectionPosition);
  const selectionLinesRef = useRef(onSelectionLinesChange);

  useEffect(() => {
    changeRef.current = onChange;
    cursorRef.current = onCursorChange;
    selectionRef.current = onSelectionChange;
    selectionPositionRef.current = onSelectionPosition;
    selectionLinesRef.current = onSelectionLinesChange;
  }, [onChange, onCursorChange, onSelectionChange, onSelectionPosition, onSelectionLinesChange]);

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
          const selectedText = range.empty ? "" : view.state.sliceDoc(range.from, range.to);
          selectionRef.current(selectedText);

          if (selectionLinesRef.current) {
            if (!range.empty && selectedText.trim().length > 0) {
              const startLine = view.state.doc.lineAt(range.from).number;
              const endLine = view.state.doc.lineAt(range.to).number;
              selectionLinesRef.current({ start: startLine, end: endLine });
            } else {
              selectionLinesRef.current(null);
            }
          }

          // Report selection position for tooltip
          if (selectionPositionRef.current) {
            if (!range.empty && selectedText.trim().length > 0) {
              try {
                // Get the coordinates of the start of selection
                const coords = view.coordsAtPos(range.from);
                if (coords) {
                  selectionPositionRef.current({ x: coords.left, y: coords.top });
                } else {
                  selectionPositionRef.current(null);
                }
              } catch {
                selectionPositionRef.current(null);
              }
            } else {
              selectionPositionRef.current(null);
            }
          }
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
    const view = viewRef.current;
    if (!view) return;
    if (highlightRange) {
      try {
        const { from } = highlightRange;
        if (from > 0 && from <= view.state.doc.lines) {
          const line = view.state.doc.line(from);
          view.dispatch({
            selection: { anchor: line.from },
            effects: [
              highlightEffect.of(highlightRange),
              EditorView.scrollIntoView(line.from, { y: "center" }),
            ],
          });
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    view.dispatch({
      effects: highlightEffect.of(highlightRange ?? null),
    });
  }, [highlightRange]);

  return <div ref={hostRef} className="h-full min-h-0 overflow-hidden" />;
}
