import { jest } from '@jest/globals';

// Mock Next.js router
export const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
};

// Setup Next.js router mock
export const setupRouterMock = () => {
  jest.mock('next/navigation', () => ({
    useRouter: () => mockRouter,
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  }));
  
  return mockRouter;
};

// Mock Supabase client
export const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  auth: {
    getUser: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    }),
  },
};

// Setup Supabase mock
export const setupSupabaseMock = () => {
  jest.mock('@/lib/supabase', () => ({
    supabase: mockSupabase,
  }));
  
  return mockSupabase;
};

// Setup fetch mock
export const setupFetchMock = (mockData: any) => {
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => mockData,
  });
  
  global.fetch = mockFetch;
  
  return mockFetch;
};

// Clean up all mocks
export const cleanupMocks = () => {
  jest.clearAllMocks();
  
  if (global.fetch) {
    (global.fetch as jest.Mock).mockClear();
  }
};

// Export all mocks for convenience
export const mocks = {
  router: mockRouter,
  supabase: mockSupabase,
  setupRouterMock,
  setupSupabaseMock,
  setupFetchMock,
  cleanupMocks,
}; 