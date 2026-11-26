# PromptKeeper 2.0 — Codebase Audit & Architectural Analysis

**Date:** November 2026  
**Auditor:** Principal Software Architect & Technical Director  
**Repository:** `https://github.com/adnan911/promptKeeper`  
**Current Baseline:** React 19.2.5, Vite 6.4.2, Capacitor 8.3.1, ESLint 9.39.4  

---

## 1. Executive Summary

This audit assesses the current state of PromptKeeper to prepare for the 2.0 transformation into a local-first developer knowledge workspace managing both GitHub repositories and AI prompts.

### Baseline Status
- **Build Verification (`npm run build`):** **PASS** (1.00s build time). Identifies two CSS property syntax warnings in `src/index.css` (`whiteSpace` and `boxShadow` used as property names instead of `white-space` and `box-shadow`).
- **Lint Verification (`npm run lint`):** **FAIL** (750 problems: 745 errors, 5 warnings). The vast majority of failures stem from `eslint.config.js` only ignoring `dist/` and failing to ignore `android/app/build/intermediates/` and untracked root files (`json-prompt-editor (1).jsx`). Core `src/` issues include `react-hooks/set-state-in-effect`, unused variables, empty catch blocks, and Fast Refresh warnings in `AppContext.jsx`.
- **Existing Runtime Testing:** The local Vite development server starts cleanly on `http://localhost:5173`.
- **Test Infrastructure:** Currently **0 test suites** (neither Vitest nor Jest are configured).

---

## 2. Inventory of Existing Files and Components

### 2.1 Configuration & Entry
- `package.json`: React 19, Vite 6, `@capacitor/core`, `@capacitor/android`, `@capacitor/camera`, `@capacitor/filesystem`, `@capacitor/preferences`, `lucide-react`.
- `capacitor.config.json`: `appId`: `com.adnan.promptkeeper`, `appName`: `Prompt Keeper`, `webDir`: `dist`.
- `vite.config.js`: Uses `@vitejs/plugin-react`.
- `eslint.config.js`: ESLint flat config missing ignore rules for `android/` and root prototypes.
- `src/main.jsx`: Renders `StrictMode > AppProvider > App`.
- `src/index.css`: 1,041 lines of custom dark-theme CSS and utility classes (neobrutalist/glassmorphism hybrid).
- `src/studio.css`: 284 lines of styling dedicated to `ForgeStudio.jsx`.

### 2.2 State Management & Hooks
- `src/context/AppContext.jsx`: Central React context coordinating filters, modals, prompts, categories, models, toast notifications, keyboard shortcuts, and active selection.
- `src/hooks.js`:
  - `useLocalStorage(key, init)`: Synchronous `JSON.parse` initializer with `useEffect` write-back.
  - `useToast()`: Auto-dismissing notification queue (2,400ms duration).
  - `useKeyboard(handlers)`: Window key listener with input/textarea suppression.
- `src/hooks/usePrompts.js`:
  - Storage key: `pk_prompts_v2`.
  - Operations: `savePrompt`, `deletePrompt`, `toggleFav`, `copyPrompt`, `importPrompts`, `updatePrompt`, `renameTag`, `deleteTag`, `autoTag`, `sanitizePrompt`.
- `src/hooks/useCategories.js`:
  - Storage keys: `pk_categories`, `pk_cat_colors`.
  - Operations: `addCategory`, `renameCategory`, `deleteCategory`, `reorderCategory`.
- `src/hooks/useModels.js`:
  - Storage key: `pk_model_colors`.
  - Operations: `addModel`, `updateModelColor`, `renameModel`, `deleteModel`.

### 2.3 Domain Data & Utilities
- `src/data.js`:
  - Model definitions: GPT-4, GPT-3.5, Claude, Gemini, Llama, Mistral, DeepSeek.
  - Categories: Coding, Creative, Business, System, Research, Personal.
  - Variable syntax regexes: `{{var}}` (Handlebars), `${var}` (Template string), `[VAR]` (Bracket), `%VAR%` (Percent).
  - `extractVars(text)`: Parses variable tokens from body text.
  - `SEED_PROMPTS`: 10 rich demo prompts used for onboarding.

### 2.4 UI & Feature Components
- `src/App.jsx`: Primary desktop/mobile shell. Houses search bar, sort dropdown, grid of cards, floating action button (FAB), active detail drawer, and modal mounts.
- `src/components/PromptCard.jsx`: Card view for prompts. Renders thumbnail, favorite toggle, title, body excerpt, model badge, tags, usage count, variable count, and quick-copy button.
- `src/components/DetailPanel.jsx`: Slide-over inspector. Contains two tabs: "Details" (meta, raw template, notes, tags, chain link `linkedPromptId`, execution history chart, attached image) and "The Forge ⚡" (`ForgePanel`).
- `src/components/ForgePanel.jsx`: Interactive variable substitution form with type configuration (`text`, `number`, `date`, `email`, `url`, `textarea`, `select`) and live preview.
- `src/components/ForgeStudio.jsx`: Full-screen modal editor with JSON mode, variable inspector, parameter configuration, web file attachment, and native camera integration (`@capacitor/camera` + `@capacitor/filesystem`).
- `src/components/PromptModal.jsx`: Modal for standard prompt authoring and editing, image upload with canvas downscaling (max 800px), tag auto-complete, and raw JSON mode.
- `src/components/Sidebar.jsx`: Collapsible left navigation. Manages category collections, category color picking, reordering, model filtering and color customization, tag filtering and renaming/deletion, and vault stats.
- `src/components/ImportExportModal.jsx`: Backup and restoration. Exports complete vault JSON (`prompts`, `categories`, `categoryColors`, `modelColors`), imports JSON arrays or full vault objects, and provides vault reset.
- `src/components/OnboardingModal.jsx`: Welcome dialog presented on first visit (`pk_onboarding_v1`), allowing users to load demo prompts or start clean.
- `src/components/UI.jsx`: Common visual primitives: `TagPill`, `ModelBadge`, `Toast`, `Divider`, `Label`, `StatRow`, `VarHighlight`, `ResolvedHighlight`, `UsageChart`, `ConfirmModal`.

### 2.5 Standalone & Legacy Prototypes
- `json-prompt-editor (1).jsx`: 61KB prototype containing standalone theme tokens, icons, and variable parsing algorithms.
- `promptforge.html`: 83KB single-file HTML prototype for the variable editor.

### 2.6 Mobile / Native Foundation
- `android/`: Native Gradle project generated via `@capacitor/cli`.
- Capacitor plugins actively integrated: Camera, Filesystem, Core, Android.

---

## 3. Categorized Findings

### 3.1 Verified Existing Functionality
1. **Prompt Management:** Creation, updates, soft sanitization, and deletion working as designed via `usePrompts`.
2. **Search & Multi-Filtering:** Real-time search across title, body, and tags, combined with Category, Model, Tag, and Sort filters (Newest, Most Used, A-Z, Favorites).
3. **Template Variable Parsing:** Dynamic extraction and replacement supporting Handlebars, Template strings, Brackets, and Percent styles.
4. **Capacitor Mobile Integration:** Native camera capture and file persistence implemented for Android builds with web fallback.
5. **Prompt Chaining:** Prompts can reference a preceding or successor prompt via `linkedPromptId`.
6. **Data Export/Import:** Full vault serialization to downloadable JSON files and JSON clipboard copy.
7. **Custom Categorization & Models:** Dynamic additions, inline renaming, color customization, and reordering.

### 3.2 Confirmed Defects & Code Smells
1. **Inaccurate Import Counts:** `usePrompts.js` displays a toast reporting `imported.length` even when duplicate prompts are skipped due to existing IDs (`imported.filter(...)`).
2. **Asynchronous Clipboard Race:** `copyPrompt` fires `navigator.clipboard.writeText(textToCopy)` without awaiting resolution, immediately bumping usage counts and setting copy states even if clipboard access is denied by browser permissions.
3. **Destructive Reset Vault:** `resetVault` in `AppContext.jsx` executes `localStorage.clear()`, wiping unrelated domain keys in the browser rather than selectively wiping `pk_*` application keys.
4. **Vite CSS Build Warnings:** `src/index.css` contains `whiteSpace: pre-wrap;` (line 504) and `boxShadow: var(--shadow-primary);` (line 570) instead of kebab-case CSS properties.
5. **ESLint Ignore Scope:** `eslint.config.js` does not ignore `android/` build directories or root `.jsx` prototypes, producing 740+ false-positive lint errors.
6. **ID Type Inconsistency:** Prompt IDs are created interchangeably as numbers (`Date.now()`, numeric seeds) and strings (`uuid` or stringified IDs), leading to loose comparisons (`String(x.id) === String(p.id)`).
7. **Synchronous SetState in Effects:** `ForgeStudio.jsx` and `ForgePanel.jsx` execute `setVals` synchronously inside `useEffect([vars])`, triggering cascading re-renders flagged by React 19 rules.

### 3.3 Potential Risks Requiring Testing
1. **LocalStorage Quota Exhaustion:** Storing images as Base64 DataURLs in `pk_prompts_v2` risks exceeding browser `localStorage` limits (typically 5MB).
2. **Unvalidated JSON Import:** Importing malformed JSON objects without schema validation can inject invalid objects into `prompts`, causing rendering crashes in `PromptCard` or `DetailPanel`.
3. **Android Path Resolution:** Capacitor `Directory.Data` file paths may not resolve properly across app updates or re-installations if stored as raw absolute URIs.

### 3.4 Missing Features (Identified for 2.0)
1. **GitHub Repository Hub:** No mechanism currently exists to import, organize, track, or inspect GitHub repositories.
2. **Unified Collections:** Prompts are currently bound to a single category rather than belonging to multiple collections. Repositories have no collection mapping.
3. **Prompt Versioning:** Prompts only store current state and usage counter history; there is no version history or diffing.
4. **Offline Structured Database:** Local persistence relies strictly on synchronous `localStorage` without IndexedDB indexing.
5. **Cross-Device Cloud Sync:** No backend synchronization, Supabase integration, or user accounts.
6. **Universal Search:** Search is currently restricted to local prompts in memory.

### 3.5 Proposed Improvements
1. **Stabilize Core via Vitest:** Introduce unit test coverage for prompt parsing, variable replacement, import validation, and clipboard error handling.
2. **Dexie.js IndexedDB Migration:** Shift from `localStorage` to IndexedDB with automatic, non-destructive legacy data migration.
3. **Refined SaaS UI:** Replace the current heavy neo-industrial theme with a disciplined, high-density developer SaaS aesthetic.
4. **Repository Data Model:** Implement a dedicated GitHub repository entity sharing a universal `resourceId` with prompts.

