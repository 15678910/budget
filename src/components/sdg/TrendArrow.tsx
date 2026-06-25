import { TRAFFIC_COLORS } from '@/lib/sdg/scoring';
import type { TrendArrow as TrendArrowKind } from '@/lib/sdg/trend';

// 화살표별 글리프·색(신호등 매핑)·라벨. 색은 달성도 신호등과 동일 팔레트를 재사용해
// "추세=속도" 신호를 시각적으로 일관되게 표현(의미는 달성도와 구분, 고지문에 명시).
const ARROW_META: Record<
  TrendArrowKind,
  { glyph: string; color: string; label: string }
> = {
  on_track: { glyph: '↗', color: TRAFFIC_COLORS.green, label: '궤도내(개선중·목표 도달 추세)' },
  improving: { glyph: '→', color: TRAFFIC_COLORS.yellow, label: '개선중(목표엔 다소 못 미침)' },
  stagnating: { glyph: '↘', color: TRAFFIC_COLORS.orange, label: '정체(개선 미흡)' },
  decreasing: { glyph: '↓', color: TRAFFIC_COLORS.red, label: '악화(목표서 멀어짐)' },
};

/**
 * 추세 화살표 아이콘. arrow → 글리프 + 신호등 색 + 한국어 title.
 * 데이터(arrow) 없으면 미표시(null). 옵션으로 목표갭(gap)을 작게 병기.
 *
 * ⚠️ 추세는 2점(2018→최신) 개략(중간연도 미반영, SDSN CR). 인과 주장 아님.
 */
export function TrendArrow({
  arrow,
  gap,
  size = 'md',
}: {
  arrow: TrendArrowKind | null | undefined;
  /** 목표갭(0~100). 제공 시 화살표 옆에 "갭 N" 작게 표기. */
  gap?: number | null;
  size?: 'sm' | 'md';
}) {
  if (!arrow) return null;
  const meta = ARROW_META[arrow];
  const sm = size === 'sm';
  const title = `추세 ${meta.label} · 2점(2018→최신) 개략 · SDSN CR${
    gap != null ? ` · 목표갭 ${gap}` : ''
  }`;
  return (
    <span
      className={`inline-flex items-center gap-0.5 font-mono font-bold ${
        sm ? 'text-[11px]' : 'text-xs'
      }`}
      style={{ color: meta.color }}
      title={title}
    >
      <span aria-hidden>{meta.glyph}</span>
      {gap != null && (
        <span className={`font-normal text-gray-500 ${sm ? 'text-[9px]' : 'text-[10px]'}`}>
          갭{gap}
        </span>
      )}
    </span>
  );
}
