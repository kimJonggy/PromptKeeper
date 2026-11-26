import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage(key, init) {
  const [state, setState] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : init;
    } catch {
      return init;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.warn(`Failed to persist ${key} to localStorage:`, e);
    }
  }, [key, state]);

  return [state, setState];
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const show = useCallback((msg, type = 'cyan') => {
    const id = ++idRef.current;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 2400);
  }, []);

  return { toasts, show };
}

export function useKeyboard(handlers) {
  const handlersRef = useRef(handlers);
  
  // Keep the ref updated with the latest handlers
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    function onKey(e) {
      // Don't trigger if typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;
      
      const key = (e.metaKey || e.ctrlKey ? 'cmd+' : '') + e.key.toLowerCase();
      if (handlersRef.current[key]) {
        e.preventDefault();
        handlersRef.current[key]();
      }
    }
    
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // Only attach once
}
