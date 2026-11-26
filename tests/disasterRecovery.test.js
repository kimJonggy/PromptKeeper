import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../src/db/index.js';
import { promptRepository, repositoryRepository, collectionRepository } from '../src/db/repository.js';
import { exportAllData } from '../src/db/migrationService.js';
import { validateVault } from '../src/utils/validation.js';

describe('Phase 6: Disaster Recovery & Backup Integrity Verification', () => {
  beforeEach(async () => {
    localStorage.clear();
    await db.resources.clear();
    await db.prompts.clear();
    await db.repositories.clear();
    await db.collections.clear();
    await db.syncOutbox.clear();
  });

  it('produces a full disaster recovery export containing all entities', async () => {
    // Populate data
    await promptRepository.save({
      title: 'Disaster Recovery Test Prompt',
      body: 'Critical data must be preserved',
      category: 'System',
      tags: ['backup', 'recovery'],
      fav: true
    });

    await repositoryRepository.save({
      fullName: 'adnan911/promptKeeper',
      owner: 'adnan911',
      name: 'promptKeeper',
      canonicalUrl: 'https://github.com/adnan911/promptKeeper',
      status: 'using'
    });

    await collectionRepository.save({
      id: 'col-core',
      name: 'Core Workspace',
      color: '#f0a532'
    });

    const exportData = await exportAllData();

    expect(exportData.version).toBe('2.0');
    expect(exportData.driver).toBe('indexeddb');
    expect(exportData.prompts).toHaveLength(1);
    expect(exportData.repositories).toHaveLength(1);
    expect(exportData.collections).toHaveLength(1);
    expect(exportData.resources).toHaveLength(2);
  });

  it('validates and gracefully handles corrupt or malformed vault imports', () => {
    // Malformed records
    const malformedPayload = {
      prompts: [
        { title: 'Valid Prompt', body: 'Safe' },
        { title: '', body: '' }, // invalid empty record
        null, // null record
        { invalid: true } // missing required fields
      ],
      categories: ['Coding', 123, null] // dirty category types
    };

    const result = validateVault(malformedPayload);

    expect(result.isValid).toBe(true); // vault is salvageable
    expect(result.validPrompts).toHaveLength(1);
    expect(result.validPrompts[0].title).toBe('Valid Prompt');
    expect(result.categories).toContain('Coding');
    expect(result.categories).not.toContain(123);
  });

  it('rejects non-object vault imports completely', () => {
    const invalidInputs = [
      "string payload",
      12345,
      null,
      undefined
    ];

    invalidInputs.forEach(input => {
      const res = validateVault(input);
      expect(res.isValid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });
  });
});

