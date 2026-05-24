import { WorkspaceDraftFile, WorkspaceFile, WorkspaceFolder } from "@/lib/types";

type ProjectTemplate = "vite-react" | "vite-react-ts" | "react-app";

export function createProjectTemplate(projectName: string, template: ProjectTemplate): WorkspaceDraftFile[] {
  if (template === "react-app") return createReactAppTemplate(projectName);
  return createViteTemplate(projectName, template === "vite-react-ts");
}

export function detectProjectCommand(command: string) {
  const parts = command.trim().split(/\s+/);
  const lowerParts = parts.map((part) => part.toLowerCase());

  const viteIndex = lowerParts.findIndex((part, index) => part === "create" && lowerParts[index + 1]?.startsWith("vite"));
  const createViteIndex = lowerParts.findIndex((part) => part.startsWith("create-vite"));
  if (viteIndex >= 0 || createViteIndex >= 0) {
    const nameIndex = viteIndex >= 0 ? viteIndex + 2 : createViteIndex + 1;
    const projectName = parts[nameIndex] && !parts[nameIndex].startsWith("-") ? parts[nameIndex] : "vite-project";
    const templateFlag = lowerParts.findIndex((part) => part === "--template");
    const templateValue = templateFlag >= 0 ? lowerParts[templateFlag + 1] : lowerParts.at(-1);
    const template: ProjectTemplate = templateValue?.includes("ts") ? "vite-react-ts" : "vite-react";
    return { projectName: sanitizeProjectName(projectName), template, tool: "Vite" };
  }

  const craIndex = lowerParts.findIndex((part) => part.includes("create-react-app"));
  if (craIndex >= 0) {
    const projectName = parts[craIndex + 1] && !parts[craIndex + 1].startsWith("-") ? parts[craIndex + 1] : "my-react-app";
    return { projectName: sanitizeProjectName(projectName), template: "react-app" as const, tool: "Create React App" };
  }

  return null;
}

export function findRunnableProject(
  currentFolderId: string | null,
  files: WorkspaceFile[],
  folders: WorkspaceFolder[],
) {
  const packageJson = files.find((file) => file.parentId === currentFolderId && file.name === "package.json");
  if (!packageJson) return null;

  const children = files.filter((file) => isDescendantFile(file, currentFolderId, folders));
  const byPath = new Map(children.map((file) => [filePath(file, folders, currentFolderId), file]));
  const appFile = byPath.get("src/App.jsx") ?? byPath.get("src/App.tsx") ?? byPath.get("src/App.js");
  const cssFile = byPath.get("src/App.css") ?? byPath.get("src/index.css");
  const projectFolder = folders.find((folder) => folder.id === currentFolderId);

  if (!appFile) return null;

  return {
    name: projectFolder?.name ?? "workspace",
    html: renderReactPreview(appFile.content, cssFile?.content ?? ""),
  };
}

function createViteTemplate(projectName: string, typescript: boolean): WorkspaceDraftFile[] {
  const extension = typescript ? "tsx" : "jsx";
  const mainExtension = typescript ? "tsx" : "jsx";

  return [
    {
      path: "package.json",
      content: JSON.stringify({
        scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
        dependencies: { "@vitejs/plugin-react": "latest", vite: "latest", react: "latest", "react-dom": "latest" },
        devDependencies: typescript ? { typescript: "latest", "@types/react": "latest", "@types/react-dom": "latest" } : {},
      }, null, 2),
    },
    {
      path: "index.html",
      content: `<div id="root"></div>\n<script type="module" src="/src/main.${mainExtension}"></script>\n`,
    },
    {
      path: `src/main.${mainExtension}`,
      content: `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\nimport "./App.css";\n\ncreateRoot(document.getElementById("root")!).render(<App />);\n`,
    },
    {
      path: `src/App.${extension}`,
      content: `export default function App() {\n  return (\n    <main className="app-shell">\n      <p className="eyebrow">NovaCode WebContainer</p>\n      <h1>${projectName}</h1>\n      <p>Edit <code>src/App.${extension}</code>, then run <code>npm run dev</code> again.</p>\n      <button>Ship it</button>\n    </main>\n  );\n}\n`,
    },
    { path: "src/App.css", content: appCss },
    { path: "src/assets/.gitkeep", content: "" },
    ...(typescript ? [{ path: "tsconfig.json", content: JSON.stringify({ compilerOptions: { jsx: "react-jsx", strict: true } }, null, 2) }] : []),
  ];
}

function createReactAppTemplate(projectName: string): WorkspaceDraftFile[] {
  return [
    {
      path: "package.json",
      content: JSON.stringify({
        scripts: { start: "react-scripts start", build: "react-scripts build", test: "react-scripts test" },
        dependencies: { react: "latest", "react-dom": "latest", "react-scripts": "latest" },
      }, null, 2),
    },
    { path: "public/index.html", content: `<div id="root"></div>\n` },
    {
      path: "src/index.js",
      content: `import React from "react";\nimport { createRoot } from "react-dom/client";\nimport App from "./App";\nimport "./App.css";\n\ncreateRoot(document.getElementById("root")).render(<App />);\n`,
    },
    {
      path: "src/App.jsx",
      content: `export default function App() {\n  return (\n    <main className="app-shell">\n      <p className="eyebrow">NovaCode React</p>\n      <h1>${projectName}</h1>\n      <p>Your React app folder structure is ready.</p>\n      <button>Start building</button>\n    </main>\n  );\n}\n`,
    },
    { path: "src/App.css", content: appCss },
  ];
}

function sanitizeProjectName(name: string) {
  return name.replace(/[^a-zA-Z0-9-_]/g, "-").replace(/^-+|-+$/g, "") || "my-app";
}

function isDescendantFile(file: WorkspaceFile, folderId: string | null, folders: WorkspaceFolder[]) {
  if (!folderId) return file.parentId === null;
  let cursor = file.parentId;
  while (cursor) {
    if (cursor === folderId) return true;
    cursor = folders.find((folder) => folder.id === cursor)?.parentId ?? null;
  }
  return false;
}

function filePath(file: WorkspaceFile, folders: WorkspaceFolder[], rootFolderId: string | null) {
  const parts = [file.name];
  let cursor = file.parentId;
  while (cursor && cursor !== rootFolderId) {
    const folder = folders.find((item) => item.id === cursor);
    if (!folder) break;
    parts.unshift(folder.name);
    cursor = folder.parentId;
  }
  return parts.join("/");
}

function renderReactPreview(appContent: string, css: string) {
  const componentBody = appContent
    .replace(/import\s+.*?;?\n/g, "")
    .replace(/export\s+default\s+function\s+App\s*\(/, "function App(")
    .replace(/export\s+default\s+App;?/g, "");

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      ${componentBody}
      ReactDOM.createRoot(document.getElementById("root")).render(<App />);
    </script>
  </body>
</html>`;
}

const appCss = `body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #0b1020;
  color: #eef5ff;
  font-family: Inter, system-ui, sans-serif;
}

.app-shell {
  display: grid;
  gap: 16px;
  max-width: 620px;
  padding: 48px;
}

.eyebrow {
  color: #4dd8ff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0;
  text-transform: uppercase;
}

h1 {
  font-size: 56px;
  line-height: 1;
  margin: 0;
}

p {
  color: #a9b6ce;
  font-size: 18px;
  line-height: 1.6;
  margin: 0;
}

button {
  width: fit-content;
  border: 0;
  border-radius: 8px;
  background: #4dd8ff;
  color: #06101b;
  cursor: pointer;
  font-weight: 700;
  padding: 12px 18px;
}`;
