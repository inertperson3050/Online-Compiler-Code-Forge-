/**
 * terminalServer.js
 *
 * Protocol:
 *   Client → Server:
 *     { type: 'run',   language, code }
 *     { type: 'input', data: 'hello\n' }
 *     { type: 'kill' }
 *
 *   Server → Client:
 *     { type: 'status', text: '...' }
 *     { type: 'output', data: '...' }
 *     { type: 'error',  data: '...' }
 *     { type: 'exit',   code: 0 }
 */

const { WebSocketServer } = require('ws');
const { spawn, execFile } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { v4: uuidv4 } = require('uuid');

const IS_WINDOWS = os.platform() === 'win32';
const PYTHON_CMD = IS_WINDOWS ? 'python' : 'python3';
const TIMEOUT_MS = 15000;

function attachTerminalWS(httpServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/terminal' });
  console.log('[terminal] WebSocket server ready at /terminal');

  wss.on('connection', (ws, req) => {
    console.log('[terminal] Client connected:', req.socket.remoteAddress);

    let child     = null;
    let tmpDir    = null;
    let killTimer = null;

    function send(obj) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(obj));
      }
    }

    function cleanup() {
      clearTimeout(killTimer);
      if (child) {
        try { child.kill('SIGKILL'); } catch (_) {}
        child = null;
      }
      if (tmpDir) {
        const dir = tmpDir;
        tmpDir = null;
        setTimeout(() => {
          try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
        }, 2000);
      }
    }

    function compile(cmd, args, cwd) {
      return new Promise(resolve => {
        execFile(cmd, args, { cwd, shell: IS_WINDOWS, timeout: 20000 },
          (err, _stdout, stderr) => resolve({ ok: !err, stderr: stderr || err?.message || '' })
        );
      });
    }

    async function handleRun({ language, code }) {
      cleanup();

      tmpDir = path.join(os.tmpdir(), `cf_${uuidv4()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      let spawnCmd, spawnArgs;

      try {
        if (language === 'python') {
          const src = path.join(tmpDir, 'main.py');
          fs.writeFileSync(src, code, 'utf8');
          spawnCmd  = PYTHON_CMD;
          spawnArgs = ['-u', src];

        } else if (language === 'c') {
          const src = path.join(tmpDir, 'main.c');
          const bin = path.join(tmpDir, IS_WINDOWS ? 'main.exe' : 'main');
          fs.writeFileSync(src, code, 'utf8');
          send({ type: 'status', text: 'Compiling C…' });
          const r = await compile('gcc', [src, '-o', bin, '-lm', '-w'], tmpDir);
          if (!r.ok) { send({ type: 'error', data: r.stderr }); send({ type: 'exit', code: 1 }); return; }
          spawnCmd = bin; spawnArgs = [];

        } else if (language === 'cpp') {
          const src = path.join(tmpDir, 'main.cpp');
          const bin = path.join(tmpDir, IS_WINDOWS ? 'main.exe' : 'main');
          fs.writeFileSync(src, code, 'utf8');
          send({ type: 'status', text: 'Compiling C++…' });
          const r = await compile('g++', [src, '-o', bin, '-std=c++17', '-lm', '-w'], tmpDir);
          if (!r.ok) { send({ type: 'error', data: r.stderr }); send({ type: 'exit', code: 1 }); return; }
          spawnCmd = bin; spawnArgs = [];

        } else if (language === 'java') {
          const m   = code.match(/public\s+class\s+(\w+)/);
          const cls = m ? m[1] : 'Main';
          const src = path.join(tmpDir, `${cls}.java`);
          fs.writeFileSync(src, code, 'utf8');
          send({ type: 'status', text: 'Compiling Java…' });
          const r = await compile('javac', [src], tmpDir);
          if (!r.ok) { send({ type: 'error', data: r.stderr }); send({ type: 'exit', code: 1 }); return; }
          spawnCmd = 'java'; spawnArgs = ['-cp', tmpDir, cls];

        } else {
          send({ type: 'error', data: `Unsupported language: ${language}\n` });
          send({ type: 'exit', code: 1 }); return;
        }

      } catch (err) {
        send({ type: 'error', data: `Setup error: ${err.message}\n` });
        send({ type: 'exit', code: 1 }); return;
      }

      send({ type: 'status', text: 'Running…' });
      console.log('[terminal] Spawning:', spawnCmd, spawnArgs.join(' '));

      child = spawn(spawnCmd, spawnArgs, {
        cwd: tmpDir,
        // ── CRITICAL on Windows: do NOT use shell:true for the actual process ──
        // shell:true causes the shell to close stdin before our process reads it
        shell: false,
        env: {
          ...process.env,
          PYTHONUNBUFFERED:  '1',
          PYTHONIOENCODING:  'utf-8',
        },
        // 'pipe' on all three — stdin stays open until we explicitly close it
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // ── DO NOT call child.stdin.end() anywhere — that sends EOF ─────────────

      child.stdout.on('data', chunk => {
        send({ type: 'output', data: chunk.toString('utf8') });
      });

      child.stderr.on('data', chunk => {
        send({ type: 'error', data: chunk.toString('utf8') });
      });

      child.on('close', code => {
        child = null;
        clearTimeout(killTimer);
        console.log('[terminal] Process exited:', code);
        send({ type: 'exit', code: code ?? 0 });
        cleanup();
      });

      child.on('error', err => {
        console.error('[terminal] Spawn error:', err);
        send({ type: 'error', data: `Spawn error: ${err.message}\n` });
        send({ type: 'exit', code: 1 });
        cleanup();
      });

      killTimer = setTimeout(() => {
        if (child) {
          send({ type: 'error', data: `\n⏱ Time limit exceeded (${TIMEOUT_MS / 1000}s)\n` });
          send({ type: 'exit', code: 1 });
          try { child.kill('SIGKILL'); } catch (_) {}
          child = null;
        }
      }, TIMEOUT_MS);
    }

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      if (msg.type === 'run') {
        await handleRun(msg);

      } else if (msg.type === 'input') {
        // ── Write keystrokes directly to the live process stdin ──────────────
        if (child && child.stdin && !child.stdin.destroyed) {
          try {
            child.stdin.write(msg.data, 'utf8');
          } catch (err) {
            console.error('[terminal] stdin write error:', err.message);
          }
        } else {
          console.log('[terminal] input received but no live process stdin');
        }

      } else if (msg.type === 'kill') {
        cleanup();
        send({ type: 'exit', code: 1 });
      }
    });

    ws.on('close', () => {
      console.log('[terminal] Client disconnected');
      cleanup();
    });

    ws.on('error', err => {
      console.error('[terminal] WS error:', err.message);
      cleanup();
    });
  });

  return wss;
}

module.exports = { attachTerminalWS };