import React from 'react';
import { X } from 'lucide-react';
import logoImg from '../assets/logo.png';

export default function OnboardingModal({ onChoose, onComplete }) {
  const handleAction = (choice) => {
    const fn = onChoose || onComplete;
    if (typeof fn === 'function') {
      fn(choice);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => handleAction('fresh')}>
      <div 
        className="industrial-modal bento-card" 
        style={{ 
          maxWidth: 440, 
          width: '92%',
          padding: '36px 24px', 
          textAlign: 'center',
          position: 'relative',
          background: 'var(--bg-surface, #0c0e14)',
          border: '1px solid var(--border-medium)',
          borderRadius: 24,
          boxShadow: 'var(--shadow-soft)'
        }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => handleAction('fresh')}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close & Start Fresh"
        >
          <X size={18} />
        </button>

        <img 
          src={logoImg} 
          alt="PromptKeeper Logo" 
          style={{ width: 56, height: 56, margin: '0 auto 16px', display: 'block', objectFit: 'contain' }} 
        />
        <div className="ft" style={{ fontSize: 24, fontWeight: 900, marginBottom: 12, color: 'var(--text-primary)', lineHeight: 1.1 }}>
          WELCOME TO PROMPT KEEPER
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28, lineHeight: 1.6, fontWeight: 500 }}>
          Your ultimate developer knowledge workspace. <br/>
          Choose how you want to start your library. <br/>
          <span style={{ color: 'var(--accent)', fontWeight: 800 }}>All data stays locally in your browser.</span>
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button 
            type="button"
            className="btn btn-c btn-lg" 
            onClick={() => handleAction('fresh')}
            style={{ 
              fontWeight: 900, 
              height: 52, 
              fontSize: 14,
              background: 'var(--accent)',
              color: '#000000',
              borderRadius: 12
            }}
          >
            START FRESH (EMPTY & CLEAN)
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 800 }}>OR</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-subtle)' }} />
          </div>

          <button 
            type="button"
            className="btn btn-lg" 
            onClick={() => handleAction('demo')}
            style={{ 
              fontWeight: 600, 
              height: 48, 
              fontSize: 13,
              background: 'var(--bg-surface-hover)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12
            }}
          >
            LOAD DEMO PROMPTS
          </button>
        </div>

        <div style={{ marginTop: 22, fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: 0.5 }}>
          v2.0 DEVELOPER EDITION
        </div>
      </div>
    </div>
  );
}
