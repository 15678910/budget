'use client';

import { useState, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      try {
        const res = await fetch('/api/admin/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });

        if (res.ok) {
          router.push('/admin/dashboard');
        } else {
          const data = await res.json().catch(() => null);
          setError(data?.message ?? '비밀번호가 올바르지 않습니다.');
        }
      } catch {
        setError('서버에 연결할 수 없습니다.');
      } finally {
        setLoading(false);
      }
    },
    [password, router],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl shadow-2xl p-8 w-96"
    >
      <h1 className="text-xl font-bold text-foreground mb-6 text-center">
        🔒 관리자 로그인
      </h1>

      <label className="block mb-4">
        <span className="text-sm text-muted-foreground mb-1.5 block">
          비밀번호
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-muted border border-border rounded-md px-4 py-3 text-foreground w-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          placeholder="관리자 비밀번호 입력"
          autoFocus
        />
      </label>

      {error && (
        <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="bg-primary text-white rounded-md px-6 py-3 w-full font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}
