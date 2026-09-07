import { regionalImpact, TOTAL_TRANSFER_EOK } from '../regional-impact';
import { REGIONS } from '../regional-data';

describe('시도별 영향', () => {
  it('17개 지역이 모두 반환된다', () => {
    const result = regionalImpact(10000);
    expect(result).toHaveLength(17);
  });

  it('share의 합이 1이다', () => {
    const result = regionalImpact(10000);
    const total = result.reduce((sum, r) => sum + r.share, 0);
    expect(total).toBeCloseTo(1, 9);
  });

  it('TOTAL_TRANSFER_EOK가 850,667이다', () => {
    const direct = REGIONS.reduce((sum, r) => sum + r.transferEok, 0);
    expect(direct).toBe(850667);
    expect(TOTAL_TRANSFER_EOK).toBe(850667);
  });

  it('21조원 감소 시 경기의 cutEok가 전국 감소액 × 경기 share와 같다', () => {
    const cutEok = 210000;
    const result = regionalImpact(cutEok);
    const gyeonggi = result.find((r) => r.name === '경기');
    expect(gyeonggi).toBeDefined();
    expect(gyeonggi!.cutEok).toBeCloseTo(cutEok * gyeonggi!.share, 6);
  });

  it('cutEok가 0이면 모든 pressure가 0이다', () => {
    const result = regionalImpact(0);
    for (const r of result) {
      expect(r.cutEok).toBe(0);
      expect(r.pressure).toBe(0);
    }
  });

  it('음수 입력도 0처럼 동작한다', () => {
    const result = regionalImpact(-500);
    for (const r of result) {
      expect(r.cutEok).toBe(0);
      expect(r.pressure).toBe(0);
    }
  });

  it('결과가 pressure 내림차순으로 정렬돼 있다', () => {
    const result = regionalImpact(210000);
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].pressure).toBeGreaterThanOrEqual(result[i].pressure);
    }
  });

  it('서울의 payrollRatio가 72391/119935과 같다', () => {
    const result = regionalImpact(10000);
    const seoul = result.find((r) => r.name === '서울');
    expect(seoul).toBeDefined();
    expect(seoul!.payrollRatio).toBeCloseTo(72391 / 119935, 9);
  });

  it('학생 수 합계가 5,015,310이다 (2025 초·중·고)', () => {
    const result = regionalImpact(10000);
    const total = result.reduce((sum, r) => sum + r.students, 0);
    expect(total).toBe(5015310);
  });

  it('세종의 studentChange가 양수인 유일한 지역이다', () => {
    const result = regionalImpact(10000);
    const positive = result.filter((r) => r.studentChange > 0);
    expect(positive).toHaveLength(1);
    expect(positive[0].name).toBe('세종');
  });

  it('cutEok가 0이면 모든 perStudentWon이 0이다', () => {
    const result = regionalImpact(0);
    for (const r of result) {
      expect(r.perStudentWon).toBe(0);
    }
  });

  it('21조원 감소 시 전남의 perStudentWon이 서울보다 크다 (1인당으로는 농산어촌이 더 크게 맞는다)', () => {
    const cutEok = 210000;
    const result = regionalImpact(cutEok);
    const jeonnam = result.find((r) => r.name === '전남');
    const seoul = result.find((r) => r.name === '서울');
    expect(jeonnam).toBeDefined();
    expect(seoul).toBeDefined();
    expect(jeonnam!.perStudentWon).toBeGreaterThan(seoul!.perStudentWon);
  });
});
