import { WATCH_CASES, getWatchCase, ELECTION_DAY, daysBetween } from '../cases';
import { isValidGovCode } from '@/lib/programs/gov';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

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

  it('verifiedAt은 YYYY-MM-DD다', () => {
    for (const c of WATCH_CASES) {
      expect(c.verifiedAt).toMatch(DATE);
      expect(c.verifiedAt).toBe('2026-09-23');
    }
  });

  it('타임라인은 날짜 형식이고 오름차순이다', () => {
    for (const c of WATCH_CASES) {
      const dates = c.timeline.map((e) => e.date);
      for (const d of dates) expect(d).toMatch(DATE);
      expect([...dates].sort()).toEqual(dates);
      for (const e of c.timeline) expect(e.label.length).toBeGreaterThan(0);
    }
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
});
