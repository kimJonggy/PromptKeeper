import { useState, useEffect, useCallback, useMemo } from 'react';
import { bookmarkRepository } from '../db/repository.js';
import { isIndexedDBSupported } from '../db/index.js';
import { STORAGE_DRIVER_KEY } from '../db/migrationService.js';
import { validateBookmark } from '../utils/validation.js';
import { normalizeBookmarkUrl, extractDomain } from '../services/bookmarkService.js';

const STORAGE_KEY = 'pk_bookmarks';

export const DEFAULT_BOOKMARKS = [
  {
    id: 'b0000001-0000-4000-8000-000000000001',
    url: 'https://developer.mozilla.org/en-US/',
    title: 'MDN Web Docs',
    domain: 'developer.mozilla.org',
    description: 'The premier open resources and specifications for web developers.',
    personalNotes: '### MDN Web Architecture\nEssential reference for CSS Grid, Flexbox, Web APIs, and JavaScript primitives.',
    notes: '### MDN Web Architecture\nEssential reference for CSS Grid, Flexbox, Web APIs, and JavaScript primitives.',
    category: 'Documentation',
    tags: ['web', 'reference', 'javascript', 'css'],
    status: 'reference',
    isFavorite: true,
    isPinned: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now(),
    collections: ['Documentation'],
    linkedPromptIds: [],
    linkedRepoIds: []
  },
  {
    id: 'b0000001-0000-4000-8000-000000000002',
    url: 'https://tailwindcss.com/docs',
    title: 'Tailwind CSS Documentation',
    domain: 'tailwindcss.com',
    description: 'Rapidly build modern websites without ever leaving your HTML.',
    personalNotes: '### Styling Tokens\nUse utility-first tokens for typography and responsive design consistency.',
    notes: '### Styling Tokens\nUse utility-first tokens for typography and responsive design consistency.',
    category: 'Design & UX',
    tags: ['css', 'tailwind', 'styling', 'frontend'],
    status: 'tools',
    isFavorite: false,
    isPinned: false,
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now(),
    collections: ['Design & UX'],
    linkedPromptIds: [],
    linkedRepoIds: []
  },
  {
    id: 'b0000001-0000-4000-8000-000000000003',
    url: 'https://antigravity.google/',
    title: 'Google Antigravity Documentation',
    domain: 'antigravity.google',
    description: 'The autonomous developer agent and interactive knowledge platform by Google DeepMind.',
    personalNotes: '### Agent Architecture\n- Subagents, MCP tools, and dynamic workflows.\n- Best practices for local-first developer extensions.',
    notes: '### Agent Architecture\n- Subagents, MCP tools, and dynamic workflows.\n- Best practices for local-first developer extensions.',
    category: 'AI & ML',
    tags: ['ai', 'agentic', 'deepmind', 'google'],
    status: 'reading',
    isFavorite: false,
    isPinned: false,
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now(),
    collections: ['AI & ML'],
    linkedPromptIds: [],
    linkedRepoIds: ['88472910-0000-4000-8000-000000000001']
  }
];

export function useBookmarks({ toast } = {}) {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(b => validateBookmark(b).sanitized).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn('Failed to load bookmarks from localStorage:', e);
    }
    return DEFAULT_BOOKMARKS;
  });

  // Initial load from IndexedDB if active storage driver
  useEffect(() => {
    let isMounted = true;
    async function loadFromDb() {
      if (!isIndexedDBSupported()) return;
      const driver = localStorage.getItem(STORAGE_DRIVER_KEY);
      if (driver === 'localstorage') return;

      try {
        const dbBookmarks = await bookmarkRepository.getAll();
        if (isMounted && Array.isArray(dbBookmarks) && dbBookmarks.length > 0) {
          setBookmarks(dbBookmarks);
        } else if (isMounted && dbBookmarks.length === 0) {
          // Seed defaults into IndexedDB
          await bookmarkRepository.bulkPut(DEFAULT_BOOKMARKS);
        }
      } catch (err) {
        console.warn('Failed to load bookmarks from IndexedDB:', err);
      }
    }
    loadFromDb();
    return () => { isMounted = false; };
  }, []);

  // Dual-write persistence to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.warn('Failed to persist bookmarks to localStorage:', e);
    }
  }, [bookmarks]);

  /**
   * Adds a new website bookmark.
   */
  const addBookmark = useCallback((bookmarkData) => {
    if (!bookmarkData || !bookmarkData.url) {
      return { success: false, error: 'Bookmark URL is required' };
    }
    const rawUrl = bookmarkData.url || '';
    const cleanUrl = normalizeBookmarkUrl(rawUrl);
    if (!cleanUrl) {
      return { success: false, error: 'Please enter a valid website URL.' };
    }

    // Duplicate check
    const existing = bookmarks.find(b => b.url.toLowerCase().trim() === cleanUrl.toLowerCase().trim());
    if (existing) {
      return {
        success: false,
        duplicate: true,
        existing,
        error: `Bookmark with URL "${cleanUrl}" is already saved.`
      };
    }

    const domain = extractDomain(cleanUrl);
    const validated = validateBookmark({
      ...bookmarkData,
      url: cleanUrl,
      domain: domain || bookmarkData.domain || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    if (!validated.isValid) {
      return { success: false, error: validated.errors[0] || 'Invalid bookmark data.' };
    }

    const newBm = validated.sanitized;

    setBookmarks(prev => [newBm, ...prev]);

    if (isIndexedDBSupported()) {
      bookmarkRepository.save(newBm).catch(err => {
        console.warn('Failed to save bookmark to IndexedDB:', err);
      });
    }

    if (toast) toast(`Bookmark "${newBm.title}" saved`, 'emerald');
    return { success: true, bookmark: newBm };
  }, [bookmarks, toast]);

  /**
   * Updates an existing bookmark.
   */
  const updateBookmark = useCallback((id, updates) => {
    let updatedObj = null;

    setBookmarks(prev => prev.map(bm => {
      if (bm.id !== id) return bm;

      let nextUrl = bm.url;
      let nextDomain = bm.domain;
      if (updates.url && updates.url !== bm.url) {
        const clean = normalizeBookmarkUrl(updates.url);
        if (clean) {
          nextUrl = clean;
          nextDomain = extractDomain(clean);
        }
      }

      const nextNotes = updates.notes !== undefined 
        ? updates.notes 
        : (updates.personalNotes !== undefined ? updates.personalNotes : (bm.notes || bm.personalNotes || ''));

      const merged = {
        ...bm,
        ...updates,
        notes: nextNotes,
        personalNotes: nextNotes,
        url: nextUrl,
        domain: nextDomain,
        updatedAt: Date.now()
      };

      const validated = validateBookmark(merged);
      updatedObj = validated.isValid ? validated.sanitized : merged;
      return updatedObj;
    }));

    if (updatedObj && isIndexedDBSupported()) {
      bookmarkRepository.save(updatedObj).catch(err => {
        console.warn('Failed to update bookmark in IndexedDB:', err);
      });
    }

    return updatedObj;
  }, []);

  /**
   * Deletes a bookmark.
   */
  const deleteBookmark = useCallback((id) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));

    if (isIndexedDBSupported()) {
      bookmarkRepository.delete(id).catch(err => {
        console.warn('Failed to delete bookmark from IndexedDB:', err);
      });
    }

    if (toast) toast('Bookmark deleted', 'amber');
  }, [toast]);

  /**
   * Toggles bookmark favorite state.
   */
  const toggleFavoriteBookmark = useCallback((id) => {
    let nextFav = false;
    let target = null;

    setBookmarks(prev => prev.map(b => {
      if (b.id !== id) return b;
      nextFav = !b.isFavorite;
      target = { ...b, isFavorite: nextFav, updatedAt: Date.now() };
      return target;
    }));

    if (target && isIndexedDBSupported()) {
      bookmarkRepository.save(target).catch(err => {
        console.warn('Failed to update bookmark favorite in IndexedDB:', err);
      });
    }

    return nextFav;
  }, []);

  /**
   * Toggles bookmark pin state.
   */
  const togglePinBookmark = useCallback((id) => {
    let nextPinned = false;
    let target = null;

    setBookmarks(prev => prev.map(b => {
      if (b.id !== id) return b;
      nextPinned = !b.isPinned;
      target = { ...b, isPinned: nextPinned, updatedAt: Date.now() };
      return target;
    }));

    if (target && isIndexedDBSupported()) {
      bookmarkRepository.save(target).catch(err => {
        console.warn('Failed to update bookmark pin in IndexedDB:', err);
      });
    }

    return nextPinned;
  }, []);

  /**
   * Updates bookmark workflow status.
   */
  const updateBookmarkStatus = useCallback((id, newStatus) => {
    let updatedObj = null;

    setBookmarks(prev => prev.map(b => {
      if (b.id !== id) return b;
      updatedObj = { ...b, status: newStatus, updatedAt: Date.now() };
      return updatedObj;
    }));

    if (updatedObj && isIndexedDBSupported()) {
      bookmarkRepository.save(updatedObj).catch(err => {
        console.warn('Failed to update bookmark status in IndexedDB:', err);
      });
    }

    return updatedObj;
  }, []);

  /**
   * Computes counts by status for quick tab badges.
   */
  const statusCounts = useMemo(() => {
    const counts = { all: bookmarks.length };
    bookmarks.forEach(bm => {
      const st = bm.status || 'inbox';
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [bookmarks]);

  /**
   * Computes counts by category.
   */
  const categoryCounts = useMemo(() => {
    const counts = {};
    bookmarks.forEach(bm => {
      const cat = bm.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [bookmarks]);

  return {
    bookmarks,
    setBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    toggleFavoriteBookmark,
    togglePinBookmark,
    updateBookmarkStatus,
    statusCounts,
    categoryCounts
  };
}
