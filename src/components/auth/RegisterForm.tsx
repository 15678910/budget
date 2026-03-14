'use client';

import { useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { useUser } from '@/components/providers/UserProvider';

/* ------------------------------------------------------------------ */
/* Kakao Postcode TypeScript declarations                              */
/* ------------------------------------------------------------------ */

interface DaumPostcodeData {
  zonecode: string;
  address: string;
  addressType: 'R' | 'J';
  roadAddress: string;
  jibunAddress: string;
  buildingName: string;
  bname: string;
}

declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        animation?: boolean;
        autoClose?: boolean;
      }) => { open: () => void };
    };
  }
}

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useUser();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [zonecode, setZonecode] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const openPostcode = useCallback(() => {
    if (!window?.daum?.Postcode) {
      alert('주소 검색 스크립트를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete(data: DaumPostcodeData) {
        setZonecode(data.zonecode);
        let full = data.address;
        if (data.addressType === 'R') {
          let extra = '';
          if (data.bname) extra += data.bname;
          if (data.buildingName) extra += extra ? `, ${data.buildingName}` : data.buildingName;
          if (extra) full += ` (${extra})`;
        }
        setRoadAddress(full);
        setAddressDetail('');
      },
      animation: true,
      autoClose: true,
    }).open();
  }, []);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = '이름을 입력해주세요.';
    if (!email) errs.email = '이메일을 입력해주세요.';
    if (!password) errs.password = '비밀번호를 입력해주세요.';
    else if (password.length < 6) errs.password = '비밀번호는 6자 이상이어야 합니다.';
    if (password !== passwordConfirm) errs.passwordConfirm = '비밀번호가 일치하지 않습니다.';
    if (!birthdate) errs.birthdate = '생년월일을 입력해주세요.';
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
          name: name.trim(),
          email,
          password,
          birthdate,
          address: zonecode
            ? `[${zonecode}] ${roadAddress}${addressDetail ? ' ' + addressDetail : ''}`
            : '',
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

  return (
    <>
    <Script
      src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
      strategy="lazyOnload"
    />
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-xl shadow-2xl p-8 w-full max-w-md"
    >
      <h1 className="text-xl font-bold text-foreground mb-6">회원가입</h1>

      {/* Name */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
        {errors.name && (
          <p className="text-red-500 text-sm mt-1">{errors.name}</p>
        )}
      </div>

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

      {/* Birthdate */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">생년월일</p>
        <input
          type="date"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          className={inputClass}
          max={new Date().toISOString().split('T')[0]}
        />
        {errors.birthdate && (
          <p className="text-red-500 text-sm mt-1">{errors.birthdate}</p>
        )}
      </div>

      {/* Address — Kakao Postcode */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">집 주소</p>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            readOnly
            placeholder="우편번호"
            value={zonecode}
            className={`${inputClass} flex-1 cursor-default`}
          />
          <button
            type="button"
            onClick={openPostcode}
            className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-md px-4 py-3 font-medium transition-colors"
          >
            주소 검색
          </button>
        </div>
        <input
          type="text"
          readOnly
          placeholder="도로명 주소"
          value={roadAddress}
          className={`${inputClass} mb-2 cursor-default`}
        />
        <input
          type="text"
          placeholder="상세주소 (동/호수)"
          value={addressDetail}
          onChange={(e) => setAddressDetail(e.target.value)}
          className={inputClass}
        />
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
    </>
  );
}
