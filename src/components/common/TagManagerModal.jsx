import { useState, useMemo } from 'react';
import { 
  X, 
  Tag, 
  GitMerge, 
  Edit2, 
  Trash2, 
  Check, 
  AlertCircle,
  Search,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function TagManagerModal({ isOpen, onClose }) {
  const {
    prompts,
    repositories,
    bookmarks,
    renameGlobalTag,
    deleteGlobalTag,
    mergeGlobalTags,
    toast
  } = useApp();

  const [search, setSearch] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [editVal, setEditVal] = useState('');

  // 1. Aggregate tags with counts across prompts, repos, and bookmarks
  const { tagStats, duplicateGroups } = useMemo(() => {
    const statsMap = new Map(); // tagName -> { total, prompts, repos, bookmarks }

    const registerTag = (rawTag, type) => {
      if (!rawTag || typeof rawTag !== 'string') return;
      const t = rawTag.trim();
      if (!t) return;

      const current = statsMap.get(t) || { total: 0, prompts: 0, repos: 0, bookmarks: 0 };
      current.total++;
      if (type === 'prompt') current.prompts++;
      if (type === 'repo') current.repos++;
      if (type === 'bookmark') current.bookmarks++;
      statsMap.set(t, current);
    };

    prompts.forEach(p => (p.tags || []).forEach(t => registerTag(t, 'prompt')));
    repositories.forEach(r => (r.tags || []).forEach(t => registerTag(t, 'repo')));
    bookmarks.forEach(b => (b.tags || []).forEach(t => registerTag(t, 'bookmark')));

    const list = Array.from(statsMap.entries()).map(([name, counts]) => ({
      name,
      ...counts
    })).sort((a, b) => b.total - a.total);

    // Group tags by case-insensitive key to detect duplicates
    const caseMap = new Map();
    list.forEach(item => {
      const lower = item.name.toLowerCase();
      const existing = caseMap.get(lower) || [];
      existing.push(item);
      caseMap.set(lower, existing);
    });

    const duplicates = [];
    caseMap.forEach((items, lower) => {
      if (items.length > 1) {
        duplicates.push({
          canonical: lower,
          items
        });
      }
    });

    return { tagStats: list, duplicateGroups: duplicates };
  }, [prompts, repositories, bookmarks]);

  if (!isOpen) return null;

  const filteredTags = tagStats.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStartRename = (tag) => {
    setEditingTag(tag.name);
    setEditVal(tag.name);
  };

  const handleSaveRename = (oldName) => {
    const newName = editVal.trim().toLowerCase().replace(/^#/, '');
    if (newName && newName !== oldName) {
      renameGlobalTag(oldName, newName);
      toast(`Tag #${oldName} renamed to #${newName} across all items ✓`, 'cyan');
    }
    setEditingTag(null);
  };

  const handleDeleteTag = (tagName) => {
    if (window.confirm(`Delete tag #${tagName} from all prompts, repos, and bookmarks?`)) {
      deleteGlobalTag(tagName);
      toast(`Tag #${tagName} deleted ✓`, 'danger');
    }
  };

  const handleMergeGroup = (group) => {
    const targetTag = group.canonical;
    const sourceTags = group.items.map(i => i.name).filter(n => n !== targetTag);
    mergeGlobalTags(sourceTags, targetTag);
    toast(`Merged duplicate tags (${group.items.map(i => '#' + i.name).join(', ')}) into #${targetTag} ✓`, 'violet');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="industrial-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 620, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
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
              <Tag size={16} />
            </span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
                Tag Manager & Deduplication
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                {tagStats.length} total tags across prompts, repos, and bookmarks
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

        {/* Duplicate Tags Banner */}
        {duplicateGroups.length > 0 && (
          <div style={{
            padding: '14px 20px',
            background: 'rgba(245, 158, 11, 0.08)',
            borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={14} style={{ color: 'var(--color-amber)' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-amber)' }}>
                {duplicateGroups.length} Duplicate Tag Group{duplicateGroups.length > 1 ? 's' : ''} Detected
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {duplicateGroups.map(group => (
                <div
                  key={group.canonical}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {group.items.map(item => (
                      <span
                        key={item.name}
                        style={{
                          fontSize: 11,
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-primary)',
                          fontWeight: 600
                        }}
                      >
                        #{item.name} <span style={{ color: 'var(--text-tertiary)', fontSize: 10 }}>({item.total})</span>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => handleMergeGroup(group)}
                    style={{
                      background: 'var(--accent)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 'var(--radius-xs)',
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <GitMerge size={12} />
                    <span>Merge into #{group.canonical}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Input */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-card)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, color: 'var(--text-tertiary)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter tags by name..."
              style={{
                width: '100%',
                paddingLeft: 34,
                paddingRight: 12,
                height: 34,
                fontSize: 12,
                background: 'var(--bg-app)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        </div>

        {/* Tags List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filteredTags.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-tertiary)', fontSize: 12 }}>
              No tags found
            </div>
          ) : (
            filteredTags.map(tag => (
              <div
                key={tag.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)'
                }}
              >
                {editingTag === tag.name ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                    <input
                      autoFocus
                      value={editVal}
                      onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveRename(tag.name);
                        if (e.key === 'Escape') setEditingTag(null);
                      }}
                      style={{
                        height: 28,
                        padding: '0 8px',
                        fontSize: 12,
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-xs)',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <button
                      onClick={() => handleSaveRename(tag.name)}
                      style={{
                        background: 'var(--accent)',
                        color: '#000',
                        border: 'none',
                        borderRadius: 'var(--radius-xs)',
                        padding: '5px 8px',
                        cursor: 'pointer'
                      }}
                      title="Save"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => setEditingTag(null)}
                      style={{
                        background: 'transparent',
                        color: 'var(--text-tertiary)',
                        border: 'none',
                        padding: '5px',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                      #{tag.name}
                    </span>
                    <div style={{ display: 'flex', gap: 6, fontSize: 10, color: 'var(--text-tertiary)' }}>
                      {tag.prompts > 0 && <span>{tag.prompts} prompts</span>}
                      {tag.repos > 0 && <span>{tag.repos} repos</span>}
                      {tag.bookmarks > 0 && <span>{tag.bookmarks} bookmarks</span>}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    onClick={() => handleStartRename(tag)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 4,
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    title="Rename Tag"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteTag(tag.name)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 4,
                      color: 'var(--danger)',
                      opacity: 0.8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center'
                    }}
                    title="Delete Tag"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

