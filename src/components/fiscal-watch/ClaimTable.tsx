import type { CaseClaim, CaseSource, Verdict } from '@/lib/watch/case-types';
import { VERDICT_CLASS, VERDICT_LABEL } from './labels';

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={`inline-block whitespace-nowrap border px-2 py-0.5 text-xs font-semibold ${VERDICT_CLASS[verdict]}`}
    >
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function SourceLink({ source }: { source: CaseSource }) {
  return (
    <>
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
      >
        {source.publisher} · {source.date}
      </a>
      <span className="text-gray-500"> {source.title}</span>
      {source.quote && (
        <span className="mt-0.5 block text-xs leading-snug text-gray-600">「{source.quote}」</span>
      )}
    </>
  );
}

/** 주장 / 판정 / 근거 / 출처 — 반박된 주장도 지우지 않고 그대로 싣는다 */
export function ClaimTable({ claims }: { claims: CaseClaim[] }) {
  return (
    <div className="overflow-x-auto border border-gray-800">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/60 text-left text-gray-500">
            <th className="px-3 py-2 font-semibold">주장</th>
            <th className="px-3 py-2 font-semibold">판정</th>
            <th className="px-3 py-2 font-semibold">근거</th>
            <th className="px-3 py-2 font-semibold">출처</th>
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => (
            <tr key={claim.statement} className="border-b border-gray-800/70 align-top last:border-b-0">
              <td className="w-[24%] px-3 py-3 leading-relaxed text-gray-300">{claim.statement}</td>
              <td className="px-3 py-3">
                <VerdictBadge verdict={claim.verdict} />
              </td>
              <td className="w-[38%] px-3 py-3 leading-relaxed text-gray-400">{claim.finding}</td>
              <td className="px-3 py-3">
                <ul className="space-y-1.5">
                  {claim.sources.map((source) => (
                    <li key={`${source.url}-${source.title}`} className="leading-snug">
                      <SourceLink source={source} />
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
