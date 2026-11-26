import { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  X, 
  Copy, 
  Link2, 
  Star, 
  Pin, 
  Check,
  FileText,
  FolderGit2,
  Edit2,
  Tag,
  Trash2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  BOOKMARK_STATUSES, 
  DEFAULT_BOOKMARK_CATEGORIES 
} from '../../constants/bookmarkConstants.js';
import { BENTO_CARD_COLORS, getDeepCardColor } from '../../constants/repositoryConstants.js';
import { safeExternalUrl } from '../../utils/validation.js';
import { useApp } from '../../context/AppContext.jsx';

export default function BookmarkDetail({
  bookmark,
  subCategories = [],
  onClose,
  onUpdate,
  onDelete,
  onToggleFavorite,
  onTogglePin,
  requestConfirm
}) {
  const { prompts = [], repositories = [], setActiveId, setActiveNav } = useApp();
  const [notes, setNotes] = useState(bookmark.notes || bookmark.personalNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(bookmark.title || '');
  const [description, setDescription] = useState(bookmark.description || '');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Sync state if bookmark changes during inspect
  const [prevId, setPrevId] = useState(bookmark.id);
  if (prevId !== bookmark.id) {
    setPrevId(bookmark.id);
    setTitle(bookmark.title || '');
    setDescription(bookmark.description || '');
    setNotes(bookmark.notes || bookmark.personalNotes || '');
    setIsEditingTitle(false);
    setIsEditingDesc(false);
    setIsEditingNotes(false);
  }

  const statusConfig = BOOKMARK_STATUSES[bookmark.status] || BOOKMARK_STATUSES.inbox;

  const handleSaveTitle = () => {
    if (title.trim()) {
      onUpdate(bookmark.id, { title: title.trim() });
    } else {
      setTitle(bookmark.title || bookmark.domain);
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = () => {
    onUpdate(bookmark.id, { description: description.trim() });
    setIsEditingDesc(false);
  };

  const handleSaveNotes = () => {
    onUpdate(bookmark.id, { notes: notes.trim(), personalNotes: notes.trim() });
    setIsEditingNotes(false);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (!tag) return;
    const currentTags = bookmark.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdate(bookmark.id, { tags: [...currentTags, tag] });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    const currentTags = bookmark.tags || [];
    onUpdate(bookmark.id, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(bookmark.url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    });
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(`[${bookmark.title || bookmark.domain}](${bookmark.url})`).then(() => {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 1800);
    });
  };

  const handleDelete = () => {
    requestConfirm({
      title: 'REMOVE BOOKMARK',
      message: `Remove "${bookmark.title || bookmark.domain}" from your bookmarks? Any saved notes will be permanently deleted.`,
      onConfirm: () => {
        onDelete(bookmark.id);
        onClose();
      }
    });
  };

  // Find cross-linked prompts (matching tags or category)
  const relatedPrompts = (prompts || []).filter(p => {
    if (!p) return false;
    const shareTag = (p.tags || []).some(t => (bookmark.tags || []).includes(t.toLowerCase()));
    const shareCat = (p.category || '').toLowerCase() === (bookmark.category || '').toLowerCase();
    return shareTag || shareCat;
  }).slice(0, 3);

  // Find cross-linked repos (matching tags or domain name)
  const relatedRepos = (repositories || []).filter(r => {
    if (!r) return false;
    const shareTag = (r.tags || []).some(t => (bookmark.tags || []).includes(t.toLowerCase()));
    const shareTopic = (r.topics || []).some(t => (bookmark.tags || []).includes(t.toLowerCase()));
    const matchDomain = bookmark.domain && (
      (r.fullName || '').toLowerCase().includes(bookmark.domain.replace(/\.[^/.]+$/, '')) ||
      (r.description || '').toLowerCase().includes(bookmark.domain)
    );
    return shareTag || shareTopic || matchDomain;
  }).slice(0, 3);

  const activeColorObj = BENTO_CARD_COLORS.find(c => c.color === (bookmark.color || '') || (bookmark.color && c.color === getDeepCardColor(bookmark.color))) || BENTO_CARD_COLORS[0];

  return (
    <aside
      className="detail-panel detail-panel-mobile open"
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
      {/* 1. Zen Micro-Actions Header (Single Clean Row) */}
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
        {/* Favicon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {bookmark.favicon && !imgError ? (
              <img
                src={bookmark.favicon}
                alt=""
                onError={() => setImgError(true)}
                style={{ width: 16, height: 16, objectFit: 'contain' }}
              />
            ) : (
              <Globe size={14} style={{ color: bookmark.color || 'var(--accent)' }} />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
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
                    setTitle(bookmark.title || bookmark.domain);
                    setIsEditingTitle(false);
                  }
                }}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid var(--accent)',
                  borderRadius: 6,
                  padding: '2px 8px',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  outline: 'none',
                  fontFamily: 'Geist, sans-serif'
                }}
              />
            ) : (
              <div 
                onClick={() => setIsEditingTitle(true)}
                title="Click to rename"
                style={{
                  fontSize: 15.5,
                  fontWeight: 700,
                  color: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>{bookmark.title || bookmark.domain}</span>
                <Edit2 size={11} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1, fontFamily: 'Geist Mono, monospace' }}>
              <span>{bookmark.domain}</span>
              <span>•</span>
              <a 
                href={safeExternalUrl(bookmark.url)} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: bookmark.color || 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2 }}
              >
                <span>Visit</span>
                <ExternalLink size={9} />
              </a>
            </div>
          </div>
        </div>

        {/* Micro Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* Primary Open */}
          <a
            href={safeExternalUrl(bookmark.url)}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in new tab"
            style={{
              background: 'var(--accent)',
              color: '#0b0b0c',
              border: 'none',
              borderRadius: 10,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              textDecoration: 'none',
              fontFamily: 'Geist, sans-serif'
            }}
          >
            <span>Open</span>
            <ExternalLink size={11} />
          </a>

          {/* Copy URL */}
          <button
            onClick={handleCopyUrl}
            title={copiedUrl ? 'Copied!' : 'Copy URL'}
            style={{
              background: copiedUrl ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              color: copiedUrl ? '#34d399' : 'rgba(255, 255, 255, 0.8)',
              border: '1px solid ' + (copiedUrl ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {copiedUrl ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} />}
          </button>

          {/* Copy Markdown */}
          <button
            onClick={handleCopyMd}
            title={copiedMd ? 'Markdown copied!' : 'Copy Markdown link'}
            style={{
              background: copiedMd ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              color: copiedMd ? '#34d399' : 'rgba(255, 255, 255, 0.8)',
              border: '1px solid ' + (copiedMd ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {copiedMd ? <Check size={13} strokeWidth={2.5} /> : <Link2 size={13} />}
          </button>

          {/* Favorite */}
          <button
            onClick={() => onToggleFavorite(bookmark.id)}
            title={bookmark.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              background: bookmark.isFavorite ? 'rgba(232, 255, 31, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: bookmark.isFavorite ? 'var(--accent)' : 'rgba(255, 255, 255, 0.7)',
              border: '1px solid ' + (bookmark.isFavorite ? 'var(--accent)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Star size={13} fill={bookmark.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* Pin */}
          <button
            onClick={() => onTogglePin(bookmark.id)}
            title={bookmark.isPinned ? 'Unpin bookmark' : 'Pin bookmark'}
            style={{
              background: bookmark.isPinned ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: bookmark.isPinned ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.7)',
              border: '1px solid ' + (bookmark.isPinned ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Pin size={13} fill={bookmark.isPinned ? 'currentColor' : 'none'} />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            title="Delete bookmark"
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

      {/* 2. Scrollable Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

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
              const isSelected = (bookmark.color || '') === c.color || (bookmark.color && getDeepCardColor(bookmark.color) === c.color);
              return (
                <button
                  key={c.id}
                  onClick={() => onUpdate(bookmark.id, { color: c.color })}
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

        {/* Bento Meta Strip: Category & Status in 1 Single Sleek Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 16,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 16,
          padding: '10px 14px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="bento-cap">Category</span>
            <select
              value={bookmark.subCategory || bookmark.category || 'General'}
              onChange={e => onUpdate(bookmark.id, { subCategory: e.target.value, category: e.target.value })}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--accent)',
                border: '1px solid rgba(255, 255, 255, 0.14)',
                borderRadius: 10,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'Geist, sans-serif'
              }}
            >
              {(subCategories.length > 0 ? subCategories : DEFAULT_BOOKMARK_CATEGORIES).map(cat => (
                <option key={cat} value={cat} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="bento-cap">Status</span>
            <select
              value={bookmark.status || 'inbox'}
              onChange={e => onUpdate(bookmark.id, { status: e.target.value })}
              style={{
                background: statusConfig.bg,
                color: statusConfig.color,
                border: `1px solid ${statusConfig.border}`,
                borderRadius: 10,
                padding: '3px 8px',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              {Object.values(BOOKMARK_STATUSES).map(st => (
                <option key={st.id} value={st.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  {st.icon} {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Short Description (Clean & Inline Editable) */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="bento-cap">Description / Takeaway</span>
            <button
              onClick={() => {
                if (isEditingDesc) handleSaveDescription();
                else setIsEditingDesc(true);
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
              {isEditingDesc ? <><Check size={11} /> Save</> : <><Edit2 size={11} /> Edit</>}
            </button>
          </div>

          {isEditingDesc ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                autoFocus
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSaveDescription();
                  }
                }}
                placeholder="Short summary or why this bookmark is useful..."
                style={{
                  background: 'rgba(0, 0, 0, 0.55)',
                  border: '1px solid var(--accent)',
                  borderRadius: 14,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#fff',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  fontFamily: 'Geist, sans-serif'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => {
                    setDescription(bookmark.description || '');
                    setIsEditingDesc(false);
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
                  onClick={handleSaveDescription}
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
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingDesc(true)}
              className="bento-recess"
              style={{
                padding: '10px 14px',
                borderRadius: 14,
                cursor: 'pointer',
                fontSize: 12,
                lineHeight: 1.5,
                color: bookmark.description ? 'var(--text-secondary)' : 'var(--text-tertiary)',
                fontStyle: bookmark.description ? 'normal' : 'italic'
              }}
              title="Click to edit summary"
            >
              {bookmark.description || 'No description provided. Click to add a short takeaway...'}
            </div>
          )}
        </div>

        {/* Destination URL Single Strip */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 14,
          padding: '8px 12px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace' }}>
            {bookmark.url}
          </div>
          <button
            onClick={handleCopyUrl}
            style={{
              background: 'transparent',
              border: 'none',
              color: copiedUrl ? '#34d399' : 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 4,
              display: 'inline-flex',
              alignItems: 'center',
              flexShrink: 0
            }}
            title="Copy URL"
          >
            {copiedUrl ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
          </button>
        </div>

        {/* Personal Notes (Markdown) */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="bento-cap">Personal Notes & Study Log</span>
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
              {isEditingNotes ? <><Check size={11} /> Save Notes</> : <><Edit2 size={11} /> Edit Notes</>}
            </button>
          </div>

          {isEditingNotes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <textarea
                autoFocus
                rows={6}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Markdown evaluation notes, article takeaways, code snippets, or reference commands..."
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.55)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
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
                    setNotes(bookmark.notes || bookmark.personalNotes || '');
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
                padding: '12px 14px',
                borderRadius: 14,
                cursor: 'pointer',
                minHeight: 64,
                fontSize: 12,
                color: notes.trim() ? 'var(--text-primary)' : 'var(--text-tertiary)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                fontFamily: notes.trim() ? 'Geist Mono, monospace' : 'Geist, sans-serif',
                fontStyle: notes.trim() ? 'normal' : 'italic'
              }}
              title="Click to write notes"
            >
              {notes.trim() || 'No notes added yet. Click to write evaluation insights or key takeaways...'}
            </div>
          )}
        </div>

        {/* Minimal Tags */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="bento-cap">Tags</span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
              {(bookmark.tags || []).length}
            </span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
            {(bookmark.tags || []).map(t => (
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

        {/* Cross-Linked Prompts */}
        {relatedPrompts.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span className="bento-cap" style={{ display: 'block', marginBottom: 8 }}>Related Prompts ({relatedPrompts.length})</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {relatedPrompts.map(pr => (
                <div
                  key={pr.id}
                  onClick={() => {
                    onClose();
                    setActiveId(pr.id);
                    setActiveNav('prompts');
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
                    <Sparkles size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {pr.title}
                    </span>
                  </div>
                  <ExternalLink size={10} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cross-Linked Repositories */}
        {relatedRepos.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span className="bento-cap" style={{ display: 'block', marginBottom: 8 }}>Related Repositories ({relatedRepos.length})</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {relatedRepos.map(repo => (
                <div
                  key={repo.id}
                  onClick={() => {
                    onClose();
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
                    <FolderGit2 size={12} style={{ color: 'var(--color-blue)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {repo.fullName}
                    </span>
                  </div>
                  <ExternalLink size={10} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Saved Date */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: 12,
          fontSize: 10,
          color: 'var(--text-tertiary)',
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'Geist Mono, monospace'
        }}>
          <span>Saved: {bookmark.createdAt ? new Date(bookmark.createdAt).toLocaleDateString() : 'Recently'}</span>
          <span>Updated: {bookmark.updatedAt ? new Date(bookmark.updatedAt).toLocaleDateString() : 'Recently'}</span>
        </div>

      </div>
    </aside>
  );
}
