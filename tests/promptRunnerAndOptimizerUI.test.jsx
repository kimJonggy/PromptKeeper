import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import PromptVariableRunnerModal from '../src/components/studio/PromptVariableRunnerModal.jsx';
import PromptOptimizerModal from '../src/components/studio/PromptOptimizerModal.jsx';
import PromptCard from '../src/components/PromptCard.jsx';
import * as AppContextModule from '../src/context/AppContext.jsx';

describe('Feature 4 & 5: Prompt Variable Runner & Prompt Optimizer UI', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Mock navigator.clipboard safely in jsdom
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve())
      },
      configurable: true,
      writable: true
    });
  });

  describe('PromptVariableRunnerModal', () => {
    const mockPrompt = {
      id: 'p-test-1',
      title: 'Component Architect Prompt',
      body: 'Create a clean {{framework}} component for {{feature}} with strict {{requirements}}.',
      category: 'Coding',
      model: 'Claude 3.5 Sonnet',
      vals: { framework: 'React' }
    };

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <PromptVariableRunnerModal
          isOpen={false}
          onClose={vi.fn()}
          prompt={mockPrompt}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders variable inputs and live assembled preview', () => {
      render(
        <PromptVariableRunnerModal
          isOpen={true}
          onClose={vi.fn()}
          prompt={mockPrompt}
        />
      );

      // Check header title
      expect(screen.getByText('Prompt Variable Runner')).toBeDefined();
      expect(screen.getByText('Component Architect Prompt')).toBeDefined();

      // Check detected variables
      expect(screen.getByText('{{framework}}')).toBeDefined();
      expect(screen.getByText('{{feature}}')).toBeDefined();
      expect(screen.getByText('{{requirements}}')).toBeDefined();

      // Check initial assembled text (framework has initial val 'React')
      expect(screen.getByText(/Create a clean React component/)).toBeDefined();
    });

    it('updates live preview dynamically when variable inputs change', () => {
      render(
        <PromptVariableRunnerModal
          isOpen={true}
          onClose={vi.fn()}
          prompt={mockPrompt}
        />
      );

      const featureInput = screen.getByPlaceholderText('Enter feature...');
      fireEvent.change(featureInput, { target: { value: 'Authentication Modal' } });

      expect(screen.getByText(/Authentication Modal/)).toBeDefined();
    });

    it('auto-fills sample data and clears all values', () => {
      render(
        <PromptVariableRunnerModal
          isOpen={true}
          onClose={vi.fn()}
          prompt={mockPrompt}
        />
      );

      const sampleBtn = screen.getByRole('button', { name: /Sample Data/i });
      fireEvent.click(sampleBtn);

      const clearBtn = screen.getByRole('button', { name: /Clear/i });
      fireEvent.click(clearBtn);

      const featureInput = screen.getByPlaceholderText('Enter feature...');
      expect(featureInput.value).toBe('');
    });

    it('copies assembled prompt to clipboard when copy button clicked', () => {
      const onCopyAssembled = vi.fn();
      render(
        <PromptVariableRunnerModal
          isOpen={true}
          onClose={vi.fn()}
          prompt={mockPrompt}
          onCopyAssembled={onCopyAssembled}
        />
      );

      const copyBtn = screen.getByRole('button', { name: /Copy Assembled Prompt/i });
      fireEvent.click(copyBtn);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
      expect(onCopyAssembled).toHaveBeenCalled();
    });
  });

  describe('PromptOptimizerModal', () => {
    const sampleText = 'Can you please write a python script to parse logs and find errors?';

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <PromptOptimizerModal
          isOpen={false}
          onClose={vi.fn()}
          initialText={sampleText}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('renders side-by-side comparison and improvements audit', () => {
      render(
        <PromptOptimizerModal
          isOpen={true}
          onClose={vi.fn()}
          initialText={sampleText}
          promptTitle="Python Log Parser"
        />
      );

      expect(screen.getByText('AI Prompt Optimizer')).toBeDefined();
      expect(screen.getByText('Python Log Parser')).toBeDefined();
      expect(screen.getByText('Original Draft')).toBeDefined();
      expect(screen.getByText('Optimized Specification')).toBeDefined();

      // Check preset selector buttons
      expect(screen.getAllByText('Production Grade').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Concise & Fast').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Deep Reasoning').length).toBeGreaterThan(0);
    });

    it('applies optimized text when Apply button is clicked', () => {
      const onApply = vi.fn();
      const onClose = vi.fn();

      render(
        <PromptOptimizerModal
          isOpen={true}
          onClose={onClose}
          initialText={sampleText}
          onApply={onApply}
        />
      );

      const applyBtn = screen.getByRole('button', { name: /Apply to Prompt/i });
      fireEvent.click(applyBtn);

      expect(onApply).toHaveBeenCalled();
      const appliedText = onApply.mock.calls[0][0];
      expect(appliedText.toLowerCase()).toContain('software engineer');
      expect(onClose).toHaveBeenCalled();
    });

    it('switches between presets dynamically', () => {
      render(
        <PromptOptimizerModal
          isOpen={true}
          onClose={vi.fn()}
          initialText={sampleText}
        />
      );

      const conciseBtns = screen.getAllByText(/Concise & Fast/i);
      fireEvent.click(conciseBtns[0]);

      expect(screen.getAllByText(/Preset:/).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Concise & Fast').length).toBeGreaterThan(0);
    });
  });

  describe('PromptCard integration', () => {
    it('renders Run button and vars badge for prompts with variables, invoking openRunner', () => {
      const openRunnerMock = vi.fn();

      vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
        activeId: null,
        setActiveId: vi.fn(),
        toggleFav: vi.fn(),
        copyPrompt: vi.fn(),
        modelColors: {},
        viewMode: 'grid',
        togglePinPrompt: vi.fn(),
        bulkSelectedIds: [],
        setBulkSelectedIds: vi.fn(),
        logRecentItem: vi.fn(),
        openRunner: openRunnerMock
      });

      const pWithVars = {
        id: 'p-vars-1',
        title: 'API Generator',
        body: 'Generate an API in {{language}} for {{entity}}.',
        category: 'Coding',
        model: 'GPT-4',
        tags: ['backend'],
        uses: 3
      };

      render(<PromptCard p={pWithVars} />);

      // Find the "Run" button or "2 vars" pill
      const runButtons = screen.getAllByRole('button', { name: /Run/i });
      expect(runButtons.length).toBeGreaterThan(0);

      fireEvent.click(runButtons[0]);
      expect(openRunnerMock).toHaveBeenCalledWith(pWithVars);
    });
  });
});
