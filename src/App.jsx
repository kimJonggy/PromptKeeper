import React from 'react';
import logoImg from './assets/logo.png';
import { 
  Menu, 
  Plus, 
  Search, 
  X, 
  LayoutGrid, 
  List, 
  Zap,
  Sparkles,
  Play
} from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import PromptCard from './components/PromptCard.jsx';
import DetailPanel from './components/DetailPanel.jsx';
import ImportExportModal from './components/ImportExportModal.jsx';
import PromptModal from './components/PromptModal.jsx';
import ForgeStudio from './components/ForgeStudio.jsx';
import RepositoryHub from './components/repos/RepositoryHub.jsx';
import BookmarkHub from './components/bookmarks/BookmarkHub.jsx';
import InboxView from './components/inbox/InboxView.jsx';
import SavedListsView from './components/lists/SavedListsView.jsx';
import QuickSaveModal from './components/common/QuickSaveModal.jsx';
import TagManagerModal from './components/common/TagManagerModal.jsx';
import PromptVariableRunnerModal from './components/studio/PromptVariableRunnerModal.jsx';
import PromptOptimizerModal from './components/studio/PromptOptimizerModal.jsx';
import RepoReadmeDrawerModal from './components/repos/RepoReadmeDrawerModal.jsx';
import BulkActionBar from './components/common/BulkActionBar.jsx';
import CommandPalette from './components/common/CommandPalette.jsx';
import MobileBottomNav from './components/common/MobileBottomNav.jsx';
import AuthModal from './components/auth/AuthModal.jsx';
import FinanceBentoDemo from './components/ui/FinanceBentoDemo.jsx';
import { Toast, ConfirmModal } from './components/UI.jsx';
import OnboardingModal from './components/OnboardingModal.jsx';
import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import { useKeyboard } from './hooks.js';
import { useApp } from './context/AppContext.jsx';

const SORT_OPTIONS = [
  { value: 'newest',   label: 'Newest' },
  { value: 'mostused', label: 'Most Used' },
  { value: 'az',       label: 'A → Z' },
  { value: 'fav',      label: 'Favorites' },
];

export default function App() {
  const {
    search, setSearch, sort, setSort, catFilter, setCatFilter, modelFilter, setModelFilter, tagFilter, setTagFilter,
    sidebarOpen, setSidebarOpen, fabOpen, setFabOpen,
    showModal, setShowModal, showIO, setShowIO, isStudioView, setIsStudioView,
    copySuccess, setCopySuccess, confirmConfig, setConfirmConfig, setActiveId,
    filtered, hasFilters, activePrompt, onboardingDone,
    handleOnboarding, openNew, openStudio, toasts, toast,
    viewMode, setViewMode, activeNav, setActiveNav,
    categories = [],
    repositories, addRepository, updateRepository, deleteRepository,
    toggleFavoriteRepo, togglePinRepo, updateRepoStatus, refreshRepoMetadata,
    repoStatusCounts, repoLanguageCounts, requestConfirm,
    bookmarks, addBookmark, updateBookmark, deleteBookmark,
    toggleFavoriteBookmark, togglePinBookmark, updateBookmarkStatus,
    bookmarkStatusCounts, bookmarkCategoryCounts,
    prompts, commandPaletteOpen, setCommandPaletteOpen, toggleTheme,
    authModalOpen, setAuthModalOpen, setAccent,
    quickSaveOpen, setQuickSaveOpen,
    tagManagerOpen, setTagManagerOpen,
    runnerPrompt, closeRunner, openRunner,
    optimizerConfig, closeOptimizer, openOptimizer,
    readmeRepo, closeReadme, openReadme,
    bulkSelectedIds, setBulkSelectedIds,
    recentItems
  } = useApp();

  useKeyboard({
    'cmd+n': () => setQuickSaveOpen(true),
    'cmd+k': () => setCommandPaletteOpen(open => !open),
    'escape': () => { 
      setActiveId(null); 
      setShowModal(false); 
      setShowIO(false); 
      setSidebarOpen(false); 
      setFabOpen(false);
      setIsStudioView(false);
      setCommandPaletteOpen(false);
      setQuickSaveOpen(false);
      setTagManagerOpen(false);
      closeRunner();
      closeOptimizer();
      closeReadme();
    },
  });

  const clearAllFilters = () => {
    setSearch('');
    setTagFilter('');
    setModelFilter('All');
    setCatFilter('All');
  };

  return (
    <div className="app-shell" style={{ height: '100%', overflow: 'hidden', background: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <Sidebar />

      <main className="main-content flex-column" style={{ flex: 1, overflow: 'hidden', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Mobile Header */}
        <div className="mobile-header" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', padding: 6, color: 'var(--text-primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Menu size={18} />
          </button>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
            {activeNav === 'repos' 
              ? 'Repository Hub' 
              : activeNav === 'bookmarks' 
              ? 'Website Bookmarks' 
              : activeNav === 'inbox' 
              ? 'Inbox & Triage' 
              : activeNav === 'lists' 
              ? 'Saved Lists' 
              : activeNav === 'finance-bento'
              ? 'Finance Bento UI'
              : 'PromptKeeper'}
          </div>
          <button onClick={() => setQuickSaveOpen(true)} style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 'var(--radius-sm)', width: 30, height: 30, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={16} />
          </button>
        </div>

        {/* Global Workbench & Toolbar for Prompt Library */}
        {activeNav !== 'repos' && activeNav !== 'bookmarks' && activeNav !== 'inbox' && activeNav !== 'lists' && activeNav !== 'finance-bento' && (
          <>
            {/* 1. Workbench Top Header */}
            <div className="hide-mobile" style={{
              padding: '14px 24px',
              background: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexShrink: 0
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <img
                  src={logoImg}
                  alt="PromptKeeper"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    objectFit: 'contain',
                    flexShrink: 0
                  }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h1 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', fontFamily: 'Geist, sans-serif' }}>
                      Prompt Library
                    </h1>
                    <span style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--text-tertiary)',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: '1px 7px',
                      borderRadius: 6,
                      fontFamily: 'Geist Mono, monospace',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {prompts.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Optimizer, Runner, New Prompt */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* AI Optimizer Button */}
                <button
                  className="btn"
                  onClick={() => {
                    if (activePrompt) {
                      openOptimizer({
                        initialText: activePrompt.body,
                        promptTitle: activePrompt.title
                      });
                    } else if (prompts.length > 0) {
                      openOptimizer({
                        initialText: prompts[0].body,
                        promptTitle: prompts[0].title
                      });
                    } else {
                      openOptimizer({
                        initialText: 'Please write a production-ready system prompt for...',
                        promptTitle: 'AI Prompt Optimizer'
                      });
                    }
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: 12,
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                  title="AI Prompt Optimizer & Polisher (Feature 5)"
                >
                  <Sparkles size={13} style={{ color: 'var(--accent)' }} />
                  <span>AI Optimizer</span>
                </button>

                {/* Variable Runner Button */}
                <button
                  className="btn"
                  onClick={() => {
                    if (activePrompt) {
                      openRunner(activePrompt);
                    } else if (prompts.length > 0) {
                      openRunner(prompts[0]);
                    } else {
                      openRunner({
                        title: 'Quick Test Runner',
                        body: 'Draft prompt: Test your prompt variables {{var}} here.'
                      });
                    }
                  }}
                  style={{
                    background: 'rgba(232, 255, 31, 0.08)',
                    border: '1px solid rgba(232, 255, 31, 0.25)',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: 12,
                    height: 32,
                    padding: '0 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                  title="Prompt Variable Runner & Quick Test (Feature 4)"
                >
                  <Play size={12} fill="currentColor" />
                  <span>Variable Runner</span>
                </button>

                <button
                  className="btn"
                  onClick={openNew}
                  style={{
                    background: 'var(--accent)',
                    color: '#0b0b0c',
                    fontWeight: 600,
                    fontSize: 12,
                    height: 32,
                    padding: '0 14px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'opacity 0.15s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>New Prompt</span>
                </button>
              </div>
            </div>

            {/* 2. Bento Category Rail */}
            <div className="hide-scrollbar bento-category-rail" style={{
              background: '#090a0f',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              padding: '6px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
              flexShrink: 0
            }}>
              <button
                onClick={() => setCatFilter('All')}
                style={{
                  background: catFilter === 'All' ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.03)',
                  border: catFilter === 'All' ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(255, 255, 255, 0.06)',
                  color: catFilter === 'All' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: 11.5,
                  height: 28,
                  padding: '0 10px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  whiteSpace: 'nowrap',
                  transition: 'background 0.15s ease, color 0.15s ease',
                  fontFamily: 'Geist, sans-serif'
                }}
              >
                <span>All Prompts</span>
                <span style={{
                  fontSize: 10,
                  color: catFilter === 'All' ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-tertiary)',
                  fontFamily: 'Geist Mono, monospace',
                  fontVariantNumeric: 'tabular-nums'
                }}>
                  {prompts.length}
                </span>
              </button>

              {categories.map(cat => {
                const count = prompts.filter(p => p.category === cat).length;
                const isActive = catFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCatFilter(cat)}
                    style={{
                      background: isActive ? 'rgba(255, 255, 255, 0.10)' : 'rgba(255, 255, 255, 0.03)',
                      border: isActive ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid rgba(255, 255, 255, 0.06)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                      fontWeight: 500,
                      fontSize: 11.5,
                      height: 28,
                      padding: '0 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      whiteSpace: 'nowrap',
                      transition: 'background 0.15s ease, color 0.15s ease',
                      fontFamily: 'Geist, sans-serif'
                    }}
                  >
                    <span>{cat}</span>
                    <span style={{
                      fontSize: 10,
                      color: isActive ? 'rgba(255, 255, 255, 0.9)' : 'var(--text-tertiary)',
                      fontFamily: 'Geist Mono, monospace',
                      fontVariantNumeric: 'tabular-nums'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* 3. Bento Toolbar Row */}
            <div className="workbench-toolbar" style={{ 
              padding: '10px 24px',
              background: 'var(--bg-app)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexShrink: 0
            }}>
              {/* Search bar */}
              <div style={{ flex: 1, maxWidth: 440, position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, color: 'var(--text-tertiary)', pointerEvents: 'none', display: 'inline-flex', alignItems: 'center' }}>
                  <Search size={14} />
                </span>
                <input
                  id="search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search prompts... (⌘K)"
                  style={{
                    width: '100%',
                    paddingLeft: 34,
                    paddingRight: search ? 34 : 12,
                    height: 34,
                    fontSize: 12,
                    fontFamily: 'Geist, sans-serif',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 6,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--border-subtle)';
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: 2 }}
                    title="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Controls on Right */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {/* Sort Selector */}
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  style={{
                    height: 36,
                    padding: '0 12px',
                    fontSize: 12,
                    fontFamily: 'Geist, sans-serif',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>Sort: {o.label}</option>)}
                </select>

                {/* View Mode Toggle (Bento Segmented) */}
                <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: 2, gap: 2 }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      background: viewMode === 'grid' ? 'var(--accent-muted)' : 'transparent',
                      color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-tertiary)',
                      border: 'none',
                      padding: '0 8px',
                      height: 30,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-xs)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    title="Grid View"
                  >
                    <LayoutGrid size={14} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    style={{
                      background: viewMode === 'list' ? 'var(--accent-muted)' : 'transparent',
                      color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-tertiary)',
                      border: 'none',
                      padding: '0 8px',
                      height: 30,
                      cursor: 'pointer',
                      borderRadius: 'var(--radius-xs)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease'
                    }}
                    title="List View"
                  >
                    <List size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Bar */}
            {hasFilters && (
              <div style={{ padding: '8px 24px', background: 'var(--bg-surface-hover)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
                <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Active Filters:</span>
                {catFilter !== 'All' && (
                  <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Collection: {catFilter}
                    <button onClick={() => setCatFilter('All')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
                  </span>
                )}
                {modelFilter !== 'All' && (
                  <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--secondary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Model: {modelFilter}
                    <button onClick={() => setModelFilter('All')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
                  </span>
                )}
                {tagFilter && (
                  <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    #{tagFilter}
                    <button onClick={() => setTagFilter('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
                  </span>
                )}
                {search && (
                  <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    Query: "{search}"
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
                  </span>
                )}
                <button
                  onClick={clearAllFilters}
                  style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: 11, marginLeft: 'auto' }}
                >
                  Reset all
                </button>
              </div>
            )}
          </>
        )}

        {/* Content Area */}
        {activeNav === 'repos' ? (
          <RepositoryHub
            repositories={repositories}
            addRepository={addRepository}
            updateRepository={updateRepository}
            deleteRepository={deleteRepository}
            toggleFavoriteRepo={toggleFavoriteRepo}
            togglePinRepo={togglePinRepo}
            updateRepoStatus={updateRepoStatus}
            refreshRepoMetadata={refreshRepoMetadata}
            statusCounts={repoStatusCounts}
            languageCounts={repoLanguageCounts}
            viewMode={viewMode}
            setViewMode={setViewMode}
            requestConfirm={requestConfirm}
            toast={toast}
          />
        ) : activeNav === 'bookmarks' ? (
          <BookmarkHub
            bookmarks={bookmarks}
            addBookmark={addBookmark}
            updateBookmark={updateBookmark}
            deleteBookmark={deleteBookmark}
            toggleFavoriteBookmark={toggleFavoriteBookmark}
            togglePinBookmark={togglePinBookmark}
            updateBookmarkStatus={updateBookmarkStatus}
            bookmarkStatusCounts={bookmarkStatusCounts}
            bookmarkCategoryCounts={bookmarkCategoryCounts}
            viewMode={viewMode}
            setViewMode={setViewMode}
            requestConfirm={requestConfirm}
            toast={toast}
          />
        ) : activeNav === 'inbox' ? (
          <InboxView />
        ) : activeNav === 'lists' ? (
          <SavedListsView />
        ) : activeNav === 'finance-bento' ? (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <FinanceBentoDemo />
          </div>
        ) : (
          /* Prompt Library Cards */
          <div className="main-scroll-view" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
                <div style={{ fontSize: 36, marginBottom: 16, opacity: 0.3 }}>∅</div>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                  {hasFilters ? 'No matches found' : 'Your vault is empty'}
                </div>
                <div style={{ fontSize: 13, marginBottom: 24, color: 'var(--text-secondary)' }}>
                  {hasFilters ? 'Try adjusting your search query or filters' : 'Start by creating your first prompt template'}
                </div>
                {hasFilters
                  ? <button className="btn" onClick={clearAllFilters} style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 20px' }}>Clear filters</button>
                  : <button className="btn" onClick={openNew} style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Create Prompt</button>
                }
              </div>
            ) : viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.map(p => (
                  <PromptCard key={p.id} p={p} />
                ))}
              </div>
            ) : (
              <div className="responsive-bento-grid">
                {filtered.map(p => (
                  <PromptCard key={p.id} p={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {activePrompt && (
        <ErrorBoundary onReset={() => setActiveId(null)}>
          <DetailPanel key={activePrompt.id} />
        </ErrorBoundary>
      )}

      {isStudioView && (
        <ForgeStudio />
      )}

      {showModal && (
        <PromptModal />
      )}
      
      {showIO && (
        <ImportExportModal />
      )}

      {confirmConfig && (
        <ConfirmModal 
          {...confirmConfig} 
          onCancel={() => setConfirmConfig(null)} 
          onConfirm={(val) => { 
            confirmConfig.onConfirm(val); 
            setConfirmConfig(null); 
          }} 
        />
      )}

      <Toast toasts={toasts} />
      
      {copySuccess && (
        <div className="modal-overlay" onClick={() => setCopySuccess(null)} style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}>
          <div className="industrial-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460, background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-hover)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>Prompt copied to clipboard</div>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 8, fontWeight: 600 }}>Template: {copySuccess.title}</div>
              <div style={{ 
                background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', padding: '14px', 
                maxHeight: '160px', overflowY: 'auto', fontSize: 12, color: 'var(--secondary)', 
                fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                borderRadius: 'var(--radius-sm)'
              }}>
                {copySuccess.body}
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn" onClick={() => setCopySuccess(null)} style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, padding: '7px 16px' }}>Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {onboardingDone === false && (
        <OnboardingModal onChoose={handleOnboarding} onComplete={handleOnboarding} />
      )}


      {/* Cloud Sync & Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        promptsCount={prompts.length}
        reposCount={repositories.length}
      />

      {/* Universal Command Palette */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        prompts={prompts}
        repositories={repositories}
        bookmarks={bookmarks}
        recentItems={recentItems}
        onSelectPrompt={(pr) => {
          setActiveId(pr.id);
          setActiveNav('prompts');
        }}
        onSelectRepo={() => {
          setActiveNav('repos');
        }}
        onSelectBookmark={() => {
          setActiveNav('bookmarks');
        }}
        onQuickSave={() => setQuickSaveOpen(true)}
        onNewPrompt={openNew}
        onAddRepo={() => {
          setActiveNav('repos');
        }}
        onAddBookmark={() => {
          setActiveNav('bookmarks');
        }}
        onOpenStudio={() => openStudio(null)}
        onOpenOptimizer={() => {
          if (activePrompt) {
            openOptimizer({
              initialText: activePrompt.body,
              promptTitle: activePrompt.title
            });
          } else {
            openOptimizer({
              initialText: 'Please review and optimize this prompt for production AI deployment.',
              promptTitle: 'New Prompt Optimization'
            });
          }
        }}
        onOpenRunner={() => {
          if (activePrompt) {
            openRunner(activePrompt);
          } else if (prompts.length > 0) {
            openRunner(prompts[0]);
          }
        }}
        onOpenIO={() => setShowIO(true)}
        onToggleTheme={toggleTheme}
        onOpenAuth={() => setAuthModalOpen(true)}
        onSetAccent={setAccent}
      />

      {/* Quick Save Modal */}
      {quickSaveOpen && (
        <QuickSaveModal isOpen={quickSaveOpen} onClose={() => setQuickSaveOpen(false)} />
      )}

      {/* Tag Manager Modal */}
      {tagManagerOpen && (
        <TagManagerModal isOpen={tagManagerOpen} onClose={() => setTagManagerOpen(false)} />
      )}

      {/* Variable Runner Modal */}
      {runnerPrompt && (
        <PromptVariableRunnerModal
          isOpen={Boolean(runnerPrompt)}
          onClose={closeRunner}
          prompt={runnerPrompt}
        />
      )}

      {/* Prompt Optimizer Modal */}
      {optimizerConfig?.isOpen && (
        <PromptOptimizerModal
          isOpen={Boolean(optimizerConfig?.isOpen)}
          onClose={closeOptimizer}
          initialText={optimizerConfig.initialText}
          promptTitle={optimizerConfig.promptTitle}
          onApply={optimizerConfig.onApply}
        />
      )}

      {/* GitHub Readme Drawer Modal */}
      <RepoReadmeDrawerModal
        isOpen={Boolean(readmeRepo)}
        onClose={closeReadme}
        repo={readmeRepo}
      />

      {/* Bulk Action Floating Bar */}
      <BulkActionBar 
        selectedIds={bulkSelectedIds}
        onClearSelection={() => setBulkSelectedIds([])}
        totalItemsCount={filtered.length}
        onSelectAll={() => setBulkSelectedIds(bulkSelectedIds.length === filtered.length ? [] : filtered.map(p => p.id))}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
