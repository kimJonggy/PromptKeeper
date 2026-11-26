-- PromptKeeper 2.0 - Supabase Cloud Synchronization Schema
-- Migration: 001_initial_schema.sql
-- Enables optional account-backed cloud synchronization for resources, prompts,
-- repositories, collections, and version snapshots with strict Row-Level Security (RLS).

-- 1. Resources (Unified Base Entity)
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('prompt', 'repo')),
  title TEXT NOT NULL,
  fav BOOLEAN NOT NULL DEFAULT FALSE,
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  sync_status TEXT NOT NULL DEFAULT 'synced',
  client_version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Prompts
CREATE TABLE IF NOT EXISTS public.prompts (
  resource_id UUID PRIMARY KEY REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legacy_id TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  model TEXT NOT NULL DEFAULT 'Universal',
  tags TEXT[] NOT NULL DEFAULT '{}',
  uses INT NOT NULL DEFAULT 0,
  current_version INT NOT NULL DEFAULT 1,
  body TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  thumbnail TEXT,
  images TEXT[] DEFAULT '{}',
  presets JSONB DEFAULT '[]'::jsonb,
  variable_config JSONB DEFAULT NULL,
  linked_prompt_id UUID,
  linked_repo_ids TEXT[] DEFAULT '{}',
  history INT[] DEFAULT '{}'
);

-- 3. Repositories (GitHub Hub)
CREATE TABLE IF NOT EXISTS public.repositories (
  resource_id UUID PRIMARY KEY REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  github_id BIGINT,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  description TEXT DEFAULT '',
  primary_language TEXT DEFAULT 'Unknown',
  topics TEXT[] DEFAULT '{}',
  stars INT DEFAULT 0,
  forks INT DEFAULT 0,
  open_issues INT DEFAULT 0,
  license TEXT,
  pushed_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  status TEXT NOT NULL DEFAULT 'inbox',
  personal_notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  is_pinned BOOLEAN DEFAULT FALSE,
  default_branch TEXT DEFAULT 'main'
);

-- 4. Collections
CREATE TABLE IF NOT EXISTS public.collections (
  id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder',
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, id)
);

-- 5. Resource Collections (Join Table)
CREATE TABLE IF NOT EXISTS public.resource_collections (
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (user_id, resource_id, collection_id)
);

-- 6. Prompt Versions (Revision History Snapshots)
CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  notes TEXT DEFAULT '',
  commit_message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- 7. Indexes for High-Performance Synchronization
CREATE INDEX IF NOT EXISTS idx_resources_user_updated ON public.resources (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.resources (user_id, type);
CREATE INDEX IF NOT EXISTS idx_prompts_category ON public.prompts (user_id, category);
CREATE INDEX IF NOT EXISTS idx_repositories_status ON public.repositories (user_id, status);
CREATE INDEX IF NOT EXISTS idx_repositories_fullname ON public.repositories (user_id, full_name);
CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt ON public.prompt_versions (user_id, prompt_id, version_number DESC);

-- 8. Enable Row-Level Security (RLS) on all tables
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

-- 9. Row-Level Security Policies (Scoped strictly to auth.uid())
-- Resources
CREATE POLICY "Users can view their own resources" ON public.resources
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resources" ON public.resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own resources" ON public.resources
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resources" ON public.resources
  FOR DELETE USING (auth.uid() = user_id);

-- Prompts
CREATE POLICY "Users can view their own prompts" ON public.prompts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own prompts" ON public.prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompts" ON public.prompts
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompts" ON public.prompts
  FOR DELETE USING (auth.uid() = user_id);

-- Repositories
CREATE POLICY "Users can view their own repositories" ON public.repositories
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own repositories" ON public.repositories
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own repositories" ON public.repositories
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own repositories" ON public.repositories
  FOR DELETE USING (auth.uid() = user_id);

-- Collections
CREATE POLICY "Users can view their own collections" ON public.collections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own collections" ON public.collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own collections" ON public.collections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own collections" ON public.collections
  FOR DELETE USING (auth.uid() = user_id);

-- Resource Collections
CREATE POLICY "Users can view their own resource collections" ON public.resource_collections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own resource collections" ON public.resource_collections
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.resources r WHERE r.id = resource_id AND r.user_id = auth.uid())
  );
CREATE POLICY "Users can update their own resource collections" ON public.resource_collections
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own resource collections" ON public.resource_collections
  FOR DELETE USING (auth.uid() = user_id);

-- Prompt Versions
CREATE POLICY "Users can view their own prompt versions" ON public.prompt_versions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own prompt versions" ON public.prompt_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own prompt versions" ON public.prompt_versions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own prompt versions" ON public.prompt_versions
  FOR DELETE USING (auth.uid() = user_id);

