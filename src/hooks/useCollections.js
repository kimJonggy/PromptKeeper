import { useCallback, useMemo } from 'react';
import { useLocalStorage } from '../hooks.js';
import { DEFAULT_CAT_COLORS } from '../data.js';

export function useCollections({
  toast,
  prompts = [],
  setPrompts,
  repositories = [],
  setRepositories,
  bookmarks = [],
  setBookmarks,
  activeCollection = 'All',
  setActiveCollection
}) {
  const [categories, setCategories] = useLocalStorage('pk_categories', [
    'All', 'Coding', 'Creative', 'Business', 'System', 'Research', 'Personal'
  ]);
  const [categoryColors, setCategoryColors] = useLocalStorage('pk_cat_colors', DEFAULT_CAT_COLORS);

  /**
   * Adds a new collection.
   */
  const addCollection = useCallback((name, color) => {
    if (!name || typeof name !== 'string') return;
    const clean = name.trim();
    if (!clean || categories.includes(clean)) return;

    setCategories(prev => [...prev, clean]);
    setCategoryColors(prev => ({
      ...prev,
      [clean]: color || DEFAULT_CAT_COLORS['All'] || 'linear-gradient(135deg, #f0a532, #d97706)'
    }));
    if (toast) toast(`Collection "${clean}" created`, 'violet');
  }, [categories, setCategories, setCategoryColors, toast]);

  /**
   * Renames a collection across categories, categoryColors, prompts, repositories, and bookmarks.
   */
  const renameCollection = useCallback((oldName, newName) => {
    if (!newName || typeof newName !== 'string') return;
    const clean = newName.trim();
    if (!clean || categories.includes(clean) || oldName === 'All') return;

    // Update categories list
    setCategories(prev => prev.map(c => c === oldName ? clean : c));

    // Update colors map
    setCategoryColors(prev => {
      const next = { ...prev, [clean]: prev[oldName] || DEFAULT_CAT_COLORS['All'] };
      delete next[oldName];
      return next;
    });

    // Update prompts (both legacy category field and collections array)
    if (setPrompts) {
      setPrompts(prev => prev.map(p => {
        let updatedCategory = p.category;
        if (p.category === oldName) updatedCategory = clean;

        const currentCollections = Array.isArray(p.collections) ? p.collections : (p.category ? [p.category] : []);
        const updatedCollections = currentCollections.map(c => c === oldName ? clean : c);

        return {
          ...p,
          category: updatedCategory,
          collections: updatedCollections
        };
      }));
    }

    // Update repositories collections array
    if (setRepositories) {
      setRepositories(prev => prev.map(r => {
        const currentCollections = Array.isArray(r.collections) ? r.collections : [];
        if (!currentCollections.includes(oldName)) return r;
        return {
          ...r,
          collections: currentCollections.map(c => c === oldName ? clean : c)
        };
      }));
    }

    // Update bookmarks category and collections array
    if (setBookmarks) {
      setBookmarks(prev => prev.map(b => {
        let updatedCategory = b.category;
        if (b.category === oldName) updatedCategory = clean;
        const currentCollections = Array.isArray(b.collections) ? b.collections : [];
        const updatedCollections = currentCollections.map(c => c === oldName ? clean : c);
        return {
          ...b,
          category: updatedCategory,
          collections: updatedCollections
        };
      }));
    }

    if (activeCollection === oldName && setActiveCollection) {
      setActiveCollection(clean);
    }

    if (toast) toast(`Collection renamed to "${clean}"`, 'violet');
  }, [categories, activeCollection, setCategories, setCategoryColors, setPrompts, setRepositories, setBookmarks, setActiveCollection, toast]);

  /**
   * Deletes a collection and safely removes it from prompts, repositories, and bookmarks.
   */
  const deleteCollection = useCallback((name) => {
    if (name === 'All') return;

    setCategories(prev => prev.filter(c => c !== name));

    // Clean from prompts
    if (setPrompts) {
      setPrompts(prev => prev.map(p => {
        let updatedCategory = p.category;
        if (p.category === name) updatedCategory = 'All';

        const currentCollections = Array.isArray(p.collections) ? p.collections : [];
        const updatedCollections = currentCollections.filter(c => c !== name);

        return {
          ...p,
          category: updatedCategory,
          collections: updatedCollections
        };
      }));
    }

    // Clean from repositories
    if (setRepositories) {
      setRepositories(prev => prev.map(r => {
        const currentCollections = Array.isArray(r.collections) ? r.collections : [];
        if (!currentCollections.includes(name)) return r;
        return {
          ...r,
          collections: currentCollections.filter(c => c !== name)
        };
      }));
    }

    // Clean from bookmarks
    if (setBookmarks) {
      setBookmarks(prev => prev.map(b => {
        let updatedCategory = b.category;
        if (b.category === name) updatedCategory = 'General';
        const currentCollections = Array.isArray(b.collections) ? b.collections : [];
        const updatedCollections = currentCollections.filter(c => c !== name);
        return {
          ...b,
          category: updatedCategory,
          collections: updatedCollections
        };
      }));
    }

    if (activeCollection === name && setActiveCollection) {
      setActiveCollection('All');
    }

    if (toast) toast(`Collection "${name}" deleted`, 'danger');
  }, [activeCollection, setCategories, setPrompts, setRepositories, setBookmarks, setActiveCollection, toast]);

  /**
   * Reorders collections.
   */
  const reorderCollection = useCallback((index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= categories.length || categories[index] === 'All' || categories[newIdx] === 'All') return;
    setCategories(prev => {
      const next = [...prev];
      [next[index], next[newIdx]] = [next[newIdx], next[index]];
      return next;
    });
  }, [categories, setCategories]);

  /**
   * Assigns a resource (prompt, repo, or bookmark) to a collection.
   */
  const assignResourceToCollection = useCallback((type, id, collectionName) => {
    if (type === 'prompt' && setPrompts) {
      setPrompts(prev => prev.map(p => {
        if (p.id !== id) return p;
        const current = Array.isArray(p.collections) ? p.collections : (p.category ? [p.category] : []);
        if (current.includes(collectionName)) return p;
        return { ...p, collections: [...current, collectionName] };
      }));
    } else if (type === 'repo' && setRepositories) {
      setRepositories(prev => prev.map(r => {
        if (r.id !== id) return r;
        const current = Array.isArray(r.collections) ? r.collections : [];
        if (current.includes(collectionName)) return r;
        return { ...r, collections: [...current, collectionName] };
      }));
    } else if (type === 'bookmark' && setBookmarks) {
      setBookmarks(prev => prev.map(b => {
        if (b.id !== id) return b;
        const current = Array.isArray(b.collections) ? b.collections : (b.category ? [b.category] : []);
        if (current.includes(collectionName)) return b;
        return { ...b, collections: [...current, collectionName] };
      }));
    }
  }, [setPrompts, setRepositories, setBookmarks]);

  /**
   * Removes a resource (prompt, repo, or bookmark) from a collection.
   */
  const removeResourceFromCollection = useCallback((type, id, collectionName) => {
    if (type === 'prompt' && setPrompts) {
      setPrompts(prev => prev.map(p => {
        if (p.id !== id) return p;
        const current = Array.isArray(p.collections) ? p.collections : (p.category ? [p.category] : []);
        return {
          ...p,
          category: p.category === collectionName ? 'All' : p.category,
          collections: current.filter(c => c !== collectionName)
        };
      }));
    } else if (type === 'repo' && setRepositories) {
      setRepositories(prev => prev.map(r => {
        if (r.id !== id) return r;
        const current = Array.isArray(r.collections) ? r.collections : [];
        return {
          ...r,
          collections: current.filter(c => c !== collectionName)
        };
      }));
    } else if (type === 'bookmark' && setBookmarks) {
      setBookmarks(prev => prev.map(b => {
        if (b.id !== id) return b;
        const current = Array.isArray(b.collections) ? b.collections : [];
        return {
          ...b,
          category: b.category === collectionName ? 'General' : b.category,
          collections: current.filter(c => c !== collectionName)
        };
      }));
    }
  }, [setPrompts, setRepositories, setBookmarks]);

  /**
   * Computes counts for each collection across prompts, repositories, and bookmarks.
   */
  const collectionStats = useMemo(() => {
    const stats = {
      All: { 
        prompts: prompts.length, 
        repos: repositories.length, 
        bookmarks: bookmarks.length, 
        total: prompts.length + repositories.length + bookmarks.length 
      }
    };

    categories.forEach(c => {
      if (c === 'All') return;
      stats[c] = { prompts: 0, repos: 0, bookmarks: 0, total: 0 };
    });

    prompts.forEach(p => {
      const colls = new Set();
      if (p.category && p.category !== 'All') colls.add(p.category);
      if (Array.isArray(p.collections)) {
        p.collections.forEach(c => { if (c && c !== 'All') colls.add(c); });
      }
      colls.forEach(c => {
        if (!stats[c]) stats[c] = { prompts: 0, repos: 0, bookmarks: 0, total: 0 };
        stats[c].prompts++;
        stats[c].total++;
      });
    });

    repositories.forEach(r => {
      const colls = new Set();
      if (Array.isArray(r.collections)) {
        r.collections.forEach(c => { if (c && c !== 'All') colls.add(c); });
      }
      colls.forEach(c => {
        if (!stats[c]) stats[c] = { prompts: 0, repos: 0, bookmarks: 0, total: 0 };
        stats[c].repos++;
        stats[c].total++;
      });
    });

    bookmarks.forEach(b => {
      const colls = new Set();
      if (b.category && b.category !== 'All') colls.add(b.category);
      if (Array.isArray(b.collections)) {
        b.collections.forEach(c => { if (c && c !== 'All') colls.add(c); });
      }
      colls.forEach(c => {
        if (!stats[c]) stats[c] = { prompts: 0, repos: 0, bookmarks: 0, total: 0 };
        stats[c].bookmarks++;
        stats[c].total++;
      });
    });

    return stats;
  }, [categories, prompts, repositories, bookmarks]);

  return {
    collections: categories,
    setCollections: setCategories,
    collectionColors: categoryColors,
    setCollectionColors: setCategoryColors,
    addCollection,
    renameCollection,
    deleteCollection,
    reorderCollection,
    assignResourceToCollection,
    removeResourceFromCollection,
    collectionStats
  };
}
