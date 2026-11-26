import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { 
  normalizeBookmarkUrl, 
  extractDomain, 
  getFaviconUrl, 
  inferTitleFromUrl 
} from '../src/services/bookmarkService.js';
import { validateBookmark } from '../src/utils/validation.js';
import { useBookmarks } from '../src/hooks/useBookmarks.js';
import { useUniversalSearch } from '../src/hooks/useUniversalSearch.js';
import { db } from '../src/db/index.js';
import { bookmarkRepository } from '../src/db/repository.js';

describe('Website Bookmark & Markdown Notes System', () => {
  beforeEach(async () => {
    localStorage.clear();
    vi.restoreAllMocks();
    if (db.bookmarks) {
      await db.bookmarks.clear();
    }
  });

  describe('bookmarkService utility suite', () => {
    it('normalizes bookmark URLs and strips tracking parameters', () => {
      const dirtyUrl = 'https://react.dev/reference/react?utm_source=twitter&utm_medium=social&utm_campaign=launch#hooks';
      const clean = normalizeBookmarkUrl(dirtyUrl);
      expect(clean).toBe('https://react.dev/reference/react#hooks');
      expect(clean).not.toContain('utm_source');
      expect(clean).not.toContain('utm_medium');
    });

    it('prepends https:// when protocol is missing', () => {
      expect(normalizeBookmarkUrl('developer.mozilla.org/en-US/')).toBe('https://developer.mozilla.org/en-US/');
      expect(normalizeBookmarkUrl('http://localhost:5173')).toBe('http://localhost:5173/');
    });

    it('returns null for empty or invalid target URLs', () => {
      expect(normalizeBookmarkUrl('')).toBeNull();
      expect(normalizeBookmarkUrl('   ')).toBeNull();
      expect(normalizeBookmarkUrl('not-a-valid-domain-format')).toBeNull();
    });

    it('extracts root domain correctly without www prefix', () => {
      expect(extractDomain('https://www.github.com/facebook/react')).toBe('github.com');
      expect(extractDomain('https://tailwindcss.com/docs')).toBe('tailwindcss.com');
      expect(extractDomain('https://api.subdomain.example.co.uk/path')).toBe('api.subdomain.example.co.uk');
      expect(extractDomain('invalid')).toBe('invalid');
    });

    it('generates high-resolution Google Favicon service URL', () => {
      const fav = getFaviconUrl('https://developer.mozilla.org');
      expect(fav).toContain('https://www.google.com/s2/favicons');
      expect(fav).toContain('developer.mozilla.org');
      expect(fav).toContain('sz=32');
    });

    it('infers human-readable bookmark titles from domain and path', () => {
      expect(inferTitleFromUrl('https://react.dev/blog/react-19')).toBe('React 19');
      expect(inferTitleFromUrl('https://tailwindcss.com')).toBe('Tailwindcss');
      expect(inferTitleFromUrl('https://news.ycombinator.com/')).toBe('News.ycombinator');
    });
  });

  describe('validateBookmark data schema verification', () => {
    it('validates and sanitizes well-formed bookmark inputs', () => {
      const input = {
        url: 'https://vite.dev',
        title: 'Vite Next Generation Frontend Tooling',
        category: 'Development',
        status: 'reading',
        tags: ['Build', 'Vite', '#Fast'],
        notes: '# Vite Setup\nRun `npm create vite@latest` to start.',
        isFavorite: true,
        isPinned: false
      };

      const result = validateBookmark(input);
      expect(result.isValid).toBe(true);
      expect(result.sanitized.url).toBe('https://vite.dev');
      expect(result.sanitized.domain).toBe('vite.dev');
      expect(result.sanitized.status).toBe('reading');
      expect(result.sanitized.tags).toEqual(['build', 'vite', 'fast']);
      expect(result.sanitized.notes).toContain('# Vite Setup');
      expect(result.sanitized.isFavorite).toBe(true);
    });

    it('rejects bookmarks missing mandatory URL or invalid status', () => {
      const noUrl = validateBookmark({ title: 'Just a title' });
      expect(noUrl.isValid).toBe(false);
      expect(noUrl.errors[0]).toContain('Bookmark URL is required');

      const badStatus = validateBookmark({ url: 'https://example.com', status: 'invalid_status_xyz' });
      expect(badStatus.isValid).toBe(false);
      expect(badStatus.errors[0]).toContain('Invalid bookmark status');
    });

    it('sanitizes script tags from notes and title to prevent XSS', () => {
      const malicious = {
        url: 'https://safe-domain.com',
        title: '<script>alert("hack")</script>Safe Title',
        notes: '<script>window.location="bad.com"</script>Valid markdown evaluation note'
      };

      const result = validateBookmark(malicious);
      expect(result.isValid).toBe(true);
      expect(result.sanitized.title).not.toContain('<script>');
      expect(result.sanitized.notes).not.toContain('<script>');
    });
  });

  describe('useBookmarks domain hook lifecycle', () => {
    it('seeds starter bookmarks on fresh install', () => {
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.bookmarks.length).toBeGreaterThanOrEqual(3);
      expect(result.current.bookmarks.some(b => b.domain === 'developer.mozilla.org')).toBe(true);
      expect(result.current.bookmarks.some(b => b.domain === 'tailwindcss.com')).toBe(true);
    });

    it('adds a new bookmark and prevents duplicates', () => {
      const { result } = renderHook(() => useBookmarks());

      let addRes;
      act(() => {
        addRes = result.current.addBookmark({
          url: 'https://supabase.com/docs',
          title: 'Supabase Documentation',
          category: 'Development',
          status: 'reference',
          tags: ['database', 'postgres'],
          notes: 'Great Postgres backend as a service'
        });
      });

      expect(addRes.success).toBe(true);
      expect(addRes.bookmark.domain).toBe('supabase.com');
      expect(addRes.bookmark.status).toBe('reference');
      expect(result.current.bookmarks.some(b => b.url === 'https://supabase.com/docs')).toBe(true);

      // Attempt duplicate addition
      let dupRes;
      act(() => {
        dupRes = result.current.addBookmark({
          url: 'https://supabase.com/docs',
          title: 'Duplicate Supabase'
        });
      });

      expect(dupRes.success).toBe(false);
      expect(dupRes.duplicate).toBe(true);
    });

    it('updates bookmark notes, title, and status', () => {
      const { result } = renderHook(() => useBookmarks());
      const target = result.current.bookmarks[0];

      act(() => {
        result.current.updateBookmark(target.id, {
          title: 'Updated Title',
          notes: '## Evaluation Summary\nHigh performance verified.',
          status: 'tools'
        });
      });

      const updated = result.current.bookmarks.find(b => b.id === target.id);
      expect(updated.title).toBe('Updated Title');
      expect(updated.notes).toContain('## Evaluation Summary');
      expect(updated.status).toBe('tools');
    });

    it('toggles favorite and pin states', () => {
      const { result } = renderHook(() => useBookmarks());
      const target = result.current.bookmarks[0];
      const initialFav = !!target.isFavorite;
      const initialPin = !!target.isPinned;

      act(() => {
        result.current.toggleFavoriteBookmark(target.id);
        result.current.togglePinBookmark(target.id);
      });

      const toggled = result.current.bookmarks.find(b => b.id === target.id);
      expect(toggled.isFavorite).toBe(!initialFav);
      expect(toggled.isPinned).toBe(!initialPin);
    });

    it('deletes bookmark accurately', () => {
      const { result } = renderHook(() => useBookmarks());
      const target = result.current.bookmarks[0];

      act(() => {
        result.current.deleteBookmark(target.id);
      });

      expect(result.current.bookmarks.some(b => b.id === target.id)).toBe(false);
    });

    it('computes status and category counts accurately', () => {
      const { result } = renderHook(() => useBookmarks());
      expect(result.current.statusCounts.all).toBe(result.current.bookmarks.length);
      expect(typeof result.current.categoryCounts).toBe('object');
    });
  });

  describe('Universal Cross-Resource Search with Bookmarks', () => {
    it('indexes and matches bookmarks by title, domain, tags, and notes', () => {
      const mockBookmarks = [
        {
          id: 'bm-1',
          title: 'Docker Documentation',
          url: 'https://docs.docker.com',
          domain: 'docs.docker.com',
          category: 'Tools & Utilities',
          tags: ['devops', 'containers'],
          notes: 'Containerization handbook and Dockerfile best practices'
        },
        {
          id: 'bm-2',
          title: 'Anthropic Prompt Engineering',
          url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering',
          domain: 'docs.anthropic.com',
          category: 'AI & ML',
          tags: ['llm', 'claude', 'prompts'],
          notes: 'XML tagging and chain-of-thought system prompts'
        }
      ];

      const { result: searchByTag } = renderHook(() => useUniversalSearch({
        bookmarks: mockBookmarks,
        query: 'containers'
      }));

      expect(searchByTag.current.bookmarkResults.length).toBe(1);
      expect(searchByTag.current.bookmarkResults[0].id).toBe('bm-1');

      const { result: searchByNotes } = renderHook(() => useUniversalSearch({
        bookmarks: mockBookmarks,
        query: 'chain-of-thought'
      }));

      expect(searchByNotes.current.bookmarkResults.length).toBe(1);
      expect(searchByNotes.current.bookmarkResults[0].id).toBe('bm-2');
    });
  });

  describe('bookmarkRepository IndexedDB persistence', () => {
    it('performs Dexie IndexedDB CRUD correctly', async () => {
      const saved = await bookmarkRepository.save({
        url: 'https://deno.com',
        title: 'Deno Runtime',
        domain: 'deno.com',
        category: 'Development',
        status: 'reference',
        tags: ['typescript', 'rust'],
        notes: 'Modern JavaScript and TypeScript runtime'
      });

      expect(saved.id).toBeDefined();
      expect(saved.domain).toBe('deno.com');

      const all = await bookmarkRepository.getAll();
      expect(all.some(b => b.id === saved.id)).toBe(true);

      await bookmarkRepository.delete(saved.id);
      const afterDelete = await bookmarkRepository.getAll();
      expect(afterDelete.some(b => b.id === saved.id)).toBe(false);
    });
  });
});
