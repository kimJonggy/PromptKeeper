import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import { useLocalStorage, useToast } from '../hooks.js';
import { SEED_PROMPTS } from '../data.js';

import { usePrompts } from '../hooks/usePrompts.js';
import { useCollections } from '../hooks/useCollections.js';
import { useModels } from '../hooks/useModels.js';
import { useRepositories } from '../hooks/useRepositories.js';
import { useBookmarks } from '../hooks/useBookmarks.js';

import { db, isIndexedDBSupported } from '../db/index.js';
import { 
  promptRepository, 
  repositoryRepository, 
  bookmarkRepository 
} from '../db/repository.js';
import { 
  migrateLegacyDataToIndexedDB, 
  exportAllData, 
  STORAGE_DRIVER_KEY, 
  MIGRATION_FLAG_KEY 
} from '../db/migrationService.js';
import { syncEngine } from '../services/syncEngine.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [onboardingDone, setOnboardingDone] = useLocalStorage('pk_onboarding_v1', false);
  const { toasts, show: toast } = useToast();

  const [search, setSearch]           = useState('');
  const [catFilter, setCatFilter]     = useState('All');
  const [tagFilter, setTagFilter]     = useState('');
  const [modelFilter, setModelFilter] = useState('All');
  const [sort, setSort]               = useState('newest');
  const [activeId, setActiveId]       = useState(null);
  const [showModal, setShowModal]     = useState(false);
  const [editPrompt, setEditPrompt]   = useState(null);
  const [showIO, setShowIO]           = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabOpen, setFabOpen]         = useState(false);
  const [isStudioView, setIsStudioView] = useState(false);
  const [viewMode, setViewMode]       = useLocalStorage('pk_view_mode', 'grid');
  const [activeNav, setActiveNav]     = useState('prompts'); // 'prompts' | 'repos' | 'bookmarks' | 'inbox' | 'lists'
  const [theme, setTheme]             = useLocalStorage('pk_theme', 'dark');
  const [accent, setAccent]           = useLocalStorage('pk_accent', 'bento'); // 'bento' | 'amber' | 'emerald' | 'violet' | 'cobalt'
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen]             = useState(false);
  const [quickSaveOpen, setQuickSaveOpen]             = useState(false);
  const [tagManagerOpen, setTagManagerOpen]           = useState(false);
  const [runnerPrompt, setRunnerPrompt]               = useState(null);
  const [optimizerConfig, setOptimizerConfig]         = useState(null);
  const [readmeRepo, setReadmeRepo]                   = useState(null);
  const [bulkSelectedIds, setBulkSelectedIds]         = useState([]);
  const [recentItems, setRecentItems]                 = useLocalStorage('pk_recent_items', []);
  const [storageDriver, setStorageDriver] = useLocalStorage(STORAGE_DRIVER_KEY, 'indexeddb');
  const [isMigrating, setIsMigrating] = useState(false);

  // Background sync engine initialization
  useEffect(() => {
    syncEngine.start(30000);
    return () => syncEngine.stop();
  }, []);

  // Background auto-migration on mount
  useEffect(() => {
    let isMounted = true;
    async function initDbMigration() {
      if (!isIndexedDBSupported()) return;
      const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
      if (!alreadyMigrated) {
        setIsMigrating(true);
        try {
          const report = await migrateLegacyDataToIndexedDB();
          if (isMounted && report.success) {
            console.info('IndexedDB migration completed successfully:', report);
          }
        } catch (err) {
          console.warn('Initial migration error:', err);
        } finally {
          if (isMounted) setIsMigrating(false);
        }
      }
    }
    initDbMigration();
    return () => { isMounted = false; };
  }, []);

  const toggleStorageDriver = useCallback(() => {
    setStorageDriver(prev => {
      const next = prev === 'indexeddb' ? 'localstorage' : 'indexeddb';
      if (toast) toast(`Storage driver switched to ${next.toUpperCase()}`, 'cyan');
      return next;
    });
  }, [setStorageDriver, toast]);

  const runMigration = useCallback(async (force = false) => {
    setIsMigrating(true);
    try {
      const report = await migrateLegacyDataToIndexedDB({ force });
      if (report.success) {
        if (toast) toast(`Migration completed: ${report.promptsCount} prompts, ${report.reposCount} repos ✓`, 'violet');
      } else {
        if (toast) toast(`Migration error: ${report.errors[0] || 'Failed'}`, 'danger');
      }
      return report;
    } finally {
      setIsMigrating(false);
    }
  }, [toast]);

  const requestConfirm = useCallback((config) => {
    setConfirmConfig(config);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  }, [setTheme]);

  // Handle dark / light theme attributes
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark-theme');
      document.documentElement.classList.add('light-theme');
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.classList.remove('light-theme');
      document.documentElement.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, [theme]);

  // Handle selectable accent palette tokens (Bento Electric Lime, Amber, Emerald, Violet, Cobalt)
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent || 'bento');
  }, [accent]);

  // Extract complex states to custom hooks
  const { 
    prompts, setPrompts, savePrompt, deletePrompt, toggleFav, 
    copyPrompt, importPrompts, updatePrompt, renameTag, deleteTag,
    restorePromptVersion
  } = usePrompts({ 
    toast, setIsStudioView, setShowModal, setEditPrompt, editPrompt, 
    setActiveId, setCopySuccess, tagFilter, setTagFilter 
  });

  const {
    repositories, setRepositories, addRepository, updateRepository, deleteRepository,
    toggleFavoriteRepo, togglePinRepo, updateRepoStatus, refreshRepoMetadata,
    statusCounts: repoStatusCounts, languageCounts: repoLanguageCounts
  } = useRepositories();

  const {
    bookmarks, setBookmarks, addBookmark, updateBookmark, deleteBookmark,
    toggleFavoriteBookmark, togglePinBookmark, updateBookmarkStatus,
    statusCounts: bookmarkStatusCounts, categoryCounts: bookmarkCategoryCounts
  } = useBookmarks();

  const { 
    collections: categories, setCollections: setCategories,
    collectionColors: categoryColors, setCollectionColors: setCategoryColors, 
    addCollection: addCategory, renameCollection: renameCategory,
    deleteCollection: deleteCategory, reorderCollection: reorderCategory,
    assignResourceToCollection, removeResourceFromCollection,
    collectionStats
  } = useCollections({ 
    toast, prompts, setPrompts, repositories, setRepositories, bookmarks, setBookmarks,
    activeCollection: catFilter, setActiveCollection: setCatFilter 
  });

  const { 
    modelColors, setModelColors, addModel, updateModelColor, 
    renameModel, deleteModel 
  } = useModels({ toast, setPrompts, modelFilter, setModelFilter });

  const handleOnboarding = useCallback((choice) => {
    if (choice === 'demo') {
      setPrompts(SEED_PROMPTS);
    } else {
      setPrompts([]);
    }
    setOnboardingDone(true);
  }, [setPrompts, setOnboardingDone]);

  // Derived state
  const activePrompt = useMemo(() => prompts.find(p => p.id === activeId), [prompts, activeId]);
  const linkedPrompt = useMemo(() => 
    activePrompt?.linkedPromptId ? prompts.find(x => String(x.id) === String(activePrompt.linkedPromptId)) : null
  , [prompts, activePrompt]);

  const filtered = useMemo(() => {
    let r = [...prompts];
    if (catFilter !== 'All')   r = r.filter(p => p.category === catFilter);
    if (modelFilter !== 'All') r = r.filter(p => p.model === modelFilter);
    if (tagFilter)             r = r.filter(p => p.tags.includes(tagFilter));
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.body.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      );
    }
    if (sort === 'newest')   r.sort((a, b) => b.created - a.created);
    if (sort === 'mostused') r.sort((a, b) => b.uses - a.uses);
    if (sort === 'az')       r.sort((a, b) => a.title.localeCompare(b.title));
    if (sort === 'fav')      r = r.filter(p => p.fav);

    // Pinned prompts float to the top
    r.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    return r;
  }, [prompts, catFilter, modelFilter, tagFilter, search, sort]);

  const hasFilters = search || tagFilter || modelFilter !== 'All' || catFilter !== 'All';

  // Recent items logger
  const logRecentItem = useCallback((item) => {
    if (!item || !item.id) return;
    setRecentItems(prev => {
      const filteredList = prev.filter(x => !(String(x.id) === String(item.id) && x.type === item.type));
      return [
        {
          id: item.id,
          type: item.type || 'prompt',
          title: item.title || 'Untitled',
          action: item.action || 'opened',
          timestamp: Date.now()
        },
        ...filteredList
      ].slice(0, 30);
    });
  }, [setRecentItems]);

  // Prompt Pinning
  const togglePinPrompt = useCallback((id) => {
    setPrompts(prev => {
      const updated = prev.map(p => String(p.id) === String(id) ? { ...p, isPinned: !p.isPinned } : p);
      const target = updated.find(p => String(p.id) === String(id));
      if (target && isIndexedDBSupported()) {
        promptRepository.save(target).catch(console.warn);
      }
      return updated;
    });
  }, [setPrompts]);

  // Global Tag Deduplication & Operations
  const renameGlobalTag = useCallback((oldTag, newTag) => {
    if (!newTag || oldTag === newTag) return;
    const cleanOld = oldTag.trim().toLowerCase();
    const cleanNew = newTag.trim().toLowerCase();

    setPrompts(prev => {
      const updated = prev.map(p => ({
        ...p,
        tags: (p.tags || []).map(t => t.toLowerCase() === cleanOld ? cleanNew : t)
      }));
      if (isIndexedDBSupported()) {
        updated.forEach(p => promptRepository.save(p).catch(console.warn));
      }
      return updated;
    });

    setRepositories(prev => {
      const updated = prev.map(r => ({
        ...r,
        tags: (r.tags || []).map(t => t.toLowerCase() === cleanOld ? cleanNew : t)
      }));
      if (isIndexedDBSupported()) {
        updated.forEach(r => repositoryRepository.save(r).catch(console.warn));
      }
      return updated;
    });

    setBookmarks(prev => {
      const updated = prev.map(b => ({
        ...b,
        tags: (b.tags || []).map(t => t.toLowerCase() === cleanOld ? cleanNew : t)
      }));
      if (isIndexedDBSupported()) {
        updated.forEach(b => bookmarkRepository.save(b).catch(console.warn));
      }
      return updated;
    });
  }, [setPrompts, setRepositories, setBookmarks]);

  const deleteGlobalTag = useCallback((tag) => {
    const cleanTag = tag.trim().toLowerCase();

    setPrompts(prev => {
      const updated = prev.map(p => ({
        ...p,
        tags: (p.tags || []).filter(t => t.toLowerCase() !== cleanTag)
      }));
      if (isIndexedDBSupported()) {
        updated.forEach(p => promptRepository.save(p).catch(console.warn));
      }
      return updated;
    });

    setRepositories(prev => {
      const updated = prev.map(r => ({
        ...r,
        tags: (r.tags || []).filter(t => t.toLowerCase() !== cleanTag)
      }));
      if (isIndexedDBSupported()) {
        updated.forEach(r => repositoryRepository.save(r).catch(console.warn));
      }
      return updated;
    });

    setBookmarks(prev => {
      const updated = prev.map(b => ({
        ...b,
        tags: (b.tags || []).filter(t => t.toLowerCase() !== cleanTag)
      }));
      if (isIndexedDBSupported()) {
        updated.forEach(b => bookmarkRepository.save(b).catch(console.warn));
      }
      return updated;
    });
  }, [setPrompts, setRepositories, setBookmarks]);

  const mergeGlobalTags = useCallback((sourceTags, targetTag) => {
    const sources = sourceTags.map(s => s.trim().toLowerCase());
    const target = targetTag.trim().toLowerCase();

    setPrompts(prev => {
      const updated = prev.map(p => {
        const nextTags = (p.tags || []).map(t => sources.includes(t.toLowerCase()) ? target : t);
        return { ...p, tags: [...new Set(nextTags)] };
      });
      if (isIndexedDBSupported()) {
        updated.forEach(p => promptRepository.save(p).catch(console.warn));
      }
      return updated;
    });

    setRepositories(prev => {
      const updated = prev.map(r => {
        const nextTags = (r.tags || []).map(t => sources.includes(t.toLowerCase()) ? target : t);
        return { ...r, tags: [...new Set(nextTags)] };
      });
      if (isIndexedDBSupported()) {
        updated.forEach(r => repositoryRepository.save(r).catch(console.warn));
      }
      return updated;
    });

    setBookmarks(prev => {
      const updated = prev.map(b => {
        const nextTags = (b.tags || []).map(t => sources.includes(t.toLowerCase()) ? target : t);
        return { ...b, tags: [...new Set(nextTags)] };
      });
      if (isIndexedDBSupported()) {
        updated.forEach(b => bookmarkRepository.save(b).catch(console.warn));
      }
      return updated;
    });
  }, [setPrompts, setRepositories, setBookmarks]);

  // Bulk Operations
  const bulkAddTag = useCallback((ids, tag) => {
    const cleanTag = tag.trim().toLowerCase().replace(/^#/, '');
    const idSet = new Set(ids.map(String));

    setPrompts(prev => {
      const updated = prev.map(p => {
        if (!idSet.has(String(p.id))) return p;
        return { ...p, tags: [...new Set([...(p.tags || []), cleanTag])] };
      });
      if (isIndexedDBSupported()) {
        updated.filter(p => idSet.has(String(p.id))).forEach(p => promptRepository.save(p).catch(console.warn));
      }
      return updated;
    });

    setRepositories(prev => {
      const updated = prev.map(r => {
        if (!idSet.has(String(r.id))) return r;
        return { ...r, tags: [...new Set([...(r.tags || []), cleanTag])] };
      });
      if (isIndexedDBSupported()) {
        updated.filter(r => idSet.has(String(r.id))).forEach(r => repositoryRepository.save(r).catch(console.warn));
      }
      return updated;
    });

    setBookmarks(prev => {
      const updated = prev.map(b => {
        if (!idSet.has(String(b.id))) return b;
        return { ...b, tags: [...new Set([...(b.tags || []), cleanTag])] };
      });
      if (isIndexedDBSupported()) {
        updated.filter(b => idSet.has(String(b.id))).forEach(b => bookmarkRepository.save(b).catch(console.warn));
      }
      return updated;
    });
  }, [setPrompts, setRepositories, setBookmarks]);

  const bulkAddToList = useCallback((ids, listName) => {
    const idSet = new Set(ids.map(String));

    setPrompts(prev => {
      const updated = prev.map(p => {
        if (!idSet.has(String(p.id))) return p;
        const current = Array.isArray(p.collections) ? p.collections : (p.category ? [p.category] : []);
        if (current.includes(listName)) return p;
        return { ...p, collections: [...current, listName] };
      });
      if (isIndexedDBSupported()) {
        updated.filter(p => idSet.has(String(p.id))).forEach(p => promptRepository.save(p).catch(console.warn));
      }
      return updated;
    });

    setRepositories(prev => {
      const updated = prev.map(r => {
        if (!idSet.has(String(r.id))) return r;
        const current = Array.isArray(r.collections) ? r.collections : [];
        if (current.includes(listName)) return r;
        return { ...r, collections: [...current, listName] };
      });
      if (isIndexedDBSupported()) {
        updated.filter(r => idSet.has(String(r.id))).forEach(r => repositoryRepository.save(r).catch(console.warn));
      }
      return updated;
    });

    setBookmarks(prev => {
      const updated = prev.map(b => {
        if (!idSet.has(String(b.id))) return b;
        const current = Array.isArray(b.collections) ? b.collections : (b.category ? [b.category] : []);
        if (current.includes(listName)) return b;
        return { ...b, collections: [...current, listName] };
      });
      if (isIndexedDBSupported()) {
        updated.filter(b => idSet.has(String(b.id))).forEach(b => bookmarkRepository.save(b).catch(console.warn));
      }
      return updated;
    });
  }, [setPrompts, setRepositories, setBookmarks]);

  const bulkArchive = useCallback((ids) => {
    const idSet = new Set(ids.map(String));

    setPrompts(prev => {
      const updated = prev.map(p => idSet.has(String(p.id)) ? { ...p, status: 'archived' } : p);
      if (isIndexedDBSupported()) {
        updated.filter(p => idSet.has(String(p.id))).forEach(p => promptRepository.save(p).catch(console.warn));
      }
      return updated;
    });

    setRepositories(prev => {
      const updated = prev.map(r => idSet.has(String(r.id)) ? { ...r, status: 'archived' } : r);
      if (isIndexedDBSupported()) {
        updated.filter(r => idSet.has(String(r.id))).forEach(r => repositoryRepository.save(r).catch(console.warn));
      }
      return updated;
    });

    setBookmarks(prev => {
      const updated = prev.map(b => idSet.has(String(b.id)) ? { ...b, status: 'archived' } : b);
      if (isIndexedDBSupported()) {
        updated.filter(b => idSet.has(String(b.id))).forEach(b => bookmarkRepository.save(b).catch(console.warn));
      }
      return updated;
    });
  }, [setPrompts, setRepositories, setBookmarks]);

  const bulkDelete = useCallback((ids) => {
    const idSet = new Set(ids.map(String));

    setPrompts(prev => prev.filter(p => !idSet.has(String(p.id))));
    setRepositories(prev => prev.filter(r => !idSet.has(String(r.id))));
    setBookmarks(prev => prev.filter(b => !idSet.has(String(b.id))));

    if (isIndexedDBSupported()) {
      ids.forEach(id => {
        promptRepository.delete(id).catch(console.warn);
        repositoryRepository.delete(id).catch(console.warn);
        bookmarkRepository.delete(id).catch(console.warn);
      });
    }
  }, [setPrompts, setRepositories, setBookmarks]);

  // Modal actions
  const openNew = useCallback(() => { setEditPrompt(null); setShowModal(true); setIsStudioView(false); }, []);
  const openEdit = useCallback((p) => { setEditPrompt(p); setShowModal(true); setIsStudioView(false); }, []);
  const openStudio = useCallback((p = null) => { setEditPrompt(p); setIsStudioView(true); setShowModal(false); }, []);
  const openRunner = useCallback((p) => { setRunnerPrompt(p); }, []);
  const closeRunner = useCallback(() => { setRunnerPrompt(null); }, []);
  const openOptimizer = useCallback(({ initialText, promptTitle, onApply }) => {
    setOptimizerConfig({
      isOpen: true,
      initialText: initialText || '',
      promptTitle: promptTitle || 'Prompt Optimizer',
      onApply
    });
  }, []);
  const closeOptimizer = useCallback(() => { setOptimizerConfig(null); }, []);
  const openReadme = useCallback((r) => setReadmeRepo(r), []);
  const closeReadme = useCallback(() => setReadmeRepo(null), []);

  const resetVault = useCallback(async () => {
    if (window.confirm("ARE YOU SURE? THIS WILL PERMANENTLY WIPE ALL PROMPTKEEPER DATA.")) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pk_')) {
          localStorage.removeItem(key);
        }
      });
      if (isIndexedDBSupported()) {
        try {
          await db.delete();
        } catch (err) {
          console.warn('Error deleting IndexedDB during vault reset:', err);
        }
      }
      window.location.reload();
    }
  }, []);

  const value = useMemo(() => ({
    onboardingDone, handleOnboarding,
    toasts, toast,
    search, setSearch,
    catFilter, setCatFilter,
    tagFilter, setTagFilter,
    modelFilter, setModelFilter,
    sort, setSort,
    activeId, setActiveId,
    showModal, setShowModal,
    editPrompt, setEditPrompt,
    showIO, setShowIO,
    sidebarOpen, setSidebarOpen,
    fabOpen, setFabOpen,
    isStudioView, setIsStudioView,
    viewMode, setViewMode,
    activeNav, setActiveNav,
    theme, toggleTheme,
    accent, setAccent,
    confirmConfig, requestConfirm, setConfirmConfig,
    copySuccess, setCopySuccess,
    commandPaletteOpen, setCommandPaletteOpen,
    authModalOpen, setAuthModalOpen,
    storageDriver, toggleStorageDriver,
    isMigrating, runMigration, exportAllData,
    resetVault,
    
    // Derived values
    activePrompt, linkedPrompt, filtered, hasFilters,
    openNew, openEdit, openStudio,

    // hook states
    prompts, setPrompts, savePrompt, deletePrompt, toggleFav, copyPrompt, importPrompts, updatePrompt, renameTag, deleteTag,
    restorePromptVersion,
    categories, setCategories, categoryColors, setCategoryColors, addCategory, renameCategory, deleteCategory, reorderCategory,
    assignResourceToCollection, removeResourceFromCollection, collectionStats,
    modelColors, setModelColors, addModel, updateModelColor, renameModel, deleteModel,

    // Modal & workflow states
    quickSaveOpen, setQuickSaveOpen,
    tagManagerOpen, setTagManagerOpen,
    runnerPrompt, setRunnerPrompt, openRunner, closeRunner,
    optimizerConfig, setOptimizerConfig, openOptimizer, closeOptimizer,
    readmeRepo, setReadmeRepo, openReadme, closeReadme,
    bulkSelectedIds, setBulkSelectedIds,
    recentItems, logRecentItem,
    togglePinPrompt,
    renameGlobalTag, deleteGlobalTag, mergeGlobalTags,
    bulkAddTag, bulkAddToList, bulkArchive, bulkDelete,

    // repository states
    repositories, setRepositories, addRepository, updateRepository, deleteRepository,
    toggleFavoriteRepo, togglePinRepo, updateRepoStatus, refreshRepoMetadata,
    repoStatusCounts, repoLanguageCounts,

    // bookmark states
    bookmarks, setBookmarks, addBookmark, updateBookmark, deleteBookmark,
    toggleFavoriteBookmark, togglePinBookmark, updateBookmarkStatus,
    bookmarkStatusCounts, bookmarkCategoryCounts
  }), [
    onboardingDone, handleOnboarding, toasts, toast, search, setSearch, catFilter, setCatFilter, tagFilter, setTagFilter,
    modelFilter, setModelFilter, sort, setSort, activeId, setActiveId, showModal, setShowModal, editPrompt, setEditPrompt,
    showIO, setShowIO, sidebarOpen, setSidebarOpen, fabOpen, setFabOpen, isStudioView, setIsStudioView, 
    viewMode, setViewMode, activeNav, setActiveNav, theme, toggleTheme, accent, setAccent,
    confirmConfig, requestConfirm, setConfirmConfig, copySuccess, setCopySuccess, commandPaletteOpen, setCommandPaletteOpen,
    authModalOpen, setAuthModalOpen,
    quickSaveOpen, setQuickSaveOpen, tagManagerOpen, setTagManagerOpen,
    runnerPrompt, setRunnerPrompt, openRunner, closeRunner,
    optimizerConfig, setOptimizerConfig, openOptimizer, closeOptimizer,
    readmeRepo, setReadmeRepo, openReadme, closeReadme,
    bulkSelectedIds, setBulkSelectedIds,
    recentItems, logRecentItem, togglePinPrompt,
    renameGlobalTag, deleteGlobalTag, mergeGlobalTags,
    bulkAddTag, bulkAddToList, bulkArchive, bulkDelete,
    storageDriver, toggleStorageDriver, isMigrating, runMigration, resetVault, activePrompt, linkedPrompt,
    filtered, hasFilters, openNew, openEdit, openStudio, prompts, setPrompts, savePrompt, deletePrompt, toggleFav,
    copyPrompt, importPrompts, updatePrompt, renameTag, deleteTag, restorePromptVersion, categories, setCategories, categoryColors,
    setCategoryColors, addCategory, renameCategory, deleteCategory, reorderCategory, assignResourceToCollection, removeResourceFromCollection, collectionStats,
    modelColors, setModelColors, addModel, updateModelColor, renameModel, deleteModel,
    repositories, setRepositories, addRepository, updateRepository, deleteRepository,
    toggleFavoriteRepo, togglePinRepo, updateRepoStatus, refreshRepoMetadata,
    repoStatusCounts, repoLanguageCounts,
    bookmarks, setBookmarks, addBookmark, updateBookmark, deleteBookmark,
    toggleFavoriteBookmark, togglePinBookmark, updateBookmarkStatus,
    bookmarkStatusCounts, bookmarkCategoryCounts
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useApp() {
  const context = useContext(AppContext);
  return context || {};
}
