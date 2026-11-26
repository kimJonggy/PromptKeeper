import { db, isIndexedDBSupported } from './index.js';
import { generateUUID } from '../utils/uuid.js';
import { validatePrompt } from '../utils/validation.js';

export const MIGRATION_FLAG_KEY = 'pk_migrated_v2';
export const STORAGE_DRIVER_KEY = 'pk_storage_driver'; // 'indexeddb' | 'localstorage'

/**
 * Migration result structure
 * @typedef {Object} MigrationReport
 * @property {boolean} success
 * @property {number} promptsCount
 * @property {number} reposCount
 * @property {number} collectionsCount
 * @property {number} linksCount
 * @property {number} versionsCount
 * @property {string[]} errors
 */

/**
 * Reads legacy records from localStorage safely.
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
function readLocalStorageJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Failed reading ${key} from localStorage:`, err);
    return fallback;
  }
}

/**
 * Executes the full, non-destructive legacy data migration into IndexedDB.
 * Preserves legacy localStorage keys untouched.
 * 
 * @param {Object} [options]
 * @param {boolean} [options.force=false] Force re-migration even if already flagged
 * @returns {Promise<MigrationReport>}
 */
export async function migrateLegacyDataToIndexedDB({ force = false } = {}) {
  const report = {
    success: false,
    promptsCount: 0,
    reposCount: 0,
    collectionsCount: 0,
    linksCount: 0,
    versionsCount: 0,
    errors: []
  };

  if (!isIndexedDBSupported()) {
    report.errors.push('IndexedDB is not supported in this environment.');
    return report;
  }

  // Check if already migrated and not forced
  const alreadyMigrated = localStorage.getItem(MIGRATION_FLAG_KEY) === 'true';
  if (alreadyMigrated && !force) {
    try {
      const pCount = await db.prompts.count();
      const rCount = await db.repositories.count();
      report.success = true;
      report.promptsCount = pCount;
      report.reposCount = rCount;
      return report;
    } catch (err) {
      console.warn('Error reading existing IndexedDB count, re-running migration verification:', err);
    }
  }

  // 1. Read source data from localStorage
  const rawPrompts = readLocalStorageJSON('pk_prompts_v2', null) || readLocalStorageJSON('pk_prompts', []);
  const rawRepos = readLocalStorageJSON('pk_repositories', []);
  const rawCategories = readLocalStorageJSON('pk_categories', ['All', 'Coding', 'Creative', 'Academic', 'Business', 'Tools']);
  const rawCatColors = readLocalStorageJSON('pk_cat_colors', {});

  const legacyPrompts = Array.isArray(rawPrompts) ? rawPrompts : [];
  const legacyRepos = Array.isArray(rawRepos) ? rawRepos : [];
  const legacyCategories = Array.isArray(rawCategories) ? rawCategories : [];

  // ID mapping lookup: legacyId -> new UUID
  const legacyIdToUUID = new Map();

  // First pass: assign UUIDs to prompts
  legacyPrompts.forEach(p => {
    if (!p) return;
    const originalId = String(p.id ?? '');
    // If id is already a valid UUID format, preserve it, otherwise generate a UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(originalId);
    const newUUID = isUUID ? originalId : generateUUID();
    legacyIdToUUID.set(originalId, newUUID);
  });

  // Prepare database items
  const resourcesToWrite = [];
  const promptsToWrite = [];
  const repositoriesToWrite = [];
  const collectionsToWrite = [];
  const resourceCollectionsToWrite = [];
  const promptVersionsToWrite = [];

  // 2. Prepare Collections
  const categoryCollectionMap = new Map();
  legacyCategories.forEach((catName, idx) => {
    if (!catName || catName === 'All') return;
    const colId = `col-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    categoryCollectionMap.set(catName, colId);

    collectionsToWrite.push({
      id: colId,
      name: catName,
      color: rawCatColors[catName] || '#6366f1',
      icon: 'folder',
      position: idx,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
  });

  // 3. Prepare Prompts
  legacyPrompts.forEach(p => {
    if (!p) return;
    const { sanitized } = validatePrompt(p);
    const originalIdStr = String(p.id ?? '');
    const resourceId = legacyIdToUUID.get(originalIdStr) || generateUUID();
    const createdTimestamp = Number(sanitized.created) || Date.now();

    // Map linked prompt ID
    let mappedLinkedPromptId = null;
    if (sanitized.linkedPromptId) {
      const origLinkedStr = String(sanitized.linkedPromptId);
      mappedLinkedPromptId = legacyIdToUUID.get(origLinkedStr) || origLinkedStr;
    }

    // Base resource
    resourcesToWrite.push({
      id: resourceId,
      type: 'prompt',
      title: sanitized.title || 'Untitled Prompt',
      fav: sanitized.fav ? 1 : 0,
      createdAt: createdTimestamp,
      updatedAt: Date.now(),
      isDeleted: 0,
      syncStatus: 'synced'
    });

    // Prompt entity
    promptsToWrite.push({
      resourceId,
      legacyId: originalIdStr,
      category: sanitized.category || 'General',
      model: sanitized.model || 'Universal',
      tags: sanitized.tags || [],
      uses: sanitized.uses || 0,
      currentVersion: sanitized.currentVersion || (Array.isArray(sanitized.versions) ? sanitized.versions.length + 1 : 1),
      body: sanitized.body || '',
      notes: sanitized.notes || '',
      thumbnail: sanitized.thumbnail || null,
      images: sanitized.images || [],
      presets: sanitized.presets || [],
      variableConfig: sanitized.variableConfig || null,
      linkedPromptId: mappedLinkedPromptId,
      linkedRepoIds: sanitized.linkedRepoIds || [],
      history: sanitized.history || []
    });

    // Extract version history if present
    if (Array.isArray(sanitized.versions)) {
      sanitized.versions.forEach((v, vIdx) => {
        if (!v) return;
        promptVersionsToWrite.push({
          id: generateUUID(),
          promptId: resourceId,
          versionNumber: v.version || (sanitized.versions.length - vIdx),
          title: v.title || sanitized.title,
          body: v.body || sanitized.body,
          notes: v.note || v.notes || '',
          createdAt: v.timestamp || createdTimestamp,
          commitMessage: v.note || 'Snapshot before update'
        });
      });
    }

    // Map to collections
    const assignedCollections = new Set();
    if (sanitized.category && sanitized.category !== 'All') {
      assignedCollections.add(sanitized.category);
    }
    if (Array.isArray(sanitized.collections)) {
      sanitized.collections.forEach(c => assignedCollections.add(c));
    }

    assignedCollections.forEach(catName => {
      let colId = categoryCollectionMap.get(catName);
      if (!colId) {
        // Create collection if missing
        colId = `col-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        categoryCollectionMap.set(catName, colId);
        collectionsToWrite.push({
          id: colId,
          name: catName,
          color: rawCatColors[catName] || '#6366f1',
          icon: 'folder',
          position: collectionsToWrite.length,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      }
      resourceCollectionsToWrite.push({
        resourceId,
        collectionId: colId,
        addedAt: createdTimestamp
      });
    });
  });

  // 4. Prepare Repositories
  legacyRepos.forEach(repo => {
    if (!repo) return;
    const repoId = repo.id || generateUUID();
    const createdTimestamp = typeof repo.savedAt === 'number' ? repo.savedAt : Date.now();

    resourcesToWrite.push({
      id: repoId,
      type: 'repo',
      title: repo.fullName || repo.name || 'Untitled Repository',
      fav: repo.isFavorite ? 1 : 0,
      createdAt: createdTimestamp,
      updatedAt: repo.lastSyncedAt || Date.now(),
      isDeleted: 0,
      syncStatus: 'synced'
    });

    repositoriesToWrite.push({
      resourceId: repoId,
      githubId: repo.githubId || null,
      owner: repo.owner || '',
      name: repo.name || '',
      fullName: repo.fullName || '',
      canonicalUrl: repo.canonicalUrl || '',
      description: repo.description || '',
      primaryLanguage: repo.primaryLanguage || '',
      topics: Array.isArray(repo.topics) ? repo.topics : [],
      stars: Number(repo.stars) || 0,
      forks: Number(repo.forks) || 0,
      openIssues: Number(repo.openIssues) || 0,
      license: repo.license || null,
      pushedAt: repo.pushedAt || null,
      lastSyncedAt: repo.lastSyncedAt || Date.now(),
      status: repo.status || 'inbox',
      personalNotes: repo.personalNotes || '',
      tags: Array.isArray(repo.tags) ? repo.tags : [],
      isPinned: Boolean(repo.isPinned),
      defaultBranch: repo.defaultBranch || 'main'
    });

    // Map repo collections
    if (Array.isArray(repo.collections)) {
      repo.collections.forEach(catName => {
        let colId = categoryCollectionMap.get(catName);
        if (!colId) {
          colId = `col-${catName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          categoryCollectionMap.set(catName, colId);
          collectionsToWrite.push({
            id: colId,
            name: catName,
            color: rawCatColors[catName] || '#6366f1',
            icon: 'folder',
            position: collectionsToWrite.length,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
        }
        resourceCollectionsToWrite.push({
          resourceId: repoId,
          collectionId: colId,
          addedAt: createdTimestamp
        });
      });
    }
  });

  // 5. Atomic IndexedDB Transaction
  try {
    await db.transaction(
      'rw',
      [
        db.resources,
        db.prompts,
        db.repositories,
        db.collections,
        db.resourceCollections,
        db.promptVersions
      ],
      async () => {
        // Clear old records if re-migrating
        await db.resources.clear();
        await db.prompts.clear();
        await db.repositories.clear();
        await db.collections.clear();
        await db.resourceCollections.clear();
        await db.promptVersions.clear();

        // Write batch
        if (resourcesToWrite.length > 0) await db.resources.bulkPut(resourcesToWrite);
        if (promptsToWrite.length > 0) await db.prompts.bulkPut(promptsToWrite);
        if (repositoriesToWrite.length > 0) await db.repositories.bulkPut(repositoriesToWrite);
        if (collectionsToWrite.length > 0) await db.collections.bulkPut(collectionsToWrite);
        if (resourceCollectionsToWrite.length > 0) await db.resourceCollections.bulkPut(resourceCollectionsToWrite);
        if (promptVersionsToWrite.length > 0) await db.promptVersions.bulkPut(promptVersionsToWrite);
      }
    );

    // 6. Integrity Verification (TASK-405)
    const promptsInDb = await db.prompts.count();
    const reposInDb = await db.repositories.count();
    const resourcesInDb = await db.resources.count();

    if (promptsInDb !== promptsToWrite.length) {
      throw new Error(`Integrity check failed: Expected ${promptsToWrite.length} prompts, got ${promptsInDb}`);
    }
    if (reposInDb !== repositoriesToWrite.length) {
      throw new Error(`Integrity check failed: Expected ${repositoriesToWrite.length} repositories, got ${reposInDb}`);
    }
    if (resourcesInDb !== (promptsToWrite.length + repositoriesToWrite.length)) {
      throw new Error(`Integrity check failed: Total resources mismatch. Expected ${promptsToWrite.length + repositoriesToWrite.length}, got ${resourcesInDb}`);
    }

    // Spot-check sample prompt if any exist
    if (promptsToWrite.length > 0) {
      const sample = await db.prompts.get(promptsToWrite[0].resourceId);
      if (!sample || sample.category !== promptsToWrite[0].category) {
        throw new Error('Integrity check failed: Sample prompt record verification did not match source data.');
      }
    }

    // Migration succeeded! Set completion flags
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    localStorage.setItem(STORAGE_DRIVER_KEY, 'indexeddb');

    report.success = true;
    report.promptsCount = promptsInDb;
    report.reposCount = reposInDb;
    report.collectionsCount = collectionsToWrite.length;
    report.linksCount = resourceCollectionsToWrite.length;
    report.versionsCount = promptVersionsToWrite.length;

    return report;
  } catch (err) {
    report.success = false;
    report.errors.push(err.message || String(err));
    // Rollback flag to localStorage mode on failure
    localStorage.setItem(STORAGE_DRIVER_KEY, 'localstorage');
    console.error('IndexedDB migration failed, falling back to localStorage:', err);
    return report;
  }
}

/**
 * Checks integrity of current IndexedDB store against expected counts.
 * @returns {Promise<{ ok: boolean, promptsCount: number, reposCount: number, error?: string }>}
 */
export async function verifyDatabaseIntegrity() {
  if (!isIndexedDBSupported()) {
    return { ok: false, promptsCount: 0, reposCount: 0, error: 'IndexedDB unsupported' };
  }
  try {
    const promptsCount = await db.prompts.count();
    const reposCount = await db.repositories.count();
    const resourcesCount = await db.resources.count();
    const ok = resourcesCount === (promptsCount + reposCount);
    return { ok, promptsCount, reposCount };
  } catch (err) {
    return { ok: false, promptsCount: 0, reposCount: 0, error: err.message };
  }
}

/**
 * Export full database contents as a unified JSON backup object.
 * @returns {Promise<Object>}
 */
export async function exportAllData() {
  if (!isIndexedDBSupported()) {
    return {
      version: '2.0',
      timestamp: Date.now(),
      driver: 'localstorage',
      prompts: readLocalStorageJSON('pk_prompts_v2', []),
      repositories: readLocalStorageJSON('pk_repositories', []),
      bookmarks: readLocalStorageJSON('pk_bookmarks', []),
      categories: readLocalStorageJSON('pk_categories', []),
      colors: readLocalStorageJSON('pk_cat_colors', {})
    };
  }

  const [resources, prompts, repositories, collections, resourceCollections, promptVersions, bookmarks] = await Promise.all([
    db.resources.toArray(),
    db.prompts.toArray(),
    db.repositories.toArray(),
    db.collections.toArray(),
    db.resourceCollections.toArray(),
    db.promptVersions.toArray(),
    db.bookmarks ? db.bookmarks.toArray() : Promise.resolve([])
  ]);

  return {
    version: '2.0',
    timestamp: Date.now(),
    driver: 'indexeddb',
    resources,
    prompts,
    repositories,
    bookmarks,
    collections,
    resourceCollections,
    promptVersions
  };
}

