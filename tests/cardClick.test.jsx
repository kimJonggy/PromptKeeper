import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import DetailPanel from '../src/components/DetailPanel.jsx';
import RepositoryDetail from '../src/components/repos/RepositoryDetail.jsx';
import BookmarkDetail from '../src/components/bookmarks/BookmarkDetail.jsx';
import PromptCard from '../src/components/PromptCard.jsx';
import * as AppContextModule from '../src/context/AppContext.jsx';

describe('Card click / detail inspect test', () => {
  it('renders DetailPanel when activePrompt is provided', () => {
    const mockPrompt = {
      id: 'p-1',
      title: 'Test Prompt',
      body: 'This is a {{variable}} test body',
      category: 'General',
      model: 'GPT-4',
      tags: ['ai', 'code'],
      uses: 5,
      history: [1, 2, 3],
      notes: 'Some dev notes',
      created: new Date().toISOString(),
      versions: []
    };

    vi.spyOn(AppContextModule, 'useApp').mockReturnValue({
      activePrompt: mockPrompt,
      linkedPrompt: null,
      setActiveId: vi.fn(),
      openStudio: vi.fn(),
      deletePrompt: vi.fn(),
      toggleFav: vi.fn(),
      copyPrompt: vi.fn(),
      updatePrompt: vi.fn(),
      modelColors: {},
      requestConfirm: vi.fn(),
      repositories: [],
      restorePromptVersion: vi.fn(),
      setActiveNav: vi.fn()
    });

    const { container } = render(<DetailPanel />);
    expect(container).toBeDefined();
  });

  it('renders RepositoryDetail with minimal repo object', () => {
    const mockRepo = {
      id: 'r-1',
      fullName: 'owner/test-repo',
      owner: 'owner',
      name: 'test-repo',
      canonicalUrl: 'https://github.com/owner/test-repo',
      description: 'Test repo desc',
      status: 'inbox',
      stars: 10,
      forks: 2,
      openIssues: 0,
      primaryLanguage: 'JavaScript',
      tags: ['tools'],
      collections: ['Inbox']
    };

    const { container } = render(
      <RepositoryDetail
        repo={mockRepo}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onRefresh={vi.fn()}
        onToggleFavorite={vi.fn()}
        onTogglePin={vi.fn()}
        requestConfirm={vi.fn()}
      />
    );
    expect(container).toBeDefined();
  });

  it('renders BookmarkDetail with minimal bookmark object', () => {
    const mockBm = {
      id: 'b-1',
      title: 'Test Bookmark',
      url: 'https://example.com',
      domain: 'example.com',
      description: 'Example website',
      status: 'inbox',
      tags: ['web'],
      collections: ['Inbox']
    };

    const { container } = render(
      <BookmarkDetail
        bookmark={mockBm}
        onClose={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onToggleFavorite={vi.fn()}
        onTogglePin={vi.fn()}
        requestConfirm={vi.fn()}
      />
    );
    expect(container).toBeDefined();
  });

  it('renders PromptCard even when p.tags is undefined', () => {
    const promptWithoutTags = {
      id: 'p-no-tags',
      title: 'Prompt Without Tags',
      body: 'Some prompt body',
      category: 'General',
      model: 'Universal',
      uses: 0
    };

    const { container } = render(
      <PromptCard
        p={promptWithoutTags}
        active={false}
        onClick={vi.fn()}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onFav={vi.fn()}
        onCopy={vi.fn()}
        onStudio={vi.fn()}
      />
    );
    expect(container).toBeDefined();
  });
});
