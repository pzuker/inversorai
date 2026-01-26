'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Shield, ShieldOff, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  fetchAdminUsers,
  setUserRole,
  sendPasswordReset,
  type AdminUser,
} from '@/lib/apiClient';

type ActionFeedback = {
  userId: string;
  type: 'success' | 'error';
  message: string;
} | null;

export default function AdminPage() {
  const { user, session, loading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<ActionFeedback>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Reauthentication modal state
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [reauthPassword, setReauthPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [reauthLoading, setReauthLoading] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    userId: string;
    role: 'ADMIN' | 'USER';
  } | null>(null);

  const isAdmin = user?.app_metadata?.inversorai_role === 'ADMIN';

  const loadUsers = useCallback(async () => {
    if (!session?.access_token) return;

    setUsersLoading(true);
    setUsersError(null);

    try {
      const data = await fetchAdminUsers(session.access_token);
      setUsers(data);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/login');
    }
  }, [session, authLoading, router]);

  useEffect(() => {
    if (session?.access_token && isAdmin) {
      loadUsers();
    }
  }, [session?.access_token, isAdmin, loadUsers]);

  const handleRoleChange = async (userId: string, newRole: 'ADMIN' | 'USER') => {
    if (!session?.access_token) return;

    setActionLoading(userId);
    setActionFeedback(null);

    try {
      await setUserRole(session.access_token, userId, newRole);
      setActionFeedback({
        userId,
        type: 'success',
        message: `Role changed to ${newRole}`,
      });
      await loadUsers();
    } catch (err) {
      const error = err as Error & { status?: number; code?: string };

      if (error.status === 401 && error.code === 'REAUTH_REQUIRED') {
        // Need to reauthenticate
        setPendingRoleChange({ userId, role: newRole });
        setShowReauthModal(true);
        setReauthError(null);
        setReauthPassword('');
      } else {
        setActionFeedback({
          userId,
          type: 'error',
          message: error.message || 'Failed to change role',
        });
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReauthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || !pendingRoleChange) return;

    setReauthLoading(true);
    setReauthError(null);

    try {
      // Reauthenticate with Supabase
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: reauthPassword,
      });

      if (authError) {
        setReauthError(authError.message);
        setReauthLoading(false);
        return;
      }

      // Get fresh session
      const { data: { session: newSession } } = await supabase.auth.getSession();

      if (!newSession?.access_token) {
        setReauthError('Failed to get new session');
        setReauthLoading(false);
        return;
      }

      // Retry the role change with fresh token
      await setUserRole(
        newSession.access_token,
        pendingRoleChange.userId,
        pendingRoleChange.role
      );

      setActionFeedback({
        userId: pendingRoleChange.userId,
        type: 'success',
        message: `Role changed to ${pendingRoleChange.role}`,
      });

      setShowReauthModal(false);
      setPendingRoleChange(null);
      setReauthPassword('');
      await loadUsers();
    } catch (err) {
      const error = err as Error;
      setReauthError(error.message || 'Failed to change role');
    } finally {
      setReauthLoading(false);
    }
  };

  const handlePasswordReset = async (userId: string, email: string) => {
    if (!session?.access_token) return;

    setActionLoading(userId);
    setActionFeedback(null);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      await sendPasswordReset(session.access_token, userId, redirectTo);
      setActionFeedback({
        userId,
        type: 'success',
        message: `Password reset email sent to ${email}`,
      });
    } catch (err) {
      setActionFeedback({
        userId,
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to send reset email',
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header currentAsset="BTC-USD" />
        <main className="container mx-auto max-w-7xl px-4 py-6">
          <Card>
            <CardContent className="py-12 text-center">
              <h1 className="text-2xl font-bold mb-4">Forbidden</h1>
              <p className="text-muted-foreground mb-6">
                You do not have permission to access this page.
              </p>
              <Link href="/dashboard">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header currentAsset="BTC-USD" />

      <main className="container mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
              <p className="text-muted-foreground">Manage user roles and access</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={usersLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Users list */}
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading users...</div>
            ) : usersError ? (
              <div className="text-center py-8 text-destructive">{usersError}</div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No users found</div>
            ) : (
              <div className="space-y-3">
                {users.map((u) => {
                  const isCurrentUser = u.id === user?.id;
                  const feedback = actionFeedback?.userId === u.id ? actionFeedback : null;
                  const isLoading = actionLoading === u.id;

                  return (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">
                            {u.email}
                            {isCurrentUser && (
                              <span className="text-muted-foreground text-sm ml-2">(you)</span>
                            )}
                          </div>
                          <Badge
                            variant={u.role === 'ADMIN' ? 'default' : 'secondary'}
                            className="mt-1"
                          >
                            {u.role}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {feedback && (
                          <span
                            className={`text-sm ${
                              feedback.type === 'success'
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-destructive'
                            }`}
                          >
                            {feedback.message}
                          </span>
                        )}

                        {u.role === 'USER' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(u.id, 'ADMIN')}
                            disabled={isLoading || isCurrentUser}
                            title={isCurrentUser ? 'Cannot change your own role' : 'Promote to Admin'}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Shield className="h-4 w-4 mr-1" />
                                Promote
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRoleChange(u.id, 'USER')}
                            disabled={isLoading || isCurrentUser}
                            title={isCurrentUser ? 'Cannot change your own role' : 'Demote to User'}
                          >
                            {isLoading ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <ShieldOff className="h-4 w-4 mr-1" />
                                Demote
                              </>
                            )}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePasswordReset(u.id, u.email)}
                          disabled={isLoading}
                          title="Send password reset email"
                        >
                          {isLoading ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Reauthentication Modal */}
      {showReauthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirm Your Identity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                For security, please enter your password to change user roles.
              </p>
              <form onSubmit={handleReauthSubmit} className="space-y-4">
                <div>
                  <label htmlFor="reauth-password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <input
                    id="reauth-password"
                    type="password"
                    value={reauthPassword}
                    onChange={(e) => setReauthPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Enter your password"
                    autoFocus
                    required
                  />
                </div>
                {reauthError && (
                  <p className="text-sm text-destructive">{reauthError}</p>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowReauthModal(false);
                      setPendingRoleChange(null);
                      setReauthPassword('');
                      setReauthError(null);
                    }}
                    disabled={reauthLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={reauthLoading || !reauthPassword}>
                    {reauthLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
