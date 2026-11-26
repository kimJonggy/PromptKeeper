# PromptKeeper 2.0 — Data Safety Rules

1. **User Data Sanctity**: Never clear, reset, or overwrite `localStorage` or `IndexedDB` without explicit user permission and verified rollback backups.
2. **Backward Compatibility**: Preserve existing prompt keys (`pk_prompts_v2`, `pk_categories`, `pk_cat_colors`, `pk_model_colors`, `pk_onboarding_v1`) during migrations. Keep legacy data intact until migration is verified.
3. **Idempotent Migrations**: All migration routines must be safely resumable and verify input schemas before writing.
4. **Secret Protection**: Never commit or expose API keys, Supabase service-role keys, or OAuth credentials in client bundles (`VITE_*`) or Git history.
5. **Conflict Resolution**: Cloud synchronization must employ deterministic revision tracking, outbox queuing, and soft tombstones. Never silently drop local un-synced edits.

