/**
 * 표준단가 비용추계 검증 테스트
 * NABO/KDI 기준 범위 내 산출 결과 확인
 */
import {
  detectPolicyCategory,
  detectMultipleCategories,
  calculateStandardCost,
  calculateCompoundCost,
  type PolicyCategory,
} from '../standard-costs';

// ─── Category Detection Tests ─────────────────────────────────────────────────

describe('detectPolicyCategory', () => {
  const cases: [string, PolicyCategory][] = [
    ['공공병원 신설', 'hospital'],
    ['도로 확장 사업', 'infrastructure'],
    ['초등학교 신설', 'education'],
    ['공공임대주택 건설', 'housing'],
    ['공공은행 설립', 'bank'],
    ['지역화폐 도입', 'digitalCurrency'],
    ['블록체인 기반 화폐', 'digitalCurrency'],
    ['AI 스마트시티', 'ai'],
    ['노인돌봄 서비스', 'welfare'],
    ['태양광 발전소', 'environment'],
    ['관광특구 지정', 'tourism'],
    ['문화센터 건립', 'culture'],
    ['주민세 인상', 'general'],
    ['지역아동센터', 'welfare'],
    ['보육원 확충', 'education'],
    ['요양원 신설', 'welfare'],
  ];

  test.each(cases)('"%s" → %s', (input, expected) => {
    expect(detectPolicyCategory(input)).toBe(expected);
  });
});

describe('detectMultipleCategories', () => {
  test('compound policy: blockchain + public bank', () => {
    const cats = detectMultipleCategories('블록체인 기반 지역화폐와 공공은행 도입');
    expect(cats).toContain('digitalCurrency');
    expect(cats).toContain('bank');
    expect(cats.length).toBeGreaterThanOrEqual(2);
  });

  test('single policy returns one category', () => {
    const cats = detectMultipleCategories('공공병원 신설');
    expect(cats).toEqual(['hospital']);
  });

  test('unknown policy returns general', () => {
    const cats = detectMultipleCategories('주민세 인상');
    expect(cats).toEqual(['general']);
  });
});

// ─── Cost Estimation Range Tests ──────────────────────────────────────────────

// Test region data representing typical Korean regions
const smallRegion = { population: 100000, budget: 5000, independence: 20 };
const mediumRegion = { population: 500000, budget: 30000, independence: 35 };
const largeRegion = { population: 1500000, budget: 80000, independence: 50 };

describe('calculateStandardCost - NABO range validation', () => {
  describe('hospital (공공병원)', () => {
    test.each([smallRegion, mediumRegion, largeRegion])(
      'initial cost within 400-1200억 range (pop: %p)',
      (region) => {
        const result = calculateStandardCost('hospital', region);
        expect(result.initialCost).toBeGreaterThanOrEqual(400);
        expect(result.initialCost).toBeLessThanOrEqual(1200);
      }
    );

    test('operating ratio is 15%', () => {
      const result = calculateStandardCost('hospital', mediumRegion);
      const ratio = result.annualOperatingCost / result.initialCost;
      expect(ratio).toBeCloseTo(0.15, 1);
    });
  });

  describe('bank (공공은행)', () => {
    test('initial cost within 300-1000억 range', () => {
      const result = calculateStandardCost('bank', mediumRegion);
      expect(result.initialCost).toBeGreaterThanOrEqual(300);
      expect(result.initialCost).toBeLessThanOrEqual(1000);
    });

    test('fixed cost model returns base cost', () => {
      const result = calculateStandardCost('bank', smallRegion);
      expect(result.initialCost).toBe(500);
    });
  });

  describe('digitalCurrency (지역화폐/블록체인)', () => {
    test.each([smallRegion, mediumRegion, largeRegion])(
      'initial cost within 30-500억 range',
      (region) => {
        const result = calculateStandardCost('digitalCurrency', region);
        expect(result.initialCost).toBeGreaterThanOrEqual(30);
        expect(result.initialCost).toBeLessThanOrEqual(500);
      }
    );
  });

  describe('infrastructure (도로/교통)', () => {
    test.each([smallRegion, mediumRegion, largeRegion])(
      'initial cost within 300-5000억 range',
      (region) => {
        const result = calculateStandardCost('infrastructure', region);
        expect(result.initialCost).toBeGreaterThanOrEqual(300);
        expect(result.initialCost).toBeLessThanOrEqual(5000);
      }
    );
  });

  describe('all categories - common validations', () => {
    const categories: PolicyCategory[] = [
      'hospital', 'infrastructure', 'education', 'housing',
      'bank', 'digitalCurrency', 'ai', 'welfare',
      'environment', 'tourism', 'culture', 'general',
    ];

    test.each(categories)('%s: operating cost ratio within 2-40%', (category) => {
      const result = calculateStandardCost(category, mediumRegion);
      const ratio = result.annualOperatingCost / result.initialCost;
      expect(ratio).toBeGreaterThanOrEqual(0.02);
      expect(ratio).toBeLessThanOrEqual(0.40);
    });

    test.each(categories)('%s: has cost breakdown items', (category) => {
      const result = calculateStandardCost(category, mediumRegion);
      expect(result.costItems.length).toBeGreaterThanOrEqual(3);
    });

    test.each(categories)('%s: has benchmarks', (category) => {
      const result = calculateStandardCost(category, mediumRegion);
      expect(result.benchmarks.length).toBeGreaterThanOrEqual(1);
    });

    test.each(categories)('%s: has methodology string', (category) => {
      const result = calculateStandardCost(category, mediumRegion);
      expect(result.methodology).toBeTruthy();
      expect(result.methodology.length).toBeGreaterThan(10);
    });

    test.each(categories)('%s: feasibility is valid', (category) => {
      const result = calculateStandardCost(category, mediumRegion);
      expect(['상', '중', '하']).toContain(result.feasibility);
    });
  });
});

// ─── Compound Cost Tests ──────────────────────────────────────────────────────

describe('calculateCompoundCost', () => {
  test('synergy discount is exactly 15%', () => {
    const single1 = calculateStandardCost('digitalCurrency', mediumRegion);
    const single2 = calculateStandardCost('bank', mediumRegion);
    const compound = calculateCompoundCost(['digitalCurrency', 'bank'], mediumRegion);

    const sumWithoutDiscount = single1.initialCost + single2.initialCost;
    const expectedWithDiscount = Math.round(sumWithoutDiscount * 0.85);
    expect(compound.initialCost).toBe(expectedWithDiscount);
  });

  test('compound cost is less than sum of individual costs', () => {
    const single1 = calculateStandardCost('hospital', mediumRegion);
    const single2 = calculateStandardCost('ai', mediumRegion);
    const compound = calculateCompoundCost(['hospital', 'ai'], mediumRegion);

    expect(compound.initialCost).toBeLessThan(single1.initialCost + single2.initialCost);
  });

  test('single category compound equals single calculation', () => {
    const single = calculateStandardCost('hospital', mediumRegion);
    const compound = calculateCompoundCost(['hospital'], mediumRegion);
    expect(compound.initialCost).toBe(single.initialCost);
  });

  test('most conservative feasibility wins', () => {
    // bank (independence 20 < threshold 25 → '하') + ai (independence 20 < 15? no → '중')
    const compound = calculateCompoundCost(['bank', 'ai'], smallRegion);
    expect(compound.feasibility).toBe('하');
  });
});

// ─── Independence Change Tests ────────────────────────────────────────────────

describe('independence change adjustments', () => {
  test('hospital: low independence gets extra negative', () => {
    const low = calculateStandardCost('hospital', { ...mediumRegion, independence: 20 });
    const high = calculateStandardCost('hospital', { ...mediumRegion, independence: 55 });
    expect(low.independenceChange).toBeLessThan(high.independenceChange);
  });

  test('bank: positive independence change for high independence regions', () => {
    const result = calculateStandardCost('bank', { ...mediumRegion, independence: 50 });
    expect(result.independenceChange).toBeGreaterThan(0);
  });
});
