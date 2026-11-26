import { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Star, 
  LayoutGrid, 
  List, 
  Plus, 
  FolderGit2,
  Folder,
  Layers,
  Edit2,
  Check,
  RefreshCw
} from 'lucide-react';
import RepositoryCard from './RepositoryCard.jsx';
import RepositoryDetail from './RepositoryDetail.jsx';
import AddRepositoryModal from './AddRepositoryModal.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import { REPO_SORT_OPTIONS } from '../../constants/repositoryConstants.js';

export default function RepositoryHub({
  repositories = [],
  addRepository,
  updateRepository,
  deleteRepository,
  toggleFavoriteRepo,
  togglePinRepo,
  updateRepoStatus,
  refreshRepoMetadata,
  _statusCounts = {},
  languageCounts = {},
  viewMode = 'grid',
  setViewMode,
  requestConfirm,
  toast
}) {
  const [activeRepoId, setActiveRepoId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [langFilter, setLangFilter] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('saved_desc');

  // Sub-Category State & Persistence
  const [subCategories, setSubCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('pk_repo_subcategories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Failed to load subcategories:', err);
    }
    const found = new Set();
    repositories.forEach(r => {
      const cat = r.subCategory || r.category || (Array.isArray(r.collections) && r.collections[0]);
      if (cat) found.add(cat);
    });
    if (found.size > 0) return Array.from(found);
    return ['Active Projects', 'Frontend Stack', 'Design System', 'AI & Tools'];
  });

  const [isAddingSubCat, setIsAddingSubCat] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [editingSubCat, setEditingSubCat] = useState(null);
  const [editSubCatName, setEditSubCatName] = useState('');

  const persistSubCategories = (next) => {
    setSubCategories(next);
    try {
      localStorage.setItem('pk_repo_subcategories', JSON.stringify(next));
    } catch (err) {
      console.warn('Failed to persist subcategories:', err);
    }
  };

  const getRepoSubCategory = (r) => {
    return r.subCategory || r.category || (Array.isArray(r.collections) && r.collections[0]) || '';
  };

  // Sub-category counts
  const subCategoryCounts = useMemo(() => {
    const counts = { all: repositories.length };
    repositories.forEach(r => {
      const cat = getRepoSubCategory(r);
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [repositories]);

  // Handlers for Sub-Categories
  const handleAddSubCategory = () => {
    const trimmed = newSubCatName.trim();
    if (!trimmed) {
      setIsAddingSubCat(false);
      return;
    }
    if (subCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      if (toast) toast(`Sub-category "${trimmed}" already exists`, 'amber');
      return;
    }
    const next = [...subCategories, trimmed];
    persistSubCategories(next);
    setSubCategoryFilter(trimmed);
    setNewSubCatName('');
    setIsAddingSubCat(false);
    if (toast) toast(`Created sub-category "${trimmed}"`);
  };

  const handleRenameSubCategory = (oldName) => {
    const trimmed = editSubCatName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingSubCat(null);
      return;
    }
    if (subCategories.some(c => c.toLowerCase() === trimmed.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase())) {
      if (toast) toast(`Sub-category "${trimmed}" already exists`, 'amber');
      return;
    }

    const next = subCategories.map(c => c === oldName ? trimmed : c);
    persistSubCategories(next);

    // Update all repositories with this sub-category
    repositories.forEach(r => {
      if (getRepoSubCategory(r) === oldName) {
        updateRepository(r.id, {
          subCategory: trimmed,
          category: trimmed,
          collections: [trimmed]
        });
      }
    });

    if (subCategoryFilter === oldName) {
      setSubCategoryFilter(trimmed);
    }

    setEditingSubCat(null);
    setEditSubCatName('');
    if (toast) toast(`Renamed to "${trimmed}"`);
  };

  const handleDeleteSubCategory = (catName, e) => {
    e?.stopPropagation();
    const count = subCategoryCounts[catName] || 0;

    const proceedDelete = () => {
      const next = subCategories.filter(c => c !== catName);
      persistSubCategories(next);

      repositories.forEach(r => {
        if (getRepoSubCategory(r) === catName) {
          updateRepository(r.id, {
            subCategory: '',
            category: '',
            collections: []
          });
        }
      });

      if (subCategoryFilter === catName) {
        setSubCategoryFilter('all');
      }
      if (toast) toast(`Deleted sub-category "${catName}"`);
    };

    if (count > 0 && requestConfirm) {
      requestConfirm({
        title: 'DELETE SUB-CATEGORY',
        message: `"${catName}" has ${count} ${count === 1 ? 'repository' : 'repositories'}. Are you sure you want to remove this sub-category? The repositories will remain in your Hub.`,
        onConfirm: proceedDelete
      });
    } else {
      proceedDelete();
    }
  };

  // Currently inspected repository
  const activeRepo = useMemo(() => {
    return repositories.find(r => r.id === activeRepoId) || null;
  }, [repositories, activeRepoId]);

  // Filtered & Sorted repositories
  const filteredRepositories = useMemo(() => {
    return repositories
      .filter(repo => {
        // Sub-Category filter
        if (subCategoryFilter !== 'all') {
          const cat = getRepoSubCategory(repo);
          if (cat.toLowerCase() !== subCategoryFilter.toLowerCase()) {
            return false;
          }
        }

        // Language filter
        if (langFilter !== 'all' && (repo.primaryLanguage || 'Unknown') !== langFilter) {
          return false;
        }

        // Favorites filter
        if (onlyFavorites && !repo.isFavorite) {
          return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = (repo.fullName || '').toLowerCase().includes(q);
          const matchDesc = (repo.description || '').toLowerCase().includes(q);
          const matchLang = (repo.primaryLanguage || '').toLowerCase().includes(q);
          const matchNotes = (repo.personalNotes || '').toLowerCase().includes(q);
          const matchTopics = (repo.topics || []).some(t => t.toLowerCase().includes(q));
          const matchTags = (repo.tags || []).some(t => t.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchLang && !matchNotes && !matchTopics && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned repos always come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        switch (sort) {
          case 'stars_desc':
            return (b.stars || 0) - (a.stars || 0);
          case 'pushed_desc':
            return new Date(b.pushedAt || 0) - new Date(a.pushedAt || 0);
          case 'name_asc':
            return (a.fullName || '').localeCompare(b.fullName || '');
          case 'saved_desc':
          default:
            return (b.savedAt || 0) - (a.savedAt || 0);
        }
      });
  }, [repositories, subCategoryFilter, langFilter, onlyFavorites, search, sort]);

  const hasActiveFilters = subCategoryFilter !== 'all' || langFilter !== 'all' || onlyFavorites || search.trim() !== '';

  const handleClearFilters = () => {
    setSubCategoryFilter('all');
    setLangFilter('all');
    setOnlyFavorites(false);
    setSearch('');
  };

  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const handleSyncAll = async () => {
    if (repositories.length === 0 || isSyncingAll) return;
    setIsSyncingAll(true);
    let updatedCount = 0;
    try {
      for (const repo of repositories) {
        try {
          await refreshRepoMetadata(repo.id);
          updatedCount++;
        } catch {
          // ignore individual network errors
        }
      }
      if (toast) toast(`Synced GitHub details for ${updatedCount} repositories ✓`, 'cyan');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleAddRepository = (repoData) => {
    const res = addRepository(repoData);
    if (res.success) {
      if (toast) toast(`Saved ${res.repository.fullName} to Repository Hub!`);
      setActiveRepoId(res.repository.id);
    }
    return res;
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--bg-app)' }}>
      
      {/* 1. Workbench Top Header */}
      <div className="hide-mobile" style={{
        padding: '16px 24px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(59, 130, 246, 0.12)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            color: 'var(--color-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.08)',
            flexShrink: 0
          }}>
            <FolderGit2 size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
                Repository Hub
              </h1>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-blue)',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                padding: '1px 8px',
                borderRadius: 12
              }}>
                {repositories.length} {repositories.length === 1 ? 'Repository' : 'Repositories'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {repositories.length > 0 && (
            <button
              onClick={handleSyncAll}
              disabled={isSyncingAll}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 12,
                height: 34,
                padding: '0 12px',
                borderRadius: 'var(--radius-sm)',
                cursor: isSyncingAll ? 'wait' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s ease'
              }}
              title="Auto-fetch latest GitHub descriptions, stars, and tags for all repositories"
            >
              <RefreshCw size={13} style={{ animation: isSyncingAll ? 'spin 1s linear infinite' : 'none' }} />
              <span>{isSyncingAll ? 'Syncing...' : 'Sync Git'}</span>
            </button>
          )}

          <button
            className="btn"
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'var(--accent)',
              color: '#000',
              fontWeight: 700,
              fontSize: 12,
              height: 34,
              padding: '0 16px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: 'var(--shadow-primary)'
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Add Repository</span>
          </button>
        </div>
      </div>

      {/* 2. Editable Sub-Category Tabs Rail */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {/* All Repositories Tab */}
        <button
          onClick={() => setSubCategoryFilter('all')}
          style={{
            background: subCategoryFilter === 'all' ? 'var(--accent-muted)' : 'transparent',
            border: 'none',
            borderBottom: subCategoryFilter === 'all' ? '2px solid var(--accent)' : '2px solid transparent',
            color: subCategoryFilter === 'all' ? 'var(--accent)' : 'var(--text-secondary)',
            fontWeight: subCategoryFilter === 'all' ? 700 : 500,
            fontSize: 12,
            padding: '10px 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={13} style={{ color: subCategoryFilter === 'all' ? 'var(--accent)' : 'var(--text-tertiary)' }} />
          <span>All Repositories</span>
          <span style={{
            fontSize: 10,
            background: subCategoryFilter === 'all' ? 'var(--accent)' : 'var(--bg-card)',
            color: subCategoryFilter === 'all' ? '#0b0b0c' : 'var(--text-tertiary)',
            padding: '1px 6px',
            borderRadius: 10,
            fontWeight: 700,
            fontFamily: 'Geist Mono, monospace'
          }}>
            {repositories.length}
          </span>
        </button>

        {/* Editable Sub-Category Tabs */}
        {subCategories.map(cat => {
          const isActive = subCategoryFilter === cat;
          const count = subCategoryCounts[cat] || 0;
          const isEditing = editingSubCat === cat;

          if (isEditing) {
            return (
              <div
                key={cat}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 10,
                  border: '1px solid var(--accent)'
                }}
              >
                <input
                  autoFocus
                  type="text"
                  value={editSubCatName}
                  onChange={e => setEditSubCatName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameSubCategory(cat);
                    if (e.key === 'Escape') setEditingSubCat(null);
                  }}
                  style={{
                    background: '#000',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: 6,
                    width: 120
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRenameSubCategory(cat)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 2 }}
                  title="Save name"
                >
                  <Check size={13} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSubCat(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }}
                  title="Cancel"
                >
                  <X size={13} />
                </button>
              </div>
            );
          }

          return (
            <div
              key={cat}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
                background: isActive ? 'var(--accent-muted)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <button
                type="button"
                onClick={() => setSubCategoryFilter(cat)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12,
                  padding: '10px 8px 10px 12px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  whiteSpace: 'nowrap'
                }}
              >
                <Folder size={12} style={{ color: isActive ? 'var(--accent)' : 'var(--text-tertiary)' }} />
                <span>{cat}</span>
                {count > 0 && (
                  <span style={{
                    fontSize: 10,
                    background: isActive ? 'var(--accent)' : 'var(--bg-card)',
                    color: isActive ? '#0b0b0c' : 'var(--text-tertiary)',
                    padding: '1px 6px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    {count}
                  </span>
                )}
              </button>

              {/* Quick inline edit & delete actions */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, paddingRight: 6 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingSubCat(cat);
                    setEditSubCatName(cat);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: 3,
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 4
                  }}
                  title={`Rename "${cat}"`}
                >
                  <Edit2 size={11} />
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteSubCategory(cat, e)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: 3,
                    display: 'inline-flex',
                    alignItems: 'center',
                    borderRadius: 4
                  }}
                  title={`Delete "${cat}"`}
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add Sub-Category Button / Input */}
        {isAddingSubCat ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 10,
            border: '1px solid var(--accent)',
            marginLeft: 4
          }}>
            <input
              autoFocus
              type="text"
              placeholder="Sub-category name..."
              value={newSubCatName}
              onChange={e => setNewSubCatName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSubCategory();
                if (e.key === 'Escape') setIsAddingSubCat(false);
              }}
              style={{
                background: '#000',
                border: 'none',
                outline: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: 6,
                width: 130
              }}
            />
            <button
              type="button"
              onClick={handleAddSubCategory}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 2 }}
              title="Add"
            >
              <Check size={13} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => setIsAddingSubCat(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }}
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setIsAddingSubCat(true);
              setNewSubCatName('');
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px dashed rgba(255, 255, 255, 0.16)',
              borderRadius: 12,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              marginLeft: 6
            }}
            title="Add new sub-category"
          >
            <Plus size={11} strokeWidth={2.5} />
            <span>Sub-Category</span>
          </button>
        )}
      </div>

      {/* 3. Toolbar: Search on left, compact filters on right (Single Row) */}
      <div className="workbench-toolbar" style={{
        padding: '10px 24px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        background: 'var(--bg-app)',
        flexShrink: 0
      }}>
        {/* Left: Search input */}
        <div style={{ flex: 1, maxWidth: 420, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search repositories by name, topic, note..."
            style={{
              width: '100%',
              height: 36,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 32px 0 34px',
              fontSize: 12,
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 8,
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center'
              }}
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right Controls: Single Row, No Wrapping */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Language selector */}
          <select
            className="toolbar-select"
            value={langFilter}
            onChange={e => setLangFilter(e.target.value)}
            style={{
              height: 36,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 10px',
              fontSize: 12,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
              width: 'auto',
              maxWidth: 160
            }}
          >
            <option value="all">All Languages</option>
            {Object.keys(languageCounts).sort().map(lang => (
              <option key={lang} value={lang}>
                {lang} ({languageCounts[lang]})
              </option>
            ))}
          </select>

          {/* Favorites filter toggle */}
          <button
            onClick={() => setOnlyFavorites(f => !f)}
            style={{
              height: 36,
              background: onlyFavorites ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-surface)',
              border: onlyFavorites ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid var(--border-subtle)',
              color: onlyFavorites ? '#eab308' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}
          >
            <Star size={13} fill={onlyFavorites ? '#eab308' : 'none'} color={onlyFavorites ? '#eab308' : 'currentColor'} />
            <span>Favorites</span>
          </button>

          {/* Sort dropdown */}
          <select
            className="toolbar-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
            style={{
              height: 36,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 10px',
              fontSize: 12,
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none',
              width: 'auto'
            }}
          >
            {REPO_SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>Sort: {opt.label}</option>
            ))}
          </select>

          {/* View mode toggle */}
          {setViewMode && (
            <div style={{
              display: 'flex',
              height: 36,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: 2,
              boxSizing: 'border-box'
            }}>
              <button
                onClick={() => setViewMode('grid')}
                style={{
                  background: viewMode === 'grid' ? 'var(--accent-muted)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-tertiary)',
                  padding: '0 9px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Grid View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  background: viewMode === 'list' ? 'var(--accent-muted)' : 'transparent',
                  border: 'none',
                  color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-tertiary)',
                  padding: '0 9px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="List View"
              >
                <List size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Active Filter Chips */}
      {hasActiveFilters && (
        <div style={{
          padding: '6px 24px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          flexWrap: 'wrap',
          flexShrink: 0
        }}>
          <span style={{ color: 'var(--text-tertiary)', fontWeight: 600 }}>Active filters:</span>
          {subCategoryFilter !== 'all' && (
            <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Sub-Category: {subCategoryFilter}
              <button onClick={() => setSubCategoryFilter('all')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
            </span>
          )}
          {langFilter !== 'all' && (
            <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Language: {langFilter}
              <button onClick={() => setLangFilter('all')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
            </span>
          )}
          {onlyFavorites && (
            <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Favorites Only
              <button onClick={() => setOnlyFavorites(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
            </span>
          )}
          {search && (
            <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Query: "{search}"
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>
            Showing {filteredRepositories.length} of {repositories.length}
          </span>
          <button
            onClick={handleClearFilters}
            style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: 11, marginLeft: 'auto' }}
          >
            Reset all
          </button>
        </div>
      )}

      {/* 5. Main Content: Grid / List Cards */}
      <div className="main-scroll-view" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ maxWidth: 1500, margin: '0 auto', width: '100%' }}>
          {filteredRepositories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
                <FolderGit2 size={38} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                {hasActiveFilters ? 'No matching repositories' : 'Your repository hub is empty'}
              </div>
              <div style={{ fontSize: 13, marginBottom: 24, color: 'var(--text-secondary)' }}>
                {hasActiveFilters
                  ? 'Try adjusting your search query or status filter.'
                  : 'Import your first GitHub repository by URL to track metadata, notes, and statuses.'}
              </div>
              {hasActiveFilters ? (
                <button
                  className="btn"
                  onClick={handleClearFilters}
                  style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 20px' }}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  className="btn"
                  onClick={() => setShowAddModal(true)}
                  style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, padding: '10px 22px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={14} /> Add First Repository
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredRepositories.map(repo => (
                <RepositoryCard
                  key={repo.id}
                  repo={repo}
                  viewMode="list"
                  onSelect={(r) => setActiveRepoId(r.id)}
                  onToggleFavorite={toggleFavoriteRepo}
                  onUpdateStatus={updateRepoStatus}
                />
              ))}
            </div>
          ) : (
            <div className="responsive-bento-grid">
              {filteredRepositories.map(repo => (
                <RepositoryCard
                  key={repo.id}
                  repo={repo}
                  viewMode="grid"
                  onSelect={(r) => setActiveRepoId(r.id)}
                  onToggleFavorite={toggleFavoriteRepo}
                  onUpdateStatus={updateRepoStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Detail Inspector */}
      {activeRepo && (
        <>
          <div
            className="detail-backdrop"
            onClick={() => setActiveRepoId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 490,
              animation: 'modalFadeIn 0.2s ease-out'
            }}
          />
          <ErrorBoundary onReset={() => setActiveRepoId(null)}>
            <RepositoryDetail
              key={activeRepo.id}
              repo={activeRepo}
              subCategories={subCategories}
              onClose={() => setActiveRepoId(null)}
              onUpdate={updateRepository}
              onDelete={deleteRepository}
              onRefresh={refreshRepoMetadata}
              onToggleFavorite={toggleFavoriteRepo}
              onTogglePin={togglePinRepo}
              requestConfirm={requestConfirm}
            />
          </ErrorBoundary>
        </>
      )}

      {/* Add Repository Modal */}
      <AddRepositoryModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddRepository}
        existingRepos={repositories}
        subCategories={subCategories}
      />

    </div>
  );
}
