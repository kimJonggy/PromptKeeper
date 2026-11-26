import { useCallback } from 'react';
import { useLocalStorage } from '../hooks.js';
import { DEFAULT_CAT_COLORS } from '../data.js';

export function useCategories({ toast, setPrompts, catFilter, setCatFilter }) {
  const [categories, setCategories] = useLocalStorage('pk_categories', ['All', 'Coding', 'Creative', 'Business', 'System', 'Research', 'Personal']);
  const [categoryColors, setCategoryColors] = useLocalStorage('pk_cat_colors', DEFAULT_CAT_COLORS);

  const addCategory = useCallback((name) => {
    if (!name || categories.includes(name)) return;
    setCategories(prev => [...prev, name]);
    setCategoryColors(prev => ({ ...prev, [name]: DEFAULT_CAT_COLORS['All'] }));
    if (toast) toast(`Collection "${name}" created`, 'violet');
  }, [categories, setCategories, setCategoryColors, toast]);

  const renameCategory = useCallback((oldName, newName) => {
    if (!newName || categories.includes(newName) || oldName === 'All') return;
    setCategories(prev => prev.map(c => c === oldName ? newName : c));
    setCategoryColors(prev => {
      const next = { ...prev, [newName]: prev[oldName] };
      delete next[oldName];
      return next;
    });
    if (setPrompts) setPrompts(prev => prev.map(p => p.category === oldName ? { ...p, category: newName } : p));
    if (catFilter === oldName && setCatFilter) setCatFilter(newName);
    if (toast) toast(`Collection renamed to "${newName}"`, 'violet');
  }, [categories, catFilter, setCategories, setCategoryColors, setPrompts, setCatFilter, toast]);

  const deleteCategory = useCallback((name) => {
    if (name === 'All') return;
    setCategories(prev => prev.filter(c => c !== name));
    if (setPrompts) setPrompts(prev => prev.map(p => p.category === name ? { ...p, category: 'All' } : p));
    if (catFilter === name && setCatFilter) setCatFilter('All');
    if (toast) toast(`Collection "${name}" removed`, 'danger');
  }, [catFilter, setCategories, setPrompts, setCatFilter, toast]);

  const reorderCategory = useCallback((index, direction) => {
    const newIdx = index + direction;
    if (newIdx < 0 || newIdx >= categories.length || categories[index] === 'All' || categories[newIdx] === 'All') return;
    setCategories(prev => {
      const next = [...prev];
      [next[index], next[newIdx]] = [next[newIdx], next[index]];
      return next;
    });
  }, [categories, setCategories]);

  return {
    categories,
    setCategories,
    categoryColors,
    setCategoryColors,
    addCategory,
    renameCategory,
    deleteCategory,
    reorderCategory
  };
}
