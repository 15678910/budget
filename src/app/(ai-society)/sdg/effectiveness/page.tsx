import type { Metadata } from 'next';
import EffectivenessPanel from '@/components/sdg/EffectivenessPanel';
import { assembleIndicatorValues } from '@/lib/sdg/board-data';
import { assembleBase2018 } from '@/lib/sdg/base2018';
import { CANON_16 } from '@/lib/sdg/region-normalize';
import {
  budgetEfficiency,
  outcomeSummary,
  type FiscalInput,
  type OutcomeSummary,
} from '@/lib/sdg/effectiveness';
import { getMetroFiscalData } from '@/lib/data/fiscal-health-data';
import { SIDO_FULL_TO_SHORT } from '@/lib/sdg/goals';

export const metadata: Metadata = {
  title: '실효성·효율성(예산-성과) | 마을살림/나라살림',
  description:
    '16개 광역의 1인당 예산 × 종합 SDG 달성도 효율 사분면과 output/outcome 패널. 예산-성과는 상관 맥락이며 정책 인과 귀속(반사실)은 불가합니다(OECD 6기준).',
};

// getMetroFiscalData()는 이미 16광역으로 병합된 배열(광주+전남 = '전남광주통합특별시').
// name을 CANON_16 키로 매핑만 한다((ai-society)/sdg/page.tsx buildFiscalByRegion 패턴).
const CANON_16_SET = new Set<string>(CANON_16);

function nameToCanon16(name: string): string | null {
  const short = SIDO_FULL_TO_SHORT[name];
  if (short && CANON_16_SET.has(short)) return short;
  if (name === '전남광주통합특별시') return '광주전남';
  if (CANON_16_SET.has(name)) return name;
  return null;
}

function buildFiscalByRegion(): Record<string, FiscalInput> {
  const out: Record<string, FiscalInput> = {};
  for (const m of getMetroFiscalData()) {
    const key = nameToCanon16(m.name);
    if (!key) continue;
    out[key] = {
      budget: m.budget,
      population: m.population,
      independence: m.independence,
      debt: m.debt,
    };
  }
  return out;
}

export default function SDGEffectivenessPage() {
  const { valuesByIndicator, direction } = assembleIndicatorValues();
  const base2018ByIndicator = assembleBase2018();
  const fiscalByRegion = buildFiscalByRegion();

  const efficiency = budgetEfficiency(
    [...CANON_16],
    fiscalByRegion,
    valuesByIndicator,
    direction,
  );

  // 효율 점이 산정된 광역만 패널 대상(달성도·재정 보유). 달성도 순위로 rank 부여.
  const rankByAch = [...efficiency.points]
    .sort((a, b) => (b.achievement - a.achievement) || a.region.localeCompare(b.region))
    .reduce<Record<string, number>>((m, p, i) => {
      m[p.region] = i + 1;
      return m;
    }, {});

  const regions = efficiency.points.map((p) => p.region);
  const summaries: Record<string, OutcomeSummary> = {};
  for (const region of regions) {
    const f = fiscalByRegion[region];
    if (!f) continue;
    summaries[region] = outcomeSummary(
      region,
      f,
      valuesByIndicator,
      direction,
      base2018ByIndicator,
      rankByAch[region],
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">실효성·효율성 — 예산 대비 성과</h1>
        <p className="mt-2 text-sm text-slate-400">
          16개 광역의 <strong>1인당 예산</strong>과 <strong>종합 SDG 달성도</strong>를 효율 사분면으로
          보고, 선택 광역의 Output(재정)·Outcome(성과)·Impact·Benchmarking을 정리합니다.
          예산-성과는 <strong>상관 맥락</strong>이며 정책 효과의 인과 귀속은 불가합니다.
        </p>
      </header>
      <EffectivenessPanel
        efficiency={efficiency}
        summaries={summaries}
        regions={regions}
      />
    </div>
  );
}
