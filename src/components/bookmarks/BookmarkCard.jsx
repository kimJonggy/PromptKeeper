import { useState } from 'react';
import { 
  Globe, 
  ExternalLink, 
  Star, 
  Pin, 
  Copy, 
  Link2, 
  FileText, 
  Trash2, 
  Check,
  CheckSquare,
  Square
} from 'lucide-react';
import { BOOKMARK_STATUSES } from '../../constants/bookmarkConstants.js';
import { getDeepCardColor } from '../../constants/repositoryConstants.js';
import { getFaviconUrl } from '../../services/bookmarkService.js';
import { useApp } from '../../context/AppContext.jsx';

export default function BookmarkCard({
  bookmark: bm,
  onSelect,
  onToggleFavorite,
  onTogglePin,
  viewMode = 'grid'
}) {
  const { bulkSelectedIds, setBulkSelectedIds, logRecentItem } = useApp();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isSelected = bulkSelectedIds?.includes(bm.id);

  const handleToggleSelect = (e) => {
    e.stopPropagation();
    setBulkSelectedIds(prev => 
      prev.includes(bm.id) ? prev.filter(x => x !== bm.id) : [...prev, bm.id]
    );
  };

  const statusConfig = BOOKMARK_STATUSES[bm.status] || BOOKMARK_STATUSES.inbox;
  const faviconUrl = getFaviconUrl(bm.url);

  const handleCopyUrl = (e) => {
    e.stopPropagation();
    logRecentItem({ id: bm.id, type: 'bookmark', title: bm.title || bm.domain, action: 'copied' });
    navigator.clipboard.writeText(bm.url).then(() => {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    });
  };

  const handleCopyMd = (e) => {
    e.stopPropagation();
    logRecentItem({ id: bm.id, type: 'bookmark', title: bm.title || bm.domain, action: 'copied' });
    navigator.clipboard.writeText(`[${bm.title || bm.domain}](${bm.url})`).then(() => {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 1500);
    });
  };

  const handleCardClick = () => {
    logRecentItem({ id: bm.id, type: 'bookmark', title: bm.title || bm.domain, action: 'opened' });
    onSelect(bm);
  };

  const hasNotes = Boolean(bm.personalNotes && bm.personalNotes.trim());
  const cardColor = getDeepCardColor(bm.color);

  if (viewMode === 'list') {
    return (
      <div
        className="list-row bento-card"
        onClick={handleCardClick}
        style={{
          background: isSelected 
            ? 'var(--accent-muted)' 
            : cardColor 
              ? `radial-gradient(130% 180% at 0% 50%, ${cardColor}34 0%, ${cardColor}16 45%, transparent 85%), var(--bento-card-bg)`
              : 'var(--bento-card-bg)',
          border: isSelected 
            ? '1px solid var(--accent)' 
            : bm.isPinned 
              ? '1px solid var(--accent)' 
              : cardColor 
                ? `1px solid ${cardColor}66`
                : '1px solid var(--bento-card-border)',
          borderRadius: '20px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: cardColor 
            ? `inset 0 1px 0 ${cardColor}a6, var(--shadow-rim), 0 0 18px ${cardColor}18`
            : 'var(--shadow-rim)',
          transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
        }}
      >
        <div className="bento-rim" aria-hidden="true" />
        {cardColor && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '35%',
            background: cardColor,
            opacity: 0.18,
            filter: 'blur(35px)',
            pointerEvents: 'none',
            zIndex: 0
          }} />
        )}
        {/* Selection Checkbox */}
        <button
          onClick={handleToggleSelect}
          style={{
            background: 'transparent',
            border: 'none',
            color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
            padding: 2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
          title={isSelected ? 'Deselect' : 'Select for bulk edit'}
        >
          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>
        {/* Favicon / Icon */}
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 'var(--radius-xs)',
          background: 'var(--bg-surface-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden'
        }}>
          {!imgError && faviconUrl ? (
            <img 
              src={faviconUrl} 
              alt={bm.domain} 
              style={{ width: 18, height: 18, objectFit: 'contain' }}
              onError={() => setImgError(true)}
            />
          ) : (
            <Globe size={16} style={{ color: 'var(--text-tertiary)' }} />
          )}
        </div>

        {/* Title & Domain */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bm.title}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', background: 'var(--bg-app)', padding: '1px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace' }}>
              {bm.domain}
            </span>
            {bm.isPinned && (
              <span style={{ fontSize: 9, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase' }}>Pinned</span>
            )}
            {hasNotes && (
              <span style={{ fontSize: 10, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <FileText size={11} />
                <span>Notes</span>
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
            {bm.description || bm.url}
          </div>
        </div>

        {/* Status Pill */}
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: 'var(--radius-xs)',
          background: statusConfig.bg,
          color: statusConfig.color,
          border: `1px solid ${statusConfig.border}`,
          flexShrink: 0
        }}>
          {statusConfig.label}
        </span>

        {/* Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title="Open external link"
          >
            <ExternalLink size={14} />
          </a>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(bm.id); }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              color: bm.isFavorite ? 'var(--accent)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title={bm.isFavorite ? 'Favorited' : 'Add to favorites'}
          >
            <Star size={14} fill={bm.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    );
  }

  // Grid View Mode (High-Craft Bento Card)
  return (
    <div
      className="bento-card prompt-card"
      onClick={handleCardClick}
      style={{
        background: isSelected 
          ? 'var(--accent-muted)' 
          : cardColor 
            ? `radial-gradient(130% 120% at 50% -10%, ${cardColor}38 0%, ${cardColor}1c 45%, transparent 85%), var(--bento-card-bg)`
            : 'var(--bento-card-bg)',
        border: isSelected 
          ? '1px solid var(--accent)' 
          : bm.isPinned 
            ? '1px solid var(--accent)' 
            : cardColor 
              ? `1px solid ${cardColor}66`
              : '1px solid var(--bento-card-border)',
        borderRadius: '28px',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: bm.isPinned 
          ? '0 0 28px rgba(232, 255, 31, 0.2), var(--shadow-rim)' 
          : cardColor 
            ? `inset 0 1.5px 0 ${cardColor}b3, inset 0 0 0 1px ${cardColor}30, var(--shadow-soft), 0 0 24px ${cardColor}20`
            : 'var(--shadow-rim)',
        transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)'
      }}
    >
      <div className="bento-rim" aria-hidden="true" />
      {cardColor && (
        <div style={{
          position: 'absolute',
          left: '8%',
          right: '8%',
          top: '5%',
          bottom: '25%',
          borderRadius: 90,
          background: cardColor,
          opacity: 0.22,
          filter: 'blur(48px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
      )}
      {/* Top Bar: Checkbox + Favicon + Domain + Status + Pin */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <button
              onClick={handleToggleSelect}
              style={{
                background: 'transparent',
                border: 'none',
                color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={isSelected ? 'Deselect' : 'Select for bulk edit'}
            >
              {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
            </button>
            <div style={{
              width: 26,
              height: 26,
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden'
            }}>
              {!imgError && faviconUrl ? (
                <img 
                  src={faviconUrl} 
                  alt={bm.domain} 
                  style={{ width: 16, height: 16, objectFit: 'contain' }}
                  onError={() => setImgError(true)}
                />
              ) : (
                <Globe size={14} style={{ color: 'var(--text-tertiary)' }} />
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bm.domain}
            </span>
            {(bm.subCategory || bm.category) && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 6,
                background: 'rgba(232, 255, 31, 0.08)',
                border: '1px solid rgba(232, 255, 31, 0.22)',
                color: 'var(--accent)',
                fontFamily: 'Geist Mono, monospace',
                whiteSpace: 'nowrap'
              }}>
                {bm.subCategory || bm.category}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasNotes && (
              <span style={{
                fontSize: 10,
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'rgba(232, 255, 31, 0.08)',
                padding: '2px 6px',
                borderRadius: 6,
                fontFamily: 'Geist Mono, monospace'
              }} title="Has personal study notes">
                <FileText size={10} />
                <span>Notes</span>
              </span>
            )}
            {bm.isPinned && (
              <span style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center' }} title="Pinned">
                <Pin size={12} fill="currentColor" />
              </span>
            )}
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 'var(--radius-xs)',
              background: statusConfig.bg,
              color: statusConfig.color,
              border: `1px solid ${statusConfig.border}`,
              whiteSpace: 'nowrap'
            }}>
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="bento-ttl" style={{ fontSize: 19, fontWeight: 700, color: 'var(--bento-card-title)', lineHeight: 1.3, letterSpacing: '-0.025em', marginBottom: 8 }}>
          {bm.title}
        </div>

        {/* Description */}
        <p style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          marginBottom: 12,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {bm.description || bm.url}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {(bm.tags || []).slice(0, 2).map(tag => (
            <span key={tag} style={{
              fontSize: 10,
              background: 'var(--btn-subtle-bg)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 6,
              padding: '1px 6px',
              fontFamily: 'Geist Mono, monospace'
            }}>
              #{tag}
            </span>
          ))}
          {(bm.tags || []).length > 2 && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', alignSelf: 'center', fontFamily: 'Geist Mono, monospace' }}>
              +{bm.tags.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* Footer Toolbar */}
      <div style={{
        paddingTop: 10,
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={handleCopyUrl}
            style={{
              background: copiedUrl ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: copiedUrl ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 13,
              height: 26,
              padding: '0 11px',
              fontSize: 10.5,
              fontWeight: 700,
              fontFamily: 'Geist Mono, monospace',
              color: copiedUrl ? '#34d399' : 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Copy URL"
          >
            {copiedUrl ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
            <span>{copiedUrl ? 'Copied' : 'URL'}</span>
          </button>

          <button
            onClick={handleCopyMd}
            style={{
              background: copiedMd ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.08)',
              border: copiedMd ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.14)',
              borderRadius: 13,
              height: 26,
              padding: '0 11px',
              fontSize: 10.5,
              fontWeight: 700,
              fontFamily: 'Geist Mono, monospace',
              color: copiedMd ? '#34d399' : 'rgba(255, 255, 255, 0.85)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Copy Markdown Link"
          >
            {copiedMd ? <Check size={11} strokeWidth={2.5} /> : <Link2 size={11} />}
            <span>MD</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onTogglePin(bm.id); }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              color: bm.isPinned ? 'var(--accent)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title={bm.isPinned ? 'Unpin bookmark' : 'Pin to top'}
          >
            <Pin size={13} fill={bm.isPinned ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(bm.id); }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              color: bm.isFavorite ? 'var(--accent)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title={bm.isFavorite ? 'Favorited' : 'Add to favorites'}
          >
            <Star size={13} fill={bm.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <a
            href={bm.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center'
            }}
            title="Open website in new tab"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
