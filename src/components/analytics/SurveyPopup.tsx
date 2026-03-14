'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/components/providers/UserProvider';

const AGE_RANGES = ['10대', '20대', '30대', '40대', '50대', '60대 이상'] as const;
const GENDERS = ['남성', '여성'] as const;
const INTERESTS = ['교육', '복지', '국방', '경제', '환경', '과학기술'] as const;

const STORAGE_KEY = '_ns_survey_done';

export function SurveyPopup() {
  const { isLoggedIn } = useUser();
  const [visible, setVisible] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [interests, setInterests] = useState<Set<string>>(new Set());

  // Show after 30 seconds if not already dismissed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isLoggedIn) return;
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, 30_000);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setInterests((prev) => {
      const next = new Set(prev);
      if (next.has(interest)) {
        next.delete(interest);
      } else {
        next.add(interest);
      }
      return next;
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const payload = {
      eventType: 'survey',
      data: {
        age_range: ageRange,
        gender,
        interests: Array.from(interests),
      },
    };

    try {
      const blob = new Blob([JSON.stringify(payload)], {
        type: 'application/json',
      });
      navigator.sendBeacon('/api/analytics/event', blob);
    } catch {
      // Silently fail
    }

    localStorage.setItem(STORAGE_KEY, 'true');
    setSubmitted(true);

    setTimeout(() => {
      setVisible(false);
    }, 1500);
  }, [ageRange, gender, interests]);

  if (!visible || isLoggedIn) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border border-border rounded-xl shadow-2xl p-5 w-80 animate-in fade-in slide-in-from-bottom-4">
      {submitted ? (
        <div className="flex items-center justify-center py-8">
          <p className="text-lg font-medium text-foreground">감사합니다!</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-foreground">
              📊 간단 설문
            </h3>
            <button
              onClick={dismiss}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1"
              aria-label="닫기"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Age Range */}
          <div className="mb-3">
            <p className="text-sm text-muted-foreground mb-1.5">연령대</p>
            <div className="flex flex-wrap gap-1.5">
              {AGE_RANGES.map((age) => (
                <button
                  key={age}
                  onClick={() => setAgeRange(age)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    ageRange === age
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* Gender */}
          <div className="mb-3">
            <p className="text-sm text-muted-foreground mb-1.5">성별</p>
            <div className="flex gap-1.5">
              {GENDERS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`px-3 py-1 text-xs rounded-md border transition-colors ${
                    gender === g
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Interests (multi-select) */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1.5">
              관심 분야 (복수 선택)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    interests.has(interest)
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!ageRange}
            className="bg-primary text-white rounded-md px-4 py-2 w-full text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          >
            제출하기
          </button>
        </>
      )}
    </div>
  );
}
