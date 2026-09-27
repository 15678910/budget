// SDG 공식 17색 + 신호등 4색 → Tailwind 배경색 클래스 매핑.
//
// CLAUDE.md는 인라인 스타일(style={{}})을 금지한다. 하지만 SDG 공식 17색·신호등 4색은
// 값이 고정(상수)이고 동적으로 생성되지 않으므로, 여기 한 곳에 "완전한 클래스 문자열"을
// 리터럴로 나열해두면 Tailwind JIT 스캐너가 정적 분석으로 인식할 수 있다(런타임 조합 금지).
// 색상 값은 반드시 SDG_GOALS(goals.ts)·TRAFFIC_COLORS(scoring.ts)의 공식 값과 일치시킬 것 —
// 이 파일 단독으로 색을 바꾸지 말고, 값을 바꿀 땐 두 파일을 함께 갱신한다(회귀 테스트 참고).

import type { TrafficLight } from './scoring';

/** SDG 목표 번호(1~17) → 배경색 Tailwind 클래스(공식 색상). */
export const GOAL_BG_CLASS: Record<number, string> = {
  1: 'bg-[#E5243B]',
  2: 'bg-[#DDA63A]',
  3: 'bg-[#4C9F38]',
  4: 'bg-[#C5192D]',
  5: 'bg-[#FF3A21]',
  6: 'bg-[#26BDE2]',
  7: 'bg-[#FCC30B]',
  8: 'bg-[#A21942]',
  9: 'bg-[#FD6925]',
  10: 'bg-[#DD1367]',
  11: 'bg-[#FD9D24]',
  12: 'bg-[#BF8B2E]',
  13: 'bg-[#3F7E44]',
  14: 'bg-[#0A97D9]',
  15: 'bg-[#56C02B]',
  16: 'bg-[#00689D]',
  17: 'bg-[#19486A]',
};

/** 달성도 신호등(TRAFFIC_COLORS와 동일 팔레트) → 배경색 Tailwind 클래스. */
export const TRAFFIC_BG_CLASS: Record<TrafficLight, string> = {
  green: 'bg-[#16a34a]',
  yellow: 'bg-[#eab308]',
  orange: 'bg-[#f97316]',
  red: 'bg-[#dc2626]',
};
