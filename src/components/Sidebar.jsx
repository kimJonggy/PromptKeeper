import { useState, useMemo } from 'react';
import { PREMIUM_GRADIENTS } from '../data.js';
import { useApp } from '../context/AppContext.jsx';
import logoImg from '../assets/logo.png';
import { 
  SunMedium, 
  Moon, 
  Search, 
  Folder, 
  Star, 
  Zap, 
  FolderGit2, 
  Bookmark,
  Sparkles,
  Play,
  Plus, 
  Cloud, 
  Database, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export default function Sidebar() {
  const {
    prompts, categories, catFilter, setCatFilter, setTagFilter,
    openNew: onNew, setShowIO, sidebarOpen: isOpen, setSidebarOpen,
    categoryColors: catColors, setCategoryColors, addCategory: onAddCat,
    renameCategory: onRenameCat, deleteCategory: onDeleteCat,
    requestConfirm, activeNav, setActiveNav, sort, setSort, theme, toggleTheme,
    repositories, bookmarks, setCommandPaletteOpen, collectionStats, setAuthModalOpen,
    setQuickSaveOpen, activePrompt, openRunner, openOptimizer, openStudio
  } = useApp();

  const onClose = () => setSidebarOpen(false);
  const closeMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };
  const onImportExport = () => { setShowIO(true); closeMobile(); };
  const setCatColor = (cat, col) => setCategoryColors(prev => ({ ...prev, [cat]: col }));
  
  const [catsExpanded, setCatsExpanded] = useState(true);
  const [newCatName, setNewCatName] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editCatVal, setEditCatVal] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const { catCounts } = useMemo(() => {
    const cCounts = { All: prompts.length };
    prompts.forEach(p => {
      cCounts[p.category] = (cCounts[p.category] || 0) + 1;
    });
    return { catCounts: cCounts };
  }, [prompts]);

  const totalFavorites = useMemo(() => {
    const favPrompts = prompts.filter(p => p.fav).length;
    const favRepos = (repositories || []).filter(r => r.isFavorite).length;
    const favBookmarks = (bookmarks || []).filter(b => b.isFavorite).length;
    return favPrompts + favRepos + favBookmarks;
  }, [prompts, repositories, bookmarks]);

  return (
    <aside 
      className={`app-sidebar sidebar-mobile ${isOpen ? 'open' : ''}`} 
      style={{
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 100,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Mobile Close Button */}
      <button 
        onClick={onClose}
        style={{ 
          position: 'absolute', 
          top: 14, 
          right: 14, 
          background: 'var(--btn-subtle-bg)', 
          color: 'var(--text-primary)', 
          width: 28, 
          height: 28, 
          borderRadius: 6, 
          border: '1px solid var(--btn-subtle-border)', 
          alignItems: 'center', 
          justifyContent: 'center', 
          cursor: 'pointer',
          zIndex: 110 
        }}
        className="show-mobile-flex"
      >
        <X size={14} />
      </button>

      {/* 1. Brand Header */}
      <div style={{ 
        padding: '16px 16px 14px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img
            src={logoImg}
            alt="PromptKeeper"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              objectFit: 'contain',
              flexShrink: 0
            }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', fontFamily: 'Geist, sans-serif', lineHeight: 1.2 }}>
              PromptKeeper
            </div>
            <div style={{ fontSize: 9.5, color: 'var(--text-tertiary)', fontWeight: 500, letterSpacing: '0.02em', fontFamily: 'Geist Mono, monospace' }}>
              workspace
            </div>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          style={{ 
            background: 'var(--btn-subtle-bg)', 
            border: '1px solid var(--btn-subtle-border)', 
            borderRadius: 6, 
            width: 28, 
            height: 28, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            color: 'var(--text-secondary)',
            transition: 'background 0.15s ease'
          }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <SunMedium size={13} /> : <Moon size={13} />}
        </button>
      </div>

      {/* 2. Command Palette Search Bar */}
      <div style={{ padding: '12px 14px 6px', position: 'relative', zIndex: 2 }}>
        <button
          onClick={() => setCommandPaletteOpen(true)}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            padding: '0 10px',
            height: 34,
            background: 'var(--btn-subtle-bg)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--btn-subtle-border)',
            borderRadius: 8, 
            cursor: 'pointer', 
            textAlign: 'left', 
            width: '100%', 
            fontSize: 12, 
            fontWeight: 400,
            fontFamily: 'Geist, sans-serif',
            transition: 'background 0.15s ease, border-color 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--btn-subtle-bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--btn-subtle-bg)';
            e.currentTarget.style.borderColor = 'var(--btn-subtle-border)';
          }}
        >
          <Search size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <span style={{ flex: 1, color: 'var(--text-tertiary)' }}>Search or jump</span>
          <kbd style={{ 
            fontSize: 10, 
            background: 'var(--bg-surface-active)', 
            color: 'var(--text-secondary)', 
            padding: '1px 5px', 
            borderRadius: 4, 
            fontWeight: 600, 
            fontFamily: 'Geist Mono, monospace',
            border: '1px solid var(--border-subtle)'
          }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* 3. Primary Core Navigation */}
      <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2, position: 'relative', zIndex: 2 }}>
        
        {/* Prompts Hub */}
        <button
          onClick={() => { setActiveNav('prompts'); setCatFilter('All'); setTagFilter(''); closeMobile(); }}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '0 10px',
            height: 34,
            background: activeNav === 'prompts' && catFilter === 'All' && sort !== 'fav' ? 'var(--sidebar-active-bg)' : 'transparent',
            color: activeNav === 'prompts' && catFilter === 'All' && sort !== 'fav' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: activeNav === 'prompts' && catFilter === 'All' && sort !== 'fav' ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
            borderRadius: 8, 
            cursor: 'pointer', 
            textAlign: 'left', 
            width: '100%', 
            fontSize: 12.5, 
            fontWeight: 500,
            transition: 'background 0.15s ease, color 0.15s ease'
          }}
        >
          <Folder size={14} style={{ color: activeNav === 'prompts' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
          <span style={{ flex: 1 }}>Prompts</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 500, fontFamily: 'Geist Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {prompts.length}
          </span>
        </button>

        {/* Repositories Hub */}
        <button
          onClick={() => { setActiveNav('repos'); closeMobile(); }}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '0 10px',
            height: 34,
            background: activeNav === 'repos' ? 'var(--sidebar-active-bg)' : 'transparent',
            color: activeNav === 'repos' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: activeNav === 'repos' ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
            borderRadius: 8, 
            cursor: 'pointer', 
            textAlign: 'left', 
            width: '100%', 
            fontSize: 12.5, 
            fontWeight: 500,
            transition: 'background 0.15s ease, color 0.15s ease'
          }}
        >
          <FolderGit2 size={14} style={{ color: activeNav === 'repos' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
          <span style={{ flex: 1 }}>Repositories</span>
          <span style={{ 
            fontSize: 10.5, 
            color: 'var(--text-tertiary)', 
            fontWeight: 500, 
            fontFamily: 'Geist Mono, monospace',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {repositories?.length || 0}
          </span>
        </button>

        {/* Bookmarks Hub */}
        <button
          onClick={() => { setActiveNav('bookmarks'); closeMobile(); }}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '0 10px',
            height: 34,
            background: activeNav === 'bookmarks' ? 'var(--sidebar-active-bg)' : 'transparent',
            color: activeNav === 'bookmarks' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: activeNav === 'bookmarks' ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
            borderRadius: 8, 
            cursor: 'pointer', 
            textAlign: 'left', 
            width: '100%', 
            fontSize: 12.5, 
            fontWeight: 500,
            transition: 'background 0.15s ease, color 0.15s ease'
          }}
        >
          <Bookmark size={14} style={{ color: activeNav === 'bookmarks' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
          <span style={{ flex: 1 }}>Bookmarks</span>
          <span style={{ 
            fontSize: 10.5, 
            color: 'var(--text-tertiary)', 
            fontWeight: 500, 
            fontFamily: 'Geist Mono, monospace',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {bookmarks?.length || 0}
          </span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => { setActiveNav('prompts'); setSort(sort === 'fav' ? 'newest' : 'fav'); closeMobile(); }}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '0 10px',
            height: 34,
            background: sort === 'fav' ? 'var(--sidebar-active-bg)' : 'transparent',
            color: sort === 'fav' ? 'var(--text-primary)' : 'var(--text-secondary)',
            border: sort === 'fav' ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
            borderRadius: 8, 
            cursor: 'pointer', 
            textAlign: 'left', 
            width: '100%', 
            fontSize: 12.5, 
            fontWeight: 500,
            transition: 'background 0.15s ease, color 0.15s ease'
          }}
        >
          <Star size={14} style={{ color: sort === 'fav' ? 'var(--accent)' : 'var(--text-tertiary)' }} fill={sort === 'fav' ? 'currentColor' : 'none'} />
          <span style={{ flex: 1 }}>Favorites</span>
          <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 500, fontFamily: 'Geist Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            {totalFavorites}
          </span>
        </button>

        {/* AI Prompt Optimizer */}
        <button
          onClick={() => {
            if (activePrompt) {
              openOptimizer({ initialText: activePrompt.body, promptTitle: activePrompt.title });
            } else if (prompts.length > 0) {
              openOptimizer({ initialText: prompts[0].body, promptTitle: prompts[0].title });
            } else {
              openOptimizer({ initialText: 'Please review and optimize this prompt for production AI deployment.', promptTitle: 'AI Optimizer' });
            }
            closeMobile();
          }}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '0 10px',
            height: 34,
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid transparent',
            borderRadius: 8, 
            cursor: 'pointer', 
            textAlign: 'left', 
            width: '100%', 
            fontSize: 12.5, 
            fontWeight: 500,
            transition: 'background 0.15s ease, color 0.15s ease'
          }}
          title="AI Prompt Optimizer & Polisher (Feature 5)"
        >
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ flex: 1 }}>AI Optimizer</span>
          <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: 'rgba(232, 255, 31, 0.1)', color: 'var(--accent)', fontWeight: 700, fontFamily: 'Geist Mono, monospace' }}>
            NEW
          </span>
        </button>

        {/* Variable Runner */}
        <button
          onClick={() => {
            if (activePrompt) {
              openRunner(activePrompt);
            } else if (prompts.length > 0) {
              openRunner(prompts[0]);
            } else {
              openRunner({ title: 'Quick Test Runner', body: 'Draft prompt: Test your prompt variables {{var}} here.' });
            }
            closeMobile();
          }}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: 10, 
            padding: '0 10px',
            height: 34,
            background: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid transparent',
            borderRadius: 8, 
            cursor: 'pointer', 
            textAlign: 'left', 
            width: '100%', 
            fontSize: 12.5, 
            fontWeight: 500,
            transition: 'background 0.15s ease, color 0.15s ease'
          }}
          title="Prompt Variable Runner & Quick Test (Feature 4)"
        >
          <Play size={14} style={{ color: 'var(--accent)' }} fill="currentColor" />
          <span style={{ flex: 1 }}>Variable Runner</span>
          <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, background: 'rgba(232, 255, 31, 0.1)', color: 'var(--accent)', fontWeight: 700, fontFamily: 'Geist Mono, monospace' }}>
            NEW
          </span>
        </button>
      </div>

      {/* 4. Action Buttons */}
      <div style={{ padding: '8px 10px', display: 'flex', gap: 6, position: 'relative', zIndex: 2 }}>
        <button
          onClick={() => setQuickSaveOpen(true)}
          style={{
            flex: 1,
            background: 'var(--btn-subtle-bg)',
            border: '1px solid var(--btn-subtle-border)',
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontSize: 12,
            height: 34,
            padding: '0 12px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            cursor: 'pointer',
            transition: 'background 0.15s ease, border-color 0.15s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'var(--btn-subtle-bg-hover)';
            e.currentTarget.style.borderColor = 'var(--border-medium)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'var(--btn-subtle-bg)';
            e.currentTarget.style.borderColor = 'var(--btn-subtle-border)';
          }}
          title="Quick Save (⌘N)"
        >
          <Plus size={14} />
          <span>Quick Save</span>
        </button>

        <button
          onClick={onNew}
          style={{
            background: 'var(--accent)',
            border: 'none',
            color: '#0b0b0c',
            height: 34,
            width: 34,
            borderRadius: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            transition: 'opacity 0.15s ease'
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
          title="New Prompt"
        >
          <Plus size={15} strokeWidth={2.5} />
        </button>
      </div>

      {/* 5. Scrollable Fluid Collections */}
      <div style={{ padding: '4px 10px 14px', flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative', zIndex: 2 }}>
        
        {/* Section Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 8px 6px',
          cursor: 'pointer'
        }}>
          <div 
            onClick={() => setCatsExpanded(x => !x)}
            style={{ 
              fontSize: 11, 
              color: 'var(--text-tertiary)', 
              fontWeight: 500, 
              fontFamily: 'Geist, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>Collections</span>
            {catsExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </div>

          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsAddingCat(true);
            }}
            style={{ 
              padding: '2px 6px', 
              fontSize: 10.5, 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-tertiary)', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 3,
              cursor: 'pointer'
            }}
            title="Add collection"
          >
            <Plus size={10} strokeWidth={2.5} />
            <span>Add</span>
          </button>
        </div>

        {/* Inline Add Input */}
        {isAddingCat && (
          <div style={{ padding: '4px 6px 8px', display: 'flex', gap: 6 }}>
            <input
              autoFocus
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onAddCat(newCatName); setNewCatName(''); setIsAddingCat(false); }
                if (e.key === 'Escape') { setIsAddingCat(false); setNewCatName(''); }
              }}
              placeholder="Collection name..."
              style={{ 
                flex: 1, 
                fontSize: 11, 
                padding: '5px 8px', 
                background: 'var(--bg-surface)', 
                border: '1px solid var(--accent)', 
                color: 'var(--text-primary)', 
                borderRadius: 8,
                outline: 'none'
              }}
            />
            <button 
              type="button"
              onClick={() => { onAddCat(newCatName); setNewCatName(''); setIsAddingCat(false); }}
              style={{ 
                padding: '0 8px', 
                background: 'var(--accent)', 
                color: '#0b0b0c', 
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
              title="Save"
            >
              <Check size={12} strokeWidth={2.5} />
            </button>
            <button 
              type="button"
              onClick={() => setIsAddingCat(false)}
              style={{ 
                padding: '0 6px', 
                background: 'transparent', 
                color: 'var(--text-tertiary)', 
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* Fluid Collections Tree List */}
        {catsExpanded && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {categories.map((c) => {
              const isActive = catFilter === c && activeNav === 'prompts';
              const catCol = catColors[c] || catColors['All'] || '#E8FF1F';
              const count = c === 'All' 
                ? (prompts.length + (repositories?.length || 0) + (bookmarks?.length || 0))
                : (collectionStats?.[c]?.total ?? (catCounts[c] || 0));

              return (
                <div
                  key={c}
                  onClick={() => { setActiveNav('prompts'); setCatFilter(c); closeMobile(); }}
                  style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderRadius: 9,
                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid var(--sidebar-active-border)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'var(--sidebar-hover-bg)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Color Pip (Cycle color on click) */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      const currentIdx = PREMIUM_GRADIENTS.indexOf(catCol);
                      const nextCol = PREMIUM_GRADIENTS[(currentIdx + 1) % PREMIUM_GRADIENTS.length];
                      setCatColor(c, nextCol);
                    }}
                    style={{ 
                      width: 7, 
                      height: 7, 
                      borderRadius: '50%', 
                      background: catCol, 
                      cursor: 'pointer', 
                      flexShrink: 0, 
                      marginRight: 9,
                      boxShadow: isActive ? `0 0 6px ${catCol}` : 'none'
                    }}
                    title="Click to cycle color"
                  />

                  {/* Name or Inline Rename */}
                  {editingCat === c ? (
                    <div style={{ display: 'flex', gap: 4, flex: 1 }} onClick={e => e.stopPropagation()}>
                      <input
                        autoFocus
                        value={editCatVal}
                        onChange={e => setEditCatVal(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { onRenameCat(c, editCatVal); setEditingCat(null); }
                          if (e.key === 'Escape') { setEditingCat(null); }
                        }}
                        style={{ 
                          width: '100%', 
                          fontSize: 11, 
                          padding: '2px 6px', 
                          background: 'var(--bg-surface)', 
                          border: '1px solid var(--accent)', 
                          color: 'var(--text-primary)', 
                          borderRadius: 6, 
                          outline: 'none' 
                        }}
                      />
                      <button 
                        onClick={() => { onRenameCat(c, editCatVal); setEditingCat(null); }}
                        style={{ background: 'var(--accent)', color: '#0b0b0c', border: 'none', borderRadius: 6, padding: '2px 6px', cursor: 'pointer' }}
                        title="Save"
                      >
                        <Check size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ 
                      fontSize: 12, 
                      fontWeight: isActive ? 600 : 500, 
                      flex: 1, 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {c === 'All' ? 'All Resources' : c}
                    </span>
                  )}

                  {/* Count */}
                  {!editingCat && (
                    <span style={{ 
                      fontSize: 10, 
                      fontWeight: 600, 
                      color: 'var(--text-tertiary)', 
                      fontFamily: 'Geist Mono, monospace',
                      marginRight: c !== 'All' ? 4 : 0
                    }}>
                      {count}
                    </span>
                  )}

                  {/* Quick Edit/Delete on Hover */}
                  {c !== 'All' && !editingCat && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCat(c);
                          setEditCatVal(c);
                        }}
                        style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        title="Rename"
                      >
                        <Edit2 size={10} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          requestConfirm({
                            title: 'Delete Collection',
                            message: `Delete collection "${c}"? Items will remain in your library.`,
                            onConfirm: () => onDeleteCat(c)
                          });
                        }}
                        style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: 'var(--danger)', opacity: 0.8 }}
                        title="Delete"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Footer: Fluid Glass Pills for Cloud Sync & Backup */}
      <div style={{ 
        padding: '12px 14px', 
        borderTop: '1px solid var(--border-subtle)', 
        background: 'var(--bg-sidebar-footer)', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 8,
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            type="button"
            onClick={() => setAuthModalOpen(true)} 
            style={{ 
              flex: 1,
              height: 32,
              padding: '0 8px', 
              fontSize: 11, 
              background: 'var(--btn-subtle-bg)', 
              border: '1px solid var(--btn-subtle-border)', 
              color: 'var(--text-secondary)',
              borderRadius: 8,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--btn-subtle-bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--btn-subtle-bg)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Configure Cloud Sync & Supabase"
          >
            <Cloud size={13} style={{ color: 'var(--accent)' }} />
            <span>Sync</span>
          </button>

          <button 
            type="button"
            onClick={onImportExport} 
            style={{ 
              flex: 1,
              height: 32,
              padding: '0 8px', 
              fontSize: 11, 
              background: 'var(--btn-subtle-bg)', 
              border: '1px solid var(--btn-subtle-border)', 
              color: 'var(--text-secondary)',
              borderRadius: 8,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--btn-subtle-bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--btn-subtle-bg)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Import, Export & Data Management"
          >
            <Database size={13} />
            <span>Backup</span>
          </button>
        </div>

        <div className="hide-mobile" style={{ fontSize: 9.5, color: 'var(--text-tertiary)', textAlign: 'center', fontWeight: 600, fontFamily: 'Geist Mono, monospace' }}>
          ⌘K Search &nbsp;•&nbsp; ⌘N Quick Save
        </div>
      </div>
    </aside>
  );
}
