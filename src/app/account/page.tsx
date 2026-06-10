'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useUser } from '@/components/providers/UserProvider';

export default function AccountPage() {
  const { user, isLoggedIn, loading } = useUser();
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [nw2, setNw2] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(''); setOk(false);
    if (!cur || !nw) { setError('현재 비밀번호와 새 비밀번호를 입력해주세요.'); return; }
    if (nw !== nw2) { setError('새 비밀번호 확인이 일치하지 않습니다.'); return; }
    if (nw.length < 8 || !/[A-Za-z]/.test(nw) || !/[0-9]/.test(nw)) {
      setError('새 비밀번호는 8자 이상, 영문+숫자를 포함해야 합니다.'); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '변경에 실패했습니다.'); return; }
      setOk(true); setCur(''); setNw(''); setNw2('');
    } catch {
      setError('서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500';

  if (loading) return <div className="max-w-md mx-auto py-16 text-center text-muted-foreground">불러오는 중…</div>;
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-3">
        <p className="text-muted-foreground">로그인이 필요합니다.</p>
        <Link href="/auth/login" className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500">로그인</Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10">
      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">마이페이지</h1>
          <p className="text-sm text-muted-foreground mt-1">{user?.nickname} · {user?.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">비밀번호 변경</h2>
          <input type="password" autoComplete="current-password" placeholder="현재 비밀번호"
            value={cur} onChange={(e) => setCur(e.target.value)} className={inputClass} />
          <input type="password" autoComplete="new-password" placeholder="새 비밀번호 (8자 이상, 영문+숫자)"
            value={nw} onChange={(e) => setNw(e.target.value)} className={inputClass} />
          <input type="password" autoComplete="new-password" placeholder="새 비밀번호 확인"
            value={nw2} onChange={(e) => setNw2(e.target.value)} className={inputClass} />

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {ok && <p className="text-emerald-500 text-sm">✅ 비밀번호가 변경되었습니다.</p>}

          <button type="submit" disabled={submitting}
            className="w-full py-3 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50">
            {submitting ? '변경 중…' : '비밀번호 변경'}
          </button>
        </form>

        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          ※ 소셜(구글) 로그인 전용 계정은 비밀번호가 없어 변경 대상이 아닙니다.
        </p>
      </div>
    </div>
  );
}
