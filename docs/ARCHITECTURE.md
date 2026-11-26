# PromptKeeper 2.0 — System Architecture

**Version:** 2.0.0-draft  
**Architecture Paradigm:** Local-First, Offline-Capable, Cloud-Optional Reactive Architecture  

---

## 1. System Overview

PromptKeeper 2.0 is built on a hybrid storage and state architecture. All reads and mutations take place synchronously against the local database (Dexie / IndexedDB). An asynchronous background synchronization service drains an operation outbox when an authenticated cloud session is active.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                              │
│                                                                        │
│   ┌───────────────┐ ┌────────────────┐ ┌───────────────────────────┐   │
│   │ App Shell     │ │ Prompt Studio  │ │ Repository Hub            │   │
│   │ Nav / Toolbar │ │ JSON / Forge   │ │ Search / Filter Engine    │   │
│   └───────┬───────┘ └───────┬────────┘ └─────────────┬─────────────┘   │
└───────────┼─────────────────┼────────────────────────┼─────────────────┘
            ▼                 ▼                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN HOOKS & CONTEXT                          │
│                                                                        │
│   useApp() · usePrompts() · useRepositories() · useCollections()       │
│   useUniversalSearch() · useSyncStatus() · useAuth()                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      SERVICE & REPOSITORY ABSTRACTION                  │
│                                                                        │
│   ResourceRepository   PromptService   RepoService   CollectionService │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         LOCAL DATABASE LAYER                           │
│                                                                        │
│   Dexie.js (IndexedDB)                                                 │
│   ├── resources         (UUID, type, title, fav, created, updated)     │
│   ├── prompts           (resourceId, body, model, tags, vars, uses)    │
│   ├── repositories      (resourceId, githubId, owner, name, stars)     │
│   ├── collections       (id, name, color, icon, position)              │
│   ├── resource_coll     (resourceId, collectionId)                     │
│   ├── prompt_versions   (id, promptId, version, body, timestamp)       │
│   └── sync_outbox       (opId, entity, entityId, op, payload, status)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (When authenticated & online)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    OUTBOX SYNC & CLOUD INTEGRATION                     │
│                                                                        │
│   SyncEngine ──(Batched Idempotent Ops)──> Supabase PostgreSQL        │
│   GitHubClient ──(Public REST API)───────> api.github.com             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layered Architecture

### 2.1 Presentation Layer
- **Component Hierarchy:** Modular components consuming domain hooks without knowing whether storage is local IndexedDB or remote PostgreSQL.
- **Responsiveness & Shell:** Adaptive layout switching between multi-column desktop (collapsible navigation, grid cards, slide-over inspector) and single-column mobile view with bottom app bar and drawer overlays.
- **Design Tokens:** Strict design system implemented with CSS variables (`--bg`, `--bg-surface`, `--text-primary`, `--accent-amber`, `--border-subtle`).

### 2.2 Domain State & Hook Layer
- Decouples UI from the database driver.
- Reactive observables (via Dexie `useLiveQuery` or reactive React hook wrappers) guarantee instant UI updates upon local write.

### 2.3 Repository / Service Abstraction Layer
- Exposes clear TypeScript/JSDoc contracts:
  - `ResourceRepository`: Common operations (`getById`, `delete`, `toggleFav`, `search`).
  - `PromptRepository`: Prompt-specific CRUD, variable resolution, and versioning.
  - `GithubRepository`: URL parsing, GitHub REST fetching, duplicate detection, and metadata refresh.
  - `CollectionRepository`: Cross-resource grouping and ordering.

### 2.4 Local Storage Layer (Dexie.js + IndexedDB)
- **Primary Datastore:** IndexedDB provides persistent storage capable of handling megabytes of rich prompts, offline repository caches, and image assets without 5MB `localStorage` limits.
- **Legacy Bridging:** During migration, existing `localStorage` keys (`pk_prompts_v2`, etc.) are read into IndexedDB without clearing `localStorage` until verified.

### 2.5 Cloud Sync & Outbox Layer (Optional)
- **Outbox Queue:** Every local mutation appends an entry to the `sync_outbox` table with an idempotent `opId` (UUID) and timestamp.
- **Conflict Handling:** Optimistic local updates with server revision tracking (`rev_id`). If a remote revision is higher, local conflict resolution retains both versions rather than destroying data.
- **Tombstones:** Deletions are stored locally as soft tombstones (`is_deleted: true`) until propagated to the cloud.

---

## 3. GitHub Integration Architecture

### 3.1 Public Repository Import Pipeline
```
User pastes URL (e.g. "github.com/facebook/react")
    │
    ▼
URL Normalizer & Validator
(Extracts owner="facebook", repo="react")
    │
    ▼
Local Duplicate Check
(Checks local repositories table by owner/name and canonical URL)
    │
    ├── Exists ──> Navigate to existing record & trigger optional refresh
    │
    └── New ────> Fetch public metadata from GitHub REST API
                      │
                      ▼
                  Cache repository metadata + initialize personal notes & status
                      │
                      ▼
                  Persist to IndexedDB & enqueue to sync_outbox
```

### 3.2 Rate Limiting & Resilience
- Uses standard public GitHub endpoints (`https://api.github.com/repos/{owner}/{repo}`).
- Monitors `x-ratelimit-remaining` and `x-ratelimit-reset` headers to prevent HTTP 429 throttling.
- Implements exponential backoff on transient network failures.

---

## 4. Mobile & Capacitor Native Integration

- **Platform Detection:** `Capacitor.isNativePlatform()` directs file operations:
  - *Android Native:* `@capacitor/camera` captures images to device storage, `@capacitor/filesystem` copies them to `Directory.Data`, and `Capacitor.convertFileSrc()` generates reliable local web URIs.
  - *Desktop / Web:* HTML5 File API and Canvas downscaling (JPEG, 0.7 quality, max 800px) creates compressed Base64 or Blob URIs.
- **Hardware Integration:** Respects Android safe areas, hardware back buttons, and lifecycle events (pause/resume sync trigger).

---

## 5. Security Architecture

1. **Client Isolation:** The client bundle only contains public credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
2. **Row-Level Security (RLS):** Supabase database tables enforce strict RLS policies:
   ```sql
   CREATE POLICY "Users can only access own resources"
   ON public.resources FOR ALL
   USING (auth.uid() = user_id);
   ```
3. **No Secrets in Storage:** GitHub personal access tokens or OAuth secrets are never stored in unencrypted browser storage.

