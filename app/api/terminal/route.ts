import { exec } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execAsync = promisify(exec);
const TERMINAL_TIMEOUT_MS = 120000;

export async function POST(request: Request) {
  const { command } = (await request.json()) as { command?: string };
  if (!command?.trim()) return NextResponse.json({ error: "Command is required." }, { status: 400 });

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      shell: "powershell.exe",
      timeout: TERMINAL_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 4,
      env: process.env,
    });

    return NextResponse.json({
      output: [stdout, stderr].filter(Boolean).join("\n") || "Command finished with no output.",
      cwd: process.cwd(),
    });
  } catch (error) {
    return NextResponse.json({
      output: formatTerminalError(error),
      cwd: process.cwd(),
    });
  }
}

function formatTerminalError(error: unknown) {
  if (typeof error === "object" && error && "killed" in error && error.killed) {
    return `Command stopped after ${TERMINAL_TIMEOUT_MS / 1000}s. Use non-interactive flags for project generators.`;
  }
  if (typeof error === "object" && error && "stdout" in error && "stderr" in error) {
    const stdout = typeof error.stdout === "string" ? error.stdout : "";
    const stderr = typeof error.stderr === "string" ? error.stderr : "";
    return [stdout, stderr].filter(Boolean).join("\n") || "Command failed.";
  }
  if (error instanceof Error) return error.message;
  return "Command failed.";
}
