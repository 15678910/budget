import { SDGBoard } from '@/components/sdg/SDGBoard';
import { assembleIndicatorValues } from '@/lib/sdg/board-data';
import { buildMatrix } from '@/lib/sdg/matrix';
import { INDICATOR_TO_GOAL } from '@/lib/sdg/indicator-map';
import { CANON_16 } from '@/lib/sdg/region-normalize';
import { getMetroFiscalData } from '@/lib/data/fiscal-health-data';
import { SIDO_FULL_TO_SHORT } from '@/lib/sdg/goals';
import type { FiscalContext } from '@/components/sdg/SDGRegionProfile';
import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';

export const metadata: Metadata = {
  title: 'SDG 지역 상황판 (16광역×17목표) | 마을살림/나라살림',
  description:
    '16개 광역 × 17개 SDG 목표 매트릭스 상황판. 실데이터 대표지표 정규화, 출처 명시. 통합 SDG 점수는 미공개이며 종합 달성도와 다를 수 있습니다.',
};

function loadKosis() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'public', 'data', 'sdg-sido.json'), 'utf-8'),
    );
  } catch {
    return { goals: {} };
  }
}

function loadGeo() {
  try {
    return JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'data', 'geo', 'korea-provinces-topo.json'), 'utf-8'),
    );
  } catch {
    return null; // 토포 파일 손상/누락 시 페이지 크래시 대신 빈 지도로 degrade
  }
}

// getMetroFiscalData()는 이미 16광역으로 병합된 배열을 반환한다(광주+전남 = 단일 엔트리
// name '전남광주통합특별시'). 따라서 mergeToCanon16로 재병합하지 않고, 각 엔트리의
// name을 CANON_16 키로 매핑만 한다. debtRatio는 필드가 없어 debt/budget으로 계산한다.
const CANON_16_SET = new Set<string>(CANON_16);

function nameToCanon16(name: string): string | null {
  const short = SIDO_FULL_TO_SHORT[name];
  if (short && CANON_16_SET.has(short)) return short;
  if (name === '전남광주통합특별시') return '광주전남';
  if (CANON_16_SET.has(name)) return name; // name이 이미 약칭인 경우 대비
  return null;
}

function buildFiscalByRegion(): Record<string, FiscalContext> {
  const fiscal = getMetroFiscalData();
  const out: Record<string, FiscalContext> = {};
  for (const m of fiscal) {
    const key = nameToCanon16(m.name);
    if (!key) continue;
    const debtRatio = m.budget > 0 ? Math.round((m.debt / m.budget) * 1000) / 10 : 0;
    out[key] = {
      independence: m.independence,
      autonomy: m.autonomy,
      debtRatio,
      budget: m.budget,
      population: m.population,
    };
  }
  return out;
}

export default function SDGPage() {
  const geoData = loadGeo();
  const kosis = loadKosis();
  const { valuesByIndicator, direction } = assembleIndicatorValues();
  const matrix = buildMatrix({
    metros: CANON_16,
    indicatorToGoal: INDICATOR_TO_GOAL,
    direction,
    valuesByIndicator,
  });
  const fiscalByRegion = buildFiscalByRegion();
  return (
    <div className="w-full max-w-6xl mx-auto">
      <SDGBoard
        matrix={matrix}
        metros={CANON_16}
        fiscalByRegion={fiscalByRegion}
        geoData={geoData}
        kosis={kosis}
      />
    </div>
  );
}
