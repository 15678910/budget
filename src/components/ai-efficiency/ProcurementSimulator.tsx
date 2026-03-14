'use client';

import React, { useState, useMemo } from 'react';
import { Slider, Cell, SectionHeader, InfoSection, KeyMessage, formatJo } from './shared';
import { PPS_DATA, PPS_SLIDERS, PPS_SOURCES, PPS_ASSUMPTIONS } from '@/lib/data/ai-efficiency-data';

export function ProcurementSimulator() {
  const [collusionDetection, setCollusionDetection] = useState(PPS_SLIDERS[0].defaultValue);
  const [processReduction, setProcessReduction] = useState(PPS_SLIDERS[1].defaultValue);
  const [wasteReductionRate, setWasteReductionRate] = useState(PPS_SLIDERS[2].defaultValue);

  const sim = useMemo(() => {
    // 담합 방지 효과 = 탐지율 향상 × 조달시장 × 3% (담합 마크업)
    const collusionSavings = PPS_DATA.procurementMarket * 0.03 * ((collusionDetection - 40) / 100);

    // 프로세스 단축 = 현재 45일 × 단축률
    const daysReduced = Math.round(PPS_DATA.processTime * (processReduction / 100));
    const newProcessDays = PPS_DATA.processTime - daysReduced;

    // 비효율 절감 = 조달시장 × (절감률 - 현재수준) / 100
    const wasteReduction = PPS_DATA.procurementMarket * (Math.max(0, wasteReductionRate - PPS_DATA.currentWasteRate) / 100) * 0.5;
    // 기존 비효율도 절감에 포함
    const baseSavings = PPS_DATA.procurementMarket * (wasteReductionRate / 100) * 0.5;

    const totalSavings = collusionSavings + baseSavings;
    const detectedCases = Math.round(PPS_DATA.collusionCases * (collusionDetection / 100));

    return {
      collusionSavings,
      daysReduced,
      newProcessDays,
      baseSavings,
      totalSavings,
      detectedCases,
    };
  }, [collusionDetection, processReduction, wasteReductionRate]);

  return (
    <div className="space-y-6">
      {/* 현황 Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5">
        <SectionHeader title="현황 Overview" color={PPS_DATA.accentColor} />
        <Cell label="조달 시장" value={formatJo(PPS_DATA.procurementMarket)} color="text-emerald-400" sub="나라장터 기준" />
        <Cell label="평균 낙찰률" value={`${PPS_DATA.avgBidRate}%`} color="text-emerald-400" sub="예정가 대비" />
        <Cell label="담합 적발" value={`${PPS_DATA.collusionCases}건`} color="text-red-400" sub="연간 적발 건수" />
        <Cell label="조달 소요일" value={`${PPS_DATA.processTime}일`} color="text-emerald-400" sub="공고~계약체결" />
        <Cell label="비효율" value={`${PPS_DATA.currentWasteRate}%`} color="text-amber-400" sub="과다지출 추정률" />
      </div>

      {/* 시뮬레이션 설정 */}
      <div className="border border-border p-4 md:p-5">
        <div className={`text-sm md:text-base font-semibold uppercase tracking-widest ${PPS_DATA.accentColor} mb-4`}>
          시뮬레이션 설정 Simulation Parameters
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Slider
            label={PPS_SLIDERS[0].label}
            value={collusionDetection}
            min={PPS_SLIDERS[0].min}
            max={PPS_SLIDERS[0].max}
            step={PPS_SLIDERS[0].step}
            unit={PPS_SLIDERS[0].unit}
            subLabel={PPS_SLIDERS[0].description}
            color={PPS_DATA.accentColor}
            onChange={setCollusionDetection}
          />
          <Slider
            label={PPS_SLIDERS[1].label}
            value={processReduction}
            min={PPS_SLIDERS[1].min}
            max={PPS_SLIDERS[1].max}
            step={PPS_SLIDERS[1].step}
            unit={PPS_SLIDERS[1].unit}
            subLabel={PPS_SLIDERS[1].description}
            color={PPS_DATA.accentColor}
            onChange={setProcessReduction}
          />
          <Slider
            label={PPS_SLIDERS[2].label}
            value={wasteReductionRate}
            min={PPS_SLIDERS[2].min}
            max={PPS_SLIDERS[2].max}
            step={PPS_SLIDERS[2].step}
            unit={PPS_SLIDERS[2].unit}
            subLabel={PPS_SLIDERS[2].description}
            color={PPS_DATA.accentColor}
            onChange={setWasteReductionRate}
          />
        </div>
      </div>

      {/* AI 효과 분석 Results */}
      <div className="grid grid-cols-2 md:grid-cols-4">
        <SectionHeader title="AI 효과 분석 Results" color={PPS_DATA.accentColor} />
        <Cell label="담합 방지 절감" value={formatJo(sim.collusionSavings)} color="text-emerald-400" />
        <Cell label="소요일 단축" value={`${sim.daysReduced}일 → ${sim.newProcessDays}일`} color="text-cyan-400" />
        <Cell label="비효율 절감" value={formatJo(sim.baseSavings)} color="text-indigo-400" />
        <Cell label="총 절감 효과" value={formatJo(sim.totalSavings)} color="text-emerald-400" />
      </div>

      {/* Key Message */}
      <KeyMessage
        borderColor={PPS_DATA.borderColor}
        bgColor={PPS_DATA.bgColor}
        titleColor={PPS_DATA.accentColor}
        title="핵심 메시지"
      >
        AI 담합 탐지율을 <span className="text-emerald-400 font-bold">{collusionDetection}%</span>로 높이고,
        프로세스를 <span className="text-cyan-400 font-bold">{processReduction}%</span> 단축하면,
        연간 <span className="text-emerald-400 font-bold">{formatJo(sim.totalSavings)}</span> 규모의
        조달 비용 절감이 가능합니다. 담합 적발 건수는{' '}
        <span className="text-red-400 font-bold">{sim.detectedCases}건</span>으로 확대되고,
        조달 소요일은 <span className="text-cyan-400 font-bold">{sim.newProcessDays}일</span>로 단축됩니다.
      </KeyMessage>

      {/* 데이터 출처 및 가정 */}
      <InfoSection title="데이터 출처 및 가정" color={PPS_DATA.accentColor}>
        <div>
          <div className="font-semibold mb-2">출처</div>
          <ul className="list-disc list-inside space-y-1">
            {PPS_SOURCES.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">주요 가정</div>
          <ul className="list-disc list-inside space-y-1">
            {PPS_ASSUMPTIONS.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      </InfoSection>
    </div>
  );
}
