'use client';

import React, { useState, useMemo } from 'react';
import { Slider, Cell, SectionHeader, InfoSection, KeyMessage, formatJo } from './shared';
import { MOE_DATA, MOE_SLIDERS, MOE_SOURCES, MOE_ASSUMPTIONS } from '@/lib/data/ai-efficiency-data';

export function EducationSimulator() {
  const [learningRate, setLearningRate] = useState(MOE_SLIDERS[0].defaultValue);
  const [adminAutomation, setAdminAutomation] = useState(MOE_SLIDERS[1].defaultValue);
  const [underperformReduction, setUnderperformReduction] = useState(MOE_SLIDERS[2].defaultValue);

  const sim = useMemo(() => {
    // 사교육비 절감 = 사교육비 총액 × 적용률 × AI 대체비율(15%)
    const privateTutoringSavings = MOE_DATA.privateTutoringCost * (learningRate / 100) * 0.15;

    // 교사 행정 절감 = 교원수 × 자동화율 × 행정비율(40%) × 인건비(6000만원/인)
    const teacherTimeSaved = MOE_DATA.totalTeachers * (adminAutomation / 100) * (MOE_DATA.teacherAdminRatio / 100);
    const teacherSavings = teacherTimeSaved * 0.6 / 10000; // 조원 (만명 × 6000만원 = 억원, /10000 = 조원)

    // 기초학력 미달 감소 학생 수
    const reducedStudents = MOE_DATA.totalStudents * (MOE_DATA.underperformingRate / 100) * (underperformReduction / 100);
    // 장기 사회적 편익 = 감소 학생(만명) × 연 500만원 생산성 향상
    const socialBenefit = reducedStudents * 500 / 100000000; // 조원

    const totalSavings = privateTutoringSavings + teacherSavings + socialBenefit;

    return {
      privateTutoringSavings,
      teacherTimeSaved,
      teacherSavings,
      reducedStudents,
      socialBenefit,
      totalSavings,
    };
  }, [learningRate, adminAutomation, underperformReduction]);

  return (
    <div className="space-y-6">
      {/* 현황 Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader title="현황 Overview" color={MOE_DATA.accentColor} />
        <Cell label="초중고 학생" value={`${MOE_DATA.totalStudents}만명`} color="text-violet-400" sub="2025 교육통계" />
        <Cell label="교원 수" value={`${MOE_DATA.totalTeachers}만명`} color="text-violet-400" sub="초중고 전체" />
        <Cell label="교육 예산" value={formatJo(MOE_DATA.educationBudget)} color="text-violet-400" sub="교부금 포함" />
        <Cell label="사교육비" value={formatJo(MOE_DATA.privateTutoringCost)} color="text-red-400" sub="2024 통계청" />
        <Cell label="기초학력 미달" value={`${MOE_DATA.underperformingRate}%`} color="text-amber-400" sub="중학교 수학 기준" />
      </div>

      {/* 시뮬레이션 설정 */}
      <div className="border border-border p-4 md:p-5">
        <div className={`text-sm md:text-base font-semibold uppercase tracking-widest ${MOE_DATA.accentColor} mb-4`}>
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Slider
            label={MOE_SLIDERS[0].label}
            value={learningRate}
            min={MOE_SLIDERS[0].min}
            max={MOE_SLIDERS[0].max}
            step={MOE_SLIDERS[0].step}
            unit={MOE_SLIDERS[0].unit}
            subLabel={MOE_SLIDERS[0].description}
            color={MOE_DATA.accentColor}
            onChange={setLearningRate}
          />
          <Slider
            label={MOE_SLIDERS[1].label}
            value={adminAutomation}
            min={MOE_SLIDERS[1].min}
            max={MOE_SLIDERS[1].max}
            step={MOE_SLIDERS[1].step}
            unit={MOE_SLIDERS[1].unit}
            subLabel={MOE_SLIDERS[1].description}
            color={MOE_DATA.accentColor}
            onChange={setAdminAutomation}
          />
          <Slider
            label={MOE_SLIDERS[2].label}
            value={underperformReduction}
            min={MOE_SLIDERS[2].min}
            max={MOE_SLIDERS[2].max}
            step={MOE_SLIDERS[2].step}
            unit={MOE_SLIDERS[2].unit}
            subLabel={MOE_SLIDERS[2].description}
            color={MOE_DATA.accentColor}
            onChange={setUnderperformReduction}
          />
        </div>
      </div>

      {/* AI 효과 분석 Results */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="AI 효과 분석 Results" color={MOE_DATA.accentColor} />
        <Cell label="사교육비 절감" value={formatJo(sim.privateTutoringSavings)} color="text-violet-400" />
        <Cell label="교사 시간 확보" value={`${sim.teacherTimeSaved.toFixed(1)}만명분`} color="text-cyan-400" />
        <Cell label="미달 감소 학생" value={`${sim.reducedStudents.toFixed(1)}만명`} color="text-amber-400" />
        <Cell label="총 절감 효과" value={formatJo(sim.totalSavings)} color="text-emerald-400" />
      </div>

      {/* Key Message */}
      <KeyMessage
        borderColor={MOE_DATA.borderColor}
        bgColor={MOE_DATA.bgColor}
        titleColor={MOE_DATA.accentColor}
        title="핵심 메시지"
      >
        AI 맞춤학습을 <span className="text-violet-400 font-bold">{learningRate}%</span> 적용하면
        사교육비 <span className="text-violet-400 font-bold">{formatJo(sim.privateTutoringSavings)}</span> 절감,
        행정 자동화 <span className="text-cyan-400 font-bold">{adminAutomation}%</span>로
        교사 <span className="text-cyan-400 font-bold">{sim.teacherTimeSaved.toFixed(1)}만명</span>분의 수업시간을 확보합니다.
        {underperformReduction > 0 && (
          <> 기초학력 미달 학생이{' '}
          <span className="text-amber-400 font-bold">{sim.reducedStudents.toFixed(1)}만명</span> 감소하여
          연간 총 <span className="text-emerald-400 font-bold">{formatJo(sim.totalSavings)}</span> 규모의 효과가 기대됩니다.</>
        )}
      </KeyMessage>

      {/* 데이터 출처 및 가정 */}
      <InfoSection title="데이터 출처 및 가정" color={MOE_DATA.accentColor}>
        <div>
          <div className="font-semibold mb-2">출처</div>
          <ul className="list-disc list-inside space-y-1">
            {MOE_SOURCES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">주요 가정</div>
          <ul className="list-disc list-inside space-y-1">
            {MOE_ASSUMPTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </InfoSection>
    </div>
  );
}
