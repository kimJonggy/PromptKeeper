import { useState, useMemo } from 'react';
import { 
  Inbox, 
  Sparkles, 
  FolderGit2, 
  Bookmark, 
  Check, 
  Tag, 
  FileText, 
  Trash2, 
  ArrowUpRight, 
  Plus, 
  Filter 
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function InboxView() {
  const {
    prompts,
    repositories,
    bookmarks,
    updatePrompt,
    updateRepository,
    updateBookmark,
    deletePrompt,
    deleteRepository,
    deleteBookmark,
    setActiveNav,
    setActiveId,
    toast
  } = useApp();

  const [filterType, setFilterType] = useState('all'); // 'all' | 'untagged' | 'prompts' | 'repos' | 'bookmarks'
  const [editingItemId, setEditingItemId] = useState(null);
  const [newTagInput, setNewTagInput] = useState('');

  // Collect all items in inbox status or untagged
  const inboxItems = useMemo(() => {
    const list = [];

    prompts.forEach(p => {
      const isInbox = p.status === 'inbox' || !p.tags || p.tags.length === 0;
      if (isInbox) {
        list.push({
          id: p.id,
          type: 'prompt',
          title: p.title,
          subtitle: p.body,
          tags: p.tags || [],
          notes: p.notes || '',
          status: p.status || 'inbox',
          date: p.created || 0,
          raw: p
        });
      }
    });

    repositories.forEach(r => {
      const isInbox = r.status === 'inbox' || !r.tags || r.tags.length === 0;
      if (isInbox) {
        list.push({
          id: r.id,
          type: 'repo',
          title: r.fullName || r.name,
          subtitle: r.description || r.canonicalUrl,
          tags: r.tags || [],
          notes: r.personalNotes || '',
          status: r.status || 'inbox',
          date: r.savedAt || 0,
          raw: r
        });
      }
    });

    bookmarks.forEach(b => {
      const isInbox = b.status === 'inbox' || !b.tags || b.tags.length === 0;
      if (isInbox) {
        list.push({
          id: b.id,
          type: 'bookmark',
          title: b.title || b.domain,
          subtitle: b.url,
          tags: b.tags || [],
          notes: b.personalNotes || b.notes || '',
          status: b.status || 'inbox',
          date: b.createdAt || 0,
          raw: b
        });
      }
    });

    return list.sort((a, b) => b.date - a.date);
  }, [prompts, repositories, bookmarks]);

  const filteredItems = useMemo(() => {
    if (filterType === 'all') return inboxItems;
    if (filterType === 'untagged') return inboxItems.filter(i => !i.tags || i.tags.length === 0);
    if (filterType === 'prompts') return inboxItems.filter(i => i.type === 'prompt');
    if (filterType === 'repos') return inboxItems.filter(i => i.type === 'repo');
    if (filterType === 'bookmarks') return inboxItems.filter(i => i.type === 'bookmark');
    return inboxItems;
  }, [inboxItems, filterType]);

  const handleMarkTriaged = (item) => {
    if (item.type === 'prompt') {
      updatePrompt({ ...item.raw, status: 'active' });
    } else if (item.type === 'repo') {
      updateRepository(item.id, { status: 'active' });
    } else if (item.type === 'bookmark') {
      updateBookmark(item.id, { status: 'reading' });
    }
    toast(`"${item.title}" triaged and moved to Library ✓`, 'violet');
  };

  const handleAddTag = (item) => {
    const cleanTag = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;

    const currentTags = item.tags || [];
    if (currentTags.includes(cleanTag)) {
      setNewTagInput('');
      return;
    }

    const nextTags = [...currentTags, cleanTag];
    if (item.type === 'prompt') {
      updatePrompt({ ...item.raw, tags: nextTags });
    } else if (item.type === 'repo') {
      updateRepository(item.id, { tags: nextTags });
    } else if (item.type === 'bookmark') {
      updateBookmark(item.id, { tags: nextTags });
    }

    setNewTagInput('');
    toast(`Tag #${cleanTag} added ✓`, 'cyan');
  };

  const handleDelete = (item) => {
    if (window.confirm(`Delete "${item.title}"?`)) {
      if (item.type === 'prompt') deletePrompt(item.id);
      else if (item.type === 'repo') deleteRepository(item.id);
      else if (item.type === 'bookmark') deleteBookmark(item.id);
      toast(`Deleted "${item.title}"`, 'danger');
    }
  };

  const handleOpenItem = (item) => {
    if (item.type === 'prompt') {
      setActiveNav('prompts');
      setActiveId(item.id);
    } else if (item.type === 'repo') {
      setActiveNav('repos');
    } else if (item.type === 'bookmark') {
      setActiveNav('bookmarks');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg-app)' }}>
      {/* Header Toolbar */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent)',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800
          }}>
            <Inbox size={18} />
          </span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Inbox & Triage
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {inboxItems.length} items awaiting tags, notes, or organization
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 3, gap: 4 }}>
          {[
            { id: 'all', label: `All (${inboxItems.length})` },
            { id: 'untagged', label: `Untagged (${inboxItems.filter(i => !i.tags || i.tags.length === 0).length})` },
            { id: 'prompts', label: 'Prompts' },
            { id: 'repos', label: 'Repos' },
            { id: 'bookmarks', label: 'Bookmarks' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              style={{
                background: filterType === tab.id ? 'var(--accent-muted)' : 'transparent',
                color: filterType === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                border: 'none',
                borderRadius: 'var(--radius-xs)',
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items List */}
      <div className="main-scroll-view" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
              Inbox Zero!
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              All saved items have been tagged and organized.
            </div>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={`${item.type}-${item.id}`}
              className="bento-card"
              style={{
                padding: '20px 24px',
                background: 'var(--bento-card-bg)',
                border: '1px solid var(--bento-card-border)',
                borderRadius: '24px',
                boxShadow: 'var(--shadow-rim)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
              }}
            >
              <div className="bento-rim" aria-hidden="true" />
              {/* Card top row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <span className="chip" style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontFamily: 'Geist Mono, monospace',
                    background: item.type === 'repo' ? 'rgba(59, 130, 246, 0.15)' : item.type === 'bookmark' ? 'rgba(16, 185, 129, 0.15)' : 'var(--accent-muted)',
                    color: item.type === 'repo' ? 'var(--color-blue)' : item.type === 'bookmark' ? 'var(--color-green)' : 'var(--accent)',
                    border: `1px solid ${item.type === 'repo' ? 'rgba(59, 130, 246, 0.3)' : item.type === 'bookmark' ? 'rgba(16, 185, 129, 0.3)' : 'var(--accent-glow)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5
                  }}>
                    {item.type === 'repo' ? <FolderGit2 size={12} /> : item.type === 'bookmark' ? <Bookmark size={12} /> : <Sparkles size={12} />}
                    {item.type}
                  </span>
                  <div
                    onClick={() => handleOpenItem(item)}
                    className="bento-ttl"
                    style={{ fontSize: 15, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, overflow: 'hidden' }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    <ArrowUpRight size={13} style={{ opacity: 0.5, flexShrink: 0 }} />
                  </div>
                </div>

                {/* Triage action button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => handleMarkTriaged(item)}
                    style={{
                      background: 'var(--accent)',
                      color: '#0b0b0c',
                      border: 'none',
                      borderRadius: '14px',
                      height: 28,
                      padding: '0 14px',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: 'Geist Mono, monospace',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                      transition: 'all 0.2s'
                    }}
                    title="Mark as organized / Move to Library"
                  >
                    <Check size={12} strokeWidth={2.5} />
                    <span>Triage Done</span>
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    style={{
                      background: 'transparent',
                      color: 'var(--text-tertiary)',
                      border: 'none',
                      padding: 6,
                      cursor: 'pointer'
                    }}
                    title="Delete item"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Snippet / Subtitle */}
              {item.subtitle && (
                <div 
                  className="bento-recess"
                  style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.55, maxHeight: 60, overflow: 'hidden', fontFamily: 'Geist, sans-serif' }}
                >
                  {item.subtitle}
                </div>
              )}

              {/* Tags & Quick Tag Add */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Tag size={12} /> Tags:
                </span>
                {item.tags.length === 0 ? (
                  <span style={{ fontSize: 11, color: 'var(--color-amber)', fontStyle: 'italic', fontWeight: 600 }}>
                    Untagged
                  </span>
                ) : (
                  item.tags.map(t => (
                    <span
                      key={t}
                      style={{
                        fontSize: 11,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 4,
                        padding: '2px 7px',
                        color: 'var(--text-primary)'
                      }}
                    >
                      #{t}
                    </span>
                  ))
                )}

                {/* Inline quick tag input */}
                {editingItemId === item.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <input
                      autoFocus
                      value={newTagInput}
                      onChange={e => setNewTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleAddTag(item);
                        if (e.key === 'Escape') setEditingItemId(null);
                      }}
                      placeholder="tag..."
                      style={{
                        height: 24,
                        padding: '0 6px',
                        fontSize: 11,
                        background: 'var(--bg-app)',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 3,
                        color: 'var(--text-primary)',
                        width: 80
                      }}
                    />
                    <button
                      onClick={() => handleAddTag(item)}
                      style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 3, padding: '2px 6px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setEditingItemId(null)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 10 }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingItemId(item.id); setNewTagInput(''); }}
                    style={{
                      background: 'transparent',
                      border: '1px dashed var(--border-medium)',
                      borderRadius: 3,
                      padding: '2px 7px',
                      fontSize: 10,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <Plus size={10} /> Add tag
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
