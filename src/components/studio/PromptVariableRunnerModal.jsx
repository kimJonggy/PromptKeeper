import { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  Play, 
  Copy, 
  Check, 
  RotateCcw, 
  ExternalLink, 
  Sparkles, 
  Sliders,
  ChevronDown
} from 'lucide-react';
import { extractVars } from '../../data.js';
import { resolvePromptVariables } from '../../services/promptOptimizerService.js';
import { useApp } from '../../context/AppContext.jsx';

const AI_RUNNERS = [
  { id: 'chatgpt', name: 'ChatGPT', url: (p) => `https://chatgpt.com/?q=${encodeURIComponent(p)}` },
  { id: 'claude', name: 'Claude', url: () => `https://claude.ai/new` },
  { id: 'gemini', name: 'Gemini', url: () => `https://gemini.google.com/app` },
  { id: 'perplexity', name: 'Perplexity', url: (p) => `https://www.perplexity.ai/?q=${encodeURIComponent(p)}` },
  { id: 'copilot', name: 'Copilot', url: () => `https://copilot.microsoft.com/` }
];

export default function PromptVariableRunnerModal({
  isOpen,
  onClose,
  prompt,
  onCopyAssembled
}) {
  const { toast, logRecentItem } = useApp() || {};
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState({});
  const [selectedRunner, setSelectedRunner] = useState('chatgpt');

  const promptTitle = prompt?.title || 'Prompt Runner';
  const promptBody = prompt?.body || '';

  // Extract variables
  const variables = useMemo(() => {
    if (!promptBody) return [];
    const raw = extractVars(promptBody);
    const names = raw.map(v => (typeof v === 'string' ? v : v.name));
    return Array.from(new Set(names.filter(Boolean)));
  }, [promptBody]);

  // Reset or initialize values when prompt changes
  useEffect(() => {
    if (prompt) {
      const initialVals = {};
      variables.forEach(v => {
        initialVals[v] = prompt?.vals?.[v] || '';
      });
      setValues(initialVals);
    }
  }, [prompt, variables]);

  // Compute live assembled prompt
  const assembledPrompt = useMemo(() => {
    return resolvePromptVariables(promptBody, values);
  }, [promptBody, values]);

  // Metrics
  const charCount = assembledPrompt.length;
  const wordCount = assembledPrompt.trim() ? assembledPrompt.trim().split(/\s+/).length : 0;
  const tokenEstimate = Math.ceil(charCount / 4);

  if (!isOpen || !prompt) return null;

  const handleValueChange = (varName, val) => {
    setValues(prev => ({ ...prev, [varName]: val }));
  };

  const handleClearAll = () => {
    const emptyVals = {};
    variables.forEach(v => { emptyVals[v] = ''; });
    setValues(emptyVals);
  };

  const handleFillSamples = () => {
    const sampleVals = {};
    variables.forEach(v => {
      const lower = v.toLowerCase();
      if (lower.includes('lang') || lower.includes('code')) sampleVals[v] = 'TypeScript';
      else if (lower.includes('topic') || lower.includes('subject')) sampleVals[v] = 'Next-gen distributed databases';
      else if (lower.includes('tone')) sampleVals[v] = 'concise, technical and authoritative';
      else if (lower.includes('format')) sampleVals[v] = 'Markdown with executive summary';
      else if (lower.includes('role')) sampleVals[v] = 'Principal Software Architect';
      else sampleVals[v] = `[Sample for ${v}]`;
    });
    setValues(sampleVals);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(assembledPrompt);
    setCopied(true);
    if (onCopyAssembled) onCopyAssembled(assembledPrompt);
    if (toast) toast('Assembled prompt copied to clipboard!', 'lime');
    if (prompt?.id && logRecentItem) {
      logRecentItem({ id: prompt.id, type: 'prompt', title: prompt.title, action: 'assembled' });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLaunchAI = (runnerId) => {
    const runner = AI_RUNNERS.find(r => r.id === runnerId) || AI_RUNNERS[0];
    navigator.clipboard.writeText(assembledPrompt);
    
    if (toast) {
      toast(`Copied assembled prompt! Opening ${runner.name}...`, 'cyan');
    }
    
    const targetUrl = runner.url(assembledPrompt);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  // Determine if a variable should render as textarea
  const isMultilineVar = (name) => {
    const lower = name.toLowerCase();
    return lower.includes('code') || 
           lower.includes('text') || 
           lower.includes('context') || 
           lower.includes('prompt') || 
           lower.includes('body') || 
           lower.includes('input') || 
           lower.includes('data');
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
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
          width: '920px',
          maxWidth: '96vw',
          height: '84vh',
          maxHeight: '740px',
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
        {/* Modal Header */}
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
              background: 'rgba(232, 255, 31, 0.1)',
              border: '1px solid rgba(232, 255, 31, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              flexShrink: 0
            }}>
              <Play size={14} fill="currentColor" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'Geist, sans-serif' }}>
                  Prompt Variable Runner
                </span>
                <span style={{
                  fontSize: 10.5,
                  padding: '1px 7px',
                  borderRadius: 4,
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: 'var(--text-secondary)',
                  fontFamily: 'Geist Mono, monospace',
                  fontWeight: 600
                }}>
                  {variables.length} variable{variables.length === 1 ? '' : 's'}
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px' }}>
                {promptTitle}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {variables.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleFillSamples}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 6,
                    padding: '4px 9px',
                    fontSize: 11,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Auto-fill sample values for testing"
                >
                  <Sparkles size={11} style={{ color: 'var(--accent)' }} />
                  <span>Sample Data</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAll}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 6,
                    padding: '4px 9px',
                    fontSize: 11,
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Clear all variable fields"
                >
                  <RotateCcw size={11} />
                  <span>Clear</span>
                </button>
              </>
            )}

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
        </div>

        {/* Modal Body: Two-Column Workbench Layout */}
        <div style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: variables.length > 0 ? '360px 1fr' : '1fr',
          minHeight: 0,
          overflow: 'hidden'
        }}>
          {/* Left Column: Variable Inputs */}
          {variables.length > 0 ? (
            <div style={{
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              background: '#0f1218',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              padding: '16px'
            }}>
              <div style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontFamily: 'Geist Mono, monospace',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sliders size={12} /> Parameters
                </span>
                <span>{Object.values(values).filter(Boolean).length} / {variables.length} filled</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {variables.map(v => {
                  const multiline = isMultilineVar(v);
                  const val = values[v] || '';
                  return (
                    <div key={v} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <label style={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: val ? 'var(--accent)' : 'var(--text-secondary)',
                          fontFamily: 'Geist Mono, monospace',
                          letterSpacing: 0.2
                        }}>
                          {`{{${v}}}`}
                        </label>
                        {val && (
                          <button
                            type="button"
                            onClick={() => handleValueChange(v, '')}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-tertiary)',
                              fontSize: 10,
                              cursor: 'pointer',
                              padding: '1px 4px'
                            }}
                          >
                            Reset
                          </button>
                        )}
                      </div>

                      {multiline ? (
                        <textarea
                          rows={3}
                          value={val}
                          onChange={e => handleValueChange(v, e.target.value)}
                          placeholder={`Enter ${v}...`}
                          style={{
                            width: '100%',
                            background: 'rgba(0, 0, 0, 0.55)',
                            border: val ? '1px solid rgba(232, 255, 31, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            padding: '8px 10px',
                            color: '#fff',
                            fontSize: 12,
                            fontFamily: 'Geist Mono, monospace',
                            lineHeight: 1.5,
                            outline: 'none',
                            resize: 'vertical',
                            transition: 'border-color 0.15s ease'
                          }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={e => handleValueChange(v, e.target.value)}
                          placeholder={`Enter ${v}...`}
                          style={{
                            width: '100%',
                            background: 'rgba(0, 0, 0, 0.55)',
                            border: val ? '1px solid rgba(232, 255, 31, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: 8,
                            padding: '7px 10px',
                            color: '#fff',
                            fontSize: 12,
                            fontFamily: 'Geist Mono, monospace',
                            outline: 'none',
                            transition: 'border-color 0.15s ease'
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{
              padding: '14px 16px',
              background: 'rgba(232, 255, 31, 0.04)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              fontSize: 12,
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>💡 This prompt has no dynamic variable placeholders (like <code>{'{{variable}}'}</code>). You can inspect and test the full text below.</span>
            </div>
          )}

          {/* Right Column: Live Assembled Prompt Preview */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            background: '#0a0b0f'
          }}>
            {/* Preview Toolbar */}
            <div style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              flexShrink: 0
            }}>
              <div style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--text-tertiary)',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                fontFamily: 'Geist Mono, monospace'
              }}>
                Live Assembled Output
              </div>

              {/* Character & Token Counters */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 11,
                color: 'var(--text-tertiary)',
                fontFamily: 'Geist Mono, monospace'
              }}>
                <span>{wordCount} words</span>
                <span>•</span>
                <span>{charCount} chars</span>
                <span>•</span>
                <span style={{ color: 'var(--accent)' }}>~{tokenEstimate} tokens</span>
              </div>
            </div>

            {/* Assembled Content Box */}
            <div style={{
              flex: 1,
              padding: '16px 20px',
              overflowY: 'auto',
              fontFamily: 'Geist Mono, monospace',
              fontSize: 12.5,
              lineHeight: 1.65,
              color: '#f1f3f7',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: 'transparent'
            }}>
              {assembledPrompt}
            </div>
          </div>
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
          {/* Quick AI Runner Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600, fontFamily: 'Geist Mono, monospace' }}>
              Launch in:
            </span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {AI_RUNNERS.slice(0, 3).map(runner => (
                <button
                  key={runner.id}
                  type="button"
                  onClick={() => handleLaunchAI(runner.id)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-secondary)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'background 0.15s ease'
                  }}
                  title={`Copy assembled text and launch ${runner.name}`}
                >
                  <span>{runner.name}</span>
                  <ExternalLink size={10} style={{ opacity: 0.7 }} />
                </button>
              ))}
            </div>
          </div>

          {/* Primary Action: Copy Assembled Prompt */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-secondary)',
                borderRadius: 8,
                padding: '7px 14px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                background: copied ? 'rgba(52, 211, 153, 0.2)' : 'var(--accent)',
                color: copied ? '#34d399' : '#0b0b0c',
                border: '1px solid ' + (copied ? '#34d399' : 'transparent'),
                borderRadius: 8,
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: 'Geist, sans-serif',
                boxShadow: copied ? 'none' : '0 2px 10px rgba(232, 255, 31, 0.25)'
              }}
            >
              {copied ? (
                <>
                  <Check size={13} strokeWidth={2.5} />
                  <span>Copied Assembled Prompt!</span>
                </>
              ) : (
                <>
                  <Copy size={13} />
                  <span>Copy Assembled Prompt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

