import { WATCH_CASES, getWatchCase, ELECTION_DAY, daysBetween, sortKeyOf } from '../cases';
import type { StructuralTag } from '../case-types';
import { isValidGovCode } from '@/lib/programs/gov';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
/** 타임라인 날짜는 'YYYY-MM-DD' 또는 월 단위 'YYYY-MM' */
const EVENT_DATE = /^\d{4}-\d{2}(-\d{2})?$/;

/**
 * 태그마다, 그 태그를 정당화하는 낱말이 확인·부분확인 주장에 실제로 적혀 있어야 한다.
 * 태그는 판정된 주장에만 근거한다는 규칙(TAG_NOTE)을 데이터 차원에서 강제한다.
 */
const TAG_KEYWORDS: Record<StructuralTag, RegExp> = {
  'election-cycle': /선거|착공/,
  'no-check': /견제|감사|심의/,
  'procedural-evasion': /의결|의회/,
  'evidence-integrity': /논문|환경영향평가/,
};

describe('사례 아카이브 데이터 무결성', () => {
  it('7건이다', () => {
    expect(WATCH_CASES).toHaveLength(7);
  });

  it('slug는 유일하고 kebab-case다', () => {
    const slugs = WATCH_CASES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('getWatchCase는 slug로 찾고 없으면 undefined다', () => {
    expect(getWatchCase('daejeon-articulated-bus')?.gov.code).toBe('30');
    expect(getWatchCase('없는-슬러그')).toBeUndefined();
  });

  it('gov 코드가 유효하다', () => {
    for (const c of WATCH_CASES) {
      expect(isValidGovCode(c.gov)).toBe(true);
    }
  });

  it('모든 claim에 출처가 1건 이상 있고 URL은 https다', () => {
    for (const c of WATCH_CASES) {
      expect(c.claims.length).toBeGreaterThan(0);
      for (const claim of c.claims) {
        expect(claim.sources.length).toBeGreaterThanOrEqual(1);
        for (const s of claim.sources) {
          expect(s.url.startsWith('https://')).toBe(true);
          expect(s.publisher.length).toBeGreaterThan(0);
          expect(s.title.length).toBeGreaterThan(0);
          expect(s.date).toMatch(DATE);
        }
      }
    }
  });

  it('반박된 주장에는 어긋나는 사실이 적혀 있다', () => {
    const refuted = WATCH_CASES.flatMap((c) => c.claims).filter((cl) => cl.verdict === 'refuted');
    expect(refuted.length).toBeGreaterThan(0);
    for (const claim of refuted) expect(claim.finding.length).toBeGreaterThan(20);
  });

  it('모든 claim의 finding이 비어 있지 않다', () => {
    for (const c of WATCH_CASES) {
      for (const claim of c.claims) {
        expect(claim.statement.length).toBeGreaterThan(0);
        expect(claim.finding.length).toBeGreaterThan(0);
      }
    }
  });

  it('태그는 confirmed 또는 partial claim이 하나 이상일 때만 붙는다', () => {
    for (const c of WATCH_CASES) {
      if (c.tags.length === 0) continue;
      const backed = c.claims.filter((cl) => cl.verdict === 'confirmed' || cl.verdict === 'partial');
      expect(backed.length).toBeGreaterThanOrEqual(1);
      expect(new Set(c.tags).size).toBe(c.tags.length);
    }
  });

  it('태그마다 그 태그의 낱말이 든 confirmed/partial 주장이 있다', () => {
    const tagged = WATCH_CASES.filter((c) => c.tags.length > 0);
    expect(tagged.length).toBeGreaterThan(0);

    for (const c of tagged) {
      const backed = c.claims.filter((cl) => cl.verdict === 'confirmed' || cl.verdict === 'partial');
      for (const tag of c.tags) {
        const keyword = TAG_KEYWORDS[tag];
        const matched = backed.filter(
          (cl) => keyword.test(cl.statement) || keyword.test(cl.finding),
        );
        // 실패하면 어느 사례의 어느 태그인지 바로 보이도록 슬러그를 값에 담는다
        expect({ slug: c.slug, tag, matched: matched.length > 0 }).toEqual({
          slug: c.slug,
          tag,
          matched: true,
        });
      }
    }
  });

  it('verifiedAt은 YYYY-MM-DD다', () => {
    for (const c of WATCH_CASES) {
      expect(c.verifiedAt).toMatch(DATE);
      expect(c.verifiedAt).toBe('2026-09-23');
    }
  });

  it('타임라인은 YYYY-MM-DD 또는 YYYY-MM이고 오름차순이다', () => {
    for (const c of WATCH_CASES) {
      const dates = c.timeline.map((e) => e.date);
      for (const d of dates) expect(d).toMatch(EVENT_DATE);
      // 'YYYY-MM'은 그 달의 1일로 보고 순서를 매긴다
      const keys = dates.map(sortKeyOf);
      expect([...keys].sort()).toEqual(keys);
      for (const e of c.timeline) expect(e.label.length).toBeGreaterThan(0);
    }
  });

  it('월 단위 사건이 실제로 쓰이고 있다', () => {
    const monthOnly = WATCH_CASES.flatMap((c) => c.timeline).filter((e) => !DATE.test(e.date));
    expect(monthOnly.length).toBeGreaterThan(0);
    for (const e of monthOnly) expect(e.date).toMatch(/^\d{4}-\d{2}$/);
  });

  it('절차 점검은 4항목이고 unknown에도 note가 있다', () => {
    for (const c of WATCH_CASES) {
      const keys = c.procedures.map((p) => p.key);
      expect([...keys].sort()).toEqual(['council-approval', 'disclosure', 'feasibility-study', 'investment-review']);
      for (const p of c.procedures) expect(p.note.length).toBeGreaterThan(0);
    }
  });

  it('요약은 3문장 이내이고 금액 주석이 있다', () => {
    for (const c of WATCH_CASES) {
      const sentences = c.summary.split(/[.!?](?:\s|$)/).filter((s) => s.trim().length > 0);
      expect(sentences.length).toBeLessThanOrEqual(3);
      expect(c.amountNote.length).toBeGreaterThan(0);
      expect(c.status.length).toBeGreaterThan(0);
      expect(c.title.length).toBeGreaterThan(0);
    }
  });
});

describe('선거일과 간격', () => {
  it('ELECTION_DAY는 2026-06-03이다', () => {
    expect(ELECTION_DAY).toBe('2026-06-03');
  });

  it('동인천역 착공식은 선거 177일 전이다', () => {
    expect(daysBetween('2025-12-08', ELECTION_DAY)).toBe(177);
  });

  it('daysBetween은 b − a 달력 일수다', () => {
    expect(daysBetween('2026-06-03', '2026-06-03')).toBe(0);
    expect(daysBetween('2026-06-03', '2026-06-01')).toBe(-2);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });

  it('월 단위 날짜는 일수를 지어내지 않고 null이다', () => {
    expect(daysBetween('2025-12', ELECTION_DAY)).toBeNull();
    expect(daysBetween(ELECTION_DAY, '2024-07')).toBeNull();
    expect(daysBetween('2025-12', '2024-07')).toBeNull();
  });

  it('sortKeyOf는 월 단위 날짜를 그 달의 1일로 본다', () => {
    expect(sortKeyOf('2025-12')).toBe('2025-12-01');
    expect(sortKeyOf('2025-12-08')).toBe('2025-12-08');
  });
});
