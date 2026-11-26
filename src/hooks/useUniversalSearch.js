import { useMemo } from 'react';

/**
 * PromptKeeper 2.0 - Universal Cross-Resource Search Hook
 * Fast multi-field scoring search over AI Prompts, GitHub Repositories, and Website Bookmarks.
 */
export function useUniversalSearch({
  prompts = [],
  repositories = [],
  bookmarks = [],
  collections = [],
  query = '',
  filterType = 'all', // 'all' | 'prompt' | 'repo' | 'bookmark' | 'list'
  collectionFilter = 'all'
}) {
  return useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    const hasQuery = q.length > 0;

    // Filter prompts by collection if specified
    const eligiblePrompts = prompts.filter(p => {
      if (collectionFilter === 'all') return true;
      const colls = Array.isArray(p.collections) ? p.collections : [];
      return p.category === collectionFilter || colls.includes(collectionFilter);
    });

    // Filter repositories by collection if specified
    const eligibleRepos = repositories.filter(r => {
      if (collectionFilter === 'all') return true;
      const colls = Array.isArray(r.collections) ? r.collections : [];
      return colls.includes(collectionFilter);
    });

    // Filter bookmarks by collection if specified
    const eligibleBookmarks = bookmarks.filter(b => {
      if (collectionFilter === 'all') return true;
      const colls = Array.isArray(b.collections) ? b.collections : [];
      return b.category === collectionFilter || colls.includes(collectionFilter);
    });

    const eligibleCollections = (collections || []).filter(c => c !== 'All');

    let scoredPrompts = [];
    let scoredRepos = [];
    let scoredBookmarks = [];
    let scoredCollections = [];

    if (!hasQuery) {
      // No query: return recently used / newest items
      if (filterType === 'all' || filterType === 'prompt') {
        scoredPrompts = eligiblePrompts.map(p => ({
          id: p.id,
          type: 'prompt',
          title: p.title,
          subtitle: p.body,
          badge: p.model || 'General',
          tags: p.tags || [],
          score: 1,
          raw: p
        }));
      }

      if (filterType === 'all' || filterType === 'repo') {
        scoredRepos = eligibleRepos.map(r => ({
          id: r.id,
          type: 'repo',
          title: r.fullName,
          subtitle: r.description || '',
          badge: r.primaryLanguage || 'Unknown',
          tags: r.tags || [],
          score: 1,
          raw: r
        }));
      }

      if (filterType === 'all' || filterType === 'bookmark') {
        scoredBookmarks = eligibleBookmarks.map(b => ({
          id: b.id,
          type: 'bookmark',
          title: b.title || b.domain,
          subtitle: b.url,
          badge: b.domain || b.category || 'Bookmark',
          tags: b.tags || [],
          score: 1,
          raw: b
        }));
      }

      if (filterType === 'all' || filterType === 'list') {
        scoredCollections = eligibleCollections.map(c => ({
          id: c,
          type: 'list',
          title: c,
          subtitle: `Saved List / Project`,
          badge: 'List',
          tags: [],
          score: 1,
          raw: c
        }));
      }

      const combined = [...scoredPrompts, ...scoredRepos, ...scoredBookmarks, ...scoredCollections];
      return {
        results: combined,
        promptResults: scoredPrompts,
        repoResults: scoredRepos,
        bookmarkResults: scoredBookmarks,
        listResults: scoredCollections,
        totalCount: combined.length
      };
    }

    // Split search query into terms
    const terms = q.split(/\s+/).filter(Boolean);

    // Score Prompts
    if (filterType === 'all' || filterType === 'prompt') {
      eligiblePrompts.forEach(p => {
        let score = 0;
        const titleLower = (p.title || '').toLowerCase();
        const bodyLower = (p.body || '').toLowerCase();
        const notesLower = (p.notes || '').toLowerCase();
        const modelLower = (p.model || '').toLowerCase();
        const tagsLower = (p.tags || []).map(t => t.toLowerCase());
        const catLower = (p.category || '').toLowerCase();

        terms.forEach(term => {
          if (titleLower === term) score += 20;
          else if (titleLower.includes(term)) score += 10;

          if (tagsLower.includes(term)) score += 8;
          else if (tagsLower.some(t => t.includes(term))) score += 4;

          if (catLower === term) score += 6;
          else if (catLower.includes(term)) score += 3;

          if (modelLower.includes(term)) score += 4;
          if (notesLower.includes(term)) score += 5;
          if (bodyLower.includes(term)) score += 3;
        });

        if (score > 0) {
          scoredPrompts.push({
            id: p.id,
            type: 'prompt',
            title: p.title,
            subtitle: p.body,
            badge: p.model || 'General',
            tags: p.tags || [],
            score,
            raw: p
          });
        }
      });
      scoredPrompts.sort((a, b) => b.score - a.score);
    }

    // Score Repositories
    if (filterType === 'all' || filterType === 'repo') {
      eligibleRepos.forEach(r => {
        let score = 0;
        const fullLower = (r.fullName || '').toLowerCase();
        const nameLower = (r.name || '').toLowerCase();
        const ownerLower = (r.owner || '').toLowerCase();
        const descLower = (r.description || '').toLowerCase();
        const langLower = (r.primaryLanguage || '').toLowerCase();
        const notesLower = (r.personalNotes || '').toLowerCase();
        const urlLower = (r.canonicalUrl || '').toLowerCase();
        const topicsLower = (r.topics || []).map(t => t.toLowerCase());
        const tagsLower = (r.tags || []).map(t => t.toLowerCase());

        terms.forEach(term => {
          if (nameLower === term || fullLower === term) score += 20;
          else if (fullLower.includes(term)) score += 10;

          if (ownerLower === term) score += 8;
          else if (ownerLower.includes(term)) score += 4;

          if (topicsLower.includes(term) || tagsLower.includes(term)) score += 7;
          else if (topicsLower.some(t => t.includes(term)) || tagsLower.some(t => t.includes(term))) score += 3;

          if (langLower === term) score += 6;
          else if (langLower.includes(term)) score += 3;

          if (urlLower.includes(term)) score += 6;
          if (notesLower.includes(term)) score += 5;
          if (descLower.includes(term)) score += 2;
        });

        if (score > 0) {
          scoredRepos.push({
            id: r.id,
            type: 'repo',
            title: r.fullName,
            subtitle: r.description || '',
            badge: r.primaryLanguage || 'Unknown',
            tags: r.tags || [],
            score,
            raw: r
          });
        }
      });
      scoredRepos.sort((a, b) => b.score - a.score);
    }

    // Score Bookmarks
    if (filterType === 'all' || filterType === 'bookmark') {
      eligibleBookmarks.forEach(b => {
        let score = 0;
        const titleLower = (b.title || '').toLowerCase();
        const urlLower = (b.url || '').toLowerCase();
        const domainLower = (b.domain || '').toLowerCase();
        const notesLower = (b.personalNotes || b.notes || '').toLowerCase();
        const catLower = (b.category || '').toLowerCase();
        const statusLower = (b.status || '').toLowerCase();
        const tagsLower = (b.tags || []).map(t => t.toLowerCase());

        terms.forEach(term => {
          if (titleLower === term || domainLower === term) score += 20;
          else if (titleLower.includes(term)) score += 12;
          else if (domainLower.includes(term)) score += 10;

          if (urlLower.includes(term)) score += 8;

          if (tagsLower.includes(term)) score += 8;
          else if (tagsLower.some(t => t.includes(term))) score += 4;

          if (catLower === term) score += 6;
          else if (catLower.includes(term)) score += 3;

          if (notesLower.includes(term)) score += 5;
          if (statusLower.includes(term)) score += 2;
        });

        if (score > 0) {
          scoredBookmarks.push({
            id: b.id,
            type: 'bookmark',
            title: b.title || b.domain,
            subtitle: b.url,
            badge: b.domain || b.category || 'Bookmark',
            tags: b.tags || [],
            score,
            raw: b
          });
        }
      });
      scoredBookmarks.sort((a, b) => b.score - a.score);
    }

    // Score Saved Lists
    if (filterType === 'all' || filterType === 'list') {
      eligibleCollections.forEach(c => {
        let score = 0;
        const nameLower = c.toLowerCase();
        terms.forEach(term => {
          if (nameLower === term) score += 20;
          else if (nameLower.includes(term)) score += 10;
        });

        if (score > 0) {
          scoredCollections.push({
            id: c,
            type: 'list',
            title: c,
            subtitle: `Saved List / Project`,
            badge: 'List',
            tags: [],
            score,
            raw: c
          });
        }
      });
      scoredCollections.sort((a, b) => b.score - a.score);
    }

    // Combine and sort by score
    const combined = [
      ...scoredPrompts,
      ...scoredRepos,
      ...scoredBookmarks,
      ...scoredCollections
    ].sort((a, b) => b.score - a.score);

    return {
      results: combined,
      promptResults: scoredPrompts,
      repoResults: scoredRepos,
      bookmarkResults: scoredBookmarks,
      listResults: scoredCollections,
      totalCount: combined.length
    };
  }, [prompts, repositories, bookmarks, collections, query, filterType, collectionFilter]);
}
