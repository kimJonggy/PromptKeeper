import { useState, useRef, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Star, 
  Pin, 
  GitFork, 
  Clock, 
  Terminal, 
  Check, 
  ExternalLink, 
  FileText,
  Inbox,
  Compass,
  BookOpen,
  FlaskConical,
  Zap,
  CheckCircle2,
  Archive,
  Tag,
  Edit2,
  X
} from 'lucide-react';
import { REPO_STATUSES, PRIMARY_REPO_STATUSES, LANGUAGE_COLORS, getDeepCardColor } from '../../constants/repositoryConstants.js';
import { generateSmartRepoDescription } from '../../services/githubService.js';
import { useApp } from '../../context/AppContext.jsx';

const STATUS_ICON_MAP = {
  inbox: Inbox,
  to_explore: Compass,
  researching: BookOpen,
  testing: FlaskConical,
  using: Zap,
  completed: CheckCircle2,
  archived: Archive
};

function formatCompactNumber(num) {
  if (typeof num !== 'number') return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

function formatRelativeTime(dateString) {
  if (!dateString) return 'never';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 86400 * 30) return `${Math.floor(diffSec / 86400)}d ago`;
  return `${Math.floor(diffSec / (86400 * 30))}mo ago`;
}

export default function RepositoryCard({
  repo,
  viewMode = 'grid',
  onSelect,
  onToggleFavorite,
  onUpdateStatus
}) {
  const { bulkSelectedIds, setBulkSelectedIds, logRecentItem, openReadme, updateRepository, toast } = useApp();
  const [copied, setCopied] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(repo.customTitle || repo.name);

  useEffect(() => {
    setTitleDraft(repo.customTitle || repo.name);
  }, [repo.customTitle, repo.name]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setDropdownOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  const handleSaveTitle = (e) => {
    e?.stopPropagation();
    const trimmed = titleDraft.trim();
    if (updateRepository) {
      updateRepository(repo.id, { customTitle: trimmed || undefined });
      if (toast) toast('Repository title updated', 'cyan');
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = (e) => {
    e?.stopPropagation();
    setTitleDraft(repo.customTitle || repo.name);
    setIsEditingTitle(false);
  };

  const currentStatus = repo.status || 'inbox';
  const statusConfig = REPO_STATUSES[currentStatus] || REPO_STATUSES.inbox;
  const statusOptions = PRIMARY_REPO_STATUSES.some(s => s.id === currentStatus)
    ? PRIMARY_REPO_STATUSES
    : [...PRIMARY_REPO_STATUSES, { id: currentStatus, label: REPO_STATUSES[currentStatus]?.label || currentStatus }];
  const langColor = LANGUAGE_COLORS[repo.primaryLanguage] || LANGUAGE_COLORS.Unknown;
  const StatusIcon = STATUS_ICON_MAP[currentStatus] || Inbox;

  const isSelected = bulkSelectedIds?.includes(repo.id);
  const subCat = repo.subCategory || repo.category || (Array.isArray(repo.collections) && repo.collections[0]);

  const handleToggleSelect = (e) => {
    e.stopPropagation();
    setBulkSelectedIds(prev => 
      prev.includes(repo.id) ? prev.filter(x => x !== repo.id) : [...prev, repo.id]
    );
  };

  const handleCardClick = () => {
    logRecentItem({ id: repo.id, type: 'repo', title: repo.fullName || repo.name, action: 'opened' });
    onSelect(repo);
  };

  const handleCopyClone = (e) => {
    e.stopPropagation();
    logRecentItem({ id: repo.id, type: 'repo', title: repo.fullName || repo.name, action: 'copied' });
    const cloneCmd = `git clone ${repo.canonicalUrl}.git`;
    navigator.clipboard.writeText(cloneCmd).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  // --- LIST VIEW (COMPACT HORIZONTAL ROW) ---
  if (viewMode === 'list') {
    const cardColor = getDeepCardColor(repo.color);
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
            : cardColor
              ? `1px solid ${cardColor}66`
              : '1px solid var(--bento-card-border)',
          borderRadius: '20px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
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
          title={isSelected ? 'Deselect' : 'Select for bulk action'}
        >
          {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
        </button>

        {/* Favorite Star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(repo.id);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: repo.isFavorite ? '#eab308' : 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center'
          }}
          title={repo.isFavorite ? 'Unfavorite' : 'Favorite'}
        >
          <Star size={15} fill={repo.isFavorite ? '#eab308' : 'none'} color={repo.isFavorite ? '#eab308' : 'currentColor'} />
        </button>

        {/* Owner & Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500, fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>
              {repo.owner} <span style={{ opacity: 0.5 }}>/</span>
            </span>
            {isEditingTitle ? (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveTitle(e);
                    if (e.key === 'Escape') handleCancelTitle(e);
                  }}
                  autoFocus
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface-hover)',
                    border: '1px solid var(--accent)',
                    borderRadius: 4,
                    padding: '2px 6px',
                    height: 24,
                    outline: 'none',
                    fontFamily: 'Geist, sans-serif'
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 4, padding: '2px 5px', cursor: 'pointer' }}
                  title="Save"
                >
                  <Check size={11} strokeWidth={2.5} />
                </button>
                <button
                  type="button"
                  onClick={handleCancelTitle}
                  style={{ background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 4, padding: '2px 5px', cursor: 'pointer' }}
                  title="Cancel"
                >
                  <X size={11} />
                </button>
              </div>
            ) : (
              <>
                <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {repo.customTitle || repo.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-tertiary)',
                    cursor: 'pointer',
                    padding: '1px 3px',
                    borderRadius: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: 0.4,
                    flexShrink: 0
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
                  title="Edit repository title"
                >
                  <Edit2 size={11} />
                </button>
              </>
            )}
            {repo.isPinned && (
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--accent)' }} title="Pinned">
                <Pin size={12} fill="currentColor" />
              </span>
            )}
            {subCat && (
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 6,
                background: 'rgba(232, 255, 31, 0.1)',
                border: '1px solid rgba(232, 255, 31, 0.22)',
                color: 'var(--accent)',
                fontFamily: 'Geist Mono, monospace',
                flexShrink: 0
              }}>
                {subCat}
              </span>
            )}
          </div>
          {/* Description */}
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
            {repo.description && repo.description !== 'No description provided.'
              ? repo.description
              : generateSmartRepoDescription(repo.owner, repo.name, repo.topics || repo.tags)}
          </div>
        </div>

        {/* Personal Notes Snippet in List */}
        {repo.personalNotes && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            color: 'var(--accent)',
            background: 'var(--accent-muted)',
            padding: '2px 8px',
            borderRadius: 4,
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }} title={repo.personalNotes}>
            <FileText size={11} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{repo.personalNotes}</span>
          </div>
        )}

        {/* Release / Tag Badge */}
        {repo.latestRelease && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            fontSize: 10,
            fontWeight: 700,
            color: '#818cf8',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.28)',
            padding: '2px 7px',
            borderRadius: 4,
            fontFamily: 'Geist Mono, monospace',
            flexShrink: 0
          }} title={`Latest Release: ${repo.latestRelease}`}>
            <Tag size={10} />
            <span>{repo.latestRelease}</span>
          </div>
        )}

        {/* Status Dropdown/Pill (Custom Compact Glass Menu) */}
        <div 
          ref={dropdownRef}
          style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }} 
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen(prev => !prev);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: statusConfig.bg,
              border: `1px solid ${statusConfig.border}`,
              borderRadius: 5,
              padding: '1px 7px',
              height: 20,
              color: statusConfig.color,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'Geist Mono, monospace',
              letterSpacing: '-0.01em',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Change Status"
          >
            <span>{statusConfig.label}</span>
          </button>

          {dropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                minWidth: 105,
                background: 'var(--bg-surface, #0c0e14)',
                border: '1px solid var(--border-medium)',
                borderRadius: 10,
                padding: 4,
                boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.2)',
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                animation: 'modalFadeIn 0.15s ease-out'
              }}
            >
              {statusOptions.map(st => {
                const isCurrent = currentStatus === st.id;
                const cfg = REPO_STATUSES[st.id] || statusConfig;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateStatus(repo.id, st.id);
                      setDropdownOpen(false);
                    }}
                    style={{
                      background: isCurrent ? cfg.bg : 'transparent',
                      color: isCurrent ? cfg.color : 'var(--text-secondary)',
                      border: isCurrent ? `1px solid ${cfg.border}` : '1px solid transparent',
                      borderRadius: 6,
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: isCurrent ? 700 : 500,
                      fontFamily: 'Geist Mono, monospace',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = 'var(--bg-surface-hover)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                      }
                    }}
                  >
                    <span>{st.label}</span>
                    {isCurrent && <Check size={11} strokeWidth={3} style={{ color: cfg.color }} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Stars & Forks */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: 'var(--text-tertiary)', width: 110, flexShrink: 0 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#eab308', fontWeight: 600 }} title="GitHub Stars">
            <Star size={12} fill="#eab308" color="#eab308" /> {formatCompactNumber(repo.stars)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title="Forks">
            <GitFork size={12} /> {formatCompactNumber(repo.forks)}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* README Drawer Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openReadme(repo);
            }}
            style={{
              background: 'var(--bg-surface-hover)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 10,
              fontWeight: 700,
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

          <button
            onClick={handleCopyClone}
            className={copied ? 'copy-feedback-animated' : ''}
            style={{
              background: copied ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-surface-hover)',
              color: copied ? '#34d399' : 'var(--text-secondary)',
              border: copied ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-subtle)',
              borderRadius: 4,
              padding: '4px 9px',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Copy git clone command"
          >
            {copied ? (
              <>
                <Check size={11} strokeWidth={2.5} />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Terminal size={11} />
                <span>CLONE</span>
              </>
            )}
          </button>
          
          <a
            href={repo.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
              padding: '4px 6px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4
            }}
            title="Open in GitHub"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    );
  }

  // --- GRID VIEW (HIGH-CRAFT DEVELOPER BENTO CARD) ---
  const cardColor = getDeepCardColor(repo.color);
  return (
    <div
      className="bento-card card-hover repo-card"
      onClick={handleCardClick}
      style={{
        background: isSelected 
          ? 'var(--accent-muted)' 
          : cardColor 
            ? `radial-gradient(130% 120% at 50% -10%, ${cardColor}38 0%, ${cardColor}1c 45%, transparent 85%), var(--bento-card-bg)`
            : 'var(--bento-card-bg)',
        border: isSelected 
          ? '1px solid var(--accent)' 
          : cardColor 
            ? `1px solid ${cardColor}66`
            : '1px solid var(--bento-card-border)',
        borderRadius: '28px',
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        boxShadow: cardColor 
          ? `inset 0 1.5px 0 ${cardColor}b3, inset 0 0 0 1px ${cardColor}30, var(--shadow-soft), 0 0 24px ${cardColor}20`
          : 'var(--shadow-rim)',
        transition: 'all 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        position: 'relative',
        overflow: 'hidden'
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
          pointerEvents: 'none'
        }} />
      )}
      <div className="bento-rim" aria-hidden="true" />
      {/* Top Header: Checkbox + Language + Status + Favorite */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            title={isSelected ? 'Deselect' : 'Select for bulk action'}
          >
            {isSelected ? <CheckSquare size={15} /> : <Square size={15} />}
          </button>
          {subCat && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 6,
              background: 'rgba(232, 255, 31, 0.08)',
              border: '1px solid rgba(232, 255, 31, 0.22)',
              color: 'var(--accent)',
              fontFamily: 'Geist Mono, monospace'
            }}>
              {subCat}
            </span>
          )}
          {repo.latestRelease && (
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: 6,
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.28)',
              color: '#818cf8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              fontFamily: 'Geist Mono, monospace',
              letterSpacing: '-0.02em'
            }} title={`Latest Release: ${repo.latestRelease}`}>
              <Tag size={10} />
              {repo.latestRelease}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status Dropdown/Pill (Custom Compact Glass Menu) */}
          <div 
            ref={dropdownRef}
            style={{ position: 'relative', display: 'inline-flex' }} 
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDropdownOpen(prev => !prev);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: statusConfig.bg,
                border: `1px solid ${statusConfig.border}`,
                borderRadius: 5,
                padding: '1px 7px',
                height: 20,
                color: statusConfig.color,
                fontSize: 10,
                fontWeight: 700,
                fontFamily: 'Geist Mono, monospace',
                letterSpacing: '-0.01em',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title="Change Status"
            >
              <span>{statusConfig.label}</span>
            </button>

            {dropdownOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  minWidth: 105,
                  background: 'var(--bg-surface, #0c0e14)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 10,
                  padding: 4,
                  boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.85), 0 0 1px rgba(255, 255, 255, 0.2)',
                  zIndex: 200,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  animation: 'modalFadeIn 0.15s ease-out'
                }}
              >
                {statusOptions.map(st => {
                  const isCurrent = currentStatus === st.id;
                  const cfg = REPO_STATUSES[st.id] || statusConfig;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateStatus(repo.id, st.id);
                        setDropdownOpen(false);
                      }}
                      style={{
                        background: isCurrent ? cfg.bg : 'transparent',
                        color: isCurrent ? cfg.color : 'var(--text-secondary)',
                        border: isCurrent ? `1px solid ${cfg.border}` : '1px solid transparent',
                        borderRadius: 6,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontWeight: isCurrent ? 700 : 500,
                        fontFamily: 'Geist Mono, monospace',
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={e => {
                        if (!isCurrent) e.currentTarget.style.background = 'var(--bg-surface-hover, rgba(255,255,255,0.06))';
                      }}
                      onMouseLeave={e => {
                        if (!isCurrent) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span>{st.label}</span>
                      {isCurrent && <Check size={11} strokeWidth={2.5} style={{ color: cfg.color }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(repo.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: repo.isFavorite ? '#eab308' : 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
              lineHeight: 1
            }}
            title={repo.isFavorite ? 'Unfavorite' : 'Favorite'}
          >
            <Star size={15} fill={repo.isFavorite ? '#eab308' : 'none'} color={repo.isFavorite ? '#eab308' : 'currentColor'} />
          </button>
        </div>
      </div>

      {/* Repository Full Name */}
      <div style={{ marginBottom: 8 }}>
        {isEditingTitle ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, fontFamily: 'Geist Mono, monospace', flexShrink: 0 }}>
              {repo.owner} <span style={{ opacity: 0.5 }}>/</span>
            </span>
            <input
              type="text"
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveTitle(e);
                if (e.key === 'Escape') handleCancelTitle(e);
              }}
              autoFocus
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--text-primary)',
                background: 'var(--bg-surface-hover)',
                border: '1px solid var(--accent)',
                borderRadius: 6,
                padding: '3px 8px',
                outline: 'none',
                fontFamily: 'Geist, sans-serif',
                flex: 1,
                minWidth: 0
              }}
            />
            <button
              type="button"
              onClick={handleSaveTitle}
              style={{ background: 'var(--accent)', color: '#000', border: 'none', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
              title="Save"
            >
              <Check size={13} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={handleCancelTitle}
              style={{ background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
              title="Cancel"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="bento-ttl" style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, lineHeight: 1.3, letterSpacing: '-0.025em' }}>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500, fontFamily: 'Geist Mono, monospace', letterSpacing: 'normal' }}>
              {repo.owner} <span style={{ opacity: 0.5 }}>/</span>
            </span>
            <span style={{ fontSize: 19, fontWeight: 700, color: 'var(--bento-card-title)', wordBreak: 'break-word' }}>
              {repo.customTitle || repo.name}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: 4,
                display: 'inline-flex',
                alignItems: 'center',
                opacity: 0.4,
                transition: 'opacity 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.4'}
              title="Edit repository title"
            >
              <Edit2 size={12} />
            </button>
            {repo.isPinned && (
              <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 2, color: 'var(--accent)' }} title="Pinned">
                <Pin size={14} fill="currentColor" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <p style={{
        fontSize: 12,
        color: 'var(--text-secondary)',
        lineHeight: 1.5,
        marginBottom: 12,
        flex: 1,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden'
      }}>
        {repo.description && repo.description !== 'No description provided.'
          ? repo.description
          : generateSmartRepoDescription(repo.owner, repo.name, repo.topics || repo.tags)}
      </p>

      {/* Topics */}
      {repo.topics && repo.topics.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          {repo.topics.slice(0, 3).map(t => (
            <span key={t} style={{
              fontSize: 10.5,
              fontWeight: 600,
              background: 'rgba(169, 178, 255, 0.08)',
              border: '1px solid rgba(169, 178, 255, 0.22)',
              color: 'var(--color-blue)',
              padding: '2px 8px',
              borderRadius: 10,
              fontFamily: 'Geist Mono, monospace',
              letterSpacing: '-0.02em'
            }}>
              #{t}
            </span>
          ))}
          {repo.topics.length > 3 && (
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', alignSelf: 'center', fontWeight: 600, fontFamily: 'Geist Mono, monospace' }}>
              +{repo.topics.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Personal Notes Indicator */}
      {repo.personalNotes && (
        <div style={{
          fontSize: 11,
          color: 'var(--accent)',
          background: 'var(--accent-muted)',
          border: '1px solid var(--accent-glow)',
          padding: '6px 10px',
          borderRadius: 12,
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          overflow: 'hidden'
        }}>
          <FileText size={12} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
            {repo.personalNotes.replace(/^#+\s*/, '')}
          </span>
        </div>
      )}

      {/* Card Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTop: '1px solid var(--border-subtle)',
        fontSize: 11,
        color: 'var(--text-tertiary)',
        fontFamily: 'Geist Mono, monospace'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#eab308', fontWeight: 600 }} title="GitHub Stars">
            <Star size={12} fill="#eab308" color="#eab308" /> {formatCompactNumber(repo.stars)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title="Forks">
            <GitFork size={12} /> {formatCompactNumber(repo.forks)}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }} title="Last Commit">
            <Clock size={12} /> {formatRelativeTime(repo.pushedAt)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Readme Drawer Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openReadme(repo);
            }}
            style={{
              background: 'var(--btn-subtle-bg)',
              color: 'var(--btn-subtle-color)',
              border: '1px solid var(--btn-subtle-border)',
              borderRadius: 13,
              height: 26,
              padding: '0 10px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'Geist Mono, monospace',
              letterSpacing: '-0.02em',
              transition: 'all 0.2s'
            }}
            title="Preview README.md in app"
          >
            <BookOpen size={11} />
            <span>README</span>
          </button>

          <button
            onClick={handleCopyClone}
            className={copied ? 'copy-feedback-animated' : ''}
            style={{
              background: copied ? 'rgba(52, 211, 153, 0.2)' : 'var(--btn-subtle-bg)',
              color: copied ? '#34d399' : 'var(--btn-subtle-color)',
              border: copied ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid var(--btn-subtle-border)',
              borderRadius: 13,
              height: 26,
              padding: '0 12px',
              fontSize: 10.5,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: 'Geist Mono, monospace',
              letterSpacing: '-0.02em',
              transition: 'all 0.2s'
            }}
            title="Copy git clone command"
          >
            {copied ? (
              <>
                <Check size={11} strokeWidth={2.5} />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Terminal size={11} />
                <span>CLONE</span>
              </>
            )}
          </button>

          <a
            href={repo.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              color: 'var(--text-tertiary)',
              textDecoration: 'none',
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              borderRadius: 4
            }}
            title="Open on GitHub"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
