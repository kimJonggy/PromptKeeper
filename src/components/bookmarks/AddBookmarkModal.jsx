import { useState, useEffect, useCallback } from 'react';
import { 
  Bookmark, 
  X, 
  AlertCircle, 
  AlertTriangle, 
  Globe, 
  Star,
  ExternalLink,
  FileText
} from 'lucide-react';
import { 
  normalizeBookmarkUrl, 
  extractDomain, 
  inferTitleFromUrl, 
  getFaviconUrl 
} from '../../services/bookmarkService.js';
import { 
  BOOKMARK_STATUS_LIST, 
  DEFAULT_BOOKMARK_CATEGORIES 
} from '../../constants/bookmarkConstants.js';
import { BENTO_CARD_COLORS } from '../../constants/repositoryConstants.js';

export default function AddBookmarkModal({ isOpen, onClose, onAdd, subCategories = [], existingBookmarks = [] }) {
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [color, setColor] = useState('');
  const [category, setCategory] = useState('General');
  const [status, setStatus] = useState('inbox');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [error, setError] = useState(null);
  const [imgError, setImgError] = useState(false);

  // Derived URL info
  const normalizedUrl = urlInput ? normalizeBookmarkUrl(urlInput) : '';
  const domain = normalizedUrl ? extractDomain(normalizedUrl) : '';
  const favicon = domain ? getFaviconUrl(domain) : '';

  // Check duplicate
  const duplicateBookmark = normalizedUrl
    ? existingBookmarks.find(b => b.url.toLowerCase() === normalizedUrl.toLowerCase())
    : null;

  // Auto-fill title from URL when user pastes or leaves URL field if title is empty
  const handleUrlBlur = () => {
    if (normalizedUrl && !titleInput.trim()) {
      const inferred = inferTitleFromUrl(normalizedUrl);
      setTitleInput(inferred);
    }
  };

  const resetForm = () => {
    setUrlInput('');
    setTitleInput('');
    setColor('');
    setCategory('General');
    setStatus('inbox');
    setNotes('');
    setTagsInput('');
    setIsFavorite(false);
    setError(null);
    setImgError(false);
  };

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    if (!normalizedUrl) {
      setError('Please provide a valid website URL (e.g. https://react.dev).');
      return;
    }

    if (duplicateBookmark) {
      setError(`This website bookmark is already in your library ("${duplicateBookmark.title || duplicateBookmark.domain}").`);
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const result = onAdd({
      url: normalizedUrl,
      title: titleInput.trim() || domain || normalizedUrl,
      color,
      category,
      status,
      notes,
      tags,
      isFavorite
    });

    if (result && result.success) {
      handleClose();
    } else if (result && result.error) {
      setError(result.error);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleClose} 
      style={{ 
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)', 
        backdropFilter: 'blur(16px)', 
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div 
        className="bento-card" 
        onClick={e => e.stopPropagation()}
        style={{
          width: 540,
          maxWidth: '94vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '28px',
          boxShadow: 'var(--shadow-soft)',
          overflow: 'hidden'
        }}
      >
        <div className="bento-rim" aria-hidden="true" />

        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(255, 255, 255, 0.02)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 12,
              background: 'var(--accent-muted)',
              border: '1px solid var(--accent-glow)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)'
            }}>
              <Bookmark size={16} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#fff' }}>
                Add Bookmark
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 1 }}>
                Save and annotate technical websites or documentation
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '4px',
              display: 'inline-flex',
              alignItems: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Error Message */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start'
              }}>
                <AlertCircle size={15} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.5 }}>
                  {error}
                </div>
              </div>
            )}

            {/* URL Input */}
            <div>
              <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                Website URL *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="https://example.com/docs or react.dev"
                value={urlInput}
                onChange={e => {
                  setUrlInput(e.target.value);
                  setError(null);
                }}
                onBlur={handleUrlBlur}
                style={{
                  width: '100%',
                  background: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: 14,
                  padding: '9px 12px',
                  fontSize: 12.5,
                  color: '#fff',
                  fontFamily: 'Geist Mono, monospace'
                }}
              />
            </div>

            {/* URL Preview / Domain Chip */}
            {normalizedUrl && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <div style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    background: 'rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}>
                    {favicon && !imgError ? (
                      <img
                        src={favicon}
                        alt=""
                        onError={() => setImgError(true)}
                        style={{ width: 14, height: 14, objectFit: 'contain' }}
                      />
                    ) : (
                      <Globe size={12} style={{ color: 'var(--accent)' }} />
                    )}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#fff', fontFamily: 'Geist Mono, monospace' }}>
                    {domain}
                  </span>
                </div>

                <a
                  href={normalizedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                >
                  <span>Test URL</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            )}

            {/* Duplicate Warning */}
            {duplicateBookmark && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 14,
                padding: '8px 12px',
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              }}>
                <AlertTriangle size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--warning)' }}>
                  This URL is already saved as "{duplicateBookmark.title}".
                </span>
              </div>
            )}

            {/* Title Input */}
            <div>
              <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                Bookmark Title
              </label>
              <input
                type="text"
                placeholder="Descriptive title or page headline"
                value={titleInput}
                onChange={e => setTitleInput(e.target.value)}
                style={{
                  width: '100%',
                  background: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 14,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: '#fff'
                }}
              />
            </div>

            {/* Card Accent Color Swatches */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span className="bento-cap">Card Accent Color</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                  {BENTO_CARD_COLORS.find(c => c.color === color)?.label || 'Obsidian'}
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
                  const isSelected = color === c.color;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColor(c.color)}
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

            {/* Status & Category Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                  Workflow Status
                </label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#000',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 12,
                    padding: '8px 10px',
                    fontSize: 12,
                    color: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {BOOKMARK_STATUS_LIST.map(st => (
                    <option key={st.id} value={st.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                      {st.icon} {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                  Category
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 12,
                    padding: '8px 10px',
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                >
                  {(subCategories.length > 0 ? subCategories : DEFAULT_BOOKMARK_CATEGORIES).map(cat => (
                    <option key={cat} value={cat} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="docs, react, tools, ai"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                style={{
                  width: '100%',
                  background: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: '#fff',
                  fontFamily: 'Geist Mono, monospace'
                }}
              />
            </div>

            {/* Personal Notes (Markdown) */}
            <div>
              <label className="bento-cap" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <FileText size={12} style={{ color: 'var(--accent)' }} />
                <span>Personal Notes (Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Quick notes, key code snippets, or takeaways..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  background: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 12,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: '#fff',
                  fontFamily: 'Geist, sans-serif',
                  lineHeight: 1.45,
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Favorite Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => setIsFavorite(!isFavorite)}>
              <input
                type="checkbox"
                id="bm-favorite"
                checked={isFavorite}
                onChange={e => setIsFavorite(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
              />
              <label htmlFor="bm-favorite" style={{ fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Star size={12} fill={isFavorite ? 'var(--accent)' : 'none'} color={isFavorite ? 'var(--accent)' : 'currentColor'} />
                <span>Add to Favorites</span>
              </label>
            </div>

          </div>

          {/* Footer Controls */}
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(255, 255, 255, 0.02)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10
          }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '7px 16px',
                fontSize: 12,
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!normalizedUrl || !!duplicateBookmark}
              style={{
                background: normalizedUrl && !duplicateBookmark ? 'var(--accent)' : 'rgba(255, 255, 255, 0.06)',
                color: normalizedUrl && !duplicateBookmark ? '#0b0b0c' : 'var(--text-tertiary)',
                border: 'none',
                borderRadius: 12,
                padding: '7px 20px',
                fontSize: 12,
                fontWeight: 700,
                cursor: normalizedUrl && !duplicateBookmark ? 'pointer' : 'not-allowed'
              }}
            >
              Save Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
