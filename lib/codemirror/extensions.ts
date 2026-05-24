import { closeBrackets, closeBracketsKeymap, completionKeymap, autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { markdown } from "@codemirror/lang-markdown";
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
  if (language === "cpp") return cpp();
  if (language === "markdown") return markdown();
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
      ...(settings.ghostSuggestions ? [{ key: "Tab", run: (view: EditorView) => acceptGhostSuggestion(view, language) }] : []),
      ...closeBracketsKeymap,
      ...defaultKeymap,
      ...searchKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...(settings.autocomplete ? completionKeymap : []),
      indentWithTab,
    ]),
    ...(settings.ghostSuggestions ? [ghostSuggestionExtension(language)] : []),
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

function ghostSuggestionExtension(language: Language) {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = ghostDecorations(view, language);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.selectionSet || update.viewportChanged) {
          this.decorations = ghostDecorations(update.view, language);
        }
      }
    },
    { decorations: (plugin) => plugin.decorations },
  );
}

function ghostDecorations(view: EditorView, language: Language) {
  const cursor = view.state.selection.main;
  if (!cursor.empty) return Decoration.none;

  const line = view.state.doc.lineAt(cursor.head);
  const prefix = line.text.slice(0, cursor.head - line.from);
  const suggestion = ghostText(prefix, view.state, language);
  if (!suggestion) return Decoration.none;

  return Decoration.set([Decoration.widget({ widget: new GhostWidget(suggestion), side: 1 }).range(cursor.head)]);
}

function ghostText(prefix: string, state: EditorState, language: Language) {
  // 1. Check for member access completion (e.g. console.l or console.)
  const dotMatch = prefix.match(/([\w$]+)\.([\w$]*)$/);
  if (dotMatch) {
    const parent = dotMatch[1];
    const memberPrefix = dotMatch[2] || "";
    const lowerMember = memberPrefix.toLowerCase();
    
    let members: string[] = [];
    if (parent === "console") {
      members = ["log", "error", "warn", "info", "clear", "time", "timeEnd"];
    } else if (parent === "document") {
      members = ["getElementById", "querySelector", "querySelectorAll", "createElement", "body", "addEventListener"];
    } else if (parent === "window") {
      members = ["location", "localStorage", "sessionStorage", "addEventListener", "setTimeout", "setInterval"];
    } else if (parent === "std" && language === "cpp") {
      members = ["cout", "cin", "endl", "vector", "string", "map", "set"];
    } else if ((parent === "self" || parent === "this") && (language === "javascript" || language === "typescript" || language === "python")) {
      const docStr = state.doc.toString();
      const thisRegex = new RegExp(`(?:this|self)\\.([A-Za-z_$][\\w$]*)`, "g");
      const found = new Set<string>();
      let m;
      let count = 0;
      while ((m = thisRegex.exec(docStr)) !== null && count++ < 100) {
        if (m[1] && m[1] !== memberPrefix) {
          found.add(m[1]);
        }
      }
      members = Array.from(found);
    }
    
    if (members.length > 0) {
      const match = members.find(m => m.toLowerCase().startsWith(lowerMember));
      if (match && match !== memberPrefix) {
        return match.slice(memberPrefix.length);
      }
    }
  }

  // 2. Normal word completion
  const tokenMatch = prefix.match(/[A-Za-z_$][\w$]*$/);
  if (!tokenMatch) return "";
  const token = tokenMatch[0];
  const lowerToken = token.toLowerCase();

  // Limit search area for speed on large files
  const cursorHead = state.selection.main.head;
  const docLength = state.doc.length;
  let searchContent = "";
  if (docLength < 20000) {
    searchContent = state.doc.toString();
  } else {
    const start = Math.max(0, cursorHead - 5000);
    const end = Math.min(docLength, cursorHead + 5000);
    searchContent = state.doc.sliceString(start, end);
  }

  // Extract identifiers from local document
  const identifiers = new Set<string>();
  const wordRegex = /\b[A-Za-z_$][\w$]{2,}\b/g;
  let match;
  let count = 0;
  while ((match = wordRegex.exec(searchContent)) !== null && count++ < 500) {
    const word = match[0];
    if (word !== token && word.toLowerCase().startsWith(lowerToken)) {
      identifiers.add(word);
    }
  }

  // Language-specific common keywords & snippets
  const languageOptions: string[] = [];
  if (language === "javascript" || language === "typescript") {
    languageOptions.push(
      "console.log", "const", "let", "function", "return", "import", "export", 
      "async", "await", "promise", "interface", "class", "document", "window",
      "null", "undefined", "true", "false", "typeof", "instanceof"
    );
  } else if (language === "python") {
    languageOptions.push(
      "print", "def", "return", "import", "from", "class", "self", "elif", "else",
      "lambda", "yield", "None", "True", "False", "len", "range", "zip", "enumerate"
    );
  } else if (language === "java") {
    languageOptions.push(
      "System.out.println", "public class", "public static void main(String[] args)", 
      "private", "protected", "public", "return", "import", "String", "Integer",
      "class", "interface", "extends", "implements", "new", "null", "true", "false"
    );
  } else if (language === "cpp") {
    languageOptions.push(
      "std::cout", "std::endl", "#include <iostream>", "#include <vector>", "#include <string>",
      "using namespace std;", "int main()", "vector", "string", "cout", "nullptr", "return"
    );
  } else if (language === "html") {
    languageOptions.push(
      "div", "section", "main", "span", "button", "input", "class=", "id=", "href="
    );
  } else if (language === "css") {
    languageOptions.push(
      "display: flex;", "display: grid;", "justify-content: center;", 
      "align-items: center;", "background-color: ", "color: ", "border-radius: ", "padding: ", "margin: "
    );
  } else if (language === "markdown") {
    languageOptions.push(
      "# Header 1", "## Header 2", "### Header 3", "**bold**", "*italic*", "- Bullet item", "[Link](url)"
    );
  }

  // Rank matching options
  type ScoredOption = { option: string; score: number };
  const scoredOptions: ScoredOption[] = [];

  const addOption = (option: string, baseScore: number) => {
    if (!option || option === token) return;
    if (!option.toLowerCase().startsWith(lowerToken)) return;
    
    let score = baseScore;
    if (option.startsWith(token)) {
      score += 15;
    }
    score -= option.length * 0.1;
    scoredOptions.push({ option, score });
  };

  for (const id of identifiers) {
    addOption(id, 20); // Local identifiers prioritised
  }

  for (const kw of languageOptions) {
    addOption(kw, 10);
  }

  if (scoredOptions.length === 0) return "";

  scoredOptions.sort((a, b) => b.score - a.score);
  const bestMatch = scoredOptions[0].option;

  return bestMatch.slice(token.length);
}

function acceptGhostSuggestion(view: EditorView, language: Language) {
  const cursor = view.state.selection.main;
  if (!cursor.empty) return false;

  const line = view.state.doc.lineAt(cursor.head);
  const prefix = line.text.slice(0, cursor.head - line.from);
  const suggestion = ghostText(prefix, view.state, language);
  if (!suggestion) return false;

  view.dispatch({
    changes: { from: cursor.head, insert: suggestion },
    selection: { anchor: cursor.head + suggestion.length },
  });
  return true;
}
