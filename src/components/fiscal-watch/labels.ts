/**
 * 사례 아카이브 화면의 한국어 라벨·색상 맵.
 * 판정 문구는 설계문서 §2.2의 타입 주석(확인 / 부분확인 / 반박 / 미확인)을 그대로 쓴다.
 */
import type {
  CaseProcedure,
  ProcedureStatus,
  StructuralTag,
  Verdict,
} from '@/lib/watch/case-types';

export const VERDICT_ORDER: readonly Verdict[] = ['confirmed', 'partial', 'refuted', 'unverified'];

export const VERDICT_LABEL: Record<Verdict, string> = {
  confirmed: '확인',
  partial: '부분확인',
  refuted: '반박',
  unverified: '미확인',
};

export const VERDICT_CLASS: Record<Verdict, string> = {
  confirmed: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  partial: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  refuted: 'border-red-500/50 bg-red-500/10 text-red-300',
  unverified: 'border-gray-600 bg-gray-800/60 text-gray-400',
};

export const TAG_LABEL: Record<StructuralTag, string> = {
  'election-cycle': '선거 주기',
  'no-check': '견제 부재',
  'procedural-evasion': '절차 편법',
  'evidence-integrity': '근거 훼손',
};

export const TAG_ORDER: readonly StructuralTag[] = [
  'election-cycle',
  'no-check',
  'procedural-evasion',
  'evidence-integrity',
];

/** 태그 표시 옆에 한 줄로 붙인다 — 태그는 판정된 주장에만 근거한다는 사실 문구 */
export const TAG_NOTE = '구조 태그는 「확인」·「부분확인」 판정을 받은 주장에만 근거한다. 사이트가 의도를 판정하지는 않는다.';

export type ProcedureKey = CaseProcedure['key'];

export const PROCEDURE_KEYS: readonly ProcedureKey[] = [
  'investment-review',
  'feasibility-study',
  'council-approval',
  'disclosure',
];

export const PROCEDURE_LABEL: Record<ProcedureKey, string> = {
  'investment-review': '투자심사',
  'feasibility-study': '타당성조사',
  'council-approval': '의회 의결',
  disclosure: '정보공개',
};

/** 각 절차의 근거 조문·기준 */
export const PROCEDURE_BASIS: Record<ProcedureKey, string> = {
  'investment-review': '지방재정법 제37조',
  'feasibility-study': '총사업비 500억원 이상',
  'council-approval': '공유재산·계약 관련 의결',
  disclosure: '정보공개 여부',
};

export const PROCEDURE_STATUS_LABEL: Record<ProcedureStatus, string> = {
  done: '이행',
  'not-done': '미이행',
  disputed: '다툼 있음',
  unknown: '확인 자료 없음',
};

export const PROCEDURE_STATUS_CLASS: Record<ProcedureStatus, string> = {
  done: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
  'not-done': 'border-red-500/50 bg-red-500/10 text-red-300',
  disputed: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
  unknown: 'border-dashed border-gray-600 bg-gray-900 text-gray-500',
};

/** 아카이브 상단 고정 문구 (설계문서 §4.2) */
export const ARCHIVE_NOTICE =
  '이 아카이브는 제기된 주장을 1차 자료로 대조한 결과입니다. 반박된 주장도 남겨 둡니다. 판단은 독자가 합니다.';

export function formatEok(amountEok: number | null): string {
  if (amountEok === null) return '금액 미상';
  return `${amountEok.toLocaleString('ko-KR', { maximumFractionDigits: 1 })}억원`;
}
