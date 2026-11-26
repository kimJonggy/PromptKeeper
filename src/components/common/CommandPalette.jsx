import { useState, useEffect, useRef } from 'react';
import { useUniversalSearch } from '../../hooks/useUniversalSearch.js';
import { REPO_STATUSES, LANGUAGE_COLORS } from '../../constants/repositoryConstants.js';
import { BOOKMARK_STATUSES } from '../../constants/bookmarkConstants.js';
import { 
  Search, 
  X, 
  FileText, 
  FolderGit2, 
  Bookmark, 
  Globe, 
  Cloud, 
  Zap, 
  SunMedium, 
  HardDrive,
  Palette,
  Plus,
  Clock,
  Star,
  GitFork,
  ExternalLink,
  Copy,
  Terminal,
  CornerDownLeft,
  Sparkles,
  Play
} from 'lucide-react';

export default function CommandPalette({
  isOpen,
  onClose,
  prompts = [],
  repositories = [],
  bookmarks = [],
  recentItems = [],
  onSelectPrompt,
  onSelectRepo,
  onSelectBookmark,
  onNewPrompt,
  onAddRepo,
  onAddBookmark,
  onQuickSave,
  onOpenStudio,
  onOpenOptimizer,
  onOpenRunner,
  onOpenIO,
  onToggleTheme,
  onOpenAuth,
  onSetAccent
}) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const { promptResults, repoResults, bookmarkResults } = useUniversalSearch({
    prompts,
    repositories,
    bookmarks,
    query,
    filterType: typeFilter
  });

  // Action commands
  const actions = [
    { id: 'act-optimizer', title: 'AI Prompt Optimizer & Polisher', category: 'Commands', icon: <Sparkles size={15} style={{ color: 'var(--accent)' }} />, action: onOpenOptimizer, keywords: ['optimize', 'polish', 'refactor', 'anthropic', 'openai', 'prompt', 'structure'], hint: 'AI' },
    { id: 'act-runner', title: 'Prompt Variable Runner & Test Bench', category: 'Commands', icon: <Play size={15} style={{ color: 'var(--accent)' }} />, action: onOpenRunner, keywords: ['run', 'runner', 'variables', 'test', 'launch', 'chatgpt', 'claude'], hint: 'Runner' },
    { id: 'act-quick-save', title: 'Quick Save (Auto-detect URL or Prompt)', category: 'Commands', icon: <Plus size={15} />, action: onQuickSave, keywords: ['quick', 'save', 'add', 'paste', 'url', 'prompt', 'repo'], hint: '⌘N' },
    { id: 'act-new-prompt', title: 'Create New Prompt', category: 'Commands', icon: <FileText size={15} />, action: onNewPrompt, keywords: ['new', 'create', 'prompt'], hint: 'Draft' },
    { id: 'act-add-repo', title: 'Add GitHub Repository', category: 'Commands', icon: <FolderGit2 size={15} />, action: onAddRepo, keywords: ['add', 'repo', 'github', 'clone'], hint: 'Git' },
    { id: 'act-add-bm', title: 'Add Website Bookmark', category: 'Commands', icon: <Bookmark size={15} />, action: onAddBookmark, keywords: ['add', 'bookmark', 'url', 'web', 'link', 'note'], hint: 'Web' },
    { id: 'act-cloud-sync', title: 'Cloud Synchronization & Account', category: 'Commands', icon: <Cloud size={15} />, action: onOpenAuth, keywords: ['cloud', 'sync', 'account', 'supabase', 'login', 'backup'], hint: 'Sync' },
    { id: 'act-studio', title: 'Open Prompt Forge Studio', category: 'Commands', icon: <Zap size={15} />, action: onOpenStudio, keywords: ['studio', 'forge', 'variables', 'test'], hint: 'Forge' },
    { id: 'act-theme', title: 'Toggle Light / Dark Theme', category: 'Commands', icon: <SunMedium size={15} />, action: onToggleTheme, keywords: ['theme', 'dark', 'light', 'mode'], hint: 'Theme' },
    { id: 'act-accent-amber', title: 'Theme Accent: Obsidian Amber', category: 'Theme', icon: <Palette size={15} style={{ color: '#f0a532' }} />, action: () => onSetAccent && onSetAccent('amber'), keywords: ['accent', 'color', 'amber', 'gold', 'yellow', 'theme'], hint: 'Color' },
    { id: 'act-accent-emerald', title: 'Theme Accent: Emerald Matrix', category: 'Theme', icon: <Palette size={15} style={{ color: '#10b981' }} />, action: () => onSetAccent && onSetAccent('emerald'), keywords: ['accent', 'color', 'emerald', 'green', 'theme'], hint: 'Color' },
    { id: 'act-accent-violet', title: 'Theme Accent: Cyberpunk Violet', category: 'Theme', icon: <Palette size={15} style={{ color: '#8b5cf6' }} />, action: () => onSetAccent && onSetAccent('violet'), keywords: ['accent', 'color', 'violet', 'purple', 'neon', 'theme'], hint: 'Color' },
    { id: 'act-accent-cobalt', title: 'Theme Accent: Deep Cobalt', category: 'Theme', icon: <Palette size={15} style={{ color: '#3b82f6' }} />, action: () => onSetAccent && onSetAccent('cobalt'), keywords: ['accent', 'color', 'cobalt', 'blue', 'theme'], hint: 'Color' },
    { id: 'act-io', title: 'Import / Export Vault JSON & Browser HTML', category: 'Commands', icon: <HardDrive size={15} />, action: onOpenIO, keywords: ['import', 'export', 'backup', 'json', 'vault', 'html', 'browser'], hint: 'Backup' }
  ];

  const recentActions = (!query.trim() && recentItems && recentItems.length > 0)
    ? recentItems.slice(0, 4).map(rec => ({
        id: `recent-${rec.type}-${rec.id}`,
        title: `${rec.title} (${rec.action || 'accessed'})`,
        category: 'Recently Used',
        icon: <Clock size={15} style={{ color: 'var(--accent)' }} />,
        action: () => {
          if (rec.type === 'prompt') onSelectPrompt({ id: rec.id });
          else if (rec.type === 'repo') onSelectRepo();
          else if (rec.type === 'bookmark') onSelectBookmark();
        },
        keywords: ['recent', rec.title.toLowerCase()],
        hint: 'Recent'
      }))
    : [];

  const filteredActions = typeFilter === 'prompt' || typeFilter === 'repo' || typeFilter === 'bookmark'
    ? [] 
    : [
        ...recentActions,
        ...actions.filter(act => {
          if (!query.trim()) return true;
          const q = query.toLowerCase();
          return act.title.toLowerCase().includes(q) || act.keywords.some(k => k.includes(q));
        })
      ];

  // Flat list of selectable items for keyboard navigation
  const flatItems = [
    ...filteredActions.map(a => ({ type: 'action', item: a })),
    ...promptResults.slice(0, 8).map(p => ({ type: 'prompt', item: p.raw })),
    ...repoResults.slice(0, 8).map(r => ({ type: 'repo', item: r.raw })),
    ...bookmarkResults.slice(0, 8).map(b => ({ type: 'bookmark', item: b.raw }))
  ];

  const activeSelected = flatItems[selectedIndex] || flatItems[0] || null;

  const handleQueryChange = (val) => {
    setQuery(val);
    setSelectedIndex(0);
  };

  const handleFilterChange = (filter) => {
    setTypeFilter(filter);
    setSelectedIndex(0);
  };

  const handleDismiss = () => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  };

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation & copy
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(idx => (idx + 1) % Math.max(1, flatItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(idx => (idx - 1 + flatItems.length) % Math.max(1, flatItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = flatItems[selectedIndex];
      if (current) {
        handleSelectItem(current);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleDismiss();
    } else if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
      const current = flatItems[selectedIndex];
      if (current) {
        if (current.type === 'prompt' && current.item.body) {
          e.preventDefault();
          navigator.clipboard.writeText(current.item.body);
        } else if (current.type === 'repo' && current.item.canonicalUrl) {
          e.preventDefault();
          navigator.clipboard.writeText(`git clone ${current.item.canonicalUrl}.git`);
        } else if (current.type === 'bookmark' && current.item.url) {
          e.preventDefault();
          navigator.clipboard.writeText(current.item.url);
        }
      }
    }
  };

  const handleSelectItem = ({ type, item }) => {
    if (type === 'action') {
      item.action?.();
    } else if (type === 'prompt') {
      onSelectPrompt?.(item);
    } else if (type === 'repo') {
      onSelectRepo?.(item);
    } else if (type === 'bookmark') {
      onSelectBookmark?.(item);
    }
    handleDismiss();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleDismiss}
      style={{
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(12px)',
        zIndex: 600,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '8vh',
        animation: 'modalFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className="industrial-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '840px',
          maxWidth: '94%',
          height: '560px',
          maxHeight: '82vh',
          background: 'rgba(10, 11, 16, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.14)',
          borderRadius: 22,
          boxShadow: '0 32px 100px -10px rgba(0, 0, 0, 0.95), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Search Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#0d0f15',
          flexShrink: 0
        }}>
          <Search size={17} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search prompts, repos, bookmarks... (⌘K)"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 14.5,
              color: '#fff',
              fontFamily: 'Geist, sans-serif'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
          <div style={{
            fontSize: 10,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '2px 7px',
            borderRadius: 6,
            color: 'var(--text-tertiary)',
            fontWeight: 700,
            fontFamily: 'Geist Mono, monospace'
          }}>
            ESC
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{
          padding: '8px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          gap: 6,
          background: '#090a0e',
          overflowX: 'auto',
          flexShrink: 0
        }}>
          {[
            { id: 'all', label: 'All Results' },
            { id: 'prompt', label: `Prompts (${promptResults.length})` },
            { id: 'repo', label: `Repositories (${repoResults.length})` },
            { id: 'bookmark', label: `Bookmarks (${bookmarkResults.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              style={{
                background: typeFilter === tab.id ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)',
                color: typeFilter === tab.id ? '#0b0b0c' : 'rgba(255, 255, 255, 0.7)',
                border: typeFilter === tab.id ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                fontFamily: 'Geist, sans-serif',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Raycast Split Body: Left List + Right Live Preview */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          
          {/* Left Column: Results List */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '10px 12px',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            minWidth: 320
          }}>
            {flatItems.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                No matching results found for "{query}".
              </div>
            ) : (
              <>
                {/* 1. Actions */}
                {filteredActions.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 10px', letterSpacing: 0.6, fontFamily: 'Geist Mono, monospace' }}>
                      Commands & Actions
                    </div>
                    {filteredActions.map(action => {
                      const itemIndex = flatItems.findIndex(i => i.type === 'action' && i.item.id === action.id);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <div
                          key={action.id}
                          onClick={() => handleSelectItem({ type: 'action', item: action })}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(232, 255, 31, 0.12)' : 'transparent',
                            color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                            border: isSelected ? '1px solid rgba(232, 255, 31, 0.35)' : '1px solid transparent',
                            marginBottom: 2
                          }}
                        >
                          <span style={{ color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
                            {action.icon}
                          </span>
                          <span style={{ fontSize: 12.5, fontWeight: isSelected ? 700 : 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {action.title}
                          </span>
                          {action.hint && (
                            <span style={{ fontSize: 10, color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: 6, fontFamily: 'Geist Mono, monospace' }}>
                              {action.hint}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Prompts */}
                {promptResults.length > 0 && (typeFilter === 'all' || typeFilter === 'prompt') && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 10px', letterSpacing: 0.6, fontFamily: 'Geist Mono, monospace' }}>
                      AI Prompts ({promptResults.length})
                    </div>
                    {promptResults.slice(0, 8).map(res => {
                      const itemIndex = flatItems.findIndex(i => i.type === 'prompt' && i.item.id === res.raw.id);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <div
                          key={res.raw.id}
                          onClick={() => handleSelectItem({ type: 'prompt', item: res.raw })}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(232, 255, 31, 0.12)' : 'transparent',
                            color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                            border: isSelected ? '1px solid rgba(232, 255, 31, 0.35)' : '1px solid transparent',
                            marginBottom: 2
                          }}
                        >
                          <FileText size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {res.raw.title}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: 6, fontFamily: 'Geist Mono, monospace' }}>
                            {res.raw.model || 'AI'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 3. Repositories */}
                {repoResults.length > 0 && (typeFilter === 'all' || typeFilter === 'repo') && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 10px', letterSpacing: 0.6, fontFamily: 'Geist Mono, monospace' }}>
                      Repositories ({repoResults.length})
                    </div>
                    {repoResults.slice(0, 8).map(res => {
                      const itemIndex = flatItems.findIndex(i => i.type === 'repo' && i.item.id === res.raw.id);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <div
                          key={res.raw.id}
                          onClick={() => handleSelectItem({ type: 'repo', item: res.raw })}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                            color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                            border: isSelected ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                            marginBottom: 2
                          }}
                        >
                          <FolderGit2 size={14} style={{ color: isSelected ? 'var(--color-blue)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {res.raw.fullName}
                            </div>
                          </div>
                          {res.raw.primaryLanguage && (
                            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: 6, fontFamily: 'Geist Mono, monospace' }}>
                              {res.raw.primaryLanguage}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 4. Bookmarks */}
                {bookmarkResults.length > 0 && (typeFilter === 'all' || typeFilter === 'bookmark') && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', padding: '4px 10px', letterSpacing: 0.6, fontFamily: 'Geist Mono, monospace' }}>
                      Bookmarks ({bookmarkResults.length})
                    </div>
                    {bookmarkResults.slice(0, 8).map(res => {
                      const itemIndex = flatItems.findIndex(i => i.type === 'bookmark' && i.item.id === res.raw.id);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <div
                          key={res.raw.id}
                          onClick={() => handleSelectItem({ type: 'bookmark', item: res.raw })}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '8px 12px',
                            borderRadius: 10,
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(232, 255, 31, 0.12)' : 'transparent',
                            color: isSelected ? '#fff' : 'rgba(255, 255, 255, 0.85)',
                            border: isSelected ? '1px solid rgba(232, 255, 31, 0.35)' : '1px solid transparent',
                            marginBottom: 2
                          }}
                        >
                          <Globe size={14} style={{ color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)', flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: isSelected ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {res.raw.title || res.raw.domain}
                            </div>
                          </div>
                          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: 6, fontFamily: 'Geist Mono, monospace' }}>
                            {res.raw.domain}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Live Raycast Preview Panel */}
          <div 
            className="command-palette-preview hide-mobile"
            style={{
              width: '360px',
              background: '#07080b',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto'
            }}
          >
            {activeSelected ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                
                {/* PREVIEW: ACTION */}
                {activeSelected.type === 'action' && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(232, 255, 31, 0.12)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {activeSelected.item.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{activeSelected.item.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>{activeSelected.item.category}</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: 12, padding: '14px', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      Execute this command instantly by pressing <kbd style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: 4, color: '#fff', fontFamily: 'Geist Mono, monospace' }}>↵ Enter</kbd>.
                    </div>
                  </div>
                )}

                {/* PREVIEW: PROMPT */}
                {activeSelected.type === 'prompt' && (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'rgba(232, 255, 31, 0.12)', padding: '2px 8px', borderRadius: 6, fontFamily: 'Geist Mono, monospace' }}>
                        {activeSelected.item.model || 'GPT-4o'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                        {activeSelected.item.category}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto', fontFamily: 'Geist Mono, monospace' }}>
                        ⚡ {activeSelected.item.uses || 0} runs
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12, lineHeight: 1.35 }}>
                      {activeSelected.item.title}
                    </div>

                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Geist Mono, monospace' }}>
                      Template Snippet
                    </div>

                    <div style={{
                      flex: 1,
                      maxHeight: 220,
                      overflowY: 'auto',
                      background: 'rgba(0, 0, 0, 0.7)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 12,
                      padding: '12px',
                      fontSize: 11.5,
                      color: '#e4e4e7',
                      fontFamily: 'Geist Mono, monospace',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap'
                    }}>
                      {activeSelected.item.body}
                    </div>

                    {(activeSelected.item.tags || []).length > 0 && (
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 12 }}>
                        {activeSelected.item.tags.map(t => (
                          <span key={t} style={{ fontSize: 10, color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.05)', padding: '1px 6px', borderRadius: 4, fontFamily: 'Geist Mono, monospace' }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* PREVIEW: REPO */}
                {activeSelected.type === 'repo' && (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-blue)', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: 6, fontFamily: 'Geist Mono, monospace' }}>
                        {activeSelected.item.primaryLanguage || 'Code'}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', fontSize: 11, color: 'var(--accent)', fontFamily: 'Geist Mono, monospace' }}>
                        <Star size={12} fill="currentColor" /> {activeSelected.item.stars?.toLocaleString() || 0}
                      </div>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.35 }}>
                      {activeSelected.item.fullName}
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                      {activeSelected.item.description || 'No description provided.'}
                    </p>

                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Geist Mono, monospace' }}>
                      Git Clone
                    </div>
                    <div style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10, padding: '8px 10px', fontSize: 11, color: '#34d399', fontFamily: 'Geist Mono, monospace', wordBreak: 'break-all' }}>
                      git clone {activeSelected.item.canonicalUrl}.git
                    </div>
                  </div>
                )}

                {/* PREVIEW: BOOKMARK */}
                {activeSelected.type === 'bookmark' && (
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', background: 'rgba(232, 255, 31, 0.12)', padding: '2px 8px', borderRadius: 6, fontFamily: 'Geist Mono, monospace' }}>
                        {activeSelected.item.category || 'Bookmark'}
                      </span>
                      <span style={{ fontSize: 10, color: 'var(--text-tertiary)', marginLeft: 'auto', fontFamily: 'Geist Mono, monospace' }}>
                        {activeSelected.item.domain}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 8, lineHeight: 1.35 }}>
                      {activeSelected.item.title || activeSelected.item.domain}
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
                      {activeSelected.item.description || 'No description provided.'}
                    </p>

                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'Geist Mono, monospace' }}>
                      Destination URL
                    </div>
                    <div style={{ background: 'rgba(0, 0, 0, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 10, padding: '8px 10px', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace', wordBreak: 'break-all' }}>
                      {activeSelected.item.url}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', fontSize: 12 }}>
                Select an item to view preview
              </div>
            )}
          </div>

        </div>

        {/* Raycast Bottom Command Bar */}
        <div style={{
          padding: '10px 20px',
          background: '#0a0b0f',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          fontFamily: 'Geist Mono, monospace',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: 4, color: '#fff' }}>↑↓</kbd> Navigate</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: 4, color: '#fff' }}>↵</kbd> Open</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 5px', borderRadius: 4, color: '#fff' }}>⌘C</kbd> Copy</span>
          </div>
          <div>
            <span>PromptKeeper Spotlight</span>
          </div>
        </div>

      </div>
    </div>
  );
}
