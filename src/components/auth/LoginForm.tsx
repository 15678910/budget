'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/components/providers/UserProvider';

export function LoginForm() {
  const router = useRouter();
  const { refresh } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '로그인에 실패했습니다.');
        return;
      }
      await refresh();
      router.push('/');
    } catch {
      setError('서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl shadow-2xl p-8 w-full max-w-md"
    >
      <h1 className="text-xl font-bold text-foreground mb-6">로그인</h1>

      {/* Email */}
      <div className="mb-4">
        <input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Password */}
      <div className="mb-6">
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-3 font-medium transition-colors disabled:opacity-50"
      >
        {submitting ? '처리 중...' : '로그인'}
      </button>

      {/* Register Link */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        계정이 없으신가요?{' '}
        <Link href="/auth/register" className="text-blue-500 hover:underline">
          회원가입
        </Link>
      </p>
    </form>
  );
}
