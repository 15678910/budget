'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatCard({ label, value, sub, color }: StatCardProps) {
  return (
    <div className="border border-border bg-card rounded-lg p-4">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p
        className={`text-2xl font-mono font-bold tabular-nums ${color ?? 'text-foreground'}`}
      >
        {typeof value === 'number' ? value.toLocaleString('ko-KR') : value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
