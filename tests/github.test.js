import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  normalizeGitHubUrl, 
  validateRepoIdentifier, 
  fetchRepoMetadata,
  getGitHubToken,
  setGitHubToken
} from '../src/services/githubService.js';

describe('githubService - normalizeGitHubUrl', () => {
  it('normalizes standard https URL', () => {
    const res = normalizeGitHubUrl('https://github.com/facebook/react');
    expect(res).toEqual({
      owner: 'facebook',
      name: 'react',
      fullName: 'facebook/react',
      canonicalUrl: 'https://github.com/facebook/react'
    });
  });

  it('normalizes http and trailing slash', () => {
    const res = normalizeGitHubUrl('http://github.com/torvalds/linux/');
    expect(res).toEqual({
      owner: 'torvalds',
      name: 'linux',
      fullName: 'torvalds/linux',
      canonicalUrl: 'https://github.com/torvalds/linux'
    });
  });

  it('strips .git suffix and www subdomain', () => {
    const res = normalizeGitHubUrl('https://www.github.com/vuejs/core.git');
    expect(res).toEqual({
      owner: 'vuejs',
      name: 'core',
      fullName: 'vuejs/core',
      canonicalUrl: 'https://github.com/vuejs/core'
    });
  });

  it('handles SSH clone format', () => {
    const res = normalizeGitHubUrl('git@github.com:vercel/next.js.git');
    expect(res).toEqual({
      owner: 'vercel',
      name: 'next.js',
      fullName: 'vercel/next.js',
      canonicalUrl: 'https://github.com/vercel/next.js'
    });
  });

  it('extracts repository from deep path URL (issues/trees/pulls)', () => {
    const res = normalizeGitHubUrl('https://github.com/tailwindlabs/tailwindcss/tree/main/packages/oxide');
    expect(res).toEqual({
      owner: 'tailwindlabs',
      name: 'tailwindcss',
      fullName: 'tailwindlabs/tailwindcss',
      canonicalUrl: 'https://github.com/tailwindlabs/tailwindcss'
    });
  });

  it('handles plain owner/repo string without protocol', () => {
    const res = normalizeGitHubUrl('shadcn-ui/ui');
    expect(res).toEqual({
      owner: 'shadcn-ui',
      name: 'ui',
      fullName: 'shadcn-ui/ui',
      canonicalUrl: 'https://github.com/shadcn-ui/ui'
    });
  });

  it('rejects invalid inputs, empty strings, and reserved keywords', () => {
    expect(normalizeGitHubUrl('')).toBeNull();
    expect(normalizeGitHubUrl('   ')).toBeNull();
    expect(normalizeGitHubUrl(null)).toBeNull();
    expect(normalizeGitHubUrl('https://google.com/foo/bar')).toBeNull();
    expect(normalizeGitHubUrl('https://github.com/settings/profile')).toBeNull();
    expect(normalizeGitHubUrl('invalid_string_without_slash')).toBeNull();
  });
});

describe('githubService - validateRepoIdentifier', () => {
  it('accepts valid GitHub usernames and repository names', () => {
    expect(validateRepoIdentifier('adnan911', 'promptKeeper')).toBe(true);
    expect(validateRepoIdentifier('facebook', 'react')).toBe(true);
    expect(validateRepoIdentifier('a-b-c', 'repo.name-with_underscore')).toBe(true);
  });

  it('rejects invalid names or reserved owners', () => {
    expect(validateRepoIdentifier('-invalidStart', 'repo')).toBe(false);
    expect(validateRepoIdentifier('invalidEnd-', 'repo')).toBe(false);
    expect(validateRepoIdentifier('explore', 'trending')).toBe(false);
    expect(validateRepoIdentifier('', 'repo')).toBe(false);
  });
});

describe('githubService - fetchRepoMetadata', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and maps public metadata with rate limit headers', async () => {
    const mockPayload = {
      id: 10270250,
      name: 'react',
      full_name: 'facebook/react',
      owner: { login: 'facebook' },
      html_url: 'https://github.com/facebook/react',
      description: 'The library for web and native user interfaces.',
      language: 'JavaScript',
      stargazers_count: 228000,
      forks_count: 45000,
      open_issues_count: 1200,
      topics: ['declarative', 'frontend', 'javascript', 'ui'],
      license: { spdx_id: 'MIT' },
      default_branch: 'main',
      pushed_at: '2026-03-01T12:00:00Z',
      created_at: '2013-05-24T16:15:54Z'
    };

    const mockHeaders = new Headers({
      'x-ratelimit-limit': '60',
      'x-ratelimit-remaining': '58',
      'x-ratelimit-reset': '1772450000'
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: mockHeaders,
      json: async () => mockPayload
    });

    const result = await fetchRepoMetadata('facebook', 'react');

    expect(result.fullName).toBe('facebook/react');
    expect(result.stars).toBe(228000);
    expect(result.primaryLanguage).toBe('JavaScript');
    expect(result.topics).toEqual(['declarative', 'frontend', 'javascript', 'ui']);
    expect(result.rateLimit.remaining).toBe(58);
  });

  it('handles 404 not found cleanly', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
      json: async () => ({ message: 'Not Found' })
    });

    await expect(fetchRepoMetadata('nonexistent', 'fake-repo')).rejects.toThrow(/not found on GitHub/i);
  });

  it('handles 403 rate limit exceeded cleanly', async () => {
    const mockHeaders = new Headers({
      'x-ratelimit-limit': '60',
      'x-ratelimit-remaining': '0',
      'x-ratelimit-reset': '1772450000'
    });

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      headers: mockHeaders,
      json: async () => ({ message: 'API rate limit exceeded' })
    });

    await expect(fetchRepoMetadata('facebook', 'react')).rejects.toThrow(/rate limit exceeded/i);
  });

  it('includes Authorization header when GitHub Personal Access Token is configured', async () => {
    setGitHubToken('ghp_test_token_12345');

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({
        'x-ratelimit-limit': '5000',
        'x-ratelimit-remaining': '4999'
      }),
      json: async () => ({
        id: 1,
        name: 'test',
        full_name: 'owner/test',
        owner: { login: 'owner' }
      })
    });

    await fetchRepoMetadata('owner', 'test');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/test',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer ghp_test_token_12345'
        })
      })
    );

    setGitHubToken('');
    expect(getGitHubToken()).toBe('');
  });
});

