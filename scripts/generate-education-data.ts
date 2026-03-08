/**
 * generate-education-data.ts
 *
 * Generates realistic Korean education office (시도교육청) budget sample data
 * for 17 시도교육청.
 *
 * Outputs:
 *   data/processed/education-flat-2023.json
 *   data/processed/education-flat-2024.json
 *   data/processed/education-flat-2025.json
 *   data/processed/education-flat-2026.json
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) for deterministic reproducibility
// ---------------------------------------------------------------------------

function createRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rng = createRng(20240201);

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

interface EducationBudgetItem {
  fiscalYear: number;
  officeCode: string;
  officeName: string;
  functionName: string;
  accountType: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// 17개 시도교육청 with realistic 2024 교육비특별회계 budgets (백만원)
// ---------------------------------------------------------------------------

interface OfficeDef {
  code: string;
  name: string;
  budget2024: number;
}

const OFFICES: OfficeDef[] = [
  { code: 'E11', name: '서울특별시교육청', budget2024: 12_800_000 },
  { code: 'E21', name: '부산광역시교육청', budget2024: 4_200_000 },
  { code: 'E22', name: '대구광역시교육청', budget2024: 3_200_000 },
  { code: 'E23', name: '인천광역시교육청', budget2024: 3_800_000 },
  { code: 'E24', name: '광주광역시교육청', budget2024: 2_100_000 },
  { code: 'E25', name: '대전광역시교육청', budget2024: 2_000_000 },
  { code: 'E26', name: '울산광역시교육청', budget2024: 1_500_000 },
  { code: 'E29', name: '세종특별자치시교육청', budget2024: 600_000 },
  { code: 'E31', name: '경기도교육청', budget2024: 18_500_000 },
  { code: 'E32', name: '강원특별자치도교육청', budget2024: 2_200_000 },
  { code: 'E33', name: '충청북도교육청', budget2024: 2_100_000 },
  { code: 'E34', name: '충청남도교육청', budget2024: 2_800_000 },
  { code: 'E35', name: '전북특별자치도교육청', budget2024: 2_500_000 },
  { code: 'E36', name: '전라남도교육청', budget2024: 2_600_000 },
  { code: 'E37', name: '경상북도교육청', budget2024: 3_500_000 },
  { code: 'E38', name: '경상남도교육청', budget2024: 4_100_000 },
  { code: 'E39', name: '제주특별자치도교육청', budget2024: 1_000_000 },
];

// ---------------------------------------------------------------------------
// 교육비특별회계 기능별 분야 (11개)
// ---------------------------------------------------------------------------

interface FunctionDef {
  name: string;
  share: number;
}

const FUNCTIONS: FunctionDef[] = [
  { name: '유아및초등교육', share: 0.28 },
  { name: '중등교육', share: 0.25 },
  { name: '고등교육', share: 0.03 },
  { name: '평생직업교육', share: 0.04 },
  { name: '교육일반', share: 0.10 },
  { name: '학교시설', share: 0.10 },
  { name: '급식및체험활동', share: 0.06 },
  { name: '교육복지', share: 0.05 },
  { name: '보건안전', share: 0.03 },
  { name: '기관운영', share: 0.04 },
  { name: '예비비기타', share: 0.02 },
];

// ---------------------------------------------------------------------------
// Year growth factors
// ---------------------------------------------------------------------------

const YEAR_FACTORS: Record<number, number> = {
  2023: 0.95,
  2024: 1.0,
  2025: 1.05,
  2026: 1.09,
};

// ---------------------------------------------------------------------------
// Budget generation logic
// ---------------------------------------------------------------------------

function generateOfficeItems(
  items: EducationBudgetItem[],
  fiscalYear: number,
  officeCode: string,
  officeName: string,
  totalBudget: number,
): void {
  const rawShares: number[] = [];
  let shareSum = 0;

  for (const fn of FUNCTIONS) {
    const variation = 0.80 + rng() * 0.40;
    const adjusted = fn.share * variation;
    rawShares.push(adjusted);
    shareSum += adjusted;
  }

  const normalizedShares = rawShares.map(s => s / shareSum);

  for (let f = 0; f < FUNCTIONS.length; f++) {
    const fnBudget = Math.round(totalBudget * normalizedShares[f]);
    if (fnBudget <= 0) continue;

    const generalRatio = 0.85 + rng() * 0.10;
    const generalAmount = Math.round(fnBudget * generalRatio);
    const specialAmount = fnBudget - generalAmount;

    items.push({
      fiscalYear,
      officeCode,
      officeName,
      functionName: FUNCTIONS[f].name,
      accountType: '교육비특별회계',
      amount: generalAmount,
    });

    if (specialAmount > 0) {
      items.push({
        fiscalYear,
        officeCode,
        officeName,
        functionName: FUNCTIONS[f].name,
        accountType: '기타특별회계',
        amount: specialAmount,
      });
    }
  }
}

function generateEducationData(year: number): EducationBudgetItem[] {
  const items: EducationBudgetItem[] = [];
  const yearFactor = YEAR_FACTORS[year] ?? 1.0;

  for (const office of OFFICES) {
    const officeBudget = Math.round(office.budget2024 * yearFactor);
    generateOfficeItems(items, year, office.code, office.name, officeBudget);
  }

  return items;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const outDir = path.resolve(process.cwd(), 'data', 'processed');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const years = [2023, 2024, 2025, 2026];

  for (const year of years) {
    rng = createRng(20240201 + year);

    const items = generateEducationData(year);

    const outPath = path.join(outDir, `education-flat-${year}.json`);
    fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf-8');

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    console.log(
      `[education] ${year}: ${items.length} items, ` +
      `total = ${(total / 1_000_000).toFixed(1)}조원 → ${outPath}`
    );
  }

  console.log('[education] Done.');
}

main();
