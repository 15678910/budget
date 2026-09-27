import { computeUnmatchedDistricts, matchDistrictName } from '@/lib/utils/geo-utils';
import type { BudgetTreeNode } from '@/types/budget';

function node(name: string, value: number): BudgetTreeNode {
  return { id: name, name, value };
}

describe('computeUnmatchedDistricts', () => {
  it('returns districts with no matching geometry for 2026 인천 (post-reorg 구), sorted by amount desc', () => {
    // 2026 인천광역시 district budget nodes (post July-2026 행정구역 개편).
    // 중구·동구·서구 (2013 topojson boundaries) no longer exist as budget names;
    // 영종구·제물포구·서해구·검단구 are new districts without map geometry.
    const districtNodes: BudgetTreeNode[] = [
      node('본청', 999_999),
      node('서해구', 1_522_459),
      node('남동구', 800_000),
      node('부평구', 700_000),
      node('미추홀구', 1_270_504),
      node('연수구', 600_000),
      node('계양구', 500_000),
      node('강화군', 200_000),
      node('옹진군', 100_000),
      node('제물포구', 563_550),
      node('검단구', 341_170),
      node('영종구', 315_105),
    ];

    // Matched via matchDistrictName against the (2013-boundary) municipality geometries:
    // 남동구, 부평구, 미추홀구(← 남구 rename), 연수구, 계양구, 강화군, 옹진군.
    // 중구/동구/서구 geometries exist but have no budget-name match (excluded from matchedBudgetNames).
    const matchedBudgetNames = new Set([
      '남동구',
      '부평구',
      '미추홀구',
      '연수구',
      '계양구',
      '강화군',
      '옹진군',
    ]);

    const result = computeUnmatchedDistricts(districtNodes, matchedBudgetNames);

    expect(result.map((d) => d.name)).toEqual(['서해구', '제물포구', '검단구', '영종구']);
    expect(result).toEqual([
      { name: '서해구', totalBudget: 1_522_459 },
      { name: '제물포구', totalBudget: 563_550 },
      { name: '검단구', totalBudget: 341_170 },
      { name: '영종구', totalBudget: 315_105 },
    ]);
  });

  it('returns an empty array when every district is matched (e.g. 2025 인천)', () => {
    const districtNodes: BudgetTreeNode[] = [
      node('본청', 999_999),
      node('중구', 100_000),
      node('동구', 100_000),
      node('서구', 100_000),
      node('남동구', 800_000),
      node('부평구', 700_000),
      node('미추홀구', 1_270_504),
      node('연수구', 600_000),
      node('계양구', 500_000),
      node('강화군', 200_000),
      node('옹진군', 100_000),
    ];

    const matchedBudgetNames = new Set([
      '중구',
      '동구',
      '서구',
      '남동구',
      '부평구',
      '미추홀구',
      '연수구',
      '계양구',
      '강화군',
      '옹진군',
    ]);

    expect(computeUnmatchedDistricts(districtNodes, matchedBudgetNames)).toEqual([]);
  });

  it('always excludes 본청 even when it has no geometry match', () => {
    const districtNodes: BudgetTreeNode[] = [node('본청', 500_000), node('종로구', 100_000)];
    const matchedBudgetNames = new Set(['종로구']);

    expect(computeUnmatchedDistricts(districtNodes, matchedBudgetNames)).toEqual([]);
  });
});

describe('matchDistrictName (regression guard for 2026 인천)', () => {
  it('does not fabricate a 서구 -> 서해구 match (boundaries differ)', () => {
    const budgetDistrictNames = ['서해구', '제물포구', '검단구', '영종구', '남동구'];
    expect(matchDistrictName('서구', '23', budgetDistrictNames)).toBeNull();
  });
});
