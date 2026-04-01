'use client';

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatKoreanWon } from '@/lib/utils/format';

interface YearTrendChartProps {
  data: { year: number; amount: number }[];
}

export function YearTrendChart({ data }: YearTrendChartProps) {
  const chartData = data.map((d) => ({
    year: String(d.year),
    amount: d.amount,
  }));

  return (
    <div className="w-full" style={{ height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 5, left: 10 }}>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.[0]) return null;
              return (
                <div
                  style={{
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 4,
                    padding: '6px 10px',
                    fontSize: 12,
                  }}
                >
                  <strong>{label}년</strong>
                  <br />
                  {formatKoreanWon(payload[0].value as number)}
                </div>
              );
            }}
          />
          <Bar dataKey="amount" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {chartData.map((_, i) => (
              <Cell key={i} fill="#4C72B0" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
