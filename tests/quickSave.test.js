import { describe, it, expect } from 'vitest';
import { 
  detectInputType, 
  parseQuickSaveInput, 
  checkDuplicates, 
  parseBulkInput 
} from '../src/services/quickSaveService.js';
import { parseNetscapeBookmarks } from '../src/utils/bookmarkParser.js';

describe('Quick Save & Duplicate Check Service', () => {
  describe('detectInputType', () => {
    it('detects GitHub repository URLs', () => {
      expect(detectInputType('https://github.com/facebook/react')).toBe('repo');
      expect(detectInputType('https://github.com/torvalds/linux.git')).toBe('repo');
      expect(detectInputType('github.com/vercel/next.js')).toBe('repo');
    });

    it('detects general website URLs as bookmarks', () => {
      expect(detectInputType('https://react.dev/reference/react')).toBe('bookmark');
      expect(detectInputType('http://developer.mozilla.org')).toBe('bookmark');
      expect(detectInputType('https://news.ycombinator.com/item?id=123')).toBe('bookmark');
    });

    it('detects multiline and plain text instructions as AI prompts', () => {
      expect(detectInputType('You are an expert React TypeScript architect. Write a hook for...')).toBe('prompt');
      expect(detectInputType('Explain quantum computing to a 5 year old:\n1. Be concise\n2. Use analogies')).toBe('prompt');
      expect(detectInputType('')).toBe('prompt');
    });
  });

  describe('parseQuickSaveInput', () => {
    it('parses repo input with inferred fullName and canonicalUrl', () => {
      const parsed = parseQuickSaveInput('https://github.com/astral-sh/uv');
      expect(parsed.type).toBe('repo');
      expect(parsed.fullName).toBe('astral-sh/uv');
      expect(parsed.canonicalUrl).toBe('https://github.com/astral-sh/uv');
      expect(parsed.status).toBe('inbox');
    });

    it('parses bookmark input with inferred domain and title', () => {
      const parsed = parseQuickSaveInput('https://tailwindcss.com/docs/installation');
      expect(parsed.type).toBe('bookmark');
      expect(parsed.domain).toBe('tailwindcss.com');
      expect(parsed.title).toBe('Installation');
      expect(parsed.status).toBe('inbox');
    });

    it('parses prompt input extracting first line as title', () => {
      const text = 'Senior Software Architect System Prompt\nAlways write unit tests first.';
      const parsed = parseQuickSaveInput(text);
      expect(parsed.type).toBe('prompt');
      expect(parsed.title).toBe('Senior Software Architect System Prompt');
      expect(parsed.body).toBe(text);
    });

    it('allows 1-click overriding of detected type', () => {
      const parsed = parseQuickSaveInput('https://github.com/karakeep-app/karakeep', 'bookmark');
      expect(parsed.type).toBe('bookmark');
      expect(parsed.url).toContain('karakeep');
    });
  });

  describe('checkDuplicates', () => {
    const mockRepos = [
      { id: 'r1', fullName: 'facebook/react', canonicalUrl: 'https://github.com/facebook/react' }
    ];
    const mockBookmarks = [
      { id: 'b1', url: 'https://react.dev/reference/react', title: 'React Reference' }
    ];
    const mockPrompts = [
      { id: 'p1', title: 'React Expert', body: 'Act as a principal React architect with 10 years experience.' }
    ];

    it('flags duplicate repository by canonical URL or fullName', () => {
      const check = checkDuplicates({
        type: 'repo',
        draft: { canonicalUrl: 'https://github.com/facebook/react.git', fullName: 'facebook/react' },
        repositories: mockRepos
      });
      expect(check.isDuplicate).toBe(true);
      expect(check.existingItem.id).toBe('r1');
    });

    it('flags duplicate bookmark by normalized URL', () => {
      const check = checkDuplicates({
        type: 'bookmark',
        draft: { url: 'https://react.dev/reference/react/' },
        bookmarks: mockBookmarks
      });
      expect(check.isDuplicate).toBe(true);
      expect(check.existingItem.id).toBe('b1');
    });

    it('flags duplicate prompt by matching title', () => {
      const check = checkDuplicates({
        type: 'prompt',
        draft: { title: 'react expert', body: 'Different text' },
        prompts: mockPrompts
      });
      expect(check.isDuplicate).toBe(true);
      expect(check.existingItem.id).toBe('p1');
    });

    it('returns isDuplicate false for new items', () => {
      const check = checkDuplicates({
        type: 'prompt',
        draft: { title: 'Brand New Prompt', body: 'Completely unique instructions' },
        prompts: mockPrompts
      });
      expect(check.isDuplicate).toBe(false);
      expect(check.existingItem).toBeNull();
    });
  });

  describe('parseBulkInput', () => {
    it('splits bulk pasted multi-line URLs into individual drafts', () => {
      const bulk = `https://github.com/vitejs/vite\nhttps://developer.mozilla.org\nAct as a code reviewer`;
      const parsed = parseBulkInput(bulk);
      expect(parsed.length).toBe(3);
      expect(parsed[0].type).toBe('repo');
      expect(parsed[1].type).toBe('bookmark');
      expect(parsed[2].type).toBe('prompt');
    });

    it('auto-detects mixed markdown links, prompts, and repositories', () => {
      const mixed = `
[React Docs](https://react.dev) - Modern UI reference
https://github.com/shadcn-ui/ui

System Prompt:
You are an expert fullstack architect. Check {{code}} for race conditions.

https://developer.mozilla.org/en-US/
      `.trim();
      const parsed = parseBulkInput(mixed);
      expect(parsed.length).toBe(4);
      expect(parsed[0].type).toBe('bookmark');
      expect(parsed[0].title).toBe('React Docs');
      expect(parsed[1].type).toBe('repo');
      expect(parsed[1].fullName).toBe('shadcn-ui/ui');
      expect(parsed[2].type).toBe('prompt');
      expect(parsed[2].body).toContain('{{code}}');
      expect(parsed[3].type).toBe('bookmark');
    });
  });

  describe('parseNetscapeBookmarks', () => {
    it('parses standard Netscape bookmark HTML with folders and dates', () => {
      const html = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1609459200">Developer Tools</H3>
    <DL><p>
        <DT><A HREF="https://github.com/dexie/Dexie.js" ADD_DATE="1609459200" TAGS="indexeddb,storage">Dexie.js</A>
        <DT><A HREF="https://vitest.dev/" ADD_DATE="1609459300">Vitest</A>
    </DL><p>
</DL><p>
      `;
      const bookmarks = parseNetscapeBookmarks(html);
      expect(bookmarks.length).toBe(2);
      expect(bookmarks[0].title).toBe('Dexie.js');
      expect(bookmarks[0].url).toBe('https://github.com/dexie/Dexie.js');
      expect(bookmarks[0].category).toBe('Developer Tools');
      expect(bookmarks[0].tags).toContain('indexeddb');
      expect(bookmarks[1].title).toBe('Vitest');
    });
  });
});
