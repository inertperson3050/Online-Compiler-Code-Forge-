import { useState, useEffect } from 'react';
import { fetchSnippets, saveSnippet, deleteSnippet, loadSnippet } from '../utils/api';

export default function SnippetsDrawer({ language, code, onLoad, toast }) {
  const [open, setOpen]       = useState(false);
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle]     = useState('');
  const [saving, setSaving]   = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchSnippets();
      setSnippets(data);
    } catch {
      toast.error('Could not load snippets (MongoDB not connected)');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  async function handleSave() {
    if (!code.trim()) return toast.error('Nothing to save.');
    setSaving(true);
    try {
      await saveSnippet(title || `Untitled ${language}`, language, code);
      toast.success('Snippet saved!');
      setTitle('');
      load();
    } catch {
      toast.error('Could not save snippet.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLoad(id) {
    try {
      const s = await loadSnippet(id);
      onLoad(s.language, s.code);
      setOpen(false);
      toast.success(`Loaded: ${s.title}`);
    } catch {
      toast.error('Could not load snippet.');
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    try {
      await deleteSnippet(id);
      setSnippets(prev => prev.filter(s => s._id !== id));
      toast.info('Snippet deleted.');
    } catch {
      toast.error('Could not delete snippet.');
    }
  }

  const langBadge = {
    c: 'badge-c', cpp: 'badge-cpp', python: 'badge-python', java: 'badge-java',
  };

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setOpen(o => !o)} title="Saved snippets">
        📁 Snippets
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 50, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
          paddingTop: 'var(--header-h)', paddingRight: 8,
        }}
          onClick={() => setOpen(false)}
        >
          <div style={{
            background: 'var(--bg-1)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', width: 320, maxHeight: '70vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            marginTop: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '10px 14px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 600, fontSize: 13 }}>📁 Saved Snippets</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>✕</button>
            </div>

            {/* Save current */}
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6 }}>
              <input
                style={{
                  flex: 1, background: 'var(--bg-3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)', padding: '5px 8px',
                  color: 'var(--text-0)', fontFamily: 'var(--font-ui)', fontSize: 12, outline: 'none',
                }}
                placeholder="Snippet title…"
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <div className="spinner" /> : '💾 Save'}
              </button>
            </div>

            {/* List */}
            <div className="snippets-list">
              {loading && (
                <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: 16, fontSize: 12 }}>
                  Loading…
                </div>
              )}
              {!loading && snippets.length === 0 && (
                <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: 16, fontSize: 12 }}>
                  No saved snippets yet.
                </div>
              )}
              {snippets.map(s => (
                <div
                  key={s._id}
                  className="snippet-item"
                  onClick={() => handleLoad(s._id)}
                >
                  <span className={`snippet-lang-badge ${langBadge[s.language] || ''}`}>
                    {s.language}
                  </span>
                  <span className="snippet-name">{s.title}</span>
                  <button
                    className="btn btn-danger-ghost btn-sm"
                    style={{ padding: '2px 6px', fontSize: 11 }}
                    onClick={e => handleDelete(e, s._id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
