/**
 * generate-regional-data.ts
 *
 * Generates realistic Korean local government (지방재정) budget sample data
 * for 17 광역시도 and their 시군구 districts.
 *
 * Outputs:
 *   data/processed/regional-flat-2023.json
 *   data/processed/regional-flat-2024.json
 *   data/processed/regional-flat-2025.json
 *   data/processed/regional-flat-2026.json
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

let rng = createRng(20240101);

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

interface RegionalBudgetItem {
  fiscalYear: number;
  regionCode: string;
  regionName: string;
  districtCode: string;
  districtName: string;
  functionName: string;
  accountType: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// 17개 광역시도 with realistic 2024 budgets (백만원)
// ---------------------------------------------------------------------------

interface RegionDef {
  code: string;
  name: string;
  budget2024: number;
  districts: string[];
}

const REGIONS: RegionDef[] = [
  { code: '11', name: '서울특별시', budget2024: 43_000_000, districts: ['종로구', '중구', '용산구', '성동구', '광진구', '동대문구', '중랑구', '성북구', '강북구', '도봉구', '노원구', '은평구', '서대문구', '마포구', '양천구', '강서구', '구로구', '금천구', '영등포구', '동작구', '관악구', '서초구', '강남구', '송파구', '강동구'] },
  { code: '21', name: '부산광역시', budget2024: 14_500_000, districts: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'] },
  { code: '22', name: '대구광역시', budget2024: 10_200_000, districts: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'] },
  { code: '23', name: '인천광역시', budget2024: 12_800_000, districts: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'] },
  { code: '24', name: '광주광역시', budget2024: 6_800_000, districts: ['동구', '서구', '남구', '북구', '광산구'] },
  { code: '25', name: '대전광역시', budget2024: 6_200_000, districts: ['동구', '중구', '서구', '유성구', '대덕구'] },
  { code: '26', name: '울산광역시', budget2024: 5_500_000, districts: ['중구', '남구', '동구', '북구', '울주군'] },
  { code: '29', name: '세종특별자치시', budget2024: 2_500_000, districts: [] },
  { code: '31', name: '경기도', budget2024: 38_000_000, districts: ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '양주시', '포천시', '여주시', '연천군', '가평군', '양평군'] },
  { code: '32', name: '강원특별자치도', budget2024: 8_500_000, districts: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'] },
  { code: '33', name: '충청북도', budget2024: 6_500_000, districts: ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'] },
  { code: '34', name: '충청남도', budget2024: 9_200_000, districts: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'] },
  { code: '35', name: '전북특별자치도', budget2024: 8_000_000, districts: ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'] },
  { code: '36', name: '전라남도', budget2024: 10_800_000, districts: ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'] },
  { code: '37', name: '경상북도', budget2024: 12_500_000, districts: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군', '군위군'] },
  { code: '38', name: '경상남도', budget2024: 12_000_000, districts: ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'] },
  { code: '39', name: '제주특별자치도', budget2024: 7_200_000, districts: ['제주시', '서귀포시'] },
];

// ---------------------------------------------------------------------------
// 14개 기능별 분야
// ---------------------------------------------------------------------------

interface FunctionDef {
  name: string;
  share: number;
}

const FUNCTIONS: FunctionDef[] = [
  { name: '사회복지', share: 0.30 },
  { name: '일반공공행정', share: 0.12 },
  { name: '교육', share: 0.08 },
  { name: '교통및물류', share: 0.08 },
  { name: '환경', share: 0.07 },
  { name: '국토및지역개발', share: 0.07 },
  { name: '문화및관광', share: 0.05 },
  { name: '보건', share: 0.05 },
  { name: '농림해양수산', share: 0.05 },
  { name: '공공질서및안전', share: 0.04 },
  { name: '산업중소기업및에너지', share: 0.04 },
  { name: '과학기술', share: 0.02 },
  { name: '예비비기타', share: 0.02 },
  { name: '기타', share: 0.01 },
];

// ---------------------------------------------------------------------------
// Year growth factors
// ---------------------------------------------------------------------------

const YEAR_FACTORS: Record<number, number> = {
  2023: 0.94,
  2024: 1.0,
  2025: 1.04,
  2026: 1.08,
};

// ---------------------------------------------------------------------------
// Budget generation logic
// ---------------------------------------------------------------------------

function generateEntityItems(
  items: RegionalBudgetItem[],
  fiscalYear: number,
  regionCode: string,
  regionName: string,
  districtCode: string,
  districtName: string,
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

    const generalRatio = 0.80 + rng() * 0.10;
    const generalAmount = Math.round(fnBudget * generalRatio);
    const specialAmount = fnBudget - generalAmount;

    items.push({
      fiscalYear,
      regionCode,
      regionName,
      districtCode,
      districtName,
      functionName: FUNCTIONS[f].name,
      accountType: '일반회계',
      amount: generalAmount,
    });

    if (specialAmount > 0) {
      items.push({
        fiscalYear,
        regionCode,
        regionName,
        districtCode,
        districtName,
        functionName: FUNCTIONS[f].name,
        accountType: '특별회계',
        amount: specialAmount,
      });
    }
  }
}

function generateRegionalData(year: number): RegionalBudgetItem[] {
  const items: RegionalBudgetItem[] = [];
  const yearFactor = YEAR_FACTORS[year] ?? 1.0;

  for (const region of REGIONS) {
    const regionBudget = Math.round(region.budget2024 * yearFactor);

    const hasDistricts = region.districts.length > 0;
    const hqShare = hasDistricts ? 0.40 : 1.0;
    const districtTotalShare = hasDistricts ? 0.60 : 0.0;

    const hqBudget = Math.round(regionBudget * hqShare);
    const districtPoolBudget = Math.round(regionBudget * districtTotalShare);

    generateEntityItems(items, year, region.code, region.name, '000', '본청', hqBudget);

    if (hasDistricts) {
      const districtCount = region.districts.length;
      const baseWeight = 1.0 / districtCount;
      const rawWeights: number[] = [];
      let totalWeight = 0;

      for (let i = 0; i < districtCount; i++) {
        const variation = 0.70 + rng() * 0.60;
        const w = baseWeight * variation;
        rawWeights.push(w);
        totalWeight += w;
      }

      const normalizedWeights = rawWeights.map(w => w / totalWeight);

      for (let i = 0; i < districtCount; i++) {
        const districtBudget = Math.round(districtPoolBudget * normalizedWeights[i]);
        const districtCode = String(i + 1).padStart(3, '0');
        generateEntityItems(
          items, year,
          region.code, region.name,
          districtCode, region.districts[i],
          districtBudget,
        );
      }
    }
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
    rng = createRng(20240101 + year);

    const items = generateRegionalData(year);

    const outPath = path.join(outDir, `regional-flat-${year}.json`);
    fs.writeFileSync(outPath, JSON.stringify(items, null, 2), 'utf-8');

    const total = items.reduce((sum, item) => sum + item.amount, 0);
    console.log(
      `[regional] ${year}: ${items.length} items, ` +
      `total = ${(total / 1_000_000).toFixed(1)}조원 → ${outPath}`
    );
  }

  console.log('[regional] Done.');
}

main();
