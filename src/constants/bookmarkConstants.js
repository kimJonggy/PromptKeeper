/**
 * PromptKeeper 2.0 - Bookmark & Note Constants
 * Lifecycle statuses, category presets, and sorting definitions for website bookmarks.
 */

export const BOOKMARK_STATUSES = {
  inbox: {
    id: 'inbox',
    label: 'Inbox',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.3)',
    icon: '📥',
    description: 'Newly saved bookmarks awaiting review'
  },
  reading: {
    id: 'reading',
    label: 'To Read',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    icon: '📖',
    description: 'Articles, tutorials, or guides queued for study'
  },
  reference: {
    id: 'reference',
    label: 'Reference',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
    icon: '📚',
    description: 'Evergreen documentation, specifications, and API guides'
  },
  tools: {
    id: 'tools',
    label: 'Tools & Utilities',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.3)',
    icon: '🛠',
    description: 'Web apps, formatters, calculators, and design tools'
  },
  archived: {
    id: 'archived',
    label: 'Archived',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
    icon: '📦',
    description: 'Archived or completed reference links'
  }
};

export const BOOKMARK_STATUS_LIST = Object.values(BOOKMARK_STATUSES);

export const BOOKMARK_SORT_OPTIONS = [
  { value: 'saved_desc',  label: 'Recently Saved' },
  { value: 'saved_asc',   label: 'Oldest First' },
  { value: 'title_asc',   label: 'Title (A → Z)' },
  { value: 'domain_asc',  label: 'Domain (A → Z)' },
  { value: 'notes_desc',  label: 'Most Notes' }
];

export const DEFAULT_BOOKMARK_CATEGORIES = [
  'General',
  'Documentation',
  'Dev Tools',
  'AI & ML',
  'Design & UI',
  'Articles & Guides'
];

