"use client";

import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { WebContainer } from "@webcontainer/api";

type TerminalProps = {
  instance: WebContainer | null;
  visible: boolean;
};

export function Terminal({ instance, visible }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const shellProcessRef = useRef<any>(null);

  useEffect(() => {
    if (!terminalRef.current || xtermRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: "#05070a",
        foreground: "#e6edf7",
        cursor: "#37d5ff",
        selectionBackground: "rgba(55, 213, 255, 0.3)",
      },
      fontSize: 12,
      fontFamily: "Geist Mono, monospace",
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    window.addEventListener("resize", () => fitAddon.fit());

    return () => {
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!instance || !xtermRef.current || shellProcessRef.current) return;

    async function startShell() {
      const shellProcess = await instance!.spawn("jsh", {
        terminal: {
          cols: xtermRef.current!.cols,
          rows: xtermRef.current!.rows,
        },
      });

      shellProcessRef.current = shellProcess;

      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            xtermRef.current!.write(data);
          },
        })
      );

      const input = shellProcess.input.getWriter();
      xtermRef.current!.onData((data) => {
        input.write(data);
      });
    }

    startShell();
  }, [instance]);

  useEffect(() => {
    if (visible && xtermRef.current) {
      // Small delay to ensure container is rendered
      setTimeout(() => {
        const fitAddon = new FitAddon();
        xtermRef.current!.loadAddon(fitAddon);
        fitAddon.fit();
      }, 100);
    }
  }, [visible]);

  return <div ref={terminalRef} className="h-full w-full" />;
}
