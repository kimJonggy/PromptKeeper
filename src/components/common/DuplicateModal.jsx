import { X, AlertTriangle, ExternalLink, ArrowRight, Copy } from 'lucide-react';

/**
 * DuplicateModal
 * Displays when a duplicate URL or prompt is detected upon save.
 * Provides 3 explicit options:
 * 1. Open Existing
 * 2. Skip
 * 3. Save Anyway
 */
export default function DuplicateModal({
  isOpen,
  onClose,
  duplicateInfo,
  onOpenExisting,
  onSkip,
  onSaveAnyway
}) {
  if (!isOpen || !duplicateInfo) return null;

  const { existingItem, type, reason } = duplicateInfo;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="industrial-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 520, animation: 'scaleUp 0.15s ease' }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-hover)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--color-amber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertTriangle size={16} />
            </span>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
              Duplicate Item Detected
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {reason || 'An item matching this content or URL already exists in your workspace.'}
          </div>

          {/* Existing Item Card */}
          {existingItem && (
            <div style={{
              padding: '14px 16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--bg-surface-hover)',
                  color: 'var(--text-secondary)'
                }}>
                  {type === 'repo' ? 'Repository' : type === 'bookmark' ? 'Bookmark' : 'Prompt'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                  ID: {String(existingItem.id).slice(0, 8)}…
                </span>
              </div>

              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                {existingItem.title || existingItem.fullName || existingItem.name || 'Untitled'}
              </div>

              {existingItem.canonicalUrl && (
                <div style={{ fontSize: 11, color: 'var(--color-blue)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {existingItem.canonicalUrl}
                </div>
              )}
              {existingItem.url && (
                <div style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {existingItem.url}
                </div>
              )}
              {existingItem.body && (
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, maxHeight: 60, overflow: 'hidden' }}>
                  {existingItem.body.slice(0, 140)}…
                </div>
              )}
            </div>
          )}

          <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            Choose how you would like to proceed:
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => {
                onOpenExisting(existingItem);
                onClose();
              }}
              style={{
                padding: '12px 16px',
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ExternalLink size={16} />
                <span>Open Existing Item</span>
              </div>
              <ArrowRight size={14} />
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => {
                  onSkip();
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Skip (Don't Save)
              </button>
              <button
                onClick={() => {
                  onSaveAnyway();
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  background: 'var(--bg-surface-hover)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                Save Anyway (Duplicate)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

