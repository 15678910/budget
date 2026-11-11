import type { ScenarioRow } from '@/lib/basic-income/types';
import { fmtJo, fmtPct, fmtWon } from './format';

function detail(r: ScenarioRow): string | null {
  if (r.extraReturnToGeneral !== null) return `위탁 추가 수익 연 ${fmtJo(r.extraReturnToGeneral, 2)} → 일반회계`;
  if (r.child) {
    return `1인당 연 ${fmtWon(r.child.perChildAnnualWon)} 적립 · 연 ${fmtJo(r.child.annualCostSteady)} · 여유자금으로 ${fmtPct(r.child.coveredShare)} 감당 · 해마다 새 계좌 ${r.child.births.toLocaleString('ko-KR')}개(출생아 수, 인구 변화율과 따로 넣음) · 18세 목표 ${r.child.reachesTarget ? '도달' : '미달'}`;
  }
  return null;
}

/** 미래대응기금 쓰임새 네 가지를 같은 엔진으로 비교 */
export function ScenarioTable({ rows }: { rows: ScenarioRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="text-xs text-gray-500">
          <tr className="border-b border-gray-800">
            <th className="py-2 pr-3 font-medium">시나리오</th>
            <th className="py-2 pr-3 font-medium">종잣돈</th>
            <th className="py-2 pr-3 font-medium">지금 1인당 연액</th>
            <th className="py-2 pr-3 font-medium">목표 도달 연도</th>
            <th className="py-2 pr-3 font-medium">판정</th>
            <th className="py-2 pr-3 font-medium">국회 통제</th>
            <th className="py-2 font-medium">미래 세대 몫</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const extra = detail(r);
            return (
              <tr key={r.id} className="border-b border-gray-900 align-top">
                <td className="py-2 pr-3 text-gray-200">
                  <span className="font-medium">{r.id}</span> {r.label}
                  {extra && <span className="mt-1 block text-xs text-gray-500">{extra}</span>}
                </td>
                <td className="py-2 pr-3">{fmtJo(r.seed)}</td>
                <td className="py-2 pr-3">{fmtWon(r.nowAnnualWon)}</td>
                <td className="py-2 pr-3">{r.targetYear !== null ? `${r.targetYear}년` : '기간 안에 없음'}</td>
                <td className={`py-2 pr-3 ${r.sustainable ? 'text-emerald-300' : 'text-rose-300'}`}>{r.sustainable ? '✓' : '✗'}</td>
                <td className="py-2 pr-3 text-xs text-gray-400">{r.control}</td>
                <td className="py-2 text-xs text-gray-400">{r.futureGeneration}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-gray-500">
        판정과 연도는 위 설정(월 액수·세입·인출률)을 그대로 두고 종잣돈만 바꿔 같은 엔진으로 계산한다. 마지막 두 열은 칼럼 「AI 기본사회를 준비하자」의 논의를 옮긴 정성 문구다.
      </p>
    </div>
  );
}
