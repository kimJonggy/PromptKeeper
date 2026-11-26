import { supabase, isSupabaseConfigured, getCurrentUser } from './supabaseClient.js';
import { outboxService } from '../db/outboxService.js';
import { promptRepository, repositoryRepository } from '../db/repository.js';
import { generateUUID } from '../utils/uuid.js';

export const LAST_PULLED_KEY = 'pk_last_pulled_at';

class SyncEngine {
  constructor() {
    this.status = 'idle'; // 'idle' | 'syncing' | 'offline' | 'error' | 'synced'
    this.lastSyncedAt = null;
    this.listeners = new Set();
    this.syncIntervalId = null;
    this.retryDelay = 1000; // ms
    this.maxRetryDelay = 60000;
    this.isSyncing = false;

    // Listen to online / offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.notifyStatus('idle');
        this.syncNow().catch(console.warn);
      });
      window.addEventListener('offline', () => {
        this.notifyStatus('offline');
      });
    }
  }

  /**
   * Subscribe to sync status changes.
   * @param {Function} listener
   * @returns {Function} unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  /**
   * Returns current sync state snapshot.
   */
  getState() {
    return {
      status: this.status,
      lastSyncedAt: this.lastSyncedAt,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true
    };
  }

  notifyStatus(status) {
    this.status = status;
    const state = this.getState();
    this.listeners.forEach(fn => {
      try { fn(state); } catch (e) { console.warn(e); }
    });
  }

  /**
   * Starts periodic sync background worker.
   * @param {number} [intervalMs=30000]
   */
  start(intervalMs = 30000) {
    if (this.syncIntervalId) clearInterval(this.syncIntervalId);
    this.syncIntervalId = setInterval(() => {
      this.syncNow().catch(console.warn);
    }, intervalMs);
    // Initial sync
    this.syncNow().catch(console.warn);
  }

  /**
   * Stops periodic sync background worker.
   */
  stop() {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Triggers an immediate bidirectional sync cycle.
   * @returns {Promise<{ pushed: number, pulled: number, error?: string }>}
   */
  async syncNow() {
    if (this.isSyncing) return { pushed: 0, pulled: 0 };
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.notifyStatus('offline');
      return { pushed: 0, pulled: 0 };
    }
    if (!isSupabaseConfigured() || !supabase) {
      this.notifyStatus('idle');
      return { pushed: 0, pulled: 0 };
    }

    const user = await getCurrentUser();
    if (!user) {
      this.notifyStatus('idle');
      return { pushed: 0, pulled: 0 };
    }

    this.isSyncing = true;
    this.notifyStatus('syncing');

    let pushed = 0;
    let pulled = 0;

    try {
      // 1. Push Phase: Process pending mutations in outbox
      pushed = await this.pushOutboxMutations(user);

      // 2. Pull Phase: Fetch remote changes since last pull
      pulled = await this.pullRemoteChanges(user);

      this.lastSyncedAt = Date.now();
      this.retryDelay = 1000; // Reset backoff on success
      this.notifyStatus('synced');
      return { pushed, pulled };
    } catch (err) {
      console.warn('Sync cycle encounter:', err);
      this.notifyStatus('error');
      // Exponential backoff
      this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetryDelay);
      return { pushed, pulled, error: err.message || String(err) };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Pushes queued mutations from local outbox to Supabase.
   * @param {Object} user
   * @returns {Promise<number>} count of pushed mutations
   */
  async pushOutboxMutations(user) {
    const pending = await outboxService.getPendingMutations();
    let count = 0;

    for (const item of pending) {
      await outboxService.markMutationProcessing(item.opId);

      try {
        if (item.entity === 'prompt') {
          if (item.operation === 'DELETE') {
            await supabase.from('resources').delete().match({ id: item.entityId, user_id: user.id });
          } else if (item.payload) {
            const p = item.payload;
            const updatedIso = new Date(p.updatedAt || Date.now()).toISOString();
            
            // Upsert resource base
            const { error: resErr } = await supabase.from('resources').upsert({
              id: item.entityId,
              user_id: user.id,
              type: 'prompt',
              title: p.title || 'Untitled Prompt',
              fav: Boolean(p.fav),
              is_deleted: false,
              sync_status: 'synced',
              updated_at: updatedIso
            });
            if (resErr) throw resErr;

            // Upsert prompt details
            const { error: promptErr } = await supabase.from('prompts').upsert({
              resource_id: item.entityId,
              user_id: user.id,
              legacy_id: p.legacyId ? String(p.legacyId) : null,
              category: p.category || 'General',
              model: p.model || 'Universal',
              tags: Array.isArray(p.tags) ? p.tags : [],
              uses: Number(p.uses) || 0,
              current_version: p.currentVersion || 1,
              body: p.body || '',
              notes: p.notes || '',
              thumbnail: p.thumbnail || null,
              images: Array.isArray(p.images) ? p.images : [],
              linked_prompt_id: p.linkedPromptId || null,
              linked_repo_ids: Array.isArray(p.linkedRepoIds) ? p.linkedRepoIds : []
            });
            if (promptErr) throw promptErr;
          }
        } else if (item.entity === 'repo') {
          if (item.operation === 'DELETE') {
            await supabase.from('resources').delete().match({ id: item.entityId, user_id: user.id });
          } else if (item.payload) {
            const r = item.payload;
            const updatedIso = new Date(r.lastSyncedAt || Date.now()).toISOString();

            const { error: resErr } = await supabase.from('resources').upsert({
              id: item.entityId,
              user_id: user.id,
              type: 'repo',
              title: r.fullName || r.name || 'Untitled Repository',
              fav: Boolean(r.isFavorite),
              is_deleted: false,
              sync_status: 'synced',
              updated_at: updatedIso
            });
            if (resErr) throw resErr;

            const { error: repoErr } = await supabase.from('repositories').upsert({
              resource_id: item.entityId,
              user_id: user.id,
              github_id: r.githubId || null,
              owner: r.owner || '',
              name: r.name || '',
              full_name: r.fullName || '',
              canonical_url: r.canonicalUrl || '',
              description: r.description || '',
              primary_language: r.primaryLanguage || 'Unknown',
              topics: Array.isArray(r.topics) ? r.topics : [],
              stars: Number(r.stars) || 0,
              forks: Number(r.forks) || 0,
              open_issues: Number(r.openIssues) || 0,
              license: r.license || null,
              status: r.status || 'inbox',
              personal_notes: r.personalNotes || '',
              tags: Array.isArray(r.tags) ? r.tags : [],
              is_pinned: Boolean(r.isPinned),
              default_branch: r.defaultBranch || 'main'
            });
            if (repoErr) throw repoErr;
          }
        } else if (item.entity === 'collection') {
          if (item.operation === 'DELETE') {
            await supabase.from('collections').delete().match({ id: item.entityId, user_id: user.id });
          } else if (item.payload) {
            const c = item.payload;
            const { error: colErr } = await supabase.from('collections').upsert({
              id: item.entityId,
              user_id: user.id,
              name: c.name,
              color: c.color || '#6366f1',
              icon: c.icon || 'folder',
              position: typeof c.position === 'number' ? c.position : 0
            });
            if (colErr) throw colErr;
          }
        }

        // Successfully pushed
        await outboxService.markMutationCompleted(item.opId);
        count++;
      } catch (err) {
        await outboxService.markMutationFailed(item.opId, err.message || String(err));
        console.warn(`Failed syncing mutation ${item.opId}:`, err);
      }
    }

    return count;
  }

  /**
   * Pulls recent changes from Supabase down to local IndexedDB.
   * Handles non-destructive branch conflict resolution.
   * 
   * @param {Object} user
   * @returns {Promise<number>} count of pulled items
   */
  async pullRemoteChanges(user) {
    const lastPulled = localStorage.getItem(LAST_PULLED_KEY) || '1970-01-01T00:00:00Z';
    const nowIso = new Date().toISOString();

    // Query resources updated since last pull
    const { data: remoteResources, error } = await supabase
      .from('resources')
      .select('id, type, title, fav, is_deleted, updated_at')
      .eq('user_id', user.id)
      .gt('updated_at', lastPulled);

    if (error) throw error;
    if (!remoteResources || remoteResources.length === 0) {
      localStorage.setItem(LAST_PULLED_KEY, nowIso);
      return 0;
    }

    const pendingMutations = await outboxService.getPendingMutations();
    const pendingEntityIds = new Set(pendingMutations.map(m => m.entityId));

    let pulledCount = 0;

    for (const r of remoteResources) {
      const hasConflict = pendingEntityIds.has(r.id);

      if (r.type === 'prompt') {
        const { data: pData } = await supabase
          .from('prompts')
          .select('*')
          .eq('resource_id', r.id)
          .single();

        if (pData) {
          if (hasConflict) {
            // Non-destructive conflict handling:
            // Local has pending unpushed edits AND remote has changed.
            // Branch remote version into a conflict snapshot copy so user loses nothing.
            await promptRepository.save({
              id: generateUUID(),
              title: `${r.title} (Cloud Sync Conflict)`,
              body: pData.body,
              category: pData.category,
              model: pData.model,
              tags: [...(pData.tags || []), 'sync-conflict'],
              fav: false,
              notes: `Auto-preserved conflicting version downloaded at ${new Date().toLocaleString()}.\n\nOriginal notes:\n${pData.notes || ''}`
            });
          } else {
            // Apply remote update locally
            await promptRepository.save({
              id: r.id,
              legacyId: pData.legacy_id,
              title: r.title,
              body: pData.body,
              category: pData.category,
              model: pData.model,
              tags: pData.tags || [],
              fav: r.fav,
              uses: pData.uses || 0,
              notes: pData.notes || '',
              thumbnail: pData.thumbnail,
              images: pData.images || [],
              linkedPromptId: pData.linked_prompt_id,
              linkedRepoIds: pData.linked_repo_ids || []
            });
          }
          pulledCount++;
        }
      } else if (r.type === 'repo') {
        const { data: repoData } = await supabase
          .from('repositories')
          .select('*')
          .eq('resource_id', r.id)
          .single();

        if (repoData && !hasConflict) {
          await repositoryRepository.save({
            id: r.id,
            githubId: repoData.github_id,
            owner: repoData.owner,
            name: repoData.name,
            fullName: repoData.full_name,
            canonicalUrl: repoData.canonical_url,
            description: repoData.description,
            primaryLanguage: repoData.primary_language,
            topics: repoData.topics || [],
            stars: repoData.stars || 0,
            forks: repoData.forks || 0,
            openIssues: repoData.open_issues || 0,
            license: repoData.license,
            status: repoData.status,
            personalNotes: repoData.personal_notes,
            tags: repoData.tags || [],
            isFavorite: r.fav,
            isPinned: repoData.is_pinned,
            defaultBranch: repoData.default_branch
          });
          pulledCount++;
        }
      }
    }

    localStorage.setItem(LAST_PULLED_KEY, nowIso);
    return pulledCount;
  }
}

export const syncEngine = new SyncEngine();

