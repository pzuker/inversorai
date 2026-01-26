'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

type PageState = 'loading' | 'invalid' | 'form' | 'success';

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeRecovery = async () => {
      // Check for PKCE code in query params
      const code = searchParams.get('code');

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            setPageState('invalid');
            return;
          }
          setPageState('form');
          return;
        } catch (err) {
          console.error('Code exchange exception:', err);
          setPageState('invalid');
          return;
        }
      }

      // Check for hash fragment (older Supabase flow)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        if (params.get('type') === 'recovery') {
          // The auth state change listener will handle this
          setPageState('form');
          return;
        }
      }

      // Listen for PASSWORD_RECOVERY event
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setPageState('form');
        }
      });

      // Check if we already have a session (recovery link was clicked)
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // We have a session, assume recovery mode if we got here via email link
        setPageState('form');
      } else {
        // No valid recovery state found after a short delay
        setTimeout(() => {
          setPageState((current) => current === 'loading' ? 'invalid' : current);
        }, 2000);
      }

      return () => subscription.unsubscribe();
    };

    initializeRecovery();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Sign out after password change
      await supabase.auth.signOut();
      setPageState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Verifying recovery link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive" />
            <h1 className="text-xl font-bold mt-4">Invalid or Expired Link</h1>
            <p className="text-muted-foreground mt-2">
              This password reset link is invalid or has expired.
            </p>
            <Link href="/login" className="mt-6 inline-block">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400" />
            <h1 className="text-xl font-bold mt-4">Password Updated</h1>
            <p className="text-muted-foreground mt-2">
              Your password has been successfully updated.
            </p>
            <Link href="/login" className="mt-6 inline-block">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">Set New Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Enter new password"
                minLength={6}
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Confirm new password"
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/login" className="hover:underline">
                Back to Login
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ResetPasswordLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="py-12 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
