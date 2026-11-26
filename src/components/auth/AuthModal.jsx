import { useState, useEffect } from 'react';
import { 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  FolderArchive 
} from 'lucide-react';
import { 
  isSupabaseConfigured, 
  getCurrentUser, 
  signInWithEmail, 
  signUpWithEmail, 
  signOut,
  onAuthStateChange
} from '../../services/supabaseClient.js';
import { syncEngine } from '../../services/syncEngine.js';
import { outboxService } from '../../db/outboxService.js';

export default function AuthModal({ isOpen, onClose, promptsCount = 0, reposCount = 0, onSyncComplete }) {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [syncState, setSyncState] = useState(syncEngine.getState());
  const [pendingOutbox, setPendingOutbox] = useState(0);

  const configured = isSupabaseConfigured();

  // Load user & sync state
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      if (configured) {
        const u = await getCurrentUser();
        if (isMounted) setCurrentUser(u);
      }
      const count = await outboxService.getOutboxCount();
      if (isMounted) setPendingOutbox(count);
    }
    checkAuth();

    const unsubAuth = onAuthStateChange((_event, user) => {
      if (isMounted) setCurrentUser(user);
    });

    const unsubSync = syncEngine.subscribe((state) => {
      if (isMounted) {
        setSyncState(state);
        outboxService.getOutboxCount().then(c => {
          if (isMounted) setPendingOutbox(c);
        });
      }
    });

    return () => {
      isMounted = false;
      unsubAuth();
      unsubSync();
    };
  }, [configured, isOpen]);

  if (!isOpen) return null;

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (tab === 'signin') {
        const { user, error } = await signInWithEmail(email, password);
        if (error) throw error;
        setCurrentUser(user);
        setSuccessMsg('Successfully signed in! Starting cloud sync...');
        await syncEngine.syncNow();
        if (onSyncComplete) onSyncComplete();
      } else {
        const { user, error } = await signUpWithEmail(email, password);
        if (error) throw error;
        setSuccessMsg(
          user?.identities?.length === 0
            ? 'Account already registered. Please sign in.'
            : 'Account created! Please check your email for confirmation.'
        );
      }
    } catch (err) {
      const msg = err.message || 'Authentication failed';
      if (msg.toLowerCase().includes('email logins are disabled')) {
        setErrorMsg('Supabase Dashboard > Authentication > Providers > Email এ গিয়ে "Enable Email provider" অন (Enable) করে Save করুন।');
      } else {
        setErrorMsg(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    setLoading(true);
    try {
      await signOut();
      setCurrentUser(null);
      setSuccessMsg('Signed out. Your local prompts and repositories remain saved on this device.');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleManualSync() {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await syncEngine.syncNow();
      if (result.error) {
        setErrorMsg('Sync error: ' + result.error);
      } else {
        setSuccessMsg(`Synced successfully (${result.pushed} pushed, ${result.pulled} pulled) ✓`);
        const count = await outboxService.getOutboxCount();
        setPendingOutbox(count);
        if (onSyncComplete) onSyncComplete();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="industrial-modal" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: 480 }}
      >
        {/* Header */}
        <div style={{ 
          padding: '16px 20px', 
          borderBottom: '1px solid var(--border-subtle)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: 'var(--bg-surface-hover)' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3, color: 'var(--text-primary)' }}>
              Cloud Synchronization
            </span>
            <span style={{ 
              fontSize: 10, 
              fontWeight: 700, 
              padding: '2px 6px', 
              borderRadius: 4, 
              background: configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(240, 165, 50, 0.15)',
              color: configured ? 'var(--emerald-400)' : 'var(--accent)',
              border: `1px solid ${configured ? 'rgba(16, 185, 129, 0.3)' : 'rgba(240, 165, 50, 0.3)'}`
            }}>
              {configured ? 'Cloud Ready' : 'Offline Mode'}
            </span>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!configured ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                Supabase credentials are not configured in your environment.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, background: 'var(--bg-app)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                PromptKeeper is <strong>local-first</strong>. All prompts, repositories, and collections are fully saved and indexed offline in IndexedDB.
                <br /><br />
                To enable optional cloud synchronization across devices, copy <code>.env.example</code> to <code>.env.local</code> and provide your Supabase project URL and Anon Key.
              </div>
              <button 
                className="btn btn-fw" 
                onClick={onClose} 
                style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 16px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
              >
                Continue In Offline Mode
              </button>
            </div>
          ) : currentUser ? (
            /* Signed In State */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Connected Account:</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {currentUser.email}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Sync Engine Status:</span>
                  <span style={{ 
                    fontSize: 11, 
                    fontWeight: 700, 
                    color: syncState.status === 'synced' ? 'var(--emerald-400)' : syncState.status === 'syncing' ? 'var(--accent)' : 'var(--text-secondary)',
                    textTransform: 'uppercase'
                  }}>
                    {syncState.status}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pending Changes in Outbox:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: pendingOutbox > 0 ? 'var(--accent)' : 'var(--text-tertiary)' }}>
                      {pendingOutbox} items
                    </span>
                    {pendingOutbox > 0 && (
                      <button
                        type="button"
                        onClick={async () => {
                          await outboxService.clearOutbox();
                          setPendingOutbox(0);
                          setSuccessMsg('Outbox queue cleared.');
                        }}
                        style={{
                          background: 'rgba(239, 68, 68, 0.15)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 4,
                          cursor: 'pointer'
                        }}
                        title="Clear stuck outbox mutations"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Status messages */}
              {errorMsg && (
                <div style={{ background: 'var(--danger)', color: '#fff', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}
              {successMsg && (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--emerald-500)', color: 'var(--emerald-400)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} /> {successMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-fw"
                  onClick={handleManualSync}
                  disabled={loading || syncState.status === 'syncing'}
                  style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, padding: '10px 16px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <RefreshCw size={14} className={syncState.status === 'syncing' ? 'spin' : ''} />
                  {syncState.status === 'syncing' || loading ? 'Syncing...' : 'Sync Now'}
                </button>
                <button
                  className="btn"
                  onClick={handleSignOut}
                  disabled={loading}
                  style={{ background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12 }}
                >
                  Sign Out
                </button>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                Signing out stops cloud synchronization but preserves all current prompts and repositories on this device.
              </div>
            </div>
          ) : (
            /* Unauthenticated Form */
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Tab Selector */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', marginBottom: 4 }}>
                <button
                  type="button"
                  onClick={() => { setTab('signin'); setErrorMsg(''); setSuccessMsg(''); }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: tab === 'signin' ? '2px solid var(--accent)' : '2px solid transparent',
                    color: tab === 'signin' ? 'var(--accent)' : 'var(--text-tertiary)',
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: tab === 'signup' ? '2px solid var(--accent)' : '2px solid transparent',
                    color: tab === 'signup' ? 'var(--accent)' : 'var(--text-tertiary)',
                    padding: '8px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Create Account
                </button>
              </div>

              {/* Local Library Preview (TASK-507) */}
              {(promptsCount > 0 || reposCount > 0) && (
                <div style={{ background: 'var(--bg-app)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: 11, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderArchive size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div>
                    <strong>Local Library Preview:</strong> You currently have <strong>{promptsCount} prompts</strong> and <strong>{reposCount} repositories</strong> stored locally. Signing in will automatically sync and preserve your library.
                  </div>
                </div>
              )}

              {errorMsg && (
                <div style={{ background: 'var(--danger)', color: '#fff', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={15} /> {errorMsg}
                </div>
              )}
              {successMsg && (
                <div style={{ background: 'rgba(16, 185, 129, 0.2)', border: '1px solid var(--emerald-500)', color: 'var(--emerald-400)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2 size={15} /> {successMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="developer@example.com"
                  required
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  minLength={6}
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-primary)',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 13
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-fw"
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  fontWeight: 800,
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  marginTop: 6
                }}
              >
                {loading ? 'Processing...' : tab === 'signin' ? 'Sign In & Sync Library' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

