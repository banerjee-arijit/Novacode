import { closeBrackets, closeBracketsKeymap, completionKeymap, autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import {
  bracketMatching,
  codeFolding,
  foldGutter,
  foldKeymap,
  indentOnInput,
  LanguageSupport,
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { lintGutter } from "@codemirror/lint";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { Compartment, EditorState, Extension, StateEffect, StateField } from "@codemirror/state";
import {
  crosshairCursor,
  Decoration,
  DecorationSet,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
  rectangularSelection,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import { EditorSettings, Language } from "@/lib/types";

export const languageCompartment = new Compartment();
export const tabSizeCompartment = new Compartment();
export const highlightEffect = StateEffect.define<{ from: number; to: number } | null>();

export const highlightField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(highlightEffect)) {
        if (!effect.value) return Decoration.none;
        const { from, to } = effect.value;
        const deco = [];
        for (let i = from; i <= to; i++) {
          if (i <= tr.state.doc.lines) {
            deco.push(Decoration.line({ class: "cm-inserted-line" }).range(tr.state.doc.line(i).from));
          }
        }
        return Decoration.set(deco);
      }
    }
    return decorations;
  },
  provide: (f) => EditorView.decorations.from(f),
});

export function languageExtension(language: Language): LanguageSupport {
  if (language === "python") return python();
  if (language === "html") return html();
  if (language === "css") return css();
  if (language === "java") return java();
  if (language === "plaintext") return [] as unknown as LanguageSupport;
  return javascript({ jsx: true, typescript: language === "typescript" });
}

export function editorExtensions(
  language: Language,
  settings: EditorSettings,
  onUpdate: (value: string) => void,
  onCursor: (line: number, column: number) => void,
): Extension[] {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    foldGutter(),
    codeFolding(),
    drawSelection(),
    dropCursor(),
    EditorState.allowMultipleSelections.of(true),
    indentOnInput(),
    bracketMatching(),
    closeBrackets(),
    ...(settings.autocomplete ? [autocompletion({ override: [(context) => forgeCompletionSource(context, language)] })] : []),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    lintGutter(),
    ...(settings.theme === "light" ? [syntaxHighlighting(defaultHighlightStyle)] : [syntaxHighlighting(oneDarkHighlightStyle)]),
    highlightField,
    languageCompartment.of(languageExtension(language)),
    tabSizeCompartment.of(EditorState.tabSize.of(settings.tabSize)),
    EditorState.changeFilter.of(() => true),
    keymap.of([
      ...(settings.ghostSuggestions ? [{ key: "Tab", run: acceptGhostSuggestion }] : []),
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...(settings.autocomplete ? completionKeymap : []),
      indentWithTab,
    ]),
    ...(settings.ghostSuggestions ? [ghostSuggestionExtension()] : []),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) onUpdate(update.state.doc.toString());
      if (update.selectionSet || update.docChanged) {
        const head = update.state.selection.main.head;
        const line = update.state.doc.lineAt(head);
        onCursor(line.number, head - line.from + 1);
      }
    }),
    EditorView.theme({
      "&": {
        height: "100%",
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      },
      ".cm-content": {
        caretColor: "var(--accent)",
        padding: "18px 0",
      },
      ".cm-gutters": {
        backgroundColor: "var(--background)",
        color: "var(--muted)",
        borderRight: "1px solid var(--line)",
      },
      ".cm-activeLineGutter, .cm-activeLine": {
        backgroundColor: "color-mix(in srgb, var(--accent) 12%, transparent)",
      },
      ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
        backgroundColor: "color-mix(in srgb, var(--accent) 24%, transparent)",
      },
      ".cm-foldGutter span": {
        color: "var(--muted)",
      },
      ".cm-inserted-line": {
        backgroundColor: "color-mix(in srgb, var(--accent) 15%, transparent)",
        boxShadow: "inset 2px 0 0 var(--accent)",
        animation: "cm-inserted-pulse 3s cubic-bezier(0.4, 0, 0.2, 1) forwards",
      },
      "@keyframes cm-inserted-pulse": {
        "0%": { 
          backgroundColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
          boxShadow: "inset 4px 0 0 var(--accent)" 
        },
        "10%": { 
          backgroundColor: "color-mix(in srgb, var(--accent) 20%, transparent)",
          boxShadow: "inset 4px 0 0 var(--accent)" 
        },
        "100%": { 
          backgroundColor: "transparent",
          boxShadow: "inset 0 0 0 var(--accent)" 
        },
      },
    }, { dark: settings.theme !== "light" }),
  ];
}

function forgeCompletionSource(context: CompletionContext, language: Language) {
  const word = context.matchBefore(language === "css" ? /[-\w]*/ : /\w*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;
  return {
    from: word.from,
    options: completionOptions(language),
  };
}

function completionOptions(language: Language) {
  if (language === "html") {
    return [
      { label: "html:5", type: "text", apply: "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>" },
      { label: "div", type: "type", apply: "<div></div>" },
      { label: "section", type: "type", apply: "<section>\n  \n</section>" },
      { label: "main", type: "type", apply: "<main>\n  \n</main>" },
      { label: "button", type: "type", apply: "<button type=\"button\"></button>" },
      { label: "input", type: "type", apply: "<input type=\"text\" />" },
      { label: "link:css", type: "text", apply: "<link rel=\"stylesheet\" href=\"styles.css\">" },
      { label: "script", type: "type", apply: "<script src=\"script.js\"></script>" },
    ];
  }
  if (language === "css") {
    return [
      { label: "display", type: "property", apply: "display: flex;" },
      { label: "grid", type: "property", apply: "display: grid;" },
      { label: "place-items", type: "property", apply: "place-items: center;" },
      { label: "color", type: "property", apply: "color: #ffffff;" },
      { label: "background", type: "property", apply: "background: #0f172a;" },
      { label: "font-family", type: "property", apply: "font-family: system-ui, sans-serif;" },
      { label: "margin", type: "property", apply: "margin: 0;" },
      { label: "padding", type: "property", apply: "padding: 1rem;" },
      { label: "border-radius", type: "property", apply: "border-radius: 0.5rem;" },
      { label: "media", type: "keyword", apply: "@media (max-width: 768px) {\n  \n}" },
    ];
  }
  return [
    { label: "console.log", type: "function", apply: "console.log();" },
    { label: "function", type: "keyword", apply: "function name() {\n  \n}" },
    { label: "for", type: "keyword", apply: "for (let i = 0; i < length; i++) {\n  \n}" },
    { label: "if", type: "keyword", apply: "if (condition) {\n  \n}" },
    { label: "public static void main", type: "function", apply: "public static void main(String[] args) {\n    \n}" },
    { label: "System.out.println", type: "function", apply: "System.out.println();" },
    { label: "print", type: "function", apply: "print()" },
  ];
}

class GhostWidget extends WidgetType {
  constructor(private text: string) {
    super();
  }

  toDOM() {
    const span = document.createElement("span");
    span.textContent = this.text;
    span.style.opacity = "0.38";
    span.style.pointerEvents = "none";
    span.style.fontStyle = "italic";
    return span;
  }
}

function ghostSuggestionExtension() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = ghostDecorations(view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = ghostDecorations(update.view);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}

function ghostDecorations(view: EditorView) {
  const cursor = view.state.selection.main;
  if (!cursor.empty) return Decoration.none;

  const line = view.state.doc.lineAt(cursor.head);
  const prefix = line.text.slice(0, cursor.head - line.from);
  const suggestion = ghostText(prefix);
  if (!suggestion) return Decoration.none;

  return Decoration.set([Decoration.widget({ widget: new GhostWidget(suggestion), side: 1 }).range(cursor.head)]);
}

function ghostText(prefix: string) {
  const token = prefix.match(/[A-Za-z_$][\w$]*$/)?.[0] ?? "";
  if (!token) return "";
  const suggestion = ghostSuggestionForToken(token);
  if (!suggestion || suggestion === token) return "";
  return suggestion.slice(token.length);
}

function ghostSuggestionForToken(token: string) {
  const options = [
    "console.log();",
    "function name() {\n  \n}",
    "for (let i = 0; i < length; i++) {\n  \n}",
    "if (condition) {\n  \n}",
    "public static void main(String[] args) {\n    \n}",
    "System.out.println();",
    "print()",
    "return ",
    "const ",
    "class Main {\n    public static void main(String[] args) {\n        \n    }\n}",
    "<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>",
    "<div></div>",
    "<section>\n  \n</section>",
    "display: flex;",
    "display: grid;",
    "background: #0f172a;",
    "color: #ffffff;",
    "font-family: system-ui, sans-serif;",
  ];
  const lowerToken = token.toLowerCase();
  return options.find((option) => option.toLowerCase().startsWith(lowerToken)) ?? "";
}

function acceptGhostSuggestion(view: EditorView) {
  const cursor = view.state.selection.main;
  if (!cursor.empty) return false;

  const line = view.state.doc.lineAt(cursor.head);
  const prefix = line.text.slice(0, cursor.head - line.from);
  const suggestion = ghostText(prefix);
  if (!suggestion) return false;

  view.dispatch({
    changes: { from: cursor.head, insert: suggestion },
    selection: { anchor: cursor.head + suggestion.length },
  });
  return true;
}
