/**
 * PromptKeeper 2.0 - Netscape Bookmark HTML File Parser
 * Parses standard bookmark files exported from Chrome, Firefox, Safari, Edge, Arc, Brave, etc.
 * Supports folders as categories/tags, creation dates, and metadata.
 */

import { extractDomain, normalizeBookmarkUrl } from '../services/bookmarkService.js';
import { generateUUID } from './uuid.js';

/**
 * Parses Netscape Bookmark HTML format string.
 * @param {string} htmlContent
 * @returns {Array<Object>} Array of sanitized bookmark objects
 */
export function parseNetscapeBookmarks(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') return [];

  const results = [];
  const lines = htmlContent.split(/\r?\n/);
  
  const folderStack = [];
  
  // Regular expressions for matching Netscape bookmark tokens
  const folderStartRegex = /<H[1-6][^>]*>(.*?)<\/H[1-6]>/i;
  const linkRegex = /<A\s+([^>]*?)>(.*?)<\/A>/i;
  const hrefRegex = /HREF\s*=\s*["']([^"']+)["']/i;
  const addDateRegex = /ADD_DATE\s*=\s*["'](\d+)["']/i;
  const tagsRegex = /TAGS\s*=\s*["']([^"']+)["']/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for folder header: <H3 ...>Folder Name</H3>
    const folderMatch = line.match(folderStartRegex);
    if (folderMatch) {
      const folderName = folderMatch[1].replace(/<[^>]+>/g, '').trim();
      if (folderName && folderName !== 'Bookmarks' && folderName !== 'Bookmarks Bar') {
        folderStack.push(folderName);
      }
      continue;
    }

    // Check for folder close: </DL>
    if (/<\/DL>/i.test(line)) {
      if (folderStack.length > 0) {
        folderStack.pop();
      }
      continue;
    }

    // Check for bookmark link: <A HREF="..." ...>Title</A>
    const linkMatch = line.match(linkRegex);
    if (linkMatch) {
      const attributes = linkMatch[1];
      const rawTitle = linkMatch[2].replace(/<[^>]+>/g, '').trim();

      const hrefMatch = attributes.match(hrefRegex);
      if (!hrefMatch) continue;

      const rawUrl = hrefMatch[1].trim();
      // Skip internal browser protocol links (chrome://, edge://, about:, javascript:, etc.)
      if (!/^https?:\/\//i.test(rawUrl)) continue;

      const cleanUrl = normalizeBookmarkUrl(rawUrl);
      if (!cleanUrl) continue;

      const domain = extractDomain(cleanUrl);

      // Parse timestamp
      let createdAt = Date.now();
      const dateMatch = attributes.match(addDateRegex);
      if (dateMatch) {
        const rawTimestamp = parseInt(dateMatch[1], 10);
        // Netscape ADD_DATE is typically unix seconds
        if (!isNaN(rawTimestamp) && rawTimestamp > 0) {
          createdAt = rawTimestamp < 10000000000 ? rawTimestamp * 1000 : rawTimestamp;
        }
      }

      // Collect tags from attributes and folder stack
      const tagSet = new Set();
      if (domain) {
        const topParts = domain.split('.').filter(p => p.length > 2 && p !== 'com' && p !== 'org' && p !== 'net' && p !== 'io' && p !== 'dev');
        topParts.forEach(tp => tagSet.add(tp.toLowerCase()));
      }

      const tagsMatch = attributes.match(tagsRegex);
      if (tagsMatch) {
        tagsMatch[1].split(',').map(t => t.trim().toLowerCase()).filter(Boolean).forEach(t => tagSet.add(t));
      }

      // Current enclosing folder
      const currentFolder = folderStack.length > 0 ? folderStack[folderStack.length - 1] : 'General';
      if (currentFolder && currentFolder !== 'General') {
        tagSet.add(currentFolder.toLowerCase().replace(/\s+/g, '-'));
      }

      const title = rawTitle || domain || cleanUrl;

      results.push({
        id: generateUUID(),
        url: cleanUrl,
        title,
        domain: domain || 'web',
        description: `Imported from browser bookmarks${folderStack.length > 0 ? ` (${folderStack.join(' > ')})` : ''}`,
        personalNotes: '',
        notes: '',
        category: currentFolder || 'General',
        tags: Array.from(tagSet),
        status: 'inbox',
        isFavorite: false,
        isPinned: false,
        createdAt,
        updatedAt: Date.now(),
        collections: currentFolder && currentFolder !== 'General' ? [currentFolder] : [],
        linkedPromptIds: [],
        linkedRepoIds: []
      });
    }
  }

  return results;
}

