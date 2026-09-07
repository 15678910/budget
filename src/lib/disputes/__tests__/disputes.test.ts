import { ALL_DISPUTES, getDispute } from '../index';
import { CALCULATOR_KEYS } from '../types';
import { staticAdapter } from '../tracking';

describe('분쟁 데이터 무결성', () => {
  it('slug가 중복되지 않는다', () => {
    const slugs = ALL_DISPUTES.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('모든 수치가 출처 태그를 갖는다', () => {
    for (const d of ALL_DISPUTES) {
      for (const f of d.figures) {
        expect(['measured', 'announced', 'derived', 'estimated']).toContain(f.kind);
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
      expect(d.positions.length).toBeGreaterThanOrEqual(2);
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
