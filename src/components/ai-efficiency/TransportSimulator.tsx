'use client';
import React, { useState, useMemo } from 'react';
import { Slider, Cell, SectionHeader, InfoSection, KeyMessage, formatJo } from './shared';
import { MOLIT_DATA, MOLIT_SLIDERS, MOLIT_SOURCES, MOLIT_ASSUMPTIONS } from '@/lib/data/ai-efficiency-data';

export function TransportSimulator() {
  const [congestionReduction, setCongestionReduction] = useState(MOLIT_SLIDERS[0].defaultValue);
  const [transitIncrease, setTransitIncrease] = useState(MOLIT_SLIDERS[1].defaultValue);
  const [smartCityCount, setSmartCityCount] = useState(MOLIT_SLIDERS[2].defaultValue);
  const [maintenanceEfficiency, setMaintenanceEfficiency] = useState(MOLIT_SLIDERS[3].defaultValue);

  const sim = useMemo(() => {
    // 교통 혼잡비용 절감
    const congestionSavings = MOLIT_DATA.congestionCost * (congestionReduction / 100);

    // 대중교통 효과 (이용률 1%p 증가당 약 0.5조원 절감)
    const transitSavings = transitIncrease * 0.5;
    const newTransitRate = MOLIT_DATA.publicTransitRate + transitIncrease;

    // 스마트시티 효과 (도시당 약 200억원 = 0.02조원 절감)
    const newSmartCities = smartCityCount - MOLIT_DATA.smartCityCurrent;
    const smartCitySavings = newSmartCities * 0.02;
    const smartCityRatio = (smartCityCount / MOLIT_DATA.totalCities) * 100;

    // 인프라 유지보수 절감
    const maintenanceSavings = MOLIT_DATA.infraMaintenanceCost * (maintenanceEfficiency / 100);

    const totalSavings = congestionSavings + transitSavings + smartCitySavings + maintenanceSavings;

    return {
      congestionSavings,
      transitSavings,
      newTransitRate,
      smartCitySavings,
      smartCityRatio,
      maintenanceSavings,
      totalSavings,
      newSmartCities,
    };
  }, [congestionReduction, transitIncrease, smartCityCount, maintenanceEfficiency]);

  return (
    <div className="space-y-6">
      {/* 1. 현황 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border border-border">
        <SectionHeader title="교통·도시 현황 Transport & City Overview" color={MOLIT_DATA.accentColor} />
        <Cell
          label="연간 교통 혼잡비용"
          value={formatJo(67)}
          color="text-amber-400"
        />
        <Cell
          label="전국 이용률"
          value="40%"
          color="text-amber-400"
          sub="대중교통 이용률"
        />
        <Cell
          label="인프라 유지보수 예산"
          value={formatJo(15)}
          color="text-amber-400"
        />
        <Cell
          label="스마트시티"
          value="8개"
          color="text-orange-400"
          sub={`전국 ${MOLIT_DATA.totalCities}개 도시 중`}
        />
        <Cell
          label="스마트시티 적용률"
          value={`${((8 / 75) * 100).toFixed(1)}%`}
          color="text-amber-400"
        />
      </div>

      {/* 2. 시뮬레이션 설정 */}
      <div className="border border-border p-4 md:p-5 space-y-1">
        <div className={`text-sm md:text-base font-semibold uppercase tracking-widest ${MOLIT_DATA.accentColor} mb-4`}>
          시뮬레이션 설정 Simulation Settings
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <Slider
            label={MOLIT_SLIDERS[0].label}
            value={congestionReduction}
            min={MOLIT_SLIDERS[0].min}
            max={MOLIT_SLIDERS[0].max}
            step={MOLIT_SLIDERS[0].step}
            unit={MOLIT_SLIDERS[0].unit}
            color="text-amber-400"
            onChange={setCongestionReduction}
          />
          <Slider
            label={MOLIT_SLIDERS[1].label}
            value={transitIncrease}
            min={MOLIT_SLIDERS[1].min}
            max={MOLIT_SLIDERS[1].max}
            step={MOLIT_SLIDERS[1].step}
            unit={MOLIT_SLIDERS[1].unit}
            color="text-orange-400"
            onChange={setTransitIncrease}
          />
          <Slider
            label={MOLIT_SLIDERS[2].label}
            value={smartCityCount}
            min={MOLIT_SLIDERS[2].min}
            max={MOLIT_SLIDERS[2].max}
            step={MOLIT_SLIDERS[2].step}
            unit={MOLIT_SLIDERS[2].unit}
            color="text-yellow-400"
            onChange={setSmartCityCount}
          />
          <Slider
            label={MOLIT_SLIDERS[3].label}
            value={maintenanceEfficiency}
            min={MOLIT_SLIDERS[3].min}
            max={MOLIT_SLIDERS[3].max}
            step={MOLIT_SLIDERS[3].step}
            unit={MOLIT_SLIDERS[3].unit}
            color="text-amber-400"
            onChange={setMaintenanceEfficiency}
          />
        </div>
      </div>

      {/* 3. AI 효과 분석 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border border-border">
        <SectionHeader title="AI 효과 분석 Results" color={MOLIT_DATA.accentColor} />
        <Cell
          label="혼잡비용 절감"
          value={formatJo(sim.congestionSavings)}
          color="text-amber-400"
        />
        <Cell
          label="대중교통 효과"
          value={formatJo(sim.transitSavings)}
          color="text-orange-400"
          sub={`이용률 ${sim.newTransitRate}%`}
        />
        <Cell
          label="스마트시티 효과"
          value={formatJo(sim.smartCitySavings)}
          color="text-yellow-400"
          sub={`${smartCityCount}개 (${sim.smartCityRatio.toFixed(0)}%)`}
        />
        <Cell
          label="유지보수 절감"
          value={formatJo(sim.maintenanceSavings)}
          color="text-amber-400"
        />
        <Cell
          label="총 절감 효과"
          value={formatJo(sim.totalSavings)}
          color="text-emerald-400"
        />
      </div>

      {/* 4. KeyMessage */}
      <KeyMessage
        borderColor={MOLIT_DATA.borderColor}
        bgColor={MOLIT_DATA.bgColor}
        titleColor={MOLIT_DATA.accentColor}
        title="핵심 메시지 Key Message"
      >
        현재 설정 기준으로 AI 교통·도시 최적화를 통해 연간{' '}
        <strong>{formatJo(sim.totalSavings)}</strong>의 사회적 비용 절감이 가능합니다.
        교통 혼잡비용 {formatJo(sim.congestionSavings)} 절감, 대중교통 이용률{' '}
        {sim.newTransitRate}%로 향상, 스마트시티 {smartCityCount}개({sim.smartCityRatio.toFixed(0)}%) 확산을
        통해 국민 삶의 질과 도시 경쟁력을 동시에 높일 수 있습니다.
        {sim.newSmartCities > 0 && (
          <> 신규 스마트시티 {sim.newSmartCities}개 추가 구축으로 도시 행정 효율화 기반이 마련됩니다.</>
        )}
      </KeyMessage>

      {/* 5. InfoSection - 출처 및 가정 */}
      <div className="space-y-3">
        <InfoSection title="데이터 출처 Data Sources" color={MOLIT_DATA.accentColor}>
          <ul className="space-y-2 list-disc list-inside text-sm md:text-base text-muted-foreground">
            {MOLIT_SOURCES.map((source, i) => (
              <li key={i}>{source}</li>
            ))}
          </ul>
        </InfoSection>
        <InfoSection title="주요 가정 Assumptions" color={MOLIT_DATA.accentColor}>
          <ul className="space-y-2 list-disc list-inside text-sm md:text-base text-muted-foreground">
            {MOLIT_ASSUMPTIONS.map((assumption, i) => (
              <li key={i}>{assumption}</li>
            ))}
          </ul>
        </InfoSection>
      </div>
    </div>
  );
}
