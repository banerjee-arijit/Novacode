"use client";

import { Sparkles } from "lucide-react";

type AIEditTooltipProps = {
  x: number;
  y: number;
  onClick: () => void;
};

export function AIEditTooltip({ x, y, onClick }: AIEditTooltipProps) {
  return (
    <div
      className="ai-edit-tooltip"
      style={{
        left: x,
        top: y,
        transform: "translateY(-100%) translateX(-50%)",
        marginTop: -8,
      }}
      onClick={onClick}
    >
      <Sparkles size={11} className="text-[var(--accent)]" />
      <span>Edit with AI</span>
    </div>
  );
}
