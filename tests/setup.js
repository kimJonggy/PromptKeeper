import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';

// Mock clipboard if not supported in jsdom
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: async () => {},
      readText: async () => '',
    },
    configurable: true,
  });
}

