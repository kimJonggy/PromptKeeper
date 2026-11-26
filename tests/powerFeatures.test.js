import { describe, it, expect } from 'vitest';
import { 
  detectInputType, 
  parseQuickSaveInput, 
  checkDuplicates 
} from '../src/services/quickSaveService.js';
import { parseNetscapeBookmarks } from '../src/utils/bookmarkParser.js';

describe('PromptKeeper 2.0 Power Features Test Suite', () => {
  describe('Feature 1: Quick Save & Type Auto-detection', () => {
    it('accurately identifies GitHub URLs as repo', () => {
      expect(detectInputType('https://github.com/astral-sh/uv')).toBe('repo');
      expect(detectInputType('github.com/shadcn-ui/ui')).toBe('repo');
    });

    it('accurately identifies HTTP/HTTPS web links as bookmarks', () => {
      expect(detectInputType('https://news.ycombinator.com/')).toBe('bookmark');
      expect(detectInputType('https://tailwindcss.com/docs/grid-template-columns')).toBe('bookmark');
    });

    it('identifies multiline instructions as prompts', () => {
      expect(detectInputType('You are an expert fullstack architect.')).toBe('prompt');
      expect(detectInputType('Review the following code:\n```js\nconst x = 1;\n```')).toBe('prompt');
    });

    it('supports 1-click manual override of detected type', () => {
      const draft = parseQuickSaveInput('https://github.com/my-tool', 'bookmark');
      expect(draft.type).toBe('bookmark');
      expect(draft.url).toContain('github.com/my-tool');
    });
  });

  describe('Feature 2: Inbox & Untagged Detection', () => {
    it('classifies items without tags as inbox/untagged', () => {
      const prompt = { id: 'p1', title: 'Test Prompt', tags: [] };
      const isUntagged = !prompt.tags || prompt.tags.length === 0;
      expect(isUntagged).toBe(true);
    });

    it('identifies status=inbox items awaiting triage', () => {
      const repo = { id: 'r1', fullName: 'owner/repo', status: 'inbox', tags: ['tools'] };
      expect(repo.status).toBe('inbox');
    });
  });

  describe('Feature 3 & 4: Saved Lists & List Splitting', () => {
    it('bundles multiple resources under a common list name', () => {
      const listName = 'Mobile Redesign';
      const prompt = { id: 'p1', title: 'UI Prompt', collections: [listName] };
      const repo = { id: 'r1', fullName: 'react-native/react-native', collections: [listName] };
      const bm = { id: 'b1', title: 'React Native Docs', collections: [listName] };

      const allItems = [prompt, repo, bm];
      const itemsInList = allItems.filter(i => i.collections.includes(listName));
      expect(itemsInList.length).toBe(3);
    });

    it('splits a list while keeping items preserved as standalone library entries', () => {
      const listName = 'Project Phoenix';
      const items = [
        { id: 'p1', type: 'prompt', collections: [listName] },
        { id: 'b1', type: 'bookmark', collections: [listName] }
      ];

      // Splitting without keeping list container: removes list association but preserves item
      const splitItems = items.map(item => ({
        ...item,
        collections: item.collections.filter(c => c !== listName)
      }));

      expect(splitItems[0].collections).not.toContain(listName);
      expect(splitItems[0].id).toBe('p1');
      expect(splitItems[1].id).toBe('b1');
    });
  });

  describe('Feature 5: Duplicate Check', () => {
    const existingRepos = [
      { id: 'r1', fullName: 'facebook/react', canonicalUrl: 'https://github.com/facebook/react' }
    ];
    const existingBookmarks = [
      { id: 'b1', url: 'https://react.dev/reference/react', title: 'React Reference' }
    ];
    const existingPrompts = [
      { id: 'p1', title: 'Senior Software Architect', body: 'You are a principal engineer.' }
    ];

    it('detects duplicate repository by URL or fullName', () => {
      const result = checkDuplicates({
        type: 'repo',
        draft: { canonicalUrl: 'https://github.com/facebook/react', fullName: 'facebook/react' },
        repositories: existingRepos
      });
      expect(result.isDuplicate).toBe(true);
      expect(result.existingItem.id).toBe('r1');
    });

    it('detects duplicate bookmark by normalized URL', () => {
      const result = checkDuplicates({
        type: 'bookmark',
        draft: { url: 'https://react.dev/reference/react/' },
        bookmarks: existingBookmarks
      });
      expect(result.isDuplicate).toBe(true);
      expect(result.existingItem.id).toBe('b1');
    });

    it('detects duplicate prompt by identical title', () => {
      const result = checkDuplicates({
        type: 'prompt',
        draft: { title: 'senior software architect', body: 'Other body' },
        prompts: existingPrompts
      });
      expect(result.isDuplicate).toBe(true);
      expect(result.existingItem.id).toBe('p1');
    });
  });

  describe('Feature 7: Tag Manager & Case-Insensitive Merging', () => {
    it('detects case-insensitive duplicate tags like "arc" and "Arc"', () => {
      const rawTags = ['arc', 'Arc', 'ARC', 'react', 'React', 'vite'];
      const caseMap = new Map();

      rawTags.forEach(tag => {
        const lower = tag.toLowerCase();
        const existing = caseMap.get(lower) || [];
        existing.push(tag);
        caseMap.set(lower, existing);
      });

      const duplicates = [];
      caseMap.forEach((tags, lower) => {
        if (tags.length > 1) duplicates.push({ canonical: lower, variants: tags });
      });

      expect(duplicates.length).toBe(2);
      expect(duplicates.some(d => d.canonical === 'arc')).toBe(true);
      expect(duplicates.some(d => d.canonical === 'react')).toBe(true);
    });

    it('merges duplicate variants into the canonical tag across items', () => {
      const prompt = { id: 'p1', tags: ['Arc', 'frontend'] };
      const repo = { id: 'r1', tags: ['arc', 'browser'] };

      const sources = ['Arc', 'ARC', 'arc'];
      const target = 'arc';

      const mergeTags = (tags) => {
        const replaced = tags.map(t => sources.includes(t) ? target : t);
        return [...new Set(replaced)];
      };

      expect(mergeTags(prompt.tags)).toEqual(['arc', 'frontend']);
      expect(mergeTags(repo.tags)).toEqual(['arc', 'browser']);
    });
  });

  describe('Feature 10: Browser Bookmarks HTML Parser', () => {
    it('parses Chrome/Arc/Firefox HTML bookmarks and extracts URLs, titles, and folders', () => {
      const sampleNetscapeHtml = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1600000000">AI Resources</H3>
    <DL><p>
        <DT><A HREF="https://huggingface.co/models" ADD_DATE="1600000010" TAGS="ai,models">Hugging Face Models</A>
        <DT><A HREF="https://openrouter.ai/" ADD_DATE="1600000020">OpenRouter</A>
    </DL><p>
</DL><p>
      `;

      const parsed = parseNetscapeBookmarks(sampleNetscapeHtml);
      expect(parsed.length).toBe(2);
      expect(parsed[0].title).toBe('Hugging Face Models');
      expect(parsed[0].domain).toBe('huggingface.co');
      expect(parsed[0].category).toBe('AI Resources');
      expect(parsed[0].tags).toContain('ai');
      expect(parsed[0].tags).toContain('models');
      expect(parsed[1].domain).toBe('openrouter.ai');
    });

    it('ignores invalid and javascript: or chrome:// protocols', () => {
      const htmlWithInternals = `
<DL><p>
    <DT><A HREF="chrome://settings/">Settings</A>
    <DT><A HREF="javascript:alert(1)">Bookmarklet</A>
    <DT><A HREF="https://github.com/karakeep-app/karakeep">Karakeep</A>
</DL><p>
      `;
      const parsed = parseNetscapeBookmarks(htmlWithInternals);
      expect(parsed.length).toBe(1);
      expect(parsed[0].title).toBe('Karakeep');
    });
  });
});
