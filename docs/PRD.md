# PromptKeeper 2.0 — Product Requirements Document (PRD)

**Status:** Approved for Implementation Planning  
**Product Vision:** A unified, local-first developer knowledge workspace for organizing, tracking, refining, and reusing GitHub repositories and AI prompts with equal first-class status.

---

## 1. Product Objectives & Target Audience

### 1.1 Objectives
1. **Unify Development Knowledge:** Eliminate the friction of keeping AI prompts in one tool and starred/saved GitHub repositories in another.
2. **Local-First & Private:** Provide complete functionality without authentication or internet connectivity.
3. **Cloud-Optional Synchronization:** Allow seamless cross-device synchronization via Supabase without sacrificing local autonomy.
4. **Professional Developer Experience:** Deliver a fast, keyboard-driven, clutter-free desktop and mobile UI that looks and feels like modern high-end developer software.

### 1.2 Target Audience
- **Full-Stack Engineers & Architects:** Managing prompt templates for code generation, architectural analysis, refactoring, and tracking reusable libraries.
- **AI & Prompt Engineers:** Iterating on system prompts, complex variables, chain-of-thought protocols, and tracking reference AI repositories.
- **Engineering Leaders & Researchers:** Curating team prompt playbooks, tracking open-source libraries, and organizing project resources.

---

## 2. Core Pillars

```
┌────────────────────────────────────────────────────────┐
│                   PROMPTKEEPER 2.0                     │
├──────────────────────────┬─────────────────────────────┤
│      PILLAR 1: AI        │      PILLAR 2: CODE         │
│      PROMPT STUDIO       │      REPOSITORY HUB         │
├──────────────────────────┼─────────────────────────────┤
│ • Template Library       │ • GitHub Repository Hub     │
│ • Dynamic Variables      │ • Public URL Quick Import   │
│ • Multi-syntax Parsing   │ • Auto-cached Metadata      │
│ • Version History        │ • Lifecycle Statuses        │
│ • Model Configurations   │ • Personal Research Notes   │
│ • Prompt Chaining        │ • Topic & Language Filters  │
├──────────────────────────┴─────────────────────────────┤
│                 SHARED FOUNDATION                      │
│ • Unified Collections (Multi-membership)               │
│ • Universal Search & Filter Engine                     │
│ • Local-First Persistence (Dexie / IndexedDB)          │
│ • Optional Supabase Cross-Device Sync                  │
└────────────────────────────────────────────────────────┘
```

---

## 3. Product Modules

### 3.1 Dashboard
- **Overview Metrics:** Summary of total prompts, repositories, active collections, recent executions, and unorganized inbox count.
- **Recently Used & Pinned:** Fast-action dock for high-frequency prompts and pinned repositories.
- **Activity & Workflow Feed:** Track recently saved repos, prompt updates, and execution history.

### 3.2 Repository Hub
- **URL Quick Import:** Instant import via any public GitHub URL (e.g., `github.com/owner/repo`, `https://github.com/owner/repo.git`).
- **Metadata Ingestion:** Auto-fetch repo owner, name, description, primary language, topics/tags, stars, forks, license, open issues count, and last push timestamp.
- **Lifecycle Statuses:**
  - `Inbox` (Unprocessed)
  - `To Explore` (Backlog)
  - `Researching` (Active evaluation)
  - `Testing` (Hands-on POC)
  - `Using` (Active dependency)
  - `Completed` (Finished review/implementation)
  - `Archived` (Deprecated / historical reference)
- **Personal Annotations:** Markdown notes, custom tags, collection memberships, and favorite flags preserved during metadata refresh.
- **Views:** Toggle between dense Grid Cards and Compact List views.

### 3.3 Prompt Library
- **Preserved Core Features:** Retain all existing prompt browsing, category filters, model badges, tags, variable counters, favorites, and single-click copy actions.
- **Enhanced Filtering:** Multi-tag combination filtering, model filtering, category filtering, and sorting (Newest, Most Used, A-Z, Favorites).
- **Execution Tracking:** Real-time usage counting, execution timestamps, and history visualization.

### 3.4 Prompt Studio
- **Dual Authoring Modes:**
  - *Standard Template Editor:* Clean markdown editor with inline variable detection.
  - *Forge Studio (JSON Engine):* Deep structured editing with negative prompts, hyper-parameters, variable type validation (`text`, `number`, `date`, `email`, `url`, `textarea`, `select`), and live resolved preview.
- **Version History & Diffs:** Track snapshots of prompt revisions with rollback and side-by-side comparison.
- **Multi-Attachment Support:** Retain Capacitor native camera and web photo attachments.
- **Chaining:** Direct linking to successor prompts (`linkedPromptId`) and linked GitHub repositories.

### 3.5 Collections & Projects
- **Cross-Entity Organization:** Collections can contain both prompts and repositories simultaneously without duplication.
- **Multi-Membership:** Any prompt or repository can belong to zero, one, or multiple collections.
- **Project Workspaces:** Group related prompts, reference repositories, and notes for a specific feature or engagement.

### 3.6 Inbox
- **Zero-Friction Staging Area:** Quick capture bucket for raw prompts or newly imported repos requiring categorization, tagging, and status assignment.

### 3.7 Universal Search & Command Palette
- **Unified Global Search:** Real-time fuzzy query engine matching across prompt titles, prompt bodies, repository names, descriptions, personal notes, and tags.
- **Keyboard Shortcuts:** `Cmd+K` / `Ctrl+K` for global command palette and search, `Cmd+N` / `Ctrl+N` for quick creation dialog, `Esc` to dismiss drawers and modals.

### 3.8 Settings & Sync
- **Local Vault Management:** Complete JSON export, backup validation, schema integrity checks, and selective cache clearing.
- **Cloud Account (Optional):** Supabase Auth login (Email/Magic Link, GitHub OAuth), synchronization health monitor, manual "Sync Now" trigger, and device session list.

---

## 4. Non-Functional Requirements

| Metric | Target Requirement |
|---|---|
| **Startup / TTI** | Time-to-interactive under 400ms on desktop, under 800ms on mobile. |
| **Offline Performance** | 100% of read, write, search, and edit operations functional without network. |
| **Storage Capacity** | Up to 10,000 resources and attached images backed by IndexedDB without browser quota crashes. |
| **Responsiveness** | Fluid layout across 360px (mobile phones) to 2560px+ (ultra-wide monitors). |
| **Platform Compatibility** | Modern desktop browsers (Chrome, Firefox, Safari, Edge) and Android 8.0+ via Capacitor. |
| **Accessibility** | WCAG 2.1 AA compliant contrast ratios and keyboard navigability. |
| **Security** | Zero client-side storage of raw GitHub access tokens or Supabase service-role keys. |

