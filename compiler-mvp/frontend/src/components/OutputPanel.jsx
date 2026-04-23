import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

function getWsUrl() {
  const override = import.meta.env.VITE_WS_URL;
  if (override) return override;
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${window.location.host}`;
}

const OutputPanel = forwardRef(function OutputPanel({ onRunStart, onRunEnd }, ref) {
  const mountRef    = useRef(null);
  const termRef     = useRef(null);
  const fitRef      = useRef(null);
  const wsRef       = useRef(null);
  const runningRef  = useRef(false);
  const inputBufRef = useRef('');     // accumulates the current input line
  const [wsStatus, setWsStatus] = useState('idle');

  // ── Boot terminal ────────────────────────────────────────────────────────
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      convertEol:  true,
      scrollback:  5000,
      theme: {
        background:   '#0d1117', foreground:   '#e6edf3',
        cursor:       '#58a6ff', cursorAccent: '#0d1117',
        selectionBackground: 'rgba(88,166,255,0.18)',
        black:   '#484f58', red:     '#f85149',
        green:   '#3fb950', yellow:  '#d29922',
        blue:    '#58a6ff', magenta: '#bc8cff',
        cyan:    '#39c5cf', white:   '#b1bac4',
        brightBlack:   '#6e7681', brightRed:     '#ffa198',
        brightGreen:   '#56d364', brightYellow:  '#e3b341',
        brightBlue:    '#79c0ff', brightMagenta: '#d2a8ff',
        brightCyan:    '#56d4dd', brightWhite:   '#f0f6fc',
      },
      fontFamily:    "'JetBrains Mono', 'Fira Code', monospace",
      fontSize:      13,
      lineHeight:    1.5,
      letterSpacing: 0.3,
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(mountRef.current);
    requestAnimationFrame(() => fit.fit());

    const ro = new ResizeObserver(() => { try { fit.fit(); } catch (_) {} });
    ro.observe(mountRef.current);

    // ── Handle keyboard input ──────────────────────────────────────────────
    term.onData(data => {
      if (!runningRef.current) return;
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;

      // Enter key — xterm sends '\r' for Enter
      if (data === '\r') {
        const line = inputBufRef.current;
        inputBufRef.current = '';
        // Echo the newline in the terminal
        term.write('\r\n');
        // Send the full line + newline to the process stdin
        // Use \n (Unix) — Python/gcc on Windows handles both
        ws.send(JSON.stringify({ type: 'input', data: line + '\n' }));
        return;
      }

      // Backspace
      if (data === '\x7f' || data === '\x08') {
        if (inputBufRef.current.length > 0) {
          inputBufRef.current = inputBufRef.current.slice(0, -1);
          term.write('\b \b');
        }
        return;
      }

      // Ctrl+C
      if (data === '\x03') {
        inputBufRef.current = '';
        term.write('^C\r\n');
        ws.send(JSON.stringify({ type: 'kill' }));
        return;
      }

      // Ctrl+D — send EOF (end of stdin)
      if (data === '\x04') {
        ws.send(JSON.stringify({ type: 'input', data: '\x04' }));
        return;
      }

      // Regular printable character — echo it and buffer it
      if (data >= ' ' || data === '\t') {
        inputBufRef.current += data;
        term.write(data);
      }
    });

    termRef.current = term;
    fitRef.current  = fit;
    printWelcome(term);

    return () => { ro.disconnect(); term.dispose(); };
  }, []);

  // ── Open WebSocket for each run ─────────────────────────────────────────
  function openWS(language, code) {
    if (wsRef.current) {
      wsRef.current.onclose   = null;
      wsRef.current.onerror   = null;
      wsRef.current.onmessage = null;
      try { wsRef.current.close(); } catch (_) {}
      wsRef.current = null;
    }

    const term = termRef.current;
    const url  = `${getWsUrl()}/terminal`;

    console.log('[CodeForge] Connecting to', url);
    setWsStatus('connecting');
    term.writeln(`\x1b[90mConnecting → ${url}\x1b[0m`);

    let ws;
    try { ws = new WebSocket(url); }
    catch (e) {
      term.writeln(`\x1b[31mWebSocket creation failed: ${e.message}\x1b[0m`);
      setWsStatus('error');
      runningRef.current = false;
      onRunEnd?.({ exitCode: 1 });
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[CodeForge] WS open');
      setWsStatus('connected');
      term.writeln('\x1b[90mConnected — sending code…\x1b[0m');
      term.writeln('\x1b[90m─────────────────────────────────────\x1b[0m');
      ws.send(JSON.stringify({ type: 'run', language, code }));
    };

    ws.onmessage = ({ data: raw }) => {
      let msg;
      try { msg = JSON.parse(raw); }
      catch { term.write(raw); return; }

      switch (msg.type) {
        case 'status':
          term.writeln(`\x1b[33m${msg.text}\x1b[0m`);
          break;

        case 'output':
          // Write exactly as-is — preserves prompts like "Enter your age: "
          // without a trailing newline, so cursor stays on same line
          term.write(msg.data);
          break;

        case 'error':
          term.write(`\x1b[31m${msg.data}\x1b[0m`);
          break;

        case 'exit': {
          runningRef.current  = false;
          inputBufRef.current = '';
          setWsStatus('idle');
          const ok = msg.code === 0;
          term.writeln('');
          term.writeln(ok
            ? '\x1b[32m─────────────────────────────────────\r\n✔  Finished (exit 0)\x1b[0m'
            : `\x1b[31m─────────────────────────────────────\r\n✘  Exited with code ${msg.code}\x1b[0m`
          );
          onRunEnd?.({ exitCode: msg.code });
          break;
        }

        default:
          console.log('[CodeForge] unknown msg:', msg);
      }
    };

    ws.onerror = () => {
      console.error('[CodeForge] WS connection failed. Is backend running?');
      term.writeln('\x1b[31m\r\nWebSocket error — could not connect.\x1b[0m');
      term.writeln(`\x1b[90mTried: ${url}\x1b[0m`);
      term.writeln('\x1b[33mMake sure backend is running: node server.js\x1b[0m');
      setWsStatus('error');
    };

    ws.onclose = e => {
      console.log('[CodeForge] WS closed', e.code);
      if (runningRef.current) {
        term.writeln(`\x1b[31m\r\nConnection lost (${e.code})\x1b[0m`);
        runningRef.current = false;
        onRunEnd?.({ exitCode: 1 });
      }
      setWsStatus('idle');
    };
  }

  useImperativeHandle(ref, () => ({
    run(language, code) {
      if (!termRef.current) return;
      termRef.current.reset();
      termRef.current.writeln('\x1b[36m⚡ \x1b[1mCodeForge Terminal\x1b[0m');
      inputBufRef.current = '';
      runningRef.current  = true;
      onRunStart?.();
      openWS(language, code);
    },
    kill() {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'kill' }));
      }
      runningRef.current  = false;
      inputBufRef.current = '';
      setWsStatus('idle');
      onRunEnd?.({ exitCode: 1 });
    },
  }));

  const dotColor = {
    idle:       '#6e7681',
    connecting: '#d29922',
    connected:  '#3fb950',
    error:      '#f85149',
  }[wsStatus];

  return (
    <div className="panel output-panel" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-icon">⬛</span>
          Terminal
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {runningRef.current && (
            <span style={{ fontSize: 11, color: '#3fb950' }}>
              ● Running — type input &amp; press Enter
            </span>
          )}
          <span style={{ fontSize: 10, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{
              display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
              background: dotColor,
              boxShadow: wsStatus === 'connected' ? `0 0 5px ${dotColor}` : 'none',
            }} />
            {wsStatus}
          </span>
        </div>
      </div>

      <div className="panel-body" style={{
        padding: 0, overflow: 'hidden', flex: 1,
        display: 'flex', flexDirection: 'column', minHeight: 0,
      }}>
        <div ref={mountRef} style={{ flex: 1, minHeight: 0, padding: '4px 4px 0' }} />
      </div>
    </div>
  );
});

export default OutputPanel;

function printWelcome(term) {
  term.writeln('');
  term.writeln('  \x1b[36m⚡\x1b[1m CodeForge Terminal\x1b[0m');
  term.writeln('  \x1b[90m──────────────────────────────────────\x1b[0m');
  term.writeln('  \x1b[90mProgram output appears here.\x1b[0m');
  term.writeln('  \x1b[90mWhen your code asks for input, type\x1b[0m');
  term.writeln('  \x1b[90mhere and press Enter.\x1b[0m');
  term.writeln('');
  term.writeln('  Press \x1b[32m▶ Run\x1b[0m to start.');
  term.writeln('');
}