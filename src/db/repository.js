import { db, isIndexedDBSupported } from './index.js';
import { generateUUID, ensureUUID } from '../utils/uuid.js';
import { validatePrompt, validateBookmark } from '../utils/validation.js';
import { outboxService } from './outboxService.js';

/**
 * PromptRepository: Handles IndexedDB CRUD operations for prompts
 * while presenting a clean, unified prompt model to UI components.
 */
export const promptRepository = {
  /**
   * Retrieves all prompts joined with their resource metadata, collections, and versions.
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    if (!isIndexedDBSupported()) return [];

    const [resources, prompts, allResourceCollections, collections, versions] = await Promise.all([
      db.resources.where('type').equals('prompt').toArray(),
      db.prompts.toArray(),
      db.resourceCollections.toArray(),
      db.collections.toArray(),
      db.promptVersions.toArray()
    ]);

    const resourceMap = new Map(resources.map(r => [r.id, r]));
    const collectionNameMap = new Map(collections.map(c => [c.id, c.name]));

    // Group collections by resourceId
    const resColMap = new Map();
    allResourceCollections.forEach(rc => {
      const list = resColMap.get(rc.resourceId) || [];
      const colName = collectionNameMap.get(rc.collectionId);
      if (colName) list.push(colName);
      resColMap.set(rc.resourceId, list);
    });

    // Group versions by promptId
    const versionMap = new Map();
    versions.forEach(v => {
      const list = versionMap.get(v.promptId) || [];
      list.push({
        id: v.id,
        version: v.versionNumber,
        title: v.title,
        body: v.body,
        note: v.commitMessage || v.notes || '',
        timestamp: v.createdAt
      });
      versionMap.set(v.promptId, list);
    });

    return prompts.map(p => {
      const res = resourceMap.get(p.resourceId) || {};
      const promptVersions = (versionMap.get(p.resourceId) || []).sort((a, b) => b.version - a.version);

      return {
        id: p.resourceId,
        legacyId: p.legacyId,
        title: res.title || 'Untitled Prompt',
        body: p.body || '',
        category: p.category || 'General',
        model: p.model || 'Universal',
        tags: p.tags || [],
        fav: Boolean(res.fav),
        uses: p.uses || 0,
        created: res.createdAt || Date.now(),
        updatedAt: res.updatedAt || Date.now(),
        history: p.history || [],
        notes: p.notes || '',
        thumbnail: p.thumbnail || null,
        images: p.images || [],
        presets: p.presets || [],
        variableConfig: p.variableConfig || null,
        linkedPromptId: p.linkedPromptId || null,
        linkedRepoIds: p.linkedRepoIds || [],
        collections: resColMap.get(p.resourceId) || (p.category && p.category !== 'All' ? [p.category] : []),
        versions: promptVersions,
        currentVersion: p.currentVersion || 1
      };
    });
  },

  /**
   * Saves or updates a single prompt in Dexie.
   * @param {Object} rawPrompt
   * @param {Object} [options={}] Options such as { skipOutbox: true }
   * @returns {Promise<Object>} The saved composite prompt object
   */
  async save(rawPrompt, options = {}) {
    if (!isIndexedDBSupported()) return rawPrompt;

    const { sanitized } = validatePrompt(rawPrompt);
    const resourceId = sanitized.id ? ensureUUID(sanitized.id) : generateUUID();
    const now = Date.now();
    const createdTimestamp = Number(sanitized.created) || now;

    await db.transaction(
      'rw',
      [db.resources, db.prompts, db.resourceCollections, db.promptVersions],
      async () => {
        // Upsert Resource
        await db.resources.put({
          id: resourceId,
          type: 'prompt',
          title: sanitized.title || 'Untitled Prompt',
          fav: sanitized.fav ? 1 : 0,
          createdAt: createdTimestamp,
          updatedAt: now,
          isDeleted: 0,
          syncStatus: 'synced'
        });

        // Upsert Prompt
        await db.prompts.put({
          resourceId,
          legacyId: sanitized.legacyId ? String(sanitized.legacyId) : String(resourceId),
          category: sanitized.category || 'General',
          model: sanitized.model || 'Universal',
          tags: sanitized.tags || [],
          uses: sanitized.uses || 0,
          currentVersion: sanitized.currentVersion || 1,
          body: sanitized.body || '',
          notes: sanitized.notes || '',
          thumbnail: sanitized.thumbnail || null,
          images: sanitized.images || [],
          presets: sanitized.presets || [],
          variableConfig: sanitized.variableConfig || null,
          linkedPromptId: sanitized.linkedPromptId || null,
          linkedRepoIds: sanitized.linkedRepoIds || [],
          history: sanitized.history || []
        });

        // If version snapshot history was passed, persist new ones
        if (Array.isArray(sanitized.versions) && sanitized.versions.length > 0) {
          const versionItems = sanitized.versions.map((v, i) => ({
            id: v.id || generateUUID(),
            promptId: resourceId,
            versionNumber: v.version || (sanitized.versions.length - i),
            title: v.title || sanitized.title,
            body: v.body || sanitized.body,
            notes: v.note || v.notes || '',
            createdAt: v.timestamp || now,
            commitMessage: v.note || 'Snapshot before update'
          }));
          await db.promptVersions.bulkPut(versionItems);
        }
      }
    );

    const compositePrompt = {
      ...sanitized,
      id: resourceId,
      updatedAt: now
    };

    // Queue mutation for offline-first sync unless explicitly skipped (e.g. from cloud pull)
    if (!options.skipOutbox) {
      try {
        await outboxService.queueMutation({
          entity: 'prompt',
          entityId: resourceId,
          operation: 'UPDATE',
          payload: compositePrompt
        });
      } catch (err) {
        console.warn('Failed to queue prompt mutation:', err);
      }
    }

    return compositePrompt;
  },

  /**
   * Deletes a prompt and its related metadata from Dexie.
   * @param {string} id
   */
  async delete(id) {
    if (!isIndexedDBSupported()) return;
    const strId = String(id);

    await db.transaction(
      'rw',
      [db.resources, db.prompts, db.resourceCollections, db.promptVersions],
      async () => {
        await db.resources.delete(strId);
        await db.prompts.delete(strId);
        await db.resourceCollections.where('resourceId').equals(strId).delete();
        await db.promptVersions.where('promptId').equals(strId).delete();

        // Remove linkedPromptId references
        const linkedPrompts = await db.prompts.where('linkedPromptId').equals(strId).toArray();
        for (const lp of linkedPrompts) {
          await db.prompts.update(lp.resourceId, { linkedPromptId: null });
        }
      }
    );

    // Queue delete mutation
    try {
      await outboxService.queueMutation({
        entity: 'prompt',
        entityId: strId,
        operation: 'DELETE'
      });
    } catch (err) {
      console.warn('Failed to queue prompt delete mutation:', err);
    }
  }
};

/**
 * RepositoryRepository: Handles IndexedDB CRUD operations for GitHub repositories
 */
export const repositoryRepository = {
  /**
   * Retrieves all repositories joined with resource metadata.
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    if (!isIndexedDBSupported()) return [];

    const [resources, repos, allResourceCollections, collections] = await Promise.all([
      db.resources.where('type').equals('repo').toArray(),
      db.repositories.toArray(),
      db.resourceCollections.toArray(),
      db.collections.toArray()
    ]);

    const resourceMap = new Map(resources.map(r => [r.id, r]));
    const collectionNameMap = new Map(collections.map(c => [c.id, c.name]));

    const resColMap = new Map();
    allResourceCollections.forEach(rc => {
      const list = resColMap.get(rc.resourceId) || [];
      const colName = collectionNameMap.get(rc.collectionId);
      if (colName) list.push(colName);
      resColMap.set(rc.resourceId, list);
    });

    return repos.map(repo => {
      const res = resourceMap.get(repo.resourceId) || {};
      return {
        id: repo.resourceId,
        githubId: repo.githubId,
        owner: repo.owner,
        name: repo.name,
        fullName: repo.fullName,
        canonicalUrl: repo.canonicalUrl,
        description: repo.description,
        primaryLanguage: repo.primaryLanguage,
        topics: repo.topics || [],
        stars: repo.stars || 0,
        forks: repo.forks || 0,
        openIssues: repo.openIssues || 0,
        license: repo.license,
        pushedAt: repo.pushedAt,
        savedAt: res.createdAt || Date.now(),
        lastSyncedAt: repo.lastSyncedAt || Date.now(),
        status: repo.status || 'inbox',
        personalNotes: repo.personalNotes || '',
        tags: repo.tags || [],
        isFavorite: Boolean(res.fav),
        isPinned: Boolean(repo.isPinned),
        defaultBranch: repo.defaultBranch || 'main',
        collections: resColMap.get(repo.resourceId) || []
      };
    });
  },

  /**
   * Saves or updates a repository in Dexie.
   * @param {Object} repo
   * @param {Object} [options={}] Options such as { skipOutbox: true }
   * @returns {Promise<Object>}
   */
  async save(repo, options = {}) {
    if (!isIndexedDBSupported()) return repo;

    const resourceId = repo.id ? ensureUUID(repo.id) : generateUUID();
    const now = Date.now();
    const savedTimestamp = typeof repo.savedAt === 'number' ? repo.savedAt : now;

    await db.transaction('rw', [db.resources, db.repositories], async () => {
      await db.resources.put({
        id: resourceId,
        type: 'repo',
        title: repo.fullName || repo.name || 'Untitled Repository',
        fav: repo.isFavorite ? 1 : 0,
        createdAt: savedTimestamp,
        updatedAt: now,
        isDeleted: 0,
        syncStatus: 'synced'
      });

      await db.repositories.put({
        resourceId,
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
        lastSyncedAt: repo.lastSyncedAt || now,
        status: repo.status || 'inbox',
        personalNotes: repo.personalNotes || '',
        tags: Array.isArray(repo.tags) ? repo.tags : [],
        isPinned: Boolean(repo.isPinned),
        defaultBranch: repo.defaultBranch || 'main'
      });
    });

    const compositeRepo = {
      ...repo,
      id: resourceId,
      updatedAt: now
    };

    if (!options.skipOutbox) {
      try {
        await outboxService.queueMutation({
          entity: 'repo',
          entityId: resourceId,
          operation: 'UPDATE',
          payload: compositeRepo
        });
      } catch (err) {
        console.warn('Failed to queue repo mutation:', err);
      }
    }

    return compositeRepo;
  },

  /**
   * Deletes a repository from Dexie.
   * @param {string} id
   */
  async delete(id) {
    if (!isIndexedDBSupported()) return;
    const strId = String(id);

    await db.transaction('rw', [db.resources, db.repositories, db.resourceCollections], async () => {
      await db.resources.delete(strId);
      await db.repositories.delete(strId);
      await db.resourceCollections.where('resourceId').equals(strId).delete();
    });

    try {
      await outboxService.queueMutation({
        entity: 'repo',
        entityId: strId,
        operation: 'DELETE'
      });
    } catch (err) {
      console.warn('Failed to queue repo delete mutation:', err);
    }
  }
};

/**
 * CollectionRepository: Handles collection entities and resource links in Dexie
 */
export const collectionRepository = {
  /**
   * Retrieves all collections.
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    if (!isIndexedDBSupported()) return [];
    return db.collections.orderBy('position').toArray();
  },

  /**
   * Saves or updates a collection.
   * @param {Object} col
   * @param {Object} [options={}] Options such as { skipOutbox: true }
   */
  async save(col, options = {}) {
    if (!isIndexedDBSupported()) return col;
    const id = col.id || `col-${col.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const now = Date.now();
    await db.collections.put({
      id,
      name: col.name,
      color: col.color || '#6366f1',
      icon: col.icon || 'folder',
      position: typeof col.position === 'number' ? col.position : 0,
      createdAt: col.createdAt || now,
      updatedAt: now
    });

    const compositeCol = { ...col, id, updatedAt: now };
    if (!options.skipOutbox) {
      try {
        await outboxService.queueMutation({
          entity: 'collection',
          entityId: id,
          operation: 'UPDATE',
          payload: compositeCol
        });
      } catch (err) {
        console.warn('Failed to queue collection mutation:', err);
      }
    }

    return compositeCol;
  },

  /**
   * Deletes a collection and unlinks resources.
   * @param {string} id
   */
  async delete(id) {
    if (!isIndexedDBSupported()) return;
    await db.transaction('rw', [db.collections, db.resourceCollections], async () => {
      await db.collections.delete(id);
      await db.resourceCollections.where('collectionId').equals(id).delete();
    });

    try {
      await outboxService.queueMutation({
        entity: 'collection',
        entityId: id,
        operation: 'DELETE'
      });
    } catch (err) {
      console.warn('Failed to queue collection delete mutation:', err);
    }
  },

  /**
   * Links a resource (prompt or repo) to a collection.
   * @param {string} resourceId
   * @param {string} collectionId
   */
  async link(resourceId, collectionId) {
    if (!isIndexedDBSupported()) return;
    await db.resourceCollections.put({
      resourceId: String(resourceId),
      collectionId: String(collectionId),
      addedAt: Date.now()
    });
  },

  /**
   * Unlinks a resource from a collection.
   * @param {string} resourceId
   * @param {string} collectionId
   */
  async unlink(resourceId, collectionId) {
    if (!isIndexedDBSupported()) return;
    await db.resourceCollections
      .where('[resourceId+collectionId]')
      .equals([String(resourceId), String(collectionId)])
      .delete();
  }
};

/**
 * BookmarkRepository: Handles IndexedDB CRUD operations for website bookmarks & notes.
 */
export const bookmarkRepository = {
  /**
   * Retrieves all bookmarks joined with their resource metadata and collections.
   * @returns {Promise<Array<Object>>}
   */
  async getAll() {
    if (!isIndexedDBSupported() || !db.bookmarks) return [];

    const [resources, bookmarks, allResourceCollections, collections] = await Promise.all([
      db.resources.where('type').equals('bookmark').toArray(),
      db.bookmarks.toArray(),
      db.resourceCollections.toArray(),
      db.collections.toArray()
    ]);

    const resourceMap = new Map(resources.map(r => [r.id, r]));
    const collectionNameMap = new Map(collections.map(c => [c.id, c.name]));

    const resColMap = new Map();
    allResourceCollections.forEach(rc => {
      const list = resColMap.get(rc.resourceId) || [];
      const colName = collectionNameMap.get(rc.collectionId);
      if (colName) list.push(colName);
      resColMap.set(rc.resourceId, list);
    });

    return bookmarks.map(bm => {
      const res = resourceMap.get(bm.resourceId) || {};
      return {
        id: bm.resourceId,
        url: bm.url || '',
        title: res.title || bm.title || 'Untitled Bookmark',
        description: bm.description || '',
        personalNotes: bm.personalNotes || '',
        domain: bm.domain || '',
        category: bm.category || 'General',
        tags: Array.isArray(bm.tags) ? bm.tags : [],
        status: bm.status || 'inbox',
        isFavorite: Boolean(res.fav),
        isPinned: Boolean(bm.isPinned),
        createdAt: res.createdAt || Date.now(),
        updatedAt: res.updatedAt || Date.now(),
        collections: resColMap.get(bm.resourceId) || (bm.category && bm.category !== 'All' ? [bm.category] : []),
        linkedPromptIds: Array.isArray(bm.linkedPromptIds) ? bm.linkedPromptIds : [],
        linkedRepoIds: Array.isArray(bm.linkedRepoIds) ? bm.linkedRepoIds : []
      };
    });
  },

  /**
   * Saves or updates a bookmark in Dexie.
   * @param {Object} rawBookmark
   * @param {Object} [options={}] Options such as { skipOutbox: true }
   * @returns {Promise<Object>}
   */
  async save(rawBookmark, options = {}) {
    if (!isIndexedDBSupported() || !db.bookmarks) return rawBookmark;

    const validation = validateBookmark(rawBookmark);
    const bm = validation.sanitized || rawBookmark;
    const resourceId = bm.id || generateUUID();
    const now = Date.now();
    const createdTimestamp = typeof bm.createdAt === 'number' ? bm.createdAt : now;

    await db.transaction('rw', [db.resources, db.bookmarks], async () => {
      await db.resources.put({
        id: resourceId,
        type: 'bookmark',
        title: bm.title || bm.url || 'Untitled Bookmark',
        fav: bm.isFavorite ? 1 : 0,
        createdAt: createdTimestamp,
        updatedAt: now,
        isDeleted: 0,
        syncStatus: 'synced'
      });

      await db.bookmarks.put({
        resourceId,
        url: bm.url,
        title: bm.title || '',
        domain: bm.domain || '',
        description: bm.description || '',
        personalNotes: bm.personalNotes || '',
        category: bm.category || 'General',
        tags: Array.isArray(bm.tags) ? bm.tags : [],
        status: bm.status || 'inbox',
        isPinned: Boolean(bm.isPinned),
        linkedPromptIds: Array.isArray(bm.linkedPromptIds) ? bm.linkedPromptIds : [],
        linkedRepoIds: Array.isArray(bm.linkedRepoIds) ? bm.linkedRepoIds : []
      });
    });

    const compositeBm = {
      ...bm,
      id: resourceId,
      updatedAt: now
    };

    if (!options.skipOutbox) {
      try {
        await outboxService.queueMutation({
          entity: 'bookmark',
          entityId: resourceId,
          operation: 'UPDATE',
          payload: compositeBm
        });
      } catch (err) {
        console.warn('Failed to queue bookmark mutation:', err);
      }
    }

    return compositeBm;
  },

  /**
   * Deletes a bookmark from Dexie.
   * @param {string} resourceId
   */
  async delete(resourceId) {
    if (!isIndexedDBSupported() || !db.bookmarks) return;

    await db.transaction('rw', [db.resources, db.bookmarks, db.resourceCollections], async () => {
      await db.resources.delete(resourceId);
      await db.bookmarks.delete(resourceId);
      await db.resourceCollections.where('resourceId').equals(String(resourceId)).delete();
    });

    try {
      await outboxService.queueMutation({
        entity: 'bookmark',
        entityId: resourceId,
        operation: 'DELETE'
      });
    } catch (err) {
      console.warn('Failed to queue bookmark delete mutation:', err);
    }
  },

  /**
   * Bulk persists bookmarks.
   * @param {Array<Object>} bookmarks
   */
  async bulkPut(bookmarks) {
    if (!isIndexedDBSupported() || !db.bookmarks || !Array.isArray(bookmarks)) return;

    const resourcesToPut = [];
    const bookmarksToPut = [];

    bookmarks.forEach(raw => {
      const validation = validateBookmark(raw);
      const bm = validation.sanitized || raw;
      const resourceId = bm.id || generateUUID();
      const now = Date.now();
      const createdTimestamp = typeof bm.createdAt === 'number' ? bm.createdAt : now;

      resourcesToPut.push({
        id: resourceId,
        type: 'bookmark',
        title: bm.title || bm.url || 'Untitled Bookmark',
        fav: bm.isFavorite ? 1 : 0,
        createdAt: createdTimestamp,
        updatedAt: now,
        isDeleted: 0,
        syncStatus: 'synced'
      });

      bookmarksToPut.push({
        resourceId,
        url: bm.url,
        title: bm.title || '',
        domain: bm.domain || '',
        description: bm.description || '',
        personalNotes: bm.personalNotes || '',
        category: bm.category || 'General',
        tags: Array.isArray(bm.tags) ? bm.tags : [],
        status: bm.status || 'inbox',
        isPinned: Boolean(bm.isPinned),
        linkedPromptIds: Array.isArray(bm.linkedPromptIds) ? bm.linkedPromptIds : [],
        linkedRepoIds: Array.isArray(bm.linkedRepoIds) ? bm.linkedRepoIds : []
      });
    });

    await db.transaction('rw', [db.resources, db.bookmarks], async () => {
      await db.resources.bulkPut(resourcesToPut);
      await db.bookmarks.bulkPut(bookmarksToPut);
    });
  }
};

