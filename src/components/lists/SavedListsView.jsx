import { useState, useMemo } from 'react';
import { 
  Layers, 
  FolderGit2, 
  Bookmark, 
  Sparkles, 
  Scissors, 
  Plus, 
  Trash2, 
  ExternalLink,
  Edit2
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import SplitListModal from './SplitListModal.jsx';

export default function SavedListsView() {
  const {
    categories,
    collectionStats,
    categoryColors,
    prompts,
    repositories,
    bookmarks,
    addCategory,
    deleteCategory,
    setActiveNav,
    setActiveId
  } = useApp();

  const [activeList, setActiveList] = useState(
    categories.find(c => c !== 'All') || 'General'
  );
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [splitModalOpen, setSplitModalOpen] = useState(false);

  // Collect items belonging to activeList
  const listItems = useMemo(() => {
    if (!activeList || activeList === 'All') return [];

    const items = [];

    prompts.forEach(p => {
      const colls = Array.isArray(p.collections) ? p.collections : (p.category ? [p.category] : []);
      if (colls.includes(activeList) || p.category === activeList) {
        items.push({
          id: p.id,
          type: 'prompt',
          title: p.title,
          subtitle: p.body,
          tags: p.tags || [],
          raw: p
        });
      }
    });

    repositories.forEach(r => {
      const colls = Array.isArray(r.collections) ? r.collections : [];
      if (colls.includes(activeList)) {
        items.push({
          id: r.id,
          type: 'repo',
          title: r.fullName || r.name,
          subtitle: r.description || r.canonicalUrl,
          tags: r.tags || [],
          raw: r
        });
      }
    });

    bookmarks.forEach(b => {
      const colls = Array.isArray(b.collections) ? b.collections : (b.category ? [b.category] : []);
      if (colls.includes(activeList) || b.category === activeList) {
        items.push({
          id: b.id,
          type: 'bookmark',
          title: b.title || b.domain,
          subtitle: b.url,
          tags: b.tags || [],
          raw: b
        });
      }
    });

    return items;
  }, [activeList, prompts, repositories, bookmarks]);

  const handleCreateList = () => {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    addCategory(trimmed);
    setActiveList(trimmed);
    setNewListName('');
    setIsCreatingList(false);
  };

  const handleDeleteList = (listName) => {
    if (window.confirm(`Delete saved list "${listName}"? Items inside will remain in their libraries.`)) {
      deleteCategory(listName);
      const remaining = categories.filter(c => c !== 'All' && c !== listName);
      setActiveList(remaining[0] || 'All');
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

  const availableLists = categories.filter(c => c !== 'All');

  return (
    <div className="saved-lists-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', background: 'var(--bg-app)' }}>
      {/* Left Lists Sidebar */}
      <div className="saved-lists-sidebar" style={{
        width: 260,
        borderRight: '1px solid var(--border-subtle)',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Saved Lists & Projects
            </span>
          </div>
          <button
            onClick={() => setIsCreatingList(true)}
            style={{
              background: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              padding: '4px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <Plus size={12} /> New
          </button>
        </div>

        {/* Create List Input */}
        {isCreatingList && (
          <div style={{ padding: '12px 14px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 6 }}>
            <input
              autoFocus
              value={newListName}
              onChange={e => setNewListName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateList();
                if (e.key === 'Escape') setIsCreatingList(false);
              }}
              placeholder="List name..."
              style={{
                flex: 1,
                height: 28,
                padding: '0 8px',
                fontSize: 11,
                background: 'var(--bg-app)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--text-primary)'
              }}
            />
            <button
              onClick={handleCreateList}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-xs)', padding: '0 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              Add
            </button>
          </div>
        )}

        {/* List items */}
        <div style={{ padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {availableLists.map(list => {
            const isSelected = activeList === list;
            const stats = collectionStats[list] || { prompts: 0, repos: 0, bookmarks: 0, total: 0 };
            return (
              <button
                key={list}
                onClick={() => setActiveList(list)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: isSelected ? 'var(--accent-muted)' : 'transparent',
                  color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                  border: isSelected ? '1px solid var(--accent-glow)' : '1px solid transparent',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: categoryColors[list] || 'var(--accent)'
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {list}
                  </span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', background: 'var(--bg-card)', padding: '2px 6px', borderRadius: 10 }}>
                  {stats.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right List Detail Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top List Header */}
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
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{activeList}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 10 }}>
                {listItems.length} items bundled
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              Unified project bundle containing prompts, reference sites, and repositories
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setSplitModalOpen(true)}
              disabled={listItems.length === 0}
              style={{
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                fontWeight: 600,
                cursor: listItems.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                opacity: listItems.length === 0 ? 0.5 : 1
              }}
              title="Split this list into individual items"
            >
              <Scissors size={13} />
              <span>Split List</span>
            </button>
            <button
              onClick={() => handleDeleteList(activeList)}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--danger)',
                padding: '6px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: 11,
                cursor: 'pointer'
              }}
              title="Delete this list"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="main-scroll-view" style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {listItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>∅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
                List is currently empty
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                Use Quick Save or Add to List to organize prompts, repos, and bookmarks together in this list.
              </div>
            </div>
          ) : (
            listItems.map(item => (
              <div
                key={`${item.type}-${item.id}`}
                className="bento-card"
                onClick={() => handleOpenItem(item)}
                style={{
                  padding: '16px 20px',
                  background: 'var(--bento-card-bg)',
                  border: '1px solid var(--bento-card-border)',
                  borderRadius: '20px',
                  boxShadow: 'var(--shadow-rim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
                }}
              >
                <div className="bento-rim" aria-hidden="true" />
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <span className="chip" style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    fontFamily: 'Geist Mono, monospace',
                    background: item.type === 'repo' ? 'rgba(59, 130, 246, 0.15)' : item.type === 'bookmark' ? 'rgba(16, 185, 129, 0.15)' : 'var(--accent-muted)',
                    color: item.type === 'repo' ? 'var(--color-blue)' : item.type === 'bookmark' ? 'var(--color-green)' : 'var(--accent)',
                    border: `1px solid ${item.type === 'repo' ? 'rgba(59, 130, 246, 0.3)' : item.type === 'bookmark' ? 'rgba(16, 185, 129, 0.3)' : 'var(--accent-glow)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    flexShrink: 0
                  }}>
                    {item.type === 'repo' ? <FolderGit2 size={12} /> : item.type === 'bookmark' ? <Bookmark size={12} /> : <Sparkles size={12} />}
                    {item.type}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="bento-ttl" style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.title}
                    </div>
                    {item.subtitle && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 3 }}>
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {item.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10, padding: '2px 8px', color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                      #{t}
                    </span>
                  ))}
                  <ExternalLink size={13} style={{ color: 'var(--text-tertiary)' }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {splitModalOpen && (
        <SplitListModal
          isOpen={splitModalOpen}
          onClose={() => setSplitModalOpen(false)}
          listName={activeList}
          items={listItems}
        />
      )}
    </div>
  );
}
