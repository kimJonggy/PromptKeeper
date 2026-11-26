import React from 'react';
import { 
  Zap, 
  FolderGit2, 
  Bookmark, 
  Plus, 
  Menu
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';

export default function MobileBottomNav() {
  const {
    activeNav,
    setActiveNav,
    prompts = [],
    repositories = [],
    bookmarks = [],
    setQuickSaveOpen,
    setSidebarOpen,
    setCatFilter,
    setTagFilter
  } = useApp();

  const handleNav = (navKey) => {
    setActiveNav(navKey);
    if (navKey === 'prompts') {
      setCatFilter('All');
      setTagFilter('');
    }
  };

  const isVaultActive = activeNav === 'prompts';
  const isReposActive = activeNav === 'repos';
  const isLinksActive = activeNav === 'bookmarks';

  return (
    <nav 
      className="mobile-bottom-nav show-mobile-flex"
      aria-label="Mobile Floating Navigation"
      style={{
        position: 'fixed',
        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        left: 14,
        right: 14,
        maxWidth: 420,
        margin: '0 auto',
        height: 64,
        borderRadius: 36,
        background: 'rgba(15, 17, 24, 0.78)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.13)',
        boxShadow: '0 20px 48px -6px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.22)',
        zIndex: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingLeft: 8,
        paddingRight: 8
      }}
    >
      {/* 1. Prompts Vault */}
      <button
        onClick={() => handleNav('prompts')}
        className="mobile-nav-btn"
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          padding: '6px 2px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          cursor: 'pointer',
          color: isVaultActive ? 'var(--accent)' : 'var(--text-tertiary)',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          touchAction: 'manipulation'
        }}
        title="Prompts Vault"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={19} strokeWidth={isVaultActive ? 2.6 : 2} />
          {prompts.length > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -10,
              fontSize: 9,
              fontWeight: 800,
              padding: '0 4px',
              borderRadius: 8,
              background: isVaultActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.14)',
              color: isVaultActive ? '#000' : 'var(--text-secondary)',
              fontFamily: 'Geist Mono, monospace',
              lineHeight: '13px'
            }}>
              {prompts.length > 99 ? '99+' : prompts.length}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: isVaultActive ? 700 : 500, letterSpacing: 0.2 }}>
          Vault
        </span>
        {isVaultActive && (
          <span style={{
            position: 'absolute',
            bottom: 2,
            width: 12,
            height: 2,
            borderRadius: 2,
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--accent)'
          }} />
        )}
      </button>

      {/* 2. Repositories Hub */}
      <button
        onClick={() => handleNav('repos')}
        className="mobile-nav-btn"
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          padding: '6px 2px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          cursor: 'pointer',
          color: isReposActive ? 'var(--accent)' : 'var(--text-tertiary)',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          touchAction: 'manipulation'
        }}
        title="Repository Hub"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FolderGit2 size={19} strokeWidth={isReposActive ? 2.6 : 2} />
          {repositories.length > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -10,
              fontSize: 9,
              fontWeight: 800,
              padding: '0 4px',
              borderRadius: 8,
              background: isReposActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.14)',
              color: isReposActive ? '#000' : 'var(--text-secondary)',
              fontFamily: 'Geist Mono, monospace',
              lineHeight: '13px'
            }}>
              {repositories.length > 99 ? '99+' : repositories.length}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: isReposActive ? 700 : 500, letterSpacing: 0.2 }}>
          Repos
        </span>
        {isReposActive && (
          <span style={{
            position: 'absolute',
            bottom: 2,
            width: 12,
            height: 2,
            borderRadius: 2,
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--accent)'
          }} />
        )}
      </button>

      {/* 3. Center Glowing Floating Button (Signature Floating Action Notch) */}
      <div style={{
        flex: '0 0 68px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Soft Radial Ambient Glow */}
        <div style={{
          position: 'absolute',
          top: -24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'var(--accent)',
          opacity: 0.35,
          filter: 'blur(16px)',
          pointerEvents: 'none'
        }} />

        {/* Elevated Circular Floating Button */}
        <button
          onClick={() => setQuickSaveOpen(true)}
          style={{
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f5ff72 0%, var(--accent) 55%, #c8de05 100%)',
            color: '#0a0a0c',
            border: '4px solid rgba(15, 17, 24, 0.95)',
            boxShadow: '0 0 20px rgba(232, 255, 31, 0.45), 0 8px 22px rgba(0, 0, 0, 0.65), inset 0 1.5px 1.5px rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transform: 'translateY(-16px)',
            transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
            marginBottom: -12,
            position: 'relative',
            zIndex: 2,
            touchAction: 'manipulation'
          }}
          title="Quick Save (⌘N)"
          aria-label="Quick Save"
        >
          <Plus size={24} strokeWidth={2.8} />
        </button>
        <span style={{
          fontSize: 9.5,
          fontWeight: 700,
          color: 'var(--accent)',
          letterSpacing: 0.2,
          marginTop: 2,
          position: 'relative',
          zIndex: 1
        }}>
          Create
        </span>
      </div>

      {/* 4. Bookmarks Hub */}
      <button
        onClick={() => handleNav('bookmarks')}
        className="mobile-nav-btn"
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          padding: '6px 2px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          cursor: 'pointer',
          color: isLinksActive ? 'var(--accent)' : 'var(--text-tertiary)',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          position: 'relative',
          touchAction: 'manipulation'
        }}
        title="Website Bookmarks"
      >
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Bookmark size={19} strokeWidth={isLinksActive ? 2.6 : 2} />
          {bookmarks.length > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -10,
              fontSize: 9,
              fontWeight: 800,
              padding: '0 4px',
              borderRadius: 8,
              background: isLinksActive ? 'var(--accent)' : 'rgba(255, 255, 255, 0.14)',
              color: isLinksActive ? '#000' : 'var(--text-secondary)',
              fontFamily: 'Geist Mono, monospace',
              lineHeight: '13px'
            }}>
              {bookmarks.length > 99 ? '99+' : bookmarks.length}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, fontWeight: isLinksActive ? 700 : 500, letterSpacing: 0.2 }}>
          Links
        </span>
        {isLinksActive && (
          <span style={{
            position: 'absolute',
            bottom: 2,
            width: 12,
            height: 2,
            borderRadius: 2,
            background: 'var(--accent)',
            boxShadow: '0 0 6px var(--accent)'
          }} />
        )}
      </button>

      {/* 5. Menu Drawer */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="mobile-nav-btn"
        style={{
          flex: 1,
          background: 'none',
          border: 'none',
          padding: '6px 2px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          cursor: 'pointer',
          color: 'var(--text-tertiary)',
          transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
          touchAction: 'manipulation'
        }}
        title="Open Navigation Menu"
      >
        <Menu size={19} />
        <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: 0.2 }}>
          Menu
        </span>
      </button>
    </nav>
  );
}

