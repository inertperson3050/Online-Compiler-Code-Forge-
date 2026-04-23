import { useState, useCallback, useRef } from 'react';
import CodeEditor from './components/CodeEditor.jsx';
import OutputPanel from './components/OutputPanel.jsx';
import AIPanel from './components/AIPanel.jsx';
import SnippetsDrawer from './components/SnippetsDrawer.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import { useToast } from './hooks/useToast.js';
import { askAI } from './utils/api.js';
import { LANGUAGES, DEFAULT_CODE } from './utils/constants.js';

export default function App() {
  const [language, setLanguage]     = useState('python');
  const [code, setCode]             = useState(DEFAULT_CODE['python']);
  const [isRunning, setIsRunning]   = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiError, setAiError]       = useState('');
  const [aiLoading, setAiLoading]   = useState(false);

  const terminalRef = useRef(null);
  const { toasts, toast } = useToast();

  function handleLanguageChange(e) {
    const lang = e.target.value;
    const isDefault = Object.values(DEFAULT_CODE).some(d => d.trim() === code.trim());
    if (isDefault || !code.trim()) setCode(DEFAULT_CODE[lang]);
    setLanguage(lang);
    setAiResponse('');
    setAiError('');
  }

  function handleRun() {
    if (!code.trim()) return toast.error('Write some code first!');
    terminalRef.current?.run(language, code);
  }

  function handleStop() {
    terminalRef.current?.kill();
  }

  const handleAskAI = useCallback(async ({ mode, question }) => {
    if (!code.trim()) return toast.error('Write some code first!');
    setAiLoading(true);
    setAiResponse('');
    setAiError('');
    try {
      const data = await askAI({ code, language, question, output: '', mode });
      setAiResponse(data.response);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'AI request failed';
      setAiError(msg);
      toast.error('AI request failed');
    } finally {
      setAiLoading(false);
    }
  }, [code, language, toast]);

  function handleSnippetLoad(lang, snippetCode) {
    setLanguage(lang);
    setCode(snippetCode);
    setAiResponse('');
    setAiError('');
  }

  function handleClear() {
    setCode(DEFAULT_CODE[language]);
    setAiResponse('');
    setAiError('');
  }

  const currentLang = LANGUAGES.find(l => l.id === language);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">⚡</div>
          <span>CodeForge</span>
          <span className="logo-sub">Online Compiler</span>
        </div>

        <div className="header-controls">
          <select className="lang-select" value={language} onChange={handleLanguageChange}>
            {LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>

          {isRunning ? (
            <button className="btn btn-danger" onClick={handleStop}>■ Stop</button>
          ) : (
            <button className="btn btn-success" onClick={handleRun}>▶ Run</button>
          )}

          <button className="btn btn-primary btn-sm" onClick={() => handleAskAI({ mode:'explain', question:'' })} disabled={aiLoading}>
            ✨ Explain
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleClear}>↺ Reset</button>
        </div>

        <div className="header-right">
          <SnippetsDrawer language={language} code={code} onLoad={handleSnippetLoad} toast={toast} />
          <span style={{
            fontSize:11, color:'var(--text-2)', fontFamily:'var(--font-code)',
            padding:'3px 8px', background:'var(--bg-3)',
            borderRadius:'var(--radius)', border:'1px solid var(--border)',
          }}>
            {currentLang?.ext}
          </span>
        </div>
      </header>

      <main className="main-layout">
        <div className="left-panel">
          <div className="panel editor-panel">
            <div className="panel-header">
              <div className="panel-title">
                <span className="panel-title-icon">📝</span>
                Code Editor
                <span style={{
                  fontSize:10, color:'var(--text-2)', background:'var(--bg-3)',
                  padding:'1px 6px', borderRadius:3, border:'1px solid var(--border)',
                }}>
                  {currentLang?.label}
                </span>
              </div>
              <span style={{ fontSize:10, color:'var(--text-2)' }}>
                {code.split('\n').length} lines
              </span>
            </div>
            <div className="panel-body">
              <CodeEditor language={currentLang?.monacoId || language} code={code} onChange={setCode} />
            </div>
          </div>

          <OutputPanel
            ref={terminalRef}
            onRunStart={() => setIsRunning(true)}
            onRunEnd={({ exitCode }) => {
              setIsRunning(false);
              exitCode === 0 ? toast.success('Execution complete') : toast.error('Program exited with error');
            }}
          />
        </div>

        <div className="right-panel">
          <AIPanel onAsk={handleAskAI} isLoading={aiLoading} response={aiResponse} error={aiError} />
        </div>
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}