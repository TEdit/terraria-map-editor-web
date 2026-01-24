/**
 * Vitest setup file
 * Runs before tests to set up mocks and global state
 */

// Mock localStorage for jsdom environment
const localStorageMock = {
  getItem: (key) => {
    return localStorageMock._storage[key] || null;
  },
  setItem: (key, value) => {
    localStorageMock._storage[key] = value.toString();
  },
  removeItem: (key) => {
    delete localStorageMock._storage[key];
  },
  clear: () => {
    localStorageMock._storage = {};
  },
  _storage: {}
};

// Add localStorage to global scope before tests run
global.localStorage = localStorageMock;

// Initialize with default settings
localStorage.setItem('settings', JSON.stringify({}));
