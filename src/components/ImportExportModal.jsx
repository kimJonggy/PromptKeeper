import { useState } from 'react';
import { 
  X, 
  Download, 
  Upload, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  RefreshCw, 
  AlertTriangle 
} from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { validateVault } from '../utils/validation.js';
import { verifyDatabaseIntegrity, exportAllData } from '../db/migrationService.js';
import { isIndexedDBSupported } from '../db/index.js';
import { parseNetscapeBookmarks } from '../utils/bookmarkParser.js';
import { bookmarkRepository } from '../db/repository.js';

export default function ImportExportModal() {
  const {
    prompts,
    repositories,
    bookmarks,
    setBookmarks,
    categories,
    categoryColors,
    modelColors,
    importPrompts: onImport,
    setShowIO,
    setPrompts,
    setRepositories,
    setCategories,
    setCategoryColors,
    setModelColors,
    storageDriver,
    toggleStorageDriver,
    isMigrating,
    runMigration,
    resetVault,
    accent,
    setAccent
  } = useApp();

  const onClose = () => setShowIO(false);
  const [tab, setTab] = useState('export'); // 'export' | 'import' | 'storage'
  const [importText, setImportText] = useState('');
  const [err, setErr] = useState('');
  const [copied, setCopied] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState(null);
  const [checkingIntegrity, setCheckingIntegrity] = useState(false);
  const [browserBookmarks, setBrowserBookmarks] = useState([]);
  const [browserImportStats, setBrowserImportStats] = useState(null);

  const json = JSON.stringify({
    version: '2.0',
    exportedAt: new Date().toISOString(),
    prompts,
    repositories: repositories || [],
    bookmarks: bookmarks || [],
    categories,
    categoryColors,
    modelColors
  }, null, 2);

  function doExport() {
    const b = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = `promptkeeper-vault-${Date.now()}.json`;
    a.click();
  }

  async function doFullDatabaseExport() {
    try {
      const fullData = await exportAllData();
      const b = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = `promptkeeper-indexeddb-backup-${Date.now()}.json`;
      a.click();
    } catch (e) {
      setErr('Export error: ' + e.message);
    }
  }

  function copyJson() {
    navigator.clipboard.writeText(json).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function doImport() {
    try {
      const parsed = JSON.parse(importText);
      const vaultResult = validateVault(parsed);
      
      if (!vaultResult.isValid) {
        throw new Error(vaultResult.errors[0] || 'Invalid prompt data structure');
      }

      if (!vaultResult.isFullVault) {
        // Prompt array import
        onImport(vaultResult.validPrompts);
      } else {
        // Full vault restoration
        if (vaultResult.validPrompts.length > 0) {
          setPrompts(vaultResult.validPrompts);
        }
        if (Array.isArray(parsed.repositories) && setRepositories) {
          setRepositories(parsed.repositories);
        }
        if (Array.isArray(parsed.bookmarks) && setBookmarks) {
          setBookmarks(parsed.bookmarks);
        }
        if (vaultResult.categories) setCategories(vaultResult.categories);
        if (vaultResult.categoryColors) setCategoryColors(vaultResult.categoryColors);
        if (vaultResult.modelColors) setModelColors(vaultResult.modelColors);
      }
      onClose();
    } catch (e) {
      setErr(e.message || 'Invalid JSON format');
    }
  }

  const handleBrowserFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target.result;
      const parsed = parseNetscapeBookmarks(content);
      setBrowserBookmarks(parsed);
      const cats = [...new Set(parsed.map(b => b.category))].filter(c => c && c !== 'General');
      setBrowserImportStats({
        total: parsed.length,
        categories: cats
      });
    };
    reader.readAsText(file);
  };

  const handleExecuteBrowserImport = async () => {
    if (!browserBookmarks || browserBookmarks.length === 0) return;
    const existingUrls = new Set((bookmarks || []).map(b => (b.url || '').toLowerCase().replace(/\/$/, '')));
    const toAdd = [];
    let skipped = 0;

    browserBookmarks.forEach(bm => {
      const norm = (bm.url || '').toLowerCase().replace(/\/$/, '');
      if (existingUrls.has(norm)) {
        skipped++;
      } else {
        toAdd.push(bm);
        existingUrls.add(norm);
      }
    });

    if (toAdd.length > 0) {
      setBookmarks(prev => [...toAdd, ...(prev || [])]);
      if (isIndexedDBSupported()) {
        for (const item of toAdd) {
          await bookmarkRepository.save(item).catch(console.warn);
        }
      }
    }

    alert(`Successfully imported ${toAdd.length} browser bookmarks (${skipped} duplicates skipped).`);
    onClose();
  };

  const handleCheckIntegrity = async () => {
    setCheckingIntegrity(true);
    try {
      const res = await verifyDatabaseIntegrity();
      setIntegrityStatus(res);
    } finally {
      setCheckingIntegrity(false);
    }
  };

  const handleTabChange = (targetTab) => {
    setTab(targetTab);
    setErr('');
    if (targetTab === 'storage' && isIndexedDBSupported()) {
      handleCheckIntegrity();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="industrial-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 640 }}
      >
        {/* Header / Tabs */}
        <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', background: 'var(--bg-surface-hover)' }}>
          {[
            { id: 'export', label: 'Export' },
            { id: 'import', label: 'Import' },
            { id: 'browser', label: 'Browser Bookmarks' },
            { id: 'storage', label: 'Database & Storage' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => handleTabChange(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 12,
                letterSpacing: 0.5,
                fontWeight: 700,
                color: tab === t.id ? 'var(--accent)' : 'var(--text-tertiary)',
                padding: '16px 16px',
                cursor: 'pointer',
                transition: 'all .2s ease',
                textTransform: 'uppercase',
                borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          ))}
          <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-tertiary)', border: 'none', marginLeft: 'auto', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tab === 'export' && (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: 0.3 }}>
                Vault Export <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>({prompts.length} prompts, {repositories?.length || 0} repos)</span>
              </div>
              <div style={{ position: 'relative' }}>
                <textarea
                  readOnly
                  value={json}
                  style={{ 
                    minHeight: 240, 
                    fontSize: 12, 
                    color: '#eee', 
                    lineHeight: 1.6, 
                    cursor: 'text', 
                    border: '1px solid var(--border-light)', 
                    background: 'rgba(0,0,0,0.2)',
                    fontFamily: 'JetBrains Mono,monospace',
                    fontWeight: 400,
                    borderRadius: 'var(--radius)',
                    padding: '14px',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-fw" onClick={doExport} style={{ background: 'var(--accent)', color: '#000', fontWeight: 700, padding: '10px 18px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Download size={15} /> Download JSON Vault
                </button>
                <button className="btn" onClick={copyJson} style={{ flexShrink: 0, minWidth: 120, background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '10px 18px', borderRadius: 'var(--radius-sm)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy JSON</>}
                </button>
                <button className="btn" onClick={doFullDatabaseExport} style={{ flexShrink: 0, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: 11 }}>
                  IndexedDB Dump
                </button>
              </div>
            </>
          )}

          {tab === 'import' && (
            <>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: 0.3 }}>
                Import Data <span style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>(paste JSON array or full vault)</span>
              </div>
              <textarea
                value={importText}
                onChange={e => { setImportText(e.target.value); setErr(''); }}
                placeholder={'{\n  "prompts": [...],\n  "repositories": [...]\n}'}
                style={{ 
                  minHeight: 240, 
                  fontSize: 12, 
                  lineHeight: 1.6, 
                  border: '1px solid var(--border-subtle)', 
                  background: 'var(--bg-app)',
                  color: 'var(--text-primary)',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 400,
                  borderRadius: 'var(--radius)',
                  padding: '14px',
                }}
              />
              {err && (
                <div style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={15} /> Error: {err}
                </div>
              )}
              <button
                className="btn btn-fw"
                onClick={doImport}
                disabled={!importText.trim()}
                style={{
                  background: 'var(--accent)',
                  color: '#000',
                  fontWeight: 700,
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-sm)',
                  opacity: importText.trim() ? 1 : 0.5,
                  cursor: importText.trim() ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                <Upload size={15} /> Import Data
              </button>
            </>
          )}

          {tab === 'browser' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: 0.3 }}>
                Import Browser Bookmarks HTML
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Select or paste the exported bookmark HTML file from Google Chrome, Arc, Firefox, Safari, Edge, or Brave.
              </div>

              {/* File upload box */}
              <div style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius)',
                padding: '24px',
                textAlign: 'center',
                background: 'var(--bg-app)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10
              }}>
                <Upload size={24} style={{ color: 'var(--accent)' }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Choose Netscape Bookmarks .html file
                </div>
                <input
                  type="file"
                  accept=".html,.htm"
                  onChange={handleBrowserFileSelect}
                  style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                />
              </div>

              {/* Stats & Import Confirmation */}
              {browserImportStats && (
                <div style={{
                  padding: '14px 16px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Parsed {browserImportStats.total} Bookmarks
                  </div>
                  {browserImportStats.categories.length > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                      Found folders: {browserImportStats.categories.slice(0, 6).join(', ')}
                      {browserImportStats.categories.length > 6 ? ` (+${browserImportStats.categories.length - 6} more)` : ''}
                    </div>
                  )}
                  <button
                    className="btn btn-fw"
                    onClick={handleExecuteBrowserImport}
                    style={{
                      marginTop: 6,
                      background: 'var(--accent)',
                      color: '#000',
                      fontWeight: 700,
                      padding: '10px 16px',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <Check size={14} />
                    <span>Import {browserImportStats.total} Bookmarks into Vault</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'storage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: 0.3 }}>
                Local Persistence Engine
              </div>

              {/* Status Card */}
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Storage Driver:</span>
                  <span style={{ 
                    fontSize: 12, 
                    fontWeight: 700, 
                    color: storageDriver === 'indexeddb' ? 'var(--emerald-400)' : 'var(--amber-400)',
                    background: 'var(--bg-app)',
                    padding: '4px 10px',
                    borderRadius: 4,
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {storageDriver === 'indexeddb' ? 'IndexedDB (Dexie v4)' : 'localStorage Fallback'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Database Health:</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: integrityStatus?.ok ? 'var(--emerald-400)' : 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {integrityStatus?.ok ? <><CheckCircle2 size={13} /> Healthy & Synced</> : checkingIntegrity ? 'Checking...' : 'Ready'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>IndexedDB Records:</span>
                  <span style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {integrityStatus ? `${integrityStatus.promptsCount} Prompts / ${integrityStatus.reposCount} Repos` : `${prompts.length} Prompts / ${repositories?.length || 0} Repos`}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Accent Color Theme:</span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { id: 'bento', color: '#E8FF1F', name: 'Bento Electric Lime' },
                      { id: 'amber', color: '#f0a532', name: 'Obsidian Amber' },
                      { id: 'emerald', color: '#10b981', name: 'Emerald Matrix' },
                      { id: 'violet', color: '#8b5cf6', name: 'Cyberpunk Violet' },
                      { id: 'cobalt', color: '#3b82f6', name: 'Deep Cobalt' }
                    ].map(pal => {
                      const isSel = (accent || 'bento') === pal.id;
                      return (
                        <button
                          key={pal.id}
                          onClick={() => setAccent(pal.id)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: pal.color,
                            border: isSel ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                            boxShadow: isSel ? `0 0 8px ${pal.color}` : 'none',
                            cursor: 'pointer',
                            transform: isSel ? 'scale(1.15)' : 'scale(1)',
                            transition: 'transform 0.15s ease'
                          }}
                          title={pal.name}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button 
                  className="btn" 
                  onClick={handleCheckIntegrity} 
                  disabled={checkingIntegrity}
                  style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <ShieldCheck size={14} />
                  {checkingIntegrity ? 'Verifying...' : 'Verify Integrity'}
                </button>

                <button 
                  className="btn" 
                  onClick={() => runMigration(true)} 
                  disabled={isMigrating}
                  style={{ background: 'var(--bg-surface-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={14} />
                  {isMigrating ? 'Migrating...' : 'Re-run Migration'}
                </button>

                <button 
                  className="btn" 
                  onClick={toggleStorageDriver}
                  style={{ background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: 12, fontWeight: 600 }}
                >
                  {storageDriver === 'indexeddb' ? 'Rollback to localStorage' : 'Switch to IndexedDB'}
                </button>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5, background: 'var(--bg-app)', padding: 12, borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
                <strong>Data Protection Guarantee:</strong> PromptKeeper preserves your legacy data in localStorage at all times as an offline safety rollback. Dual persistence writes mutations simultaneously to IndexedDB and localStorage.
              </div>
            </div>
          )}

          <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px dashed var(--border-light)', display: 'flex', justifyContent: 'center' }}>
            <button 
              className="btn btn-g" 
              onClick={resetVault}
              style={{ background: 'transparent', border: '1px solid #ff4444', color: '#ff4444', fontSize: 11, padding: '8px 16px', opacity: 0.7, display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onMouseOver={e => e.currentTarget.style.opacity = 1}
              onMouseOut={e => e.currentTarget.style.opacity = 0.7}
            >
              <AlertTriangle size={13} /> Wipe Vault & Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
