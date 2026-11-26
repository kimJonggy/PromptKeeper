import { useState } from 'react';
import { Pin, CheckSquare, Square, Image as ImageIcon, Play, Sparkles } from 'lucide-react';
import { TagPill, ModelBadge } from './UI.jsx';
import { extractVars } from '../data.js';
import { useApp } from '../context/AppContext.jsx';
import { getDeepCardColor } from '../constants/repositoryConstants.js';

export default function PromptCard({ p }) {
  const {
    activeId,
    setActiveId,
    toggleFav: onFav,
    copyPrompt: onCopy,
    modelColors,
    viewMode,
    togglePinPrompt,
    bulkSelectedIds,
    setBulkSelectedIds,
    logRecentItem,
    openRunner,
    openOptimizer,
    updatePrompt
  } = useApp();

  const [copied, setCopied] = useState(false);
  const isActive = String(p.id) === String(activeId);
  const isSelected = bulkSelectedIds?.includes(p.id);

  const onClick = () => {
    setActiveId(isActive ? null : p.id);
    if (!isActive) {
      logRecentItem({ id: p.id, type: 'prompt', title: p.title, action: 'opened' });
    }
  };

  const handleToggleSelect = (e) => {
    e.stopPropagation();
    setBulkSelectedIds(prev => 
      prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id]
    );
  };

  const vars = extractVars(p.body);
  const cardColor = getDeepCardColor(p.color);

  const preview = p.body
    .replace(/\{\{(\w+)\}\}/g, '[$1]')
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/#+\s/g, '')
    .trim()
    .slice(0, 120) + (p.body.length > 120 ? '…' : '');

  const handleCopyClick = (e) => {
    e.stopPropagation();
    onCopy(p);
    logRecentItem({ id: p.id, type: 'prompt', title: p.title, action: 'copied' });
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`list-row ${isActive ? 'active-row' : ''}`}
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 16px',
          background: isSelected 
            ? 'var(--accent-muted)' 
            : isActive 
              ? 'var(--bg-surface-active)' 
              : cardColor 
                ? `radial-gradient(130% 180% at 0% 50%, ${cardColor}34 0%, ${cardColor}16 45%, transparent 85%), var(--bento-card-bg)`
                : 'var(--bento-card-bg)',
          border: isSelected 
            ? '1px solid var(--accent)' 
            : isActive 
              ? '1px solid var(--border-medium)' 
              : cardColor 
                ? `1px solid ${cardColor}66`
                : '1px solid var(--bento-card-border)',
          borderRadius: 8,
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: cardColor 
            ? `inset 0 1px 0 ${cardColor}a6, var(--shadow-rim), 0 0 16px ${cardColor}18`
            : undefined,
          transition: 'background 0.15s ease, border-color 0.15s ease'
        }}
      >
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
          {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
        </button>

        {/* Pin toggle */}
        <button
          onClick={e => { e.stopPropagation(); togglePinPrompt(p.id); }}
          style={{
            background: 'transparent',
            border: 'none',
            color: p.isPinned ? 'var(--accent)' : 'var(--text-tertiary)',
            padding: 2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            opacity: p.isPinned ? 1 : 0.4
          }}
          title={p.isPinned ? 'Pinned to top' : 'Pin prompt'}
        >
          <Pin size={14} fill={p.isPinned ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={e => { e.stopPropagation(); onFav(p.id); }}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 15,
            color: p.fav ? 'var(--accent)' : 'var(--text-tertiary)',
            padding: 2,
            cursor: 'pointer',
            flexShrink: 0,
            opacity: p.fav ? 1 : 0.4
          }}
          title={p.fav ? 'Favorited' : 'Add to Favorites'}
        >
          {p.fav ? '★' : '☆'}
        </button>

        <div style={{ flex: '0 0 200px', minWidth: 140 }}>
          <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Geist, sans-serif' }}>
            {p.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, fontFamily: 'Geist Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{p.category}</span>
            <span>•</span>
            <span>{p.uses} uses</span>
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'Geist, sans-serif' }}>
          {preview}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          <ModelBadge model={p.model} color={modelColors?.[p.model]} size="sm" />
          {vars.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openRunner(p); }}
              style={{
                background: 'rgba(232, 255, 31, 0.08)',
                border: '1px solid rgba(232, 255, 31, 0.22)',
                color: 'var(--accent)',
                fontSize: 10,
                fontWeight: 600,
                padding: '1px 6px',
                borderRadius: 4,
                fontFamily: 'Geist Mono, monospace',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4
              }}
              title="Open Variable Runner"
            >
              <Play size={8} fill="currentColor" />
              <span>{vars.length} vars</span>
            </button>
          )}
          {p.images?.length > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
              <ImageIcon size={12} />
              {p.images.length}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
          {/* AI Optimize Button */}
          <button
            className="btn btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              openOptimizer({
                initialText: p.body,
                promptTitle: p.title,
                onApply: (newBody) => updatePrompt(p.id, { body: newBody })
              });
            }}
            style={{
              background: 'var(--btn-subtle-bg)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--btn-subtle-border)',
              fontWeight: 500,
              fontSize: 11,
              height: 28,
              padding: '0 8px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease'
            }}
            title="AI Prompt Optimizer & Polisher (Feature 5)"
          >
            <Sparkles size={11} style={{ color: 'var(--accent)' }} />
            <span>Optimize</span>
          </button>

          {/* Test & Run Button */}
          <button
            className="btn btn-sm"
            onClick={(e) => { e.stopPropagation(); openRunner(p); }}
            style={{
              background: 'rgba(232, 255, 31, 0.08)',
              color: 'var(--accent)',
              border: '1px solid rgba(232, 255, 31, 0.25)',
              fontWeight: 600,
              fontSize: 11,
              height: 28,
              padding: '0 8px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'background 0.15s ease'
            }}
            title="Prompt Variable Runner & Quick Test (Feature 4)"
          >
            <Play size={10} fill="currentColor" />
            <span>Run</span>
          </button>

          <button
            className={`btn btn-sm ${copied ? 'copy-feedback-animated' : ''}`}
            onClick={handleCopyClick}
            style={{
              background: copied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)',
              color: copied ? '#34d399' : 'var(--text-primary)',
              border: '1px solid ' + (copied ? '#34d399' : 'rgba(255, 255, 255, 0.08)'),
              fontWeight: 500,
              fontSize: 11,
              height: 28,
              padding: '0 10px',
              flexShrink: 0,
              borderRadius: 6,
              transition: 'background 0.15s ease'
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card-hover ${isActive ? 'active-card' : ''}`}
      onClick={onClick}
      style={{
        padding: '16px 18px',
        cursor: 'pointer',
        background: isSelected 
          ? 'var(--accent-muted)' 
          : isActive 
            ? 'var(--bg-surface-active)' 
            : cardColor 
              ? `radial-gradient(130% 120% at 50% -10%, ${cardColor}38 0%, ${cardColor}1c 45%, transparent 85%), var(--bento-card-bg)`
              : 'var(--bento-card-bg)',
        border: isSelected 
          ? '1px solid var(--accent)' 
          : isActive 
            ? '1px solid var(--border-medium)' 
            : cardColor 
              ? `1px solid ${cardColor}66`
              : '1px solid var(--bento-card-border)',
        boxShadow: cardColor 
          ? `inset 0 1.5px 0 ${cardColor}b3, inset 0 0 0 1px ${cardColor}30, var(--shadow-soft), 0 0 24px ${cardColor}20`
          : 'var(--shadow-rim)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'background 0.15s ease, border-color 0.15s ease'
      }}
    >
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
      {p.thumbnail && (
        <div style={{
          width: 'calc(100% + 36px)',
          height: 120,
          margin: '-16px -18px 0 -18px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          overflow: 'hidden',
          borderRadius: '12px 12px 0 0',
          background: '#000'
        }}>
          <img src={p.thumbnail} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Top row: Checkbox + Title + Pin + Fav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 0 }}>
          <button
            onClick={handleToggleSelect}
            style={{
              background: 'transparent',
              border: 'none',
              color: isSelected ? 'var(--accent)' : 'var(--text-tertiary)',
              padding: 0,
              marginTop: 3,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isSelected ? 'Deselect' : 'Select for bulk edit'}
          >
            {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
          </button>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.35, letterSpacing: '-0.01em', fontFamily: 'Geist, sans-serif' }}>
            {p.title}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {/* Pin toggle */}
          <button
            onClick={e => { e.stopPropagation(); togglePinPrompt(p.id); }}
            style={{
              background: p.isPinned ? 'rgba(232, 255, 31, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              border: p.isPinned ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
              color: p.isPinned ? 'var(--accent)' : 'var(--text-tertiary)',
              padding: '3px 5px',
              borderRadius: 6,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              opacity: p.isPinned ? 1 : 0.4
            }}
            title={p.isPinned ? 'Pinned' : 'Pin prompt'}
          >
            <Pin size={12} fill={p.isPinned ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={e => { e.stopPropagation(); onFav(p.id); }}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 15,
              color: p.fav ? 'var(--accent)' : 'var(--text-tertiary)',
              padding: 2,
              cursor: 'pointer',
              flexShrink: 0,
              opacity: p.fav ? 1 : 0.4
            }}
            title={p.fav ? 'Favorited' : 'Add to Favorites'}
          >
            {p.fav ? '★' : '☆'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div 
        style={{
          fontSize: 12,
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          fontFamily: 'Geist, sans-serif',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        {preview}
      </div>

      {/* Tags & Model */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <ModelBadge model={p.model} color={modelColors?.[p.model]} size="sm" />
        {(p.tags || []).slice(0, 3).map(t => <TagPill key={t} tag={t} size="sm" />)}
        {(p.tags || []).length > 3 && (
          <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 500, fontFamily: 'Geist Mono, monospace' }}>+{(p.tags || []).length - 3}</span>
        )}
        {p.images?.length > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
            <ImageIcon size={12} /> {p.images.length}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 'auto' }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Geist Mono, monospace', fontVariantNumeric: 'tabular-nums' }}>
          <span>{p.uses} uses</span>
          {p.category && (
            <>
              <span>•</span>
              <span style={{ color: 'var(--text-secondary)' }}>{p.category}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {vars.length > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); openRunner(p); }}
              style={{
                background: 'rgba(232, 255, 31, 0.08)',
                border: '1px solid rgba(232, 255, 31, 0.22)',
                color: 'var(--accent)',
                padding: '2px 7px',
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 4,
                fontFamily: 'Geist Mono, monospace',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'background 0.15s ease'
              }}
              title="Open Variable Runner"
            >
              <Play size={8} fill="currentColor" />
              <span>{vars.length} vars</span>
            </button>
          )}

          {/* AI Optimize Button */}
          <button
            className="btn btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              openOptimizer({
                initialText: p.body,
                promptTitle: p.title,
                onApply: (newBody) => updatePrompt(p.id, { body: newBody })
              });
            }}
            style={{
              background: 'var(--btn-subtle-bg)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--btn-subtle-border)',
              fontWeight: 500,
              fontSize: 11,
              height: 28,
              padding: '0 8px',
              borderRadius: 6,
              fontFamily: 'Geist, sans-serif',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease'
            }}
            title="AI Prompt Optimizer & Polisher (Feature 5)"
          >
            <Sparkles size={11} style={{ color: 'var(--accent)' }} />
            <span>Optimize</span>
          </button>

          {/* Test & Run Button */}
          <button
            className="btn btn-sm"
            onClick={(e) => { e.stopPropagation(); openRunner(p); }}
            style={{
              background: 'rgba(232, 255, 31, 0.08)',
              color: 'var(--accent)',
              border: '1px solid rgba(232, 255, 31, 0.22)',
              fontWeight: 600,
              fontSize: 11,
              height: 28,
              padding: '0 9px',
              borderRadius: 6,
              fontFamily: 'Geist, sans-serif',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              transition: 'background 0.15s ease'
            }}
            title="Prompt Variable Runner & Quick Test (Feature 4)"
          >
            <Play size={10} fill="currentColor" />
            <span>Run</span>
          </button>

          <button
            className={`btn btn-sm ${copied ? 'copy-feedback-animated' : ''}`}
            onClick={handleCopyClick}
            style={{
              background: copied ? 'rgba(52, 211, 153, 0.15)' : 'var(--accent)',
              color: copied ? '#34d399' : '#0b0b0c',
              border: '1px solid ' + (copied ? '#34d399' : 'transparent'),
              fontWeight: 600,
              fontSize: 11,
              height: 28,
              padding: '0 12px',
              borderRadius: 6,
              fontFamily: 'Geist, sans-serif',
              cursor: 'pointer',
              transition: 'background 0.15s ease'
            }}
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
