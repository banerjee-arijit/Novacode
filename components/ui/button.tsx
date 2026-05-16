import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "icon";
};

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
        (variant === "default" || variant === "primary") && "bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90",
        variant === "secondary" && "bg-[var(--panel-2)] text-[var(--foreground)] hover:bg-[var(--line)]",
        variant === "outline" && "border border-[var(--line)] bg-transparent text-[var(--foreground)] hover:bg-[var(--panel-2)]",
        variant === "ghost" && "text-[var(--foreground)] hover:bg-[var(--panel-2)]",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "h-8 px-2.5 text-xs",
        size === "md" && "h-9 px-3 text-sm",
        size === "icon" && "h-8 w-8 p-0",
        className,
      )}
      {...props}
    />
  );
}
