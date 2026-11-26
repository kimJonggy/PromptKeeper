# PromptKeeper 2.0 — Data Model Specification

**Status:** Approved for Implementation  
**Storage Targets:** IndexedDB (Dexie.js) & Supabase PostgreSQL  

---

## 1. Entity Relationship Overview

The PromptKeeper 2.0 data model separates shared polymorphic metadata (`Resource`) from domain-specific attributes (`Prompt`, `Repository`), linked through a consistent UUID `resourceId`.

```
                  ┌──────────────────────────────┐
                  │          Collection          │
                  │  id, name, color, icon, pos  │
                  └──────────────┬───────────────┘
                                 │ 1..*
                                 │
                                 ▼
                     ┌───────────────────────┐
                     │  ResourceCollection   │
                     │ resourceId, collId    │
                     └───────────┬───────────┘
                                 │ *..1
                                 │
                  ┌──────────────┴──────────────┐
                  │           Resource          │
                  │  id (UUID), type, title,    │
                  │  fav, created, updated,     │
                  │  is_deleted, sync_status    │
                  └──────────┬──────────────┬───┘
                             │ 1..1         │ 1..1
             ┌───────────────┘              └──────────────┐
             ▼                                             ▼
┌─────────────────────────┐                   ┌─────────────────────────┐
│         Prompt          │                   │       Repository        │
│  resourceId (UUID)      │                   │  resourceId (UUID)      │
│  body, model, tags      │                   │  githubId, owner, name  │
│  uses, history, notes   │                   │  canonicalUrl, desc     │
│  images, thumbnail      │                   │  language, topics, stars│
│  variableConfig, vars   │                   │  forks, license, pushed │
│  linkedPromptId         │                   │  status, personalNotes  │
└────────────┬────────────┘                   └─────────────────────────┘
             │ 1..*
             ▼
┌─────────────────────────┐
│      PromptVersion      │
│  id, promptId, version  │
│  body, diff, createdAt  │
└─────────────────────────┘
```

---

## 2. Entity Schemas

### 2.1 Resource (Base Polymorphic Entity)
```typescript
interface Resource {
  id: string;               // Stable UUID (v4)
  type: 'prompt' | 'repo';  // Entity discriminator
  title: string;            // Primary display name
  fav: boolean;             // Pinned / favorite status
  createdAt: number;        // Epoch timestamp (ms)
  updatedAt: number;        // Epoch timestamp (ms)
  isDeleted: boolean;       // Soft deletion tombstone
  syncRevision: number;     // Monotonic server revision counter
  syncStatus: 'synced' | 'pending' | 'conflict';
}
```

### 2.2 Prompt (AI Prompt Entity)
```typescript
interface Prompt {
  resourceId: string;       // Foreign key -> Resource.id
  legacyId?: number | string; // Reference to original pk_prompts_v2 ID
  body: string;             // Raw template text
  category: string;         // Primary category (e.g., Coding, System)
  model: string;            // Recommended model (e.g., Claude, GPT-4)
  tags: string[];           // Normalised tags (e.g., ["react", "frontend"])
  uses: number;             // Execution count
  history: number[];        // Historical usage snapshots
  notes: string;            // Developer notes & guidance
  thumbnail: string | null; // Thumbnail image URI / DataURL
  images: string[];         // Image attachment URIs
  presets?: any[];          // Pre-saved variable sets
  variableConfig?: {        // Field validation & types
    types: Record<string, 'text' | 'number' | 'date' | 'email' | 'url' | 'textarea' | 'select'>;
    options: Record<string, string[]>;
  };
  linkedPromptId: string | null; // Successor prompt in chain
  currentVersion: number;   // Incremental version pointer
}
```

### 2.3 Repository (GitHub Hub Entity)
```typescript
type RepositoryStatus = 
  | 'inbox' 
  | 'to_explore' 
  | 'researching' 
  | 'testing' 
  | 'using' 
  | 'completed' 
  | 'archived';

interface Repository {
  resourceId: string;       // Foreign key -> Resource.id
  githubId: number;         // Upstream GitHub numeric ID
  owner: string;            // GitHub user or organisation
  name: string;             // Repository name
  fullName: string;         // "owner/name"
  canonicalUrl: string;     // "https://github.com/owner/name"
  description: string;      // Upstream repository description
  primaryLanguage: string;  // Primary language (e.g. "TypeScript")
  topics: string[];         // GitHub repository topics
  stars: number;            // Upstream star count
  forks: number;            // Upstream fork count
  openIssues: number;       // Open issues & PRs
  license: string | null;   // SPDX ID or license name (e.g. "MIT")
  pushedAt: string;         // ISO timestamp of last commit
  lastSyncedAt: number;     // Epoch timestamp (ms) of metadata fetch
  status: RepositoryStatus; // User-defined lifecycle status
  personalNotes: string;    // Markdown user notes & evaluations
  tags: string[];           // Custom tags
}
```

### 2.4 Collection & ResourceCollection (Many-to-Many Grouping)
```typescript
interface Collection {
  id: string;               // UUID
  name: string;             // Display name (e.g., "Full-Stack AI Stack")
  color: string;            // Hex color code (e.g., "#f0a532")
  icon?: string;            // Icon identifier
  position: number;         // Ordering rank
  createdAt: number;
  updatedAt: number;
}

interface ResourceCollection {
  resourceId: string;       // Foreign key -> Resource.id
  collectionId: string;     // Foreign key -> Collection.id
  addedAt: number;
}
```

### 2.5 PromptVersion (Snapshot & Revision History)
```typescript
interface PromptVersion {
  id: string;               // UUID
  promptId: string;         // Foreign key -> Resource.id
  versionNumber: number;    // Monotonic integer (1, 2, 3...)
  title: string;
  body: string;
  notes: string;
  createdAt: number;
  commitMessage?: string;   // Optional description of changes
}
```

### 2.6 SyncOutbox (Offline Mutation Queue)
```typescript
interface SyncOutboxItem {
  opId: string;             // UUID
  entity: 'resource' | 'prompt' | 'repo' | 'collection' | 'link';
  entityId: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, any>;
  clientTimestamp: number;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'processing' | 'failed';
}
```

---

## 3. IndexedDB Schema (Dexie.js v4)

```javascript
import Dexie from 'dexie';

export const db = new Dexie('PromptKeeperDB');

db.version(1).stores({
  resources: 'id, type, title, fav, createdAt, updatedAt, isDeleted, syncStatus',
  prompts: 'resourceId, legacyId, category, model, *tags, uses, currentVersion',
  repositories: 'resourceId, githubId, owner, name, fullName, canonicalUrl, status, *topics, *tags',
  collections: 'id, name, position',
  resourceCollections: '[resourceId+collectionId], resourceId, collectionId',
  promptVersions: 'id, promptId, versionNumber, createdAt',
  syncOutbox: 'opId, entity, entityId, status, clientTimestamp'
});
```

