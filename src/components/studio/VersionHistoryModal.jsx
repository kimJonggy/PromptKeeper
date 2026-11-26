import { useState } from 'react';

export default function VersionHistoryModal({
  isOpen,
  onClose,
  prompt,
  onRestoreVersion
}) {
  const versions = prompt?.versions || [];
  const [selectedVerIndex, setSelectedVerIndex] = useState(0);

  if (!isOpen || !prompt) return null;

  const currentSelected = versions[selectedVerIndex] || {
    version: 1,
    timestamp: prompt.created || 0,
    title: prompt.title,
    body: prompt.body,
    model: prompt.model,
    note: 'Initial snapshot'
  };

  const handleRestore = () => {
    if (window.confirm(`Restore prompt to Version ${currentSelected.version}? Current content will be saved as a new version.`)) {
      onRestoreVersion(prompt.id, currentSelected);
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 130,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="industrial-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '780px',
          maxWidth: '94%',
          height: '75vh',
          maxHeight: '650px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-medium)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18, color: 'var(--accent)' }}>⏱</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: 0.5 }}>
                VERSION HISTORY: {prompt.title.toUpperCase()}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {versions.length} recorded version{versions.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              fontSize: 16,
              cursor: 'pointer',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body: Left sidebar version list + Right viewer */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          
          {/* Left Column: Version Snapshots List */}
          <div style={{
            width: '260px',
            borderRight: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            overflowY: 'auto',
            padding: '12px'
          }}>
            {versions.length === 0 ? (
              <div style={{ padding: '20px 12px', fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
                No prior version snapshots recorded yet. Versions are automatically saved when editing prompts.
              </div>
            ) : (
              versions.map((ver, idx) => {
                const isSelected = idx === selectedVerIndex;
                const dateStr = new Date(ver.timestamp).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <div
                    key={ver.version || idx}
                    onClick={() => setSelectedVerIndex(idx)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-xs)',
                      background: isSelected ? 'var(--accent-muted)' : 'transparent',
                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                      border: isSelected ? '1px solid var(--accent-glow)' : '1px solid transparent',
                      marginBottom: 6,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>v{ver.version || (versions.length - idx)}</span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{dateStr}</span>
                    </div>
                    {ver.note && (
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ver.note}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      Model: {ver.model || 'General'}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Version Snapshot Content Inspector */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', overflow: 'hidden' }}>
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)'
            }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Version {currentSelected.version || 1} — {new Date(currentSelected.timestamp).toLocaleString()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Model: {currentSelected.model || 'General'} • Title: {currentSelected.title}
                </div>
              </div>

              <button
                className="btn"
                onClick={handleRestore}
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: 11,
                  padding: '6px 14px',
                  borderRadius: 4
                }}
              >
                Restore This Version
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>
                Template Content
              </div>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                color: 'var(--text-primary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                minHeight: '200px'
              }}>
                {currentSelected.body}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-card)',
          display: 'flex',
          justifyContent: 'flex-end'
        }}>
          <button
            className="btn"
            onClick={onClose}
            style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '6px 16px', fontSize: 12 }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
