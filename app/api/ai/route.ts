import { NextResponse } from "next/server";

const baseSystemPrompt = `You are NovaCode AI — an elite software engineer with 20+ years of experience built into an AI code editor.

Core principles:
- Be precise, concise, and production-quality in all responses
- Write clean, readable, maintainable code — never verbose
- Use modern best practices for the detected language/framework
- Never include unnecessary comments unless asked
- Format code consistently with the existing file style

When responding:
- Use proper markdown with fenced code blocks including language identifiers
- For code questions, lead with the solution, explain briefly after if needed
- For bug fixes, show the fixed code, then briefly explain what was wrong
- For features, implement cleanly and completely`;

const editModePrompt = `You are NovaCode AI in EDIT MODE.
Your ONLY job: transform the provided code snippet based on the user's instruction.
Rules:
- Return ONLY the replacement code, nothing else
- No explanations, no prose, no markdown fences — just raw code
- Preserve indentation and code style of the original
- The output replaces the selection exactly`;

const explainModePrompt = `You are NovaCode AI in EXPLAIN MODE.
Explain the selected code clearly and concisely:
- What it does (1-2 sentences)
- Key patterns or concepts used
- Any potential issues or improvements
Keep it brief and practical.`;

const supportedModels = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

export async function POST(request: Request) {
  const body = await request.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured. Add it to .env.local to enable AI responses." },
      { status: 500 }
    );
  }

  const mode = body.mode ?? "ask";
  const language = body.language ?? "unknown";
  const filename = body.filename ?? "untitled";
  const selectedCode = body.selectedCode ?? "";
  const fullCode = body.code ?? "";

  let systemPrompt: string;
  let userContext: string;
  let temperature = 0.25;

  if (mode === "edit") {
    // Pure code replacement — deterministic
    systemPrompt = editModePrompt;
    userContext = [
      `File: ${filename} (${language})`,
      `Code to transform:\n${selectedCode}`,
      `Instruction: ${body.message}`,
    ].join("\n\n");
    temperature = 0.1;
  } else if (mode === "explain") {
    systemPrompt = explainModePrompt;
    userContext = [
      `File: ${filename} (${language})`,
      `Code to explain:\n\`\`\`${language}\n${selectedCode}\n\`\`\``,
    ].join("\n\n");
    temperature = 0.3;
  } else {
    // Standard chat/ask mode
    systemPrompt = baseSystemPrompt;
    const responseStyle = body.responseStyle ?? "concise";

    const contextParts: string[] = [
      `Response style: ${responseStyle}`,
      `File: ${filename} (${language})`,
    ];

    if (selectedCode.trim()) {
      contextParts.push(`Selected code:\n\`\`\`${language}\n${selectedCode}\n\`\`\``);
    }

    if (fullCode.trim() && fullCode !== selectedCode) {
      // Only include file content if it's not too large
      const maxFileContext = 3000;
      const truncated = fullCode.length > maxFileContext
        ? fullCode.slice(0, maxFileContext) + "\n... (truncated)"
        : fullCode;
      contextParts.push(`Current file:\n\`\`\`${language}\n${truncated}\n\`\`\``);
    }

    if (body.history?.length > 0) {
      // Conversation history is handled via contents array below
    }

    contextParts.push(`User: ${body.message}`);
    userContext = contextParts.join("\n\n");
    temperature = responseStyle === "detailed" ? 0.4 : 0.25;
  }

  // Build conversation contents
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

  // Add chat history for ask mode
  if (mode === "ask" && Array.isArray(body.history) && body.history.length > 0) {
    const recentHistory = body.history.slice(-10); // last 10 messages for context
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    }
  }

  // Add the current request with full context
  contents.push({
    role: "user",
    parts: [{ text: `${systemPrompt}\n\n---\n\n${userContext}` }],
  });

  // Model selection with fallback chain
  const requestedModel = typeof body.model === "string" ? body.model : process.env.GEMINI_MODEL;
  const modelQueue = [
    normalizeModel(requestedModel),
    normalizeModel(process.env.GEMINI_MODEL),
    ...supportedModels,
  ].filter((m, i, arr): m is string => Boolean(m) && arr.indexOf(m) === i);

  let data: GeminiResponse | null = null;
  const errors: string[] = [];

  for (const model of modelQueue) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature,
            topP: 0.92,
            maxOutputTokens: mode === "edit" ? 2048 : mode === "explain" ? 1024 : 4096,
          },
        }),
      }
    );

    data = await response.json();
    if (response.ok) break;
    errors.push(`${model}: ${data?.error?.message ?? "Gemini request failed."}`);
    data = null;
  }

  if (!data) {
    return NextResponse.json(
      { error: errors.at(-1) ?? "All AI models failed. Please try again." },
      { status: 502 }
    );
  }

  const content = data.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text ?? "")
    .join("\n")
    .trim();

  // For edit mode — strip any markdown code fences that snuck in
  let finalContent = content || "I could not produce a response.";
  if (mode === "edit" && finalContent) {
    finalContent = finalContent
      .replace(/^```[\w]*\n?/m, "")
      .replace(/\n?```\s*$/m, "")
      .trim();
  }

  return NextResponse.json({ content: finalContent });
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

function normalizeModel(model?: string): string {
  if (!model) return "gemini-2.5-flash";
  const clean = model.replace(/^models\//, "");
  if (clean.startsWith("gemini-1.5")) return "gemini-2.5-flash";
  return clean;
}
