# PromptKeeper 2.0 — Architecture Rules

1. **Foundations**: Preserve existing React, Vite, and Capacitor configuration. Do not replace with another meta-framework.
2. **Local-First**: The application must function 100% offline without mandatory login. IndexedDB is the primary local database.
3. **Dual Pillars**: GitHub repositories and AI prompts are equal first-class citizens connected by shared resource identities (UUIDs).
4. **Cloud-Optional**: Supabase PostgreSQL and Supabase Auth provide optional cross-device synchronization and account management.
5. **Separation of Concerns**: UI components must never communicate directly with storage or cloud primitives; use repository abstractions and domain hooks.
6. **No Regressions**: All existing prompt management, tagging, searching, sorting, chaining, Forge Studio, and Android features must remain intact.

