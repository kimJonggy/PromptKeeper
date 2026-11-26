import { describe, it, expect } from 'vitest';
import { extractVars } from '../src/data.js';

describe('extractVars', () => {
  it('extracts Handlebars {{variable}} syntax', () => {
    const text = 'Translate {{text}} to {{target_language}} with tone {{tone}}.';
    const vars = extractVars(text);
    expect(vars).toHaveLength(3);
    expect(vars.map(v => v.name)).toEqual(['text', 'target_language', 'tone']);
    expect(vars[0].syn).toBe('handlebars');
  });

  it('extracts ES template string ${variable} syntax', () => {
    const text = 'Build an API endpoint for ${resource} supporting ${method}.';
    const vars = extractVars(text);
    expect(vars).toHaveLength(2);
    expect(vars.map(v => v.name)).toEqual(['resource', 'method']);
    expect(vars[0].syn).toBe('template');
  });

  it('extracts bracket [VARIABLE] syntax', () => {
    const text = 'Write an email to [RECIPIENT_NAME] regarding [PROJECT_NAME].';
    const vars = extractVars(text);
    expect(vars).toHaveLength(2);
    expect(vars.map(v => v.name)).toEqual(['RECIPIENT_NAME', 'PROJECT_NAME']);
    expect(vars[0].syn).toBe('bracket');
  });

  it('extracts percent %VARIABLE% syntax', () => {
    const text = 'Replace %USER_ID% and %TOKEN% in header.';
    const vars = extractVars(text);
    expect(vars).toHaveLength(2);
    expect(vars.map(v => v.name)).toEqual(['USER_ID', 'TOKEN']);
    expect(vars[0].syn).toBe('percent');
  });

  it('deduplicates recurring variable tokens', () => {
    const text = 'Review {{code}}. Ensure {{code}} has no bugs. Refactor {{code}}.';
    const vars = extractVars(text);
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe('code');
  });

  it('handles empty or non-string inputs safely', () => {
    expect(extractVars('')).toEqual([]);
    expect(extractVars(null)).toEqual([]);
    expect(extractVars(undefined)).toEqual([]);
  });

  it('handles mixed syntax in the same template', () => {
    const text = 'For {{user}} running [TASK_TYPE] on ${server} using %AUTH_SCHEME%';
    const vars = extractVars(text);
    expect(vars).toHaveLength(4);
    expect(vars.map(v => v.name)).toEqual(['user', 'server', 'TASK_TYPE', 'AUTH_SCHEME']);
  });
});
