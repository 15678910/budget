'use client';

// ─── Fiscal Radar Chart ───

export function FiscalRadarChart({
  breakdown,
}: {
  breakdown: { independence: number; autonomy: number; debtRatio: number; debtPerCapita: number };
}) {
  const axes = [
    { label: '자립도', value: breakdown.independence, max: 30 },
    { label: '자주도', value: breakdown.autonomy, max: 25 },
    { label: '채무비율', value: breakdown.debtRatio, max: 25 },
    { label: '1인당채무', value: breakdown.debtPerCapita, max: 20 },
  ];

  const size = 240;
  const center = size / 2;
  const maxR = size / 2 - 36;
  const n = axes.length;
  const angles = axes.map((_, i) => (Math.PI * 2 * i) / n - Math.PI / 2);

  const pt = (angle: number, fraction: number) => ({
    x: center + maxR * fraction * Math.cos(angle),
    y: center + maxR * fraction * Math.sin(angle),
  });

  const rings = [0.25, 0.5, 0.75, 1.0];
  const gridPaths = rings.map((r) => {
    const pts = angles.map((a) => pt(a, r));
    return `M${pts.map((p) => `${p.x},${p.y}`).join(' L')} Z`;
  });

  const dataPoints = axes.map((d, i) => pt(angles[i], d.value / d.max));
  const dataPath = `M${dataPoints.map((p) => `${p.x},${p.y}`).join(' L')} Z`;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[260px] mx-auto">
      {gridPaths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="#374151"
          strokeWidth="0.5"
          strokeDasharray={i < 3 ? '3,3' : undefined}
        />
      ))}
      {angles.map((a, i) => {
        const end = pt(a, 1);
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={end.x}
            y2={end.y}
            stroke="#374151"
            strokeWidth="0.5"
          />
        );
      })}
      <path d={dataPath} fill="rgba(59,130,246,0.18)" stroke="#3b82f6" strokeWidth="2" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" stroke="#030712" strokeWidth="1.5" />
      ))}
      {axes.map((d, i) => {
        const labelR = maxR + 24;
        const lx = center + labelR * Math.cos(angles[i]);
        const ly = center + labelR * Math.sin(angles[i]);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#9ca3af"
            fontSize="11"
            fontWeight="500"
          >
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Score Bar ───

export function ScoreBar({
  label,
  score,
  max,
  color,
}: {
  label: string;
  score: number;
  max: number;
  color: string;
}) {
  const pct = Math.round((score / max) * 100);
  const bgColor = color.replace('text-', 'bg-');
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={color}>
          {score}/{max}
        </span>
      </div>
      <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${bgColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Comparison Bar ───

export function ComparisonBar({
  label,
  value,
  nationalAvg,
  unit,
}: {
  label: string;
  value: number;
  nationalAvg: number;
  unit: string;
}) {
  const maxVal = Math.max(value, nationalAvg) * 1.2;
  const valuePct = Math.round((value / maxVal) * 100);
  const avgPct = Math.round((nationalAvg / maxVal) * 100);
  const isAbove = value >= nationalAvg;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className={isAbove ? 'text-emerald-400' : 'text-red-400'}>
          {value.toFixed(1)}
          {unit} {isAbove ? '(평균 이상)' : '(평균 이하)'}
        </span>
      </div>
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-700 ${isAbove ? 'bg-emerald-500/70' : 'bg-red-500/70'}`}
          style={{ width: `${valuePct}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-yellow-400"
          style={{ left: `${avgPct}%` }}
          title={`전국평균: ${nationalAvg.toFixed(1)}${unit}`}
        />
      </div>
      <div className="flex justify-end">
        <span className="text-xs text-yellow-400/70">
          전국평균 {nationalAvg.toFixed(1)}
          {unit}
        </span>
      </div>
    </div>
  );
}

// ─── Grade Badge ───

export function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const gradeStyles: Record<string, string> = {
    A: 'from-emerald-500 to-emerald-700 shadow-emerald-500/30',
    B: 'from-blue-500 to-blue-700 shadow-blue-500/30',
    C: 'from-amber-500 to-amber-700 shadow-amber-500/30',
    D: 'from-orange-500 to-orange-700 shadow-orange-500/30',
    F: 'from-red-500 to-red-700 shadow-red-500/30',
  };

  return (
    <div className="flex items-center gap-4">
      <div
        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradeStyles[grade] ?? gradeStyles.C} shadow-lg flex items-center justify-center`}
      >
        <span className="text-3xl font-black text-white">{grade}</span>
      </div>
      <div>
        <div className="text-3xl font-bold text-gray-100">
          {score}
          <span className="text-lg text-gray-500">/100</span>
        </div>
        <div className="text-sm text-gray-500">건전성 점수</div>
      </div>
    </div>
  );
}
