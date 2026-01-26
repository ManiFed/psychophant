'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch {
      // Error is handled by the store
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">sign in</h1>
        <p className="text-xs text-white/50">
          welcome back to psychophant
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {(error || formError) && (
          <div className="border border-red-500/50 bg-red-500/10 p-3 text-xs text-red-400">
            {error || formError}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="text-xs text-white/70">email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 disabled:opacity-50 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs text-white/70">password</label>
          <input
            id="password"
            type="password"
            placeholder="enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 disabled:opacity-50 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-orange-500 text-black py-3 text-sm font-medium hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'signing in...' : 'sign in'}
        </button>
      </form>

      <p className="text-center text-xs text-white/50">
        don&apos;t have an account?{' '}
        <Link href="/register" className="text-orange-500 hover:text-orange-400 transition-colors">
          sign up
        </Link>
      </p>
    </div>
  );
}
