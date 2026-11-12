'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BUDGET_2027, BUDGET_2027_URL, DEFAULT_SOURCES, compareToBudget } from '@/lib/basic-income';
import { fmtJo, fmtPct } from './format';

const TOOLTIP_STYLE = { backgroundColor: '#111827', border: '1px solid #374151', fontSize: 12 };
const NEED_ID = 'need';

/** 연 지급 필요액을 2027년 예산안 분야별 총지출과 나란히 놓는다 */
export function BudgetCompare({ need, year }: { need: number; year: number }) {
  const rows = compareToBudget(need, BUDGET_2027);
  const total = DEFAULT_SOURCES.budgetTotal2027.value;
  const data = [{ id: NEED_ID, label: `기본소득(${year})`, amount: need }, ...rows];
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-300">
        {year}년 필요액 {fmtJo(need)}은 2027년 예산안 총지출 {fmtJo(total)}의 {fmtPct(need / total)}다.
      </p>
      <div className="h-96 w-full" role="img" aria-label="기본소득 필요액과 예산 분야별 총지출 비교">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis type="category" dataKey="label" width={120} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#e5e7eb' }} formatter={(v) => fmtJo(Number(v))} />
            <Bar dataKey="amount" name="금액">
              {data.map((d) => (
                <Cell key={d.id} fill={d.id === NEED_ID ? '#f59e0b' : '#3b82f6'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400 sm:grid-cols-3">
        {rows.map((r) => (
          <li key={r.id}>
            {r.label}의 {fmtPct(r.ratio, 0)}
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500">
        분야별 금액: 기획예산처 2027년 예산안 첨부 홍보자료 4쪽 표(원문 대조).{' '}
        <a href={BUDGET_2027_URL} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          정책브리핑 원문
        </a>
      </p>
    </div>
  );
}
