"use client";
import { useEffect, useRef } from "react";
import "xterm/css/xterm.css";

export default function TerminalPane({ containerId }: { containerId: string }) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ws: WebSocket;
    import("xterm").then(({ Terminal }) => {
      if (!terminalRef.current) return;
      
      const term = new Terminal({
        theme: {
          background: "#0f172a", // slate-900
          foreground: "#f8fafc", // slate-50
          cursor: "#3b82f6", // blue-500
        },
        cursorBlink: true,
        convertEol: true, // Fixes formatting when shell outputs \n without \r
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      });

      term.open(terminalRef.current);
      term.writeln(`\x1b[1;34m[MiniDock] Connecting to container ${containerId} via WebSocket...\x1b[0m`);
      
      ws = new WebSocket(`ws://localhost:8080/api/containers/${containerId}/attach`);

      ws.onopen = () => {
        term.writeln("\x1b[1;32m[MiniDock] Connected to TTY.\x1b[0m\r\n");
      };

      ws.onmessage = (event) => {
        // We might get text or blob depending on PTY
        if (typeof event.data === "string") {
            term.write(event.data);
        } else {
            const reader = new FileReader();
            reader.onload = () => term.write(reader.result as string);
            reader.readAsText(event.data);
        }
      };

      term.onData(data => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
        }
      });

      ws.onclose = () => {
        term.writeln("\r\n\x1b[1;31m[MiniDock] Session ended. Connection closed.\x1b[0m");
      };
      
      ws.onerror = () => {
        term.writeln("\r\n\x1b[1;31m[MiniDock] Connection error. Ensure the Go Daemon is running on :8080\x1b[0m");
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, [containerId]);

  return (
    <div className="w-full bg-slate-900 p-4 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
        <div ref={terminalRef} className="h-[400px]" />
    </div>
  );
}
