import { trafficColor, type TrafficLight } from '@/lib/sdg/scoring';

/** 신호등 → 한국어 단어(배지·범례·목록에서 공유). */
export const TRAFFIC_LABEL: Record<TrafficLight, string> = {
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
  showLabel = false,
}: {
  score: number;
  light: TrafficLight;
  size?: 'sm' | 'md';
  /** true면 배지 안에 "· 보통"처럼 신호등 단어를 함께 표기(목록형 UI용). */
  showLabel?: boolean;
}) {
  const color = trafficColor(light);
  const sm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-mono font-semibold text-gray-950 ${
        sm ? 'px-1.5 py-0 text-[12px]' : 'px-2 py-0.5 text-[12px]'
      }`}
      style={{ background: color }}
      title={`달성도 ${score}점 · ${TRAFFIC_LABEL[light]} (목표값 기준)`}
    >
      <span aria-hidden>●</span>
      {score}
      {showLabel && <span className="font-normal">· {TRAFFIC_LABEL[light]}</span>}
    </span>
  );
}
