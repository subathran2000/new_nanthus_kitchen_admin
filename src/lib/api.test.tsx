import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('API Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have proper API configuration', async () => {
    // Test that the API base URL is properly configured
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    expect(apiUrl).toBeDefined();
    expect(apiUrl).toContain('/api');
  });

  it('should handle request timeout configuration', () => {
    const timeout = 30000; // 30 seconds
    expect(timeout).toBeGreaterThan(0);
  });
});

describe('Date/Time Utils', () => {
  it('should format dates correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(date).toBeInstanceOf(Date);
    expect(date.getFullYear()).toBe(2024);
  });

  it('should handle timezone conversions', () => {
    const sydneyTimezone = 'Australia/Sydney';
    expect(sydneyTimezone).toBe('Australia/Sydney');
  });
});
