import { useCallback } from 'react';
import { useLocalStorage } from '../hooks.js';

export function useModels({ toast, setPrompts, modelFilter, setModelFilter }) {
  const [modelColors, setModelColors] = useLocalStorage('pk_model_colors', {
    'GPT-4':   '#EBA328', // Golden
    'GPT-3.5': '#EDD8DF', // Cream
    'Claude':  '#AB6937', // Rust
    'Gemini':  '#E8C2B3', // Rose
    'Llama':   '#1E4445', // Teal
    'Mistral': '#233436', // Slate
    'DeepSeek': '#3B82F6',
  });

  const addModel = useCallback((name) => {
    if (!name || modelColors[name]) return;
    setModelColors(prev => ({ ...prev, [name]: '#cccccc' }));
    if (toast) toast(`Model "${name}" added`, 'violet');
  }, [modelColors, setModelColors, toast]);

  const updateModelColor = useCallback((model, color) => {
    setModelColors(prev => ({ ...prev, [model]: color }));
  }, [setModelColors]);

  const renameModel = useCallback((oldName, newName) => {
    if (!newName || modelColors[newName] || oldName === newName) return;
    setModelColors(prev => {
      const next = { ...prev, [newName]: prev[oldName] };
      delete next[oldName];
      return next;
    });
    if (setPrompts) setPrompts(prev => prev.map(p => p.model === oldName ? { ...p, model: newName } : p));
    if (modelFilter === oldName && setModelFilter) setModelFilter(newName);
    if (toast) toast(`Model renamed to "${newName}"`, 'violet');
  }, [modelColors, modelFilter, setModelColors, setPrompts, setModelFilter, toast]);

  const deleteModel = useCallback((model) => {
    setModelColors(prev => {
      const next = { ...prev };
      delete next[model];
      return next;
    });
    if (setPrompts) setPrompts(prev => prev.map(p => p.model === model ? { ...p, model: 'Any' } : p));
    if (modelFilter === model && setModelFilter) setModelFilter('All');
    if (toast) toast(`Model "${model}" removed`, 'danger');
  }, [modelFilter, setModelColors, setPrompts, setModelFilter, toast]);

  return {
    modelColors,
    setModelColors,
    addModel,
    updateModelColor,
    renameModel,
    deleteModel
  };
}
