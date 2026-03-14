'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/components/providers/UserProvider';

const AGE_OPTIONS = ['10대', '20대', '30대', '40대', '50대', '60대 이상'];
const GENDER_OPTIONS = ['남성', '여성'];
const INTEREST_OPTIONS = ['교육', '복지', '국방', '경제', '환경', '과학기술'];

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function toggleInterest(interest: string) {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(interest)) {
        next.delete(interest);
      } else {
        next.add(interest);
      }
      return next;
    });
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!email) errs.email = '이메일을 입력해주세요.';
    if (!password) errs.password = '비밀번호를 입력해주세요.';
    else if (password.length < 6) errs.password = '비밀번호는 6자 이상이어야 합니다.';
    if (password !== passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!nickname) errs.nickname = '닉네임을 입력해주세요.';
    else if (nickname.length < 2) errs.nickname = '닉네임은 2자 이상이어야 합니다.';
    if (!ageRange) errs.ageRange = '연령대를 선택해주세요.';
    if (!gender) errs.gender = '성별을 선택해주세요.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          nickname,
          ageRange,
          gender,
          interest: Array.from(interests).join(','),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || '회원가입에 실패했습니다.');
        return;
      }
      await refresh();
      router.push('/');
    } catch {
      setServerError('서버 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-muted border border-border rounded-md px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500';
  const chipBase =
    'px-3 py-1.5 text-sm rounded-md border transition-colors cursor-pointer';
  const chipUnselected =
    'bg-muted text-muted-foreground border-border hover:border-blue-500/50';
  const chipSelected = 'bg-blue-600 text-white border-blue-600';

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl shadow-2xl p-8 w-full max-w-md"
    >
      <h1 className="text-xl font-bold text-foreground mb-6">회원가입</h1>

      {/* Email */}
      <div className="mb-4">
        <input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        {errors.email && (
          <p className="text-red-500 text-sm mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="mb-4">
        <input
          type="password"
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      {/* Password Confirm */}
      <div className="mb-4">
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className={inputClass}
        />
        {errors.passwordConfirm && (
          <p className="text-red-500 text-sm mt-1">{errors.passwordConfirm}</p>
        )}
      </div>

      {/* Nickname */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="닉네임 (2자 이상)"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className={inputClass}
        />
        {errors.nickname && (
          <p className="text-red-500 text-sm mt-1">{errors.nickname}</p>
        )}
      </div>

      {/* Age Range */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">연령대</p>
        <div className="flex flex-wrap gap-2">
          {AGE_OPTIONS.map((age) => (
            <button
              key={age}
              type="button"
              onClick={() => setAgeRange(age)}
              className={`${chipBase} ${ageRange === age ? chipSelected : chipUnselected}`}
            >
              {age}
            </button>
          ))}
        </div>
        {errors.ageRange && (
          <p className="text-red-500 text-sm mt-1">{errors.ageRange}</p>
        )}
      </div>

      {/* Gender */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">성별</p>
        <div className="flex flex-wrap gap-2">
          {GENDER_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`${chipBase} ${gender === g ? chipSelected : chipUnselected}`}
            >
              {g}
            </button>
          ))}
        </div>
        {errors.gender && (
          <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
        )}
      </div>

      {/* Interests */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-2">
          관심분야 (선택, 복수 가능)
        </p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((interest) => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`${chipBase} ${interests.has(interest) ? chipSelected : chipUnselected}`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Server Error */}
      {serverError && (
        <p className="text-red-500 text-sm mb-4">{serverError}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md px-4 py-3 font-medium transition-colors disabled:opacity-50"
      >
        {submitting ? '처리 중...' : '회원가입'}
      </button>

      {/* Login Link */}
      <p className="text-center text-sm text-muted-foreground mt-4">
        이미 계정이 있으신가요?{' '}
        <Link href="/auth/login" className="text-blue-500 hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
