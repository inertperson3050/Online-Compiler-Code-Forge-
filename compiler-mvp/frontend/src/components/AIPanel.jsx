import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MODES = [
  { id: 'explain', label: '💡 Explain', tip: 'Explain what this code does' },
  { id: 'predict', label: '🔮 Predict', tip: 'Predict the output' },
  { id: 'debug',   label: '🐛 Debug',   tip: 'Find and fix bugs' },
  { id: 'custom',  label: '💬 Ask',     tip: 'Ask a custom question' },
];

export default function AIPanel({ onAsk, isLoading, response, error }) {
  const [mode, setMode] = useState('explain');
  const [question, setQuestion] = useState('');

  function handleAsk() {
    onAsk({ mode, question: mode === 'custom' ? question : '' });
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  return (
    <div className="panel ai-panel">
      <div className="panel-header">
        <div className="panel-title">
          <span className="panel-title-icon">✨</span>
          AI Assistant
          <span style={{
            fontSize: 9, fontWeight: 700, background: 'linear-gradient(90deg, var(--accent), var(--purple))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '0.1em', marginLeft: 2,
          }}>
            GEMINI
          </span>
        </div>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--purple)', fontSize: 11 }}>
            <div className="spinner" style={{ borderTopColor: 'var(--purple)', width: 10, height: 10 }} />
            Thinking…
          </div>
        )}
      </div>

      <div className="ai-panel-body">
        {/* Mode tabs */}
        <div className="ai-mode-tabs">
          {MODES.map(m => (
            <button
              key={m.id}
              className={`ai-tab ${mode === m.id ? 'active' : ''}`}
              onClick={() => setMode(m.id)}
              title={m.tip}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Custom question input */}
        {mode === 'custom' && (
          <div className="ai-question-wrap">
            <textarea
              className="ai-question-input"
              placeholder="Ask anything about your code… (Enter to send)"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
          </div>
        )}

        {/* Ask button */}
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={handleAsk}
            disabled={isLoading || (mode === 'custom' && !question.trim())}
          >
            {isLoading ? (
              <><div className="spinner" /> Analyzing…</>
            ) : (
              <>✨ Ask AI — {MODES.find(m => m.id === mode)?.label.split(' ').slice(1).join(' ')}</>
            )}
          </button>
        </div>

        {/* Response area */}
        <div className="ai-response">
          {!response && !error && !isLoading && (
            <div className="ai-empty">
              <div className="ai-empty-icon">🤖</div>
              <div className="ai-empty-text">
                Select a mode above and click <strong>Ask AI</strong> to analyze your code.
                <br /><br />
                <span style={{ color: 'var(--text-2)' }}>
                  Powered by Gemini Flash
                </span>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="ai-empty">
              <div style={{ fontSize: 24 }} className="loading-pulse">✨</div>
              <div className="ai-empty-text loading-pulse">
                Gemini is analyzing your code…
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div style={{
              background: 'var(--red-dim)', border: '1px solid var(--red)',
              borderRadius: 'var(--radius)', padding: '10px 12px',
              color: 'var(--red)', fontSize: 12,
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {response && !isLoading && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {response}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
