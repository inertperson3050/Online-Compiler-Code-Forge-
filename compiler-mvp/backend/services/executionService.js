const { execFile } = require('child_process');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { v4: uuidv4 } = require('uuid');

// Max execution time (ms) and output size (bytes)
const TIMEOUT_MS    = 10000;
const MAX_OUT_BYTES = 100 * 1024; // 100 KB

// ── Detect Python command once at startup ────────────────────────────────────
// Windows only has 'python', Linux/Mac have 'python3'.
// We try python3 first, fall back to python.
const IS_WINDOWS  = os.platform() === 'win32';
const PYTHON_CMD  = IS_WINDOWS ? 'python' : 'python3';

/**
 * Execute code locally using installed compilers/interpreters.
 * Each run gets an isolated temp directory that is cleaned up afterwards.
 */
async function executeCode(language, code, stdin = '') {
  const runId  = uuidv4();
  const tmpDir = path.join(os.tmpdir(), `codeforge_${runId}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    switch (language) {
      case 'python': return await runPython(tmpDir, code, stdin);
      case 'c':      return await runC(tmpDir, code, stdin);
      case 'cpp':    return await runCpp(tmpDir, code, stdin);
      case 'java':   return await runJava(tmpDir, code, stdin);
      default:       throw new Error(`Unsupported language: ${language}`);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

// ── Python ───────────────────────────────────────────────────────────────────
function runPython(dir, code, stdin) {
  const file = path.join(dir, 'main.py');
  fs.writeFileSync(file, code);
  // Use detected command — 'python' on Windows, 'python3' on Linux/Mac
  return runProcess(PYTHON_CMD, [file], stdin, dir);
}

// ── C ────────────────────────────────────────────────────────────────────────
async function runC(dir, code, stdin) {
  const src = path.join(dir, 'main.c');
  const bin = path.join(dir, IS_WINDOWS ? 'main.exe' : 'main');
  fs.writeFileSync(src, code);

  const compile = await runProcess('gcc', [src, '-o', bin, '-lm', '-w'], '', dir, true);
  if (compile.exitCode !== 0) {
    return { output: '', stderr: compile.stderr || compile.output, exitCode: 1, status: 'Compilation Error' };
  }
  return runProcess(bin, [], stdin, dir);
}

// ── C++ ──────────────────────────────────────────────────────────────────────
async function runCpp(dir, code, stdin) {
  const src = path.join(dir, 'main.cpp');
  const bin = path.join(dir, IS_WINDOWS ? 'main.exe' : 'main');
  fs.writeFileSync(src, code);

  const compile = await runProcess('g++', [src, '-o', bin, '-std=c++17', '-lm', '-w'], '', dir, true);
  if (compile.exitCode !== 0) {
    return { output: '', stderr: compile.stderr || compile.output, exitCode: 1, status: 'Compilation Error' };
  }
  return runProcess(bin, [], stdin, dir);
}

// ── Java ─────────────────────────────────────────────────────────────────────
async function runJava(dir, code, stdin) {
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  const className  = classMatch ? classMatch[1] : 'Main';
  const src        = path.join(dir, `${className}.java`);
  fs.writeFileSync(src, code);

  const compile = await runProcess('javac', [src], '', dir, true);
  if (compile.exitCode !== 0) {
    return { output: '', stderr: compile.stderr || compile.output, exitCode: 1, status: 'Compilation Error' };
  }
  return runProcess('java', ['-cp', dir, className], stdin, dir);
}

// ── Generic process runner ───────────────────────────────────────────────────
function runProcess(cmd, args, stdin, cwd, isCompile = false) {
  return new Promise((resolve) => {
    const start  = Date.now();
    let timedOut = false;

    const child = execFile(cmd, args, {
      cwd,
      timeout:   isCompile ? 15000 : TIMEOUT_MS,
      maxBuffer: MAX_OUT_BYTES,
      env: { ...process.env, LANG: 'en_US.UTF-8' },
      // On Windows, shell: true is needed to find executables correctly
      shell: IS_WINDOWS,
    }, (err, stdout, stderr) => {
      stdout = stdout || '';
      stderr = stderr || '';

      if (err) {
        if (err.killed || err.signal === 'SIGTERM') {
          timedOut = true;
          stderr = `⏱ Time limit exceeded (${TIMEOUT_MS / 1000}s)`;
        } else if (err.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
          stderr = '⚠ Output too large (max 100 KB)';
        }
      }

      const elapsed = ((Date.now() - start) / 1000).toFixed(2) + 's';
      resolve({
        output:        stdout.trimEnd(),
        stderr:        stderr.trimEnd(),
        exitCode:      timedOut ? 1 : (err ? (err.code ?? 1) : 0),
        executionTime: elapsed,
        status:        timedOut ? 'Time Limit Exceeded' : (err ? 'Runtime Error' : 'Accepted'),
      });
    });

    if (stdin && child.stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    } else if (child.stdin) {
      child.stdin.end();
    }
  });
}

module.exports = { executeCode };
