import { useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks.js';
import { validatePrompt } from '../utils/validation.js';
import { promptRepository } from '../db/repository.js';
import { isIndexedDBSupported } from '../db/index.js';
import { STORAGE_DRIVER_KEY } from '../db/migrationService.js';

export function usePrompts({ 
  toast, 
  setIsStudioView, 
  setShowModal, 
  setEditPrompt, 
  editPrompt, 
  setActiveId, 
  setCopySuccess,
  tagFilter,
  setTagFilter
}) {
  const [prompts, setPrompts] = useLocalStorage('pk_prompts_v2', []);

  // Hydrate from IndexedDB on initial mount if driver is set to indexeddb
  useEffect(() => {
    let isMounted = true;
    async function hydrate() {
      if (!isIndexedDBSupported()) return;
      const driver = localStorage.getItem(STORAGE_DRIVER_KEY);
      if (driver === 'indexeddb') {
        try {
          const dbPrompts = await promptRepository.getAll();
          if (isMounted && dbPrompts && dbPrompts.length > 0) {
            setPrompts(dbPrompts);
          }
        } catch (err) {
          console.warn('Failed to hydrate prompts from IndexedDB:', err);
        }
      }
    }
    hydrate();
    return () => { isMounted = false; };
  }, [setPrompts]);

  const autoTag = useCallback((body, existingTags = []) => {
    const keywords = {
      'code': ['coding', 'dev', 'programming'],
      'react': ['react', 'frontend', 'js'],
      'email': ['email', 'writing', 'business'],
      'blog': ['writing', 'content', 'seo'],
      'story': ['creative', 'fiction'],
      'sql': ['database', 'query'],
      'css': ['styling', 'ui'],
      'fix': ['debug', 'fix'],
    };
    const newTags = [...existingTags];
    const text = (body || '').toLowerCase();
    Object.entries(keywords).forEach(([key, tags]) => {
      if (text.includes(key)) {
        tags.forEach(t => { if (!newTags.includes(t)) newTags.push(t); });
      }
    });
    return newTags;
  }, []);

  const sanitizePrompt = useCallback((p) => {
    const { sanitized } = validatePrompt(p);
    return {
      ...sanitized,
      tags: autoTag(sanitized.body, sanitized.tags || [])
    };
  }, [autoTag]);

  const savePrompt = useCallback(p => {
    const finalPrompt = sanitizePrompt(p);
    let recordToPersist = finalPrompt;
    
    setPrompts(prev => {
      const exists = prev.find(x => String(x.id) === String(finalPrompt.id));
      if (exists) {
        let versions = Array.isArray(exists.versions) ? [...exists.versions] : [];
        if (exists.body !== finalPrompt.body || exists.title !== finalPrompt.title) {
          versions = [
            {
              version: versions.length + 1,
              timestamp: Date.now(),
              title: exists.title,
              body: exists.body,
              model: exists.model,
              note: 'Snapshot before update'
            },
            ...versions
          ];
        }
        recordToPersist = { ...finalPrompt, versions };
        return prev.map(x => String(x.id) === String(finalPrompt.id) ? recordToPersist : x);
      }
      return [finalPrompt, ...prev];
    });

    // Dual-write to IndexedDB
    if (isIndexedDBSupported()) {
      promptRepository.save(recordToPersist).catch(err => {
        console.warn('Failed saving prompt to IndexedDB:', err);
      });
    }

    if (setIsStudioView) setIsStudioView(false);
    if (setShowModal) setShowModal(false);
    if (setEditPrompt) setEditPrompt(null);
    if (toast) toast(p?.id && editPrompt ? 'Prompt updated ✓' : 'Prompt created ✓', 'violet');
  }, [editPrompt, sanitizePrompt, setPrompts, setIsStudioView, setShowModal, setEditPrompt, toast]);

  const deletePrompt = useCallback(id => {
    setPrompts(prev => prev
      .filter(p => String(p.id) !== String(id))
      .map(p => String(p.linkedPromptId) === String(id) ? { ...p, linkedPromptId: null } : p)
    );

    // Dual-delete from IndexedDB
    if (isIndexedDBSupported()) {
      promptRepository.delete(id).catch(err => {
        console.warn('Failed deleting prompt from IndexedDB:', err);
      });
    }

    if (setActiveId) setActiveId(null);
    if (toast) toast('Prompt deleted', 'danger');
  }, [setPrompts, setActiveId, toast]);

  const toggleFav = useCallback(id => {
    setPrompts(prev => {
      const updated = prev.map(p => String(p.id) === String(id) ? { ...p, fav: !p.fav } : p);
      const target = updated.find(p => String(p.id) === String(id));
      if (target && isIndexedDBSupported()) {
        promptRepository.save(target).catch(console.warn);
      }
      return updated;
    });
  }, [setPrompts]);

  const copyPrompt = useCallback(async (p, _withVars = false, customText = null) => {
    const textToCopy = customText || p.body;
    let copiedSuccessfully = false;

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        copiedSuccessfully = true;
      } catch (err) {
        console.warn('Clipboard writeText failed:', err);
      }
    }

    // Always update uses and notify user if copy succeeded or as fallback in non-secure context
    setPrompts(prev => {
      const updated = prev.map(x =>
        String(x.id) === String(p.id)
          ? { ...x, uses: (x.uses || 0) + 1, history: [...(x.history || []), (x.uses || 0) + 1] }
          : x
      );
      const target = updated.find(x => String(x.id) === String(p.id));
      if (target && isIndexedDBSupported()) {
        promptRepository.save(target).catch(console.warn);
      }
      return updated;
    });

    if (setCopySuccess) setCopySuccess({ title: p.title, body: textToCopy });
    if (toast) {
      toast(copiedSuccessfully ? 'Copied to clipboard ✓' : 'Prompt ready to copy ✓', 'cyan');
    }
  }, [setPrompts, setCopySuccess, toast]);

  const importPrompts = useCallback(imported => {
    const existingIds = new Set(prompts.map(p => String(p.id)));
    const newOnes = [];
    let skippedCount = 0;

    imported.forEach(raw => {
      const { sanitized, isValid } = validatePrompt(raw);
      if (!isValid) return;

      if (existingIds.has(String(sanitized.id))) {
        skippedCount++;
      } else {
        newOnes.push(sanitized);
        existingIds.add(String(sanitized.id));
      }
    });

    const newCount = newOnes.length;
    if (newCount > 0) {
      setPrompts(prev => [...prev, ...newOnes]);
      if (isIndexedDBSupported()) {
        newOnes.forEach(p => promptRepository.save(p).catch(console.warn));
      }
    }

    if (toast) {
      if (newCount === 0 && skippedCount > 0) {
        toast(`0 new prompts imported (${skippedCount} duplicates skipped)`, 'cyan');
      } else if (skippedCount > 0) {
        toast(`Imported ${newCount} prompts (${skippedCount} duplicates skipped) ✓`, 'cyan');
      } else {
        toast(`Imported ${newCount} prompts ✓`, 'cyan');
      }
    }
  }, [prompts, setPrompts, toast]);

  const updatePrompt = useCallback(p => {
    const cleaned = sanitizePrompt(p);
    setPrompts(prev => prev.map(x => String(x.id) === String(cleaned.id) ? cleaned : x));
    if (isIndexedDBSupported()) {
      promptRepository.save(cleaned).catch(console.warn);
    }
  }, [sanitizePrompt, setPrompts]);

  const renameTag = useCallback((oldTag, newTag) => {
    if (!newTag || oldTag === newTag) return;
    setPrompts(prev => {
      const updated = prev.map(p => ({
        ...p,
        tags: p.tags.map(t => t === oldTag ? newTag : t)
      }));
      if (isIndexedDBSupported()) {
        updated.forEach(p => promptRepository.save(p).catch(console.warn));
      }
      return updated;
    });
    if (tagFilter === oldTag && setTagFilter) setTagFilter(newTag);
    if (toast) toast(`Tag updated to #${newTag}`, 'cyan');
  }, [setPrompts, tagFilter, setTagFilter, toast]);

  const deleteTag = useCallback((tag) => {
    setPrompts(prev => {
      const updated = prev.map(p => ({
        ...p,
        tags: p.tags.filter(t => t !== tag)
      }));
      if (isIndexedDBSupported()) {
        updated.forEach(p => promptRepository.save(p).catch(console.warn));
      }
      return updated;
    });
    if (tagFilter === tag && setTagFilter) setTagFilter('');
    if (toast) toast(`Tag #${tag} removed`, 'danger');
  }, [setPrompts, tagFilter, setTagFilter, toast]);

  const restorePromptVersion = useCallback((id, versionSnapshot) => {
    let restoredRecord = null;
    setPrompts(prev => prev.map(p => {
      if (String(p.id) !== String(id)) return p;
      const currentVersions = Array.isArray(p.versions) ? [...p.versions] : [];
      const newSnapshot = {
        version: currentVersions.length + 1,
        timestamp: Date.now(),
        title: p.title,
        body: p.body,
        model: p.model,
        note: `Snapshot before restoring v${versionSnapshot.version}`
      };
      restoredRecord = {
        ...p,
        title: versionSnapshot.title || p.title,
        body: versionSnapshot.body || p.body,
        model: versionSnapshot.model || p.model,
        versions: [newSnapshot, ...currentVersions]
      };
      return restoredRecord;
    }));

    if (restoredRecord && isIndexedDBSupported()) {
      promptRepository.save(restoredRecord).catch(console.warn);
    }

    if (toast) toast(`Restored to version ${versionSnapshot.version} ✓`, 'violet');
  }, [setPrompts, toast]);

  return {
    prompts,
    setPrompts,
    savePrompt,
    deletePrompt,
    toggleFav,
    copyPrompt,
    importPrompts,
    updatePrompt,
    renameTag,
    deleteTag,
    restorePromptVersion
  };
}
