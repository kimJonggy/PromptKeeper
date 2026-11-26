import { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  Copy, 
  Check, 
  BookOpen, 
  RefreshCw, 
  Tag, 
  AlertCircle 
} from 'lucide-react';
import { fetchRepositoryReadme } from '../../services/githubService.js';
import { useApp } from '../../context/AppContext.jsx';

/**
 * Lightweight, safe parser for common GitHub README markdown constructs
 * (Headers, Code blocks, Lists, Links, Bold, Italic, Images)
 */
function SimpleMarkdownRenderer({ content }) {
  if (!content) return null;

  // Split lines
  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockBuffer = [];
  let codeBlockLang = '';

  lines.forEach((line, idx) => {
    // Code block boundary
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        elements.push(
          <div key={`code-${idx}`} style={{
            background: 'rgba(0, 0, 0, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 8,
            padding: '12px 16px',
            margin: '10px 0',
            overflowX: 'auto',
            fontFamily: 'Geist Mono, monospace',
            fontSize: 12,
            color: '#a9b2ff',
            lineHeight: 1.55
          }}>
            {codeBlockLang && (
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 700 }}>
                {codeBlockLang}
              </div>
            )}
            <pre style={{ margin: 0 }}>{codeBlockBuffer.join('\n')}</pre>
          </div>
        );
        codeBlockBuffer = [];
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        // Start of code block
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      return;
    }

    const trimmed = line.trim();

    // Headers
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={idx} style={{ fontSize: 20, fontWeight: 800, color: '#fff', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: 6, margin: '18px 0 10px' }}>{trimmed.slice(2)}</h1>);
      return;
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={idx} style={{ fontSize: 17, fontWeight: 700, color: 'var(--accent)', margin: '16px 0 8px' }}>{trimmed.slice(3)}</h2>);
      return;
    }
    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={idx} style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '14px 0 6px' }}>{trimmed.slice(4)}</h3>);
      return;
    }

    // Unordered lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      elements.push(
        <div key={idx} style={{ display: 'flex', gap: 8, margin: '4px 0 4px 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--accent)' }}>•</span>
          <span>{trimmed.slice(2)}</span>
        </div>
      );
      return;
    }

    // Empty lines
    if (!trimmed) {
      elements.push(<div key={idx} style={{ height: 8 }} />);
      return;
    }

    // Paragraph
    elements.push(
      <p key={idx} style={{ margin: '4px 0', fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)' }}>
        {line}
      </p>
    );
  });

  return <div>{elements}</div>;
}

export default function RepoReadmeDrawerModal({
  isOpen,
  onClose,
  repo
}) {
  const { toast } = useApp() || {};
  const [readmeText, setReadmeText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (isOpen && repo) {
      setLoading(true);
      setError('');
      setReadmeText('');

      fetchRepositoryReadme(repo.owner, repo.name)
        .then(text => {
          if (isMounted) {
            setReadmeText(text);
            setLoading(false);
          }
        })
        .catch(err => {
          if (isMounted) {
            setError(err.message || 'Failed to fetch README');
            setLoading(false);
          }
        });
    }
    return () => { isMounted = false; };
  }, [isOpen, repo]);

  if (!isOpen || !repo) return null;

  const handleCopy = () => {
    if (!readmeText) return;
    navigator.clipboard.writeText(readmeText);
    setCopied(true);
    if (toast) toast('Raw README markdown copied to clipboard!', 'lime');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    fetchRepositoryReadme(repo.owner, repo.name)
      .then(text => {
        setReadmeText(text);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch README');
        setLoading(false);
      });
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        zIndex: 550,
        display: 'flex',
        justifyContent: 'flex-end',
        overflow: 'hidden'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '720px',
          maxWidth: '100vw',
          height: '100%',
          background: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drawer Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(232, 255, 31, 0.1)',
              border: '1px solid rgba(232, 255, 31, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
              flexShrink: 0
            }}>
              <BookOpen size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Geist, sans-serif' }}>
                  {repo.owner} / {repo.name}
                </span>
                {repo.latestRelease && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#38bdf8',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    borderRadius: 10,
                    padding: '1px 7px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontFamily: 'Geist Mono, monospace'
                  }}>
                    <Tag size={9} />
                    <span>{repo.latestRelease}</span>
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
                README.md Live Drawer
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Copy Raw Markdown */}
            {readmeText && (
              <button
                type="button"
                onClick={handleCopy}
                className={copied ? 'copy-feedback-animated' : ''}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5
                }}
                title="Copy raw markdown text"
              >
                {copied ? <Check size={12} strokeWidth={2.5} /> : <Copy size={12} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}

            {/* Open on GitHub */}
            <a
              href={`${repo.canonicalUrl}#readme`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 6,
                padding: '5px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title="Open README on GitHub"
            >
              <span>GitHub</span>
              <ExternalLink size={11} />
            </a>

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
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div style={{
          flex: 1,
          padding: '20px 24px',
          overflowY: 'auto',
          background: 'transparent',
          color: '#e4e7ee',
          fontFamily: 'Geist, sans-serif'
        }}>
          {loading && (
            <div style={{ padding: '60px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <RefreshCw size={24} className="spin-slow" style={{ color: 'var(--accent)' }} />
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                Loading README from GitHub...
              </div>
            </div>
          )}

          {!loading && error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 10,
              padding: '20px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 10
            }}>
              <AlertCircle size={24} style={{ color: '#ef4444' }} />
              <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                {error}
              </div>
              <button
                onClick={handleRetry}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          )}

          {!loading && !error && readmeText && (
            <SimpleMarkdownRenderer content={readmeText} />
          )}
        </div>
      </div>
    </div>
  );
}

