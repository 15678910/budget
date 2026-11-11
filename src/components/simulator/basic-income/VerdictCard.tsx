import type { SimInput, Verdict } from '@/lib/basic-income/types';
import { fmtPct, fmtWon } from './format';

interface VerdictCardProps {
  input: SimInput;
  verdict: Verdict;
  now: { monthlyWon: number; annualWon: number; impossible: boolean };
  passYear: number | null;
  progress: number;
}

const REASON: Record<NonNullable<Verdict['reason']>, string> = {
  shortfall: '그해 줄 돈이 모자람',
  principal: '기금이 원금 아래로 줄어듦',
};

function verdictSentence(input: SimInput, verdict: Verdict): string {
  const lastYear = input.payStartYear + input.horizonYears - 1;
  const head = `월 ${fmtWon(input.monthlyPerPerson)}을 ${input.payStartYear}~${lastYear}년 주는 설정은`;
  if (verdict.sustainable) return `${head} 기간 내내 원금을 지킨다.`;
  const why = verdict.reason ? REASON[verdict.reason] : '지속가능하지 않음';
  return verdict.firstFailYear !== null ? `${head} ${verdict.firstFailYear}년에 멈춘다: ${why}.` : `${head} ${why}.`;
}

/** 판정: 이 설정으로 기간 내내 줄 수 있는가, 지금 시작하면 얼마, 목표 액수는 언제부터 */
export function VerdictCard({ input, verdict, now, passYear, progress }: VerdictCardProps) {
  const ok = verdict.sustainable;
  return (
    <div className={`border p-4 md:p-5 ${ok ? 'border-emerald-700 bg-emerald-950/30' : 'border-rose-800 bg-rose-950/30'}`}>
      <p className={`text-2xl font-bold ${ok ? 'text-emerald-300' : 'text-rose-300'}`}>{ok ? '✓ 지속가능' : '✗ 지속 불가'}</p>
      <p className="mt-1 text-sm text-gray-300">{verdictSentence(input, verdict)}</p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs text-gray-500">지금 시작하면</dt>
          <dd className="text-lg font-semibold text-gray-100">
            {now.impossible ? '1원도 어려움' : `연 ${fmtWon(now.annualWon)}`}
          </dd>
          {!now.impossible && <dd className="text-xs text-gray-500">월 {fmtWon(now.monthlyWon)}</dd>}
        </div>
        <div>
          <dt className="text-xs text-gray-500">월 {fmtWon(input.monthlyPerPerson)} 목표는</dt>
          <dd className="text-lg font-semibold text-gray-100">{passYear !== null ? `${passYear}년부터` : '기간 안에 없음'}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">영구 지급 목표 달성률</dt>
          <dd className="text-lg font-semibold text-gray-100">{fmtPct(progress)}</dd>
        </div>
      </dl>
    </div>
  );
}
