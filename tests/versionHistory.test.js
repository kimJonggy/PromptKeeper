import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrompts } from '../src/hooks/usePrompts.js';

describe('Prompt Version History', () => {
  it('automatically creates a version snapshot when an existing prompt is edited', () => {
    const { result } = renderHook(() => usePrompts({ toast: vi.fn() }));

    // Create prompt
    act(() => {
      result.current.savePrompt({
        id: 'p-versioned',
        title: 'Initial Title',
        body: 'Initial Body Content',
        model: 'Claude'
      });
    });

    const initial = result.current.prompts.find(p => p.id === 'p-versioned');
    expect(initial.title).toBe('Initial Title');
    expect(initial.versions || []).toEqual([]);

    // Update prompt
    act(() => {
      result.current.savePrompt({
        id: 'p-versioned',
        title: 'Updated Title',
        body: 'Updated Body Content With New Instructions',
        model: 'Claude'
      });
    });

    const updated = result.current.prompts.find(p => p.id === 'p-versioned');
    expect(updated.title).toBe('Updated Title');
    expect(updated.versions.length).toBe(1);
    expect(updated.versions[0].title).toBe('Initial Title');
    expect(updated.versions[0].body).toBe('Initial Body Content');
  });

  it('restores a prior version snapshot and archives current state', () => {
    const { result } = renderHook(() => usePrompts({ toast: vi.fn() }));

    act(() => {
      result.current.savePrompt({
        id: 'p-restore-test',
        title: 'V1 Title',
        body: 'V1 Content',
        model: 'Claude'
      });
    });

    act(() => {
      result.current.savePrompt({
        id: 'p-restore-test',
        title: 'V2 Title',
        body: 'V2 Content',
        model: 'GPT-4'
      });
    });

    const withHistory = result.current.prompts.find(p => p.id === 'p-restore-test');
    expect(withHistory.versions.length).toBe(1);
    const v1Snapshot = withHistory.versions[0];

    // Restore v1
    act(() => {
      result.current.restorePromptVersion('p-restore-test', v1Snapshot);
    });

    const restored = result.current.prompts.find(p => p.id === 'p-restore-test');
    expect(restored.title).toBe('V1 Title');
    expect(restored.body).toBe('V1 Content');
    // Check that v2 was snapshotted as the latest history entry
    expect(restored.versions.length).toBe(2);
    expect(restored.versions[0].title).toBe('V2 Title');
  });
});

