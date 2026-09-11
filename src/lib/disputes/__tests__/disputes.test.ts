import { ALL_DISPUTES, getDispute } from '../index';
import { CALCULATOR_KEYS } from '../types';
import { staticAdapter } from '../tracking';

describe('분쟁 데이터 무결성', () => {
  it('slug가 중복되지 않는다', () => {
    const slugs = ALL_DISPUTES.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('모든 수치에 개별 출처가 달려 있다', () => {
    for (const d of ALL_DISPUTES) {
      for (const f of [...d.figures, ...(d.comparison?.rows ?? [])]) {
        expect(f.source.trim()).not.toBe('');
      }
    }
  });

  it('calculator 키가 레지스트리 목록에 존재한다', () => {
    for (const d of ALL_DISPUTES) {
      if (d.calculator) expect(CALCULATOR_KEYS).toContain(d.calculator);
    }
  });

  it('updatedAt이 YYYY-MM-DD 형식이다', () => {
    for (const d of ALL_DISPUTES) {
      expect(d.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('출처가 비어 있지 않다', () => {
    for (const d of ALL_DISPUTES) {
      expect(d.sources.length).toBeGreaterThan(0);
    }
  });

  it('타임라인이 날짜순으로 정렬돼 있다', () => {
    for (const d of ALL_DISPUTES) {
      const dates = d.timeline.map((e) => e.date);
      expect([...dates].sort()).toEqual(dates);
    }
  });

  it('입장에 찬반이 모두 담겨 있다', () => {
    for (const d of ALL_DISPUTES) {
      const hasFavorable = d.positions.some((p) => p.side === 'for');
      const hasOpposed = d.positions.some((p) => p.side === 'against');
      expect(hasFavorable).toBe(true);
      expect(hasOpposed).toBe(true);
    }
  });

  it('조문 확인 항목마다 조문과 출처가 있다', () => {
    for (const d of ALL_DISPUTES) {
      for (const f of d.findings ?? []) {
        expect(f.article.trim()).not.toBe('');
        expect(f.source.trim()).not.toBe('');
        expect(f.body.length).toBeGreaterThan(20);
      }
    }
  });

  it('대안이 있으면 항목과 출처가 비어 있지 않다', () => {
    for (const d of ALL_DISPUTES) {
      if (!d.proposals) continue;
      expect(d.proposals.items.length).toBeGreaterThan(0);
      expect(d.proposals.source.trim()).not.toBe('');
    }
  });

  it('미래대응기금·교부금 분쟁에 조문 확인과 대안이 있다', () => {
    for (const slug of ['future-fund', 'education-grant']) {
      const d = getDispute(slug);
      expect(d?.findings?.length ?? 0).toBeGreaterThan(0);
      expect(d?.proposals).toBeDefined();
    }
  });

  it('getDispute가 없는 slug에 undefined를 낸다', () => {
    expect(getDispute('does-not-exist')).toBeUndefined();
  });

  it('교부금 분쟁을 slug로 찾는다', () => {
    expect(getDispute('education-grant')?.title).toBe('지방교육재정교부금 개편');
  });
});

describe('추적 어댑터', () => {
  it('StaticAdapter가 데이터 파일의 타임라인을 그대로 낸다', async () => {
    const events = await staticAdapter.fetchTimeline('education-grant');
    expect(events).toEqual(getDispute('education-grant')?.timeline);
  });

  it('없는 slug에는 빈 배열을 낸다', async () => {
    expect(await staticAdapter.fetchTimeline('does-not-exist')).toEqual([]);
  });
});
