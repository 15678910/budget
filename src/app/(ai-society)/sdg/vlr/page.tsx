import { VLRReport } from '@/components/sdg/VLRReport';
import { assembleIndicatorValues } from '@/lib/sdg/board-data';
import { CANON_16 } from '@/lib/sdg/region-normalize';
import { getMetroFiscalData } from '@/lib/data/fiscal-health-data';
import { SIDO_FULL_TO_SHORT } from '@/lib/sdg/goals';
import { getTargets } from '@/lib/sdg/ontology';
import { buildVLR, type VLRFiscal, type VLRReport as VLRReportData } from '@/lib/sdg/vlr';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VLR 지역 자기평가 리포트',
  description:
    'UN-Habitat VLR(Voluntary Local Review) 6단계 구조로 광역 자치단체의 K-SDGs 목표 대비 달성도를 자기평가하고 인쇄(PDF)할 수 있는 리포트. 데이터 기반 자기진단이며 정책 인과를 주장하지 않습니다.',
};

// getMetroFiscalData()는 16광역 병합 배열(name '전남광주통합특별시' = 광주+전남).
// 각 엔트리 name을 CANON_16 키로 매핑한다(sdg/page.tsx와 동일 패턴).
const CANON_16_SET = new Set<string>(CANON_16);

function nameToCanon16(name: string): string | null {
  const short = SIDO_FULL_TO_SHORT[name];
  if (short && CANON_16_SET.has(short)) return short;
  if (name === '전남광주통합특별시') return '광주전남';
  if (CANON_16_SET.has(name)) return name;
  return null;
}

function buildFiscalByRegion(): Record<string, VLRFiscal> {
  const out: Record<string, VLRFiscal> = {};
  for (const m of getMetroFiscalData()) {
    const key = nameToCanon16(m.name);
    if (!key) continue;
    const debtRatio = m.budget > 0 ? Math.round((m.debt / m.budget) * 1000) / 10 : 0;
    out[key] = {
      budget: m.budget,
      independence: m.independence,
      autonomy: m.autonomy,
      debtRatio,
      population: m.population,
    };
  }
  return out;
}

/** 16광역 재정 평균(재정 취약 판정 기준). 데이터 없으면 0. */
function nationalAvgOf(fiscalByRegion: Record<string, VLRFiscal>): {
  independence: number;
  autonomy: number;
} {
  const arr = Object.values(fiscalByRegion);
  if (arr.length === 0) return { independence: 0, autonomy: 0 };
  const ind = arr.reduce((s, f) => s + f.independence, 0) / arr.length;
  const aut = arr.reduce((s, f) => s + f.autonomy, 0) / arr.length;
  return {
    independence: Math.round(ind * 10) / 10,
    autonomy: Math.round(aut * 10) / 10,
  };
}

export default async function VLRPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const { region } = await searchParams;
  const { valuesByIndicator, direction } = assembleIndicatorValues();
  const fiscalByRegion = buildFiscalByRegion();
  const nationalAvg = nationalAvgOf(fiscalByRegion);

  // 16광역 VLR을 서버에서 사전 빌드(순수 함수). 클라이언트는 선택·렌더만.
  const vlrByRegion: Record<string, VLRReportData> = {};
  for (const r of CANON_16) {
    vlrByRegion[r] = buildVLR(r, {
      valuesByIndicator,
      direction,
      fiscal: fiscalByRegion[r] ?? null,
      getTargets,
      nationalAvg,
    });
  }

  const initialRegion = region && CANON_16_SET.has(region) ? region : undefined;

  return (
    <div className="w-full">
      <VLRReport
        regions={[...CANON_16]}
        vlrByRegion={vlrByRegion}
        initialRegion={initialRegion}
      />
    </div>
  );
}
