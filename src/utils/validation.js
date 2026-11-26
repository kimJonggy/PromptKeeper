/**
 * Validation and sanitization utilities for PromptKeeper data structures.
 */
import { extractDomain } from '../services/bookmarkService.js';

export function sanitizeTag(tag) {
  if (typeof tag !== 'string') return '';
  return tag.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-');
}

export function validatePrompt(p) {
  const errors = [];

  if (!p || typeof p !== 'object' || Array.isArray(p)) {
    return { isValid: false, errors: ['Prompt record must be an object'], sanitized: null };
  }

  const title = typeof p.title === 'string' ? p.title.trim() : '';
  if (!title) {
    errors.push('Prompt title is required and cannot be empty');
  }

  const body = typeof p.body === 'string' ? p.body : '';
  if (!body) {
    errors.push('Prompt body is required');
  }

  const tags = Array.isArray(p.tags)
    ? Array.from(new Set(p.tags.map(sanitizeTag).filter(Boolean)))
    : [];

  const category = typeof p.category === 'string' && p.category.trim() ? p.category.trim() : 'Coding';
  const model = typeof p.model === 'string' && p.model.trim() ? p.model.trim() : 'Claude';
  const fav = Boolean(p.fav);
  const uses = typeof p.uses === 'number' && !isNaN(p.uses) && p.uses >= 0 ? Math.floor(p.uses) : 0;
  const created = typeof p.created === 'number' && !isNaN(p.created) ? p.created : Date.now();
  const history = Array.isArray(p.history) ? p.history.filter(n => typeof n === 'number' && !isNaN(n)) : [];
  const notes = typeof p.notes === 'string' ? p.notes : '';

  let images = Array.isArray(p.images) ? p.images.filter(img => typeof img === 'string') : [];
  let thumbnail = typeof p.thumbnail === 'string' ? p.thumbnail : (images[0] || null);
  if (thumbnail && images.length === 0) {
    images = [thumbnail];
  }

  const linkedPromptId = p.linkedPromptId !== undefined && p.linkedPromptId !== null
    ? String(p.linkedPromptId)
    : null;

  const sanitized = {
    ...p,
    id: p.id !== undefined && p.id !== null ? p.id : `pk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title: title || 'Untitled Prompt',
    body,
    tags,
    category,
    model,
    fav,
    uses,
    created,
    history,
    notes,
    images: images.length > 0 ? [images[0]] : [],
    thumbnail: thumbnail || null,
    linkedPromptId,
    collections: Array.isArray(p.collections) ? p.collections : (category ? [category] : []),
    linkedRepoIds: Array.isArray(p.linkedRepoIds) ? p.linkedRepoIds : [],
    versions: Array.isArray(p.versions) ? p.versions : [],
    presets: Array.isArray(p.presets) ? p.presets : [],
    variableConfig: p.variableConfig && typeof p.variableConfig === 'object' ? p.variableConfig : { types: {}, options: {} }
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

export function validateBookmark(b) {
  const errors = [];
  if (!b || typeof b !== 'object' || Array.isArray(b)) {
    return { isValid: false, errors: ['Bookmark record must be an object'], sanitized: null };
  }

  const url = typeof b.url === 'string' ? b.url.trim() : '';
  if (!url) {
    errors.push('Bookmark URL is required and cannot be empty');
  }

  const validStatuses = ['inbox', 'reading', 'reference', 'tools', 'archived'];
  const status = typeof b.status === 'string' && b.status.trim() ? b.status.trim().toLowerCase() : 'inbox';
  if (status && !validStatuses.includes(status)) {
    errors.push(`Invalid bookmark status: ${status}. Must be one of: ${validStatuses.join(', ')}`);
  }

  const domain = typeof b.domain === 'string' && b.domain.trim() 
    ? b.domain.trim() 
    : (url ? extractDomain(url) : '');

  const rawTitle = typeof b.title === 'string' ? b.title.trim() : '';
  const title = rawTitle.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  const rawNotes = typeof b.notes === 'string' ? b.notes : (typeof b.personalNotes === 'string' ? b.personalNotes : '');
  const cleanNotes = rawNotes.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  const description = typeof b.description === 'string' ? b.description : '';
  const category = typeof b.category === 'string' && b.category.trim() ? b.category.trim() : 'General';
  const tags = Array.isArray(b.tags)
    ? Array.from(new Set(b.tags.map(sanitizeTag).filter(Boolean)))
    : [];
  const collections = Array.isArray(b.collections)
    ? b.collections
    : (category && category !== 'All' ? [category] : []);
  const isFavorite = Boolean(b.isFavorite ?? b.fav);
  const isPinned = Boolean(b.isPinned);
  const createdAt = typeof b.createdAt === 'number' && !isNaN(b.createdAt) ? b.createdAt : (typeof b.savedAt === 'number' ? b.savedAt : Date.now());
  const updatedAt = typeof b.updatedAt === 'number' && !isNaN(b.updatedAt) ? b.updatedAt : Date.now();

  const sanitized = {
    ...b,
    id: b.id !== undefined && b.id !== null ? String(b.id) : `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    url,
    title: title || domain || url,
    description,
    personalNotes: cleanNotes,
    notes: cleanNotes,
    category,
    status,
    domain,
    tags,
    collections,
    isFavorite,
    isPinned,
    createdAt,
    updatedAt,
    linkedPromptIds: Array.isArray(b.linkedPromptIds) ? b.linkedPromptIds : [],
    linkedRepoIds: Array.isArray(b.linkedRepoIds) ? b.linkedRepoIds : []
  };

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

export function validateVault(data) {
  const errors = [];
  if (!data || typeof data !== 'object') {
    return { isValid: false, errors: ['Vault data must be a valid JSON object or array'], validPrompts: [] };
  }

  if (Array.isArray(data)) {
    const validPrompts = [];
    data.forEach((item, index) => {
      const res = validatePrompt(item);
      if (res.isValid) {
        validPrompts.push(res.sanitized);
      } else {
        errors.push(`Item at index ${index} invalid: ${res.errors.join(', ')}`);
      }
    });
    return {
      isValid: validPrompts.length > 0,
      errors,
      validPrompts,
      isFullVault: false
    };
  }

  // Full vault structure
  const rawPrompts = Array.isArray(data.prompts) ? data.prompts : [];
  const validPrompts = [];
  rawPrompts.forEach((item, index) => {
    const res = validatePrompt(item);
    if (res.isValid) {
      validPrompts.push(res.sanitized);
    } else {
      errors.push(`Prompt [${index}] invalid: ${res.errors.join(', ')}`);
    }
  });

  return {
    isValid: validPrompts.length > 0 || rawPrompts.length === 0,
    errors,
    validPrompts,
    categories: Array.isArray(data.categories) 
      ? data.categories.filter(c => typeof c === 'string' && c.trim()).map(c => c.trim()) 
      : null,
    repositories: Array.isArray(data.repositories)
      ? data.repositories.filter(r => r && typeof r === 'object' && r.fullName)
      : null,
    bookmarks: Array.isArray(data.bookmarks)
      ? data.bookmarks.map(b => validateBookmark(b).sanitized).filter(Boolean)
      : null,
    categoryColors: data.categoryColors && typeof data.categoryColors === 'object' ? data.categoryColors : null,
    modelColors: data.modelColors && typeof data.modelColors === 'object' ? data.modelColors : null,
    isFullVault: true
  };
}
