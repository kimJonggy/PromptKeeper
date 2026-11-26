import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/index.js';
import { outboxService } from '../src/db/outboxService.js';
import { isSupabaseConfigured } from '../src/services/supabaseClient.js';
import { syncEngine } from '../src/services/syncEngine.js';
import { promptRepository, repositoryRepository } from '../src/db/repository.js';

describe('Phase 5: Outbox Queue & Offline Cloud Sync', () => {
  beforeEach(async () => {
    await db.resources.clear();
    await db.prompts.clear();
    await db.repositories.clear();
    await db.syncOutbox.clear();
  });

  it('correctly evaluates Supabase configuration state', () => {
    // In test environment without .env, isSupabaseConfigured() should be boolean false
    expect(typeof isSupabaseConfigured()).toBe('boolean');
  });

  it('enqueues mutations into syncOutbox with pending status', async () => {
    const opId = await outboxService.queueMutation({
      entity: 'prompt',
      entityId: 'prompt-uuid-1',
      operation: 'INSERT',
      payload: { title: 'Test Prompt', body: 'Test body' }
    });

    expect(opId).toBeDefined();

    const pending = await outboxService.getPendingMutations();
    expect(pending).toHaveLength(1);
    expect(pending[0].entity).toBe('prompt');
    expect(pending[0].entityId).toBe('prompt-uuid-1');
    expect(pending[0].operation).toBe('INSERT');
    expect(pending[0].payload.title).toBe('Test Prompt');
    expect(pending[0].status).toBe('pending');
  });

  it('compacts INSERT followed by UPDATE into a single updated INSERT mutation', async () => {
    await outboxService.queueMutation({
      entity: 'prompt',
      entityId: 'prompt-123',
      operation: 'INSERT',
      payload: { title: 'Original Title', body: 'Original body' }
    });

    // Update before sync
    await outboxService.queueMutation({
      entity: 'prompt',
      entityId: 'prompt-123',
      operation: 'UPDATE',
      payload: { title: 'Edited Title' }
    });

    const pending = await outboxService.getPendingMutations();
    expect(pending).toHaveLength(1);
    expect(pending[0].operation).toBe('INSERT');
    expect(pending[0].payload.title).toBe('Edited Title');
    expect(pending[0].payload.body).toBe('Original body');
  });

  it('compacts INSERT followed by DELETE by removing both (item never reached server)', async () => {
    await outboxService.queueMutation({
      entity: 'prompt',
      entityId: 'prompt-temporary',
      operation: 'INSERT',
      payload: { title: 'Temporary' }
    });

    // Immediately deleted before sync
    await outboxService.queueMutation({
      entity: 'prompt',
      entityId: 'prompt-temporary',
      operation: 'DELETE'
    });

    const pending = await outboxService.getPendingMutations();
    expect(pending).toHaveLength(0);
  });

  it('compacts UPDATE followed by DELETE into a DELETE mutation', async () => {
    await outboxService.queueMutation({
      entity: 'repo',
      entityId: 'repo-abc',
      operation: 'UPDATE',
      payload: { stars: 100 }
    });

    await outboxService.queueMutation({
      entity: 'repo',
      entityId: 'repo-abc',
      operation: 'DELETE'
    });

    const pending = await outboxService.getPendingMutations();
    expect(pending).toHaveLength(1);
    expect(pending[0].operation).toBe('DELETE');
    expect(pending[0].payload).toBeNull();
  });

  it('handles mutation failure by incrementing retry count', async () => {
    const opId = await outboxService.queueMutation({
      entity: 'prompt',
      entityId: 'p-fail',
      operation: 'UPDATE',
      payload: { title: 'Will Fail' }
    });

    await outboxService.markMutationFailed(opId, 'Network connection timed out');

    const item = await db.syncOutbox.get(opId);
    expect(item.status).toBe('failed');
    expect(item.retryCount).toBe(1);
    expect(item.lastError).toBe('Network connection timed out');

    // Still considered pending for retry
    const pending = await outboxService.getPendingMutations();
    expect(pending).toHaveLength(1);
  });

  it('deletes mutation upon successful completion', async () => {
    const opId = await outboxService.queueMutation({
      entity: 'prompt',
      entityId: 'p-success',
      operation: 'INSERT',
      payload: { title: 'Success' }
    });

    await outboxService.markMutationCompleted(opId);

    const pending = await outboxService.getPendingMutations();
    expect(pending).toHaveLength(0);
  });

  it('automatically queues outbox mutations when saving via promptRepository', async () => {
    const saved = await promptRepository.save({
      title: 'Prompt with Outbox Tracking',
      body: 'Will queue mutation'
    });

    const pending = await outboxService.getPendingMutations();
    expect(pending.length).toBeGreaterThanOrEqual(1);
    const queued = pending.find(p => p.entityId === String(saved.id));
    expect(queued).toBeDefined();
    expect(queued.entity).toBe('prompt');
    expect(queued.payload.title).toBe('Prompt with Outbox Tracking');
  });

  it('automatically queues outbox mutations when deleting via promptRepository', async () => {
    const saved = await promptRepository.save({
      title: 'To Be Deleted',
      body: 'Ephemeral'
    });

    await promptRepository.delete(saved.id);

    const pending = await outboxService.getPendingMutations();
    const deleteOp = pending.find(p => p.entityId === String(saved.id) && p.operation === 'DELETE');
    expect(deleteOp).toBeDefined();
  });

  it('automatically queues outbox mutations when saving via repositoryRepository', async () => {
    const saved = await repositoryRepository.save({
      fullName: 'owner/repo-sync',
      owner: 'owner',
      name: 'repo-sync'
    });

    const pending = await outboxService.getPendingMutations();
    const queued = pending.find(p => p.entityId === String(saved.id));
    expect(queued).toBeDefined();
    expect(queued.entity).toBe('repo');
    expect(queued.payload.fullName).toBe('owner/repo-sync');
  });

  it('syncEngine reports idle/offline gracefully when unconfigured or offline', async () => {
    const result = await syncEngine.syncNow();
    expect(result.pushed).toBe(0);
    expect(result.pulled).toBe(0);

    const state = syncEngine.getState();
    expect(['idle', 'offline', 'synced']).toContain(state.status);
  });
});

