import { describe, it, expect, beforeEach } from 'vitest';
import { db, isIndexedDBSupported } from '../src/db/index.js';
import { 
  migrateLegacyDataToIndexedDB, 
  verifyDatabaseIntegrity, 
  exportAllData,
  MIGRATION_FLAG_KEY,
  STORAGE_DRIVER_KEY
} from '../src/db/migrationService.js';
import { promptRepository, repositoryRepository, collectionRepository } from '../src/db/repository.js';

describe('Phase 4: IndexedDB Persistence & Migration Service', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.resources.clear();
    await db.prompts.clear();
    await db.repositories.clear();
    await db.collections.clear();
    await db.resourceCollections.clear();
    await db.promptVersions.clear();
    await db.syncOutbox.clear();
  });

  it('detects IndexedDB environment support', () => {
    expect(isIndexedDBSupported()).toBe(true);
  });

  it('migrates legacy localStorage prompts and repositories without destroying source data', async () => {
    const legacyPrompts = [
      {
        id: 101, // numeric legacy ID
        title: 'Legacy Python Script',
        body: 'Write a python script for {{task}}',
        category: 'Coding',
        tags: ['python', 'script'],
        fav: true,
        uses: 5,
        created: 1700000000000,
        linkedPromptId: 102, // chains to 102
        versions: [
          { version: 1, title: 'Draft Python Script', body: 'Draft body', timestamp: 1699999900000, note: 'Initial draft' }
        ]
      },
      {
        id: 102, // successor in chain
        title: 'Legacy Test Generator',
        body: 'Generate pytest tests for python code',
        category: 'Coding',
        tags: ['test', 'pytest'],
        fav: false,
        uses: 2,
        created: 1700000050000
      }
    ];

    const legacyRepos = [
      {
        id: 'repo-legacy-1',
        fullName: 'facebook/react',
        owner: 'facebook',
        name: 'react',
        canonicalUrl: 'https://github.com/facebook/react',
        stars: 220000,
        status: 'using',
        collections: ['Coding']
      }
    ];

    localStorage.setItem('pk_prompts_v2', JSON.stringify(legacyPrompts));
    localStorage.setItem('pk_repositories', JSON.stringify(legacyRepos));
    localStorage.setItem('pk_categories', JSON.stringify(['All', 'Coding', 'Research']));
    localStorage.setItem('pk_cat_colors', JSON.stringify({ Coding: '#3b82f6' }));

    // Run migration
    const report = await migrateLegacyDataToIndexedDB();

    expect(report.success).toBe(true);
    expect(report.promptsCount).toBe(2);
    expect(report.reposCount).toBe(1);
    expect(report.errors).toHaveLength(0);

    // CRITICAL REQUIREMENT: Source localStorage data MUST remain intact!
    expect(localStorage.getItem('pk_prompts_v2')).not.toBeNull();
    expect(JSON.parse(localStorage.getItem('pk_prompts_v2'))).toHaveLength(2);
    expect(localStorage.getItem('pk_repositories')).not.toBeNull();
    expect(localStorage.getItem(MIGRATION_FLAG_KEY)).toBe('true');
    expect(localStorage.getItem(STORAGE_DRIVER_KEY)).toBe('indexeddb');

    // Verify Dexie storage
    const allPrompts = await promptRepository.getAll();
    expect(allPrompts).toHaveLength(2);

    const pythonPrompt = allPrompts.find(p => p.title === 'Legacy Python Script');
    const testGenPrompt = allPrompts.find(p => p.title === 'Legacy Test Generator');

    expect(pythonPrompt).toBeDefined();
    expect(pythonPrompt.legacyId).toBe('101');
    expect(pythonPrompt.fav).toBe(true);
    expect(pythonPrompt.versions).toHaveLength(1);
    expect(pythonPrompt.versions[0].title).toBe('Draft Python Script');

    // Verify linkedPromptId was mapped to the new UUID of prompt 102
    expect(pythonPrompt.linkedPromptId).toBe(testGenPrompt.id);

    // Verify repositories
    const allRepos = await repositoryRepository.getAll();
    expect(allRepos).toHaveLength(1);
    expect(allRepos[0].fullName).toBe('facebook/react');
    expect(allRepos[0].collections).toContain('Coding');
  });

  it('is completely idempotent and does not duplicate records when rerun', async () => {
    const legacyPrompts = [
      { id: 'p1', title: 'Prompt One', body: 'Body 1', category: 'General' },
      { id: 'p2', title: 'Prompt Two', body: 'Body 2', category: 'General' }
    ];
    localStorage.setItem('pk_prompts_v2', JSON.stringify(legacyPrompts));

    // First migration run
    const report1 = await migrateLegacyDataToIndexedDB();
    expect(report1.success).toBe(true);
    expect(await db.prompts.count()).toBe(2);

    // Second run with force=false
    const report2 = await migrateLegacyDataToIndexedDB({ force: false });
    expect(report2.success).toBe(true);
    expect(await db.prompts.count()).toBe(2);

    // Third run with force=true (re-migration clears and re-populates without duplicating)
    const report3 = await migrateLegacyDataToIndexedDB({ force: true });
    expect(report3.success).toBe(true);
    expect(await db.prompts.count()).toBe(2);
  });

  it('passes database integrity verification', async () => {
    await db.resources.put({
      id: 'res-1',
      type: 'prompt',
      title: 'Integrity Test',
      fav: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: 0,
      syncStatus: 'synced'
    });
    await db.prompts.put({
      resourceId: 'res-1',
      legacyId: 'res-1',
      category: 'General',
      model: 'Universal',
      tags: [],
      uses: 0,
      currentVersion: 1,
      body: 'Test body',
      notes: ''
    });

    const status = await verifyDatabaseIntegrity();
    expect(status.ok).toBe(true);
    expect(status.promptsCount).toBe(1);
    expect(status.reposCount).toBe(0);
  });

  it('performs CRUD via promptRepository', async () => {
    const saved = await promptRepository.save({
      title: 'New Dexie Prompt',
      body: 'Testing Dexie storage',
      category: 'Testing',
      tags: ['indexeddb', 'dexie'],
      model: 'GPT-4',
      fav: true
    });

    expect(saved.id).toBeDefined();
    expect(saved.title).toBe('New Dexie Prompt');

    const retrieved = await promptRepository.getAll();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].title).toBe('New Dexie Prompt');
    expect(retrieved[0].fav).toBe(true);

    // Delete
    await promptRepository.delete(saved.id);
    const afterDelete = await promptRepository.getAll();
    expect(afterDelete).toHaveLength(0);
  });

  it('performs CRUD via repositoryRepository', async () => {
    const saved = await repositoryRepository.save({
      fullName: 'tailwindlabs/tailwindcss',
      owner: 'tailwindlabs',
      name: 'tailwindcss',
      canonicalUrl: 'https://github.com/tailwindlabs/tailwindcss',
      stars: 80000,
      status: 'testing'
    });

    expect(saved.id).toBeDefined();
    const retrieved = await repositoryRepository.getAll();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].name).toBe('tailwindcss');

    await repositoryRepository.delete(saved.id);
    const afterDelete = await repositoryRepository.getAll();
    expect(afterDelete).toHaveLength(0);
  });

  it('manages collection links via collectionRepository', async () => {
    await collectionRepository.save({
      id: 'col-ai',
      name: 'AI Tools',
      color: '#10b981',
      position: 1
    });

    await collectionRepository.link('res-sample-1', 'col-ai');

    const links = await db.resourceCollections.toArray();
    expect(links).toHaveLength(1);
    expect(links[0].resourceId).toBe('res-sample-1');
    expect(links[0].collectionId).toBe('col-ai');

    await collectionRepository.unlink('res-sample-1', 'col-ai');
    const linksAfter = await db.resourceCollections.toArray();
    expect(linksAfter).toHaveLength(0);
  });

  it('exports all data accurately in unified format', async () => {
    await promptRepository.save({
      title: 'Export Prompt',
      body: 'Will be exported'
    });

    const exportData = await exportAllData();
    expect(exportData.version).toBe('2.0');
    expect(exportData.driver).toBe('indexeddb');
    expect(exportData.prompts).toHaveLength(1);
    expect(exportData.resources).toHaveLength(1);
  });
});

