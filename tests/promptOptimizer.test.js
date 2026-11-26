import { describe, it, expect } from 'vitest';
import { 
  detectPromptDomain, 
  optimizePrompt, 
  resolvePromptVariables 
} from '../src/services/promptOptimizerService.js';

describe('promptOptimizerService', () => {
  describe('detectPromptDomain', () => {
    it('detects coding prompts', () => {
      expect(detectPromptDomain('Write a React component for virtualized tables')).toBe('coding');
      expect(detectPromptDomain('Debug this Python script with async sqlite error')).toBe('coding');
    });

    it('detects writing prompts', () => {
      expect(detectPromptDomain('Draft a high-converting newsletter email for our SaaS launch')).toBe('writing');
      expect(detectPromptDomain('Write an engaging blog post intro')).toBe('writing');
    });

    it('detects analysis prompts', () => {
      expect(detectPromptDomain('Analyze quarterly churn metrics and summarize trends')).toBe('analysis');
      expect(detectPromptDomain('Review and evaluate these competing architectures')).toBe('analysis');
    });

    it('falls back to general for uncategorized prompts', () => {
      expect(detectPromptDomain('Explain general quantum mechanics')).toBe('general');
    });
  });

  describe('optimizePrompt', () => {
    it('handles empty input gracefully', () => {
      const res = optimizePrompt('');
      expect(res.optimized).toBe('');
      expect(res.improvements).toEqual([]);
    });

    it('optimizes casual coding prompt with production preset', () => {
      const draft = 'can you write a fast debounce hook in typescript for input search?';
      const res = optimizePrompt(draft, 'production');

      expect(res.optimized).toContain('Senior Principal Software Engineer');
      expect(res.optimized).toContain('Write a fast debounce hook in typescript');
      expect(res.optimized).toContain('Negative Constraints');
      expect(res.improvements.length).toBeGreaterThan(0);
      expect(res.scoreBoost).toBeGreaterThan(0);
    });

    it('optimizes with concise preset removing filler', () => {
      const draft = 'please explain docker networking';
      const res = optimizePrompt(draft, 'concise');

      expect(res.optimized).toContain('Objective: Explain docker networking');
      expect(res.optimized).toContain('Execution:');
    });

    it('optimizes with chain_of_thought preset adding reasoning protocol', () => {
      const draft = 'design an offline first sync engine architecture';
      const res = optimizePrompt(draft, 'chain_of_thought');

      expect(res.optimized).toContain('Thinking & Reasoning Protocol');
      expect(res.optimized).toContain('Self-Verification');
    });

    it('preserves existing variables {{var}}', () => {
      const draft = 'generate a {{framework}} test for {{componentName}}';
      const res = optimizePrompt(draft, 'production');

      expect(res.variables).toContain('framework');
      expect(res.variables).toContain('componentName');
      expect(res.optimized).toContain('{{framework}}');
    });
  });

  describe('resolvePromptVariables', () => {
    it('replaces {{var}} with actual values', () => {
      const template = 'Hello {{name}}, welcome to {{project}}!';
      const res = resolvePromptVariables(template, { name: 'Alice', project: 'PromptKeeper' });
      expect(res).toBe('Hello Alice, welcome to PromptKeeper!');
    });

    it('handles bracket [var] and percent %var% formats', () => {
      const template = 'User [username] has status %status%';
      const res = resolvePromptVariables(template, { username: 'dev99', status: 'active' });
      expect(res).toBe('User dev99 has status active');
    });

    it('leaves unfilled variables intact if not provided', () => {
      const template = 'Target: {{target}}, Mode: {{mode}}';
      const res = resolvePromptVariables(template, { target: 'Production' });
      expect(res).toBe('Target: Production, Mode: {{mode}}');
    });
  });
});
