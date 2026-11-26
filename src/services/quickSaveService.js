/**
 * PromptKeeper 2.0 - Quick Save & Duplicate Detection Service
 * Detects whether pasted/typed input is a GitHub repository, website bookmark, or AI prompt.
 * Provides duplicate checking across existing Prompts, Repositories, and Bookmarks.
 */

import { normalizeBookmarkUrl, extractDomain, inferTitleFromUrl } from './bookmarkService.js';
import { normalizeGitHubUrl, generateSmartRepoDescription } from './githubService.js';

/**
 * Detects resource type from raw text or URL.
 * @param {string} text
 * @returns {'repo' | 'bookmark' | 'prompt'}
 */
export function detectInputType(text) {
  if (!text || typeof text !== 'string') return 'prompt';
  const trimmed = text.trim();

  // 1. Check for GitHub repository URL
  if (/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+/i.test(trimmed)) {
    return 'repo';
  }

  // 2. Check for standard website URL
  if (/^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(trimmed) || 
      (/^https?:\/\//i.test(trimmed) && !trimmed.includes('\n'))) {
    return 'bookmark';
  }

  // 3. Fallback: arbitrary text, instructions, or multiline prompt
  return 'prompt';
}

/**
 * Parses raw text input into a structured draft for the given or detected type.
 * @param {string} text
 * @param {'repo' | 'bookmark' | 'prompt' | null} [forcedType=null]
 * @returns {Object} Draft item
 */
export function parseQuickSaveInput(text, forcedType = null) {
  const trimmed = (text || '').trim();
  const type = forcedType || detectInputType(trimmed);

  if (type === 'repo') {
    const parsed = normalizeGitHubUrl(trimmed);
    const canonicalUrl = parsed?.canonicalUrl || (trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const fullName = parsed?.fullName || trimmed;
    const title = parsed?.name || trimmed;

    const tags = parsed ? [parsed.name.toLowerCase()] : [];
    const description = generateSmartRepoDescription(parsed?.owner || '', parsed?.name || '', tags);

    return {
      type: 'repo',
      canonicalUrl,
      fullName,
      name: parsed?.name || '',
      owner: parsed?.owner || '',
      title,
      description,
      notes: '',
      tags,
      status: 'inbox'
    };
  }

  if (type === 'bookmark') {
    const cleanUrl = normalizeBookmarkUrl(trimmed) || (trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const domain = extractDomain(cleanUrl);
    const title = inferTitleFromUrl(cleanUrl);

    return {
      type: 'bookmark',
      url: cleanUrl,
      domain,
      title,
      description: '',
      notes: '',
      category: 'General',
      tags: domain ? [domain.replace(/\.[^.]+$/, '')] : [],
      status: 'inbox'
    };
  }

  // AI Prompt
  const lines = trimmed.split('\n');
  const firstLine = lines[0]?.trim() || 'Untitled Prompt';
  const title = firstLine.length > 60 ? firstLine.slice(0, 57) + '...' : firstLine;
  const body = trimmed;

  return {
    type: 'prompt',
    title,
    body,
    category: 'General',
    model: 'Universal',
    tags: [],
    notes: '',
    status: 'inbox'
  };
}

/**
 * Checks for duplicates across prompts, repositories, and bookmarks.
 * @param {Object} params
 * @param {string} params.type - 'repo' | 'bookmark' | 'prompt'
 * @param {Object} params.draft - The item draft being saved
 * @param {Array<Object>} [params.prompts=[]]
 * @param {Array<Object>} [params.repositories=[]]
 * @param {Array<Object>} [params.bookmarks=[]]
 * @returns {{ isDuplicate: boolean, existingItem: Object | null, reason: string }}
 */
export function checkDuplicates({
  type,
  draft,
  prompts = [],
  repositories = [],
  bookmarks = []
}) {
  if (!draft) return { isDuplicate: false, existingItem: null, reason: '' };

  if (type === 'repo') {
    const targetUrl = (draft.canonicalUrl || '').toLowerCase().replace(/\.git$/, '').replace(/\/$/, '');
    const targetFullName = (draft.fullName || '').toLowerCase();

    const existingRepo = repositories.find(r => {
      const rUrl = (r.canonicalUrl || '').toLowerCase().replace(/\.git$/, '').replace(/\/$/, '');
      const rFull = (r.fullName || '').toLowerCase();
      return (targetUrl && rUrl === targetUrl) || (targetFullName && rFull === targetFullName);
    });

    if (existingRepo) {
      return {
        isDuplicate: true,
        existingItem: existingRepo,
        reason: `Repository "${existingRepo.fullName}" is already in your Repository Hub.`
      };
    }
  }

  if (type === 'bookmark') {
    const targetUrl = (draft.url || '').toLowerCase().replace(/\/$/, '');

    const existingBm = bookmarks.find(b => {
      const bUrl = (b.url || '').toLowerCase().replace(/\/$/, '');
      return targetUrl && bUrl === targetUrl;
    });

    if (existingBm) {
      return {
        isDuplicate: true,
        existingItem: existingBm,
        reason: `Bookmark for "${existingBm.title || existingBm.url}" already exists.`
      };
    }
  }

  if (type === 'prompt') {
    const targetTitle = (draft.title || '').trim().toLowerCase();
    const targetBody = (draft.body || '').trim().toLowerCase();

    const existingPrompt = prompts.find(p => {
      const pTitle = (p.title || '').trim().toLowerCase();
      const pBody = (p.body || '').trim().toLowerCase();
      return (targetTitle && pTitle === targetTitle) || (targetBody && pBody.length > 20 && pBody === targetBody);
    });

    if (existingPrompt) {
      return {
        isDuplicate: true,
        existingItem: existingPrompt,
        reason: `Prompt "${existingPrompt.title}" already exists in your library.`
      };
    }
  }

  return { isDuplicate: false, existingItem: null, reason: '' };
}

/**
 * Parses mixed bulk input containing URLs, GitHub repositories, and AI prompt blocks.
 * Automatically classifies each chunk into 'repo', 'bookmark', or 'prompt'.
 * Supports markdown links: [Title](url)
 * @param {string} text
 * @returns {Array<Object>} Array of parsed items with stable client IDs
 */
export function parseBulkMixedInput(text) {
  if (!text || typeof text !== 'string') return [];

  const rawLines = text.split(/\r?\n/);
  const items = [];
  let currentPromptLines = [];

  const flushPrompt = () => {
    if (currentPromptLines.length > 0) {
      const promptBody = currentPromptLines.join('\n').trim();
      if (promptBody) {
        const parsed = parseQuickSaveInput(promptBody, 'prompt');
        parsed.id = `bulk-${items.length}-${Math.random().toString(36).substr(2, 5)}`;
        items.push(parsed);
      }
      currentPromptLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const line = rawLine.trim();

    if (!line) {
      // Empty line: boundary for multiline prompt
      flushPrompt();
      continue;
    }

    // Strip list numbers, bullets: "1. ", "2) ", "- ", "* ", "• "
    const cleanedLine = line.replace(/^(\d+[\.\)]|[-*•>])\s+/, '').trim();

    // Check if line is a Markdown Link: e.g. [React](https://github.com/facebook/react)
    const mdLinkMatch = line.match(/^[-*•]?\s*\[(.*?)\]\((https?:\/\/[^\s)]+)\)(.*)$/i);
    if (mdLinkMatch) {
      flushPrompt();
      const extractedTitle = mdLinkMatch[1].trim();
      const extractedUrl = mdLinkMatch[2].trim();
      const remainingDesc = mdLinkMatch[3]?.replace(/^[\s\-–—:]+/, '').trim() || '';
      const type = detectInputType(extractedUrl);
      const parsed = parseQuickSaveInput(extractedUrl, type);
      if (extractedTitle) parsed.title = extractedTitle;
      if (remainingDesc) parsed.description = remainingDesc;
      parsed.id = `bulk-${items.length}-${Math.random().toString(36).substr(2, 5)}`;
      items.push(parsed);
      continue;
    }

    // Check if cleaned line is a standalone URL (or github URL)
    const isCleanUrl = /^https?:\/\/[^\s]+$/i.test(cleanedLine) || /^www\.[^\s]+$/i.test(cleanedLine) || /^github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/i.test(cleanedLine);
    if (isCleanUrl) {
      flushPrompt();
      const type = detectInputType(cleanedLine);
      const parsed = parseQuickSaveInput(cleanedLine, type);
      parsed.id = `bulk-${items.length}-${Math.random().toString(36).substr(2, 5)}`;
      items.push(parsed);
      continue;
    }

    // Check if line contains a URL with title prefix: e.g. "Auto Editor: https://github.com/..."
    const urlMatch = line.match(/(https?:\/\/[^\s]+|github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)/i);
    if (urlMatch) {
      const extractedUrl = urlMatch[1].replace(/[.,;:)]+$/, '');
      const prefix = line.slice(0, urlMatch.index).replace(/^(\d+[\.\)]|[-*•>])\s*/, '').replace(/[:\-–—\s]+$/, '').trim();
      const suffix = line.slice(urlMatch.index + urlMatch[0].length).replace(/^[\s\-–—:]+/, '').trim();
      
      flushPrompt();
      const type = detectInputType(extractedUrl);
      const parsed = parseQuickSaveInput(extractedUrl, type);
      if (prefix && prefix.length > 1 && prefix.length < 80) {
        parsed.title = prefix;
      }
      if (suffix && suffix.length > 2) {
        parsed.description = suffix;
      }
      parsed.id = `bulk-${items.length}-${Math.random().toString(36).substr(2, 5)}`;
      items.push(parsed);
      continue;
    }

    // Line is part of a prompt or text block
    currentPromptLines.push(rawLine);
  }

  flushPrompt();
  return items;
}

/**
 * Detects an overarching collection/project title from bulk text.
 * e.g. "these 20 GitHub repos will turn your Fable 5.2 into a full Video Editing studio."
 * @param {string} text
 * @returns {string}
 */
export function detectCollectionTitle(text) {
  if (!text || typeof text !== 'string') return '';
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const firstNonUrl = lines.find(l => !/https?:\/\/|github\.com/i.test(l));
  if (!firstNonUrl) return '';

  const cleaned = firstNonUrl.replace(/^#+\s*/, '').replace(/[.:;!]+$/, '').trim();
  if (cleaned.length < 4 || cleaned.length > 100) return '';
  return cleaned;
}

/**
 * Extracts suggested tags from text and parsed items
 * @param {string} text
 * @param {Array<Object>} items
 * @returns {Array<string>}
 */
export function extractSuggestedTags(text, items = []) {
  if (!text || typeof text !== 'string') return [];
  const tagCandidates = new Set();
  const keywords = [
    'video', 'audio', 'mcp', 'editing', 'ai', 'captions', 'export', 'react', 'vue', 
    'nextjs', 'tailwind', 'typescript', 'python', 'tools', 'studio', 'workflow', 
    'automation', 'agent', 'rag', 'llm', 'design', 'database', 'docker', 'cli'
  ];

  const lowerText = text.toLowerCase();
  keywords.forEach(kw => {
    const reg = new RegExp(`\\b${kw}\\b`, 'i');
    if (reg.test(lowerText)) {
      tagCandidates.add(kw);
    }
  });

  items.forEach(item => {
    if (item.name) {
      tagCandidates.add(item.name.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
  });

  return Array.from(tagCandidates).slice(0, 8);
}

/**
 * Parses bulk paste containing multiple URLs or items.
 * @param {string} text
 * @returns {Array<Object>}
 */
export function parseBulkInput(text) {
  return parseBulkMixedInput(text);
}
