"use client";

import { useState } from "react";
import { ChatMessage, EditorSettings, WorkspaceFile } from "@/lib/types";
import { uid } from "@/lib/utils";

export function useAI(activeFile: WorkspaceFile | undefined, selectedCode: string, settings: EditorSettings) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(content: string, mode = "ask") {
    if (!activeFile) return;
    const userMessage: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          mode,
          code: activeFile.content,
          selectedCode,
          filename: activeFile.name,
          language: activeFile.language,
          responseStyle: settings.aiStyle,
          model: settings.aiModel,
          history: messages.slice(-8),
        }),
      });
      const data = (await response.json()) as { content?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? "AI request failed.");
      setMessages((current) => [
        ...current,
        {
          id: uid("msg"),
          role: "assistant",
          content: data.content ?? "No response returned.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: uid("msg"),
          role: "assistant",
          content: `I could not reach the AI service: ${error instanceof Error ? error.message : "Unknown error"}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearMessages() {
    setMessages([]);
  }

  return { messages, loading, sendMessage, clearMessages };
}
