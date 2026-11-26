import Dexie from 'dexie';

export const DB_NAME = 'PromptKeeperDB';
export const DB_VERSION = 2;

/**
 * PromptKeeper 2.0 IndexedDB Schema Definition via Dexie.js v4.
 * Models resources (prompts, repositories, and bookmarks) as first-class citizens
 * alongside many-to-many collections, version history, and offline sync outbox.
 */
export const db = new Dexie(DB_NAME);

db.version(1).stores({
  resources: 'id, type, title, fav, createdAt, updatedAt, isDeleted, syncStatus',
  prompts: 'resourceId, legacyId, category, model, *tags, uses, currentVersion, linkedPromptId',
  repositories: 'resourceId, githubId, owner, name, fullName, canonicalUrl, status, *topics, *tags',
  collections: 'id, name, position',
  resourceCollections: '[resourceId+collectionId], resourceId, collectionId',
  promptVersions: 'id, promptId, versionNumber, createdAt',
  syncOutbox: 'opId, entity, entityId, status, clientTimestamp'
});

db.version(2).stores({
  bookmarks: 'resourceId, url, domain, status, category, *tags'
});

/**
 * Checks whether IndexedDB is available and supported in current runtime environment.
 * @returns {boolean}
 */
export function isIndexedDBSupported() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}
