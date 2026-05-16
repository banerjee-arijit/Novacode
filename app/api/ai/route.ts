import { NextResponse } from "next/server";

const systemPrompt = `You are a senior software engineer and teacher living inside an AI code editor.
Be clear and concise. When the user asks for code, return clean code in proper fenced code blocks.
Do not add comments inside generated code unless the user explicitly asks for comments.
Keep code production-quality, readable, and minimal. Never give vague answers.`;

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
      { status: 500 },
    );
  }

  const context = [
    systemPrompt,
    `Response style: ${body.responseStyle ?? "concise"}`,
    `Mode: ${body.mode ?? "ask"}`,
    `File: ${body.filename ?? "untitled"} (${body.language ?? "unknown"})`,
    body.selectedCode ? `Selected code:\n\`\`\`${body.language}\n${body.selectedCode}\n\`\`\`` : "No code is selected.",
    `Current editor code:\n\`\`\`${body.language}\n${body.code ?? ""}\n\`\`\``,
    `User request: ${body.message}`,
  ].join("\n\n");

  const requestedModel = typeof body.model === "string" ? body.model : process.env.GEMINI_MODEL;
  const modelQueue = [
    normalizeModel(requestedModel),
    normalizeModel(process.env.GEMINI_MODEL),
    ...supportedModels,
  ].filter((model, index, list): model is string => Boolean(model) && list.indexOf(model) === index);

  let data: GeminiResponse | null = null;
  const errors: string[] = [];
  for (const model of modelQueue) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: context }] }],
          generationConfig: { temperature: 0.25, topP: 0.9 },
        }),
      },
    );

    data = await response.json();
    if (response.ok) break;
    errors.push(`${model}: ${data?.error?.message ?? "Gemini request failed."}`);
    data = null;
  }

  if (!data) {
    return NextResponse.json({ error: errors.at(-1) ?? "Gemini request failed." }, { status: 502 });
  }

  const content = data.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("\n").trim();
  return NextResponse.json({ content: content || "I could not produce a response." });
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

function normalizeModel(model?: string) {
  if (!model) return "gemini-2.5-flash";
  const clean = model.replace(/^models\//, "");
  if (clean.startsWith("gemini-1.5")) return "gemini-2.5-flash";
  return clean;
}
