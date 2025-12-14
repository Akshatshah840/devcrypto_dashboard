import '@testing-library/jest-dom';

// Mock import.meta.env for Vite compatibility
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_COGNITO_USER_POOL_ID: 'test-pool-id',
        VITE_COGNITO_USER_POOL_CLIENT_ID: 'test-client-id',
        VITE_COGNITO_REGION: 'us-east-1',
        MODE: 'test',
        DEV: false,
        PROD: false,
        SSR: false
      }
    }
  }
});

// Mock window.matchMedia for tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator.onLine for tests
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock ResizeObserver for tests
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));