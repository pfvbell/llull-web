// src/tests/setupTests.ts
import '@testing-library/jest-dom';

// Mock the ResizeObserver which is used by some React components
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: jest.fn().mockReturnValue('/'),
  useSearchParams: jest.fn().mockReturnValue(new URLSearchParams()),
}));

// Suppress console errors during tests
const originalConsoleError = console.error;
console.error = (...args) => {
  // Ignore specific React-related errors
  if (
    typeof args[0] === 'string' && 
    (args[0].includes('Warning: ReactDOM.render') || 
     args[0].includes('Warning: React.createFactory'))
  ) {
    return;
  }
  originalConsoleError(...args);
}; 