'use client';
import { useState, useEffect, useCallback } from 'react';

interface TourStep {
  target: string;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: 'data-tour="nav"',
    title: '페이지 네비게이션',
    description:
      '여기서 각 분석 페이지로 이동할 수 있습니다. 트리맵, 재정건전성, 시뮬레이터 등 다양한 분석 도구를 제공합니다.',
  },
  {
    target: 'data-tour="treemap"',
    title: '예산 시각화',
    description:
      '728조원 정부 예산이 어디에 쓰이는지 한눈에 볼 수 있습니다. 큰 사각형일수록 더 많은 예산이 배정됩니다.',
  },
  {
    target: 'data-tour="view-tabs"',
    title: '다양한 보기',
    description:
      '분야별, 부처별, 광역별, 자치구별, 교육청별로 전환하여 예산을 다양한 관점에서 분석할 수 있습니다.',
  },
  {
    target: 'data-tour="per-capita"',
    title: '1인당 환산',
    description:
      '총액을 국민 1인당 금액으로 환산하여 내가 부담하는 세금을 체감할 수 있습니다.',
  },
  {
    target: 'data-tour="unit-convert"',
    title: '단위 변환',
    description:
      '조원을 억원, 만원, 달러 등 다른 단위로 변환할 수 있습니다.',
  },
  {
    target: 'data-tour="theme-toggle"',
    title: '테마 전환',
    description:
      '다크 모드와 라이트 모드를 전환할 수 있습니다. 이제 자유롭게 사이트를 탐색해보세요!',
  },
];

export function startTour() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('narasalim-start-tour'));
  }
}

export function GuidedTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Listen for custom event to start tour
  useEffect(() => {
    const handler = () => {
      setCurrentStep(0);
      setIsActive(true);
    };
    window.addEventListener('narasalim-start-tour', handler);
    return () => window.removeEventListener('narasalim-start-tour', handler);
  }, []);

  // Auto-show on first visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const done = localStorage.getItem('narasalim-tour-done');
      if (!done) {
        const timer = setTimeout(() => {
          setCurrentStep(0);
          setIsActive(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Update target element rect when step changes
  useEffect(() => {
    if (!isActive) return;
    const step = TOUR_STEPS[currentStep];
    // Extract attribute name and value from e.g. 'data-tour="nav"'
    const match = step.target.match(/^([\w-]+)="([^"]+)"$/);
    const el = match
      ? document.querySelector(`[${match[1]}="${match[2]}"]`)
      : document.querySelector(`[${step.target}]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      setTargetRect(null);
    }
  }, [isActive, currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsActive(false);
      localStorage.setItem('narasalim-tour-done', 'true');
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    setIsActive(false);
    localStorage.setItem('narasalim-tour-done', 'true');
  }, []);

  if (!isActive || !targetRect) return null;

  const step = TOUR_STEPS[currentStep];
  const padding = 8;
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Calculate tooltip position - prefer below the target, fall back to above
  const tooltipTop = targetRect.bottom + padding + 12;
  const tooltipBelow = tooltipTop + 200 < window.innerHeight;
  const finalTooltipTop = tooltipBelow
    ? targetRect.bottom + padding + 12
    : targetRect.top - padding - 220;
  const tooltipLeft = Math.max(
    16,
    Math.min(targetRect.left, window.innerWidth - 370)
  );

  return (
    <>
      {/* Clickable backdrop (closes tour on click outside) */}
      <div
        className="fixed inset-0 z-[60]"
        onClick={handleSkip}
        aria-hidden="true"
      />

      {/* Spotlight highlight - element with huge box-shadow creates dark overlay + transparent hole */}
      <div
        className="fixed z-[61] rounded-lg pointer-events-none transition-all duration-300 ease-in-out"
        style={{
          top: targetRect.top - padding,
          left: targetRect.left - padding,
          width: targetRect.width + padding * 2,
          height: targetRect.height + padding * 2,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
        }}
      />

      {/* Tooltip card */}
      <div
        className="fixed z-[62] w-[350px] bg-card border border-border rounded-xl shadow-2xl p-5 transition-all duration-300 ease-in-out"
        style={{
          top: finalTooltipTop,
          left: tooltipLeft,
        }}
        role="dialog"
        aria-modal="true"
        aria-label={step.title}
      >
        {/* Step counter */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-muted-foreground">
            {currentStep + 1} / {TOUR_STEPS.length}
          </span>
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-label="투어 건너뛰기"
          >
            건너뛰기
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-foreground mb-2">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          {step.description}
        </p>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="px-3 py-1.5 text-sm rounded-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="이전 단계"
          >
            이전
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-1.5 text-sm font-semibold rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            aria-label={isLastStep ? '투어 완료' : '다음 단계'}
          >
            {isLastStep ? '시작하기' : '다음'}
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 mt-4">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </>
  );
}
