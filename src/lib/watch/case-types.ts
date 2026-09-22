/**
 * 사례 아카이브 데이터 모델 (설계문서 §2.2).
 * 사이트는 "낭비"·"선거용"이라고 판정하지 않는다. 주장·판정·근거·출처만 싣는다.
 * 사례 데이터는 `docs/research/2026-09-23-waste-cases-verification.md` 밖의 사실을 넣지 않는다.
 */
import type { GovUnit } from '@/lib/programs/types';

export type Verdict = 'confirmed' | 'partial' | 'refuted' | 'unverified'; // 확인 / 부분확인 / 반박 / 미확인
export type StructuralTag = 'election-cycle' | 'no-check' | 'procedural-evasion' | 'evidence-integrity';
//  선거 주기 / 견제 부재 / 절차 편법 / 근거 훼손
export type ProcedureStatus = 'done' | 'not-done' | 'disputed' | 'unknown';

export interface CaseSource { title: string; publisher: string; date: string; url: string; quote?: string }
export interface CaseClaim {
  /** 보고서·언론이 제기한 주장, 원문 취지대로 */
  statement: string;
  verdict: Verdict;
  /** 판정 이유 — 확인된 사실 또는 어긋나는 사실 */
  finding: string;
  sources: CaseSource[];
}
export interface CaseEvent { date: string; label: string; source?: CaseSource } // 타임라인. 선거일은 자동 삽입
export interface CaseProcedure {
  key: 'investment-review' | 'feasibility-study' | 'council-approval' | 'disclosure';
  //  투자심사(지방재정법 제37조) / 타당성조사(500억 이상) / 의회 의결(공유재산·계약) / 정보공개
  status: ProcedureStatus; note: string; source?: CaseSource;
}
export interface WatchCase {
  slug: string; gov: GovUnit; title: string;
  amountEok: number | null; amountNote: string;
  summary: string;                 // 3문장 이내, 판정과 무관한 사실만
  timeline: CaseEvent[];
  claims: CaseClaim[];
  procedures: CaseProcedure[];
  tags: StructuralTag[];           // 근거가 되는 claim이 confirmed/partial일 때만 붙인다
  status: string;                  // '감사원 공익감사 청구(2026-04-06)' 등
  verifiedAt: string;              // YYYY-MM-DD
}
