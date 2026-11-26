import { describe, it, expect } from 'vitest';
import { analyzeRepoCapabilities } from '../src/utils/repoAnalyzer.js';

describe('repoAnalyzer - analyzeRepoCapabilities', () => {
  it('analyzes karakeep-app/karakeep correctly with bookmarking, AI, and search capabilities', () => {
    const karakeepRepo = {
      name: 'karakeep',
      fullName: 'karakeep-app/karakeep',
      description: 'A self-hostable bookmark-everything app (links, notes and images) with AI-based automatic tagging and full text search',
      primaryLanguage: 'TypeScript',
      topics: ['bookmark-manager', 'bookmarks', 'nextjs', 'react-native']
    };

    const analysis = analyzeRepoCapabilities(karakeepRepo);
    expect(analysis).not.toBeNull();
    expect(analysis.summary).toContain('bookmark-everything app');
    expect(analysis.capabilities.some(c => c.toLowerCase().includes('bookmark'))).toBe(true);
    expect(analysis.capabilities.some(c => c.toLowerCase().includes('ai'))).toBe(true);
    expect(analysis.capabilities.some(c => c.toLowerCase().includes('search'))).toBe(true);
    expect(analysis.capabilities.some(c => c.toLowerCase().includes('self-host'))).toBe(true);
    expect(analysis.useCases.length).toBeGreaterThan(0);
    expect(analysis.detectedTech).toContain('TypeScript');
  });

  it('handles repos with minimal description cleanly without throwing', () => {
    const minimalRepo = {
      name: 'simple-tool',
      fullName: 'dev/simple-tool',
      description: '',
      primaryLanguage: 'Go',
      topics: ['cli']
    };

    const analysis = analyzeRepoCapabilities(minimalRepo);
    expect(analysis).not.toBeNull();
    expect(analysis.capabilities.length).toBeGreaterThan(0);
    expect(analysis.useCases.length).toBeGreaterThan(0);
  });

  it('returns null for null or undefined input', () => {
    expect(analyzeRepoCapabilities(null)).toBeNull();
    expect(analyzeRepoCapabilities(undefined)).toBeNull();
  });
});

