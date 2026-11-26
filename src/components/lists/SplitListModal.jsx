import { useState } from 'react';
import { X, Scissors, Layers, Check, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function SplitListModal({
  isOpen,
  onClose,
  listName,
  items = []
}) {
  const {
    deleteCategory,
    removeResourceFromCollection,
    toast
  } = useApp();

  const [keepOriginalList, setKeepOriginalList] = useState(true);

  if (!isOpen || !listName) return null;

  const handleSplit = () => {
    if (!keepOriginalList) {
      // Dissolve the list while keeping items intact
      items.forEach(item => {
        removeResourceFromCollection(item.type, item.id, listName);
      });
      deleteCategory(listName);
      toast(`List "${listName}" split into ${items.length} individual items and removed list ✓`, 'violet');
    } else {
      toast(`Confirmed ${items.length} items as standalone items while keeping list "${listName}" ✓`, 'cyan');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="industrial-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 500, animation: 'scaleUp 0.15s ease' }}
      >
        {/* Header */}
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
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-muted)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Scissors size={16} />
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
                Split Saved List
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {listName} ({items.length} items)
              </div>
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

        {/* Content */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Splitting this saved list ensures every prompt, repository, and bookmark exists as an independent, individual item in your respective libraries.
          </div>

          {/* Items Summary */}
          <div style={{
            padding: '12px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              Items in this list:
            </span>
            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
              • {items.filter(i => i.type === 'prompt').length} Prompts
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
              • {items.filter(i => i.type === 'repo').length} GitHub Repositories
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
              • {items.filter(i => i.type === 'bookmark').length} Bookmarks & Notes
            </div>
          </div>

          {/* Option: Keep Original List */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer'
          }}>
            <input
              type="checkbox"
              checked={keepOriginalList}
              onChange={e => setKeepOriginalList(e.target.checked)}
              style={{ accentColor: 'var(--accent)', cursor: 'pointer', width: 16, height: 16 }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                Keep original list
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                Retains "{listName}" as a project container in addition to individual items.
              </div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 10
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSplit}
            style={{
              padding: '8px 20px',
              fontSize: 12,
              fontWeight: 700,
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: '#000',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Scissors size={14} />
            <span>Split List</span>
          </button>
        </div>
      </div>
    </div>
  );
}

