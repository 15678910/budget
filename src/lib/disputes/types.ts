/**
 * 예산분쟁 타입 정의 (설계문서 §4)
 *
 * 출처 태그(FigureKind)는 데이터센터 모듈 것을 그대로 쓴다.
 * 사이트 전체가 같은 표기 관습을 쓰게 하기 위해서다.
 */
import type { FigureKind } from '@/lib/datacenter/types';

/**
 * 계산기 키는 components가 아니라 lib에 둔다.
 * components는 lib을 import하지만 lib은 components를 import하지 않는다.
 */
export const CALCULATOR_KEYS = ['grant-formula', 'fund-scenario'] as const;
export type CalculatorKey = (typeof CALCULATOR_KEYS)[number];

export type DisputeStage =
  | 'proposed'
  | 'committee'
  | 'subcommittee'
  | 'plenary'
  | 'enacted'
  | 'ongoing';

export const STAGE_LABEL: Record<DisputeStage, string> = {
  proposed: '국회 제출',
  committee: '소관위 심사',
  subcommittee: '법안심사소위',
  plenary: '본회의',
  enacted: '공포',
  ongoing: '상시',
};

export interface DisputeFigure {
  label: string;
  value: string;
  note?: string;
  kind: FigureKind;
  /**
   * 이 수치 하나에 대한 출처. 분쟁 단위의 sources[]만으로는 어느 숫자가 어느 문서에서
   * 왔는지 독자가 되짚을 수 없어, 데이터센터 모듈의 Figure와 같이 필수로 둔다.
   * 발행 주체와 문서 이름 정도로 짧게 쓴다.
   */
  source: string;
}

export interface TimelineEvent {
  /** YYYY-MM-DD */
  date: string;
  label: string;
  detail?: string;
  status: 'done' | 'current' | 'upcoming';
  /** 의안번호 등 독자가 직접 확인할 수 있는 식별자 */
  source?: string;
}

export interface Position {
  side: 'for' | 'against' | 'neutral';
  actor: string;
  claim: string;
  evidence?: string;
  source: string;
}

export interface DisputeSource {
  title: string;
  publisher: string;
  date: string;
  url?: string;
}

export interface Dispute {
  slug: string;
  title: string;
  /** 한 문장으로 쓴 쟁점 */
  question: string;
  stage: DisputeStage;
  /** 목록 카드에 표시할 규모 */
  scale: string;
  nextMilestone?: { date: string; label: string };
  figures: DisputeFigure[];
  timeline: TimelineEvent[];
  positions: Position[];
  /** 없으면 ④ 절에 계산기를 렌더링하지 않는다 */
  calculator?: CalculatorKey;
  /** 계산기가 없는 분쟁의 ④ 대체 — 확인된 수치 대조표 */
  comparison?: { caption: string; rows: DisputeFigure[] };
  caveats: string[];
  sources: DisputeSource[];
  /** YYYY-MM-DD. 화면 상단에 표시해 독자가 신선도를 판단하게 한다 */
  updatedAt: string;
}
