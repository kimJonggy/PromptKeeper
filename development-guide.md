# PromptKeeper 2.0 — Complete Antigravity Development Guide

Hybrid architecture selected

React · Vite · Capacitor · Supabase · GitHub API

You should use Google Antigravity with Gemini Hydrogen as your development agent, but avoid asking it to redesign and implement everything in one enormous prompt.

The best approach is to establish project rules, audit the existing code, create a technical plan, and implement the redesign in controlled phases.

I'll give you the instructions, architecture, prompts, development sequence, and verification requirements you can use directly in Antigravity.

## 1. The final product we're building

PromptKeeper 2.0

Personal developer knowledge workspace

Repository Hub

Save, track, organize

Prompt Studio

Create, version, reuse

Collections

Connect all resources

Universal Search

Find everything instantly

IndexedDB + Optional Supabase Sync

### The hybrid architecture

The application should work without signing in. Users can save repositories, create prompts, organize collections, and search their library locally.

When they connect an account, they can synchronize resources across devices.

Core principle: Local-first, cloud-optional, offline-capable.

| Component          | Technology                     | Responsibility             |
| ------------------ | ------------------------------ | -------------------------- |
| Frontend           | Existing React + Vite          | User interface             |
| Local database     | Dexie + IndexedDB              | Offline resource storage   |
| Cloud database     | Supabase PostgreSQL            | Optional cross-device sync |
| Authentication     | Supabase Auth                  | User accounts              |
| GitHub integration | GitHub REST API                | Repository metadata        |
| API layer          | Vercel Functions               | Secure server operations   |
| State management   | Existing React state initially | UI interactions            |
| Styling            | Tailwind CSS + design tokens   | Consistent premium UI      |
| Mobile             | Existing Capacitor             | Android compatibility      |
| Deployment         | Vercel                         | Web hosting                |

Do not replace React, Vite, or Capacitor. Refactor incrementally and preserve the working PromptKeeper features.

## 2. Set up your Antigravity workspace

### Step 1 — Clone the existing repository

Open Antigravity's integrated terminal and run:

```

git clone https://github.com/adnan911/promptKeeper.git
cd promptKeeper
npm ci
npm run dev

```

Open the local address displayed by Vite, normally `http://localhost:5173`.

Check that the existing app works before modifying anything.

### Step 2 — Create a safe development branch

Stop the dev server if necessary, then run:

```

git status
git switch -c feat/promptkeeper-v2
git branch --show-current

```

If `git status` shows unexpected changes, inspect them before proceeding. Never discard existing work just to create a clean branch.

### Step 3 — Back up existing data

This is critical because your current application uses browser localStorage.

Before redesigning:

1. Open your existing PromptKeeper in the browser where your real prompts are saved.
2. Use its JSON export feature to download a backup.
3. Store the exported file somewhere safe outside the repository.
4. Verify that the JSON contains your expected prompts.
5. Make another backup before any storage migration.

Do not clear browser data or uninstall the Android app during development.

### Step 4 — Configure Antigravity rules

Google's current documentation confirms that Antigravity supports project-level `AGENTS.md` files and `.agents/rules/*.md` rules. These are discovered automatically and can enforce persistent development constraints.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://antigravity.google&sz=32)

Google Antigravity Docs+1

Create this project structure:

```

promptKeeper/
├── AGENTS.md
├── .agents/
│   └── rules/
│       ├── architecture.md
│       ├── design-system.md
│       └── data-safety.md
├── docs/
│   ├── AUDIT.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── MIGRATION.md
│   └── TASKS.md
├── src/
├── android/
└── package.json

```

You don't need to create all these files manually. We'll instruct Antigravity to create them after it audits the codebase.

## 3. Your permanent Antigravity master rules

Create `AGENTS.md` at the repository root and paste the following. This is the most important instruction file because it establishes how Gemini should behave throughout the project.

# PromptKeeper 2.0 — Permanent Engineering Instructions

## Identity and Responsibilities

You are the principal software architect, senior React engineer, product designer, database architect, QA engineer, and technical director for PromptKeeper 2.0.

You are working on an EXISTING application, not a greenfield project.

Repository: [https://github.com/adnan911/promptKeeper](https://github.com/adnan911/promptKeeper)

Your responsibility is to transform PromptKeeper into a premium, local-first developer knowledge workspace for managing GitHub repositories and AI prompts equally.

## Core Product Vision

PromptKeeper is a unified workspace for collecting, organizing, searching, tracking, and reusing GitHub repositories and AI prompts.

The application must be:

- Beautiful and professional
- Fast and responsive
- Local-first and offline-capable
- Cloud-sync optional
- Secure and reliable
- Accessible
- Maintainable
- Compatible with the existing Android application

## Architecture Requirements

Preserve the existing React, Vite, and Capacitor foundations.

Target architecture:

- React and Vite for frontend
- TypeScript adoption incrementally
- IndexedDB with Dexie for structured local persistence
- Supabase PostgreSQL for optional cloud synchronization
- Supabase Auth for optional user accounts
- GitHub REST API for repository metadata
- Secure backend endpoints for authenticated integrations
- Tailwind CSS and reusable UI components where appropriate
- Existing Vercel deployment workflow

Do not replace existing technologies without explaining the technical necessity.

## Non-Negotiable Rules

1. Inspect relevant existing files before editing.
2. Never rewrite the entire application unnecessarily.
3. Preserve all existing working functionality.
4. Never delete user data without explicit approval.
5. Never silently reset localStorage or IndexedDB.
6. Never expose secrets, API keys, or authentication tokens.
7. Never invent existing features or claim untested functionality works.
8. Never install unnecessary dependencies.
9. Never make destructive database changes without a migration and rollback plan.
10. Never commit secrets, environment files, or production credentials.
11. Never force-push, reset, or overwrite existing Git history without approval.
12. Never deploy to production without explicit authorization.
13. Never claim tests passed unless they were actually executed.
14. Never introduce mock data into real user storage.
15. Never change existing exported data formats without backward compatibility.

## Preserve Existing Features

Audit and preserve:

- Prompt creation and editing
- Prompt deletion
- Categories and tags
- Favorites
- Search and sorting
- Model selection
- Prompt import and export
- Prompt usage tracking
- Prompt notes
- Linked prompts
- Prompt images
- Forge Studio
- JSON prompt editing
- Theme preferences
- Keyboard shortcuts
- Existing onboarding
- Android/Capacitor functionality

Check actual source code before assuming implementation details.

## Product Modules

Build these modules:

1. Dashboard
2. Repository Hub
3. Prompt Library
4. Prompt Studio
5. Collections
6. Projects
7. Inbox
8. Favorites
9. Global Search
10. Settings

GitHub repositories and AI prompts are equal first-class resources.

## Data Architecture

Use stable UUIDs for internal resources.

Store repositories and prompts as separate typed entities connected through shared resource identity.

Support:

- Tags
- Collections
- Resource relationships
- Notes
- Favorites
- Statuses
- Timestamps
- Prompt versions
- GitHub metadata
- Soft deletion
- Synchronization metadata

Never use GitHub stars or forks as the primary identity of a repository.

## Hybrid Storage Requirements

Local functionality must work without authentication.

IndexedDB is the primary local application data store.

Supabase synchronization is optional.

Never block local creation, editing, search, or organization because a cloud service is unavailable.

Implement explicit synchronization states and deterministic conflict handling.

Cloud failures must not destroy local changes.

## UI/UX Requirements

Build a premium, restrained SaaS interface.

Design principles:

- Minimal and information-rich
- Consistent spacing and typography
- Strong visual hierarchy
- Professional dark and light themes
- Subtle, purposeful animations
- Excellent keyboard navigation
- Accessible contrast
- Responsive layouts
- Clear loading, error, and empty states

Avoid excessive gradients, decorative glass effects, generic dashboards, unnecessary animations, and visual clutter.

Use shared design tokens and reusable components.

## GitHub Integration

Support public repository import by URL without requiring authentication.

Normalize GitHub URLs and prevent duplicate saved repositories.

Retrieve and cache supported repository metadata.

Respect GitHub API rate limits.

Preserve personal notes, collections, and statuses during metadata refresh.

Use secure server-side authentication for private repository access.

## Engineering Workflow

For each task:

1. Read relevant existing implementation.
2. Identify dependencies and possible regressions.
3. Propose a concise implementation plan.
4. Make focused changes.
5. Run relevant tests and checks.
6. Review the resulting diff.
7. Report changed files and verification results.
8. Update project documentation.
9. Stop at the requested milestone.

Do not implement unrelated features.

## Quality Standards

Use clear naming, modular components, reusable hooks, and typed interfaces where practical.

Validate external data.

Handle loading, error, and empty states.

Prefer incremental migrations.

Write tests for important data transformations and business logic.

Ensure keyboard and mobile usability.

## Completion Report

After each implementation phase, report:

- Features completed
- Files created or modified
- Existing features preserved
- Tests executed
- Test results
- Known limitations
- Remaining risks
- Recommended next task

## Final Objective

Deliver a production-quality PromptKeeper 2.0 that is genuinely useful for organizing GitHub repositories and AI prompts, while preserving the existing application's strengths and user data.

## 4. The exact workflow to follow in Antigravity

Use one phase at a time. Start a fresh agent conversation when a phase becomes too large, but keep the same repository and project rules.

Stage A — Audit and planning

Read the existing codebase, identify risks, generate technical documentation. No feature implementation yet.

Stage B — Data protection

Add tests, backup verification, schema validation, and migration groundwork.

Stage C — Premium redesign

Build design tokens, navigation, cards, detail views, and responsive layouts while retaining current behavior.

Stage D — Repository Hub

Implement repository saving, metadata, filtering, statuses, and collections.

Stage E — Hybrid synchronization

Add local database migration, cloud authentication, synchronization, and recovery.

Stage F — Testing and release

Validate functionality, performance, Android compatibility, and deployment readiness.

## 5. Copy these prompts into Antigravity, one by one

These are implementation instructions, not generic brainstorming prompts. Each prompt defines what Gemini must inspect, build, test, and deliver.

### Prompt 1 — Complete repository audit

RUN FIRST · PLANNING ONLY

Act as the Principal Software Architect and Technical Director for PromptKeeper 2.0.

Read AGENTS.md and inspect the complete existing repository before making changes.

Your first assignment is a comprehensive, evidence-based audit.

Inspect:

- package.json and dependency configuration
- src/App.jsx and application entry points
- Every component under src/components
- Hooks, utilities, and data models
- Existing CSS and theme implementations
- Forge Studio and JSON editor functionality
- Prompt creation, editing, deletion, import, and export
- Existing localStorage schemas and keys
- Android and Capacitor configuration
- GitHub Actions, deployment, and build configuration
- Security, accessibility, performance, and technical debt

Identify every existing feature and the files responsible for it.

Separate findings into:

1. Verified existing functionality
2. Confirmed defects
3. Potential risks requiring testing
4. Missing features
5. Proposed improvements

Create these documents:

docs/AUDIT.md\
docs/PRD.md\
docs/ARCHITECTURE.md\
docs/DATA_MODEL.md\
docs/MIGRATION.md\
docs/TASKS.md

The PRD must give equal priority to GitHub repository management and AI prompt management.

The architecture must support local-first IndexedDB storage and optional Supabase cloud synchronization.

The migration document must explain how to preserve existing localStorage prompts, categories, tags, images, preferences, and usage history.

The task list must include dependencies, acceptance criteria, priorities, and implementation order.

Run existing read-only checks where practical.

Do not modify application behavior or implement features yet.

At completion, summarize the audit, architectural recommendations, and any blockers. Wait for my approval before implementation.

What you should expect: Six technical documents, a confirmed feature inventory, and an implementation plan grounded in the actual source.

Do not proceed if the agent skips major components or invents functionality.

### Prompt 2 — Protect the existing application

RUN AFTER REVIEWING THE AUDIT

Implement Phase 0: Stabilization and Data Protection.

Read AGENTS.md, docs/AUDIT.md, docs/MIGRATION.md, and docs/TASKS.md.

Objectives:

1. Establish a reliable test framework appropriate for the existing React/Vite application.
2. Add regression tests for existing prompt operations.
3. Document and validate the current localStorage data format.
4. Implement a non-destructive backup verification mechanism.
5. Fix confirmed clipboard success and usage-count issues.
6. Fix inaccurate import counts.
7. Validate imported JSON before storing it.
8. Protect against malformed prompt records.
9. Preserve all existing prompt fields and attachments.
10. Add a safe migration-readiness test suite.

Do not migrate user data yet.

Do not introduce Supabase or replace the existing storage system during this phase.

Do not remove any existing UI features.

Run npm run build, npm run lint, and the relevant tests.

Distinguish pre-existing failures from newly introduced failures.

Report all changed files and test results.

Stop after Phase 0.

### Prompt 3 — Premium UI/UX redesign

RUN AFTER STABILIZATION

Implement Phase 1: Premium PromptKeeper UI/UX Redesign.

Read AGENTS.md, docs/PRD.md, docs/ARCHITECTURE.md, and the current UI components.

Redesign the existing application into a premium developer knowledge workspace.

Visual direction:

- Professional modern SaaS interface
- Refined dark and light themes
- Deep charcoal backgrounds
- Restrained amber/orange accent
- Clean typography
- Subtle borders and shadows
- Rounded but disciplined component geometry
- Spacious and consistent layouts
- Excellent readability
- Purposeful microinteractions

Implement:

1. Responsive application shell
2. Collapsible navigation sidebar
3. Global toolbar
4. Dashboard layout
5. Repository Hub navigation placeholder
6. Improved Prompt Library
7. Reusable resource cards
8. Grid/list view switching
9. Unified detail panel pattern
10. Consistent dialogs, forms, menus, and notifications
11. Design tokens
12. Accessible keyboard navigation
13. Mobile-friendly layouts

Preserve existing PromptKeeper features and functionality.

Do not replace Forge Studio with a simplified editor.

Do not implement GitHub backend integration during this phase.

Avoid unnecessary dependencies and large rewrites.

Review the actual interface in a browser at desktop and mobile viewport sizes.

Test all existing core workflows.

Deliver a visually consistent, functional application and stop for review.

### Prompt 4 — Build the GitHub Repository Hub

CORE PRODUCT FEATURE

Implement Phase 2: GitHub Repository Hub.

Read AGENTS.md and all approved architecture documents.

Build a complete local-first GitHub repository management experience.

Requirements:

Repository import:

- Paste a GitHub repository URL
- Normalize supported GitHub URL formats
- Validate owner and repository identifiers
- Retrieve public metadata from GitHub
- Detect duplicate repositories using stable identity
- Save repositories locally
- Handle invalid, deleted, private, and unavailable repositories

Repository fields:

- GitHub repository ID
- Owner and name
- Canonical URL
- Description
- Primary language
- Topics
- Stars and forks
- License
- Last pushed timestamp
- Last metadata synchronization timestamp
- Personal notes
- User-defined status
- Tags
- Favorites
- Collections

Repository statuses:

- Inbox
- To Explore
- Researching
- Testing
- Using
- Completed
- Archived

UI:

- Repository grid view
- Repository list view
- Repository detail page
- Search and filters
- Status management
- Sorting
- Favorite and pin actions
- Personal notes
- Collection assignment
- Metadata refresh

Architecture:

- Keep repository data separate from prompt-specific data.
- Use a shared resource model for common operations.
- Store personal metadata independently from GitHub metadata.
- Never overwrite user notes or statuses during refresh.
- Respect GitHub API rate limits.
- Support public repositories without requiring authentication.
- Do not store GitHub tokens in browser storage.

Test URL parsing, duplicate detection, API failures, metadata refresh, and offline behavior.

Do not implement private repository OAuth yet.

Do not break the existing Prompt Library.

Stop after this phase and provide a verification report.

### Prompt 5 — Unified collections and Prompt Studio

CONNECT BOTH PRODUCT PILLARS

Implement Phase 3: Unified Resource Management.

Read AGENTS.md and the existing resource and prompt implementations.

Build one organizational system shared by repositories and prompts.

Requirements:

1. Collections containing both prompts and repositories.
2. Multiple collections per resource.
3. Shared tags and favorites.
4. Inbox for uncategorized resources.
5. Global search across both resource types.
6. Saved sorting and filtering preferences.
7. Relationships between prompts and repositories.
8. Project groupings for related resources.
9. Recently viewed and recently used resources.
10. Bulk organization actions.

Improve Prompt Studio while preserving existing capabilities.

Add:

- Prompt version history
- Version comparison
- Reusable variables
- Prompt-to-repository links
- Clear copy and usage feedback
- Markdown-friendly editing
- Draft recovery

Do not remove Forge Studio or existing JSON workflows.

Create tests for collection membership, resource relationships, search, and version history.

Ensure that a prompt or repository can belong to multiple collections without duplication.

Verify mobile usability and existing prompt compatibility.

Stop after completion and report results.

## 6. Hybrid storage: the most important engineering phase

This needs particular care. Offline synchronization is not simply saving records to Supabase.

### Recommended data flow

React application

Create · Edit · Delete · Search

Dexie / IndexedDB

Immediate local writes and reads

Durable outbox

Pending changes · Retry · Sync state

Authenticated synchronization API

Validation · Conflict detection · Idempotency

Supabase PostgreSQL

Optional account-backed cloud storage

### Synchronization rules

| Situation                       | Required behavior                    |
| ------------------------------- | ------------------------------------ |
| Offline                         | Continue using local database        |
| Online                          | Synchronize queued changes           |
| User not signed in              | Keep data local                      |
| Cloud temporarily unavailable   | Retry without losing edits           |
| Same item edited on two devices | Detect revision conflict             |
| Resource deleted offline        | Queue a tombstone                    |
| Repeated sync request           | Idempotent operation                 |
| First account connection        | Preview and merge local data         |
| User signs out                  | Clearly explain local data retention |

Do not rely on device timestamps alone to resolve conflicting edits. Use server revisions, operation IDs, and explicit conflict handling. For the first release, preserving both conflicting versions is safer than silently discarding one.

### Prompt 6 — Implement hybrid storage

Implement Phase 4: Hybrid Local-First Storage and Optional Cloud Synchronization.

Read AGENTS.md, docs/DATA_MODEL.md, docs/MIGRATION.md, and docs/ARCHITECTURE.md.

This is a data-sensitive phase. Work incrementally.

Part A: Local database

- Introduce Dexie and IndexedDB.
- Define versioned schemas for resources, prompts, repositories, collections, tags, relationships, prompt versions, and sync operations.
- Implement a repository abstraction so UI components do not depend directly on database details.
- Support offline reads and writes.
- Add migration tests.

Part B: Legacy migration

- Read existing localStorage data without deleting it.
- Preserve original prompt IDs through an explicit mapping.
- Preserve prompts, categories, tags, notes, favorites, usage history, images, and preferences.
- Validate migrated records.
- Handle malformed data and quota failures.
- Make migration idempotent and resumable.
- Verify record counts and relationships.
- Retain original localStorage until successful verification and explicit cleanup approval.
- Provide export and rollback options.

Part C: Optional cloud storage

- Introduce Supabase Auth and PostgreSQL.
- Add migrations and row-level security policies.
- Scope all private records to their authenticated owner.
- Keep service-role credentials server-side.
- Implement an authenticated sync API.

Part D: Synchronization

- Use a durable local operation outbox.
- Give each operation a unique ID.
- Make server writes idempotent.
- Track server revisions.
- Support retry with exponential backoff.
- Support tombstones for deletions.
- Detect concurrent edits.
- Preserve conflicting data instead of silently overwriting it.
- Prevent duplicate records.
- Support initial account linking and local/cloud merge.
- Display synchronization state in the UI.

Part E: Verification

Test:

- Offline creation
- Offline editing
- Reconnection
- Retry after network failure
- Duplicate operations
- Concurrent device edits
- Deleted resources
- First sign-in migration
- Sign-out behavior
- Existing localStorage migration
- Android compatibility

Do not deploy production database migrations without approval.

Do not delete legacy data.

Provide a migration verification report and stop.

## 7. Environment variables and security

When you reach the cloud phase, create a Supabase project and configure environment variables.

Example:

```

VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLIC_KEY

```

The publishable key is designed for client use, but your database still requires correct row-level security.

Keep secrets such as Supabase service-role keys and GitHub OAuth client secrets in secure server environment variables, never in `VITE_` variables.

For GitHub access, start with public repository metadata. Add private repository permissions only when there is a clear need.

## 8. Final QA and release prompt

Act as an independent Senior QA Engineer and Release Director.

Perform a comprehensive release-readiness review of PromptKeeper 2.0.

Do not assume previous phases are correct.

Audit:

- Existing prompt functionality
- Repository management
- Collections and relationships
- Search and filters
- Prompt Studio
- Local IndexedDB storage
- Legacy data migration
- Optional Supabase synchronization
- Authentication and authorization
- GitHub API handling
- Android/Capacitor compatibility
- Responsive UI
- Accessibility
- Performance
- Error recovery
- Security

Run all available automated checks.

Perform browser-based workflow testing where supported.

Verify desktop and mobile layouts.

Test offline and reconnection scenarios.

Check for exposed secrets and insecure authorization rules.

Check for data loss, duplicate resources, and destructive migrations.

Generate docs/RELEASE_CHECKLIST.md with:

- Passed tests
- Failed tests
- Unverified areas
- Critical blockers
- Noncritical issues
- Deployment instructions
- Rollback instructions

Fix only clearly scoped, safe defects.

Do not deploy automatically.

Give a final GO or NO-GO recommendation supported by actual test evidence.

## 9. How to manage Gemini Hydrogen effectively

Use Gemini Hydrogen for focused coding tasks. For complex architecture or difficult synchronization bugs, use a stronger planning/review model if your Antigravity configuration provides one.

Google's Antigravity documentation describes workflows where a planner can delegate routine implementation to Hydrogen.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://antigravity.google&sz=32)

Google Antigravity Docs+1

Use these practices throughout development:

- One milestone per conversation: Avoid asking the agent to build five major features simultaneously.
- Review before accepting changes: Inspect changed files and confirm the agent has not deleted working functionality.
- Require real tests: Build success is not proof that the app works.
- Commit after stable milestones: Keep a recoverable Git history.
- Update documentation: Each phase should leave accurate notes for the next conversation.
- Protect production: Do not give unrestricted approval for deployment, database deletion, or credential changes.

After a successful milestone, use a commit such as:

```

git status
git diff --check
npm run lint
npm run build
git add .
git commit -m "feat: complete approved PromptKeeper milestone"

```

Review `git status` and the staged diff before committing. `git add .` should only be used after checking that no secrets, backups, or unwanted files will be included.

## 10. Your development progress tracker

PromptKeeper 2.0 milestones

0 / 7

Repository audit and documentation

Read existing implementation, generate PRD and architecture

Data protection and regression tests

Backups, tests, import and clipboard fixes

Premium UI redesign

Navigation, design system, responsive layouts

GitHub Repository Hub

URL imports, metadata, statuses and detail views

Unified collections and Prompt Studio

Cross-resource organization, search, versioning

Hybrid IndexedDB and Supabase

Migration, authentication, sync and conflict handling

Quality assurance and release

Browser, mobile, security and regression testing

&#x20;Copy progress checklist

## What you should do right now

Start with just these actions:

1. Clone PromptKeeper and verify that the existing application runs.
2. Export a backup of your real prompt data.
3. Create the `feat/promptkeeper-v2` branch.
4. Add the permanent `AGENTS.md` instructions.
5. Paste Prompt 1 — Complete repository audit into Gemini Hydrogen.

Do not start with the UI redesign or Supabase integration. First establish a reliable understanding of the application and protect its existing data.

Once Antigravity finishes Prompt 1, bring its `AUDIT.md`, `ARCHITECTURE.md`, and `TASKS.md` back here. I can review them against the actual PromptKeeper architecture and identify any weak design decisions before you allow the agent to change the code.

That will give you a much more controlled path to a polished, production-ready PromptKeeper 2.0.
