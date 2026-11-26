/**
 * PromptKeeper 2.0 - Repository Capabilities Analyzer
 * Analyzes repository metadata, description, topics, and tech stack
 * to provide a clear, human-readable breakdown of what the repository
 * actually does, its key functional capabilities, and practical developer use cases.
 */

export function analyzeRepoCapabilities(repo) {
  if (!repo) return null;

  const desc = (repo.description || '').trim();
  const topics = Array.isArray(repo.topics) ? repo.topics.map(t => String(t).toLowerCase()) : [];
  const lang = repo.primaryLanguage || 'Unknown';
  const name = repo.name || '';
  const lowerDesc = desc.toLowerCase();

  const capabilities = [];
  const useCases = [];

  // 1. Primary summary
  const summary = desc || `Open-source ${lang} repository for ${name}.`;

  // 2. Functional Capability Detectors
  // A. Bookmarks / Knowledge Management / Read-it-later
  if (topics.some(t => t.includes('bookmark') || t.includes('knowledge') || t.includes('notes')) ||
      lowerDesc.includes('bookmark') || lowerDesc.includes('notes') || lowerDesc.includes('read-it-later')) {
    capabilities.push('Bookmark & Content Archiving: Save, organize, and retrieve links, personal notes, and media files.');
    useCases.push('Self-hosted alternative to Pocket, Raindrop, or Omnivore for centralizing technical links and notes.');
  }

  // B. AI / Machine Learning / LLMs / Automation
  if (topics.some(t => t.includes('ai') || t.includes('llm') || t.includes('gpt') || t.includes('machine-learning') || t.includes('openai')) ||
      lowerDesc.includes('ai-') || lowerDesc.includes('ai ') || lowerDesc.includes('machine learning') || lowerDesc.includes('automatic tagging') || lowerDesc.includes('llm')) {
    capabilities.push('AI-Assisted Processing: Automated semantic tagging, classification, and content enrichment without manual triage.');
    useCases.push('Automated workflow indexing and AI-driven content categorization.');
  }

  // C. Full-Text Search / Vector Search / Indexing
  if (topics.some(t => t.includes('search') || t.includes('elasticsearch') || t.includes('vector')) ||
      lowerDesc.includes('search') || lowerDesc.includes('indexing')) {
    capabilities.push('Deep Full-Text Search: Search across all stored content, metadata, and document bodies instantly.');
  }

  // D. Self-Hostable / Docker / Local-first
  if (topics.some(t => t.includes('self-hosted') || t.includes('docker') || t.includes('self-hostable')) ||
      lowerDesc.includes('self-host') || lowerDesc.includes('self-hosted')) {
    capabilities.push('Self-Hostable Deployment: Full data ownership, zero vendor lock-in, deployable via Docker or VPS.');
    useCases.push('Private, privacy-first deployment without recurring SaaS subscription costs.');
  }

  // E. UI Components / Design System / Frontend
  if (topics.some(t => t.includes('ui') || t.includes('component') || t.includes('design-system') || t.includes('tailwind')) ||
      lowerDesc.includes('component') || lowerDesc.includes('ui library') || lowerDesc.includes('design system')) {
    capabilities.push('Reusable UI Component System: Accessible, composable frontend components ready for production.');
    useCases.push('Frontend design system and rapid user interface prototyping.');
  }

  // F. Backend / API / Microservices
  if (topics.some(t => t.includes('api') || t.includes('framework') || t.includes('backend') || t.includes('microservice')) ||
      lowerDesc.includes('framework') || lowerDesc.includes('backend') || lowerDesc.includes('rest api')) {
    capabilities.push('Robust Backend & API Architecture: Structured endpoints, database bindings, and scalable business logic.');
  }

  // G. Developer Tooling / CLI / Automation
  if (topics.some(t => t.includes('cli') || t.includes('tool') || t.includes('devtools') || t.includes('terminal')) ||
      lowerDesc.includes('command line') || lowerDesc.includes('cli') || lowerDesc.includes('developer tool')) {
    capabilities.push('Developer CLI & Workflow Automation: Automates repetitive terminal tasks and dev operations.');
    useCases.push('CLI productivity tool and build pipeline integration.');
  }

  // H. Database / Storage / Sync
  if (topics.some(t => t.includes('database') || t.includes('sqlite') || t.includes('postgres') || t.includes('sync')) ||
      lowerDesc.includes('database') || lowerDesc.includes('storage') || lowerDesc.includes('synchronization')) {
    capabilities.push('Local & Cloud Persistence: Structured database storage, indexing, and data synchronization.');
  }

  // If description has multiple clean clauses and capabilities is short, extract them
  if (capabilities.length < 2 && desc) {
    const clauses = desc.split(/[.;]/).map(s => s.trim()).filter(s => s.length > 12);
    clauses.forEach(cl => {
      const formatted = cl.charAt(0).toUpperCase() + cl.slice(1);
      if (!capabilities.some(c => c.toLowerCase().includes(formatted.toLowerCase().slice(0, 20)))) {
        capabilities.push(formatted);
      }
    });
  }

  // Fallback if still empty
  if (capabilities.length === 0) {
    capabilities.push(`Primary functionality: ${desc || 'General utility and application logic.'}`);
  }

  // Fallback for use cases if empty
  if (useCases.length === 0) {
    useCases.push(`Codebase study, architectural pattern reference for ${lang} applications.`);
    useCases.push(`Integrate directly into engineering stack or use as a standalone project template.`);
  }

  // Detect tech stack tags
  const knownTech = [
    'nextjs', 'next.js', 'react', 'react-native', 'vue', 'svelte', 'tailwind', 'tailwindcss',
    'docker', 'graphql', 'postgres', 'postgresql', 'sqlite', 'rust', 'go', 'golang', 'python',
    'typescript', 'javascript', 'electron', 'tauri', 'redis', 'prisma', 'dexie', 'fastapi'
  ];
  const detectedTech = [];

  if (lang && lang !== 'Unknown') {
    detectedTech.push(lang);
  }

  topics.forEach(t => {
    const match = knownTech.find(k => t.toLowerCase() === k || t.toLowerCase().includes(k));
    if (match && !detectedTech.some(dt => dt.toLowerCase() === match)) {
      detectedTech.push(match.charAt(0).toUpperCase() + match.slice(1));
    }
  });

  return {
    summary,
    capabilities: capabilities.slice(0, 4),
    useCases: useCases.slice(0, 2),
    detectedTech: detectedTech.slice(0, 5)
  };
}

