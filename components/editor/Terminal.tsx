"use client";

import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { WebContainer } from "@webcontainer/api";

type TerminalProps = {
  instance: WebContainer | null;
  visible: boolean;
  size: number;
  onCommandReady?: (cb: (cmd: string) => void) => void;
  onWriteTextReady?: (cb: (text: string) => void) => void;
};

export function Terminal({ instance, visible, size, onCommandReady, onWriteTextReady }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const shellProcessRef = useRef<any>(null);

  // Initialize xterm.js terminal instance
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
      convertEol: true, // handles EOL conversion natively for stdout
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleWindowResize = () => {
      try {
        fitAddon.fit();
      } catch (err) {}
    };
    window.addEventListener("resize", handleWindowResize);

    // Bind custom text printer if provided
    if (onWriteTextReady) {
      onWriteTextReady((text: string) => {
        term.write(text);
      });
    }

    return () => {
      window.removeEventListener("resize", handleWindowResize);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
  }, [onWriteTextReady]);

  // Connect shell process from WebContainer instance
  useEffect(() => {
    if (!instance || !xtermRef.current || shellProcessRef.current) return;

    let activeWriter: WritableStreamDefaultWriter<string> | null = null;

    async function startShell() {
      try {
        const shellProcess = await instance!.spawn("jsh", {
          terminal: {
            cols: xtermRef.current!.cols,
            rows: xtermRef.current!.rows,
          },
        });

        shellProcessRef.current = shellProcess;

        // Pipe shell output stream straight into xterm
        shellProcess.output.pipeTo(
          new WritableStream({
            write(data) {
              xtermRef.current?.write(data);
            },
          })
        );

        const writer = shellProcess.input.getWriter();
        activeWriter = writer;

        // Bind standard stdin keystrokes
        const dataListener = xtermRef.current!.onData((data) => {
          writer.write(data);
        });

        // Expose command sender callback (Run trigger)
        if (onCommandReady) {
          onCommandReady((cmd: string) => {
            writer.write(cmd);
          });
        }

        return () => {
          dataListener.dispose();
          writer.releaseLock();
        };
      } catch (err) {
        console.error("Shell launch failed:", err);
      }
    }

    startShell();

    return () => {
      if (activeWriter) {
        try {
          activeWriter.releaseLock();
        } catch (e) {}
      }
      shellProcessRef.current = null;
    };
  }, [instance, onCommandReady]);

  // Handle manual/drag resize events for xterm fitting
  useEffect(() => {
    if (xtermRef.current && fitAddonRef.current && visible) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          if (shellProcessRef.current) {
            shellProcessRef.current.resize({
              cols: xtermRef.current!.cols,
              rows: xtermRef.current!.rows,
            });
          }
        } catch (err) {}
      }, 50);
    }
  }, [size, visible]);

  return <div ref={terminalRef} className="h-full w-full" />;
}
