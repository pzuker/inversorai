'use client';

import { useRouter } from 'next/navigation';
import { LogOut, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  currentAsset?: string;
}

export function Header({ currentAsset = 'BTC-USD' }: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-7xl">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">InversorAI</span>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {currentAsset}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <span className="hidden sm:inline text-sm text-muted-foreground">
              {user.email}
            </span>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
