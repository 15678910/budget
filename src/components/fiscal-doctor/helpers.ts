/** Safely format a number that might be absurdly large (Gemini sometimes returns won instead of 억원) */
export function formatDebtChange(val: number | string): string {
  const n = Number(val);
  if (isNaN(n)) return String(val);
  // If absolute value >= 100000, Gemini probably returned in 만원 or 원 units -> convert
  if (Math.abs(n) >= 1000000) {
    // Likely in 만원 or 원 -> convert to 억원
    const billions = n / 100000000; // 원 -> 억원
    if (Math.abs(billions) >= 1 && Math.abs(billions) < 100000) {
      return (billions > 0 ? '+' : '') + billions.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    const tenThousands = n / 10000; // 만원 -> 억원
    if (Math.abs(tenThousands) >= 1 && Math.abs(tenThousands) < 100000) {
      return (tenThousands > 0 ? '+' : '') + tenThousands.toLocaleString(undefined, { maximumFractionDigits: 0 });
    }
    // Still too big, just show in 조원
    const trillions = n / 10000;
    return (trillions > 0 ? '+' : '') + trillions.toLocaleString(undefined, { maximumFractionDigits: 0 });
  }
  return (n > 0 ? '+' : '') + n.toLocaleString();
}

export function formatIndependenceChange(val: number | string): string {
  const n = Number(val);
  if (isNaN(n)) return String(val);
  // Clamp to reasonable range -100 to +100
  const clamped = Math.max(-100, Math.min(100, n));
  return (clamped >= 0 ? '+' : '') + clamped.toFixed(1);
}

/** Safely convert any value to a renderable string (Gemini sometimes returns objects instead of strings) */
export function safeString(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return Object.values(item as Record<string, unknown>).join(' / ');
      }
      return String(item);
    }).join('\n');
  }
  if (typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(', ');
  }
  return String(val);
}
