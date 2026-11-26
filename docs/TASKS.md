# PromptKeeper 2.0 — Implementation Roadmap & Task Matrix

**Status:** Awaiting Approval to Begin Phase 0  
**Methodology:** Phased, Test-Driven, Zero-Regression Development  

---

## Roadmap Overview

```
Phase 0: Stabilization & Data Protection (Current Baseline)
   │
   ▼
Phase 1: Premium Developer SaaS UI/UX Redesign
   │
   ▼
Phase 2: GitHub Repository Hub (Local-First Core)
   │
   ▼
Phase 3: Unified Collections & Enhanced Prompt Studio
   │
   ▼
Phase 4: IndexedDB (Dexie.js) Local-First Persistence & Migration
   │
   ▼
Phase 5: Optional Supabase Cloud Synchronization & Auth
   │
   ▼
Phase 6: Quality Assurance, Security, Mobile Audit & Release
```

---

## Phase 0: Stabilization and Data Protection

### Objectives
- Establish automated testing infrastructure (Vitest).
- Fix confirmed baseline defects in clipboard handling, import counts, and ESLint configuration.
- Add schema validation and non-destructive backup validation.
- Ensure 100% build and test pass without changing UI or storage architecture.

### Implementation Tasks
- [x] **TASK-001:** Install and configure Vitest and React Testing Library (`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `happy-dom`).
- [x] **TASK-002:** Fix `eslint.config.js` to ignore `android/`, `.vscode/`, and root prototype files, eliminating 740+ false-positive lint errors.
- [x] **TASK-003:** Correct CSS syntax warnings in `src/index.css` (`whiteSpace` -> `white-space`, `boxShadow` -> `box-shadow`).
- [x] **TASK-004:** Fix inaccurate import count toast in `src/hooks/usePrompts.js` to reflect actual imported count vs skipped duplicates.
- [x] **TASK-005:** Refactor `copyPrompt` in `src/hooks/usePrompts.js` to await clipboard write before updating usage count and triggering toast.
- [x] **TASK-006:** Add runtime schema validator (`validatePrompt`, `validateVault`) to protect against malformed imports and corrupted records.
- [x] **TASK-007:** Fix `resetVault` in `src/context/AppContext.jsx` to selectively clear `pk_*` keys rather than `localStorage.clear()`.
- [x] **TASK-008:** Write regression test suite covering prompt CRUD, variable extraction, migration readiness, and JSON import/export (26/26 tests passing).

### Metadata
- **Relevant Existing Files:** `package.json`, `eslint.config.js`, `src/index.css`, `src/hooks/usePrompts.js`, `src/context/AppContext.jsx`, `src/components/ImportExportModal.jsx`.
- **Expected New Files:** `vitest.config.js`, `tests/setup.js`, `tests/prompts.test.js`, `tests/extractVars.test.js`.
- **Dependencies:** None.
- **Risks:** Test environment mismatch with React 19.
- **Acceptance Criteria:** `npm run build`, `npm run lint`, and `npm test` all exit with code 0.
- **Verification Requirements:** Automated unit tests pass; dev server runs without console errors.

---

## Phase 1: Premium Developer SaaS UI/UX Redesign

### Objectives
- Modernize the application aesthetic into a restrained, information-dense developer workspace.
- Replace harsh neobrutalist borders with refined dark & light tokens and subtle borders.
- Build responsive shell, collapsible sidebar, global command bar, and unified card components.
- Preserve all existing prompt workflows and Forge Studio capabilities.

### Implementation Tasks
- [x] **TASK-101:** Establish core design tokens in `src/index.css` (neutral surfaces, slate/charcoal backgrounds, warm amber accent `#f0a532`, clean typography).
- [x] **TASK-102:** Implement responsive Application Shell with collapsible sidebar and global toolbar.
- [x] **TASK-103:** Redesign `PromptCard` with high-density layout, clean badges, and quick copy triggers.
- [x] **TASK-104:** Implement Grid / List view toggle for the prompt browser.
- [x] **TASK-105:** Redesign `DetailPanel` slide-over inspector with tabs for details and variable playground.
- [x] **TASK-106:** Refactor modal dialogs (`PromptModal`, `ImportExportModal`, `ConfirmModal`) to share consistent modal geometry and transitions.
- [x] **TASK-107:** Verify mobile layouts (360px-480px) and touch target responsiveness.

### Metadata
- **Relevant Existing Files:** `src/App.jsx`, `src/index.css`, `src/components/Sidebar.jsx`, `src/components/PromptCard.jsx`, `src/components/DetailPanel.jsx`, `src/components/UI.jsx`.
- **Expected New Components:** `src/components/shell/AppShell.jsx`, `src/components/shell/Toolbar.jsx`, `src/components/common/Card.jsx`.
- **Dependencies:** Phase 0 completion.
- **Risks:** Regressing mobile interactions or breaking Forge Studio styles.
- **Acceptance Criteria:** All existing features function seamlessly; UI renders cleanly across desktop and mobile without visual regressions.
- **Verification Requirements:** Browser testing on desktop viewports and mobile emulation.

---

## Phase 2: GitHub Repository Hub

### Objectives
- Establish GitHub repositories as first-class citizens alongside AI prompts.
- Implement URL normalization, public GitHub API ingestion, and local duplicate prevention.
- Add lifecycle statuses (`Inbox`, `To Explore`, `Researching`, `Testing`, `Using`, `Completed`, `Archived`).
- Provide rich repository card and detail views with personal markdown notes.

### Implementation Tasks
- [x] **TASK-201:** Implement `githubService.js` for URL normalization, validation, and fetching public repo metadata.
- [x] **TASK-202:** Implement duplicate detection using owner/name canonical pairs.
- [x] **TASK-203:** Create `useRepositories` domain hook for repository CRUD and status management.
- [x] **TASK-204:** Build `RepositoryCard` component with language tags, stars, forks, and status badges.
- [x] **TASK-205:** Build `RepositoryDetail` inspector view with upstream metrics, personal notes editor, and link out.
- [x] **TASK-206:** Build `AddRepositoryModal` with instant URL paste, metadata preview, and save action.
- [x] **TASK-207:** Implement rate-limit resilience and offline cached metadata display.

### Metadata
- **Relevant Existing Files:** `src/App.jsx`, `src/context/AppContext.jsx`, `src/components/Sidebar.jsx`.
- **Expected New Files:** `src/services/githubService.js`, `src/hooks/useRepositories.js`, `src/components/repos/RepositoryCard.jsx`, `src/components/repos/RepositoryDetail.jsx`, `src/components/repos/AddRepositoryModal.jsx`.
- **Dependencies:** Phase 1 completion.
- **Risks:** GitHub API rate limits (60 unauthenticated requests/hr); network errors during fetch.
- **Acceptance Criteria:** Users can paste any valid GitHub URL, view metadata, assign statuses, save personal notes, and filter repos.
- **Verification Requirements:** Unit tests for URL parser; offline behavior tests; integration tests with real GitHub API responses.

---

## Phase 3: Unified Collections and Prompt Studio

### Objectives
- Connect Prompts and Repositories into shared Collections and Projects.
- Allow resources to belong to multiple collections simultaneously.
- Upgrade Prompt Studio with version history, comparison diffs, and reusable variable sets.
- Implement Universal Global Search across prompts and repositories.

### Implementation Tasks
- [x] **TASK-301:** Implement unified `useCollections` hook supporting multi-resource membership.
- [x] **TASK-302:** Implement `useUniversalSearch` hook querying prompt titles/bodies and repo names/descriptions/notes.
- [x] **TASK-303:** Build Command Palette (`Cmd+K` / `Ctrl+K`) for global quick search and actions.
- [x] **TASK-304:** Add version history tracking to Prompt Studio with snapshot rollback.
- [x] **TASK-305:** Support resource relationships (linking prompts to repositories).
- [x] **TASK-306:** Implement bulk organization actions (add to collection, tag, archive).

### Metadata
- **Relevant Existing Files:** `src/components/ForgeStudio.jsx`, `src/components/ForgePanel.jsx`, `src/components/Sidebar.jsx`, `src/data.js`.
- **Expected New Files:** `src/hooks/useCollections.js`, `src/hooks/useUniversalSearch.js`, `src/components/common/CommandPalette.jsx`, `src/components/studio/VersionHistoryModal.jsx`.
- **Dependencies:** Phase 2 completion.
- **Risks:** Performance lag during fuzzy search over large local libraries.
- **Acceptance Criteria:** Collections display mixed prompts and repositories; prompt versions can be compared and restored.
- **Verification Requirements:** Automated tests for many-to-many collection links and search scoring.

---

## Phase 4: IndexedDB Local-First Persistence & Migration

### Objectives
- Transition primary local storage from `localStorage` to IndexedDB using Dexie.js v4.
- Implement an automated, idempotent, non-destructive legacy data migration pipeline.
- Maintain legacy `localStorage` data as a fallback until explicit verification.
- Provide full export, backup, and rollback capabilities.

### Implementation Tasks
- [x] **TASK-401:** Install and configure Dexie.js (`dexie`, `fake-indexeddb`).
- [x] **TASK-402:** Define IndexedDB database schema (`src/db/index.js`) as specified in `docs/DATA_MODEL.md`.
- [x] **TASK-403:** Implement `migrationService.js` to transfer `pk_prompts_v2`, categories, and colors to IndexedDB.
- [x] **TASK-404:** Preserve legacy IDs via `legacyId` mapping and regenerate stable UUIDs.
- [x] **TASK-405:** Implement integrity verification check (count match, checksum, sample record verification).
- [x] **TASK-406:** Build fallback and rollback switches (`STORAGE_DRIVER_KEY`, dual persistence).
- [x] **TASK-407:** Update domain hooks (`usePrompts`, `useRepositories`, `useCollections`) to read/write via Dexie repositories.

### Metadata
- **Relevant Existing Files:** `src/hooks.js`, `src/hooks/usePrompts.js`, `src/hooks/useCategories.js`, `src/context/AppContext.jsx`.
- **Expected New Files:** `src/db/index.js`, `src/db/migrationService.js`, `tests/migration.test.js`.
- **Dependencies:** Phase 3 completion.
- **Risks:** Quota limits on low-storage devices; async initialization timing issues on app mount.
- **Acceptance Criteria:** Existing user prompts load seamlessly from IndexedDB; legacy localStorage remains completely intact.
- **Verification Requirements:** Comprehensive automated migration test suite; simulated corrupt record tests.

---

## Phase 5: Optional Supabase Cloud Synchronization & Auth

### Objectives
- Introduce optional user authentication via Supabase Auth.
- Implement an outbox-based asynchronous synchronization engine.
- Establish idempotent sync APIs and deterministic conflict resolution.
- Never block offline local usage when cloud services are disconnected.

### Implementation Tasks
- [x] **TASK-501:** Install `@supabase/supabase-js` and configure client environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- [x] **TASK-502:** Write Supabase PostgreSQL migration scripts and Row-Level Security (RLS) policies.
- [x] **TASK-503:** Implement `syncOutbox` queue in IndexedDB to capture local mutations.
- [x] **TASK-504:** Implement background `syncEngine.js` with exponential backoff and retry mechanisms.
- [x] **TASK-505:** Implement conflict handling (revision tracking, non-destructive branching).
- [x] **TASK-506:** Build Auth UI in Settings (Sign In / Sign Up / Sign Out / Sync Status Indicator).
- [x] **TASK-507:** Handle initial account linking: preview local vs remote counts before merging.

### Metadata
- **Relevant Existing Files:** `src/App.jsx`, `src/context/AppContext.jsx`.
- **Expected New Files:** `src/services/supabaseClient.js`, `src/services/syncEngine.js`, `src/components/auth/AuthModal.jsx`, `supabase/migrations/001_initial_schema.sql`.
- **Dependencies:** Phase 4 completion.
- **Risks:** Network partition during sync; conflicting concurrent edits across two devices.
- **Acceptance Criteria:** Offline edits sync automatically upon reconnecting; unauthenticated users can use all features locally without prompts to log in.
- **Verification Requirements:** Offline toggle test; simulated network latency; multi-tab conflict verification.

---

## Phase 6: Quality Assurance, Security, Mobile Audit & Release

### Objectives
- Perform complete end-to-end audit across web and Android (Capacitor).
- Validate security, accessibility (WCAG AA), performance, and bundle size.
- Produce `docs/RELEASE_CHECKLIST.md` with explicit GO / NO-GO criteria.

### Implementation Tasks
- [x] **TASK-601:** Run comprehensive end-to-end workflow verification across desktop and mobile browsers.
- [x] **TASK-602:** Audit Capacitor Android build (`npx cap sync android`, verify camera, storage permissions).
- [x] **TASK-603:** Security audit (scan for exposed secrets, unvalidated external URLs, XSS in markdown rendering).
- [x] **TASK-604:** Performance profiling (chunking optimization, bundle size < 500kB, memory leak checks).
- [x] **TASK-605:** Verify backup/restore and disaster recovery workflows.
- [x] **TASK-606:** Author `docs/RELEASE_CHECKLIST.md` and document production deployment steps.

### Metadata
- **Relevant Existing Files:** All repository files, `android/`, `capacitor.config.json`.
- **Expected New Files:** `docs/RELEASE_CHECKLIST.md`.
- **Dependencies:** Phase 5 completion.
- **Risks:** Android platform-specific file URI permission changes across OS versions.
- **Acceptance Criteria:** 100% passed test suites, clean build, zero critical vulnerabilities, verified Android build.
- **Verification Requirements:** Final independent QA review and formal sign-off.

