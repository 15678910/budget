'use client';

import { useMemo, useState } from 'react';
import { SDG_GOALS } from '@/lib/sdg/goals';
import type { InterlinkageResult, InterlinkagePair } from '@/lib/sdg/interlinkage';

interface Props {
  data: InterlinkageResult;
}

const STRONG_THRESHOLD = 0.5;

function goalMeta(num: number) {
  return SDG_GOALS.find((g) => g.num === num);
}

/** r → 셀 배경색. r>0 녹, r<0 적, r===0 무채색. |r| 강도로 opacity·채도 조절. */
function cellStyle(r: number): React.CSSProperties {
  const mag = Math.abs(r);
  const strong = mag >= STRONG_THRESHOLD;
  // r===0: 무채색(중립)
  if (r === 0) {
    return { backgroundColor: 'rgba(148, 163, 184, 0.18)' }; // slate-400/18%
  }
  const base = r > 0 ? '22, 163, 74' : '220, 38, 38'; // emerald-600 / red-600
  // 약한 상관(|r|<0.5)은 흐리게 + 무채색 쪽으로
  const alpha = strong ? 0.25 + 0.55 * mag : 0.12 + 0.18 * mag;
  return {
    backgroundColor: `rgba(${base}, ${alpha.toFixed(3)})`,
    filter: strong ? undefined : 'saturate(0.45)',
  };
}

function pairLabel(p: InterlinkagePair): string {
  const ga = goalMeta(p.a);
  const gb = goalMeta(p.b);
  const sign = p.r > 0 ? '시너지' : p.r < 0 ? '상충' : '중립';
  const aName = ga ? `${p.a}.${ga.short}` : `목표${p.a}`;
  const bName = gb ? `${p.b}.${gb.short}` : `목표${p.b}`;
  return `${aName} × ${bName}: r=${p.r.toFixed(2)} (n=${p.n}) — ${Math.abs(p.r) >= STRONG_THRESHOLD ? `강한 ${sign}` : p.r === 0 ? '중립' : `약한 ${sign} 경향`}`;
}

export default function InterlinkageMatrix({ data }: Props) {
  const { goals, pairs } = data;

  // (a,b) → pair 조회 맵 (a<b 정규화)
  const pairMap = useMemo(() => {
    const m = new Map<string, InterlinkagePair>();
    for (const p of pairs) m.set(`${p.a}-${p.b}`, p);
    return m;
  }, [pairs]);

  const [hovered, setHovered] = useState<string | null>(null);

  const lookup = (a: number, b: number): InterlinkagePair | null => {
    if (a === b) return null;
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return pairMap.get(`${lo}-${hi}`) ?? null;
  };

  // 강한 상관 상위 예시(절댓값 기준)
  const strongPairs = useMemo(
    () =>
      [...pairs]
        .filter((p) => Math.abs(p.r) >= STRONG_THRESHOLD)
        .sort((x, y) => Math.abs(y.r) - Math.abs(x.r)),
    [pairs],
  );

  return (
    <div className="w-full">
      {/* 한계 고지 박스 (D4 전문) */}
      <div className="mb-6 rounded-xl border border-amber-500/50 bg-amber-950/30 p-4 text-amber-100">
        <p className="font-semibold text-amber-200">⚠️ 탐색적 관측치 — 인과 아님</p>
        <ul className="mt-2 space-y-1 text-sm leading-relaxed text-amber-100/90">
          <li>· 본 매트릭스는 최대 16개 광역의 SDG 목표 <strong>달성도 점수 상관</strong>을 보이는 <strong>탐색적 관측치</strong>입니다.</li>
          <li>· <strong>상관은 인과가 아닙니다.</strong> 정책 효과·인과 관계를 단정하지 않습니다.</li>
          <li>· 표본 = 최대 16광역(쌍별 공통 지역 5~16곳, 각 셀에 실제 n 표기)으로 <strong>검정력이 낮아</strong> 우연일 수 있으며, 일반화에 주의가 필요합니다.</li>
          <li>· 두 목표가 함께 움직이는 것은 <strong>공통요인·간접경로</strong> 때문일 수 있습니다.</li>
          <li>· 계수는 <strong>Spearman 순위상관</strong>(−1~+1)이며, 공통 지역 5곳 미만 쌍은 제외했습니다.</li>
          <li>· 참고: Nilsson et al.(2016) SDG 상호작용 프레임워크 · IGES SDG Interlinkages.</li>
        </ul>
      </div>

      {goals.length === 0 ? (
        <p className="text-sm text-slate-400">표시할 데이터 보유 목표가 없습니다.</p>
      ) : (
        <>
          {/* 히트맵 */}
          <div className="overflow-x-auto">
            <table className="border-separate border-spacing-0.5">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-950 p-1" />
                  {goals.map((g) => {
                    const meta = goalMeta(g);
                    return (
                      <th key={g} className="p-1 align-bottom">
                        <div className="flex flex-col items-center gap-0.5">
                          <img
                            src={`/sdg/sdg-${g}-pic.svg?v=12`}
                            alt={meta?.name ?? `목표 ${g}`}
                            className="h-7 w-7 rounded"
                          />
                          <span className="text-[10px] text-slate-400">{g}</span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {goals.map((rowGoal) => {
                  const rowMeta = goalMeta(rowGoal);
                  return (
                    <tr key={rowGoal}>
                      <th className="sticky left-0 z-10 bg-slate-950 p-1">
                        <div className="flex items-center gap-1.5 pr-2">
                          <img
                            src={`/sdg/sdg-${rowGoal}-pic.svg?v=12`}
                            alt={rowMeta?.name ?? `목표 ${rowGoal}`}
                            className="h-6 w-6 rounded"
                          />
                          <span className="text-[11px] text-slate-300">
                            {rowGoal}. {rowMeta?.short ?? ''}
                          </span>
                        </div>
                      </th>
                      {goals.map((colGoal) => {
                        if (rowGoal === colGoal) {
                          return (
                            <td
                              key={colGoal}
                              className="h-9 w-9 rounded bg-slate-700/40 text-center align-middle text-[10px] text-slate-500"
                              title={`${rowGoal}. ${rowMeta?.short ?? ''} (자기 자신)`}
                            >
                              —
                            </td>
                          );
                        }
                        const p = lookup(rowGoal, colGoal);
                        const key = `${rowGoal}-${colGoal}`;
                        if (!p) {
                          return (
                            <td
                              key={colGoal}
                              className="h-9 w-9 rounded bg-slate-800/40 text-center align-middle text-[10px] text-slate-600"
                              title={`${rowGoal} × ${colGoal}: 공통 표본 부족(또는 산출 불가)`}
                            >
                              ·
                            </td>
                          );
                        }
                        const isHover = hovered === key || hovered === `${p.a}-${p.b}`;
                        return (
                          <td
                            key={colGoal}
                            className={`h-9 w-9 cursor-default rounded text-center align-middle text-[10px] font-medium text-white/90 transition-shadow ${
                              isHover ? 'ring-2 ring-white/70' : ''
                            }`}
                            style={cellStyle(p.r)}
                            title={pairLabel(p)}
                            onMouseEnter={() => setHovered(`${p.a}-${p.b}`)}
                            onMouseLeave={() => setHovered(null)}
                          >
                            {(+p.r.toFixed(1)).toFixed(1)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* 범례 */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded" style={cellStyle(0.8)} /> 양의 상관(시너지 경향)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded" style={cellStyle(-0.8)} /> 음의 상관(상충 경향)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded" style={cellStyle(0.3)} /> 약한 상관(|r|&lt;0.5, 흐림)
            </span>
            <span>· 셀에 마우스를 올리면 r·n·해석을 확인할 수 있습니다.</span>
            <span>— 자기 자신 / · 공통표본&lt;5 제외</span>
          </div>

          {/* 강한 상관 예시 */}
          {strongPairs.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-200">강한 상관 관측(|r| ≥ 0.5) — 탐색적</h2>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                {strongPairs.slice(0, 8).map((p) => (
                  <li key={`${p.a}-${p.b}`} className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 shrink-0 rounded"
                      style={cellStyle(p.r)}
                    />
                    {pairLabel(p)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
