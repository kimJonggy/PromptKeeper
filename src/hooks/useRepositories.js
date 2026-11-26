import { useState, useEffect, useMemo, useCallback } from 'react';
import { REPO_STATUSES } from '../constants/repositoryConstants.js';
import { fetchRepoMetadata, normalizeGitHubUrl, generateSmartRepoDescription } from '../services/githubService.js';
import { repositoryRepository } from '../db/repository.js';
import { isIndexedDBSupported } from '../db/index.js';
import { STORAGE_DRIVER_KEY } from '../db/migrationService.js';

const STORAGE_KEY = 'pk_repositories';

// High-quality starter repositories for clean first-load experience
const DEFAULT_REPOSITORIES = [
  {
    id: 'repo-starter-promptkeeper',
    githubId: 88472910,
    owner: 'adnan911',
    name: 'promptKeeper',
    fullName: 'adnan911/promptKeeper',
    canonicalUrl: 'https://github.com/adnan911/promptKeeper',
    description: 'Unified local-first developer knowledge workspace for GitHub repositories and AI prompts.',
    primaryLanguage: 'JavaScript',
    topics: ['react', 'vite', 'developer-tools', 'local-first', 'ai-prompts'],
    stars: 128,
    forks: 24,
    openIssues: 3,
    license: 'MIT',
    defaultBranch: 'main',
    latestRelease: 'v2.0.0',
    pushedAt: new Date().toISOString(),
    createdAt: '2024-01-10T10:00:00Z',
    savedAt: Date.now() - 86400000 * 3,
    lastSyncedAt: Date.now() - 3600000,
    status: 'using',
    personalNotes: '### Core Architecture Notes\n- Hybrid local-first data model with Dexie & IndexedDB.\n- Preserves Capacitor mobile shell.\n- Repository Hub and Prompt Studio as first-class citizens.',
    tags: ['core', 'local-first', 'workspace'],
    isFavorite: true,
    isPinned: true,
    collections: ['Active Projects']
  },
  {
    id: 'repo-starter-react',
    githubId: 10270250,
    owner: 'facebook',
    name: 'react',
    fullName: 'facebook/react',
    canonicalUrl: 'https://github.com/facebook/react',
    description: 'The library for web and native user interfaces.',
    primaryLanguage: 'JavaScript',
    topics: ['declarative', 'frontend', 'javascript', 'library', 'react', 'ui'],
    stars: 231000,
    forks: 46200,
    openIssues: 1180,
    license: 'MIT',
    defaultBranch: 'main',
    latestRelease: 'v19.0.0',
    pushedAt: new Date().toISOString(),
    createdAt: '2013-05-24T16:15:54Z',
    savedAt: Date.now() - 86400000 * 7,
    lastSyncedAt: Date.now() - 7200000,
    status: 'researching',
    personalNotes: 'Investigating React 19 compiler patterns and action hooks for PromptKeeper 2.0 component lifecycle.',
    tags: ['ui', 'frontend', 'framework'],
    isFavorite: true,
    isPinned: false,
    collections: ['Frontend Stack']
  },
  {
    id: 'repo-starter-shadcn',
    githubId: 588223637,
    owner: 'shadcn-ui',
    name: 'ui',
    fullName: 'shadcn-ui/ui',
    canonicalUrl: 'https://github.com/shadcn-ui/ui',
    description: 'A set of beautifully-designed, accessible components and a code distribution platform. Works with your favorite frameworks.',
    primaryLanguage: 'TypeScript',
    topics: ['radix-ui', 'react', 'tailwindcss', 'ui-components'],
    stars: 82000,
    forks: 6800,
    openIssues: 210,
    license: 'MIT',
    defaultBranch: 'main',
    latestRelease: 'v0.9.0',
    pushedAt: new Date().toISOString(),
    createdAt: '2023-01-12T15:20:00Z',
    savedAt: Date.now() - 86400000 * 2,
    lastSyncedAt: Date.now() - 14400000,
    status: 'to_explore',
    personalNotes: 'Reference for component styling tokens and high-density developer toolbar geometry.',
    tags: ['design-system', 'ui', 'components'],
    isFavorite: false,
    isPinned: false,
    collections: ['Design System']
  }
];

export function useRepositories() {
  const [repositories, setRepositories] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.warn('Failed to parse stored repositories from localStorage:', err);
    }
    return DEFAULT_REPOSITORIES;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(repositories));
    } catch (err) {
      console.error('Failed to save repositories to localStorage:', err);
    }
  }, [repositories]);

  // Hydrate from IndexedDB on initial mount if driver is set to indexeddb
  useEffect(() => {
    let isMounted = true;
    async function hydrate() {
      if (!isIndexedDBSupported()) return;
      const driver = localStorage.getItem(STORAGE_DRIVER_KEY);
      if (driver === 'indexeddb') {
        try {
          const dbRepos = await repositoryRepository.getAll();
          if (isMounted && dbRepos && dbRepos.length > 0) {
            setRepositories(dbRepos);
          }
        } catch (err) {
          console.warn('Failed to hydrate repositories from IndexedDB:', err);
        }
      }
    }
    hydrate();
    return () => { isMounted = false; };
  }, []);

  // Auto-enrich repositories that have missing descriptions or need initial sync
  useEffect(() => {
    let isCancelled = false;

    // 1. Immediately backfill any missing description with smart description in local state
    setRepositories(prev => {
      let changed = false;
      const updated = prev.map(repo => {
        if (!repo.description || repo.description === 'No description provided.') {
          changed = true;
          return {
            ...repo,
            description: generateSmartRepoDescription(repo.owner, repo.name, repo.topics || repo.tags)
          };
        }
        return repo;
      });
      return changed ? updated : prev;
    });

    // 2. Background sync live GitHub metadata (stars, forks, language, upstream description)
    const unsynced = repositories.filter(
      r => r.owner && r.name && (r.stars === 0 || !r.lastSyncedAt || r.lastSyncedAt < (r.savedAt || 0))
    );

    if (unsynced.length === 0) return;

    unsynced.slice(0, 8).forEach((repo, idx) => {
      setTimeout(() => {
        if (isCancelled) return;
        fetchRepoMetadata(repo.owner, repo.name)
          .then(fresh => {
            if (isCancelled || !fresh) return;
            setRepositories(prev => prev.map(r => {
              if (r.id !== repo.id) return r;
              const enriched = {
                ...r,
                githubId: fresh.githubId ?? r.githubId,
                description: fresh.description || r.description,
                primaryLanguage: fresh.primaryLanguage && fresh.primaryLanguage !== 'Unknown' ? fresh.primaryLanguage : r.primaryLanguage,
                topics: Array.isArray(fresh.topics) && fresh.topics.length > 0 ? fresh.topics : r.topics,
                stars: typeof fresh.stars === 'number' ? fresh.stars : r.stars,
                forks: typeof fresh.forks === 'number' ? fresh.forks : r.forks,
                openIssues: typeof fresh.openIssues === 'number' ? fresh.openIssues : r.openIssues,
                license: fresh.license || r.license,
                defaultBranch: fresh.defaultBranch || r.defaultBranch,
                pushedAt: fresh.pushedAt || r.pushedAt,
                lastSyncedAt: Date.now()
              };
              if (isIndexedDBSupported()) {
                repositoryRepository.save(enriched).catch(console.warn);
              }
              return enriched;
            }));
          })
          .catch(() => {});
      }, idx * 350);
    });

    return () => { isCancelled = true; };
  }, [repositories.length]);

  /**
   * Adds a new repository if not already saved.
   */
  const addRepository = useCallback((repoData) => {
    if (!repoData) {
      return { success: false, error: 'Invalid repository payload' };
    }

    let fullName = repoData.fullName;
    let owner = repoData.owner;
    let name = repoData.name;
    let canonicalUrl = repoData.canonicalUrl || repoData.url;

    // Auto-infer owner, name, fullName from canonicalUrl if needed
    if ((!fullName || !owner || !name) && canonicalUrl) {
      const normalized = normalizeGitHubUrl(canonicalUrl);
      if (normalized) {
        fullName = fullName || normalized.fullName;
        owner = owner || normalized.owner;
        name = name || normalized.name;
        canonicalUrl = normalized.canonicalUrl;
      }
    }

    if (!fullName && owner && name) {
      fullName = `${owner}/${name}`;
    }

    if (!fullName) {
      return { success: false, error: 'Invalid repository payload: fullName or GitHub URL is required' };
    }

    if (!owner && fullName.includes('/')) owner = fullName.split('/')[0];
    if (!name && fullName.includes('/')) name = fullName.split('/')[1];
    if (!canonicalUrl && owner && name) canonicalUrl = `https://github.com/${owner}/${name}`;

    const normalizedFull = fullName.toLowerCase().trim();
    const existing = repositories.find(r => (r.fullName || '').toLowerCase().trim() === normalizedFull);
    if (existing) {
      return {
        success: false,
        duplicate: true,
        existing,
        error: `Repository "${fullName}" is already in your Hub.`
      };
    }

    const smartDescription = (repoData.description || '').trim() 
      || generateSmartRepoDescription(owner, name, repoData.tags || repoData.topics);

    const newRepo = {
      id: crypto.randomUUID ? crypto.randomUUID() : `repo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      githubId: repoData.githubId ?? null,
      owner: owner || repoData.owner || '',
      name: name || repoData.name || '',
      fullName: fullName,
      canonicalUrl: canonicalUrl || `https://github.com/${owner}/${name}`,
      description: smartDescription,
      primaryLanguage: repoData.primaryLanguage || 'Unknown',
      topics: Array.isArray(repoData.topics) ? repoData.topics : [],
      stars: typeof repoData.stars === 'number' ? repoData.stars : 0,
      forks: typeof repoData.forks === 'number' ? repoData.forks : 0,
      openIssues: typeof repoData.openIssues === 'number' ? repoData.openIssues : 0,
      license: repoData.license || null,
      defaultBranch: repoData.defaultBranch || 'main',
      pushedAt: repoData.pushedAt || null,
      createdAt: repoData.createdAt || null,
      savedAt: Date.now(),
      lastSyncedAt: repoData.stars ? Date.now() : 0,
      status: repoData.status && REPO_STATUSES[repoData.status] ? repoData.status : 'inbox',
      personalNotes: repoData.personalNotes || repoData.notes || '',
      tags: Array.isArray(repoData.tags) ? repoData.tags : [],
      isFavorite: Boolean(repoData.isFavorite),
      isPinned: Boolean(repoData.isPinned),
      collections: Array.isArray(repoData.collections) ? repoData.collections : []
    };

    setRepositories(prev => [newRepo, ...prev]);

    if (isIndexedDBSupported()) {
      repositoryRepository.save(newRepo).catch(console.warn);
    }

    // Auto-fetch real GitHub upstream metadata in background
    if (owner && name) {
      fetchRepoMetadata(owner, name)
        .then(fresh => {
          if (!fresh) return;
          setRepositories(prev => prev.map(r => {
            if (r.id !== newRepo.id) return r;
            const updated = {
              ...r,
              githubId: fresh.githubId ?? r.githubId,
              description: fresh.description || r.description,
              primaryLanguage: fresh.primaryLanguage && fresh.primaryLanguage !== 'Unknown' ? fresh.primaryLanguage : r.primaryLanguage,
              topics: Array.isArray(fresh.topics) && fresh.topics.length > 0 ? fresh.topics : r.topics,
              stars: typeof fresh.stars === 'number' ? fresh.stars : r.stars,
              forks: typeof fresh.forks === 'number' ? fresh.forks : r.forks,
              openIssues: typeof fresh.openIssues === 'number' ? fresh.openIssues : r.openIssues,
              license: fresh.license || r.license,
              defaultBranch: fresh.defaultBranch || r.defaultBranch,
              pushedAt: fresh.pushedAt || r.pushedAt,
              lastSyncedAt: Date.now()
            };
            if (isIndexedDBSupported()) {
              repositoryRepository.save(updated).catch(console.warn);
            }
            return updated;
          }));
        })
        .catch(err => {
          console.debug(`Background metadata fetch for ${owner}/${name}:`, err.message);
        });
    }

    return { success: true, repository: newRepo };
  }, [repositories]);

  /**
   * Updates user-editable or cached fields of an existing repository.
   */
  const updateRepository = useCallback((id, updates) => {
    let updatedRepo = null;
    setRepositories(prev => prev.map(repo => {
      if (repo.id !== id) return repo;
      updatedRepo = {
        ...repo,
        ...updates,
        // Prevent accidental overwriting of core identity keys
        id: repo.id,
        fullName: repo.fullName,
        canonicalUrl: repo.canonicalUrl,
        savedAt: repo.savedAt
      };
      return updatedRepo;
    }));

    if (updatedRepo && isIndexedDBSupported()) {
      repositoryRepository.save(updatedRepo).catch(console.warn);
    }
  }, []);

  /**
   * Deletes a repository permanently from the hub.
   */
  const deleteRepository = useCallback((id) => {
    setRepositories(prev => prev.filter(r => r.id !== id));
    if (isIndexedDBSupported()) {
      repositoryRepository.delete(id).catch(console.warn);
    }
  }, []);

  /**
   * Toggles the favorite status of a repository.
   */
  const toggleFavoriteRepo = useCallback((id) => {
    setRepositories(prev => {
      const updated = prev.map(repo => {
        if (repo.id !== id) return repo;
        return { ...repo, isFavorite: !repo.isFavorite };
      });
      const target = updated.find(r => r.id === id);
      if (target && isIndexedDBSupported()) {
        repositoryRepository.save(target).catch(console.warn);
      }
      return updated;
    });
  }, []);

  /**
   * Toggles the pinned status of a repository.
   */
  const togglePinRepo = useCallback((id) => {
    setRepositories(prev => {
      const updated = prev.map(repo => {
        if (repo.id !== id) return repo;
        return { ...repo, isPinned: !repo.isPinned };
      });
      const target = updated.find(r => r.id === id);
      if (target && isIndexedDBSupported()) {
        repositoryRepository.save(target).catch(console.warn);
      }
      return updated;
    });
  }, []);

  /**
   * Updates the lifecycle status of a repository.
   */
  const updateRepoStatus = useCallback((id, newStatus) => {
    if (!REPO_STATUSES[newStatus]) return;
    setRepositories(prev => {
      const updated = prev.map(repo => {
        if (repo.id !== id) return repo;
        return { ...repo, status: newStatus };
      });
      const target = updated.find(r => r.id === id);
      if (target && isIndexedDBSupported()) {
        repositoryRepository.save(target).catch(console.warn);
      }
      return updated;
    });
  }, []);

  /**
   * Refreshes upstream metadata for a specific repository.
   * STRICT GUARANTEE: Never overwrites personal notes, status, tags, collections, or favorites.
   */
  const refreshRepoMetadata = useCallback(async (id) => {
    const target = repositories.find(r => r.id === id);
    if (!target) throw new Error('Repository not found in local hub.');

    const fresh = await fetchRepoMetadata(target.owner, target.name);

    let updatedRepo = null;
    setRepositories(prev => prev.map(repo => {
      if (repo.id !== id) return repo;
      updatedRepo = {
        ...repo,
        githubId: fresh.githubId ?? repo.githubId,
        description: fresh.description,
        primaryLanguage: fresh.primaryLanguage,
        topics: fresh.topics,
        stars: fresh.stars,
        forks: fresh.forks,
        openIssues: fresh.openIssues,
        license: fresh.license,
        defaultBranch: fresh.defaultBranch,
        pushedAt: fresh.pushedAt,
        lastSyncedAt: Date.now(),
        // Explicitly preserve all user customizations:
        personalNotes: repo.personalNotes,
        status: repo.status,
        tags: repo.tags,
        isFavorite: repo.isFavorite,
        isPinned: repo.isPinned,
        collections: repo.collections,
        savedAt: repo.savedAt
      };
      return updatedRepo;
    }));

    if (updatedRepo && isIndexedDBSupported()) {
      repositoryRepository.save(updatedRepo).catch(console.warn);
    }

    return fresh;
  }, [repositories]);

  /**
   * Computed status counts for filter tabs.
   */
  const statusCounts = useMemo(() => {
    const counts = { all: repositories.length };
    Object.keys(REPO_STATUSES).forEach(key => {
      counts[key] = 0;
    });
    repositories.forEach(repo => {
      const s = repo.status || 'inbox';
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts.inbox++;
      }
    });
    return counts;
  }, [repositories]);

  /**
   * Computed list of unique primary languages and their counts.
   */
  const languageCounts = useMemo(() => {
    const counts = {};
    repositories.forEach(repo => {
      const lang = repo.primaryLanguage || 'Unknown';
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return counts;
  }, [repositories]);

  return {
    repositories,
    setRepositories,
    addRepository,
    updateRepository,
    deleteRepository,
    toggleFavoriteRepo,
    togglePinRepo,
    updateRepoStatus,
    refreshRepoMetadata,
    statusCounts,
    languageCounts
  };
}

