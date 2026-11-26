import { useState, useMemo } from 'react';
import { 
  X, 
  Plus, 
  FolderGit2, 
  Bookmark, 
  Sparkles, 
  Layers, 
  Check, 
  FileText,
  Trash2,
  CheckCircle2,
  UploadCloud
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { 
  detectInputType, 
  parseQuickSaveInput, 
  checkDuplicates, 
  parseBulkMixedInput,
  detectCollectionTitle,
  extractSuggestedTags 
} from '../../services/quickSaveService.js';
import { BENTO_CARD_COLORS } from '../../constants/repositoryConstants.js';
import DuplicateModal from './DuplicateModal.jsx';

export default function QuickSaveModal({ isOpen, onClose }) {
  const {
    prompts,
    repositories,
    bookmarks,
    categories = [],
    savePrompt,
    addRepository,
    addBookmark,
    addCategory,
    assignResourceToCollection,
    setActiveNav,
    setActiveId,
    toast
  } = useApp();

  const [rawText, setRawText] = useState('');
  const [selectedType, setSelectedType] = useState(null); // null means use auto-detect
  const [title, setTitle] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [selectedColor, setSelectedColor] = useState('');
  const [keepAsOneList, setKeepAsOneList] = useState(false);
  const [listName, setListName] = useState('');
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [bulkFilterTab, setBulkFilterTab] = useState('all');

  // Parse bulk mixed items in real-time
  const bulkItems = useMemo(() => {
    const trimmed = rawText.trim();
    if (!trimmed) return [];
    return parseBulkMixedInput(trimmed);
  }, [rawText]);

  // Editable bulk items state (allows user to change type or remove items during triage)
  const [itemsOverride, setItemsOverride] = useState(null);

  const activeBulkList = itemsOverride !== null ? itemsOverride : bulkItems;
  const isBulkMode = activeBulkList.length > 1;

  // Auto-detected overarching collection title
  const detectedCollection = useMemo(() => {
    return detectCollectionTitle(rawText);
  }, [rawText]);

  // Suggested contextual tags
  const suggestedTags = useMemo(() => {
    return extractSuggestedTags(rawText, activeBulkList);
  }, [rawText, activeBulkList]);

  // Single-item detected type
  const detectedSingleType = rawText.trim() ? detectInputType(rawText) : 'prompt';
  const activeSingleType = selectedType || detectedSingleType;

  const handleRawTextChange = (val) => {
    setRawText(val);
    setItemsOverride(null); // Reset manual overrides on new paste
    if (val.trim()) {
      const parsed = parseQuickSaveInput(val, selectedType);
      if (parsed.title) {
        setTitle(parsed.title);
      }
      if (parsed.tags && parsed.tags.length > 0 && !tagsInput) {
        setTagsInput(parsed.tags.join(', '));
      }
      const autoColl = detectCollectionTitle(val);
      if (autoColl && !listName) {
        setListName(autoColl);
        setKeepAsOneList(true);
      }
    }
  };

  const handleToggleItemType = (itemId, newType) => {
    const currentList = activeBulkList.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          type: newType
        };
      }
      return item;
    });
    setItemsOverride(currentList);
  };

  const handleRemoveBulkItem = (itemId) => {
    const next = activeBulkList.filter(item => item.id !== itemId);
    setItemsOverride(next);
  };

  const handleBulkItemTitleChange = (itemId, newTitle) => {
    const next = activeBulkList.map(item => {
      if (item.id === itemId) {
        return { ...item, title: newTitle };
      }
      return item;
    });
    setItemsOverride(next);
  };

  // 1-Click Smart Bulk Transformations
  const handleConvertAllType = (newType) => {
    const next = activeBulkList.map(item => ({ ...item, type: newType }));
    setItemsOverride(next);
    if (toast) toast(`Converted all items to ${newType === 'repo' ? 'Repositories' : newType === 'bookmark' ? 'Web Bookmarks' : 'Prompts'} ✓`);
  };

  const handleDiscardPrompts = () => {
    const next = activeBulkList.filter(item => item.type !== 'prompt');
    setItemsOverride(next);
    if (toast) toast(`Discarded non-link prompt blocks ✓`);
  };

  const handleAddSuggestedTag = (tag) => {
    const current = tagsInput ? tagsInput.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean) : [];
    if (!current.includes(tag)) {
      setTagsInput([...current, tag].join(', '));
    }
  };

  if (!isOpen) return null;

  // Counts of detected bulk items
  const bulkStats = {
    repos: activeBulkList.filter(i => i.type === 'repo').length,
    bookmarks: activeBulkList.filter(i => i.type === 'bookmark').length,
    prompts: activeBulkList.filter(i => i.type === 'prompt').length
  };

  // Execution: Bulk Save
  const handleExecuteBulkSave = async () => {
    if (activeBulkList.length === 0) return;
    setIsSaving(true);

    try {
      let targetListName = selectedCollection;
      if (keepAsOneList) {
        targetListName = listName.trim() || 'Imported Bundle';
        addCategory(targetListName);
      }

      let repoCount = 0;
      let bmCount = 0;
      let promptCount = 0;

      for (const item of activeBulkList) {
        const itemTags = item.tags || [];
        const extraTags = tagsInput.split(',').map(t => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean);
        const finalTags = [...new Set([...itemTags, ...extraTags])];

        if (item.type === 'repo') {
          const res = await addRepository({
            owner: item.owner,
            name: item.name,
            fullName: item.fullName,
            canonicalUrl: item.canonicalUrl || item.url,
            description: item.description || '',
            notes: notes || item.description || '',
            personalNotes: notes || item.description || '',
            color: selectedColor,
            status: 'inbox',
            tags: finalTags,
            collections: targetListName !== 'All' ? [targetListName] : []
          });
          if (res?.success) repoCount++;
        } else if (item.type === 'bookmark') {
          const res = await addBookmark({
            url: item.url || item.canonicalUrl,
            title: item.title || item.domain,
            domain: item.domain,
            description: item.description || '',
            notes: notes || '',
            personalNotes: notes || '',
            color: selectedColor,
            category: targetListName !== 'All' ? targetListName : 'General',
            collections: targetListName !== 'All' ? [targetListName] : [],
            tags: finalTags,
            status: 'inbox'
          });
          if (res?.success) bmCount++;
        } else {
          savePrompt({
            title: item.title || 'Imported Prompt',
            body: item.body || item.title || 'Untitled',
            notes: notes || '',
            color: selectedColor,
            category: targetListName !== 'All' ? targetListName : 'General',
            collections: targetListName !== 'All' ? [targetListName] : [],
            tags: finalTags,
            status: 'inbox'
          });
          promptCount++;
        }
      }

      toast(`Imported ${activeBulkList.length} items (${repoCount} repos, ${bmCount} bookmarks, ${promptCount} prompts) ✓`, 'cyan');
      onClose();
    } catch (err) {
      console.error('Bulk save failed:', err);
      toast('Failed to save some items: ' + err.message, 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  // Execution: Single Item Save
  const handleExecuteSingleSave = async (forceAnyway = false) => {
    const trimmed = rawText.trim();
    if (!trimmed) {
      toast('Please enter a URL or prompt text', 'danger');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const parsed = parseQuickSaveInput(trimmed, activeSingleType);
    const draft = {
      ...parsed,
      title: title.trim() || parsed.title,
      tags: [...new Set([...(parsed.tags || []), ...tags])],
      notes: notes.trim(),
      personalNotes: notes.trim(),
      color: selectedColor,
      category: selectedCollection !== 'All' ? selectedCollection : parsed.category || 'General',
      collections: selectedCollection !== 'All' ? [selectedCollection] : []
    };

    // Duplicate check
    if (!forceAnyway) {
      const dupCheck = checkDuplicates({
        type: activeSingleType,
        draft,
        prompts,
        repositories,
        bookmarks
      });

      if (dupCheck.isDuplicate) {
        setDuplicateInfo({
          type: activeSingleType,
          existingItem: dupCheck.existingItem,
          reason: dupCheck.reason,
          draft
        });
        setDuplicateModalOpen(true);
        return;
      }
    }

    setIsSaving(true);
    try {
      if (activeSingleType === 'repo') {
        const res = await addRepository({
          owner: draft.owner,
          name: draft.name,
          fullName: draft.fullName,
          canonicalUrl: draft.canonicalUrl,
          description: draft.description || '',
          notes: draft.notes,
          personalNotes: draft.notes,
          color: selectedColor,
          status: 'inbox',
          tags: draft.tags,
          collections: draft.collections
        });
        if (res?.success === false) {
          toast(res.error || 'Failed to save repository', 'danger');
          return;
        }
        if (selectedCollection !== 'All' && res?.repository?.id) {
          assignResourceToCollection('repo', res.repository.id, selectedCollection);
        }
        toast(`Repository "${draft.title || draft.fullName}" saved to Inbox ✓`, 'cyan');
      } else if (activeSingleType === 'bookmark') {
        const res = await addBookmark({
          url: draft.url,
          title: draft.title,
          notes: draft.notes,
          personalNotes: draft.notes,
          color: selectedColor,
          category: draft.category,
          collections: draft.collections,
          tags: draft.tags,
          status: 'inbox'
        });
        if (res?.success === false) {
          toast(res.error || 'Failed to save bookmark', 'danger');
          return;
        }
        if (selectedCollection !== 'All' && res?.bookmark?.id) {
          assignResourceToCollection('bookmark', res.bookmark.id, selectedCollection);
        }
        toast(`Bookmark "${draft.title}" saved to Inbox ✓`, 'cyan');
      } else {
        savePrompt({
          title: draft.title,
          body: draft.body || draft.title || '',
          notes: draft.notes,
          color: selectedColor,
          category: draft.category,
          collections: draft.collections,
          tags: draft.tags,
          status: 'inbox'
        });
        toast(`Prompt "${draft.title}" saved to Inbox ✓`, 'violet');
      }
      onClose();
    } catch (err) {
      console.error('Failed to execute single save:', err);
      toast('Failed to save item: ' + (err.message || 'Unknown error'), 'danger');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenExisting = (existingItem) => {
    if (activeSingleType === 'repo') {
      setActiveNav('repos');
    } else if (activeSingleType === 'bookmark') {
      setActiveNav('bookmarks');
    } else {
      setActiveNav('prompts');
      setActiveId(existingItem.id);
    }
    toast(`Opened existing item: ${existingItem.title || existingItem.fullName}`, 'cyan');
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100, background: 'rgba(0, 0, 0, 0.78)', backdropFilter: 'blur(12px)' }}>
        <div
          className="industrial-modal"
          onClick={e => e.stopPropagation()}
          style={{
            width: isBulkMode ? '720px' : '580px',
            maxWidth: '94%',
            maxHeight: '88vh',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 22,
            boxShadow: 'var(--shadow-soft)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'modalFadeIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Top Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-hover)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'var(--accent)',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800
              }}>
                {isBulkMode ? <UploadCloud size={17} /> : <Plus size={17} />}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.2 }}>
                  {isBulkMode ? 'Bulk Universal Import' : 'Quick Save'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                  {isBulkMode 
                    ? `Auto-detected ${activeBulkList.length} items (${bulkStats.repos} repos, ${bulkStats.bookmarks} bookmarks, ${bulkStats.prompts} prompts)`
                    : 'Paste GitHub URLs, website links, or AI prompts'}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: 4,
                display: 'inline-flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Input textarea */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="bento-cap">
                  {isBulkMode ? 'Pasted Bulk Raw Text' : 'URL or Content'}
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                  Paste mixed links & prompts freely
                </span>
              </div>
              <textarea
                autoFocus
                rows={isBulkMode ? 3 : 4}
                value={rawText}
                onChange={e => handleRawTextChange(e.target.value)}
                placeholder="Paste links or prompts (e.g. https://github.com/facebook/react, https://tailwindcss.com, or multiline prompt instructions)..."
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  fontSize: 12.5,
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 14,
                  color: '#fff',
                  fontFamily: 'Geist Mono, monospace',
                  lineHeight: 1.55,
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            {/* ================= BULK AUTO-DETECT TRIAGE VIEW ================= */}
            {isBulkMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Auto-Detection Summary Banner */}
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(232, 255, 31, 0.06)',
                  border: '1px solid rgba(232, 255, 31, 0.20)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  boxShadow: '0 4px 20px -4px rgba(232, 255, 31, 0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 10px var(--accent-glow)'
                    }}>
                      <CheckCircle2 size={14} strokeWidth={2.8} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.2 }}>
                        Auto-Triage Active
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                        {activeBulkList.length} items parsed & classified
                      </div>
                    </div>
                  </div>

                  {/* Classification Breakdown Badges */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    {bulkStats.repos > 0 && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--color-blue)',
                        background: 'rgba(56, 189, 248, 0.12)',
                        border: '1px solid rgba(56, 189, 248, 0.28)',
                        padding: '2px 8px',
                        borderRadius: 8,
                        fontFamily: 'Geist Mono, monospace'
                      }}>
                        {bulkStats.repos} Repos
                      </span>
                    )}
                    {bulkStats.bookmarks > 0 && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--color-green)',
                        background: 'rgba(52, 211, 153, 0.12)',
                        border: '1px solid rgba(52, 211, 153, 0.28)',
                        padding: '2px 8px',
                        borderRadius: 8,
                        fontFamily: 'Geist Mono, monospace'
                      }}>
                        {bulkStats.bookmarks} Web
                      </span>
                    )}
                    {bulkStats.prompts > 0 && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--accent)',
                        background: 'rgba(232, 255, 31, 0.12)',
                        border: '1px solid rgba(232, 255, 31, 0.28)',
                        padding: '2px 8px',
                        borderRadius: 8,
                        fontFamily: 'Geist Mono, monospace'
                      }}>
                        {bulkStats.prompts} Prompts
                      </span>
                    )}
                  </div>
                </div>

                {/* Triage Filter & Fast Batch Action Toolbar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  flexWrap: 'wrap'
                }}>
                  {/* Filter Tabs */}
                  <div style={{
                    display: 'flex',
                    gap: 3,
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: 3,
                    borderRadius: 10,
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}>
                    {[
                      { id: 'all', label: `All (${activeBulkList.length})` },
                      { id: 'repo', label: `Repos (${bulkStats.repos})` },
                      { id: 'bookmark', label: `Web (${bulkStats.bookmarks})` },
                      { id: 'prompt', label: `Prompts (${bulkStats.prompts})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBulkFilterTab(tab.id)}
                        style={{
                          background: bulkFilterTab === tab.id ? 'var(--accent)' : 'transparent',
                          color: bulkFilterTab === tab.id ? '#000' : 'var(--text-tertiary)',
                          fontWeight: bulkFilterTab === tab.id ? 700 : 500,
                          fontSize: 11,
                          border: 'none',
                          borderRadius: 7,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* 1-Click Smart Cleaners */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {bulkStats.prompts > 0 && (bulkStats.repos > 0 || bulkStats.bookmarks > 0) && (
                      <button
                        type="button"
                        onClick={handleDiscardPrompts}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: 'var(--color-red)',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: 8,
                          padding: '4px 9px',
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Remove all non-link text lines from this import"
                      >
                        <Trash2 size={11} />
                        <span>Discard {bulkStats.prompts} Prompts</span>
                      </button>
                    )}
                    {bulkStats.prompts > 0 && (
                      <button
                        type="button"
                        onClick={() => handleConvertAllType('repo')}
                        style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: 'var(--color-blue)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          borderRadius: 8,
                          padding: '4px 9px',
                          fontSize: 10.5,
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title="Convert all items to GitHub Repositories"
                      >
                        All to Repos
                      </button>
                    )}
                  </div>
                </div>

                {/* Triage Items List */}
                <div style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  background: 'rgba(0, 0, 0, 0.45)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}>
                  {activeBulkList
                    .filter(item => bulkFilterTab === 'all' || item.type === bulkFilterTab)
                    .map((item, index) => {
                      const isRepo = item.type === 'repo';
                      const isBookmark = item.type === 'bookmark';
                      const isPrompt = item.type === 'prompt';

                      return (
                        <div
                          key={item.id || index}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            padding: '9px 12px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: 12,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* 1-Click Type Switcher Pills */}
                          <div style={{ display: 'flex', gap: 2, background: 'rgba(255, 255, 255, 0.05)', padding: 2, borderRadius: 8, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleToggleItemType(item.id, 'repo')}
                              style={{
                                background: isRepo ? 'rgba(56, 189, 248, 0.25)' : 'transparent',
                                color: isRepo ? 'var(--color-blue)' : 'var(--text-tertiary)',
                                border: 'none',
                                borderRadius: 6,
                                padding: '3px 6px',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                              title="Set type to GitHub Repository"
                            >
                              <FolderGit2 size={11} />
                              <span>Repo</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleItemType(item.id, 'bookmark')}
                              style={{
                                background: isBookmark ? 'rgba(52, 211, 153, 0.25)' : 'transparent',
                                color: isBookmark ? 'var(--color-green)' : 'var(--text-tertiary)',
                                border: 'none',
                                borderRadius: 6,
                                padding: '3px 6px',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                              title="Set type to Website Bookmark"
                            >
                              <Bookmark size={11} />
                              <span>Web</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleItemType(item.id, 'prompt')}
                              style={{
                                background: isPrompt ? 'rgba(232, 255, 31, 0.25)' : 'transparent',
                                color: isPrompt ? 'var(--accent)' : 'var(--text-tertiary)',
                                border: 'none',
                                borderRadius: 6,
                                padding: '3px 6px',
                                fontSize: 10,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3
                              }}
                              title="Set type to AI Prompt"
                            >
                              <Sparkles size={11} />
                              <span>Prompt</span>
                            </button>
                          </div>

                          {/* Title & snippet */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <input
                              type="text"
                              value={item.title || item.fullName || ''}
                              onChange={e => handleBulkItemTitleChange(item.id, e.target.value)}
                              style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: 12.5,
                                fontWeight: 600,
                                outline: 'none',
                                padding: 0,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            />
                            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                              {item.canonicalUrl || item.url || (item.body?.slice(0, 60) + '...')}
                            </div>
                          </div>

                          {/* Remove item */}
                          <button
                            type="button"
                            onClick={() => handleRemoveBulkItem(item.id)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-tertiary)',
                              cursor: 'pointer',
                              padding: 4,
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Remove from batch"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                </div>

                {/* Smart Suggested Tags Pill Bar */}
                {suggestedTags.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontWeight: 600 }}>Suggested Tags:</span>
                    {suggestedTags.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddSuggestedTag(tag)}
                        style={{
                          background: tagsInput.includes(tag) ? 'var(--accent)' : 'rgba(255, 255, 255, 0.05)',
                          color: tagsInput.includes(tag) ? '#000' : 'var(--text-secondary)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                          padding: '2px 7px',
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3
                        }}
                      >
                        <span>+{tag}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Batch Options: Collection & Color Swatches */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                      Target Collection / List
                    </label>
                    <select
                      value={selectedCollection}
                      onChange={e => setSelectedCollection(e.target.value)}
                      style={{
                        width: '100%',
                        height: 38,
                        padding: '0 10px',
                        fontSize: 12,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 10,
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="All" style={{ background: '#0b0b0c' }}>Inbox (Auto Assign)</option>
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c} style={{ background: '#0b0b0c' }}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Card Color for Batch */}
                  <div>
                    <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                      Card Color (Batch)
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38 }}>
                      {BENTO_CARD_COLORS.slice(0, 6).map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedColor(c.color)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: c.bg === 'transparent' ? '#181b24' : c.bg,
                            border: selectedColor === c.color ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                            cursor: 'pointer',
                            transform: selectedColor === c.color ? 'scale(1.2)' : 'scale(1)',
                            transition: 'all 0.15s ease',
                            padding: 0
                          }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bundle into new list Bento Card */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: keepAsOneList ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 14,
                  padding: '12px 14px',
                  transition: 'all 0.2s ease',
                  boxShadow: keepAsOneList ? '0 0 16px rgba(232, 255, 31, 0.06)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <label htmlFor="keepBundle" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                      <input
                        type="checkbox"
                        id="keepBundle"
                        checked={keepAsOneList}
                        onChange={e => setKeepAsOneList(e.target.checked)}
                        style={{
                          accentColor: 'var(--accent)',
                          cursor: 'pointer',
                          width: 18,
                          height: 18,
                          minWidth: 18,
                          minHeight: 18,
                          maxWidth: 18,
                          maxHeight: 18,
                          flexShrink: 0,
                          margin: 0
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: keepAsOneList ? '#fff' : 'var(--text-secondary)' }}>
                          Bundle items into a new Project / Collection
                        </div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)' }}>
                          Groups this entire batch under a dedicated collection folder
                        </div>
                      </div>
                    </label>

                    {detectedCollection && !keepAsOneList && (
                      <button
                        type="button"
                        onClick={() => {
                          setKeepAsOneList(true);
                          setListName(detectedCollection);
                        }}
                        style={{
                          background: 'var(--accent-muted)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent-glow)',
                          borderRadius: 8,
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '4px 8px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Auto-Name
                      </button>
                    )}
                  </div>

                  {keepAsOneList && (
                    <div style={{ marginTop: 10 }}>
                      <input
                        type="text"
                        value={listName}
                        onChange={e => setListName(e.target.value)}
                        placeholder="Collection name (e.g. Video Editing Studio Tools)..."
                        style={{
                          height: 38,
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: '1px solid var(--accent)',
                          borderRadius: 10,
                          padding: '0 12px',
                          fontSize: 12,
                          color: '#fff',
                          outline: 'none',
                          width: '100%'
                        }}
                      />
                    </div>
                  )}
                </div>

              </div>
            ) : (
              /* ================= SINGLE ITEM VIEW ================= */
              <>
                {/* 1-Click Type Override Row */}
                <div style={{
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span className="bento-cap" style={{ marginRight: 4 }}>Type:</span>
                  {[
                    { id: 'prompt', label: 'AI Prompt', icon: Sparkles, color: 'var(--accent)' },
                    { id: 'repo', label: 'GitHub Repo', icon: FolderGit2, color: 'var(--color-blue)' },
                    { id: 'bookmark', label: 'Bookmark', icon: Bookmark, color: 'var(--color-green)' }
                  ].map(tab => {
                    const isActive = activeSingleType === tab.id;
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSelectedType(tab.id)}
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          fontSize: 11.5,
                          fontWeight: 700,
                          borderRadius: 10,
                          border: isActive ? `1px solid ${tab.color}` : '1px solid rgba(255, 255, 255, 0.08)',
                          background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                          color: isActive ? tab.color : 'var(--text-tertiary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Icon size={13} />
                        <span>{tab.label}</span>
                        {detectedSingleType === tab.id && !selectedType && (
                          <span style={{ fontSize: 9, background: 'var(--accent)', color: '#000', padding: '1px 5px', borderRadius: 6, fontWeight: 800 }}>
                            Auto
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Title */}
                <div>
                  <span className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>Title</span>
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Item title..."
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 12px',
                      fontSize: 12,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 10,
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Tags & Collection Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <span className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>Tags</span>
                    <input
                      value={tagsInput}
                      onChange={e => setTagsInput(e.target.value)}
                      placeholder="comma, separated, tags..."
                      style={{
                        width: '100%',
                        height: 36,
                        padding: '0 12px',
                        fontSize: 12,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 10,
                        color: '#fff',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <span className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>Collection</span>
                    <select
                      value={selectedCollection}
                      onChange={e => setSelectedCollection(e.target.value)}
                      style={{
                        width: '100%',
                        height: 36,
                        padding: '0 10px',
                        fontSize: 12,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 10,
                        color: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="All" style={{ background: '#0b0b0c' }}>Inbox (Unassigned)</option>
                      {categories.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c} style={{ background: '#0b0b0c' }}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Color Swatches */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span className="bento-cap">Card Color</span>
                    <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                      {BENTO_CARD_COLORS.find(c => c.color === selectedColor)?.label || 'Obsidian'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {BENTO_CARD_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c.color)}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          background: c.bg === 'transparent' ? '#181b24' : c.bg,
                          border: selectedColor === c.color ? '2px solid #fff' : '1px solid rgba(255, 255, 255, 0.2)',
                          cursor: 'pointer',
                          transform: selectedColor === c.color ? 'scale(1.2)' : 'scale(1)',
                          transition: 'all 0.15s ease',
                          padding: 0
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <span className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>Notes (Optional)</span>
                  <input
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Personal evaluation notes, context, or takeaways..."
                    style={{
                      width: '100%',
                      height: 36,
                      padding: '0 12px',
                      fontSize: 12,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 10,
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
              </>
            )}

          </div>

          {/* Footer Bar */}
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: '#090a0f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 10,
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>

            {isBulkMode ? (
              <button
                type="button"
                disabled={isSaving || activeBulkList.length === 0}
                onClick={handleExecuteBulkSave}
                style={{
                  padding: '8px 20px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#000',
                  cursor: isSaving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'Geist, sans-serif'
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                <span>{isSaving ? 'Importing...' : `Import All (${activeBulkList.length} Items)`}</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isSaving || !rawText.trim()}
                onClick={() => handleExecuteSingleSave(false)}
                style={{
                  padding: '8px 20px',
                  fontSize: 12,
                  fontWeight: 700,
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 10,
                  color: '#000',
                  cursor: isSaving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'Geist, sans-serif'
                }}
              >
                <Check size={14} strokeWidth={2.5} />
                <span>{isSaving ? 'Saving...' : `Save to ${selectedCollection === 'All' ? 'Inbox' : selectedCollection}`}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Duplicate Dialog Modal */}
      {duplicateModalOpen && duplicateInfo && (
        <DuplicateModal
          isOpen={duplicateModalOpen}
          onClose={() => setDuplicateModalOpen(false)}
          duplicateInfo={duplicateInfo}
          onOpenExisting={handleOpenExisting}
          onSkip={() => {
            setDuplicateModalOpen(false);
            onClose();
          }}
          onSaveAnyway={() => {
            setDuplicateModalOpen(false);
            handleExecuteSingleSave(true);
          }}
        />
      )}
    </>
  );
}
