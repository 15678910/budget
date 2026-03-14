'use client';

import React, { useState, useMemo } from 'react';
import { Slider, Cell, SectionHeader, InfoSection, KeyMessage, formatJo } from './shared';
import { MOHW_DATA, MOHW_SLIDERS, MOHW_SOURCES, MOHW_ASSUMPTIONS } from '@/lib/data/ai-efficiency-data';

// ============================================================
// 보건복지부 AI 복지 사각지대 분석 시뮬레이터
// Ministry of Health and Welfare – AI Welfare Blind Spot Simulator
// ============================================================

export function WelfareSimulator() {
  const [discoveryRate, setDiscoveryRate] = useState(MOHW_SLIDERS[0].defaultValue);
  const [fraudDetection, setFraudDetection] = useState(MOHW_SLIDERS[1].defaultValue);
  const [counselingAuto, setCounselingAuto] = useState(MOHW_SLIDERS[2].defaultValue);

  const sim = useMemo(() => {
    // 사각지대 발굴 가구 수
    const discoveredHouseholds = Math.round(MOHW_DATA.blindSpotHouseholds * (discoveryRate / 100));
    // 발굴 가구 지원 소요액 (가구당 월 80만원 가정)
    const supportCost = discoveredHouseholds * 80 * 12 / 10000; // 조원

    // 부정수급 차단액
    const fraudBlocked = MOHW_DATA.fraudAmount * (fraudDetection / 100);

    // 상담 자동화 절감
    const automatedCases = Math.round(MOHW_DATA.counselingCases * (counselingAuto / 100));
    // 상담 인력 절감 (3만명 공무원 x 자동화율 x 40% 대체)
    const staffSavings = 30000 * (counselingAuto / 100) * 0.4 * 0.6 / 10000; // 조원

    const totalSavings = fraudBlocked + staffSavings;

    return {
      discoveredHouseholds,
      supportCost,
      fraudBlocked,
      automatedCases,
      staffSavings,
      totalSavings,
    };
  }, [discoveryRate, fraudDetection, counselingAuto]);

  return (
    <div className="space-y-6">
      {/* ── 1. 현황 ── */}
      <div>
        <SectionHeader title="복지 현황 Welfare Overview" color={MOHW_DATA.accentColor} />
        <div className="grid grid-cols-2 md:grid-cols-5">
          <Cell label="수급자" value="240만명" color="text-rose-400" sub="기초생활수급자" />
          <Cell label="사각지대" value="93만가구" color="text-red-400" sub="추정 복지 사각지대" />
          <Cell label="복지예산" value={formatJo(MOHW_DATA.welfareBudget)} color="text-rose-400" sub="2026 보건복지 예산" />
          <Cell label="부정수급" value={formatJo(MOHW_DATA.fraudAmount)} color="text-amber-400" sub="연간 추정 규모" />
          <Cell label="상담건수" value="500만건" color="text-rose-400" sub="연간 복지 상담" />
        </div>
      </div>

      {/* ── 2. 시뮬레이션 설정 ── */}
      <div className="border border-border rounded p-4 md:p-5 space-y-1">
        <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          시뮬레이션 설정
        </div>
        <Slider
          label={MOHW_SLIDERS[0].label}
          value={discoveryRate}
          min={MOHW_SLIDERS[0].min}
          max={MOHW_SLIDERS[0].max}
          step={MOHW_SLIDERS[0].step}
          unit={MOHW_SLIDERS[0].unit}
          color={MOHW_DATA.accentColor}
          onChange={setDiscoveryRate}
        />
        <Slider
          label={MOHW_SLIDERS[1].label}
          value={fraudDetection}
          min={MOHW_SLIDERS[1].min}
          max={MOHW_SLIDERS[1].max}
          step={MOHW_SLIDERS[1].step}
          unit={MOHW_SLIDERS[1].unit}
          color={MOHW_DATA.accentColor}
          onChange={setFraudDetection}
        />
        <Slider
          label={MOHW_SLIDERS[2].label}
          value={counselingAuto}
          min={MOHW_SLIDERS[2].min}
          max={MOHW_SLIDERS[2].max}
          step={MOHW_SLIDERS[2].step}
          unit={MOHW_SLIDERS[2].unit}
          color={MOHW_DATA.accentColor}
          onChange={setCounselingAuto}
        />
      </div>

      {/* ── 3. AI 효과 분석 ── */}
      <div>
        <SectionHeader title="AI 효과 분석 Impact Analysis" color={MOHW_DATA.accentColor} />
        <div className="grid grid-cols-2 md:grid-cols-4">
          <Cell
            label="발굴 가구"
            value={`${sim.discoveredHouseholds}만 가구`}
            color="text-rose-400"
            sub="신규 복지 수혜"
          />
          <Cell
            label="부정수급 차단"
            value={formatJo(sim.fraudBlocked)}
            color="text-emerald-400"
          />
          <Cell
            label="상담 자동화"
            value={`${sim.automatedCases}만건`}
            color="text-pink-400"
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
        borderColor={MOHW_DATA.borderColor}
        bgColor={MOHW_DATA.bgColor}
        titleColor={MOHW_DATA.accentColor}
        title="핵심 메시지"
      >
        AI 빅데이터 분석으로 복지 사각지대 <strong>{sim.discoveredHouseholds}만 가구</strong>를 신규 발굴하고,
        부정수급 <strong>{formatJo(sim.fraudBlocked)}</strong>을 차단하며,
        상담 자동화로 연간 <strong>{sim.automatedCases}만건</strong>을 처리할 수 있습니다.
        총 <strong>{formatJo(sim.totalSavings)}</strong> 규모의 재정 효율화가 가능합니다.
      </KeyMessage>

      {/* ── 5. 출처 및 가정 ── */}
      <InfoSection title="데이터 출처 및 가정" color={MOHW_DATA.accentColor}>
        <div>
          <div className="font-semibold mb-1">출처</div>
          <ul className="list-disc list-inside space-y-1">
            {MOHW_SOURCES.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-1">주요 가정</div>
          <ul className="list-disc list-inside space-y-1">
            {MOHW_ASSUMPTIONS.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </InfoSection>
    </div>
  );
}
