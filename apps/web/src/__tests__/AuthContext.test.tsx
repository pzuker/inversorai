import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Mock Supabase client
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
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
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Test component to access auth context
function TestConsumer() {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;

  const isAdmin = user?.app_metadata?.inversorai_role === 'ADMIN';

  return (
    <div>
      <span data-testid="user-email">{user?.email ?? 'none'}</span>
      <span data-testid="is-admin">{isAdmin ? 'true' : 'false'}</span>
      <span data-testid="role">{user?.app_metadata?.inversorai_role ?? 'none'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('when user has app_metadata.inversorai_role=ADMIN, isAdmin=true', async () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      app_metadata: {
        inversorai_role: 'ADMIN',
      },
    };

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: adminUser,
          access_token: 'test-token',
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('user-email')).toHaveTextContent('admin@example.com');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('true');
    expect(screen.getByTestId('role')).toHaveTextContent('ADMIN');
  });

  it('when user has app_metadata.inversorai_role=USER, isAdmin=false', async () => {
    const regularUser = {
      id: 'user-123',
      email: 'user@example.com',
      app_metadata: {
        inversorai_role: 'USER',
      },
    };

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: regularUser,
          access_token: 'test-token',
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com');
    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('USER');
  });

  it('when user has no app_metadata.inversorai_role, isAdmin=false', async () => {
    const userWithoutRole = {
      id: 'user-456',
      email: 'norole@example.com',
      app_metadata: {},
    };

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: userWithoutRole,
          access_token: 'test-token',
        },
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('is-admin')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('none');
  });
});
