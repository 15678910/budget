'use client';

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { YearRow } from '@/lib/basic-income/types';
import { fmtJo } from './format';

const TOOLTIP_STYLE = { backgroundColor: '#111827', border: '1px solid #374151', fontSize: 12 };

/** 해마다 기금(F)·원금(P)은 선, 인출·부족은 막대 */
export function YearChart({ rows }: { rows: YearRow[] }) {
  const data = rows.map((r) => ({
    year: r.year,
    fund: r.fundEnd,
    principal: r.principal,
    withdrawal: r.withdrawal,
    shortfall: r.shortfall,
  }));
  return (
    <div className="h-72 w-full md:h-80" role="img" aria-label="연도별 기금·원금·인출·부족 그래프">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#1f2937" vertical={false} />
          <XAxis dataKey="year" tick={{ fill: '#9ca3af', fontSize: 11 }} />
          <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} width={48} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: '#e5e7eb' }}
            formatter={(v) => fmtJo(Number(v), 2)}
            labelFormatter={(y) => `${y}년`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="withdrawal" name="인출" fill="#3b82f6" />
          <Bar dataKey="shortfall" name="부족" fill="#f43f5e" />
          <Line type="monotone" dataKey="fund" name="기금(F)" stroke="#34d399" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="principal" name="원금(P)" stroke="#fbbf24" dot={false} strokeDasharray="4 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
