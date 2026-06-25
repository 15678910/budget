'use client';

import { useState } from 'react';
import EfficiencyScatter from './EfficiencyScatter';
import { trafficColor } from '@/lib/sdg/scoring';
import type {
  BudgetEfficiencyResult,
  OutcomeSummary,
  LightCounts,
} from '@/lib/sdg/effectiveness';

interface Props {
  /** 효율 사분면 데이터(전 광역). */
  efficiency: BudgetEfficiencyResult;
  /** 광역명 → output/outcome 요약. */
  summaries: Record<string, OutcomeSummary>;
  /** 선택 가능한 광역명(달성도·재정 보유) 목록. */
  regions: string[];
}

const LIGHT_KEYS: (keyof LightCounts)[] = ['green', 'yellow', 'orange', 'red'];
const LIGHT_LABEL: Record<keyof LightCounts, string> = {
  green: '양호', yellow: '주의', orange: '미흡', red: '심각',
};

export default function EffectivenessPanel({ efficiency, summaries, regions }: Props) {
  const [selected, setSelected] = useState<string>(regions[0] ?? '');
  const summary = summaries[selected];

  return (
    <div className="space-y-6">
      {/* 강한 면책 박스 (spec D3 — OECD 6기준·인과 귀속 불가) */}
      <DisclaimerBox />

      {/* 효율 사분면 산점도 */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-100">예산-성과 효율 사분면</h2>
          <label className="text-sm text-slate-300">
            선택 광역{' '}
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="ml-1 rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-sm text-slate-100"
            >
              {regions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </label>
        </div>
        <EfficiencyScatter data={efficiency} selected={selected} onSelect={setSelected} />
      </section>

      {/* output / outcome / impact / benchmarking */}
      {summary && (
        <section className="grid gap-4 md:grid-cols-2">
          <OutputCard summary={summary} region={selected} />
          <OutcomeCard summary={summary} />
          <ImpactCard />
          <BenchmarkCard rank={summary.rank} total={efficiency.points.length} />
        </section>
      )}
    </div>
  );
}

// ── 면책 박스 ────────────────────────────────────────────────
function DisclaimerBox() {
  return (
    <aside className="rounded-lg border border-amber-700/60 bg-amber-950/30 p-4 text-sm leading-relaxed text-amber-100">
      <p className="font-bold text-amber-200">⚠️ 실효성·효율성 해석 한계 (반드시 읽어주세요)</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-100/90">
        <li><strong>정책 인과 귀속 불가</strong> — 반사실(counterfactual)이 없어 예산이 성과를 만들었다고 단정할 수 없습니다.</li>
        <li><strong>예산-성과 = 상관</strong>일 뿐 인과가 아닙니다. 지역 여건(인구·산업·고령화·지리) 차이가 교란합니다.</li>
        <li>SDG별 예산 배분은 <strong>세출 미분류</strong>로 추정하지 않습니다. 총예산 대비 성과의 개략 맥락만 봅니다.</li>
        <li><strong>데이터 보유 목표만</strong> 평균에 반영합니다(없는 목표 제외 → 광역 간 비교 한계).</li>
      </ul>
      <p className="mt-2 text-xs text-amber-200/70">
        OECD 평가 6기준(적절성·정합성·효율성·효과성·영향·지속가능성, 2024) 중
        <strong> 영향(impact)</strong>은 귀속 한계로 산정에서 제외합니다.
      </p>
    </aside>
  );
}

// ── Output 카드 ─────────────────────────────────────────────
function OutputCard({ summary, region }: { summary: OutcomeSummary; region: string }) {
  const { budget, independence, debtRatio } = summary.output;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
      <h3 className="text-sm font-bold text-sky-300">Output · 투입/산출 ({region})</h3>
      <dl className="mt-2 space-y-1 text-sm text-slate-300">
        <Row label="예산규모" value={`${budget.toLocaleString()} 억원`} />
        <Row label="재정자립도" value={`${independence.toFixed(1)} %`} />
        <Row label="채무비율" value={`${debtRatio.toFixed(1)} % (채무/예산)`} />
      </dl>
    </div>
  );
}

// ── Outcome 카드 ────────────────────────────────────────────
function OutcomeCard({ summary }: { summary: OutcomeSummary }) {
  const { achievement, lightCounts, trend } = summary.outcome;
  const total = LIGHT_KEYS.reduce((s, k) => s + lightCounts[k], 0);
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
      <h3 className="text-sm font-bold text-emerald-300">Outcome · 성과</h3>
      <p className="mt-1 text-sm text-slate-300">
        종합 달성도 <strong className="text-slate-100">{achievement ?? '—'}</strong> / 100
      </p>
      {/* 신호등 분포 막대 */}
      <div className="mt-2 flex h-3 w-full overflow-hidden rounded">
        {total > 0
          ? LIGHT_KEYS.map((k) =>
              lightCounts[k] > 0 ? (
                <div
                  key={k}
                  title={`${LIGHT_LABEL[k]} ${lightCounts[k]}개 목표`}
                  style={{ width: `${(lightCounts[k] / total) * 100}%`, backgroundColor: trafficColor(k) }}
                />
              ) : null,
            )
          : <div className="w-full bg-slate-700" />}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-400">
        {LIGHT_KEYS.map((k) => (
          <span key={k}>
            <span style={{ color: trafficColor(k) }}>●</span> {LIGHT_LABEL[k]} {lightCounts[k]}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm text-slate-300">
        추세(2018→최신, 개략): <span className="text-emerald-400">↗ {trend.up}</span>{' '}
        <span className="text-slate-400">→ {trend.flat}</span>{' '}
        <span className="text-rose-400">↘ {trend.down}</span>
      </p>
    </div>
  );
}

// ── Impact 카드 (면책) ──────────────────────────────────────
function ImpactCard() {
  return (
    <div className="rounded-lg border border-rose-800/60 bg-rose-950/20 p-4">
      <h3 className="text-sm font-bold text-rose-300">Impact · 인과 영향</h3>
      <p className="mt-2 text-sm leading-relaxed text-rose-100/90">
        <strong>정책 인과 귀속 불가</strong> — 반사실(counterfactual)이 없습니다.
        해당 예산이 없었을 때의 성과를 관측할 수 없어, 예산이 이 성과를 <strong>인과했다고
        산정하지 않습니다.</strong> 위 Output·Outcome은 상관 맥락일 뿐입니다.
      </p>
    </div>
  );
}

// ── Benchmarking 카드 ───────────────────────────────────────
function BenchmarkCard({ rank, total }: { rank?: number; total: number }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4">
      <h3 className="text-sm font-bold text-violet-300">Benchmarking · 순위</h3>
      <p className="mt-2 text-sm text-slate-300">
        종합 달성도 기준{' '}
        <strong className="text-slate-100">{rank ?? '—'}</strong>위 / 데이터 보유 {total}개 광역
      </p>
      <p className="mt-1 text-xs text-slate-500">
        달성도 보유 목표 수가 광역마다 달라 순위는 참고용입니다.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-slate-100">{value}</dd>
    </div>
  );
}
