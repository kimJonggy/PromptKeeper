/**
 * PromptKeeper 2.0 - Repository Constants
 * Lifecycle statuses, language color mappings, and sorting definitions.
 */

export const REPO_STATUSES = {
  inbox: {
    id: 'inbox',
    label: 'Inbox',
    color: '#a78bfa',
    bg: 'rgba(167, 139, 250, 0.12)',
    border: 'rgba(167, 139, 250, 0.3)',
    icon: '📥',
    description: 'Newly captured repositories awaiting initial evaluation'
  },
  to_explore: {
    id: 'to_explore',
    label: 'To Explore',
    color: '#60a5fa',
    bg: 'rgba(96, 165, 250, 0.12)',
    border: 'rgba(96, 165, 250, 0.3)',
    icon: '🧭',
    description: 'Queued for architectural review or feature exploration'
  },
  researching: {
    id: 'researching',
    label: 'Researching',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
    icon: '🔬',
    description: 'Actively analyzing codebase, dependencies, and docs'
  },
  testing: {
    id: 'testing',
    label: 'Testing',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.3)',
    icon: '🧪',
    description: 'Cloned locally, testing integrations and benchmarks'
  },
  using: {
    id: 'using',
    label: 'Using',
    color: '#34d399',
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
    icon: '⚡',
    description: 'Active in production, daily workflow, or core stack'
  },
  completed: {
    id: 'completed',
    label: 'Completed',
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.12)',
    border: 'rgba(129, 140, 248, 0.3)',
    icon: '✓',
    description: 'Evaluation complete; key insights or code integrated'
  },
  archived: {
    id: 'archived',
    label: 'Archived',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.12)',
    border: 'rgba(148, 163, 184, 0.3)',
    icon: '📦',
    description: 'Deprecated, unmaintained, or kept for historical reference'
  }
};

export const REPO_STATUS_LIST = Object.values(REPO_STATUSES);

export const PRIMARY_REPO_STATUSES = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'to_explore', label: 'Explore' },
  { id: 'using', label: 'Using' },
  { id: 'archived', label: 'Archive' }
];

export const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Rust: '#dea584',
  Go: '#00ADD8',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  PHP: '#4F5D95',
  Ruby: '#701516',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Lua: '#000080',
  Zig: '#ec915c',
  Elixir: '#6e4a7e',
  Unknown: '#64748b'
};

export const REPO_SORT_OPTIONS = [
  { value: 'saved_desc', label: 'Recently Added' },
  { value: 'stars_desc', label: 'Most Stars' },
  { value: 'pushed_desc', label: 'Recently Pushed' },
  { value: 'name_asc', label: 'Alphabetical (A-Z)' }
];

export const BENTO_CARD_COLORS = [
  { id: 'default', color: '',        label: 'Obsidian (Default)', bg: 'transparent' },
  { id: 'lime',    color: '#E8FF1F', label: 'Bento Lime',         bg: '#E8FF1F' },
  { id: 'blue',    color: '#6366F1', label: 'Electric Indigo',    bg: '#6366F1' },
  { id: 'emerald', color: '#10B981', label: 'Deep Emerald',       bg: '#10B981' },
  { id: 'purple',  color: '#A855F7', label: 'Cyber Violet',       bg: '#A855F7' },
  { id: 'amber',   color: '#F59E0B', label: 'Sunset Amber',       bg: '#F59E0B' },
  { id: 'pink',    color: '#EC4899', label: 'Vivid Pink',         bg: '#EC4899' }
];

/**
 * Maps legacy/pastel hex colors to modern deep, saturated, atmospheric shades
 * while preserving custom hex codes.
 */
export const getDeepCardColor = (hex) => {
  if (!hex) return '';
  const legacyMap = {
    '#7088FF': '#6366F1',
    '#34D399': '#10B981',
    '#B9A6FF': '#A855F7',
    '#FFB37A': '#F59E0B',
    '#FF6AA8': '#EC4899'
  };
  return legacyMap[hex.toUpperCase()] || legacyMap[hex] || hex;
};


