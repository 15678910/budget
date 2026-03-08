'use client';

import { ResponsiveBar } from '@nivo/bar';
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
      <ResponsiveBar
        data={chartData}
        keys={['amount']}
        indexBy="year"
        margin={{ top: 10, right: 10, bottom: 30, left: 10 }}
        padding={0.3}
        colors={['#4C72B0']}
        axisBottom={{
          tickSize: 0,
          tickPadding: 5,
          tickRotation: 0,
          renderTick: ({ x, y, value }) => (
            <g transform={`translate(${x},${y})`}>
              <text
                textAnchor="middle"
                dominantBaseline="hanging"
                style={{
                  fontSize: 11,
                  fill: 'hsl(var(--foreground))',
                }}
                y={6}
              >
                {value}
              </text>
            </g>
          ),
        }}
        axisLeft={null}
        enableGridY={false}
        gridYValues={[]}
        enableLabel={false}
        animate={false}
        theme={{
          grid: {
            line: {
              stroke: 'hsl(var(--border))',
            },
          },
          axis: {
            ticks: {
              text: {
                fill: 'hsl(var(--foreground))',
                fontSize: 11,
              },
            },
          },
        }}
        tooltip={({ indexValue, value }) => (
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
            <strong>{indexValue}년</strong>
            <br />
            {formatKoreanWon(value as number)}
          </div>
        )}
      />
    </div>
  );
}
