/**
 * 국가 단위 집계 테스트 (설계문서 §5.2)
 *
 * 핵심 검증: 8.4GW 집계가 1GW 결과의 8.4배인지 — 선형성을 명시적으로 고정한다.
 */

import {
  ALL_MEGA_FIGURES,
  announcedCapacityGw,
  bySite,
  CAPACITY_2035,
  megaprojectSummary,
  SITES,
} from '../megaproject';
import { powerImpact } from '../regional';

describe('선형 스케일업', () => {
  it('8.4GW 전력은 1GW의 8.4배다', () => {
    const one = powerImpact(1).annualTwh;
    const summary = megaprojectSummary(2029);
    expect(summary.annualTwh).toBeCloseTo(one * 8.4, 6);
  });

  it('18.4GW 전력은 1GW의 18.4배다', () => {
    const one = powerImpact(1).annualTwh;
    expect(megaprojectSummary(2035).annualTwh).toBeCloseTo(one * 18.4, 6);
  });

  it('2029년은 8.4GW, 2035년은 18.4GW다', () => {
    expect(megaprojectSummary(2029).capacityGw).toBe(8.4);
    expect(megaprojectSummary(2035).capacityGw).toBe(18.4);
  });
});

describe('규모 감각', () => {
  it('18.4GW는 현재 국내 전체(2.0GW)의 9.2배다', () => {
    expect(megaprojectSummary(2035).multipleOfCurrent).toBeCloseTo(9.2, 1);
  });

  it('18.4GW는 국내 최대 시설(100MW) 184개분이다', () => {
    expect(megaprojectSummary(2035).equivalentLargestSites).toBeCloseTo(184, 0);
  });

  it('18.4GW는 원전 10기 상당이다', () => {
    expect(megaprojectSummary(2035).nuclearUnits).toBeCloseTo(10, 1);
  });
});

describe('투자 대비 일자리 (§1.1의 핵심 질문)', () => {
  it('2035년 투자액은 데이터센터 부문 550조 원 전액이다', () => {
    expect(megaprojectSummary(2035).investmentKrw).toBeCloseTo(550e12, -9);
  });

  it('2029년 투자액은 용량 비례로 배분된다', () => {
    const s = megaprojectSummary(2029);
    expect(s.investmentKrw).toBeCloseTo(550e12 * (8.4 / 18.4), -9);
  });

  it('상시 일자리 1개당 투자액이 수백억 원 단위로 나온다', () => {
    const s = megaprojectSummary(2035);
    expect(s.investmentPerJobKrw).toBeGreaterThan(1e10);
    expect(s.investmentPerJobKrw).toBeLessThan(1e12);
  });

  it('상시 일자리는 범위로 낸다', () => {
    const s = megaprojectSummary(2035);
    expect(s.permanentJobs.low).toBeLessThan(s.permanentJobs.mid);
    expect(s.permanentJobs.mid).toBeLessThan(s.permanentJobs.high);
  });
});

describe('지방세', () => {
  it('연간 세수는 투자액의 1% 미만이다', () => {
    const s = megaprojectSummary(2035);
    expect(s.annualTaxPerInvestment).toBeLessThan(0.01);
    expect(s.annualTaxPerInvestment).toBeGreaterThan(0);
  });

  it('일회성 취득세도 함께 낸다', () => {
    expect(megaprojectSummary(2035).oneTimeTaxKrw).toBeGreaterThan(0);
  });
});

describe('입지별 배분', () => {
  it('발표된 입지는 4곳이다', () => {
    expect(bySite()).toHaveLength(4);
    expect(SITES.map((s) => s.id)).toContain('ulsan');
  });

  it('발표 합계는 7.4GW로 계획 총량 18.4GW에 못 미친다', () => {
    expect(announcedCapacityGw()).toBeCloseTo(7.4, 6);
    expect(announcedCapacityGw()).toBeLessThan(CAPACITY_2035.value);
  });

  it('울산은 공랭식이므로 용수가 0이다', () => {
    const ulsan = bySite().find((s) => s.id === 'ulsan')!;
    expect(ulsan.dailyWaterTons).toBe(0);
  });

  it('수랭식 입지는 용수를 소비한다', () => {
    const donghae = bySite('water').find((s) => s.id === 'donghae')!;
    expect(donghae.dailyWaterTons).toBeGreaterThan(0);
  });

  it('동해안 2.4GW가 발표 입지 중 가장 크다', () => {
    const sites = bySite();
    const max = sites.reduce((a, b) => (a.capacityGw > b.capacityGw ? a : b));
    expect(max.id).toBe('jeonnam-separate');
    expect(sites.find((s) => s.id === 'donghae')!.shareOfPlan).toBeCloseTo(2.4 / 18.4, 6);
  });
});

describe('출처 메타데이터', () => {
  it('모든 메가프로젝트 수치가 출처와 시점을 갖는다', () => {
    for (const f of ALL_MEGA_FIGURES) {
      expect(f.source.trim().length).toBeGreaterThan(0);
      expect(f.date).toMatch(/^\d{4}-\d{2}$/);
      expect(f.kind).toBe('announced');
    }
  });
});
