import { useState, useMemo } from 'react';
import { 
  X, 
  AlertCircle, 
  Plus, 
  FolderGit2, 
  Check, 
  Star,
  Sparkles,
  Play
} from 'lucide-react';
import { TagPill, VarHighlight, ModelBadge } from './UI.jsx';
import { extractVars } from '../data.js';
import { useApp } from '../context/AppContext.jsx';
import { BENTO_CARD_COLORS, getDeepCardColor } from '../constants/repositoryConstants.js';

export default function PromptModal() {
  const {
    editPrompt: initial,
    prompts,
    categories,
    modelColors,
    savePrompt: onSave,
    setShowModal,
    setEditPrompt,
    addCategory: onAddCat,
    addModel: onAddModel,
    repositories,
    openRunner,
    openOptimizer
  } = useApp();

  const onClose = () => {
    setShowModal(false);
    setEditPrompt(null);
  };
  const empty = { title: '', body: '', tags: [], category: 'Coding', model: Object.keys(modelColors)[0] || 'Claude', fav: false, color: '', notes: '', linkedPromptId: null, linkedRepoIds: [] };
  const [form, setForm] = useState(initial || empty);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');
  
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');

  const vars = extractVars(form.body);

  const allTags = useMemo(() => {
    const set = new Set();
    prompts.forEach(p => p.tags?.forEach(t => set.add(t)));
    return Array.from(set).sort();
  }, [prompts]);

  const suggestions = useMemo(() => {
    if (!tagInput) return [];
    const q = tagInput.toLowerCase();
    return allTags.filter(t => t.toLowerCase().includes(q) && !form.tags.includes(t)).slice(0, 5);
  }, [tagInput, allTags, form.tags]);

  function addTag(tagOverride) {
    const t = (tagOverride || tagInput).trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !form.tags.includes(t)) setForm({ ...form, tags: [...form.tags, t] });
    setTagInput('');
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_dim = 800;
        
        if (width > height) {
          if (width > max_dim) {
            height *= max_dim / width;
            width = max_dim;
          }
        } else {
          if (height > max_dim) {
            width *= max_dim / height;
            height = max_dim;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setForm(prev => ({ ...prev, thumbnail: dataUrl, images: [dataUrl] }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  function toggleJsonMode() {
    if (jsonMode) {
      try {
        const parsed = JSON.parse(jsonText);
        setForm({ ...form, ...parsed });
        setError('');
        setJsonMode(false);
      } catch (e) {
        setError('Invalid JSON: ' + e.message);
      }
    } else {
      setJsonText(JSON.stringify(form, null, 2));
      setError('');
      setJsonMode(true);
    }
  }

  function save() {
    let finalForm = form;
    if (jsonMode) {
      try {
        finalForm = { ...form, ...JSON.parse(jsonText) };
      } catch (e) {
        setError('Invalid JSON: ' + e.message);
        return;
      }
    }
    
    if (!finalForm.title?.trim()) { setError('Title is required'); return; }
    if (!finalForm.body?.trim()) { setError('Prompt body is required'); return; }
    
    if (finalForm.category && onAddCat) onAddCat(finalForm.category);
    if (finalForm.model && onAddModel) onAddModel(finalForm.model);

    onSave({
      ...finalForm,
      id: initial?.id || Date.now(),
      uses: initial?.uses || 0,
      created: initial?.created || Date.now(),
      history: initial?.history || [],
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="industrial-modal"
        onClick={e => e.stopPropagation()}
        style={{ maxHeight: '90vh', maxWidth: 760 }}
      >
        {/* Header */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'var(--bg-surface-hover)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: 0.3 }}>
            {initial ? 'Edit Prompt' : 'New Prompt'}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button 
              onClick={toggleJsonMode}
              className="btn btn-sm"
              style={{ background: jsonMode ? 'var(--accent-muted)' : 'transparent', color: jsonMode ? 'var(--accent)' : 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontWeight: 600, fontSize: 11, padding: '4px 10px', borderRadius: 'var(--radius-sm)' }}
            >
              {jsonMode ? 'Switch to Form' : '{ } JSON Mode'}
            </button>
            <button onClick={onClose} style={{ background: 'transparent', color: 'var(--text-tertiary)', border: 'none', cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '12px 16px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                <AlertCircle size={16} />
                <span>Error: {error}</span>
              </div>
            )}

            {jsonMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <label className="lbl" style={{ marginBottom: 8 }}>Raw JSON Data</label>
                <textarea
                  value={jsonText}
                  onChange={e => { setJsonText(e.target.value); setError(''); }}
                  style={{ 
                    minHeight: 440, 
                    fontSize: 13, 
                    lineHeight: 1.6, 
                    border: '1px solid var(--border-light)', 
                    background: 'rgba(0,0,0,0.2)',
                    color: 'var(--text)',
                    fontFamily: 'JetBrains Mono,monospace',
                    fontWeight: 400,
                    padding: '20px',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  spellCheck={false}
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="lbl" style={{ marginBottom: 8 }}>Prompt Title</label>
                  <input
                    value={form.title}
                    onChange={e => { setForm({ ...form, title: e.target.value }); setError(''); }}
                    placeholder="Enter prompt title..."
                    style={{ fontSize: 15, fontWeight: 500, border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="lbl" style={{ marginBottom: 8 }}>Collection</label>
                    <input 
                      list="cat-list" 
                      value={form.category} 
                      onChange={e => setForm({ ...form, category: e.target.value })} 
                      placeholder="Select or type..."
                      style={{ border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, fontWeight: 500, width: '100%' }}
                    />
                    <datalist id="cat-list">
                      {categories.filter(c => c !== 'All').map(c => <option key={c} value={c} />)}
                    </datalist>
                  </div>
                  <div>
                    <label className="lbl" style={{ marginBottom: 8 }}>Target AI Model</label>
                    <input 
                      list="model-list" 
                      value={form.model} 
                      onChange={e => setForm({ ...form, model: e.target.value })} 
                      placeholder="Select or type..."
                      style={{ border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, fontWeight: 500, width: '100%' }}
                    />
                    <datalist id="model-list">
                      {Object.keys(modelColors).map(m => <option key={m} value={m} />)}
                    </datalist>
                  </div>
                </div>

                {/* Card Accent Color */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label className="lbl">Card Accent Color</label>
                    <span style={{ fontSize: 10, color: 'var(--text-sub)', fontFamily: 'Geist Mono, monospace' }}>
                      {BENTO_CARD_COLORS.find(c => c.color === (form.color || '') || (form.color && c.color === getDeepCardColor(form.color)))?.label || 'Obsidian'}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'rgba(0, 0, 0, 0.2)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)'
                  }}>
                    {BENTO_CARD_COLORS.map(c => {
                      const isSelected = (form.color || '') === c.color || (form.color && getDeepCardColor(form.color) === c.color);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setForm({ ...form, color: c.color })}
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

                <div>
                  <label className="lbl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>Prompt Template</span>
                      <span style={{ color: 'var(--text-sub)', fontSize: 11, fontWeight: 500 }}>
                        (Tip: use {'{{var}}'})
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Auto Optimize Button */}
                      <button
                        type="button"
                        onClick={() => openOptimizer({
                          initialText: form.body,
                          promptTitle: form.title || 'Draft Prompt',
                          onApply: (newBody) => setForm(prev => ({ ...prev, body: newBody }))
                        })}
                        style={{
                          background: 'rgba(232, 255, 31, 0.08)',
                          border: '1px solid rgba(232, 255, 31, 0.25)',
                          color: 'var(--accent)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Optimize prompt structure with AI best practices"
                      >
                        <Sparkles size={11} />
                        <span>Auto-Optimize</span>
                      </button>

                      {/* Test Runner Button */}
                      <button
                        type="button"
                        onClick={() => openRunner({ ...form, title: form.title || 'Untitled Draft' })}
                        style={{
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.12)',
                          color: 'var(--text)',
                          borderRadius: 6,
                          padding: '3px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                        title="Test variable substitution before saving"
                      >
                        <Play size={10} fill="currentColor" />
                        <span>Test & Run</span>
                      </button>
                    </div>
                  </label>
                  <textarea
                    value={form.body}
                    onChange={e => { setForm({ ...form, body: e.target.value }); setError(''); }}
                    placeholder="Construct your prompt template...&#10;&#10;Example: Write a {{tone}} summary about {{subject}}."
                    style={{ minHeight: 240, fontSize: 13, lineHeight: 1.7, border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontWeight: 400, fontFamily: 'JetBrains Mono,monospace', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  {vars.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span className="ft" style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, letterSpacing: 0.5 }}>Detected Variables:</span>
                      {vars.map(v => (
                        <span key={v} style={{ fontSize: 11, color: 'var(--primary)', background: 'var(--primary-glow)', padding: '4px 10px', borderRadius: '100px', border: '1px solid var(--primary)', fontWeight: 600 }}>
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <label className="lbl" style={{ marginBottom: 8 }}>Tags</label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <input
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); } }}
                      placeholder="Type a tag and press Enter..."
                      style={{ flex: 1, fontSize: 13, border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--text)' }}
                    />
                    <button className="btn btn-v" onClick={() => addTag()} style={{ flexShrink: 0, padding: '0 20px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Plus size={13} />
                      <span>Add</span>
                    </button>
                  </div>
                  
                  {suggestions.length > 0 && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      background: 'var(--bg-panel)', border: '1px solid var(--border-light)',
                      zIndex: 10, marginTop: 8, boxShadow: 'var(--shadow-soft)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', backdropFilter: 'blur(16px)'
                    }}>
                      {suggestions.map(t => (
                        <div
                          key={t}
                          onClick={() => addTag(t)}
                          style={{ padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', fontSize: 13, fontWeight: 500, color: 'var(--text)', transition: 'background 0.2s' }}
                          onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                          onMouseOut={e => e.target.style.background = 'transparent'}
                        >
                          #{t}
                        </div>
                      ))}
                    </div>
                  )}

                  {form.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                      {form.tags.map(t => (
                        <TagPill key={t} tag={t} removable onRemove={() => setForm({ ...form, tags: form.tags.filter(x => x !== t) })} />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="lbl" style={{ marginBottom: 8 }}>Thumbnail Image</label>
                  {form.thumbnail ? (
                    <div style={{ position: 'relative', width: 120, height: 120, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                      <img src={form.thumbnail} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button 
                        onClick={() => setForm(f => ({ ...f, thumbnail: null, images: [] }))}
                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(239,68,68,0.8)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--border-light)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        style={{ fontSize: 13, color: 'var(--text-sub)' }}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="lbl" style={{ marginBottom: 8 }}>Additional Notes</label>
                  <textarea
                    value={form.notes || ''}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Extra context, implementation notes, or usage tips..."
                    style={{ minHeight: 100, fontSize: 13, border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontWeight: 400 }}
                  />
                </div>

                <div>
                  <label className="lbl" style={{ marginBottom: 8 }}>Next in Prompt Chain</label>
                  <select 
                    value={form.linkedPromptId || ''} 
                    onChange={e => setForm({ ...form, linkedPromptId: e.target.value || null })} 
                    style={{ border: '1px solid var(--border-light)', background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, fontWeight: 500 }}
                  >
                    <option value="" style={{ background: 'var(--bg-panel)' }}>No linked prompt</option>
                    {prompts.filter(p => p.id !== initial?.id).map(p => (
                      <option key={p.id} value={p.id} style={{ background: 'var(--bg-panel)' }}>{p.title}</option>
                    ))}
                  </select>
                </div>

                {repositories && repositories.length > 0 && (
                  <div>
                    <label className="lbl" style={{ marginBottom: 8 }}>Link to GitHub Repositories</label>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {repositories.map(repo => {
                        const currentLinked = form.linkedRepoIds || [];
                        const isLinked = currentLinked.includes(repo.id) || currentLinked.includes(repo.fullName);
                        return (
                          <button
                            key={repo.id}
                            type="button"
                            onClick={() => {
                              const next = isLinked
                                ? currentLinked.filter(id => id !== repo.id && id !== repo.fullName)
                                : [...currentLinked, repo.fullName];
                              setForm({ ...form, linkedRepoIds: next });
                            }}
                            style={{
                              background: isLinked ? 'rgba(59, 130, 246, 0.2)' : 'rgba(0,0,0,0.2)',
                              border: isLinked ? '1px solid var(--color-blue)' : '1px solid var(--border-light)',
                              color: isLinked ? 'var(--color-blue)' : 'var(--text-sub)',
                              borderRadius: 4,
                              padding: '6px 12px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}
                          >
                            <FolderGit2 size={13} />
                            <span>{repo.fullName}</span>
                            {isLinked ? <Check size={11} /> : <Plus size={11} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', marginTop: 8 }}>
                  <input
                    type="checkbox"
                    id="fav-cb"
                    checked={form.fav}
                    onChange={e => setForm({ ...form, fav: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <label htmlFor="fav-cb" style={{ fontSize: 13, color: 'var(--text)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Star size={13} fill={form.fav ? 'currentColor' : 'none'} style={{ color: 'var(--accent)' }} />
                    <span>Pin to favorites</span>
                  </label>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0, background: 'var(--bg-surface-hover)' }}>
          <button className="btn btn-sm" onClick={onClose} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', padding: '9px 22px' }}>
            Cancel
          </button>
          <button className="btn btn-sm" onClick={save} style={{ background: 'var(--accent)', border: 'none', color: '#000', fontWeight: 700, padding: '9px 24px', boxShadow: 'var(--shadow-primary)' }}>
            {initial ? 'Save Changes' : 'Create Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}
