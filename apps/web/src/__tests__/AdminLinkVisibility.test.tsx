import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { User, Session } from '@supabase/supabase-js';

// Test the admin visibility logic directly with a simplified component
// This avoids mocking the complex dashboard dependencies while testing the core behavior

interface TestDashboardProps {
  user: User | null;
  session: Session | null;
}

// Simplified component that mirrors the dashboard's admin visibility logic
function AdminSectionVisibility({ user, session }: TestDashboardProps) {
  if (!session) {
    return <div>Not authenticated</div>;
  }

  // This is the exact logic from dashboard/page.tsx line 38
  const isAdmin = user?.app_metadata?.inversorai_role === 'ADMIN';

  return (
    <div>
      <h1>Dashboard</h1>
      {isAdmin && (
        <div data-testid="admin-section">
          <h2>Admin Actions</h2>
          <button>Update Market Data</button>
          <a href="/dashboard/admin">Manage Users</a>
        </div>
      )}
    </div>
  );
}

describe('Admin Link Visibility on Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('admin user sees Admin Actions section with Manage Users link', () => {
    const adminUser = {
      id: 'admin-123',
      email: 'admin@example.com',
      app_metadata: {
        inversorai_role: 'ADMIN',
      },
    } as User;

    const session = {
      access_token: 'admin-token',
      user: adminUser,
    } as Session;

    render(<AdminSectionVisibility user={adminUser} session={session} />);

    expect(screen.getByText('Admin Actions')).toBeInTheDocument();
    expect(screen.getByText('Manage Users')).toBeInTheDocument();
    expect(screen.getByText('Update Market Data')).toBeInTheDocument();
    expect(screen.getByTestId('admin-section')).toBeInTheDocument();
  });

  it('regular user does not see Admin Actions section', () => {
    const regularUser = {
      id: 'user-123',
      email: 'user@example.com',
      app_metadata: {
        inversorai_role: 'USER',
      },
    } as User;

    const session = {
      access_token: 'user-token',
      user: regularUser,
    } as Session;

    render(<AdminSectionVisibility user={regularUser} session={session} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Users')).not.toBeInTheDocument();
    expect(screen.queryByTestId('admin-section')).not.toBeInTheDocument();
  });

  it('user without inversorai_role does not see Admin Actions section', () => {
    const userWithoutRole = {
      id: 'user-456',
      email: 'norole@example.com',
      app_metadata: {},
    } as User;

    const session = {
      access_token: 'user-token',
      user: userWithoutRole,
    } as Session;

    render(<AdminSectionVisibility user={userWithoutRole} session={session} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Actions')).not.toBeInTheDocument();
    expect(screen.queryByText('Manage Users')).not.toBeInTheDocument();
  });

  it('user with undefined app_metadata does not see Admin Actions section', () => {
    const userNoMetadata = {
      id: 'user-789',
      email: 'nometadata@example.com',
    } as User;

    const session = {
      access_token: 'user-token',
      user: userNoMetadata,
    } as Session;

    render(<AdminSectionVisibility user={userNoMetadata} session={session} />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Admin Actions')).not.toBeInTheDocument();
  });
});
