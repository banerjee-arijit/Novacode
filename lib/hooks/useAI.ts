"use client";

import { useState } from "react";
import { ChatMessage, EditorSettings, WorkspaceFile } from "@/lib/types";
import { uid } from "@/lib/utils";

export function useAI(activeFile: WorkspaceFile | undefined, selectedCode: string, settings: EditorSettings) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function callAI(params: {
    message: string;
    mode?: string;
    selectedCode?: string;
    silent?: boolean; // don't add to chat history (for edit mode)
  }): Promise<string> {
    if (!activeFile) throw new Error("No active file");

    const body = {
      message: params.message,
      mode: params.mode ?? "ask",
      code: activeFile.content,
      selectedCode: params.selectedCode ?? selectedCode,
      filename: activeFile.name,
      language: activeFile.language,
      responseStyle: settings.aiStyle,
      model: settings.aiModel,
      history: params.silent ? [] : messages.slice(-10),
    };

    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as { content?: string; error?: string };
    if (!response.ok) throw new Error(data.error ?? "AI request failed.");
    return data.content ?? "No response returned.";
  }

  async function sendMessage(content: string, mode = "ask") {
    if (!activeFile) return;

    const userMessage: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const result = await callAI({ message: content, mode });
      setMessages((prev) => [
        ...prev,
        {
          id: uid("msg"),
          role: "assistant",
          content: result,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid("msg"),
          role: "assistant",
          content: `⚠️ ${error instanceof Error ? error.message : "Unknown error"}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  /** Silent AI call for "Edit with AI" — does not affect chat history */
  async function editCode(instruction: string, codeToEdit: string): Promise<string> {
    return callAI({
      message: instruction,
      mode: "edit",
      selectedCode: codeToEdit,
      silent: true,
    });
  }

  function clearMessages() {
    setMessages([]);
  }

  return { messages, loading, sendMessage, editCode, clearMessages };
}
