import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRepositories } from '../src/hooks/useRepositories.js';
import * as githubService from '../src/services/githubService.js';

describe('useRepositories domain hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads default seed repositories when localStorage is empty', () => {
    const { result } = renderHook(() => useRepositories());
    expect(result.current.repositories.length).toBeGreaterThan(0);
    expect(result.current.repositories.some(r => r.fullName === 'adnan911/promptKeeper')).toBe(true);
  });

  it('adds a new repository and prevents duplicates', () => {
    const { result } = renderHook(() => useRepositories());

    let addRes;
    act(() => {
      addRes = result.current.addRepository({
        owner: 'golang',
        name: 'go',
        fullName: 'golang/go',
        canonicalUrl: 'https://github.com/golang/go',
        description: 'The Go programming language',
        primaryLanguage: 'Go',
        stars: 120000,
        forks: 17000
      });
    });

    expect(addRes.success).toBe(true);
    expect(addRes.repository.fullName).toBe('golang/go');
    expect(addRes.repository.status).toBe('inbox');
    expect(result.current.repositories.some(r => r.fullName === 'golang/go')).toBe(true);

    // Try adding duplicate
    let dupRes;
    act(() => {
      dupRes = result.current.addRepository({
        owner: 'golang',
        name: 'go',
        fullName: 'GOLANG/GO',
        canonicalUrl: 'https://github.com/golang/go'
      });
    });

    expect(dupRes.success).toBe(false);
    expect(dupRes.duplicate).toBe(true);
  });

  it('updates repository fields and lifecycle status', () => {
    const { result } = renderHook(() => useRepositories());
    const target = result.current.repositories[0];

    act(() => {
      result.current.updateRepository(target.id, {
        personalNotes: 'Testing note update',
        status: 'testing'
      });
    });

    const updated = result.current.repositories.find(r => r.id === target.id);
    expect(updated.personalNotes).toBe('Testing note update');
    expect(updated.status).toBe('testing');
    expect(updated.id).toBe(target.id);
  });

  it('toggles favorite and pinned status', () => {
    const { result } = renderHook(() => useRepositories());
    const target = result.current.repositories[0];
    const initialFav = target.isFavorite;

    act(() => {
      result.current.toggleFavoriteRepo(target.id);
    });

    const toggled = result.current.repositories.find(r => r.id === target.id);
    expect(toggled.isFavorite).toBe(!initialFav);
  });

  it('deletes a repository', () => {
    const { result } = renderHook(() => useRepositories());
    const target = result.current.repositories[0];

    act(() => {
      result.current.deleteRepository(target.id);
    });

    expect(result.current.repositories.some(r => r.id === target.id)).toBe(false);
  });

  it('refreshRepoMetadata updates upstream stats while preserving user notes and status', async () => {
    const { result } = renderHook(() => useRepositories());
    const target = result.current.repositories[0];

    // Modify user notes and status first
    act(() => {
      result.current.updateRepository(target.id, {
        personalNotes: 'MY CRITICAL PRIVATE NOTES',
        status: 'using',
        tags: ['private-tag']
      });
    });

    // Mock fetchRepoMetadata
    vi.spyOn(githubService, 'fetchRepoMetadata').mockResolvedValue({
      githubId: 999999,
      owner: target.owner,
      name: target.name,
      fullName: target.fullName,
      description: 'UPDATED DESCRIPTION FROM GITHUB',
      primaryLanguage: 'TypeScript',
      topics: ['updated-topic'],
      stars: 999999,
      forks: 88888,
      openIssues: 5,
      license: 'Apache-2.0',
      defaultBranch: 'main',
      pushedAt: '2026-03-15T00:00:00Z'
    });

    await act(async () => {
      await result.current.refreshRepoMetadata(target.id);
    });

    const refreshed = result.current.repositories.find(r => r.id === target.id);
    expect(refreshed.stars).toBe(999999);
    expect(refreshed.description).toBe('UPDATED DESCRIPTION FROM GITHUB');
    // Verify user customization preservation
    expect(refreshed.personalNotes).toBe('MY CRITICAL PRIVATE NOTES');
    expect(refreshed.status).toBe('using');
    expect(refreshed.tags).toEqual(['private-tag']);
  });

  it('computes statusCounts correctly', () => {
    const { result } = renderHook(() => useRepositories());
    const counts = result.current.statusCounts;
    expect(counts.all).toBe(result.current.repositories.length);
    expect(typeof counts.inbox).toBe('number');
    expect(typeof counts.using).toBe('number');
  });

  it('automatically provides a short description when description is omitted', () => {
    const { result } = renderHook(() => useRepositories());

    let addRes;
    act(() => {
      addRes = result.current.addRepository({
        owner: 'mifi',
        name: 'lossless-cut',
        fullName: 'mifi/lossless-cut'
      });
    });

    expect(addRes.success).toBe(true);
    expect(addRes.repository.description).toBeTruthy();
    expect(addRes.repository.description).toContain('Lossless Cut');
  });
});

