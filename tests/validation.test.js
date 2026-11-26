import { describe, it, expect } from 'vitest';
import { validatePrompt, validateVault, sanitizeTag } from '../src/utils/validation.js';

describe('Validation Utilities', () => {
  describe('sanitizeTag', () => {
    it('normalizes uppercase and spaces into kebab-case', () => {
      expect(sanitizeTag(' Machine Learning ')).toBe('machine-learning');
      expect(sanitizeTag('REACT')).toBe('react');
      expect(sanitizeTag('')).toBe('');
      expect(sanitizeTag(null)).toBe('');
    });
  });

  describe('validatePrompt', () => {
    it('validates a complete prompt record', () => {
      const raw = {
        id: 101,
        title: 'Refactor Specialist',
        body: 'Refactor {{code}} for readability',
        tags: ['code', 'Refactor'],
        category: 'Coding',
        model: 'Claude',
        uses: 5,
        fav: true,
      };

      const result = validatePrompt(raw);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized.title).toBe('Refactor Specialist');
      expect(result.sanitized.tags).toEqual(['code', 'refactor']);
      expect(result.sanitized.uses).toBe(5);
      expect(result.sanitized.fav).toBe(true);
    });

    it('rejects prompts with missing title or empty body', () => {
      const noTitle = { body: 'Some body' };
      const res1 = validatePrompt(noTitle);
      expect(res1.isValid).toBe(false);
      expect(res1.errors).toContain('Prompt title is required and cannot be empty');

      const noBody = { title: 'Some Title', body: '' };
      const res2 = validatePrompt(noBody);
      expect(res2.isValid).toBe(false);
      expect(res2.errors).toContain('Prompt body is required');
    });

    it('generates safe fallback defaults for missing optional fields', () => {
      const minimal = {
        title: 'Minimal Prompt',
        body: 'Prompt body without extras'
      };

      const { sanitized, isValid } = validatePrompt(minimal);
      expect(isValid).toBe(true);
      expect(sanitized.id).toBeDefined();
      expect(sanitized.category).toBe('Coding');
      expect(sanitized.model).toBe('Claude');
      expect(sanitized.uses).toBe(0);
      expect(sanitized.fav).toBe(false);
      expect(sanitized.tags).toEqual([]);
      expect(sanitized.history).toEqual([]);
      expect(sanitized.notes).toBe('');
      expect(sanitized.images).toEqual([]);
      expect(sanitized.thumbnail).toBeNull();
    });

    it('handles non-object inputs gracefully', () => {
      expect(validatePrompt(null).isValid).toBe(false);
      expect(validatePrompt('invalid').isValid).toBe(false);
      expect(validatePrompt([]).isValid).toBe(false);
    });
  });

  describe('validateVault', () => {
    it('validates a legacy array of prompts', () => {
      const rawArray = [
        { title: 'Prompt A', body: 'Body A' },
        { title: 'Prompt B', body: 'Body B' }
      ];

      const res = validateVault(rawArray);
      expect(res.isValid).toBe(true);
      expect(res.isFullVault).toBe(false);
      expect(res.validPrompts).toHaveLength(2);
    });

    it('validates a full vault object with categories and modelColors', () => {
      const fullVault = {
        prompts: [{ title: 'Prompt A', body: 'Body A' }],
        categories: ['Coding', 'Creative'],
        categoryColors: { Coding: '#ff0000' },
        modelColors: { Claude: '#AB6937' }
      };

      const res = validateVault(fullVault);
      expect(res.isValid).toBe(true);
      expect(res.isFullVault).toBe(true);
      expect(res.validPrompts).toHaveLength(1);
      expect(res.categories).toEqual(['Coding', 'Creative']);
    });

    it('filters out invalid prompts while retaining valid ones', () => {
      const mixed = [
        { title: 'Valid 1', body: 'Body 1' },
        { title: '', body: 'Invalid (no title)' },
        { title: 'Valid 2', body: 'Body 2' }
      ];

      const res = validateVault(mixed);
      expect(res.isValid).toBe(true);
      expect(res.validPrompts).toHaveLength(2);
      expect(res.errors).toHaveLength(1);
    });
  });
});

