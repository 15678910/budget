// src/lib/data/__tests__/regional-real.test.ts
// 지역 예산 JSON이 지방재정365 세부사업별 세출(QWGJK) 집계인지 확인한다(난수 표본 데이터 회귀 차단).
import fs from 'fs';
import path from 'path';
import type { BudgetTreeNode } from '@/types/budget';

const ROOT = process.cwd();
const PROCESSED = path.join(ROOT, 'data', 'processed');
const YEARS = [2023, 2024, 2025, 2026];

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(path.join(PROCESSED, file), 'utf-8')) as T;
}

function total(node: BudgetTreeNode): number {
  if (node.value !== undefined) return node.value;
  return (node.children ?? []).reduce((s, c) => s + total(c), 0);
}

function child(node: BudgetTreeNode, name: string): BudgetTreeNode {
  const found = node.children?.find((c) => c.name === name);
  if (!found) throw new Error(`${node.name} 아래에 ${name} 없음`);
  return found;
}

interface RegionalMeta {
  availableYears: number[];
  source: string;
  asOf: Record<string, string>;
  excludedTransfersEok: Record<string, number>;
  note: string;
}

describe('지역 예산 실제 데이터(지방재정365 QWGJK)', () => {
  const meta = readJson<RegionalMeta>('regional-metadata.json');

  it('메타데이터 출처·기준일·제외액', () => {
    expect(meta.source).toBe('lofin365-QWGJK');
    expect(meta.availableYears).toEqual(YEARS);
    for (const y of YEARS) {
      expect(meta.asOf[String(y)]).toMatch(new RegExp(`^${y}\\d{4}$`));
      expect(meta.excludedTransfersEok[String(y)]).toBeGreaterThan(0);
    }
  });

  it('제외 규칙: 사업명에 내부거래·보전지출이 포함된 행을 뺀다고 메타에 명시', () => {
    expect(meta.note).toContain('포함된 행 제외');
  });

  it('난수 표본 데이터 생성기가 없다', () => {
    expect(fs.existsSync(path.join(ROOT, 'scripts', 'generate-regional-data.ts'))).toBe(false);
  });

  describe.each(YEARS)('%i년', (year) => {
    const metro = readJson<BudgetTreeNode>(`regional-by-metro-${year}.json`);
    const district = readJson<BudgetTreeNode>(`regional-by-district-${year}.json`);

    it('광역 트리: 17개 시도, 시도마다 분야 1개 이상', () => {
      expect(metro.children).toHaveLength(17);
      for (const m of metro.children ?? []) {
        expect((m.children ?? []).length).toBeGreaterThanOrEqual(1);
      }
    });

    it('시군구 트리: 17개 시도 모두 본청, 시군구 220곳 이상', () => {
      expect(district.children).toHaveLength(17);
      let districts = 0;
      for (const m of district.children ?? []) {
        expect(m.children?.some((d) => d.name === '본청')).toBe(true);
        districts += (m.children ?? []).filter((d) => d.name !== '본청').length;
      }
      expect(districts).toBeGreaterThanOrEqual(220);
    });

    it('광역 금액 = 시군구 트리의 본청 금액 (본청만)', () => {
      for (const m of metro.children ?? []) {
        const hq = child(child(district, m.name), '본청');
        expect(total(m)).toBe(total(hq));
      }
    });

    it('서울 본청 농림해양수산 비중 < 2%', () => {
      const seoul = child(metro, '서울특별시');
      const agri = seoul.children?.find((c) => c.name === '농림해양수산');
      const share = (agri ? total(agri) : 0) / total(seoul);
      expect(share).toBeLessThan(0.02);
    });

    it('경기 본청 < 경기 시·군 합계', () => {
      const gyeonggiHq = total(child(metro, '경기도'));
      const cities = (child(district, '경기도').children ?? [])
        .filter((d) => d.name !== '본청')
        .reduce((s, d) => s + total(d), 0);
      expect(gyeonggiHq).toBeGreaterThan(0);
      expect(gyeonggiHq).toBeLessThan(cities);
    });
  });
});
