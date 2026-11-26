import { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Star, 
  LayoutGrid, 
  List, 
  Plus, 
  Bookmark,
  FileText,
  Layers,
  Edit2,
  Check
} from 'lucide-react';
import BookmarkCard from './BookmarkCard.jsx';
import BookmarkDetail from './BookmarkDetail.jsx';
import AddBookmarkModal from './AddBookmarkModal.jsx';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import { 
  BOOKMARK_SORT_OPTIONS 
} from '../../constants/bookmarkConstants.js';

export default function BookmarkHub({
  bookmarks = [],
  addBookmark,
  updateBookmark,
  deleteBookmark,
  toggleFavoriteBookmark,
  togglePinBookmark,
  updateBookmarkStatus,
  _statusCounts = {},
  _categoryCounts = {},
  viewMode = 'grid',
  setViewMode,
  requestConfirm,
  toast
}) {
  const [activeBookmarkId, setActiveBookmarkId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyWithNotes, setOnlyWithNotes] = useState(false);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('saved_desc');

  // Sub-Category State & Persistence
  const [subCategories, setSubCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('pk_bookmark_subcategories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.warn('Failed to load bookmark subcategories:', err);
    }
    const found = new Set();
    bookmarks.forEach(b => {
      const cat = b.subCategory || b.category;
      if (cat) found.add(cat);
    });
    if (found.size > 0) return Array.from(found);
    return ['Documentation', 'Developer Tools', 'Research & Articles', 'Inspirations'];
  });

  const [isAddingSubCat, setIsAddingSubCat] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState('');
  const [editingSubCat, setEditingSubCat] = useState(null);
  const [editSubCatName, setEditSubCatName] = useState('');

  const persistSubCategories = (next) => {
    setSubCategories(next);
    try {
      localStorage.setItem('pk_bookmark_subcategories', JSON.stringify(next));
    } catch (err) {
      console.warn('Failed to persist bookmark subcategories:', err);
    }
  };

  const getBookmarkSubCategory = (b) => {
    return b.subCategory || b.category || '';
  };

  // Sub-category counts
  const subCategoryCounts = useMemo(() => {
    const counts = { all: bookmarks.length };
    bookmarks.forEach(b => {
      const cat = getBookmarkSubCategory(b);
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return counts;
  }, [bookmarks]);

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

  const handleStartRename = (catName, e) => {
    e.stopPropagation();
    setEditingSubCat(catName);
    setEditSubCatName(catName);
  };

  const handleSaveRename = (oldName) => {
    const trimmed = editSubCatName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingSubCat(null);
      return;
    }
    const next = subCategories.map(c => c === oldName ? trimmed : c);
    persistSubCategories(next);

    // Sync across bookmarks
    bookmarks.forEach(b => {
      if (getBookmarkSubCategory(b) === oldName) {
        updateBookmark(b.id, { subCategory: trimmed, category: trimmed });
      }
    });

    if (subCategoryFilter === oldName) {
      setSubCategoryFilter(trimmed);
    }
    setEditingSubCat(null);
    if (toast) toast(`Renamed "${oldName}" to "${trimmed}"`);
  };

  const handleDeleteSubCategory = (catToDelete, e) => {
    e.stopPropagation();
    const count = subCategoryCounts[catToDelete] || 0;
    requestConfirm({
      title: 'DELETE SUB-CATEGORY',
      message: `Delete sub-category "${catToDelete}"? ${count > 0 ? `${count} bookmarks in this sub-category will become uncategorized.` : ''}`,
      onConfirm: () => {
        const next = subCategories.filter(c => c !== catToDelete);
        persistSubCategories(next);

        // Unlink bookmarks
        bookmarks.forEach(b => {
          if (getBookmarkSubCategory(b) === catToDelete) {
            updateBookmark(b.id, { subCategory: '', category: '' });
          }
        });

        if (subCategoryFilter === catToDelete) {
          setSubCategoryFilter('all');
        }
        if (toast) toast(`Deleted sub-category "${catToDelete}"`);
      }
    });
  };

  // Currently inspected bookmark
  const activeBookmark = useMemo(() => {
    return bookmarks.find(b => b.id === activeBookmarkId) || null;
  }, [bookmarks, activeBookmarkId]);

  // Filtered & Sorted bookmarks
  const filteredBookmarks = useMemo(() => {
    return bookmarks
      .filter(bm => {
        // Sub-Category filter
        if (subCategoryFilter !== 'all') {
          const cat = getBookmarkSubCategory(bm);
          if (cat !== subCategoryFilter) return false;
        }

        // Favorites filter
        if (onlyFavorites && !bm.isFavorite) {
          return false;
        }

        // Notes filter
        if (onlyWithNotes && (!bm.notes || !bm.notes.trim()) && (!bm.personalNotes || !bm.personalNotes.trim())) {
          return false;
        }

        // Search query
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = (bm.title || '').toLowerCase().includes(q);
          const matchUrl = (bm.url || '').toLowerCase().includes(q);
          const matchDomain = (bm.domain || '').toLowerCase().includes(q);
          const matchCategory = (bm.category || bm.subCategory || '').toLowerCase().includes(q);
          const matchNotes = (bm.notes || bm.personalNotes || '').toLowerCase().includes(q);
          const matchTags = (bm.tags || []).some(t => t.toLowerCase().includes(q));
          if (!matchTitle && !matchUrl && !matchDomain && !matchCategory && !matchNotes && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // Pinned bookmarks always come first
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        switch (sort) {
          case 'title_asc':
            return (a.title || a.domain || '').localeCompare(b.title || b.domain || '');
          case 'domain_asc':
            return (a.domain || '').localeCompare(b.domain || '');
          case 'saved_asc':
            return (a.createdAt || 0) - (b.createdAt || 0);
          case 'saved_desc':
          default:
            return (b.createdAt || 0) - (a.createdAt || 0);
        }
      });
  }, [bookmarks, subCategoryFilter, onlyFavorites, onlyWithNotes, search, sort]);

  const hasActiveFilters = subCategoryFilter !== 'all' || onlyFavorites || onlyWithNotes || search.trim() !== '';

  const handleClearFilters = () => {
    setSubCategoryFilter('all');
    setOnlyFavorites(false);
    setOnlyWithNotes(false);
    setSearch('');
  };

  const handleAddBookmark = (bookmarkData) => {
    const res = addBookmark(bookmarkData);
    if (res.success) {
      if (toast) toast(`Saved "${res.bookmark.title || res.bookmark.domain}" to Bookmarks!`);
      setActiveBookmarkId(res.bookmark.id);
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
            background: 'var(--accent)',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            flexShrink: 0
          }}>
            <Bookmark size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
                Website Bookmarks
              </h1>
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--accent)',
                background: 'var(--accent-muted)',
                border: '1px solid var(--accent-glow)',
                padding: '1px 8px',
                borderRadius: 12
              }}>
                {bookmarks.length} {bookmarks.length === 1 ? 'Bookmark' : 'Bookmarks'}
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="btn"
            onClick={() => setShowAddModal(true)}
            style={{
              background: 'var(--accent)',
              color: '#000',
              fontWeight: 700,
              fontSize: 12,
              padding: '8px 16px',
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
            <span>Add Bookmark</span>
          </button>
        </div>
      </div>

      {/* 2. Bento Editable Sub-Category Rail */}
      <div style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '8px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {/* All Bookmarks Pill */}
        <button
          onClick={() => setSubCategoryFilter('all')}
          style={{
            background: subCategoryFilter === 'all' ? 'var(--accent)' : 'var(--btn-subtle-bg)',
            border: subCategoryFilter === 'all' ? '1px solid var(--accent)' : '1px solid var(--btn-subtle-border)',
            color: subCategoryFilter === 'all' ? '#0b0b0c' : 'var(--text-secondary)',
            fontWeight: 700,
            fontSize: 12,
            padding: '6px 14px',
            borderRadius: 12,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            fontFamily: 'Geist, sans-serif'
          }}
        >
          <Layers size={13} style={{ color: subCategoryFilter === 'all' ? '#0b0b0c' : 'var(--text-tertiary)' }} />
          <span>All Bookmarks</span>
          <span style={{
            fontSize: 10,
            background: subCategoryFilter === 'all' ? 'rgba(0, 0, 0, 0.25)' : 'var(--bg-surface-active)',
            color: subCategoryFilter === 'all' ? '#000' : 'var(--text-secondary)',
            padding: '1px 6px',
            borderRadius: 8,
            fontWeight: 800,
            fontFamily: 'Geist Mono, monospace'
          }}>
            {bookmarks.length}
          </span>
        </button>

        {/* User Sub-Categories */}
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
                  background: 'var(--bg-surface-hover)',
                  border: '1px solid var(--accent)',
                  borderRadius: 12,
                  padding: '2px 8px',
                  gap: 4
                }}
              >
                <input
                  type="text"
                  autoFocus
                  value={editSubCatName}
                  onChange={e => setEditSubCatName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveRename(cat);
                    if (e.key === 'Escape') setEditingSubCat(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-primary)',
                    fontSize: 12,
                    fontWeight: 600,
                    outline: 'none',
                    width: 120,
                    fontFamily: 'Geist, sans-serif'
                  }}
                />
                <button
                  onClick={() => handleSaveRename(cat)}
                  style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  title="Save name"
                >
                  <Check size={11} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => setEditingSubCat(null)}
                  style={{ background: 'transparent', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                  title="Cancel"
                >
                  <X size={12} />
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
                background: isActive ? 'var(--accent)' : 'var(--btn-subtle-bg)',
                border: isActive ? '1px solid var(--accent)' : '1px solid var(--btn-subtle-border)',
                borderRadius: 12,
                padding: '4px 6px 4px 12px',
                gap: 6,
                transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
            >
              <button
                onClick={() => setSubCategoryFilter(cat)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#0b0b0c' : 'var(--text-primary)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: 0,
                  whiteSpace: 'nowrap',
                  fontFamily: 'Geist, sans-serif'
                }}
              >
                <span>{cat}</span>
                <span style={{
                  fontSize: 10,
                  background: isActive ? 'rgba(0, 0, 0, 0.25)' : 'var(--bg-surface-active)',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  padding: '1px 6px',
                  borderRadius: 8,
                  fontWeight: 800,
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {count}
                </span>
              </button>

              {/* Inline Rename */}
              <button
                onClick={(e) => handleStartRename(cat, e)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '2px 3px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={`Rename "${cat}"`}
              >
                <Edit2 size={10} />
              </button>

              {/* Delete Sub-Category */}
              <button
                onClick={(e) => handleDeleteSubCategory(cat, e)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.3)',
                  cursor: 'pointer',
                  padding: '2px 3px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={`Delete "${cat}"`}
              >
                <X size={11} />
              </button>
            </div>
          );
        })}

        {/* Inline Add Sub-Category Pill */}
        {isAddingSubCat ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid var(--accent)',
            borderRadius: 12,
            padding: '2px 8px',
            gap: 4
          }}>
            <input
              type="text"
              autoFocus
              value={newSubCatName}
              onChange={e => setNewSubCatName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSubCategory();
                if (e.key === 'Escape') setIsAddingSubCat(false);
              }}
              placeholder="Sub-category name..."
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 12,
                fontWeight: 600,
                outline: 'none',
                width: 140,
                fontFamily: 'Geist, sans-serif'
              }}
            />
            <button
              onClick={handleAddSubCategory}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              title="Add"
            >
              <Check size={11} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setIsAddingSubCat(false)}
              style={{ background: 'transparent', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingSubCat(true)}
            style={{
              background: 'transparent',
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              color: 'var(--text-tertiary)',
              fontSize: 11,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              fontFamily: 'Geist, sans-serif'
            }}
          >
            <Plus size={12} />
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
            placeholder="Search bookmarks by title, URL, tags, notes..."
            style={{
              width: '100%',
              height: 36,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0 32px 0 34px',
              fontSize: 12,
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'Geist, sans-serif'
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

        {/* Right: Controls & Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Favorites filter toggle */}
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            style={{
              height: 36,
              padding: '0 12px',
              background: onlyFavorites ? 'rgba(232, 255, 31, 0.12)' : 'var(--bg-surface)',
              border: onlyFavorites ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: onlyFavorites ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: onlyFavorites ? 700 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}
            title="Filter favorite bookmarks"
          >
            <Star size={13} fill={onlyFavorites ? 'currentColor' : 'none'} />
            <span>Favorites</span>
          </button>

          {/* With notes filter toggle */}
          <button
            onClick={() => setOnlyWithNotes(!onlyWithNotes)}
            style={{
              height: 36,
              padding: '0 12px',
              background: onlyWithNotes ? 'var(--accent-muted)' : 'var(--bg-surface)',
              border: onlyWithNotes ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: onlyWithNotes ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: onlyWithNotes ? 700 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap'
            }}
            title="Filter bookmarks with personal Markdown notes"
          >
            <FileText size={13} />
            <span>With Notes</span>
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
              width: 'auto',
              fontFamily: 'Geist, sans-serif'
            }}
          >
            {BOOKMARK_SORT_OPTIONS.map(opt => (
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
                  padding: '0 8px',
                  borderRadius: 'var(--radius-xs)',
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
                  padding: '0 8px',
                  borderRadius: 'var(--radius-xs)',
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
          {onlyFavorites && (
            <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Favorites Only
              <button onClick={() => setOnlyFavorites(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
            </span>
          )}
          {onlyWithNotes && (
            <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              With Notes
              <button onClick={() => setOnlyWithNotes(false)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
            </span>
          )}
          {search && (
            <span style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              Query: "{search}"
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}><X size={12} /></button>
            </span>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8 }}>
            Showing {filteredBookmarks.length} of {bookmarks.length}
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
          {filteredBookmarks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3, display: 'flex', justifyContent: 'center' }}>
                <Bookmark size={38} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>
                {hasActiveFilters ? 'No matching bookmarks' : 'Your bookmark hub is empty'}
              </div>
              <div style={{ fontSize: 13, marginBottom: 24, color: 'var(--text-secondary)' }}>
                {hasActiveFilters
                  ? 'Try adjusting your search query, status, or sub-category filter.'
                  : 'Save technical websites, articles, or documentation to annotate with personal notes.'}
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
                  <Plus size={14} /> Add First Bookmark
                </button>
              )}
            </div>
          ) : viewMode === 'list' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredBookmarks.map(bm => (
                <BookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  viewMode="list"
                  onSelect={(b) => setActiveBookmarkId(b.id)}
                  onToggleFavorite={toggleFavoriteBookmark}
                  onTogglePin={togglePinBookmark}
                />
              ))}
            </div>
          ) : (
            <div className="responsive-bento-grid">
              {filteredBookmarks.map(bm => (
                <BookmarkCard
                  key={bm.id}
                  bookmark={bm}
                  viewMode="grid"
                  onSelect={(b) => setActiveBookmarkId(b.id)}
                  onToggleFavorite={toggleFavoriteBookmark}
                  onTogglePin={togglePinBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Detail Inspector */}
      {activeBookmark && (
        <>
          <div
            className="detail-backdrop"
            onClick={() => setActiveBookmarkId(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 490,
              animation: 'modalFadeIn 0.2s ease-out'
            }}
          />
          <ErrorBoundary onReset={() => setActiveBookmarkId(null)}>
            <BookmarkDetail
              key={activeBookmark.id}
              bookmark={activeBookmark}
              subCategories={subCategories}
              onClose={() => setActiveBookmarkId(null)}
              onUpdate={updateBookmark}
              onDelete={deleteBookmark}
              onToggleFavorite={toggleFavoriteBookmark}
              onTogglePin={togglePinBookmark}
              onUpdateStatus={updateBookmarkStatus}
              requestConfirm={requestConfirm}
            />
          </ErrorBoundary>
        </>
      )}

      {/* Add Bookmark Modal */}
      <AddBookmarkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddBookmark}
        subCategories={subCategories}
        existingBookmarks={bookmarks}
      />

    </div>
  );
}
