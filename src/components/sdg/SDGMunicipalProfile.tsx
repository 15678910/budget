import { SDG_GOALS } from '@/lib/sdg/goals';
import { getMunicipalSDG } from '@/lib/sdg/municipal';

export function SDGMunicipalProfile({
  metro,
  sgg,
}: {
  metro: string;
  sgg: string;
}) {
  const data = getMunicipalSDG(metro, sgg);
  const goal4 = SDG_GOALS.find((g) => g.num === 4)!;
  const hasAny = data.admissionRate != null || data.fiscal != null;

  return (
    <div className="border border-gray-800 rounded-lg bg-gray-900/30 p-4 space-y-4">
      <h3 className="text-lg font-bold text-gray-100">
        {metro} {sgg} <span className="text-sm text-gray-500">기초 프로파일</span>
      </h3>

      {!hasAny && (
        <div className="rounded-md border border-gray-800 bg-gray-900/40 p-4 text-center text-sm text-gray-500">
          이 시군구의 실측 데이터(진학률·재정)가 없습니다.
        </div>
      )}

      {/* Goal4 진학률 (실측) */}
      {data.admissionRate != null && (
        <div className="rounded-md border border-gray-800 bg-gray-900/40 p-3">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/sdg/sdg-4-pic.svg?v=12`} alt={goal4.name} className="w-9 h-9 rounded" />
            <div>
              <div className="text-[11px] text-gray-400">SDG 4 · 대학 진학률 (실측)</div>
              <div className="font-mono text-lg text-gray-100">
                {data.admissionRate.toFixed(1)}
                <span className="ml-0.5 text-xs text-gray-500">%</span>
              </div>
            </div>
          </div>
          <p className="mt-1 text-[10px] text-gray-600">출처: 한국교육개발원 교육기본통계 2025</p>
        </div>
      )}

      {/* 재정 맥락 (목표 아님) */}
      {data.fiscal && (
        <div>
          <div className="mb-1 text-[11px] font-semibold text-gray-400">💰 재정 맥락 (목표 아님)</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-800/50 rounded p-2">
              <span className="text-gray-400">재정자립도</span>
              <div className="font-mono text-gray-100">{data.fiscal.independence}%</div>
            </div>
            <div className="bg-gray-800/50 rounded p-2">
              <span className="text-gray-400">재정자주도</span>
              <div className="font-mono text-gray-100">{data.fiscal.autonomy}%</div>
            </div>
            <div className="bg-gray-800/50 rounded p-2">
              <span className="text-gray-400">채무비율</span>
              <div className="font-mono text-gray-100">{data.fiscal.debtRatio}%</div>
            </div>
            <div className="bg-gray-800/50 rounded p-2">
              <span className="text-gray-400">예산규모</span>
              <div className="font-mono text-gray-100">{data.fiscal.budget.toLocaleString()}억</div>
            </div>
          </div>
        </div>
      )}

      {/* 나머지 목표 — 데이터 준비중 */}
      <div>
        <div className="mb-1 text-[11px] font-semibold text-gray-400">나머지 목표</div>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {SDG_GOALS.filter((g) => !data.availableGoals.includes(g.num)).map((g) => (
            <div
              key={g.num}
              title={`SDG ${g.num} ${g.name}: 데이터 준비중`}
              className="flex flex-col items-center rounded border border-gray-800 bg-gray-900/40 p-1 opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/sdg/sdg-${g.num}-pic.svg?v=12`} alt={g.name} className="w-7 h-7 rounded" />
              <span className="mt-0.5 text-[9px] text-gray-600">준비중</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-gray-600 border-t border-gray-800 pt-2">{data.note}</p>
    </div>
  );
}
