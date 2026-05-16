# Novacode AI Code Editor

A full-stack AI-powered code editor built with Next.js, TypeScript, Tailwind CSS, CodeMirror 6, MongoDB/Mongoose, and Google Gemini.

## Features

- Three-panel developer workspace: file explorer, CodeMirror editor, AI chat
- CodeMirror 6 syntax support for JavaScript, TypeScript, Python, HTML, and CSS
- Line numbers, active line, folding, search, multiple selections, autocomplete, lint gutter, One Dark theme
- AI assistant actions for explaining code, fixing bugs, improving code, generating code, and free-form chat
- The current editor buffer and selected code are sent with every AI request
- Guest-mode local workspace with create, rename, delete, edit, and ZIP export
- Email/password auth routes backed by MongoDB Atlas and signed HTTP-only JWT cookies
- MongoDB models for User, Project, File, and ChatHistory
- Run panel for JavaScript console output and HTML/CSS live preview
- Settings page for theme, font size, tab size, font family, AI style, keybindings, auto-save, and export workflow

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000/editor`.

## Environment

```bash
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
JWT_SECRET=replace-with-a-long-random-secret
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/novacode_ai_editor
MONGODB_DB=novacode_ai_editor
JWT_SECRET=replace-with-a-long-random-secret
```

Guest mode works without MongoDB. AI responses require `GEMINI_API_KEY`. Signup/login require `MONGODB_URI` and `JWT_SECRET`.

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Notes

The JavaScript runner executes in the browser for quick feedback and captures `console.log`, `console.warn`, and `console.error`. HTML/CSS runs in a sandboxed iframe. Python has the UI path prepared and can be connected to Pyodide or a server-side runner depending on deployment constraints.
