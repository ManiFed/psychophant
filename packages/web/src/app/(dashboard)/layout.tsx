'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      checkAuth();
    }
  }, [token, router, checkAuth]);

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="text-2xl font-bold text-primary">
              Psychophant
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/agents"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Agents
              </Link>
              <Link
                href="/conversations"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Conversations
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <div className="rounded-md bg-muted px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">Credit: </span>
                <span className="font-medium">$0.10</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  router.push('/');
                }}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
