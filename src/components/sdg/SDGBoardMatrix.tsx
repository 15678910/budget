import { SDG_GOALS, SDG_DOMAINS_5 } from '@/lib/sdg/goals';
import type { Matrix } from '@/lib/sdg/matrix';

function cellColor(v: number | null, color: string): string {
  if (v == null) return 'transparent';
  // 0~100 → 투명도 0.15~1.0 (동적 값이라 인라인 style 허용)
  const a = 0.15 + (v / 100) * 0.85;
  const h = color.replace('#', '');
  const h6 = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(h6, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a.toFixed(2)})`;
}

export function SDGBoardMatrix({
  matrix,
  metros,
  onSelectRegion,
  onSelectGoal,
  selectedRegion,
  selectedGoal,
}: {
  matrix: Matrix;
  metros: readonly string[];
  onSelectRegion: (m: string) => void;
  onSelectGoal: (g: number) => void;
  selectedRegion: string | null;
  selectedGoal: number | null;
}) {
  return (
    <div className="overflow-x-auto border border-gray-800 rounded-lg bg-gray-900/30">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-gray-950 px-2 py-1 text-left text-gray-400">
              지역＼목표
            </th>
            {SDG_GOALS.map((g) => (
              <th
                key={g.num}
                onClick={() => onSelectGoal(g.num)}
                title={`SDG ${g.num} ${g.name}`}
                className={`px-1 py-1 cursor-pointer hover:brightness-125 ${
                  selectedGoal === g.num ? 'ring-2 ring-white' : ''
                }`}
                style={{ background: g.color }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/sdg/sdg-${g.num}-pic.svg?v=12`}
                  alt={g.name}
                  className="w-6 h-6 mx-auto"
                />
                <div className="text-white text-[9px] mt-0.5">{g.num}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metros.map((m) => (
            <tr key={m}>
              <td
                onClick={() => onSelectRegion(m)}
                className={`sticky left-0 z-10 bg-gray-950 px-2 py-1 cursor-pointer whitespace-nowrap font-semibold ${
                  selectedRegion === m ? 'text-white' : 'text-gray-300'
                } hover:text-white`}
              >
                {m}
              </td>
              {SDG_GOALS.map((g) => {
                const v = matrix[m]?.[g.num] ?? null;
                return (
                  <td
                    key={g.num}
                    onClick={() => onSelectRegion(m)}
                    title={
                      v == null
                        ? `${m} · ${g.name}: 데이터 준비중`
                        : `${m} · ${g.name}: ${v}/100`
                    }
                    className="w-7 h-7 text-center border border-gray-900/50 cursor-pointer"
                    style={{ background: cellColor(v, g.color) }}
                  >
                    {v == null ? (
                      <span className="text-gray-700 text-[9px]">·</span>
                    ) : (
                      <span className="text-[9px] font-mono text-white/90">{v}</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap gap-3 px-3 py-2 text-[11px] text-gray-500 border-t border-gray-800">
        {SDG_DOMAINS_5.map((d) => (
          <span key={d.id}>
            {d.label}({d.en}): {d.goals.join('·')}
          </span>
        ))}
        <span className="ml-auto">
          셀 = 대표지표 정규화(0~100, 16광역 분포 기준) · &apos; · &apos;=데이터 준비중 · 종합 SDG 달성도 아님
        </span>
      </div>
    </div>
  );
}
