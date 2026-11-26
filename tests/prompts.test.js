import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrompts } from '../src/hooks/usePrompts.js';

describe('usePrompts hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('initializes with empty prompts when localStorage is blank', () => {
    const { result } = renderHook(() => usePrompts({}));
    expect(result.current.prompts).toEqual([]);
  });

  it('saves and updates a prompt', () => {
    const toast = vi.fn();
    const { result } = renderHook(() => usePrompts({ toast }));

    act(() => {
      result.current.savePrompt({
        id: 'test-1',
        title: 'Initial Title',
        body: 'Initial body with react keyword',
        category: 'Coding',
        model: 'Claude'
      });
    });

    expect(result.current.prompts).toHaveLength(1);
    expect(result.current.prompts[0].title).toBe('Initial Title');
    // Verify autoTag keyword detection
    expect(result.current.prompts[0].tags).toContain('react');

    // Update the prompt
    act(() => {
      result.current.savePrompt({
        id: 'test-1',
        title: 'Updated Title',
        body: 'Updated body with react keyword',
        category: 'Coding',
        model: 'Claude'
      });
    });

    expect(result.current.prompts).toHaveLength(1);
    expect(result.current.prompts[0].title).toBe('Updated Title');
  });

  it('deletes a prompt and unlinks successor prompts', () => {
    const toast = vi.fn();
    const { result } = renderHook(() => usePrompts({ toast }));

    act(() => {
      result.current.savePrompt({ id: 'p1', title: 'Step 1', body: 'First' });
      result.current.savePrompt({ id: 'p2', title: 'Step 2', body: 'Second', linkedPromptId: 'p1' });
    });

    expect(result.current.prompts).toHaveLength(2);

    act(() => {
      result.current.deletePrompt('p1');
    });

    expect(result.current.prompts).toHaveLength(1);
    expect(result.current.prompts[0].id).toBe('p2');
    expect(result.current.prompts[0].linkedPromptId).toBeNull();
  });

  it('toggles favorite status accurately', () => {
    const { result } = renderHook(() => usePrompts({}));

    act(() => {
      result.current.savePrompt({ id: 'p-fav', title: 'Fav Prompt', body: 'Body', fav: false });
    });

    expect(result.current.prompts[0].fav).toBe(false);

    act(() => {
      result.current.toggleFav('p-fav');
    });

    expect(result.current.prompts[0].fav).toBe(true);

    act(() => {
      result.current.toggleFav('p-fav');
    });

    expect(result.current.prompts[0].fav).toBe(false);
  });

  it('increments usage count and history when copyPrompt is invoked', async () => {
    const toast = vi.fn();
    const setCopySuccess = vi.fn();
    const { result } = renderHook(() => usePrompts({ toast, setCopySuccess }));

    act(() => {
      result.current.savePrompt({ id: 'p-copy', title: 'Copy Me', body: 'Content to copy', uses: 2 });
    });

    await act(async () => {
      await result.current.copyPrompt(result.current.prompts[0]);
    });

    expect(result.current.prompts[0].uses).toBe(3);
    expect(result.current.prompts[0].history).toContain(3);
    expect(setCopySuccess).toHaveBeenCalledWith({
      title: 'Copy Me',
      body: 'Content to copy'
    });
  });

  it('correctly reports import count and duplicate skipping', () => {
    const toast = vi.fn();
    const { result } = renderHook(() => usePrompts({ toast }));

    act(() => {
      result.current.savePrompt({ id: 'existing-1', title: 'Existing', body: 'Body' });
    });

    act(() => {
      result.current.importPrompts([
        { id: 'existing-1', title: 'Existing Duplicate', body: 'Body' },
        { id: 'new-1', title: 'New Prompt 1', body: 'Body 1' },
        { id: 'new-2', title: 'New Prompt 2', body: 'Body 2' }
      ]);
    });

    expect(result.current.prompts).toHaveLength(3);
    expect(toast).toHaveBeenCalledWith('Imported 2 prompts (1 duplicates skipped) ✓', 'cyan');
  });

  it('renames and removes tags across prompts', () => {
    const toast = vi.fn();
    const { result } = renderHook(() => usePrompts({ toast }));

    act(() => {
      result.current.savePrompt({ id: 'p1', title: 'P1', body: 'Body', tags: ['frontend', 'ui'] });
      result.current.savePrompt({ id: 'p2', title: 'P2', body: 'Body', tags: ['ui', 'backend'] });
    });

    act(() => {
      result.current.renameTag('ui', 'design-system');
    });

    const p1 = result.current.prompts.find(p => p.id === 'p1');
    const p2 = result.current.prompts.find(p => p.id === 'p2');
    expect(p1.tags).toEqual(['frontend', 'design-system']);
    expect(p2.tags).toEqual(['design-system', 'backend']);

    act(() => {
      result.current.deleteTag('backend');
    });

    const p2After = result.current.prompts.find(p => p.id === 'p2');
    expect(p2After.tags).toEqual(['design-system']);
  });
});
