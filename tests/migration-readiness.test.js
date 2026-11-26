import { describe, it, expect } from 'vitest';
import { SEED_PROMPTS, CATEGORIES, MODEL_COLORS } from '../src/data.js';
import { validatePrompt, validateVault } from '../src/utils/validation.js';

describe('Migration Readiness & Baseline Integrity', () => {
  it('validates all SEED_PROMPTS conform to prompt data rules', () => {
    expect(SEED_PROMPTS).toHaveLength(10);

    SEED_PROMPTS.forEach(seed => {
      const { isValid, errors, sanitized } = validatePrompt(seed);
      expect(isValid, `Seed prompt "${seed.title}" failed validation: ${errors.join(', ')}`).toBe(true);
      expect(sanitized.title.length).toBeGreaterThan(0);
      expect(sanitized.body.length).toBeGreaterThan(0);
      expect(Array.isArray(sanitized.tags)).toBe(true);
      expect(sanitized.tags.length).toBeGreaterThan(0);
      expect(CATEGORIES).toContain(sanitized.category);
      expect(sanitized.uses).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(sanitized.history)).toBe(true);
    });
  });

  it('validates full vault export and re-import preserves all fields', () => {
    const exportedVault = {
      prompts: SEED_PROMPTS,
      categories: CATEGORIES,
      categoryColors: { Coding: '#AB6937', System: '#1E4445' },
      modelColors: MODEL_COLORS,
    };

    const serialized = JSON.stringify(exportedVault);
    const parsed = JSON.parse(serialized);
    const { isValid, validPrompts, categories, categoryColors, modelColors, isFullVault } = validateVault(parsed);

    expect(isValid).toBe(true);
    expect(isFullVault).toBe(true);
    expect(validPrompts).toHaveLength(SEED_PROMPTS.length);
    expect(categories).toEqual(CATEGORIES);
    expect(categoryColors).toHaveProperty('Coding', '#AB6937');
    expect(modelColors).toHaveProperty('Claude', '#AB6937');

    // Confirm prompt fields survive round-trip
    const first = validPrompts[0];
    expect(first.title).toBe(SEED_PROMPTS[0].title);
    expect(first.body).toBe(SEED_PROMPTS[0].body);
    expect(first.fav).toBe(SEED_PROMPTS[0].fav);
    expect(first.notes).toBe(SEED_PROMPTS[0].notes);
  });

  it('preserves attached image structures during validation', () => {
    const promptWithImage = {
      id: 'img-prompt-1',
      title: 'UI Generation Prompt',
      body: 'Generate a layout like attached image',
      thumbnail: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
      images: ['data:image/jpeg;base64,/9j/4AAQSkZJRg...'],
    };

    const { sanitized, isValid } = validatePrompt(promptWithImage);
    expect(isValid).toBe(true);
    expect(sanitized.thumbnail).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRg...');
    expect(sanitized.images).toHaveLength(1);
    expect(sanitized.images[0]).toBe('data:image/jpeg;base64,/9j/4AAQSkZJRg...');
  });

  it('preserves variableConfig types and options during validation', () => {
    const promptWithConfig = {
      id: 'cfg-prompt-1',
      title: 'Configured Prompt',
      body: 'Send {{email}} to {{role}}',
      variableConfig: {
        types: { email: 'email', role: 'select' },
        options: { role: ['Admin', 'Editor', 'Viewer'] },
      },
    };

    const { sanitized, isValid } = validatePrompt(promptWithConfig);
    expect(isValid).toBe(true);
    expect(sanitized.variableConfig.types.email).toBe('email');
    expect(sanitized.variableConfig.types.role).toBe('select');
    expect(sanitized.variableConfig.options.role).toEqual(['Admin', 'Editor', 'Viewer']);
  });
});

