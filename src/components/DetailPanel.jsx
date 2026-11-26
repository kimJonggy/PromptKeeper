import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  History, 
  X, 
  Flame, 
  Star, 
  ArrowRight, 
  FolderGit2, 
  ExternalLink, 
  Copy, 
  Zap, 
  Trash2,
  Check,
  Edit2,
  Sparkles,
  Play,
  Tag as TagIcon
} from 'lucide-react';
import { ModelBadge, VarHighlight, UsageChart } from './UI.jsx';
import ForgePanel from './ForgePanel.jsx';
import VersionHistoryModal from './studio/VersionHistoryModal.jsx';
import { BENTO_CARD_COLORS, getDeepCardColor } from '../constants/repositoryConstants.js';
import { useApp } from '../context/AppContext.jsx';

export default function DetailPanel() {
  const {
    activePrompt: p,
    linkedPrompt,
    setActiveId,
    openStudio: onStudio,
    deletePrompt: onDelete,
    toggleFav: onFav,
    copyPrompt: onCopy,
    updatePrompt: onUpdate,
    modelColors,
    requestConfirm,
    repositories,
    restorePromptVersion,
    setActiveNav,
    openRunner,
    openOptimizer
  } = useApp();

  const onClose = () => setActiveId(null);
  const onJump = (id) => setActiveId(id);
  const [tab, setTab] = useState('details');
  const [showVersions, setShowVersions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(p ? p.title : '');
  const [notes, setNotes] = useState(p ? (p.notes || '') : '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Sync state when active prompt changes
  const [prevId, setPrevId] = useState(p ? p.id : null);
  if (p && prevId !== p.id) {
    setPrevId(p.id);
    setTitle(p.title || '');
    setNotes(p.notes || '');
    setIsEditingTitle(false);
    setIsEditingNotes(false);
  }

  if (!p) return null;

  function copyRaw() {
    onCopy(p, false);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const handleSaveTitle = () => {
    if (title.trim()) {
      onUpdate(p.id, { title: title.trim() });
    } else {
      setTitle(p.title);
    }
    setIsEditingTitle(false);
  };

  const handleSaveNotes = () => {
    onUpdate(p.id, { notes: notes.trim() });
    setIsEditingNotes(false);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (!tag) return;
    const currentTags = p.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdate(p.id, { tags: [...currentTags, tag] });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    const currentTags = p.tags || [];
    onUpdate(p.id, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const handleDelete = () => {
    requestConfirm({
      title: 'DELETE PROMPT',
      message: `Permanently delete "${p.title}"? This action cannot be undone.`,
      onConfirm: () => {
        onDelete(p.id);
        onClose();
      }
    });
  };

  const createdDate = p.created ? new Date(p.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently';
  const activeColorObj = BENTO_CARD_COLORS.find(c => c.color === (p.color || '') || (p.color && c.color === getDeepCardColor(p.color))) || BENTO_CARD_COLORS[0];

  return (
    <aside
      className={`detail-panel detail-panel-mobile open`}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '460px',
        maxWidth: '100%',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-soft)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* 1. Zen Micro-Actions Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface-hover)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexShrink: 0
      }}>
        {/* Left: Inspector Title & Version */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Sparkles size={14} style={{ color: p.color || 'var(--accent)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 0.5, fontFamily: 'Geist Mono, monospace' }}>
            PROMPT INSPECTOR
          </span>
          <button
            onClick={() => setShowVersions(true)}
            style={{
              background: 'var(--btn-subtle-bg)',
              border: '1px solid var(--btn-subtle-border)',
              borderRadius: 6,
              padding: '2px 7px',
              fontSize: 10,
              fontWeight: 700,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'Geist Mono, monospace'
            }}
            title="View version snapshots"
          >
            <History size={10} />
            <span>v{p.versions?.length ? p.versions.length + 1 : 1}</span>
          </button>
        </div>

        {/* Right: Micro Action Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Copy Prompt */}
          <button
            onClick={copyRaw}
            title={copied ? 'Copied to clipboard!' : 'Copy raw prompt template'}
            className={copied ? 'copy-feedback-animated' : ''}
            style={{
              background: copied ? 'rgba(52, 211, 153, 0.2)' : 'var(--accent)',
              color: copied ? '#34d399' : '#0b0b0c',
              border: 'none',
              borderRadius: 10,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontFamily: 'Geist, sans-serif'
            }}
          >
            {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Quick Runner */}
          <button
            onClick={() => openRunner(p)}
            title="Open Variable Runner / Quick Test"
            style={{
              background: 'rgba(232, 255, 31, 0.1)',
              color: 'var(--accent)',
              border: '1px solid rgba(232, 255, 31, 0.25)',
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Play size={12} fill="currentColor" />
          </button>

          {/* Open Studio */}
          <button
            onClick={() => onStudio(p)}
            title="Open in Prompt Forge Studio"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--accent)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Zap size={13} />
          </button>

          {/* Favorite */}
          <button
            onClick={() => onFav(p.id)}
            title={p.fav ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              background: p.fav ? 'rgba(232, 255, 31, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: p.fav ? 'var(--accent)' : 'rgba(255, 255, 255, 0.7)',
              border: '1px solid ' + (p.fav ? 'var(--accent)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Star size={13} fill={p.fav ? 'currentColor' : 'none'} />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            title="Delete prompt"
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Trash2 size={13} />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close Inspector"
            style={{
              background: 'transparent',
              color: 'var(--text-tertiary)',
              border: 'none',
              padding: 4,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              marginLeft: 2
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* 2. Sleek Bento Tab Switcher */}
      <div style={{
        display: 'flex',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '6px 14px',
        gap: 6
      }}>
        <button 
          onClick={() => setTab('details')}
          style={{ 
            flex: 1,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            border: 'none',
            borderRadius: 10,
            background: tab === 'details' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
            color: tab === 'details' ? '#fff' : 'var(--text-tertiary)',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
            fontFamily: 'Geist, sans-serif'
          }}
        >
          Template Details
        </button>
        <button 
          onClick={() => setTab('forge')}
          style={{ 
            flex: 1,
            padding: '6px 12px',
            fontSize: 11,
            fontWeight: 700,
            border: 'none',
            borderRadius: 10,
            background: tab === 'forge' ? 'rgba(232, 255, 31, 0.12)' : 'transparent',
            color: tab === 'forge' ? 'var(--accent)' : 'var(--text-tertiary)',
            transition: 'all 0.15s ease',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            fontFamily: 'Geist, sans-serif'
          }}
        >
          <Flame size={12} />
          <span>The Forge</span>
        </button>
      </div>

      {/* 3. Main Content Area */}
      <div style={{ flex: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {tab === 'details' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

            {/* Editable Title */}
            <div style={{ marginBottom: 14 }}>
              {isEditingTitle ? (
                <input
                  type="text"
                  autoFocus
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') {
                      setTitle(p.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid var(--accent)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    color: '#fff',
                    fontSize: 19,
                    fontWeight: 700,
                    outline: 'none',
                    fontFamily: 'Geist, sans-serif'
                  }}
                />
              ) : (
                <div
                  onClick={() => setIsEditingTitle(true)}
                  style={{
                    fontSize: 19,
                    fontWeight: 700,
                    color: '#fff',
                    lineHeight: 1.3,
                    letterSpacing: '-0.025em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                  title="Click to edit prompt title"
                >
                  <span>{p.title}</span>
                  <Edit2 size={12} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </div>
              )}
            </div>

            {/* Bento Meta Strip (Single Sleek Row) */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 14,
              marginBottom: 16,
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ModelBadge model={p.model} color={modelColors?.[p.model]} />
                <span style={{
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '2px 8px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {p.category}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 600 }}>⚡ {p.uses || 0} runs</span>
                <span>•</span>
                <span>{createdDate}</span>
              </div>
            </div>

            {/* Card Accent Color Swatches */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="bento-cap">Card Accent Color</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                  {activeColorObj.label}
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '8px 12px',
                borderRadius: 14,
                border: '1px solid rgba(255, 255, 255, 0.06)'
              }}>
                {BENTO_CARD_COLORS.map(c => {
                  const isSelected = (p.color || '') === c.color || (p.color && getDeepCardColor(p.color) === c.color);
                  return (
                    <button
                      key={c.id}
                      onClick={() => onUpdate(p.id, { color: c.color })}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: c.bg === 'transparent' ? '#181b24' : c.bg,
                        border: isSelected ? '2px solid #ffffff' : '1px solid rgba(255, 255, 255, 0.25)',
                        boxShadow: isSelected && c.color ? `0 0 10px ${c.color}` : 'none',
                        cursor: 'pointer',
                        transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                        padding: 0
                      }}
                      title={c.label}
                    />
                  );
                })}
              </div>
            </div>

            {/* Prompt Template Body */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                <span className="bento-cap">Prompt Template</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {/* AI Polish / Optimize Button */}
                  <button
                    onClick={() => openOptimizer({
                      initialText: p.body,
                      promptTitle: p.title,
                      onApply: (newBody) => onUpdate(p.id, { body: newBody })
                    })}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      color: 'var(--text-secondary)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 10.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'Geist Mono, monospace'
                    }}
                    title="AI Optimize & Polish prompt structure"
                  >
                    <Sparkles size={11} style={{ color: 'var(--accent)' }} />
                    <span>Optimize</span>
                  </button>

                  {/* Test & Run Button */}
                  <button
                    onClick={() => openRunner(p)}
                    style={{
                      background: 'rgba(232, 255, 31, 0.08)',
                      border: '1px solid rgba(232, 255, 31, 0.25)',
                      color: 'var(--accent)',
                      borderRadius: 6,
                      padding: '3px 8px',
                      fontSize: 10.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'Geist Mono, monospace'
                    }}
                    title="Fill variables & test prompt"
                  >
                    <Play size={10} fill="currentColor" />
                    <span>Test & Run</span>
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={copyRaw}
                    className={copied ? 'copy-feedback-animated' : ''}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copied ? '#34d399' : 'var(--text-secondary)',
                      fontSize: 10.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'Geist Mono, monospace'
                    }}
                  >
                    {copied ? <><Check size={11} strokeWidth={2.5} /> Copied</> : <><Copy size={11} /> Copy</>}
                  </button>
                </div>
              </div>

              <div style={{
                maxHeight: 260,
                overflowY: 'auto',
                background: 'rgba(0, 0, 0, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 14,
                padding: '14px',
                fontFamily: 'Geist Mono, monospace',
                fontSize: 12,
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                color: '#f4f4f5'
              }}>
                <VarHighlight text={p.body} onVarClick={(name) => openRunner(p)} />
              </div>
            </div>

            {/* Developer Notes (Editable) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="bento-cap">Developer Notes & Tips</span>
                <button
                  onClick={() => {
                    if (isEditingNotes) handleSaveNotes();
                    else setIsEditingNotes(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {isEditingNotes ? <><Check size={11} /> Save</> : <><Edit2 size={11} /> Edit</>}
                </button>
              </div>

              {isEditingNotes ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <textarea
                    autoFocus
                    rows={4}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Usage notes, expected input variables, system prompt parameters..."
                    style={{
                      width: '100%',
                      background: 'rgba(0, 0, 0, 0.55)',
                      border: '1px solid var(--accent)',
                      borderRadius: 14,
                      padding: '12px',
                      color: 'var(--text-primary)',
                      fontSize: 12,
                      fontFamily: 'Geist Mono, monospace',
                      lineHeight: 1.6,
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      onClick={() => {
                        setNotes(p.notes || '');
                        setIsEditingNotes(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 10,
                        padding: '4px 10px',
                        fontSize: 10.5,
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNotes}
                      style={{
                        background: 'var(--accent)',
                        color: '#0b0b0c',
                        border: 'none',
                        borderRadius: 10,
                        padding: '4px 12px',
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => setIsEditingNotes(true)}
                  className="bento-recess"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 14,
                    cursor: 'pointer',
                    minHeight: 48,
                    fontSize: 12,
                    color: notes.trim() ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                    lineHeight: 1.5,
                    fontStyle: notes.trim() ? 'normal' : 'italic'
                  }}
                  title="Click to add developer notes"
                >
                  {notes.trim() || 'No notes added. Click to add usage tips or variable descriptions...'}
                </div>
              )}
            </div>

            {/* Minimal Tags */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="bento-cap">Tags</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                  {(p.tags || []).length}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
                {(p.tags || []).map(t => (
                  <span
                    key={t}
                    style={{
                      fontSize: 11,
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.85)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      padding: '2px 8px',
                      borderRadius: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'Geist Mono, monospace'
                    }}
                  >
                    <span>#{t}</span>
                    <button
                      onClick={() => handleRemoveTag(t)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-tertiary)',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'inline-flex',
                        alignItems: 'center'
                      }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddTag} style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  placeholder="+ Add tag (Enter)"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 10,
                    padding: '5px 10px',
                    fontSize: 11,
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'Geist Mono, monospace'
                  }}
                />
              </form>
            </div>

            {/* Chaining Prompt */}
            {linkedPrompt && (
              <div style={{ marginBottom: 16 }}>
                <span className="bento-cap" style={{ display: 'block', marginBottom: 8 }}>Next in Chain</span>
                <div
                  onClick={() => onJump(linkedPrompt.id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: 12,
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <ArrowRight size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {linkedPrompt.title}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, fontFamily: 'Geist Mono, monospace' }}>
                    Jump ↗
                  </span>
                </div>
              </div>
            )}

            {/* Linked GitHub Repositories */}
            {(() => {
              const linkedRepos = (repositories || []).filter(r => 
                (p.linkedRepoIds || []).includes(r.id) || (p.linkedRepoIds || []).includes(r.fullName)
              );
              if (linkedRepos.length === 0) return null;
              return (
                <div style={{ marginBottom: 16 }}>
                  <span className="bento-cap" style={{ display: 'block', marginBottom: 8 }}>
                    Linked Repositories ({linkedRepos.length})
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {linkedRepos.map(repo => (
                      <div
                        key={repo.id}
                        onClick={() => {
                          setActiveId(null);
                          setActiveNav('repos');
                        }}
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                          borderRadius: 12,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                          <FolderGit2 size={13} style={{ color: 'var(--color-blue)', flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {repo.fullName}
                          </span>
                        </div>
                        <ExternalLink size={10} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Attached Image Asset */}
            {(() => {
              const imgSrc = p.images?.[0] || p.thumbnail;
              if (!imgSrc) return null;
              return (
                <div style={{ marginBottom: 16 }}>
                  <span className="bento-cap" style={{ display: 'block', marginBottom: 8 }}>Attached Asset</span>
                  <div style={{ 
                    width: '100%', height: 180, background: '#000', 
                    border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <img 
                      src={imgSrc.startsWith('data:') || imgSrc.startsWith('blob:') ? imgSrc : Capacitor.convertFileSrc(imgSrc)} 
                      alt="attachment" 
                      key={imgSrc} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                      onError={(e) => { 
                        e.target.style.display = 'none'; 
                        e.target.parentElement.innerText = 'IMAGE_LOAD_ERROR'; 
                      }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Execution Activity */}
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span className="bento-cap">Execution History</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                  {p.uses || 0} total runs
                </span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: 14, border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <UsageChart history={p.history} uses={p.uses} />
              </div>
            </div>

          </div>
        ) : (
          <ForgePanel p={p} onUpdate={onUpdate} onCopy={onCopy} requestConfirm={requestConfirm} />
        )}
      </div>

      {/* Version History Modal */}
      <VersionHistoryModal
        isOpen={showVersions}
        onClose={() => setShowVersions(false)}
        prompt={p}
        onRestoreVersion={restorePromptVersion}
      />
    </aside>
  );
}
