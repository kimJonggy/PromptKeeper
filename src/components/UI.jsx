import React, { useState } from 'react';
import { getTagColor, MODEL_COLORS, UNRE } from '../data.js';

export function TagPill({ tag, active, onClick, removable, onRemove, size = 'md' }) {
  const c = getTagColor(tag);
  return (
    <span
      className={`tag-pill${active ? ' act' : ''}`}
      onClick={onClick}
      style={{
        background: active ? c : 'rgba(255, 255, 255, 0.06)',
        color: active ? '#0b0b0c' : 'rgba(255, 255, 255, 0.8)',
        border: active ? `1px solid ${c}` : '1px solid rgba(255, 255, 255, 0.12)',
        fontSize: size === 'sm' ? 10 : 11,
        fontFamily: 'Geist Mono, monospace',
        fontWeight: 600,
        letterSpacing: '-0.02em',
        borderRadius: 11,
        height: size === 'sm' ? 20 : 22,
        padding: size === 'sm' ? '0 8px' : '0 10px',
        display: 'inline-flex',
        alignItems: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.32, 0.72, 0, 1)'
      }}
    >
      {tag.toLowerCase()}
      {removable && (
        <span
          onClick={e => { e.stopPropagation(); onRemove?.(); }}
          style={{ fontWeight: 800, fontSize: 13, lineHeight: 1, marginLeft: 6, cursor: 'pointer', opacity: 0.7 }}
        >×</span>
      )}
    </span>
  );
}

export function ModelBadge({ model, color, size = 'md' }) {
  const c = color || MODEL_COLORS[model] || '#cccccc';
  return (
    <span 
      className="fm"
      style={{
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        color: '#ffffff',
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        fontSize: size === 'sm' ? 9.5 : 10.5,
        fontWeight: 600,
        borderRadius: 10,
        fontFamily: 'Geist Mono, monospace',
        letterSpacing: '-0.02em',
        whiteSpace: 'nowrap',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5
      }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, display: 'inline-block' }} />
      {model}
    </span>
  );
}

export function Toast({ toasts }) {
  const typeStyle = {
    cyan:   { bg: '#34d399', color: '#0b0b0c' },
    violet: { bg: '#E8FF1F', color: '#0b0b0c' },
    pink:   { bg: '#E8FF1F', color: '#0b0b0c' },
    danger: { bg: '#ef4444', color: '#ffffff' },
  };
  return (
    <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 3000, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map(t => {
        const s = typeStyle[t.type] || typeStyle.cyan;
        return (
          <div
            key={t.id}
            style={{
              padding: '10px 18px',
              borderRadius: 16,
              background: 'rgba(15, 15, 18, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              boxShadow: '0 12px 30px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: 'Geist, sans-serif',
              color: '#fff',
              animation: 'modalFadeIn 0.2s ease-out'
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.bg, boxShadow: `0 0 8px ${s.bg}` }} />
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}

export function Divider({ margin = '16px 0' }) {
  return <hr style={{ border: 'none', borderTop: 'var(--nb-border-sm)', margin }} />;
}

export function Label({ children }) {
  return <span className="lbl">{children}</span>;
}

export function StatRow({ label, value, color }) {
  return (
    <div className="flex-between" style={{ padding: '6px 4px', borderBottom: '1px solid var(--border-light)' }}>
      <span className="ft" style={{ fontSize: 10, color: 'var(--text)', fontWeight: 700, letterSpacing: 0.5 }}>{label}</span>
      <span className="ft" style={{ fontSize: 14, fontWeight: 900, color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}

export const VarHighlight = React.memo(function VarHighlight({ text, onVarClick }) {
  if (!text) return null;
  const parts = text.split(UNRE);
  return (
    <>
      {parts.map((p, i) =>
        UNRE.test(p)
          ? <span 
              key={i} 
              onClick={(e) => {
                if (onVarClick) {
                  e.stopPropagation();
                  const name = p.replace(/[{}$[\]%]/g, '').trim();
                  onVarClick(name, p);
                }
              }}
              className={onVarClick ? 'interactive-var-chip' : ''}
              title={onVarClick ? `Click to run or fill variable "${p}"` : 'Variable placeholder'}
              style={{ 
                background: 'rgba(232, 255, 31, 0.12)', 
                color: 'var(--accent)', 
                padding: '1px 5px', 
                borderRadius: 4,
                border: '1px solid rgba(232, 255, 31, 0.35)', 
                fontWeight: 700,
                fontFamily: 'Geist Mono, monospace',
                fontSize: 11.5,
                margin: '0 1px',
                display: 'inline-block'
              }}
            >
              {p}
            </span>
          : <span key={i}>{p}</span>
      )}
    </>
  );
});

export const ResolvedHighlight = React.memo(function ResolvedHighlight({ text, vals = {} }) {
  if (!text) return null;
  const parts = text.split(UNRE);
  return (
    <>
      {parts.map((p, i) => {
        if (UNRE.test(p)) {
          // Extract name from any of the formats: {{name}}, ${name}, [name], %name%
          const name = p.replace(/[{}$[\]%]/g, '').trim();
          const val = vals[name];
          
          if (val && val.trim()) {
            return <span key={i} style={{ 
              color: '#61afef', 
              background: 'rgba(97, 175, 239, 0.12)',
              padding: '0 4px',
              border: '0.5px solid rgba(97, 175, 239, 0.3)',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono, monospace'
            }}>{val}</span>
          } else {
            return <span key={i} style={{ 
              color: '#F28C28', 
              background: 'rgba(242, 140, 40, 0.12)',
              padding: '0 4px',
              border: '0.5px solid rgba(242, 140, 40, 0.3)',
              fontWeight: 800,
              fontFamily: 'JetBrains Mono, monospace'
            }}>{p}</span>
          }
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
});

export function UsageChart({ history = [], uses }) {
  const data = history.length ? history : [uses];
  const max = Math.max(...data, 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, padding: 4, border: 'var(--nb-border-sm)', background: 'var(--bg)' }}>
      {data.map((v, i) => {
        const pct = v / max;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${Math.max(10, pct * 100)}%`,
              background: 'var(--accent)',
              border: 'var(--nb-border-sm)',
              transition: 'height 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}
          />
        );
      })}
    </div>
  );
}

export function ConfirmModal({ title, message, type = 'confirm', inputPlaceholder, onConfirm, onCancel }) {
  const [val, setVal] = useState('');
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div 
        className="industrial-modal" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 440 }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent)', letterSpacing: 0.5 }}>{title || 'CONFIRMATION REQUIRED'}</span>
          <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', fontSize: 16, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '24px 20px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {message}
          {type === 'prompt' && (
            <input 
              autoFocus
              value={val} 
              onChange={e => setVal(e.target.value)} 
              placeholder={inputPlaceholder || "Type here..."} 
              onKeyDown={e => e.key === 'Enter' && onConfirm(val)}
              style={{ marginTop: 14, width: '100%', height: 38, background: 'var(--bg-app)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', padding: '0 12px' }}
            />
          )}
        </div>
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-sm" onClick={onCancel} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 18px' }}>CANCEL</button>
          <button className="btn btn-sm" onClick={() => onConfirm(type === 'prompt' ? val : true)} style={{ background: 'var(--accent)', border: 'none', color: '#000', fontWeight: 800, padding: '8px 20px' }}>{type === 'prompt' ? 'SUBMIT' : 'CONFIRM'}</button>
        </div>
      </div>
    </div>
  );
}
