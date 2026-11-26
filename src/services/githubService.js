/**
 * PromptKeeper 2.0 - GitHub Integration Service
 * URL Normalization, validation, public metadata fetching, and rate-limit parsing.
 */

const RESERVED_NAMES = new Set([
  'settings', 'pricing', 'features', 'explore', 'trending', 'topics',
  'collections', 'events', 'readme', 'security', 'contact', 'about',
  'enterprise', 'organizations', 'account', 'login', 'logout', 'signup'
]);

/**
 * Normalizes any GitHub URL variant into a canonical repository reference.
 * Supported formats:
 * - https://github.com/owner/repo
 * - http://github.com/owner/repo/
 * - github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - https://github.com/owner/repo/tree/main/...
 * - owner/repo
 *
 * @param {string} input - Raw user input string
 * @returns {{ owner: string, name: string, fullName: string, canonicalUrl: string } | null}
 */
export function normalizeGitHubUrl(input) {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  let cleaned = raw;

  // Handle SSH format: git@github.com:owner/repo(.git)
  const sshMatch = cleaned.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (sshMatch) {
    const owner = sshMatch[1];
    const name = sshMatch[2].replace(/\.git$/i, '');
    if (validateRepoIdentifier(owner, name)) {
      return {
        owner,
        name,
        fullName: `${owner}/${name}`,
        canonicalUrl: `https://github.com/${owner}/${name}`
      };
    }
  }

  // Remove protocol and trailing slashes
  cleaned = cleaned.replace(/^https?:\/\//i, '');
  cleaned = cleaned.replace(/^www\./i, '');

  // If starts with github.com/, strip it
  if (cleaned.toLowerCase().startsWith('github.com/')) {
    cleaned = cleaned.slice('github.com/'.length);
  }

  // Strip query strings or hash fragments
  cleaned = cleaned.split('?')[0].split('#')[0];

  // Remove trailing slashes and .git suffix
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\.git$/i, '');

  // Split path parts
  const parts = cleaned.split('/').filter(Boolean);
  if (parts.length < 2) return null;

  const owner = parts[0];
  const name = parts[1];

  if (!validateRepoIdentifier(owner, name)) {
    return null;
  }

  return {
    owner,
    name,
    fullName: `${owner}/${name}`,
    canonicalUrl: `https://github.com/${owner}/${name}`
  };
}

/**
 * Validates that owner and repository names adhere to GitHub rules.
 * @param {string} owner 
 * @param {string} name 
 * @returns {boolean}
 */
export function validateRepoIdentifier(owner, name) {
  if (!owner || !name) return false;
  if (RESERVED_NAMES.has(owner.toLowerCase())) return false;

  // GitHub user/org name: 1-39 chars, alphanumeric or hyphens, cannot start/end with hyphen
  const ownerValid = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(owner);
  
  // Repository name: 1-100 chars, alphanumeric, dots, hyphens, underscores
  const repoValid = /^[a-zA-Z0-9_.-]{1,100}$/.test(name);

  return ownerValid && repoValid;
}

/**
 * Retrieves the stored GitHub Personal Access Token from local storage.
 * @returns {string}
 */
export function getGitHubToken() {
  try {
    const local = localStorage.getItem('promptkeeper_github_token');
    if (local !== null) return local.trim();
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GITHUB_TOKEN) {
      return import.meta.env.VITE_GITHUB_TOKEN.trim();
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Stores or clears the GitHub Personal Access Token in local storage.
 * Setting a token increases GitHub rate limits from 60 req/hr to 5,000 req/hr.
 * @param {string} token
 */
export function setGitHubToken(token) {
  try {
    if (token && typeof token === 'string' && token.trim()) {
      localStorage.setItem('promptkeeper_github_token', token.trim());
    } else {
      localStorage.setItem('promptkeeper_github_token', '');
    }
  } catch {
    // Local storage unavailable
  }
}

/**
 * Fetches public repository metadata from GitHub REST API.
 * Handles rate limits, missing repositories, and network errors gracefully.
 * Supports optional Personal Access Token (PAT) for 5,000 req/hr.
 *
 * @param {string} owner 
 * @param {string} name 
 * @param {string} [token] Optional GitHub Personal Access Token
 * @returns {Promise<object>} Normalized repository metadata
 */
export async function fetchRepoMetadata(owner, name, token = getGitHubToken()) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`;

  const headers = {
    Accept: 'application/vnd.github.v3+json'
  };

  const activeToken = (token || getGitHubToken() || '').trim();
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  let res;
  try {
    res = await fetch(url, { headers });
  } catch (err) {
    throw new Error(`Network error while fetching repository: ${err.message || 'Offline or unreachable'}`);
  }

  // Parse rate limits from headers
  const rateLimit = {
    limit: parseInt(res.headers.get('x-ratelimit-limit') || (activeToken ? '5000' : '60'), 10),
    remaining: parseInt(res.headers.get('x-ratelimit-remaining') || '0', 10),
    reset: parseInt(res.headers.get('x-ratelimit-reset') || '0', 10)
  };

  if (res.status === 404) {
    const error = new Error(`Repository "${owner}/${name}" was not found on GitHub. It may be private, renamed, or deleted.`);
    error.status = 404;
    error.rateLimit = rateLimit;
    throw error;
  }

  if (res.status === 403) {
    const resetTime = rateLimit.reset ? new Date(rateLimit.reset * 1000).toLocaleTimeString() : 'soon';
    const error = new Error(`GitHub API rate limit exceeded (${activeToken ? '5,000' : '60'} requests/hr). Limit resets at ${resetTime}.`);
    error.status = 403;
    error.isRateLimit = true;
    error.resetTime = resetTime;
    error.rateLimit = rateLimit;
    throw error;
  }

  if (!res.ok) {
    const error = new Error(`GitHub API error (${res.status}): ${res.statusText}`);
    error.status = res.status;
    error.rateLimit = rateLimit;
    throw error;
  }

  const data = await res.json();

  const rawDesc = (data.description || '').trim();
  const topics = Array.isArray(data.topics) ? data.topics : [];

  // Optionally attempt to fetch latest release tag if possible without blocking
  let latestRelease = null;
  try {
    const rel = await fetchLatestRelease(owner, name, activeToken);
    if (rel?.tagName) latestRelease = rel.tagName;
  } catch {
    // Non-blocking fallback
  }

  return {
    githubId: data.id,
    owner: data.owner?.login || owner,
    name: data.name || name,
    fullName: data.full_name || `${owner}/${name}`,
    canonicalUrl: data.html_url || `https://github.com/${owner}/${name}`,
    description: rawDesc || generateSmartRepoDescription(owner, name, topics),
    primaryLanguage: data.language || 'Unknown',
    topics,
    stars: typeof data.stargazers_count === 'number' ? data.stargazers_count : 0,
    forks: typeof data.forks_count === 'number' ? data.forks_count : 0,
    openIssues: typeof data.open_issues_count === 'number' ? data.open_issues_count : 0,
    license: data.license?.spdx_id || data.license?.name || null,
    defaultBranch: data.default_branch || 'main',
    latestRelease,
    pushedAt: data.pushed_at || null,
    createdAt: data.created_at || null,
    rateLimit
  };
}

/**
 * Fetches the raw README markdown content of a repository.
 *
 * @param {string} owner 
 * @param {string} name 
 * @param {string} [token] 
 * @returns {Promise<string>} Markdown text
 */
export async function fetchRepositoryReadme(owner, name, token = getGitHubToken()) {
  if (!owner || !name) throw new Error('Owner and repository name required.');

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/readme`;
  const headers = {
    Accept: 'application/vnd.github.raw+json'
  };

  const activeToken = (token || getGitHubToken() || '').trim();
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status === 404) {
        return `# ${name}\n\nNo README.md found in this repository.`;
      }
      throw new Error(`Failed to load README (HTTP ${res.status})`);
    }
    const text = await res.text();
    return text;
  } catch (err) {
    // Fallback: try raw.githubusercontent.com
    try {
      const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/HEAD/README.md`;
      const fallbackRes = await fetch(rawUrl);
      if (fallbackRes.ok) {
        return await fallbackRes.text();
      }
    } catch {
      // ignore
    }
    throw new Error(`Unable to load README: ${err.message || 'Network error'}`);
  }
}

/**
 * Fetches the latest published release tag for a repository.
 *
 * @param {string} owner 
 * @param {string} name 
 * @param {string} [token] 
 * @returns {Promise<{ tagName: string, name: string, htmlUrl: string, publishedAt: string } | null>}
 */
export async function fetchLatestRelease(owner, name, token = getGitHubToken()) {
  if (!owner || !name) return null;

  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases/latest`;
  const headers = {
    Accept: 'application/vnd.github.v3+json'
  };

  const activeToken = (token || getGitHubToken() || '').trim();
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      tagName: data.tag_name || '',
      name: data.name || data.tag_name || '',
      htmlUrl: data.html_url || '',
      publishedAt: data.published_at || null
    };
  } catch {
    return null;
  }
}

/**
 * Automatically creates a readable short summary description for a GitHub repository.
 * Formats kebab-case or PascalCase/camelCase into natural English with context.
 * 
 * @param {string} owner
 * @param {string} name
 * @param {Array<string>} [topics=[]]
 * @returns {string}
 */
export function generateSmartRepoDescription(owner, name, topics = []) {
  if (!name) return 'Open-source software repository.';

  // Format repository name into natural readable words
  const readable = name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_.]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const validOwner = owner ? `@${owner}` : 'GitHub community';

  if (topics && topics.length > 0) {
    const topicSummary = topics.slice(0, 3).join(', ');
    return `${readable} — Developer tool by ${validOwner} focusing on ${topicSummary}.`;
  }

  return `${readable} — Open-source repository maintained by ${validOwner}.`;
}

