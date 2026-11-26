import { useState } from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  RefreshCw, 
  X, 
  Copy, 
  Link2, 
  Star, 
  Pin, 
  GitFork, 
  AlertCircle, 
  Scale, 
  GitBranch, 
  Check,
  FileText,
  Edit2,
  Tag,
  BookOpen,
  Trash2
} from 'lucide-react';
import { REPO_STATUSES, PRIMARY_REPO_STATUSES, LANGUAGE_COLORS, BENTO_CARD_COLORS, getDeepCardColor } from '../../constants/repositoryConstants.js';
import { generateSmartRepoDescription } from '../../services/githubService.js';
import { useApp } from '../../context/AppContext.jsx';

export default function RepositoryDetail({
  repo,
  subCategories = [],
  onClose,
  onUpdate,
  onDelete,
  onRefresh,
  onToggleFavorite,
  onTogglePin,
  requestConfirm
}) {
  const { prompts = [], setActiveId, setActiveNav, openReadme } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState(null);
  const [notes, setNotes] = useState(repo.personalNotes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const getEffectiveDesc = (r) => (r.description && r.description !== 'No description provided.') ? r.description : generateSmartRepoDescription(r.owner, r.name, r.topics || r.tags);
  const [description, setDescription] = useState(getEffectiveDesc(repo));
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [detailTitleDraft, setDetailTitleDraft] = useState(repo.customTitle || repo.name);
  const [newTag, setNewTag] = useState('');
  const [copiedClone, setCopiedClone] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  // Adjust state when repo prop changes (React recommended pattern without effect)
  const [prevRepo, setPrevRepo] = useState(repo);
  if (prevRepo.id !== repo.id || prevRepo.description !== repo.description || prevRepo.personalNotes !== repo.personalNotes || prevRepo.customTitle !== repo.customTitle) {
    setPrevRepo(repo);
    setNotes(repo.personalNotes || '');
    setDescription(getEffectiveDesc(repo));
    setDetailTitleDraft(repo.customTitle || repo.name);
    setIsEditingDesc(false);
    setIsEditingNotes(false);
  }

  const currentStatus = repo.status || 'inbox';
  const statusConfig = REPO_STATUSES[currentStatus] || REPO_STATUSES.inbox;
  const statusOptions = PRIMARY_REPO_STATUSES.some(s => s.id === currentStatus)
    ? PRIMARY_REPO_STATUSES
    : [...PRIMARY_REPO_STATUSES, { id: currentStatus, label: REPO_STATUSES[currentStatus]?.label || currentStatus }];
  const langColor = LANGUAGE_COLORS[repo.primaryLanguage] || LANGUAGE_COLORS.Unknown;

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg(null);
    try {
      await onRefresh(repo.id);
      setRefreshMsg({ type: 'success', text: 'Synced with GitHub' });
      setTimeout(() => setRefreshMsg(null), 3000);
    } catch (err) {
      setRefreshMsg({ type: 'error', text: err.message || 'Sync failed' });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveDescription = () => {
    onUpdate(repo.id, { description: description.trim() });
    setIsEditingDesc(false);
  };

  const handleSaveNotes = () => {
    onUpdate(repo.id, { personalNotes: notes });
    setIsEditingNotes(false);
  };

  const handleAddTag = (e) => {
    e.preventDefault();
    const tag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (!tag) return;
    const currentTags = repo.tags || [];
    if (!currentTags.includes(tag)) {
      onUpdate(repo.id, { tags: [...currentTags, tag] });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove) => {
    const currentTags = repo.tags || [];
    onUpdate(repo.id, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  const handleCopyClone = () => {
    navigator.clipboard.writeText(`git clone ${repo.canonicalUrl}.git`).then(() => {
      setCopiedClone(true);
      setTimeout(() => setCopiedClone(false), 1800);
    });
  };

  const handleCopyMd = () => {
    navigator.clipboard.writeText(`[${repo.fullName}](${repo.canonicalUrl})`).then(() => {
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 1800);
    });
  };

  const handleDelete = () => {
    requestConfirm({
      title: 'REMOVE REPOSITORY',
      message: `Remove "${repo.fullName}" from your Hub? Your personal notes and saved metadata will be deleted.`,
      onConfirm: () => {
        onDelete(repo.id);
        onClose();
      }
    });
  };

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
        animation: 'slideInRight 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
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
        {/* Repo Icon & Full Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
          <FolderGit2 size={18} style={{ color: repo.color || 'var(--color-blue)', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text-tertiary)', fontWeight: 500, fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>
                {repo.owner} /
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {repo.customTitle || repo.name}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1, fontFamily: 'Geist Mono, monospace' }}>
              <a 
                href={repo.canonicalUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: repo.color || 'var(--color-blue)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3 }}
              >
                <span>GitHub</span>
                <ExternalLink size={9} />
              </a>
              {repo.lastSyncedAt && (
                <>
                  <span>•</span>
                  <span>Synced {new Date(repo.lastSyncedAt).toLocaleDateString()}</span>
                </>
              )}
              {repo.latestRelease && (
                <>
                  <span>•</span>
                  <span style={{ color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Tag size={9} />
                    {repo.latestRelease}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Micro-Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {/* README Drawer Trigger */}
          <button
            onClick={() => openReadme(repo)}
            style={{
              background: 'var(--btn-subtle-bg)',
              border: '1px solid var(--btn-subtle-border)',
              borderRadius: 10,
              padding: '5px 9px',
              fontSize: 11,
              fontFamily: 'Geist Mono, monospace',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Preview README.md in app"
          >
            <BookOpen size={11} />
            <span>README</span>
          </button>

          {/* Refresh / Sync */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'var(--btn-subtle-bg)',
              border: '1px solid var(--btn-subtle-border)',
              borderRadius: 10,
              padding: '5px 9px',
              fontSize: 11,
              fontFamily: 'Geist Mono, monospace',
              color: refreshing ? 'var(--text-tertiary)' : 'var(--text-primary)',
              cursor: refreshing ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Refresh GitHub metadata"
          >
            <RefreshCw size={11} className={refreshing ? 'spin' : ''} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Copy Git Clone */}
          <button
            onClick={handleCopyClone}
            title={copiedClone ? 'Cloned to clipboard!' : 'git clone repository'}
            className={copiedClone ? 'copy-feedback-animated' : ''}
            style={{
              background: copiedClone ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              color: copiedClone ? '#34d399' : 'rgba(255, 255, 255, 0.85)',
              border: '1px solid ' + (copiedClone ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              padding: '5px 9px',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Geist Mono, monospace',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {copiedClone ? <><Check size={11} strokeWidth={2.5} /> Cloned</> : <><Copy size={11} /> clone</>}
          </button>

          {/* Copy Markdown Link */}
          <button
            onClick={handleCopyMd}
            title={copiedMd ? 'Markdown link copied!' : 'Copy markdown link'}
            className={copiedMd ? 'copy-feedback-animated' : ''}
            style={{
              background: copiedMd ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              color: copiedMd ? '#34d399' : 'rgba(255, 255, 255, 0.85)',
              border: '1px solid ' + (copiedMd ? 'rgba(52, 211, 153, 0.4)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              padding: '5px 9px',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Geist Mono, monospace',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            {copiedMd ? <><Check size={11} strokeWidth={2.5} /> Link</> : <><Link2 size={11} /> link</>}
          </button>

          {/* Favorite */}
          <button
            onClick={() => onToggleFavorite(repo.id)}
            title={repo.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            style={{
              background: repo.isFavorite ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: repo.isFavorite ? '#eab308' : 'rgba(255, 255, 255, 0.7)',
              border: '1px solid ' + (repo.isFavorite ? 'rgba(234, 179, 8, 0.4)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Star size={13} fill={repo.isFavorite ? '#eab308' : 'none'} color={repo.isFavorite ? '#eab308' : 'currentColor'} />
          </button>

          {/* Pin */}
          <button
            onClick={() => onTogglePin(repo.id)}
            title={repo.isPinned ? 'Unpin repository' : 'Pin repository'}
            style={{
              background: repo.isPinned ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              color: repo.isPinned ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.7)',
              border: '1px solid ' + (repo.isPinned ? 'var(--color-cyan)' : 'rgba(255, 255, 255, 0.12)'),
              borderRadius: 10,
              width: 30,
              height: 30,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Pin size={13} fill={repo.isPinned ? 'currentColor' : 'none'} />
          </button>

          {/* Delete */}
          <button
            onClick={handleDelete}
            title="Delete repository"
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

      {/* Sync Notification Banner */}
      {refreshMsg && (
        <div style={{
          padding: '8px 16px',
          background: refreshMsg.type === 'success' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: refreshMsg.type === 'success' ? '#34d399' : '#f87171',
          fontSize: 11,
          fontWeight: 600,
          fontFamily: 'Geist Mono, monospace',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {refreshMsg.text}
        </div>
      )}

      {/* Scrollable Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* Repository Title Customization */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="bento-cap">Repository Display Title</span>
            {repo.customTitle && (
              <button
                type="button"
                onClick={() => {
                  onUpdate(repo.id, { customTitle: undefined });
                  setDetailTitleDraft(repo.name);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: 10.5,
                  cursor: 'pointer',
                  fontFamily: 'Geist Mono, monospace',
                  padding: 0
                }}
                title="Reset to original GitHub repository name"
              >
                Reset to default
              </button>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="text"
              value={detailTitleDraft}
              onChange={e => setDetailTitleDraft(e.target.value)}
              onBlur={() => {
                const trimmed = detailTitleDraft.trim();
                if (trimmed !== (repo.customTitle || repo.name)) {
                  onUpdate(repo.id, { customTitle: trimmed || undefined });
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const trimmed = detailTitleDraft.trim();
                  onUpdate(repo.id, { customTitle: trimmed || undefined });
                  e.currentTarget.blur();
                }
              }}
              placeholder={repo.name}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
                padding: '8px 12px',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'Geist, sans-serif',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* 1. Card Accent Color Picker */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="bento-cap">Card Accent Color</span>
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontFamily: 'Geist Mono, monospace' }}>
              {BENTO_CARD_COLORS.find(c => c.color === (repo.color || '') || (repo.color && c.color === getDeepCardColor(repo.color)))?.label || 'Obsidian'}
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
              const isSelected = (repo.color || '') === c.color || (repo.color && getDeepCardColor(repo.color) === c.color);
              return (
                <button
                  key={c.id}
                  onClick={() => onUpdate(repo.id, { color: c.color })}
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

        {/* 2. Sub-Category & Language Inline Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginBottom: 18,
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 16,
          padding: '10px 14px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="bento-cap">Sub-Category</span>
            <select
              value={repo.subCategory || repo.category || (Array.isArray(repo.collections) && repo.collections[0]) || ''}
              onChange={e => onUpdate(repo.id, {
                subCategory: e.target.value,
                category: e.target.value,
                collections: e.target.value ? [e.target.value] : []
              })}
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
              <option value="" style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>None (Uncategorized)</option>
              {subCategories.map(cat => (
                <option key={cat} value={cat} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="bento-cap">Status</span>
              <select
                value={currentStatus}
                onChange={e => onUpdate(repo.id, { status: e.target.value })}
                style={{
                  background: statusConfig.bg,
                  color: statusConfig.color,
                  border: `1px solid ${statusConfig.border}`,
                  borderRadius: 10,
                  padding: '3px 8px',
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none',
                  height: 'auto',
                  width: 'auto'
                }}
              >
                {statusOptions.map(st => (
                  <option key={st.id} value={st.id} style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>
                    {REPO_STATUSES[st.id]?.icon || '•'} {st.label}
                  </option>
                ))}
              </select>
            </div>

            {repo.primaryLanguage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'Geist Mono, monospace', fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: langColor, flexShrink: 0 }} />
                <span>{repo.primaryLanguage}</span>
              </div>
            )}
          </div>
        </div>

        {/* 3. Clean Editable Description (Unified Single Block) */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="bento-cap">Description</span>
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
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleSaveDescription();
                  }
                }}
                placeholder="Write a clear, short description for what this repository does..."
                style={{
                  background: 'rgba(0, 0, 0, 0.55)',
                  border: '1px solid var(--accent)',
                  borderRadius: 14,
                  padding: '10px 12px',
                  fontSize: 12.5,
                  color: '#fff',
                  lineHeight: 1.5,
                  resize: 'vertical',
                  fontFamily: 'Geist, sans-serif'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => {
                    setDescription(repo.description || '');
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
                  Save Description
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setIsEditingDesc(true)}
              className="bento-recess"
              style={{
                padding: '12px 14px',
                borderRadius: 16,
                cursor: 'pointer',
                fontSize: 12.5,
                lineHeight: 1.55,
                color: 'var(--text-secondary)',
                fontStyle: 'normal'
              }}
              title="Click to edit description"
            >
              {getEffectiveDesc(repo)}
            </div>
          )}
        </div>

        {/* 4. Sleek Bento Metrics Strip (Single row, no clutter) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 14px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 16,
          marginBottom: 18,
          fontFamily: 'Geist Mono, monospace',
          fontSize: 11
        }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#eab308', fontWeight: 700 }} title="GitHub Stars">
            <Star size={13} fill="#eab308" color="#eab308" /> {repo.stars?.toLocaleString() || 0}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }} title="Forks">
            <GitFork size={12} /> {repo.forks?.toLocaleString() || 0}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }} title="Open Issues">
            <AlertCircle size={12} /> {repo.openIssues?.toLocaleString() || 0}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }} title="License">
            <Scale size={12} /> {repo.license || 'MIT'}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }} title="Default Branch">
            <GitBranch size={12} /> {repo.defaultBranch || 'main'}
          </div>
        </div>

        {/* 5. Personal Evaluation Notes (Markdown) */}
        <div style={{ marginBottom: 18 }}>
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
                placeholder="Markdown notes: architectural decisions, setup commands, evaluation findings..."
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
                    setNotes(repo.personalNotes || '');
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
                  style={{ background: 'var(--accent)', color: '#0b0b0c', border: 'none', borderRadius: 10, padding: '4px 12px', fontSize: 10.5, fontWeight: 700, cursor: 'pointer' }}
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
                minHeight: '60px',
                fontSize: 12,
                color: notes ? 'var(--text-primary)' : 'var(--text-tertiary)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.6,
                cursor: 'pointer',
                fontFamily: notes ? 'Geist Mono, monospace' : 'inherit',
                fontStyle: notes ? 'normal' : 'italic'
              }}
              title="Click to edit notes"
            >
              {notes || 'No notes added yet. Click to write key takeaways or setup commands...'}
            </div>
          )}
        </div>

        {/* 6. Topics & Tags */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Tag size={12} style={{ color: 'var(--text-tertiary)' }} />
            <span className="bento-cap">Tags & Topics</span>
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
            {(repo.tags || []).map(t => (
              <span
                key={t}
                className="chip"
                style={{
                  fontSize: 10.5,
                  padding: '2px 8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'var(--text-secondary)'
                }}
              >
                <span>#{t}</span>
                <button
                  onClick={() => handleRemoveTag(t)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0, marginLeft: 4, display: 'inline-flex' }}
                >
                  ×
                </button>
              </span>
            ))}
            {(repo.topics || []).map(t => (
              <span
                key={t}
                className="chip"
                style={{
                  fontSize: 10.5,
                  padding: '2px 8px',
                  background: 'rgba(112, 136, 255, 0.08)',
                  border: '1px solid rgba(112, 136, 255, 0.2)',
                  color: 'var(--color-blue)'
                }}
              >
                #{t}
              </span>
            ))}
            {(!repo.tags || repo.tags.length === 0) && (!repo.topics || repo.topics.length === 0) && (
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No tags added.
              </span>
            )}
          </div>

          <form onSubmit={handleAddTag} style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              placeholder="Add custom tag and press Enter..."
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 12,
                padding: '6px 10px',
                fontSize: 11,
                color: 'var(--text-primary)'
              }}
            />
            <button
              type="submit"
              disabled={!newTag.trim()}
              style={{
                background: newTag.trim() ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: 12,
                padding: '0 12px',
                fontSize: 11,
                fontWeight: 600,
                color: newTag.trim() ? '#fff' : 'var(--text-tertiary)',
                cursor: newTag.trim() ? 'pointer' : 'default'
              }}
            >
              Add
            </button>
          </form>
        </div>

        {/* 7. Linked AI Prompts */}
        {(() => {
          const linkedPrompts = (prompts || []).filter(p => 
            (p.linkedRepoIds || []).includes(repo.id) || (p.linkedRepoIds || []).includes(repo.fullName)
          );
          if (linkedPrompts.length === 0) return null;
          return (
            <div style={{ marginBottom: 18 }}>
              <span className="bento-cap" style={{ display: 'block', marginBottom: 8 }}>
                Linked AI Prompts ({linkedPrompts.length})
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {linkedPrompts.map(pr => (
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
                      <FileText size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pr.title}
                      </span>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                      <span>Open</span>
                      <ExternalLink size={9} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

      </div>
    </aside>
  );
}
