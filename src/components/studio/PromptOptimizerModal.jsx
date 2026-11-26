import { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Copy, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  FileText,
  Sliders,
  Zap,
  RotateCcw
} from 'lucide-react';
import { optimizePrompt } from '../../services/promptOptimizerService.js';
import { useApp } from '../../context/AppContext.jsx';

const PRESETS = [
  {
    id: 'production',
    name: 'Production Grade',
    badge: 'Recommended',
    icon: ShieldCheck,
    desc: 'Structured role, clear objectives, strict negative constraints & output schema'
  },
  {
    id: 'concise',
    name: 'Concise & Fast',
    badge: 'Token-Efficient',
    icon: Zap,
    desc: 'Zero fluff, high token density, direct imperative instructions'
  },
  {
    id: 'chain_of_thought',
    name: 'Deep Reasoning',
    badge: 'Chain of Thought',
    icon: Cpu,
    desc: 'Step-by-step thinking scratchpad and self-verification checks'
  }
];

export default function PromptOptimizerModal({
  isOpen,
  onClose,
  initialText = '',
  promptTitle = 'Prompt Optimizer',
  onApply
}) {
  const { toast } = useApp() || {};
  const [preset, setPreset] = useState('production');
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'optimized' | 'original'

  // Run deterministic optimization
  const optimizationResult = useMemo(() => {
    return optimizePrompt(initialText, preset);
  }, [initialText, preset]);

  if (!isOpen) return null;

  const { optimized, domain, improvements, scoreBoost, variables } = optimizationResult;

  const originalCharCount = (initialText || '').length;
  const originalWordCount = (initialText || '').trim() ? (initialText || '').trim().split(/\s+/).length : 0;
  const originalTokens = Math.ceil(originalCharCount / 4);

  const optimizedCharCount = optimized.length;
  const optimizedWordCount = optimized.trim() ? optimized.trim().split(/\s+/).length : 0;
  const optimizedTokens = Math.ceil(optimizedCharCount / 4);

  const handleCopyOptimized = () => {
    navigator.clipboard.writeText(optimized);
    setCopied(true);
    if (toast) toast('Optimized prompt copied to clipboard!', 'lime');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (onApply) {
      onApply(optimized);
      if (toast) toast('Optimized prompt applied successfully!', 'lime');
      onClose();
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.82)',
        backdropFilter: 'blur(8px)',
        zIndex: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="industrial-modal"
        onClick={e => e.stopPropagation()}
        style={{
          width: '980px',
          maxWidth: '96vw',
          height: '86vh',
          maxHeight: '760px',
          background: '#0d0f14',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 14,
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.18s ease-out'
        }}
      >
        {/* Modal Top Header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#12151c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'rgba(232, 255, 31, 0.12)',
              border: '1px solid rgba(232, 255, 31, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              flexShrink: 0
            }}>
              <Sparkles size={14} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Geist, sans-serif' }}>
                  AI Prompt Optimizer
                </span>
                <span style={{
                  fontSize: 10.5,
                  padding: '1px 7px',
                  borderRadius: 4,
                  background: 'rgba(232, 255, 31, 0.12)',
                  color: 'var(--accent)',
                  fontFamily: 'Geist Mono, monospace',
                  fontWeight: 700
                }}>
                  +{scoreBoost}% Reliability
                </span>
                <span style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  {domain}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '450px' }}>
                {promptTitle}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              borderRadius: 8,
              width: 28,
              height: 28,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Close modal"
          >
            <X size={15} />
          </button>
        </div>

        {/* Preset Selector Banner */}
        <div style={{
          padding: '10px 20px',
          background: '#090b0f',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
          flexWrap: 'wrap'
        }}>
          {/* Preset Buttons */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, fontFamily: 'Geist Mono, monospace', marginRight: 4 }}>
              Optimization Preset:
            </span>
            {PRESETS.map(p => {
              const isSelected = preset === p.id;
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  style={{
                    background: isSelected ? 'rgba(232, 255, 31, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: isSelected ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                    borderRadius: 8,
                    padding: '6px 12px',
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                  title={p.desc}
                >
                  <Icon size={12} />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle for Small Screens */}
          <div className="show-mobile-flex" style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              style={{
                background: viewMode === 'split' ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--text-secondary)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10
              }}
            >
              Split
            </button>
            <button
              type="button"
              onClick={() => setViewMode('optimized')}
              style={{
                background: viewMode === 'optimized' ? 'var(--accent)' : 'transparent',
                color: viewMode === 'optimized' ? '#000' : 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 10
              }}
            >
              Optimized
            </button>
          </div>
        </div>

        {/* Improvements Audit Strip */}
        {improvements.length > 0 && (
          <div style={{
            padding: '8px 20px',
            background: 'rgba(255, 255, 255, 0.02)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            overflowX: 'auto',
            flexShrink: 0
          }}>
            <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', fontFamily: 'Geist Mono, monospace', whiteSpace: 'nowrap' }}>
              Optimizations:
            </span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {improvements.map((imp, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: 10.5,
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 4,
                    padding: '2px 7px',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  <Check size={10} style={{ color: '#34d399' }} />
                  {imp}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Main Body: Side-by-Side Comparison */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: viewMode === 'split' ? '1fr 1fr' : '1fr',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Left Column: Original Draft */}
          {(viewMode === 'split' || viewMode === 'original') && (
            <div style={{
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#0a0b0f',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              {/* Header */}
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  fontFamily: 'Geist Mono, monospace'
                }}>
                  Original Draft
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                  {originalWordCount} words • ~{originalTokens} tokens
                </span>
              </div>

              {/* Text Body */}
              <div style={{
                flex: 1,
                padding: '16px',
                overflowY: 'auto',
                fontFamily: 'Geist Mono, monospace',
                fontSize: 12,
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                opacity: 0.85
              }}>
                {initialText || '(No prompt text provided)'}
              </div>
            </div>
          )}

          {/* Right Column: Optimized Result */}
          {(viewMode === 'split' || viewMode === 'optimized') && (
            <div style={{
              background: '#0e1118',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0
            }}>
              {/* Header */}
              <div style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                background: 'rgba(232, 255, 31, 0.03)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={11} style={{ color: 'var(--accent)' }} />
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    Optimized Specification
                  </span>
                </div>
                <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                  {optimizedWordCount} words • ~{optimizedTokens} tokens
                </span>
              </div>

              {/* Text Body */}
              <div style={{
                flex: 1,
                padding: '16px 20px',
                overflowY: 'auto',
                fontFamily: 'Geist Mono, monospace',
                fontSize: 12.5,
                lineHeight: 1.65,
                color: '#f4f6fa',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {optimized}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer: Action Bar */}
        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: '#12151c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0
        }}>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
            Preset: <span style={{ color: '#fff', fontWeight: 600 }}>{PRESETS.find(p => p.id === preset)?.name}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={handleCopyOptimized}
              style={{
                background: copied ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                border: '1px solid ' + (copied ? '#34d399' : 'rgba(255, 255, 255, 0.12)'),
                color: copied ? '#34d399' : 'var(--text-primary)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Optimized'}</span>
            </button>

            {onApply && (
              <button
                type="button"
                onClick={handleApply}
                style={{
                  background: 'var(--accent)',
                  color: '#0b0b0c',
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: 'Geist, sans-serif',
                  boxShadow: '0 2px 10px rgba(232, 255, 31, 0.25)'
                }}
              >
                <ArrowRight size={13} strokeWidth={2.5} />
                <span>Apply to Prompt</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

