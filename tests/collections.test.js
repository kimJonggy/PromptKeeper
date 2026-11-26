import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCollections } from '../src/hooks/useCollections.js';

describe('useCollections unified hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('loads default collections and stats', () => {
    const mockPrompts = [
      { id: 'p1', title: 'Prompt 1', category: 'Coding', collections: ['Coding'] },
      { id: 'p2', title: 'Prompt 2', category: 'Creative', collections: ['Creative'] }
    ];
    const mockRepos = [
      { id: 'r1', fullName: 'facebook/react', collections: ['Coding'] }
    ];

    const { result } = renderHook(() => useCollections({
      prompts: mockPrompts,
      repositories: mockRepos
    }));

    expect(result.current.collections.includes('Coding')).toBe(true);
    expect(result.current.collectionStats.All.total).toBe(3);
    expect(result.current.collectionStats.Coding.prompts).toBe(1);
    expect(result.current.collectionStats.Coding.repos).toBe(1);
    expect(result.current.collectionStats.Coding.total).toBe(2);
  });

  it('adds a new collection', () => {
    const { result } = renderHook(() => useCollections({}));

    act(() => {
      result.current.addCollection('AI Infrastructure', '#10b981');
    });

    expect(result.current.collections.includes('AI Infrastructure')).toBe(true);
    expect(result.current.collectionColors['AI Infrastructure']).toBe('#10b981');
  });

  it('renames a collection across prompts and repositories', () => {
    let prompts = [
      { id: 'p1', title: 'P1', category: 'Coding', collections: ['Coding', 'Web'] }
    ];
    let repos = [
      { id: 'r1', fullName: 'vuejs/core', collections: ['Coding'] }
    ];

    const setPrompts = vi.fn(updater => {
      prompts = typeof updater === 'function' ? updater(prompts) : updater;
    });
    const setRepositories = vi.fn(updater => {
      repos = typeof updater === 'function' ? updater(repos) : updater;
    });

    const { result } = renderHook(() => useCollections({
      prompts,
      setPrompts,
      repositories: repos,
      setRepositories
    }));

    act(() => {
      result.current.renameCollection('Coding', 'Engineering');
    });

    expect(result.current.collections.includes('Engineering')).toBe(true);
    expect(result.current.collections.includes('Coding')).toBe(false);
    expect(prompts[0].category).toBe('Engineering');
    expect(prompts[0].collections).toContain('Engineering');
    expect(prompts[0].collections).not.toContain('Coding');
    expect(repos[0].collections).toContain('Engineering');
    expect(repos[0].collections).not.toContain('Coding');
  });

  it('deletes a collection and cleans membership without destroying resources', () => {
    let prompts = [
      { id: 'p1', title: 'P1', category: 'Creative', collections: ['Creative'] }
    ];
    let repos = [
      { id: 'r1', fullName: 'some/repo', collections: ['Creative', 'Design'] }
    ];

    const setPrompts = vi.fn(updater => {
      prompts = typeof updater === 'function' ? updater(prompts) : updater;
    });
    const setRepositories = vi.fn(updater => {
      repos = typeof updater === 'function' ? updater(repos) : updater;
    });

    const { result } = renderHook(() => useCollections({
      prompts,
      setPrompts,
      repositories: repos,
      setRepositories
    }));

    act(() => {
      result.current.deleteCollection('Creative');
    });

    expect(result.current.collections.includes('Creative')).toBe(false);
    expect(prompts[0].category).toBe('All');
    expect(prompts[0].collections).not.toContain('Creative');
    expect(repos[0].collections).toEqual(['Design']);
  });

  it('assigns and removes resources from multiple collections', () => {
    let prompts = [{ id: 'p1', title: 'P1', category: 'Coding', collections: ['Coding'] }];
    let repos = [{ id: 'r1', fullName: 'adnan911/promptKeeper', collections: [] }];

    const setPrompts = vi.fn(updater => {
      prompts = typeof updater === 'function' ? updater(prompts) : updater;
    });
    const setRepositories = vi.fn(updater => {
      repos = typeof updater === 'function' ? updater(repos) : updater;
    });

    const { result } = renderHook(() => useCollections({
      prompts,
      setPrompts,
      repositories: repos,
      setRepositories
    }));

    act(() => {
      result.current.assignResourceToCollection('prompt', 'p1', 'AI Stack');
      result.current.assignResourceToCollection('repo', 'r1', 'AI Stack');
    });

    expect(prompts[0].collections).toContain('AI Stack');
    expect(repos[0].collections).toContain('AI Stack');

    act(() => {
      result.current.removeResourceFromCollection('prompt', 'p1', 'AI Stack');
    });

    expect(prompts[0].collections).not.toContain('AI Stack');
    expect(repos[0].collections).toContain('AI Stack');
  });
});
