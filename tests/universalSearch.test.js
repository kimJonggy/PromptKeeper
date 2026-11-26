import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useUniversalSearch } from '../src/hooks/useUniversalSearch.js';

describe('useUniversalSearch', () => {
  const mockPrompts = [
    {
      id: 'p1',
      title: 'React Component Generator',
      body: 'Generate a typed modern React component using Tailwind CSS.',
      tags: ['react', 'frontend', 'ui'],
      model: 'Claude 3.5 Sonnet',
      category: 'Coding'
    },
    {
      id: 'p2',
      title: 'PostgreSQL Migration Planner',
      body: 'Write idempotent SQL migrations for relational schemas.',
      tags: ['database', 'sql', 'backend'],
      model: 'GPT-4o',
      category: 'Coding'
    }
  ];

  const mockRepos = [
    {
      id: 'r1',
      fullName: 'facebook/react',
      owner: 'facebook',
      name: 'react',
      description: 'The library for web and native user interfaces.',
      primaryLanguage: 'JavaScript',
      topics: ['react', 'ui', 'frontend'],
      personalNotes: 'React 19 reference architecture'
    },
    {
      id: 'r2',
      fullName: 'prisma/prisma',
      owner: 'prisma',
      name: 'prisma',
      description: 'Next-generation ORM for Node.js & TypeScript',
      primaryLanguage: 'TypeScript',
      topics: ['database', 'orm', 'sql'],
      personalNotes: 'Database tooling'
    }
  ];

  it('searches across both prompts and repositories simultaneously', () => {
    const { result } = renderHook(() => useUniversalSearch({
      prompts: mockPrompts,
      repositories: mockRepos,
      query: 'react'
    }));

    expect(result.current.totalCount).toBe(2);
    expect(result.current.promptResults.length).toBe(1);
    expect(result.current.repoResults.length).toBe(1);
    expect(result.current.promptResults[0].title).toBe('React Component Generator');
    expect(result.current.repoResults[0].title).toBe('facebook/react');
  });

  it('ranks title and name matches above body and description matches', () => {
    const { result } = renderHook(() => useUniversalSearch({
      prompts: mockPrompts,
      repositories: mockRepos,
      query: 'database'
    }));

    // Both p2 and r2 match 'database', but check ranking
    expect(result.current.totalCount).toBe(2);
    expect(result.current.results.some(r => r.id === 'p2')).toBe(true);
    expect(result.current.results.some(r => r.id === 'r2')).toBe(true);
  });

  it('filters results by type', () => {
    const { result: promptOnly } = renderHook(() => useUniversalSearch({
      prompts: mockPrompts,
      repositories: mockRepos,
      query: 'database',
      filterType: 'prompt'
    }));

    expect(promptOnly.current.results.every(r => r.type === 'prompt')).toBe(true);
    expect(promptOnly.current.results.length).toBe(1);

    const { result: repoOnly } = renderHook(() => useUniversalSearch({
      prompts: mockPrompts,
      repositories: mockRepos,
      query: 'database',
      filterType: 'repo'
    }));

    expect(repoOnly.current.results.every(r => r.type === 'repo')).toBe(true);
    expect(repoOnly.current.results.length).toBe(1);
  });

  it('returns all items when query is empty', () => {
    const { result } = renderHook(() => useUniversalSearch({
      prompts: mockPrompts,
      repositories: mockRepos,
      query: ''
    }));

    expect(result.current.totalCount).toBe(4);
  });
});

