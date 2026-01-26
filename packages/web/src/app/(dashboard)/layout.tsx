'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';

function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <div className="relative w-6 h-6">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-0.5">
          <div className="bg-orange-500 rounded-sm" />
          <div className="bg-orange-500/60 rounded-sm" />
          <div className="bg-orange-500/30 rounded-sm" />
          <div className="bg-orange-500 rounded-sm" />
        </div>
      </div>
      <span className="font-mono text-sm font-medium tracking-tight">psychophant</span>
    </Link>
  );
}

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
    <div className="min-h-screen flex flex-col bg-black text-white font-mono">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/dashboard"
                className="text-xs text-white/60 hover:text-white transition-colors"
              >
                dashboard
              </Link>
              <Link
                href="/agents"
                className="text-xs text-white/60 hover:text-white transition-colors"
              >
                agents
              </Link>
              <Link
                href="/conversations"
                className="text-xs text-white/60 hover:text-white transition-colors"
              >
                conversations
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <div className="border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs">
                <span className="text-white/50">credit: </span>
                <span className="text-orange-500 font-medium">$0.10</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/50 hidden sm:inline">
                {user?.email}
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
