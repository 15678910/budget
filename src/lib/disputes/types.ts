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
  /** 주장을 확인할 수 있는 원문 링크. 확인된 것만 넣는다 — 없으면 링크 없이 출처만 표시된다 */
  url?: string;
}

export interface DisputeSource {
  title: string;
  publisher: string;
  date: string;
  url?: string;
}

/**
 * 법안 원문에서 조문 단위로 확인한 사실. 주장(Position)과 달리 편집자가 원문을 읽고 적는다.
 * 그래서 찬반 side가 없고, 대신 어느 조문인지(article)와 어느 문서인지(source)를 반드시 단다.
 */
export interface Finding {
  heading: string;
  /** 조문 표시. 예: "국가재정법 개정안 제70조 제3항 제7호" */
  article: string;
  body: string;
  /** 바뀌지 않고 남는 것. 개정안이 무엇을 건드리지 않았는지도 함께 적어야 공정하다 */
  remains?: string;
  source: string;
}

/** 외부 논평·연구가 제시한 대안. 편집부 의견이 아니므로 출처를 반드시 단다 */
export interface Proposals {
  intro: string;
  items: string[];
  note?: string;
  source: string;
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
  /** 있으면 ③ 쟁점 뒤에 「조문으로 확인한 것」 절을 렌더링한다 */
  findings?: Finding[];
  /** 있으면 ④ 숫자 뒤에 「대안」 절을 렌더링한다 */
  proposals?: Proposals;
  caveats: string[];
  sources: DisputeSource[];
  /** YYYY-MM-DD. 화면 상단에 표시해 독자가 신선도를 판단하게 한다 */
  updatedAt: string;
}
