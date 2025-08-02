// Jest setup file for Scout Attendance App tests

// Mock localStorage
const localStorageMock = {
  store: {},
  getItem: jest.fn((key) => localStorageMock.store[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageMock.store[key] = value.toString();
  }),
  removeItem: jest.fn((key) => {
    delete localStorageMock.store[key];
  }),
  clear: jest.fn(() => {
    localStorageMock.store = {};
  })
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock URL for file downloads
global.URL = {
  createObjectURL: jest.fn(() => 'mocked-url'),
  revokeObjectURL: jest.fn()
};

// Mock Blob for file operations
global.Blob = jest.fn((content, options) => ({
  content,
  options
}));

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.store = {};
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Helper to set up DOM elements for testing
global.setupDOM = (html) => {
  document.body.innerHTML = html;
};

// Helper to clean up DOM after tests
global.cleanupDOM = () => {
  document.body.innerHTML = '';
};

// Mock console methods to reduce test noise
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn()
};