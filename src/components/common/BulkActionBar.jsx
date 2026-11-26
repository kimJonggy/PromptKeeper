import { useState } from 'react';
import { 
  X, 
  Tag, 
  Layers, 
  Archive, 
  Trash2, 
  Check, 
  CheckSquare, 
  Square 
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function BulkActionBar({
  selectedIds = [],
  onClearSelection,
  totalItemsCount = 0,
  onSelectAll
}) {
  const {
    categories,
    bulkAddTag,
    bulkAddToList,
    bulkArchive,
    bulkDelete,
    toast
  } = useApp();

  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagVal, setNewTagVal] = useState('');
  const [showListSelect, setShowListSelect] = useState(false);
  const [selectedList, setSelectedList] = useState('');

  if (selectedIds.length === 0) return null;

  const handleApplyTag = () => {
    const cleanTag = newTagVal.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;
    bulkAddTag(selectedIds, cleanTag);
    toast(`Added #${cleanTag} to ${selectedIds.length} items ✓`, 'cyan');
    setNewTagVal('');
    setShowTagInput(false);
  };

  const handleApplyList = () => {
    if (!selectedList || selectedList === 'All') return;
    bulkAddToList(selectedIds, selectedList);
    toast(`Added ${selectedIds.length} items to "${selectedList}" ✓`, 'violet');
    setShowListSelect(false);
    setSelectedList('');
  };

  const handleArchive = () => {
    bulkArchive(selectedIds);
    toast(`Archived ${selectedIds.length} items ✓`, 'cyan');
    onClearSelection();
  };

  const handleDelete = () => {
    if (window.confirm(`Permanently delete ${selectedIds.length} selected items?`)) {
      bulkDelete(selectedIds);
      toast(`Deleted ${selectedIds.length} items`, 'danger');
      onClearSelection();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'var(--bg-card)',
      border: '1px solid var(--border-medium)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-glow)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      backdropFilter: 'blur(16px)',
      animation: 'slideUp 0.15s ease'
    }}>
      {/* Selection count */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 8, borderRight: '1px solid var(--border-subtle)' }}>
        <span style={{
          background: 'var(--accent)',
          color: '#000',
          fontWeight: 800,
          fontSize: 11,
          padding: '2px 8px',
          borderRadius: 10
        }}>
          {selectedIds.length}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
          Selected
        </span>
      </div>

      {/* Select All toggle */}
      {totalItemsCount > 0 && (
        <button
          onClick={onSelectAll}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 11,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {selectedIds.length === totalItemsCount ? <CheckSquare size={13} /> : <Square size={13} />}
          <span>{selectedIds.length === totalItemsCount ? 'Deselect All' : 'Select All'}</span>
        </button>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {/* Add Tag */}
        {showTagInput ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input
              autoFocus
              value={newTagVal}
              onChange={e => setNewTagVal(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleApplyTag();
                if (e.key === 'Escape') setShowTagInput(false);
              }}
              placeholder="Tag name..."
              style={{
                height: 28,
                padding: '0 8px',
                fontSize: 11,
                background: 'var(--bg-app)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-primary)',
                width: 100
              }}
            />
            <button
              onClick={handleApplyTag}
              style={{
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700
              }}
            >
              <Check size={11} />
            </button>
            <button
              onClick={() => setShowTagInput(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Tag size={12} />
            <span>Add Tag</span>
          </button>
        )}

        {/* Add to List */}
        {showListSelect ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <select
              value={selectedList}
              onChange={e => setSelectedList(e.target.value)}
              style={{
                height: 28,
                fontSize: 11,
                background: 'var(--bg-app)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-primary)',
                padding: '0 4px'
              }}
            >
              <option value="">Select list...</option>
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleApplyList}
              disabled={!selectedList}
              style={{
                background: 'var(--accent)',
                color: '#000',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 700,
                opacity: selectedList ? 1 : 0.5
              }}
            >
              <Check size={11} />
            </button>
            <button
              onClick={() => setShowListSelect(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }}
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowListSelect(true)}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              fontWeight: 600,
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Layers size={12} />
            <span>Add to List</span>
          </button>
        )}

        {/* Archive */}
        <button
          onClick={handleArchive}
          style={{
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 600,
            background: 'var(--bg-surface-hover)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Archive size={12} />
          <span>Archive</span>
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          style={{
            padding: '6px 10px',
            fontSize: 11,
            fontWeight: 600,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--radius-xs)',
            color: 'var(--danger)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Trash2 size={12} />
          <span>Delete</span>
        </button>
      </div>

      {/* Close/Clear */}
      <button
        onClick={onClearSelection}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-tertiary)',
          cursor: 'pointer',
          padding: 4,
          marginLeft: 4,
          display: 'flex',
          alignItems: 'center'
        }}
        title="Clear Selection"
      >
        <X size={14} />
      </button>
    </div>
  );
}

