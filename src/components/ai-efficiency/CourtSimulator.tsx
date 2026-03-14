'use client';

import React, { useState, useMemo } from 'react';
import { Slider, Cell, SectionHeader, InfoSection, KeyMessage, formatJo } from './shared';
import { COURT_DATA, COURT_SLIDERS, COURT_SOURCES, COURT_ASSUMPTIONS } from '@/lib/data/ai-efficiency-data';

export function CourtSimulator() {
  const [aiAccuracy, setAiAccuracy] = useState(COURT_SLIDERS[0].defaultValue);
  const [docAutomation, setDocAutomation] = useState(COURT_SLIDERS[1].defaultValue);
  const [trialReduction, setTrialReduction] = useState(COURT_SLIDERS[2].defaultValue);

  const sim = useMemo(() => {
    // 판례 분석 효과: 법관 연구시간 절감 → 추가 처리 가능 사건
    // 정확도 향상분 × 연구시간 비율(30%) = 법관 생산성 향상
    const accuracyImprovement = (aiAccuracy - 50) / 100;
    const additionalJudgeCapacity = COURT_DATA.judges * accuracyImprovement * 0.3;
    // 미결사건 해소 가능 건수 (만건)
    const pendingResolved = COURT_DATA.pendingCases * (additionalJudgeCapacity / COURT_DATA.judges);

    // 문서 자동화 효과: 법원 직원 문서작업 절감
    // 직원 × 자동화율 × 문서작업 비율(25%)
    const staffSaved = Math.round(COURT_DATA.courtStaff * (docAutomation / 100) * 0.25);
    const staffSavings = staffSaved * 0.5 / 10000; // 조원 (인당 5000만원)

    // 재판기간 단축 → 사회적 편익
    const monthsReduced = COURT_DATA.avgTrialMonths * (trialReduction / 100);
    // 680만건 × (단축개월/12) × 건당 50만원 사회비용
    const socialBenefit = COURT_DATA.annualCases * (monthsReduced / 12) * 50 / 100000; // 조원

    const totalSavings = staffSavings + socialBenefit;

    return {
      additionalJudgeCapacity: Math.round(additionalJudgeCapacity),
      pendingResolved,
      staffSaved,
      staffSavings,
      monthsReduced,
      socialBenefit,
      totalSavings,
      newTrialMonths: COURT_DATA.avgTrialMonths - monthsReduced,
    };
  }, [aiAccuracy, docAutomation, trialReduction]);

  return (
    <div className="space-y-6">
      {/* 현황 Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader title="현황 Overview" color={COURT_DATA.accentColor} />
        <Cell label="연간 접수" value={`${COURT_DATA.annualCases}만건`} color="text-sky-400" sub="2024 사법연감" />
        <Cell label="법관 수" value={`${COURT_DATA.judges.toLocaleString('ko-KR')}명`} color="text-sky-400" sub="전국 법관" />
        <Cell label="법원 직원" value={`${COURT_DATA.courtStaff.toLocaleString('ko-KR')}명`} color="text-sky-400" sub="사무직원" />
        <Cell label="평균 재판기간" value={`${COURT_DATA.avgTrialMonths}개월`} color="text-amber-400" sub="1심 민사 기준" />
        <Cell label="미결 사건" value={`${COURT_DATA.pendingCases}만건`} color="text-red-400" sub="누적 미결" />
      </div>

      {/* 시뮬레이션 설정 */}
      <div className="border border-border p-4 md:p-5">
        <div className={`text-sm md:text-base font-semibold uppercase tracking-widest ${COURT_DATA.accentColor} mb-4`}>
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Slider
            label={COURT_SLIDERS[0].label}
            value={aiAccuracy}
            min={COURT_SLIDERS[0].min}
            max={COURT_SLIDERS[0].max}
            step={COURT_SLIDERS[0].step}
            unit={COURT_SLIDERS[0].unit}
            subLabel={COURT_SLIDERS[0].description}
            color={COURT_DATA.accentColor}
            onChange={setAiAccuracy}
          />
          <Slider
            label={COURT_SLIDERS[1].label}
            value={docAutomation}
            min={COURT_SLIDERS[1].min}
            max={COURT_SLIDERS[1].max}
            step={COURT_SLIDERS[1].step}
            unit={COURT_SLIDERS[1].unit}
            subLabel={COURT_SLIDERS[1].description}
            color={COURT_DATA.accentColor}
            onChange={setDocAutomation}
          />
          <Slider
            label={COURT_SLIDERS[2].label}
            value={trialReduction}
            min={COURT_SLIDERS[2].min}
            max={COURT_SLIDERS[2].max}
            step={COURT_SLIDERS[2].step}
            unit={COURT_SLIDERS[2].unit}
            subLabel={COURT_SLIDERS[2].description}
            color={COURT_DATA.accentColor}
            onChange={setTrialReduction}
          />
        </div>
      </div>

      {/* AI 효과 분석 Results */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="AI 효과 분석 Results" color={COURT_DATA.accentColor} />
        <Cell label="법관 생산성 향상" value={`+${sim.additionalJudgeCapacity}명분`} color="text-sky-400" />
        <Cell label="미결사건 해소" value={`${sim.pendingResolved.toFixed(1)}만건`} color="text-cyan-400" />
        <Cell label="직원 업무 절감" value={`${sim.staffSaved.toLocaleString('ko-KR')}명분`} color="text-indigo-400" />
        <Cell label="총 절감 효과" value={formatJo(sim.totalSavings)} color="text-emerald-400" />
      </div>

      {/* Key Message */}
      <KeyMessage
        borderColor={COURT_DATA.borderColor}
        bgColor={COURT_DATA.bgColor}
        titleColor={COURT_DATA.accentColor}
        title="핵심 메시지"
      >
        AI 판례 분석 정확도 <span className="text-sky-400 font-bold">{aiAccuracy}%</span>로
        법관 <span className="text-sky-400 font-bold">{sim.additionalJudgeCapacity}명</span>분의 생산성을 확보하고,
        문서 자동화 <span className="text-indigo-400 font-bold">{docAutomation}%</span>로
        직원 <span className="text-indigo-400 font-bold">{sim.staffSaved.toLocaleString('ko-KR')}명</span>분의 업무를 절감합니다.
        {trialReduction > 5 && (
          <> 재판기간이 <span className="text-amber-400 font-bold">{COURT_DATA.avgTrialMonths}개월</span>에서{' '}
          <span className="text-emerald-400 font-bold">{sim.newTrialMonths.toFixed(1)}개월</span>로 단축되어
          연간 <span className="text-emerald-400 font-bold">{formatJo(sim.totalSavings)}</span> 규모의 사회적 편익이 발생합니다.</>
        )}
      </KeyMessage>

      {/* 데이터 출처 및 가정 */}
      <InfoSection title="데이터 출처 및 가정" color={COURT_DATA.accentColor}>
        <div>
          <div className="font-semibold mb-2">출처</div>
          <ul className="list-disc list-inside space-y-1">
            {COURT_SOURCES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">주요 가정</div>
          <ul className="list-disc list-inside space-y-1">
            {COURT_ASSUMPTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </InfoSection>
    </div>
  );
}
