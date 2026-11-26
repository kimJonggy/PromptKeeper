import { useState } from 'react';
import { 
  FolderGit2, 
  X, 
  AlertCircle, 
  AlertTriangle, 
  Star, 
  GitFork, 
  Scale,
  Key,
  Check,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Edit2
} from 'lucide-react';
import { 
  normalizeGitHubUrl, 
  fetchRepoMetadata, 
  getGitHubToken, 
  setGitHubToken 
} from '../../services/githubService.js';
import { 
  REPO_STATUS_LIST, 
  REPO_STATUSES,
  LANGUAGE_COLORS,
  BENTO_CARD_COLORS 
} from '../../constants/repositoryConstants.js';

export default function AddRepositoryModal({ isOpen, onClose, onAdd, existingRepos = [], subCategories = [] }) {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [status, setStatus] = useState('inbox');
  const [personalNotes, setPersonalNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // GitHub Personal Access Token state
  const storedToken = getGitHubToken();
  const [hasToken, setHasToken] = useState(Boolean(storedToken));
  const [showTokenPanel, setShowTokenPanel] = useState(false);
  const [tokenInput, setTokenInput] = useState(storedToken);
  const [tokenSavedMsg, setTokenSavedMsg] = useState(false);

  // Check duplicate
  const duplicateRepo = preview
    ? existingRepos.find(r => r.fullName.toLowerCase() === preview.fullName.toLowerCase())
    : null;

  const resetForm = () => {
    setUrlInput('');
    setLoading(false);
    setError(null);
    setPreview(null);
    setDescription('');
    setColor('');
    setSubCategory('');
    setStatus('inbox');
    setPersonalNotes('');
    setTagsInput('');
    setIsFavorite(false);
    setShowTokenPanel(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFetch = async (targetUrl = urlInput, overrideToken = null) => {
    setError(null);
    const parsed = normalizeGitHubUrl(targetUrl);
    if (!parsed) {
      setError('Please enter a valid GitHub repository URL (e.g. https://github.com/owner/repo or owner/repo).');
      return;
    }

    setLoading(true);
    try {
      const meta = await fetchRepoMetadata(parsed.owner, parsed.name, overrideToken ?? getGitHubToken());
      setPreview(meta);
      setDescription(meta.description || '');
      setError(null);

      // Pre-populate tags from top topics if available
      if (meta.topics && meta.topics.length > 0 && !tagsInput) {
        setTagsInput(meta.topics.slice(0, 4).join(', '));
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch repository metadata from GitHub.');
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  // Fallback: Save with parsed basic info without waiting for GitHub API
  const handleSaveBasicInfo = () => {
    const parsed = normalizeGitHubUrl(urlInput);
    if (!parsed) return;

    setPreview({
      githubId: null,
      owner: parsed.owner,
      name: parsed.name,
      fullName: parsed.fullName,
      canonicalUrl: parsed.canonicalUrl,
      description: '',
      primaryLanguage: 'Unknown',
      topics: [],
      stars: 0,
      forks: 0,
      openIssues: 0,
      license: null,
      defaultBranch: 'main',
      pushedAt: null,
      createdAt: null,
      rateLimited: true
    });
    setDescription('');
    setError(null);
  };

  const handleSaveToken = () => {
    setGitHubToken(tokenInput);
    setHasToken(Boolean(tokenInput.trim()));
    setTokenSavedMsg(true);
    setTimeout(() => setTokenSavedMsg(false), 2500);

    // If an URL is already entered, retry fetch with new token
    if (urlInput.trim()) {
      handleFetch(urlInput, tokenInput);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!preview) return;

    if (duplicateRepo) {
      setError(`Repository "${preview.fullName}" is already saved in your Hub.`);
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().toLowerCase().replace(/^#/, ''))
      .filter(Boolean);

    const result = onAdd({
      ...preview,
      description: description.trim() || preview.description || '',
      color,
      subCategory: subCategory.trim(),
      category: subCategory.trim(),
      collections: subCategory.trim() ? [subCategory.trim()] : [],
      status,
      personalNotes,
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

  const parsedUrl = normalizeGitHubUrl(urlInput);
  const langColor = preview?.primaryLanguage ? (LANGUAGE_COLORS[preview.primaryLanguage] || '#888') : null;

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
          maxWidth: 580, 
          width: '100%', 
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
          background: 'rgba(255, 255, 255, 0.02)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FolderGit2 size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: '#fff', fontFamily: 'Geist, sans-serif' }}>
              Add GitHub Repository
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => setShowTokenPanel(p => !p)}
              style={{
                background: hasToken ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                border: hasToken ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid rgba(255, 255, 255, 0.12)',
                color: hasToken ? '#34d399' : 'var(--text-tertiary)',
                borderRadius: 12,
                padding: '3px 10px',
                fontSize: 10.5,
                fontWeight: 600,
                fontFamily: 'Geist Mono, monospace',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5
              }}
              title={hasToken ? 'GitHub PAT active (5,000 req/hr)' : 'Configure GitHub PAT to get 5,000 req/hr'}
            >
              <Key size={11} />
              <span>{hasToken ? 'PAT Active (5k/hr)' : 'Add Token (5k/hr)'}</span>
            </button>
            <button 
              onClick={handleClose}
              aria-label="Close modal"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center' }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Token Configuration Drawer / Panel */}
        {showTokenPanel && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '14px 24px',
            fontSize: 11.5
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={12} style={{ color: 'var(--accent)' }} />
                <span>GitHub Personal Access Token</span>
              </span>
              <a
                href="https://github.com/settings/tokens/new?description=PromptKeeper&scopes="
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11 }}
              >
                <span>Generate token</span>
                <ExternalLink size={10} />
              </a>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="ghp_... (no scopes needed for public repos)"
                style={{
                  flex: 1,
                  background: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 12,
                  padding: '7px 12px',
                  color: '#fff',
                  fontSize: 11,
                  fontFamily: 'Geist Mono, monospace'
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={handleSaveToken}
                style={{
                  background: 'var(--accent)',
                  color: '#0b0b0c',
                  fontWeight: 700,
                  fontSize: 11,
                  padding: '0 14px',
                  borderRadius: 12,
                  whiteSpace: 'nowrap'
                }}
              >
                {tokenSavedMsg ? <><Check size={11} strokeWidth={2.5} /> Saved</> : 'Save & Apply'}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ overflowY: 'auto', padding: '22px 24px', flex: 1 }}>
          {/* URL Input */}
          <div style={{ marginBottom: 18 }}>
            <label className="bento-cap" style={{ display: 'block', marginBottom: 8 }}>
              Repository URL or Identifier
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                autoFocus
                type="text"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFetch();
                  }
                }}
                placeholder="https://github.com/owner/repo or owner/repo"
                style={{
                  flex: 1,
                  background: '#000',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  borderRadius: 14,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 12.5,
                  fontFamily: 'Geist Mono, monospace'
                }}
              />
              <button
                type="button"
                className="btn"
                disabled={loading || !urlInput.trim()}
                onClick={() => handleFetch()}
                style={{
                  background: 'var(--accent)',
                  color: '#0b0b0c',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: 14,
                  padding: '0 18px',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: loading || !urlInput.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !urlInput.trim() ? 0.5 : 1
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={13} className="spin" />
                    <span>Fetching...</span>
                  </>
                ) : (
                  <span>Fetch</span>
                )}
              </button>
            </div>
            
            {/* Quick Suggestions */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10.5, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>Try:</span>
              {['facebook/react', 'shadcn-ui/ui', 'torvalds/linux'].map(sample => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setUrlInput(`https://github.com/${sample}`);
                    handleFetch(`https://github.com/${sample}`);
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 10,
                    padding: '2px 8px',
                    fontSize: 10.5,
                    fontFamily: 'Geist Mono, monospace',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Rate Limit or General Error Message Banner */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 14,
              padding: '12px 14px',
              color: '#f87171',
              fontSize: 12,
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{error}</div>
                  
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {parsedUrl && (
                      <button
                        type="button"
                        onClick={handleSaveBasicInfo}
                        style={{
                          background: 'var(--accent)',
                          color: '#0b0b0c',
                          border: 'none',
                          borderRadius: 10,
                          padding: '5px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5
                        }}
                      >
                        <Check size={12} strokeWidth={2.5} />
                        <span>Add with Basic Info</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowTokenPanel(true)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#fff',
                        borderRadius: 10,
                        padding: '5px 10px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                    >
                      <Key size={11} />
                      <span>{hasToken ? 'Update Token' : 'Add Token (5k/hr)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Duplicate Warning */}
          {duplicateRepo && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 14,
              padding: '10px 14px',
              color: '#fbbf24',
              fontSize: 11.5,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0 }} />
              <span>This repository is already in your Hub (Status: <strong>{duplicateRepo.status}</strong>).</span>
            </div>
          )}

          {/* Fetched Repository Section */}
          {preview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
              {/* Repository Header & Vital Stats Strip */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 18,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>{preview.owner} / </span>
                    <span>{preview.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace', marginTop: 4 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#eab308', fontWeight: 600 }}><Star size={11} fill="#eab308" color="#eab308" /> {preview.stars.toLocaleString()}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><GitFork size={11} /> {preview.forks.toLocaleString()}</span>
                    {preview.license && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Scale size={11} /> {preview.license}</span>}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {preview.primaryLanguage && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 9px',
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.06)',
                      color: '#fff',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}>
                      {langColor && <span style={{ width: 6, height: 6, borderRadius: '50%', background: langColor }} />}
                      {preview.primaryLanguage}
                    </span>
                  )}
                  <a
                    href={preview.canonicalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-tertiary)', padding: 4, display: 'inline-flex', alignItems: 'center' }}
                    title="Open on GitHub"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>

              {/* Editable Description (Clean, Single Block) */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="bento-cap">Description</span>
                  <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>Editable</span>
                </div>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Short, clean description of what this repository does..."
                  style={{
                    width: '100%',
                    background: '#000',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 14,
                    padding: '8px 12px',
                    color: '#fff',
                    fontSize: 12,
                    lineHeight: 1.45,
                    resize: 'vertical',
                    fontFamily: 'Geist, sans-serif'
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

              {/* Sub-Category, Status & Favorite Compact Row */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: 14,
                padding: '8px 12px',
                flexWrap: 'wrap'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="bento-cap">Sub-Category:</span>
                  <select
                    value={subCategory}
                    onChange={e => setSubCategory(e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      padding: '4px 8px',
                      fontSize: 11,
                      color: 'var(--accent)',
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontFamily: 'Geist, sans-serif'
                    }}
                  >
                    <option value="" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>None (Uncategorized)</option>
                    {subCategories.map(cat => (
                      <option key={cat} value={cat} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="bento-cap">Status:</span>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      style={{
                        background: 'var(--btn-subtle-bg)',
                        border: '1px solid var(--btn-subtle-border)',
                        borderRadius: 10,
                        padding: '4px 8px',
                        fontSize: 11,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontFamily: 'Geist, sans-serif'
                      }}
                    >
                      {REPO_STATUS_LIST.map(st => (
                        <option key={st.id} value={st.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFavorite(f => !f)}
                    style={{
                      background: isFavorite ? 'var(--accent-muted)' : 'rgba(255, 255, 255, 0.06)',
                      border: isFavorite ? '1px solid var(--accent)' : '1px solid rgba(255, 255, 255, 0.12)',
                      color: isFavorite ? 'var(--accent)' : 'var(--text-tertiary)',
                      borderRadius: 10,
                      padding: '4px 10px',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Star size={12} fill={isFavorite ? 'currentColor' : 'none'} />
                    <span>Favorite</span>
                  </button>
                </div>
              </div>

              {/* Tags (Optional, compact) */}
              <div>
                <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                  Tags (Optional)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  placeholder="e.g. bookmarks, ai-tagging, self-hosted"
                  style={{
                    width: '100%',
                    background: '#000',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 12,
                    padding: '7px 12px',
                    color: '#fff',
                    fontSize: 11.5,
                    fontFamily: 'Geist Mono, monospace'
                  }}
                />
              </div>

              {/* Personal Notes (Optional, compact) */}
              <div>
                <label className="bento-cap" style={{ display: 'block', marginBottom: 6 }}>
                  Personal Evaluation Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={personalNotes}
                  onChange={e => setPersonalNotes(e.target.value)}
                  placeholder="Key architectural takeaways, potential use cases..."
                  style={{
                    width: '100%',
                    background: '#000',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 12,
                    padding: '7px 12px',
                    color: '#fff',
                    fontSize: 11.5,
                    lineHeight: 1.4,
                    resize: 'vertical',
                    fontFamily: 'Geist, sans-serif'
                  }}
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              className="btn"
              onClick={handleClose}
              style={{ 
                background: 'rgba(255, 255, 255, 0.04)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                color: 'var(--text-secondary)', 
                padding: '7px 16px', 
                fontSize: 12,
                borderRadius: 12
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={!preview || !!duplicateRepo || loading}
              style={{
                background: !preview || !!duplicateRepo ? 'rgba(255, 255, 255, 0.06)' : 'var(--accent)',
                color: !preview || !!duplicateRepo ? 'var(--text-tertiary)' : '#0b0b0c',
                fontWeight: 700,
                fontSize: 12,
                borderRadius: 12,
                padding: '7px 20px',
                cursor: !preview || !!duplicateRepo ? 'not-allowed' : 'pointer'
              }}
            >
              Add to Hub
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
