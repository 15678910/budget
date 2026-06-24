'use client';

import { useMemo, useState } from 'react';
import type { VLRReport as VLRReportData } from '@/lib/sdg/vlr';
import {
  Disclaimer,
  ContextSection,
  LocalizationSection,
  GoalProgressSection,
  PrioritiesSection,
  MeansSection,
  LessonsSection,
} from './VLRSections';

// 서버에서 사전 빌드한 지역별 VLR 데이터 맵을 받아 선택·렌더만 수행한다(순수 렌더).
// 산출은 buildVLR(순수)에서 끝났으므로 클라이언트는 계산을 하지 않는다.
export interface VLRReportProps {
  /** 선택 가능한 지역 목록(CANON_16 순서). */
  regions: string[];
  /** 지역 약칭 → VLR 데이터. */
  vlrByRegion: Record<string, VLRReportData>;
  /** 초기 선택 지역(URL ?region 등). 미지정 시 regions[0]. */
  initialRegion?: string;
}

export function VLRReport({ regions, vlrByRegion, initialRegion }: VLRReportProps) {
  const first = regions[0] ?? '';
  const start = initialRegion && vlrByRegion[initialRegion] ? initialRegion : first;
  const [region, setRegion] = useState(start);

  const data = useMemo(() => vlrByRegion[region], [vlrByRegion, region]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* 컨트롤 바 — 인쇄 시 숨김 */}
      <div className="vlr-controls mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="vlr-region" className="text-sm text-muted-foreground">
            지역
          </label>
          <select
            id="vlr-region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
          >
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-sky-700/60 bg-sky-950/30 px-3 py-1.5 text-sm text-sky-200 hover:bg-sky-900/40"
        >
          🖨 인쇄 / PDF 저장
        </button>
      </div>

      <div className="vlr-report-root space-y-6">
        <header className="vlr-section">
          <h1 className="text-2xl font-bold text-foreground">
            {region} VLR 지역 자기평가 리포트
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Voluntary Local Review · UN-Habitat 6단계 구조 · K-SDGs 기반
          </p>
        </header>

        <Disclaimer />

        {data ? (
          <>
            <ContextSection data={data} />
            <LocalizationSection data={data} />
            <GoalProgressSection data={data} />
            <PrioritiesSection data={data} />
            <MeansSection data={data} />
            <LessonsSection data={data} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">선택한 지역의 데이터가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
