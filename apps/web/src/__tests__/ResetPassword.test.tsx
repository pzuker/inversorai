import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock Supabase methods
const mockExchangeCodeForSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockGetSession = vi.fn();
const mockUpdateUser = vi.fn();
const mockSignOut = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: (code: string) => mockExchangeCodeForSession(code),
      onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
        mockOnAuthStateChange(callback);
        return {
          data: {
            subscription: {
              unsubscribe: vi.fn(),
            },
          },
        };
      },
      getSession: () => mockGetSession(),
      updateUser: (params: { password: string }) => mockUpdateUser(params),
      signOut: () => mockSignOut(),
    },
  },
}));

// Mock useSearchParams with controlled value
let mockSearchParamsCode: string | null = null;

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === 'code' ? mockSearchParamsCode : null),
  }),
}));

// Import after mocks
import ResetPasswordPage from '@/app/reset-password/page';

describe('Reset Password Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParamsCode = null;
    // Default: no session
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  describe('invalid link scenarios', () => {
    it('shows "Invalid or Expired Link" when code exchange fails', async () => {
      mockSearchParamsCode = 'invalid-code';
      mockExchangeCodeForSession.mockResolvedValue({
        error: { message: 'Invalid code' },
      });

      render(<ResetPasswordPage />);

      await waitFor(
        () => {
          expect(screen.getByText('Invalid or Expired Link')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText(/password reset link is invalid or has expired/i)).toBeInTheDocument();
      expect(screen.getByText('Go to Login')).toBeInTheDocument();
    });

    it('shows "Invalid or Expired Link" when code exchange throws exception', async () => {
      mockSearchParamsCode = 'bad-code';
      mockExchangeCodeForSession.mockRejectedValue(new Error('Network error'));

      render(<ResetPasswordPage />);

      await waitFor(
        () => {
          expect(screen.getByText('Invalid or Expired Link')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('recovery mode scenarios', () => {
    it('shows password form when code exchange succeeds', async () => {
      mockSearchParamsCode = 'valid-code';
      mockExchangeCodeForSession.mockResolvedValue({
        error: null,
        data: { session: { user: { id: 'user-123' } } },
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update Password' })).toBeInTheDocument();
    });

    it('shows password form when session exists (recovery link clicked)', async () => {
      mockSearchParamsCode = null; // No code in URL
      mockGetSession.mockResolvedValue({
        data: {
          session: { user: { id: 'user-123' }, access_token: 'token' },
        },
      });

      render(<ResetPasswordPage />);

      await waitFor(() => {
        expect(screen.getByText('Set New Password')).toBeInTheDocument();
      });

      expect(screen.getByLabelText('New Password')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
    });
  });
});
