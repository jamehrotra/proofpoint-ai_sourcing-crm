'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Both username and password are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Login failed.');
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-1.5">
          Username
        </label>
        <input
          type="text"
          autoComplete="username"
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(null); }}
          autoFocus
          className="w-full bg-white border border-[#e8e2d4] px-3 py-2.5 text-[15px] text-[#1a1816] focus:outline-none focus:border-[#1a1816]"
        />
      </div>
      <div>
        <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-[#6b6358] mb-1.5">
          Password
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          className="w-full bg-white border border-[#e8e2d4] px-3 py-2.5 text-[15px] text-[#1a1816] focus:outline-none focus:border-[#1a1816]"
        />
      </div>

      {error && (
        <div className="bg-[#6b1f2a]/[0.06] border-l-2 border-[#6b1f2a] px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6b1f2a] mb-1">Sign-in failed</div>
          <p className="text-[13px] text-[#1a1816]">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#1a1816] text-[#faf7f2] py-3 text-[13px] font-medium tracking-[0.02em] hover:bg-[#0f1e3a] transition-colors disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
