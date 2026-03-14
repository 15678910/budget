'use client';

import React, { useState, useMemo } from 'react';
import { Slider, Cell, SectionHeader, InfoSection, KeyMessage, formatJo } from './shared';
import { NTS_DATA, NTS_SLIDERS, NTS_SOURCES, NTS_ASSUMPTIONS } from '@/lib/data/ai-efficiency-data';

export function TaxAuditSimulator() {
  const [detectionRate, setDetectionRate] = useState(NTS_SLIDERS[0].defaultValue);
  const [automationRate, setAutomationRate] = useState(NTS_SLIDERS[1].defaultValue);
  const [expansionRate, setExpansionRate] = useState(NTS_SLIDERS[2].defaultValue);

  const sim = useMemo(() => {
    // 추가 세수 = 탈세추정액 × (신규탐지율 - 기존탐지율) / 100 × 실제회수비율(0.6)
    const additionalDetection = (detectionRate - NTS_DATA.currentDetectionRate) / 100;
    const additionalRevenue = NTS_DATA.taxGap * additionalDetection * 0.6;

    // 인력 절감 = 조사인력 × 자동화비율 × 30% (자동화로 대체 가능 비율)
    const staffSaved = Math.round(NTS_DATA.auditStaff * (automationRate / 100) * 0.3);
    const staffSavings = staffSaved * 0.6 / 10000; // 조원 (인당 6000만원)

    // 조사 확대 효과 = 현재커버리지 × 확대율 → 추가 세수
    const newCoverage = NTS_DATA.auditCoverage * expansionRate;
    const expansionRevenue = NTS_DATA.taxGap * ((newCoverage - NTS_DATA.auditCoverage) / 100) * 0.3;

    const totalSavings = additionalRevenue + staffSavings + expansionRevenue;

    return {
      additionalRevenue,
      staffSaved,
      staffSavings,
      newCoverage,
      expansionRevenue,
      totalSavings,
      newDetectionRate: detectionRate,
    };
  }, [detectionRate, automationRate, expansionRate]);

  return (
    <div className="space-y-6">
      {/* 현황 Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader title="현황 Overview" color={NTS_DATA.accentColor} />
        <Cell label="국세 수입" value={formatJo(NTS_DATA.nationalTaxRevenue)} color="text-blue-400" sub="2026 세입예산" />
        <Cell label="세수 Gap" value={formatJo(NTS_DATA.taxGap)} color="text-red-400" sub="탈세 추정 (GDP 1%)" />
        <Cell label="조사 인력" value="4,800명" color="text-blue-400" sub="세무조사 전담" />
        <Cell label="조사 비율" value="1.2%" color="text-blue-400" sub="전체 납세자 중" />
        <Cell label="탐지율" value="65%" color="text-amber-400" sub="현재 탈세 탐지율" />
      </div>

      {/* 시뮬레이션 설정 */}
      <div className="border border-border p-4 md:p-5">
        <div className={`text-sm md:text-base font-semibold uppercase tracking-widest ${NTS_DATA.accentColor} mb-4`}>
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Slider
            label={NTS_SLIDERS[0].label}
            value={detectionRate}
            min={NTS_SLIDERS[0].min}
            max={NTS_SLIDERS[0].max}
            step={NTS_SLIDERS[0].step}
            unit={NTS_SLIDERS[0].unit}
            subLabel={NTS_SLIDERS[0].description}
            color={NTS_DATA.accentColor}
            onChange={setDetectionRate}
          />
          <Slider
            label={NTS_SLIDERS[1].label}
            value={automationRate}
            min={NTS_SLIDERS[1].min}
            max={NTS_SLIDERS[1].max}
            step={NTS_SLIDERS[1].step}
            unit={NTS_SLIDERS[1].unit}
            subLabel={NTS_SLIDERS[1].description}
            color={NTS_DATA.accentColor}
            onChange={setAutomationRate}
          />
          <Slider
            label={NTS_SLIDERS[2].label}
            value={expansionRate}
            min={NTS_SLIDERS[2].min}
            max={NTS_SLIDERS[2].max}
            step={NTS_SLIDERS[2].step}
            unit={NTS_SLIDERS[2].unit}
            subLabel={NTS_SLIDERS[2].description}
            color={NTS_DATA.accentColor}
            onChange={setExpansionRate}
          />
        </div>
      </div>

      {/* AI 효과 분석 Results */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="AI 효과 분석 Results" color={NTS_DATA.accentColor} />
        <Cell label="추가 세수 확보" value={formatJo(sim.additionalRevenue)} color="text-blue-400" />
        <Cell label="인력 절감" value={`${sim.staffSaved}명`} color="text-cyan-400" />
        <Cell label="조사 커버리지" value={`${sim.newCoverage.toFixed(1)}%`} color="text-indigo-400" />
        <Cell label="총 절감 효과" value={formatJo(sim.totalSavings)} color="text-emerald-400" />
      </div>

      {/* Key Message */}
      <KeyMessage
        borderColor={NTS_DATA.borderColor}
        bgColor={NTS_DATA.bgColor}
        titleColor={NTS_DATA.accentColor}
        title="핵심 메시지"
      >
        AI 탐지율을 <span className="text-blue-400 font-bold">{detectionRate}%</span>로,
        자동화를 <span className="text-cyan-400 font-bold">{automationRate}%</span> 적용하면,
        연간 <span className="text-emerald-400 font-bold">{formatJo(sim.totalSavings)}</span> 규모의
        세수 확보 및 행정 효율화가 가능합니다.
        {expansionRate > 1 && (
          <> 조사 커버리지는 현재 1.2%에서{' '}
          <span className="text-indigo-400 font-bold">{sim.newCoverage.toFixed(1)}%</span>로 확대됩니다.</>
        )}
      </KeyMessage>

      {/* 데이터 출처 및 가정 */}
      <InfoSection title="데이터 출처 및 가정" color={NTS_DATA.accentColor}>
        <div>
          <div className="font-semibold mb-2">출처</div>
          <ul className="list-disc list-inside space-y-1">
            {NTS_SOURCES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">주요 가정</div>
          <ul className="list-disc list-inside space-y-1">
            {NTS_ASSUMPTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </InfoSection>
    </div>
  );
}
