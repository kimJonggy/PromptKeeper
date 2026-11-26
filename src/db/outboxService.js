import { db, isIndexedDBSupported } from './index.js';
import { generateUUID } from '../utils/uuid.js';

/**
 * OutboxService: Durable, local-first mutation queue for offline sync.
 * Queues, deduplicates, and compacts operations before dispatching to Supabase.
 */
export const outboxService = {
  /**
   * Enqueues a mutation operation with intelligent compaction.
   * 
   * @param {Object} params
   * @param {'prompt' | 'repo' | 'collection' | 'link' | 'version'} params.entity
   * @param {string} params.entityId
   * @param {'INSERT' | 'UPDATE' | 'DELETE'} params.operation
   * @param {Object|null} [params.payload=null]
   * @returns {Promise<string|null>} Generated operation ID (opId)
   */
  async queueMutation({ entity, entityId, operation, payload = null }) {
    if (!isIndexedDBSupported()) return null;

    const strEntityId = String(entityId);
    const now = Date.now();

    // Check for existing pending mutation for this entity + entityId
    const existing = await db.syncOutbox
      .where('entityId')
      .equals(strEntityId)
      .and(item => item.entity === entity && item.status !== 'completed')
      .first();

    if (existing) {
      // 1. If previously INSERT and now DELETE: the item never reached the server; discard both
      if (existing.operation === 'INSERT' && operation === 'DELETE') {
        await db.syncOutbox.delete(existing.opId);
        return null;
      }

      // 2. If previously INSERT and now UPDATE: update payload but keep operation as INSERT
      if (existing.operation === 'INSERT' && operation === 'UPDATE') {
        await db.syncOutbox.update(existing.opId, {
          payload: { ...existing.payload, ...payload },
          clientTimestamp: now,
          status: 'pending'
        });
        return existing.opId;
      }

      // 3. If previously UPDATE and now UPDATE: merge payloads
      if (existing.operation === 'UPDATE' && operation === 'UPDATE') {
        await db.syncOutbox.update(existing.opId, {
          payload: { ...existing.payload, ...payload },
          clientTimestamp: now,
          status: 'pending'
        });
        return existing.opId;
      }

      // 4. If previously UPDATE and now DELETE: change operation to DELETE
      if (existing.operation === 'UPDATE' && operation === 'DELETE') {
        await db.syncOutbox.update(existing.opId, {
          operation: 'DELETE',
          payload: null,
          clientTimestamp: now,
          status: 'pending'
        });
        return existing.opId;
      }
    }

    // New operation record
    const opId = generateUUID();
    await db.syncOutbox.put({
      opId,
      entity,
      entityId: strEntityId,
      operation,
      payload,
      clientTimestamp: now,
      retryCount: 0,
      lastError: null,
      status: 'pending'
    });

    return opId;
  },

  /**
   * Retrieves pending or failed mutations sorted by timestamp.
   * @returns {Promise<Array<Object>>}
   */
  async getPendingMutations() {
    if (!isIndexedDBSupported()) return [];
    const items = await db.syncOutbox
      .filter(item => item.status === 'pending' || item.status === 'failed')
      .toArray();
    return items.sort((a, b) => a.clientTimestamp - b.clientTimestamp);
  },

  /**
   * Marks a mutation as actively processing.
   * @param {string} opId
   */
  async markMutationProcessing(opId) {
    if (!isIndexedDBSupported()) return;
    await db.syncOutbox.update(opId, { status: 'processing' });
  },

  /**
   * Marks a mutation as successfully delivered to the remote server and deletes it.
   * @param {string} opId
   */
  async markMutationCompleted(opId) {
    if (!isIndexedDBSupported()) return;
    await db.syncOutbox.delete(opId);
  },

  /**
   * Records a failure and updates retry backoff metadata.
   * @param {string} opId
   * @param {string} errorMessage
   */
  async markMutationFailed(opId, errorMessage) {
    if (!isIndexedDBSupported()) return;
    const item = await db.syncOutbox.get(opId);
    if (!item) return;

    await db.syncOutbox.update(opId, {
      status: 'failed',
      retryCount: (item.retryCount || 0) + 1,
      lastError: errorMessage || 'Unknown network error'
    });
  },

  /**
   * Returns current count of queued mutations.
   * @returns {Promise<number>}
   */
  async getOutboxCount() {
    if (!isIndexedDBSupported()) return 0;
    return db.syncOutbox.where('status').anyOf('pending', 'failed').count();
  },

  /**
   * Clears the entire outbox queue.
   */
  async clearOutbox() {
    if (!isIndexedDBSupported()) return;
    await db.syncOutbox.clear();
  }
};

