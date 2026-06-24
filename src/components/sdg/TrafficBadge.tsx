import { trafficColor, type TrafficLight } from '@/lib/sdg/scoring';

const LABEL: Record<TrafficLight, string> = {
  green: '양호',
  yellow: '보통',
  orange: '주의',
  red: '취약',
};

/**
 * 달성도 신호등 배지(점수 + 색). 목표값 기준 0~100 달성도.
 * 상대 점수와 구분되는 별개 지표임을 색/라벨로 표시.
 */
export function TrafficBadge({
  score,
  light,
  size = 'md',
}: {
  score: number;
  light: TrafficLight;
  size?: 'sm' | 'md';
}) {
  const color = trafficColor(light);
  const sm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-mono font-semibold text-gray-950 ${
        sm ? 'px-1.5 py-0 text-[10px]' : 'px-2 py-0.5 text-[11px]'
      }`}
      style={{ background: color }}
      title={`달성도 ${score}점 · ${LABEL[light]} (목표값 기준)`}
    >
      <span aria-hidden>●</span>
      {score}
    </span>
  );
}
