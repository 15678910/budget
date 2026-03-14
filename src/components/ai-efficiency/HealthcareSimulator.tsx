'use client';

import React, { useState, useMemo } from 'react';
import { Slider, Cell, SectionHeader, InfoSection, KeyMessage, formatJo } from './shared';
import { NHIS_DATA, NHIS_SLIDERS, NHIS_SOURCES, NHIS_ASSUMPTIONS } from '@/lib/data/ai-efficiency-data';

// ============================================================
// 국민건강보험공단 AI 의료비 심사 효율화 시뮬레이터
// National Health Insurance Service – AI Healthcare Review Simulator
// ============================================================

export function HealthcareSimulator() {
  const [fraudDetection, setFraudDetection] = useState(NHIS_SLIDERS[0].defaultValue);
  const [autoReviewRate, setAutoReviewRate] = useState(NHIS_SLIDERS[1].defaultValue);
  const [errorReductionRate, setErrorReductionRate] = useState(NHIS_SLIDERS[2].defaultValue);

  const sim = useMemo(() => {
    // 부당청구 환수 = 추정규모 x 탐지율 x 실제환수비율(0.65)
    const fraudRecovered = NHIS_DATA.fraudEstimate * (fraudDetection / 100) * 0.65;

    // 심사 자동화 = 자동처리건수
    const autoReviewBillions = NHIS_DATA.annualReviewCases * (autoReviewRate / 100);
    // 인력 절감
    const staffSaved = Math.round(NHIS_DATA.reviewStaff * (autoReviewRate / 100) * 0.35);
    const staffSavings = staffSaved * 0.6 / 10000; // 조원

    // 오류 감소 = 건당 재심사 비용(2만원) x 오류감소건수
    const errorReduction = NHIS_DATA.annualReviewCases * 100000000 * (NHIS_DATA.currentErrorRate / 100) * (errorReductionRate / 100) * 20000 / 1000000000000; // 조원

    const totalSavings = fraudRecovered + staffSavings + errorReduction;
    const newErrorRate = NHIS_DATA.currentErrorRate * (1 - errorReductionRate / 100);

    return {
      fraudRecovered,
      autoReviewBillions,
      staffSaved,
      staffSavings,
      errorReduction,
      totalSavings,
      newErrorRate,
    };
  }, [fraudDetection, autoReviewRate, errorReductionRate]);

  return (
    <div className="space-y-6">
      {/* ── 1. 현황 ── */}
      <div>
        <SectionHeader title="건보 현황 Healthcare Overview" color={NHIS_DATA.accentColor} />
        <div className="grid grid-cols-2 md:grid-cols-5">
          <Cell label="건보 총지출" value={formatJo(NHIS_DATA.totalHealthSpending)} color="text-green-400" />
          <Cell label="부당청구" value={formatJo(NHIS_DATA.fraudEstimate)} color="text-red-400" sub="총 지출의 2.5%" />
          <Cell label="심사건수" value="16억건" color="text-green-400" sub="연간 청구 심사" />
          <Cell label="심사인력" value="3,200명" color="text-green-400" />
          <Cell label="오류율" value="3.5%" color="text-amber-400" sub="현재 청구 오류율" />
        </div>
      </div>

      {/* ── 2. 시뮬레이션 설정 ── */}
      <div className="border border-border rounded p-4 md:p-5 space-y-1">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          시뮬레이션 설정
        </div>
        <Slider
          label={NHIS_SLIDERS[0].label}
          value={fraudDetection}
          min={NHIS_SLIDERS[0].min}
          max={NHIS_SLIDERS[0].max}
          step={NHIS_SLIDERS[0].step}
          unit={NHIS_SLIDERS[0].unit}
          color={NHIS_DATA.accentColor}
          onChange={setFraudDetection}
        />
        <Slider
          label={NHIS_SLIDERS[1].label}
          value={autoReviewRate}
          min={NHIS_SLIDERS[1].min}
          max={NHIS_SLIDERS[1].max}
          step={NHIS_SLIDERS[1].step}
          unit={NHIS_SLIDERS[1].unit}
          color={NHIS_DATA.accentColor}
          onChange={setAutoReviewRate}
        />
        <Slider
          label={NHIS_SLIDERS[2].label}
          value={errorReductionRate}
          min={NHIS_SLIDERS[2].min}
          max={NHIS_SLIDERS[2].max}
          step={NHIS_SLIDERS[2].step}
          unit={NHIS_SLIDERS[2].unit}
          color={NHIS_DATA.accentColor}
          onChange={setErrorReductionRate}
        />
      </div>

      {/* ── 3. AI 효과 분석 ── */}
      <div>
        <SectionHeader title="AI 효과 분석 Impact Analysis" color={NHIS_DATA.accentColor} />
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Cell
            label="부당청구 환수"
            value={formatJo(sim.fraudRecovered)}
            color="text-green-400"
          />
          <Cell
            label="자동 심사"
            value={`${sim.autoReviewBillions.toFixed(1)}억건`}
            color="text-lime-400"
          />
          <Cell
            label="인력 절감"
            value={`${sim.staffSaved}명`}
            color="text-emerald-400"
          />
          <Cell
            label="총 절감 효과"
            value={formatJo(sim.totalSavings)}
            color="text-emerald-400"
          />
        </div>
      </div>

      {/* ── 4. 핵심 메시지 ── */}
      <KeyMessage
        borderColor={NHIS_DATA.borderColor}
        bgColor={NHIS_DATA.bgColor}
        titleColor={NHIS_DATA.accentColor}
        title="핵심 메시지"
      >
        AI 패턴 분석으로 부당청구 <strong>{formatJo(sim.fraudRecovered)}</strong>을 환수하고,
        심사 자동화로 <strong>{sim.autoReviewBillions.toFixed(1)}억건</strong>을 자동 처리하며,
        청구 오류율을 <strong>{NHIS_DATA.currentErrorRate}%</strong>에서 <strong>{sim.newErrorRate.toFixed(1)}%</strong>로 낮출 수 있습니다.
        총 <strong>{formatJo(sim.totalSavings)}</strong> 규모의 건강보험 재정 효율화가 기대됩니다.
      </KeyMessage>

      {/* ── 5. 출처 및 가정 ── */}
      <InfoSection title="데이터 출처 및 가정" color={NHIS_DATA.accentColor}>
        <div>
          <div className="font-semibold mb-1">출처</div>
          <ul className="list-disc list-inside space-y-1">
            {NHIS_SOURCES.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-1">주요 가정</div>
          <ul className="list-disc list-inside space-y-1">
            {NHIS_ASSUMPTIONS.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </InfoSection>
    </div>
  );
}
