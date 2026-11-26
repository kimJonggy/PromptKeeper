# PromptKeeper 2.0 — Storage Migration Strategy

**Status:** Approved for Implementation Planning  
**Source Engine:** Browser `localStorage`  
**Target Engine:** IndexedDB (Dexie.js v4) + Optional Supabase PostgreSQL  

---

## 1. Migration Principles & Guarantees

1. **Zero Data Destruction:** Existing `localStorage` keys are NEVER wiped, truncated, or removed during migration.
2. **Idempotence:** Running the migration script multiple times must produce the exact same outcome without duplicating records.
3. **Legacy ID Preservation:** Every prompt's original numeric or string ID is retained in a dedicated `legacyId` field, maintaining backward compatibility for linked prompt chains (`linkedPromptId`).
4. **Resilience to Malformed Data:** Missing fields, string numbers, null tags, and corrupt records are normalized to safe defaults without aborting the batch.
5. **Immediate Rollback Capability:** If verification fails or the user encounters an anomaly, the application can switch back to legacy `localStorage` mode with zero data loss.

---

## 2. Legacy Key Inventory

The current application uses the following `localStorage` keys:

| Legacy Key | Type | Description |
|---|---|---|
| `pk_prompts_v2` | Array | Primary prompt array containing objects with `id`, `title`, `body`, `tags`, `category`, `model`, `fav`, `uses`, `created`, `history`, `notes`, `thumbnail`, `images`, `presets`, `variableConfig`, `linkedPromptId`. |
| `pk_categories` | Array | Custom category strings (e.g. `['All', 'Coding', 'Creative', ...]`). |
| `pk_cat_colors` | Object | Map of category name to hex color. |
| `pk_model_colors` | Object | Map of model name to hex color. |
| `pk_onboarding_v1` | Boolean | Whether user completed initial onboarding. |

---

## 3. Step-by-Step Migration Pipeline

```
                       Start Migration
                              │
                              ▼
            Read `localStorage.getItem('pk_prompts_v2')`
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
          Data Present?                No Data Found
                │                           │
                ▼                           ▼
    Parse JSON & Validate          Mark Migration as Completed
                │                  (Clean slate for new user)
                ▼
    Iterate Legacy Prompts:
    1. Generate UUID for `Resource.id`
    2. Store `legacyId = prompt.id`
    3. Normalize tags, history, arrays
    4. Normalize Category -> Collection
    5. Retain image attachments
                │
                ▼
    Atomic IndexedDB Transaction:
    Write to `resources`, `prompts`, `collections`, `resourceCollections`
                │
                ▼
    Verification Suite:
    - Compare legacy count vs IndexedDB count
    - Validate spot-check titles & bodies
    - Check collection mappings
                │
         ┌──────┴──────┐
         ▼             ▼
      SUCCESS       FAILURE
         │             │
         ▼             ▼
  Set Flag:       Abort Transaction &
  `pk_migrated_v2` Fallback to `localStorage`
  (Keep legacy    Log error for review
   localStorage)
```

---

## 4. Legacy Prompt Normalization Matrix

| Legacy Field | Problem / Inconsistency | Migration Action | Target Field |
|---|---|---|---|
| `id` | Mixed numeric (`1714700000`) and string (`"1"`). | Generate standard UUIDv4; store original in `legacyId`. | `Resource.id` (UUID), `Prompt.legacyId` |
| `title` | May be empty or missing. | Default to `'Untitled Prompt'`. | `Resource.title` |
| `body` | May be null or undefined. | Default to `''`. | `Prompt.body` |
| `category` | Bound to single category string. | Create or find `Collection` with matching name; create `ResourceCollection` link. | `ResourceCollection`, `Prompt.category` |
| `tags` | May be null, undefined, or have duplicates. | `Array.from(new Set(p.tags || []))`. | `Prompt.tags` |
| `uses` | May be undefined. | `Math.max(0, Number(p.uses) || 0)`. | `Prompt.uses` |
| `history` | May be undefined or non-array. | Ensure array of integers. | `Prompt.history` |
| `linkedPromptId` | References legacy `id`. | Map to newly generated UUID using the legacy ID lookup table. | `Prompt.linkedPromptId` |
| `thumbnail` / `images` | Base64 or Capacitor device URIs. | Preserved as-is into IndexedDB. | `Prompt.thumbnail`, `Prompt.images` |

---

## 5. Verification & Health Check

The migration engine will automatically perform an integrity audit before switching primary reads to IndexedDB:
1. **Record Count Parity:** Verify that `db.prompts.count() === legacyPrompts.length`.
2. **Linked Chain Parity:** Verify that all `linkedPromptId` references point to valid records in the new database.
3. **Data Checksum:** Check that concatenated title/body hashes match the source data.
4. **Schema Conformity:** Validate that every record passes the Zod/runtime schema check.

---

## 6. Rollback & Export Safety Net

- **Manual Emergency Rollback:** If an issue is reported, a single configuration toggle (`USE_INDEXED_DB = false`) immediately falls back to reading `localStorage`.
- **Pre-Migration Backup:** The application provides a one-click "Download Pre-Migration JSON Backup" prompt before any database upgrade.
- **Permanent Retention:** `localStorage` data will not be purged until the user has operated on PromptKeeper 2.0 successfully for at least 30 days and provides explicit manual consent.

