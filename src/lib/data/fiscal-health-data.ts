// ============================================================
// 지역재정 건전성 데이터 (2025 당초예산 기준)
// 출처: 지역재정365, 행정안전부, 통계청
// ============================================================

export interface MetroFiscalData {
  name: string;
  independence: number;  // 재정자립도 (%)
  autonomy: number;      // 재정자주도 (%)
  debt: number;          // 지역채무 (억원)
  population: number;    // 인구 (명)
  budget: number;        // 예산규모 (억원)
  revenue: number;       // 세입결산 (억원)
  expenditure: number;   // 세출결산 (억원)
}

export interface DistrictFiscalData {
  metro: string;
  name: string;
  independence: number;  // 재정자립도 (%)
  autonomy: number;      // 재정자주도 (%)
  debt: number;          // 지역채무 (억원)
  population: number;    // 인구 (명)
  budget: number;        // 예산규모 (억원)
}

export interface NationalDebtHistoryEntry {
  year: number;
  debt: number;     // 국가채무 D1 (조원)
  gdp: number;      // GDP (조원)
  ratio: number;    // GDP 대비 국가채무비율 (%)
}

export interface MetroDebtHistoryEntry {
  year: number;
  debt: number;     // 지역채무 (억원)
  budget: number;   // 예산규모 (억원)
  ratio: number;    // 예산 대비 채무비율 (%)
}

export interface DistrictDebtHistoryEntry {
  year: number;
  debt: number;     // 지역채무 추정 (억원)
  ratio: number;    // 채무비율 추정 (%)
}

export interface MetroHouseholdDebt {
  name: string;           // 광역시도명
  avgDebt: number;        // 가구당 평균 부채 (만원)
  avgFinDebt: number;     // 금융부채 (만원)
  avgDeposit: number;     // 임대보증금 (만원)
  debtHoldingRate: number; // 부채보유 가구 비율 (%)
  avgAsset: number;        // 가구당 평균 자산 (만원)
}

// ============================================================
// 17개 광역시도 데이터
// ============================================================

// 재정자립도·자주도: 2025 당초예산 기준 (행안부 공식)
// 지역채무: 2024 결산 기준
// 예산규모: 2026 당초예산 기준
// 인구: 2026.2월 주민등록 기준
const METRO_FISCAL_DATA: MetroFiscalData[] = [
  { name: '서울특별시',       independence: 79.10, autonomy: 80.50, debt: 11544,  population: 9304129,  budget: 514778, revenue: 527600, expenditure: 493400 },
  { name: '부산광역시',       independence: 48.60, autonomy: 61.00, debt: 31413,  population: 3239016,  budget: 179330, revenue: 186500, expenditure: 171200 },
  { name: '대구광역시',       independence: 46.70, autonomy: 59.50, debt: 18500,  population: 2351461,  budget: 117078, revenue: 121800, expenditure: 112000 },
  { name: '인천광역시',       independence: 55.60, autonomy: 68.00, debt: 22000,  population: 3054367,  budget: 153129, revenue: 159200, expenditure: 146600 },
  { name: '전남광주통합특별시', independence: 33.64, autonomy: 68.30, debt: 26000,  population: 3165782,  budget: 203846, revenue: 216600, expenditure: 195100 },
  { name: '대전광역시',       independence: 45.10, autonomy: 63.00, debt: 11200,  population: 1441405,  budget: 70582,  revenue: 73600,  expenditure: 67500 },
  { name: '울산광역시',       independence: 52.90, autonomy: 66.50, debt: 8500,   population: 1089835,  budget: 56446,  revenue: 58200,  expenditure: 54100 },
  { name: '세종특별자치시',   independence: 62.70, autonomy: 75.00, debt: 5200,   population: 391240,   budget: 20829,  revenue: 21500,  expenditure: 19900 },
  { name: '경기도',           independence: 62.80, autonomy: 75.00, debt: 49847,  population: 13742072, budget: 400577, revenue: 416200, expenditure: 384100 },
  { name: '강원특별자치도',   independence: 29.00, autonomy: 73.00, debt: 15200,  population: 1506816,  budget: 83731,  revenue: 89200,  expenditure: 80100 },
  { name: '충청북도',         independence: 36.90, autonomy: 73.00, debt: 12400,  population: 1596816,  budget: 76703,  revenue: 81800,  expenditure: 73400 },
  { name: '충청남도',         independence: 36.80, autonomy: 71.00, debt: 14600,  population: 2136064,  budget: 124628, revenue: 132800, expenditure: 119200 },
  { name: '전북특별자치도',   independence: 27.10, autonomy: 74.00, debt: 11800,  population: 1721941,  budget: 109770, revenue: 117800, expenditure: 105200 },
  { name: '경상북도',         independence: 31.00, autonomy: 71.00, debt: 17800,  population: 2500499,  budget: 140363, revenue: 150200, expenditure: 134200 },
  { name: '경상남도',         independence: 39.20, autonomy: 68.00, debt: 21500,  population: 3201389,  budget: 142845, revenue: 150600, expenditure: 136800 },
  { name: '제주특별자치도',   independence: 39.50, autonomy: 76.00, debt: 7500,   population: 663514,   budget: 77875,  revenue: 82400,  expenditure: 74500 },
];

// ============================================================
// 시군구 데이터
// ============================================================

const DISTRICT_FISCAL_DATA: DistrictFiscalData[] = [
  // ─── 서울특별시 ───
  { metro: '서울특별시', name: '강남구', independence: 56.1, autonomy: 78.0, debt: 1200, population: 545000, budget: 13737 },
  { metro: '서울특별시', name: '서초구', independence: 53.2, autonomy: 76.5, debt: 980, population: 430000, budget: 12000 },
  { metro: '서울특별시', name: '중구', independence: 53.6, autonomy: 77.2, debt: 650, population: 130000, budget: 5500 },
  { metro: '서울특별시', name: '송파구', independence: 42.8, autonomy: 72.1, debt: 1100, population: 670000, budget: 12394 },
  { metro: '서울특별시', name: '종로구', independence: 45.2, autonomy: 74.5, debt: 420, population: 150000, budget: 5774 },
  { metro: '서울특별시', name: '용산구', independence: 42.1, autonomy: 73.8, debt: 550, population: 230000, budget: 6870 },
  { metro: '서울특별시', name: '영등포구', independence: 39.5, autonomy: 70.2, debt: 890, population: 370000, budget: 9530 },
  { metro: '서울특별시', name: '마포구', independence: 36.2, autonomy: 68.5, debt: 780, population: 370000, budget: 9530 },
  { metro: '서울특별시', name: '성동구', independence: 33.5, autonomy: 66.1, debt: 680, population: 310000, budget: 8390 },
  { metro: '서울특별시', name: '강동구', independence: 30.5, autonomy: 65.2, debt: 780, population: 450000, budget: 11050 },
  { metro: '서울특별시', name: '금천구', independence: 29.2, autonomy: 64.3, debt: 480, population: 240000, budget: 7060 },
  { metro: '서울특별시', name: '광진구', independence: 28.8, autonomy: 63.5, debt: 520, population: 350000, budget: 9150 },
  { metro: '서울특별시', name: '강서구', independence: 28.5, autonomy: 62.3, debt: 850, population: 580000, budget: 13025 },
  { metro: '서울특별시', name: '구로구', independence: 27.5, autonomy: 63.1, debt: 720, population: 400000, budget: 10100 },
  { metro: '서울특별시', name: '양천구', independence: 26.3, autonomy: 62.5, debt: 680, population: 450000, budget: 11050 },
  { metro: '서울특별시', name: '동작구', independence: 25.1, autonomy: 61.8, debt: 550, population: 390000, budget: 9910 },
  { metro: '서울특별시', name: '서대문구', independence: 23.5, autonomy: 60.1, debt: 580, population: 310000, budget: 8390 },
  { metro: '서울특별시', name: '동대문구', independence: 22.1, autonomy: 59.3, debt: 610, population: 340000, budget: 8960 },
  { metro: '서울특별시', name: '관악구', independence: 21.3, autonomy: 58.2, debt: 620, population: 490000, budget: 11810 },
  { metro: '서울특별시', name: '성북구', independence: 20.8, autonomy: 57.5, debt: 700, population: 430000, budget: 10670 },
  { metro: '서울특별시', name: '은평구', independence: 19.5, autonomy: 56.8, debt: 650, population: 470000, budget: 11650 },
  { metro: '서울특별시', name: '노원구', independence: 18.5, autonomy: 55.8, debt: 720, population: 510000, budget: 12925 },
  { metro: '서울특별시', name: '중랑구', independence: 17.2, autonomy: 54.8, debt: 560, population: 390000, budget: 9910 },
  { metro: '서울특별시', name: '도봉구', independence: 15.8, autonomy: 53.6, debt: 420, population: 320000, budget: 8580 },
  { metro: '서울특별시', name: '강북구', independence: 14.2, autonomy: 52.1, debt: 480, population: 300000, budget: 8200 },

  // ─── 경기도 ───
  { metro: '경기도', name: '과천시', independence: 63.1, autonomy: 80.2, debt: 450, population: 72000, budget: 6600 },
  { metro: '경기도', name: '성남시', independence: 57.2, autonomy: 79.5, debt: 3200, population: 920000, budget: 38298 },
  { metro: '경기도', name: '화성시', independence: 55.8, autonomy: 78.1, debt: 4500, population: 950000, budget: 35027 },
  { metro: '경기도', name: '용인시', independence: 51.2, autonomy: 76.3, debt: 3100, population: 1100000, budget: 33318 },
  { metro: '경기도', name: '수원시', independence: 48.5, autonomy: 74.2, debt: 2800, population: 1200000, budget: 31899 },
  { metro: '경기도', name: '평택시', independence: 45.2, autonomy: 73.5, debt: 2100, population: 580000, budget: 19240 },
  { metro: '경기도', name: '하남시', independence: 44.5, autonomy: 73.8, debt: 850, population: 310000, budget: 14400 },
  { metro: '경기도', name: '김포시', independence: 42.8, autonomy: 72.1, debt: 1400, population: 480000, budget: 21200 },
  { metro: '경기도', name: '이천시', independence: 42.1, autonomy: 72.5, debt: 680, population: 220000, budget: 10800 },
  { metro: '경기도', name: '안양시', independence: 41.2, autonomy: 70.5, debt: 1500, population: 550000, budget: 17593 },
  { metro: '경기도', name: '시흥시', independence: 40.5, autonomy: 71.2, debt: 1300, population: 510000, budget: 17280 },
  { metro: '경기도', name: '광주시', independence: 39.8, autonomy: 70.8, debt: 920, population: 390000, budget: 17600 },
  { metro: '경기도', name: '안산시', independence: 38.8, autonomy: 69.5, debt: 1700, population: 650000, budget: 22597 },
  { metro: '경기도', name: '고양시', independence: 38.5, autonomy: 68.2, debt: 2200, population: 1050000, budget: 33405 },
  { metro: '경기도', name: '파주시', independence: 38.2, autonomy: 69.1, debt: 1600, population: 480000, budget: 21200 },
  { metro: '경기도', name: '남양주시', independence: 36.5, autonomy: 67.5, debt: 1900, population: 720000, budget: 22720 },
  { metro: '경기도', name: '부천시', independence: 35.8, autonomy: 66.8, debt: 1800, population: 810000, budget: 24378 },
  { metro: '경기도', name: '구리시', independence: 32.8, autonomy: 66.1, debt: 580, population: 200000, budget: 10000 },
  { metro: '경기도', name: '양주시', independence: 32.5, autonomy: 65.8, debt: 780, population: 230000, budget: 11200 },
  { metro: '경기도', name: '의정부시', independence: 30.2, autonomy: 64.5, debt: 1200, population: 460000, budget: 20400 },
  { metro: '경기도', name: '광명시', independence: 40.1, autonomy: 70.5, debt: 1200, population: 280000, budget: 13200 },
  { metro: '경기도', name: '군포시', independence: 38.5, autonomy: 69.2, debt: 850, population: 260000, budget: 12400 },
  { metro: '경기도', name: '의왕시', independence: 37.8, autonomy: 68.8, debt: 450, population: 155000, budget: 10800 },
  { metro: '경기도', name: '오산시', independence: 36.2, autonomy: 67.5, debt: 620, population: 240000, budget: 11600 },
  { metro: '경기도', name: '안성시', independence: 30.8, autonomy: 64.8, debt: 720, population: 185000, budget: 12600 },
  { metro: '경기도', name: '여주시', independence: 28.5, autonomy: 63.2, debt: 520, population: 115000, budget: 8400 },
  { metro: '경기도', name: '포천시', independence: 25.5, autonomy: 61.2, debt: 680, population: 142000, budget: 10020 },
  { metro: '경기도', name: '동두천시', independence: 22.8, autonomy: 58.5, debt: 380, population: 87000, budget: 7725 },
  { metro: '경기도', name: '양평군', independence: 22.5, autonomy: 58.2, debt: 350, population: 127000, budget: 9620 },
  { metro: '경기도', name: '가평군', independence: 20.2, autonomy: 56.8, debt: 280, population: 63000, budget: 6540 },
  { metro: '경기도', name: '연천군', independence: 18.5, autonomy: 55.2, debt: 220, population: 43000, budget: 4940 },

  // ─── 부산광역시 ───
  { metro: '부산광역시', name: '해운대구', independence: 42.5, autonomy: 72.1, debt: 1800, population: 410000, budget: 10520 },
  { metro: '부산광역시', name: '수영구', independence: 34.2, autonomy: 67.5, debt: 450, population: 180000, budget: 6040 },
  { metro: '부산광역시', name: '부산진구', independence: 32.8, autonomy: 65.2, debt: 1200, population: 350000, budget: 9200 },
  { metro: '부산광역시', name: '동래구', independence: 30.5, autonomy: 64.8, debt: 780, population: 260000, budget: 8280 },
  { metro: '부산광역시', name: '남구', independence: 28.2, autonomy: 62.1, debt: 680, population: 270000, budget: 8560 },
  { metro: '부산광역시', name: '연제구', independence: 26.5, autonomy: 61.3, debt: 520, population: 210000, budget: 6880 },
  { metro: '부산광역시', name: '사상구', independence: 25.1, autonomy: 60.8, debt: 620, population: 210000, budget: 6880 },
  { metro: '부산광역시', name: '금정구', independence: 24.8, autonomy: 60.2, debt: 580, population: 230000, budget: 7440 },
  { metro: '부산광역시', name: '사하구', independence: 22.1, autonomy: 58.5, debt: 950, population: 290000, budget: 9120 },
  { metro: '부산광역시', name: '북구', independence: 20.8, autonomy: 57.2, debt: 780, population: 280000, budget: 8840 },
  { metro: '부산광역시', name: '강서구', independence: 35.2, autonomy: 67.8, debt: 1500, population: 130000, budget: 5800 },
  { metro: '부산광역시', name: '기장군', independence: 32.5, autonomy: 65.2, debt: 1200, population: 190000, budget: 6320 },
  { metro: '부산광역시', name: '중구', independence: 30.2, autonomy: 63.5, debt: 280, population: 42000, budget: 3760 },
  { metro: '부산광역시', name: '서구', independence: 22.5, autonomy: 58.8, debt: 320, population: 100000, budget: 4600 },
  { metro: '부산광역시', name: '동구', independence: 20.8, autonomy: 57.2, debt: 250, population: 85000, budget: 4000 },
  { metro: '부산광역시', name: '영도구', independence: 19.5, autonomy: 56.5, debt: 380, population: 110000, budget: 5000 },

  // ─── 대구광역시 ───
  { metro: '대구광역시', name: '수성구', independence: 38.5, autonomy: 69.2, debt: 850, population: 420000, budget: 10740 },
  { metro: '대구광역시', name: '달서구', independence: 28.1, autonomy: 62.5, debt: 920, population: 540000, budget: 13380 },
  { metro: '대구광역시', name: '군위군', independence: 10.0, autonomy: 48.5, debt: 180, population: 22000, budget: 3500 },
  { metro: '대구광역시', name: '달성군', independence: 35.8, autonomy: 68.5, debt: 1800, population: 250000, budget: 8000 },
  { metro: '대구광역시', name: '중구', independence: 32.5, autonomy: 65.8, debt: 320, population: 75000, budget: 3600 },
  { metro: '대구광역시', name: '북구', independence: 25.5, autonomy: 61.2, debt: 720, population: 430000, budget: 10960 },
  { metro: '대구광역시', name: '동구', independence: 24.2, autonomy: 60.1, debt: 580, population: 340000, budget: 8980 },
  { metro: '대구광역시', name: '서구', independence: 20.8, autonomy: 57.5, debt: 280, population: 170000, budget: 5760 },

  // ─── 인천광역시 ───
  { metro: '인천광역시', name: '서구', independence: 45.2, autonomy: 74.1, debt: 1500, population: 550000, budget: 13292 },
  { metro: '인천광역시', name: '연수구', independence: 42.8, autonomy: 72.5, debt: 1100, population: 380000, budget: 9860 },
  { metro: '인천광역시', name: '강화군', independence: 15.2, autonomy: 52.8, debt: 320, population: 65000, budget: 3200 },
  { metro: '인천광역시', name: '중구', independence: 38.5, autonomy: 70.2, debt: 1800, population: 120000, budget: 5400 },
  { metro: '인천광역시', name: '남동구', independence: 35.2, autonomy: 67.5, debt: 1200, population: 530000, budget: 13160 },
  { metro: '인천광역시', name: '부평구', independence: 30.8, autonomy: 64.2, debt: 920, population: 490000, budget: 12280 },
  { metro: '인천광역시', name: '미추홀구', independence: 28.5, autonomy: 62.8, debt: 680, population: 390000, budget: 10080 },
  { metro: '인천광역시', name: '계양구', independence: 28.2, autonomy: 62.5, debt: 650, population: 300000, budget: 8100 },
  { metro: '인천광역시', name: '동구', independence: 22.1, autonomy: 58.5, debt: 280, population: 63000, budget: 3120 },
  { metro: '인천광역시', name: '옹진군', independence: 15.8, autonomy: 53.2, debt: 180, population: 20000, budget: 3500 },

  // ─── 전남광주통합특별시 (구 광주광역시) ───
  { metro: '전남광주통합특별시', name: '광산구', independence: 32.8, autonomy: 66.1, debt: 1200, population: 410000, budget: 10520 },
  { metro: '전남광주통합특별시', name: '서구', independence: 30.5, autonomy: 64.8, debt: 520, population: 290000, budget: 9120 },
  { metro: '전남광주통합특별시', name: '북구', independence: 28.2, autonomy: 62.5, debt: 680, population: 430000, budget: 10960 },
  { metro: '전남광주통합특별시', name: '동구', independence: 25.2, autonomy: 61.5, debt: 280, population: 95000, budget: 4400 },
  { metro: '전남광주통합특별시', name: '남구', independence: 24.8, autonomy: 60.2, debt: 380, population: 200000, budget: 6600 },

  // ─── 대전광역시 ───
  { metro: '대전광역시', name: '유성구', independence: 38.5, autonomy: 70.8, debt: 920, population: 370000, budget: 9640 },
  { metro: '대전광역시', name: '서구', independence: 32.1, autonomy: 66.2, debt: 680, population: 480000, budget: 12060 },
  { metro: '대전광역시', name: '중구', independence: 28.8, autonomy: 63.5, debt: 450, population: 240000, budget: 7720 },
  { metro: '대전광역시', name: '대덕구', independence: 25.2, autonomy: 61.5, debt: 420, population: 180000, budget: 6040 },
  { metro: '대전광역시', name: '동구', independence: 22.5, autonomy: 59.2, debt: 380, population: 220000, budget: 7160 },

  // ─── 울산광역시 ───
  { metro: '울산광역시', name: '울주군', independence: 42.5, autonomy: 73.2, debt: 1500, population: 230000, budget: 7440 },
  { metro: '울산광역시', name: '남구', independence: 38.2, autonomy: 70.5, debt: 580, population: 340000, budget: 8980 },
  { metro: '울산광역시', name: '중구', independence: 32.5, autonomy: 65.8, debt: 350, population: 210000, budget: 6880 },
  { metro: '울산광역시', name: '북구', independence: 30.8, autonomy: 64.5, debt: 480, population: 200000, budget: 6600 },
  { metro: '울산광역시', name: '동구', independence: 28.5, autonomy: 63.2, debt: 320, population: 160000, budget: 5480 },

  // ─── 강원특별자치도 ───
  { metro: '강원특별자치도', name: '원주시', independence: 30.2, autonomy: 65.1, debt: 1500, population: 360000, budget: 16400 },
  { metro: '강원특별자치도', name: '춘천시', independence: 28.5, autonomy: 63.8, debt: 1200, population: 285000, budget: 16430 },
  { metro: '강원특별자치도', name: '강릉시', independence: 25.8, autonomy: 62.5, debt: 980, population: 215000, budget: 14418 },
  { metro: '강원특별자치도', name: '속초시', independence: 24.5, autonomy: 61.2, debt: 380, population: 82000, budget: 7350 },
  { metro: '강원특별자치도', name: '동해시', independence: 22.1, autonomy: 59.2, debt: 450, population: 90000, budget: 7950 },
  { metro: '강원특별자치도', name: '삼척시', independence: 16.5, autonomy: 54.2, debt: 420, population: 65000, budget: 6075 },
  { metro: '강원특별자치도', name: '태백시', independence: 15.8, autonomy: 53.5, debt: 320, population: 42000, budget: 5000 },
  { metro: '강원특별자치도', name: '양양군', independence: 15.5, autonomy: 53.2, debt: 200, population: 28000, budget: 4000 },
  { metro: '강원특별자치도', name: '철원군', independence: 15.2, autonomy: 52.8, debt: 260, population: 45000, budget: 5100 },
  { metro: '강원특별자치도', name: '고성군', independence: 14.8, autonomy: 52.5, debt: 220, population: 28000, budget: 4000 },
  { metro: '강원특별자치도', name: '평창군', independence: 14.5, autonomy: 52.1, debt: 350, population: 42000, budget: 4860 },
  { metro: '강원특별자치도', name: '홍천군', independence: 14.2, autonomy: 51.8, debt: 280, population: 68000, budget: 6940 },
  { metro: '강원특별자치도', name: '양구군', independence: 13.8, autonomy: 51.5, debt: 150, population: 22000, budget: 3400 },
  { metro: '강원특별자치도', name: '인제군', independence: 13.5, autonomy: 51.2, debt: 200, population: 32000, budget: 4400 },
  { metro: '강원특별자치도', name: '횡성군', independence: 13.5, autonomy: 51.2, debt: 250, population: 45000, budget: 5100 },
  { metro: '강원특별자치도', name: '정선군', independence: 13.2, autonomy: 50.8, debt: 280, population: 35000, budget: 4700 },
  { metro: '강원특별자치도', name: '영월군', independence: 12.8, autonomy: 50.5, debt: 220, population: 38000, budget: 5000 },
  { metro: '강원특별자치도', name: '화천군', independence: 12.5, autonomy: 50.2, debt: 180, population: 25000, budget: 3700 },

  // ─── 충청북도 ───
  { metro: '충청북도', name: '청주시', independence: 35.2, autonomy: 67.8, debt: 2800, population: 850000, budget: 35048 },
  { metro: '충청북도', name: '충주시', independence: 25.5, autonomy: 62.1, debt: 780, population: 210000, budget: 10400 },
  { metro: '충청북도', name: '진천군', independence: 25.2, autonomy: 61.8, debt: 320, population: 85000, budget: 7100 },
  { metro: '충청북도', name: '제천시', independence: 22.8, autonomy: 59.5, debt: 520, population: 130000, budget: 9300 },
  { metro: '충청북도', name: '음성군', independence: 22.5, autonomy: 59.8, debt: 380, population: 100000, budget: 8000 },
  { metro: '충청북도', name: '증평군', independence: 18.5, autonomy: 55.8, debt: 150, population: 38000, budget: 5000 },
  { metro: '충청북도', name: '단양군', independence: 14.2, autonomy: 52.1, debt: 180, population: 28000, budget: 4000 },
  { metro: '충청북도', name: '옥천군', independence: 12.8, autonomy: 50.5, debt: 210, population: 50000, budget: 5500 },
  { metro: '충청북도', name: '영동군', independence: 11.2, autonomy: 49.1, debt: 180, population: 46000, budget: 5180 },
  { metro: '충청북도', name: '괴산군', independence: 10.8, autonomy: 48.5, debt: 180, population: 35000, budget: 4700 },
  { metro: '충청북도', name: '보은군', independence: 10.5, autonomy: 48.2, debt: 180, population: 32000, budget: 4400 },

  // ─── 충청남도 ───
  { metro: '충청남도', name: '아산시', independence: 40.2, autonomy: 71.5, debt: 1800, population: 340000, budget: 15600 },
  { metro: '충청남도', name: '천안시', independence: 38.5, autonomy: 70.2, debt: 2500, population: 680000, budget: 24300 },
  { metro: '충청남도', name: '당진시', independence: 32.5, autonomy: 66.8, debt: 820, population: 170000, budget: 11700 },
  { metro: '충청남도', name: '서산시', independence: 28.5, autonomy: 63.8, debt: 680, population: 175000, budget: 12000 },
  { metro: '충청남도', name: '계룡시', independence: 22.8, autonomy: 59.5, debt: 120, population: 45000, budget: 5000 },
  { metro: '충청남도', name: '보령시', independence: 18.8, autonomy: 56.2, debt: 380, population: 95000, budget: 8325 },
  { metro: '충청남도', name: '홍성군', independence: 18.5, autonomy: 55.8, debt: 320, population: 90000, budget: 7400 },
  { metro: '충청남도', name: '공주시', independence: 18.2, autonomy: 55.5, debt: 420, population: 105000, budget: 7800 },
  { metro: '충청남도', name: '논산시', independence: 16.5, autonomy: 54.2, debt: 380, population: 115000, budget: 8400 },
  { metro: '충청남도', name: '태안군', independence: 16.2, autonomy: 54.5, debt: 250, population: 62000, budget: 6460 },
  { metro: '충청남도', name: '예산군', independence: 15.8, autonomy: 53.5, debt: 280, population: 78000, budget: 7740 },
  { metro: '충청남도', name: '금산군', independence: 12.8, autonomy: 50.5, debt: 180, population: 50000, budget: 5500 },
  { metro: '충청남도', name: '서천군', independence: 12.2, autonomy: 49.8, debt: 180, population: 50000, budget: 5500 },
  { metro: '충청남도', name: '부여군', independence: 11.5, autonomy: 49.2, debt: 220, population: 62000, budget: 6460 },
  { metro: '충청남도', name: '청양군', independence: 10.2, autonomy: 47.8, debt: 150, population: 30000, budget: 4200 },

  // ─── 전북특별자치도 ───
  { metro: '전북특별자치도', name: '전주시', independence: 30.2, autonomy: 64.5, debt: 1800, population: 650000, budget: 26920 },
  { metro: '전북특별자치도', name: '군산시', independence: 25.5, autonomy: 62.1, debt: 1200, population: 265000, budget: 12600 },
  { metro: '전북특별자치도', name: '익산시', independence: 22.8, autonomy: 59.5, debt: 980, population: 280000, budget: 13200 },
  { metro: '전북특별자치도', name: '완주군', independence: 18.5, autonomy: 55.8, debt: 420, population: 95000, budget: 7700 },
  { metro: '전북특별자치도', name: '정읍시', independence: 14.2, autonomy: 52.1, debt: 380, population: 108000, budget: 7980 },
  { metro: '전북특별자치도', name: '남원시', independence: 12.8, autonomy: 50.5, debt: 320, population: 78000, budget: 7050 },
  { metro: '전북특별자치도', name: '김제시', independence: 12.5, autonomy: 50.2, debt: 280, population: 82000, budget: 7350 },
  { metro: '전북특별자치도', name: '고창군', independence: 12.2, autonomy: 49.8, debt: 220, population: 55000, budget: 5900 },
  { metro: '전북특별자치도', name: '부안군', independence: 12.5, autonomy: 50.2, debt: 200, population: 52000, budget: 5660 },
  { metro: '전북특별자치도', name: '무주군', independence: 10.2, autonomy: 47.8, debt: 180, population: 24000, budget: 3600 },
  { metro: '전북특별자치도', name: '순창군', independence: 9.8, autonomy: 47.5, debt: 140, population: 27000, budget: 3900 },
  { metro: '전북특별자치도', name: '진안군', independence: 9.5, autonomy: 47.2, debt: 150, population: 25000, budget: 3700 },
  { metro: '전북특별자치도', name: '장수군', independence: 9.2, autonomy: 46.8, debt: 120, population: 21000, budget: 3300 },
  { metro: '전북특별자치도', name: '임실군', independence: 8.6, autonomy: 47.8, debt: 160, population: 26000, budget: 3800 },

  // ─── 전남광주통합특별시 (구 전라남도) ───
  { metro: '전남광주통합특별시', name: '광양시', independence: 38.5, autonomy: 70.8, debt: 780, population: 155000, budget: 10800 },
  { metro: '전남광주통합특별시', name: '여수시', independence: 30.8, autonomy: 65.2, debt: 1200, population: 280000, budget: 14825 },
  { metro: '전남광주통합특별시', name: '순천시', independence: 28.2, autonomy: 63.5, debt: 980, population: 285000, budget: 15669 },
  { metro: '전남광주통합특별시', name: '목포시', independence: 22.5, autonomy: 59.8, debt: 680, population: 220000, budget: 10800 },
  { metro: '전남광주통합특별시', name: '나주시', independence: 18.5, autonomy: 56.2, debt: 520, population: 115000, budget: 8400 },
  { metro: '전남광주통합특별시', name: '무안군', independence: 15.8, autonomy: 53.5, debt: 280, population: 90000, budget: 7400 },
  { metro: '전남광주통합특별시', name: '영암군', independence: 14.2, autonomy: 52.1, debt: 220, population: 55000, budget: 5900 },
  { metro: '전남광주통합특별시', name: '화순군', independence: 12.5, autonomy: 50.2, debt: 220, population: 63000, budget: 6540 },
  { metro: '전남광주통합특별시', name: '영광군', independence: 12.2, autonomy: 49.8, debt: 200, population: 52000, budget: 5660 },
  { metro: '전남광주통합특별시', name: '장성군', independence: 11.5, autonomy: 49.2, debt: 180, population: 43000, budget: 4940 },
  { metro: '전남광주통합특별시', name: '해남군', independence: 10.8, autonomy: 48.5, debt: 240, population: 68000, budget: 6940 },
  { metro: '전남광주통합특별시', name: '구례군', independence: 10.8, autonomy: 48.5, debt: 150, population: 25000, budget: 3700 },
  { metro: '전남광주통합특별시', name: '담양군', independence: 10.2, autonomy: 47.8, debt: 180, population: 46000, budget: 5180 },
  { metro: '전남광주통합특별시', name: '함평군', independence: 9.8, autonomy: 47.5, debt: 150, population: 32000, budget: 4400 },
  { metro: '전남광주통합특별시', name: '장흥군', independence: 9.5, autonomy: 47.2, debt: 160, population: 35000, budget: 4700 },
  { metro: '전남광주통합특별시', name: '곡성군', independence: 9.5, autonomy: 47.2, debt: 130, population: 27000, budget: 3900 },
  { metro: '전남광주통합특별시', name: '보성군', independence: 9.2, autonomy: 46.8, debt: 170, population: 38000, budget: 5000 },
  { metro: '전남광주통합특별시', name: '진도군', independence: 9.2, autonomy: 46.8, debt: 150, population: 30000, budget: 4200 },
  { metro: '전남광주통합특별시', name: '강진군', independence: 8.9, autonomy: 48.1, debt: 190, population: 32000, budget: 4400 },
  { metro: '전남광주통합특별시', name: '고흥군', independence: 8.8, autonomy: 46.5, debt: 200, population: 60000, budget: 6300 },
  { metro: '전남광주통합특별시', name: '신안군', independence: 8.4, autonomy: 47.5, debt: 150, population: 38000, budget: 5000 },
  { metro: '전남광주통합특별시', name: '완도군', independence: 7.2, autonomy: 45.8, debt: 220, population: 47000, budget: 5260 },

  // ─── 경상북도 ───
  { metro: '경상북도', name: '구미시', independence: 35.8, autonomy: 68.5, debt: 1500, population: 410000, budget: 17745 },
  { metro: '경상북도', name: '포항시', independence: 32.5, autonomy: 66.2, debt: 1800, population: 500000, budget: 28900 },
  { metro: '경상북도', name: '경산시', independence: 30.5, autonomy: 64.8, debt: 1200, population: 280000, budget: 13200 },
  { metro: '경상북도', name: '경주시', independence: 25.8, autonomy: 62.5, debt: 1200, population: 255000, budget: 12200 },
  { metro: '경상북도', name: '칠곡군', independence: 25.2, autonomy: 61.8, debt: 420, population: 115000, budget: 8900 },
  { metro: '경상북도', name: '김천시', independence: 20.5, autonomy: 57.8, debt: 520, population: 140000, budget: 9900 },
  { metro: '경상북도', name: '영천시', independence: 18.8, autonomy: 56.2, debt: 420, population: 98000, budget: 8550 },
  { metro: '경상북도', name: '안동시', independence: 18.2, autonomy: 55.5, debt: 680, population: 155000, budget: 10800 },
  { metro: '경상북도', name: '영주시', independence: 16.5, autonomy: 54.2, debt: 380, population: 102000, budget: 7620 },
  { metro: '경상북도', name: '문경시', independence: 15.2, autonomy: 52.8, debt: 280, population: 70000, budget: 6450 },
  { metro: '경상북도', name: '고령군', independence: 14.8, autonomy: 52.5, debt: 200, population: 33000, budget: 4500 },
  { metro: '경상북도', name: '상주시', independence: 14.5, autonomy: 52.1, debt: 320, population: 96000, budget: 8400 },
  { metro: '경상북도', name: '울진군', independence: 14.2, autonomy: 52.1, debt: 220, population: 48000, budget: 5340 },
  { metro: '경상북도', name: '예천군', independence: 12.8, autonomy: 50.5, debt: 180, population: 55000, budget: 5900 },
  { metro: '경상북도', name: '성주군', independence: 12.5, autonomy: 50.2, debt: 160, population: 43000, budget: 4940 },
  { metro: '경상북도', name: '청도군', independence: 11.2, autonomy: 49.1, debt: 180, population: 42000, budget: 4860 },
  { metro: '경상북도', name: '영덕군', independence: 10.5, autonomy: 48.2, debt: 160, population: 35000, budget: 4700 },
  { metro: '경상북도', name: '울릉군', independence: 10.5, autonomy: 48.2, debt: 80, population: 9000, budget: 3000 },
  { metro: '경상북도', name: '의성군', independence: 9.8, autonomy: 47.5, debt: 180, population: 50000, budget: 5500 },
  { metro: '경상북도', name: '청송군', independence: 8.8, autonomy: 46.5, debt: 130, population: 25000, budget: 3700 },
  { metro: '경상북도', name: '영양군', independence: 8.2, autonomy: 45.8, debt: 100, population: 16000, budget: 3000 },
  { metro: '경상북도', name: '봉화군', independence: 7.5, autonomy: 46.2, debt: 180, population: 30000, budget: 4200 },

  // ─── 경상남도 ───
  { metro: '경상남도', name: '창원시', independence: 40.2, autonomy: 72.5, debt: 3500, population: 1040000, budget: 37717 },
  { metro: '경상남도', name: '김해시', independence: 35.2, autonomy: 67.8, debt: 1800, population: 540000, budget: 22887 },
  { metro: '경상남도', name: '양산시', independence: 32.8, autonomy: 66.5, debt: 1200, population: 370000, budget: 16965 },
  { metro: '경상남도', name: '거제시', independence: 28.5, autonomy: 63.2, debt: 1500, population: 235000, budget: 11400 },
  { metro: '경상남도', name: '진주시', independence: 25.8, autonomy: 62.5, debt: 1200, population: 350000, budget: 18051 },
  { metro: '경상남도', name: '사천시', independence: 22.8, autonomy: 59.5, debt: 420, population: 110000, budget: 8100 },
  { metro: '경상남도', name: '통영시', independence: 20.5, autonomy: 57.8, debt: 580, population: 125000, budget: 9000 },
  { metro: '경상남도', name: '밀양시', independence: 15.8, autonomy: 53.5, debt: 380, population: 105000, budget: 7800 },
  { metro: '경상남도', name: '함안군', independence: 15.2, autonomy: 52.8, debt: 220, population: 65000, budget: 6700 },
  { metro: '경상남도', name: '창녕군', independence: 14.5, autonomy: 52.1, debt: 200, population: 60000, budget: 6300 },
  { metro: '경상남도', name: '고성군', independence: 13.8, autonomy: 51.5, debt: 180, population: 50000, budget: 5500 },
  { metro: '경상남도', name: '거창군', independence: 13.5, autonomy: 51.2, debt: 220, population: 62000, budget: 6460 },
  { metro: '경상남도', name: '남해군', independence: 12.2, autonomy: 49.8, debt: 160, population: 42000, budget: 4860 },
  { metro: '경상남도', name: '하동군', independence: 11.5, autonomy: 49.2, debt: 180, population: 45000, budget: 5100 },
  { metro: '경상남도', name: '함양군', independence: 10.8, autonomy: 48.5, debt: 170, population: 38000, budget: 5000 },
  { metro: '경상남도', name: '합천군', independence: 10.5, autonomy: 48.2, debt: 180, population: 43000, budget: 4940 },
  { metro: '경상남도', name: '산청군', independence: 10.2, autonomy: 47.8, debt: 150, population: 33000, budget: 4500 },
  { metro: '경상남도', name: '의령군', independence: 9.5, autonomy: 47.2, debt: 150, population: 26000, budget: 3800 },

  // ─── 제주특별자치도 ───
  { metro: '제주특별자치도', name: '제주시', independence: 32.5, autonomy: 66.8, debt: 1800, population: 490000, budget: 25000 },
  { metro: '제주특별자치도', name: '서귀포시', independence: 22.8, autonomy: 59.5, debt: 680, population: 190000, budget: 12000 },
];

// ============================================================
// 국가채무비율 연도별 데이터 (GDP 대비, D1 기준)
// 출처: e-나라지표, 기획재정부 국가채무관리계획
// ============================================================

const NATIONAL_DEBT_HISTORY: NationalDebtHistoryEntry[] = [
  { year: 2013, debt: 480.3, gdp: 1429.4, ratio: 33.6 },
  { year: 2014, debt: 533.2, gdp: 1486.1, ratio: 35.9 },
  { year: 2015, debt: 591.5, gdp: 1564.1, ratio: 37.8 },
  { year: 2016, debt: 627.1, gdp: 1641.8, ratio: 38.2 },
  { year: 2017, debt: 660.2, gdp: 1730.4, ratio: 38.2 },
  { year: 2018, debt: 680.5, gdp: 1839.3, ratio: 37.0 },
  { year: 2019, debt: 723.2, gdp: 1919.0, ratio: 37.7 },
  { year: 2020, debt: 846.6, gdp: 1940.7, ratio: 43.6 },
  { year: 2021, debt: 967.2, gdp: 2071.7, ratio: 46.7 },
  { year: 2022, debt: 1076.4, gdp: 2161.8, ratio: 49.8 },
  { year: 2023, debt: 1101.6, gdp: 2236.4, ratio: 49.3 },
  { year: 2024, debt: 1127.0, gdp: 2448.0, ratio: 46.1 },
  { year: 2025, debt: 1277.0, gdp: 2643.9, ratio: 48.3 },
];

// ============================================================
// 광역시도별 연도별 채무/예산 비율 데이터
// 출처: 지역재정365, 행정안전부
// ============================================================

const METRO_DEBT_HISTORY: Record<string, MetroDebtHistoryEntry[]> = {
  '서울특별시': [
    { year: 2018, debt: 12800, budget: 385000, ratio: 3.3 },
    { year: 2019, debt: 12200, budget: 400000, ratio: 3.1 },
    { year: 2020, debt: 11800, budget: 425000, ratio: 2.8 },
    { year: 2021, debt: 11400, budget: 440000, ratio: 2.6 },
    { year: 2022, debt: 11200, budget: 450000, ratio: 2.5 },
    { year: 2023, debt: 11400, budget: 458000, ratio: 2.5 },
    { year: 2024, debt: 11544, budget: 464000, ratio: 2.5 },
    { year: 2025, debt: 11800, budget: 475000, ratio: 2.5 },
  ],
  '부산광역시': [
    { year: 2018, debt: 22000, budget: 160000, ratio: 13.8 },
    { year: 2019, debt: 24000, budget: 168000, ratio: 14.3 },
    { year: 2020, debt: 26500, budget: 178000, ratio: 14.9 },
    { year: 2021, debt: 28200, budget: 185000, ratio: 15.2 },
    { year: 2022, debt: 29800, budget: 188000, ratio: 15.9 },
    { year: 2023, debt: 30900, budget: 192000, ratio: 16.1 },
    { year: 2024, debt: 31586, budget: 195000, ratio: 16.2 },
    { year: 2025, debt: 32800, budget: 200000, ratio: 16.4 },
  ],
  '대구광역시': [
    { year: 2018, debt: 12500, budget: 115000, ratio: 10.9 },
    { year: 2019, debt: 13800, budget: 120000, ratio: 11.5 },
    { year: 2020, debt: 15200, budget: 128000, ratio: 11.9 },
    { year: 2021, debt: 16500, budget: 132000, ratio: 12.5 },
    { year: 2022, debt: 17200, budget: 135000, ratio: 12.7 },
    { year: 2023, debt: 17900, budget: 138000, ratio: 13.0 },
    { year: 2024, debt: 18500, budget: 140000, ratio: 13.2 },
    { year: 2025, debt: 19200, budget: 144000, ratio: 13.3 },
  ],
  '인천광역시': [
    { year: 2018, debt: 18500, budget: 138000, ratio: 13.4 },
    { year: 2019, debt: 19200, budget: 145000, ratio: 13.2 },
    { year: 2020, debt: 20000, budget: 152000, ratio: 13.2 },
    { year: 2021, debt: 20800, budget: 158000, ratio: 13.2 },
    { year: 2022, debt: 21200, budget: 162000, ratio: 13.1 },
    { year: 2023, debt: 21600, budget: 165000, ratio: 13.1 },
    { year: 2024, debt: 22000, budget: 168000, ratio: 13.1 },
    { year: 2025, debt: 22800, budget: 173000, ratio: 13.2 },
  ],
  '광주광역시': [
    { year: 2018, debt: 8800, budget: 78000, ratio: 11.3 },
    { year: 2019, debt: 9500, budget: 82000, ratio: 11.6 },
    { year: 2020, debt: 10500, budget: 88000, ratio: 11.9 },
    { year: 2021, debt: 11200, budget: 92000, ratio: 12.2 },
    { year: 2022, debt: 11800, budget: 94000, ratio: 12.6 },
    { year: 2023, debt: 12300, budget: 96000, ratio: 12.8 },
    { year: 2024, debt: 12800, budget: 98000, ratio: 13.1 },
    { year: 2025, debt: 13300, budget: 101000, ratio: 13.2 },
  ],
  '대전광역시': [
    { year: 2018, debt: 7200, budget: 72000, ratio: 10.0 },
    { year: 2019, debt: 8000, budget: 75000, ratio: 10.7 },
    { year: 2020, debt: 8800, budget: 80000, ratio: 11.0 },
    { year: 2021, debt: 9500, budget: 83000, ratio: 11.4 },
    { year: 2022, debt: 10200, budget: 85000, ratio: 12.0 },
    { year: 2023, debt: 10700, budget: 87000, ratio: 12.3 },
    { year: 2024, debt: 11200, budget: 89000, ratio: 12.6 },
    { year: 2025, debt: 11700, budget: 92000, ratio: 12.7 },
  ],
  '울산광역시': [
    { year: 2018, debt: 5800, budget: 58000, ratio: 10.0 },
    { year: 2019, debt: 6200, budget: 60000, ratio: 10.3 },
    { year: 2020, debt: 6800, budget: 63000, ratio: 10.8 },
    { year: 2021, debt: 7200, budget: 65000, ratio: 11.1 },
    { year: 2022, debt: 7700, budget: 68000, ratio: 11.3 },
    { year: 2023, debt: 8100, budget: 70000, ratio: 11.6 },
    { year: 2024, debt: 8500, budget: 72000, ratio: 11.8 },
    { year: 2025, debt: 8900, budget: 74000, ratio: 12.0 },
  ],
  '세종특별자치시': [
    { year: 2018, debt: 2200, budget: 20000, ratio: 11.0 },
    { year: 2019, debt: 2800, budget: 23000, ratio: 12.2 },
    { year: 2020, debt: 3500, budget: 27000, ratio: 13.0 },
    { year: 2021, debt: 4000, budget: 30000, ratio: 13.3 },
    { year: 2022, debt: 4500, budget: 32000, ratio: 14.1 },
    { year: 2023, debt: 4800, budget: 33500, ratio: 14.3 },
    { year: 2024, debt: 5200, budget: 35000, ratio: 14.9 },
    { year: 2025, debt: 5600, budget: 37000, ratio: 15.1 },
  ],
  '경기도': [
    { year: 2018, debt: 32000, budget: 520000, ratio: 6.2 },
    { year: 2019, debt: 35000, budget: 550000, ratio: 6.4 },
    { year: 2020, debt: 38500, budget: 580000, ratio: 6.6 },
    { year: 2021, debt: 42000, budget: 610000, ratio: 6.9 },
    { year: 2022, debt: 45000, budget: 630000, ratio: 7.1 },
    { year: 2023, debt: 47500, budget: 640000, ratio: 7.4 },
    { year: 2024, debt: 49847, budget: 650000, ratio: 7.7 },
    { year: 2025, debt: 52000, budget: 670000, ratio: 7.8 },
  ],
  '강원특별자치도': [
    { year: 2018, debt: 9500, budget: 88000, ratio: 10.8 },
    { year: 2019, debt: 10500, budget: 92000, ratio: 11.4 },
    { year: 2020, debt: 11800, budget: 98000, ratio: 12.0 },
    { year: 2021, debt: 12800, budget: 102000, ratio: 12.5 },
    { year: 2022, debt: 13600, budget: 108000, ratio: 12.6 },
    { year: 2023, debt: 14400, budget: 112000, ratio: 12.9 },
    { year: 2024, debt: 15200, budget: 115000, ratio: 13.2 },
    { year: 2025, debt: 15900, budget: 119000, ratio: 13.4 },
  ],
  '충청북도': [
    { year: 2018, debt: 8200, budget: 78000, ratio: 10.5 },
    { year: 2019, debt: 9000, budget: 82000, ratio: 11.0 },
    { year: 2020, debt: 9800, budget: 86000, ratio: 11.4 },
    { year: 2021, debt: 10500, budget: 90000, ratio: 11.7 },
    { year: 2022, debt: 11200, budget: 93000, ratio: 12.0 },
    { year: 2023, debt: 11800, budget: 95000, ratio: 12.4 },
    { year: 2024, debt: 12400, budget: 98000, ratio: 12.7 },
    { year: 2025, debt: 13000, budget: 101000, ratio: 12.9 },
  ],
  '충청남도': [
    { year: 2018, debt: 9800, budget: 100000, ratio: 9.8 },
    { year: 2019, debt: 10500, budget: 105000, ratio: 10.0 },
    { year: 2020, debt: 11500, budget: 110000, ratio: 10.5 },
    { year: 2021, debt: 12300, budget: 115000, ratio: 10.7 },
    { year: 2022, debt: 13200, budget: 118000, ratio: 11.2 },
    { year: 2023, debt: 13900, budget: 122000, ratio: 11.4 },
    { year: 2024, debt: 14600, budget: 125000, ratio: 11.7 },
    { year: 2025, debt: 15200, budget: 129000, ratio: 11.8 },
  ],
  '전북특별자치도': [
    { year: 2018, debt: 7500, budget: 88000, ratio: 8.5 },
    { year: 2019, debt: 8200, budget: 92000, ratio: 8.9 },
    { year: 2020, debt: 9000, budget: 97000, ratio: 9.3 },
    { year: 2021, debt: 9800, budget: 102000, ratio: 9.6 },
    { year: 2022, debt: 10500, budget: 106000, ratio: 9.9 },
    { year: 2023, debt: 11200, budget: 109000, ratio: 10.3 },
    { year: 2024, debt: 11800, budget: 112000, ratio: 10.5 },
    { year: 2025, debt: 12300, budget: 116000, ratio: 10.6 },
  ],
  '전라남도': [
    { year: 2018, debt: 8500, budget: 96000, ratio: 8.9 },
    { year: 2019, debt: 9200, budget: 100000, ratio: 9.2 },
    { year: 2020, debt: 10200, budget: 106000, ratio: 9.6 },
    { year: 2021, debt: 11000, budget: 110000, ratio: 10.0 },
    { year: 2022, debt: 11800, budget: 114000, ratio: 10.4 },
    { year: 2023, debt: 12500, budget: 117000, ratio: 10.7 },
    { year: 2024, debt: 13200, budget: 120000, ratio: 11.0 },
    { year: 2025, debt: 13800, budget: 124000, ratio: 11.1 },
  ],
  '경상북도': [
    { year: 2018, debt: 12000, budget: 128000, ratio: 9.4 },
    { year: 2019, debt: 13000, budget: 135000, ratio: 9.6 },
    { year: 2020, debt: 14200, budget: 140000, ratio: 10.1 },
    { year: 2021, debt: 15200, budget: 145000, ratio: 10.5 },
    { year: 2022, debt: 16000, budget: 148000, ratio: 10.8 },
    { year: 2023, debt: 16900, budget: 152000, ratio: 11.1 },
    { year: 2024, debt: 17800, budget: 155000, ratio: 11.5 },
    { year: 2025, debt: 18500, budget: 160000, ratio: 11.6 },
  ],
  '경상남도': [
    { year: 2018, debt: 15000, budget: 148000, ratio: 10.1 },
    { year: 2019, debt: 16200, budget: 155000, ratio: 10.5 },
    { year: 2020, debt: 17500, budget: 162000, ratio: 10.8 },
    { year: 2021, debt: 18800, budget: 168000, ratio: 11.2 },
    { year: 2022, debt: 19800, budget: 172000, ratio: 11.5 },
    { year: 2023, debt: 20700, budget: 176000, ratio: 11.8 },
    { year: 2024, debt: 21500, budget: 180000, ratio: 11.9 },
    { year: 2025, debt: 22200, budget: 185000, ratio: 12.0 },
  ],
  '제주특별자치도': [
    { year: 2018, debt: 4200, budget: 40000, ratio: 10.5 },
    { year: 2019, debt: 4800, budget: 43000, ratio: 11.2 },
    { year: 2020, debt: 5500, budget: 46000, ratio: 12.0 },
    { year: 2021, debt: 6200, budget: 48000, ratio: 12.9 },
    { year: 2022, debt: 6700, budget: 50000, ratio: 13.4 },
    { year: 2023, debt: 7100, budget: 52000, ratio: 13.7 },
    { year: 2024, debt: 7500, budget: 55000, ratio: 13.6 },
    { year: 2025, debt: 7900, budget: 57000, ratio: 13.9 },
  ],
};

// ============================================================
// 전년도 광역 데이터 (2024 기준, 증감률 비교용)
// ============================================================

// 전년(2024 당초예산) 기준 데이터 — 증감률 비교용
export const METRO_PREV_YEAR: Record<string, { independence: number; autonomy: number; debt: number }> = {
  '서울특별시': { independence: 73.62, autonomy: 74.67, debt: 11544 },
  '부산광역시': { independence: 42.73, autonomy: 55.53, debt: 31586 },
  '대구광역시': { independence: 41.91, autonomy: 59.95, debt: 17500 },
  '인천광역시': { independence: 49.17, autonomy: 60.33, debt: 22000 },
  '광주광역시': { independence: 39.75, autonomy: 58.30, debt: 12800 },
  '대전광역시': { independence: 41.06, autonomy: 59.80, debt: 11200 },
  '울산광역시': { independence: 46.07, autonomy: 66.16, debt: 8500 },
  '세종특별자치시': { independence: 54.30, autonomy: 62.33, debt: 5200 },
  '경기도': { independence: 55.72, autonomy: 63.17, debt: 49847 },
  '강원특별자치도': { independence: 25.72, autonomy: 70.60, debt: 15200 },
  '충청북도': { independence: 31.83, autonomy: 64.60, debt: 12400 },
  '충청남도': { independence: 32.22, autonomy: 63.74, debt: 14600 },
  '전북특별자치도': { independence: 23.64, autonomy: 61.87, debt: 11800 },
  '전라남도': { independence: 23.66, autonomy: 64.80, debt: 13200 },
  '경상북도': { independence: 24.35, autonomy: 65.56, debt: 17800 },
  '경상남도': { independence: 34.30, autonomy: 65.85, debt: 21500 },
  '제주특별자치도': { independence: 33.07, autonomy: 64.39, debt: 7500 },
};

// ============================================================
// 재정건전성 점수 (100점 만점)
// ============================================================

export interface FiscalHealthScore {
  total: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    independence: number;
    autonomy: number;
    debtRatio: number;
    debtPerCapita: number;
  };
}

export function calculateFiscalHealthScore(metro: MetroFiscalData): FiscalHealthScore {
  const indScore = Math.min(30, Math.round((metro.independence / 80) * 30));
  const autScore = Math.min(25, Math.round((metro.autonomy / 80) * 25));
  const debtBudgetRatio = (metro.debt / metro.budget) * 100;
  const drScore = Math.max(0, Math.min(25, Math.round(25 - (debtBudgetRatio / 20) * 25)));
  const perCapitaManWon = (metro.debt * 100000000) / metro.population / 10000;
  const pcScore = Math.max(0, Math.min(20, Math.round(20 - (perCapitaManWon / 200) * 20)));
  const total = indScore + autScore + drScore + pcScore;
  let grade: FiscalHealthScore['grade'];
  if (total >= 80) grade = 'A';
  else if (total >= 65) grade = 'B';
  else if (total >= 50) grade = 'C';
  else if (total >= 35) grade = 'D';
  else grade = 'F';
  return {
    total,
    grade,
    breakdown: { independence: indScore, autonomy: autScore, debtRatio: drScore, debtPerCapita: pcScore },
  };
}

/** 시군구용 건전성 점수 (4지표: 광역과 동일 산출 방식) */
export function calculateDistrictHealthScore(district: DistrictFiscalData): FiscalHealthScore {
  // 재정자립도 (0~30)
  const indScore = Math.min(30, Math.round((district.independence / 80) * 30));
  // 재정자주도 (0~25)
  const autScore = Math.min(25, Math.round((district.autonomy / 80) * 25));
  // 채무비율: 채무/예산 (0~25): 낮을수록 좋음
  const debtBudgetRatio = (district.debt / district.budget) * 100;
  const drScore = Math.max(0, Math.min(25, Math.round(25 - (debtBudgetRatio / 20) * 25)));
  // 1인당 채무 (0~20): 낮을수록 좋음
  const perCapitaManWon = (district.debt * 100000000) / district.population / 10000;
  const pcScore = Math.max(0, Math.min(20, Math.round(20 - (perCapitaManWon / 200) * 20)));
  const total = indScore + autScore + drScore + pcScore;
  let grade: FiscalHealthScore['grade'];
  if (total >= 80) grade = 'A';
  else if (total >= 65) grade = 'B';
  else if (total >= 50) grade = 'C';
  else if (total >= 35) grade = 'D';
  else grade = 'F';
  return {
    total,
    grade,
    breakdown: { independence: indScore, autonomy: autScore, debtRatio: drScore, debtPerCapita: pcScore },
  };
}

export function gradeColor(grade: FiscalHealthScore['grade']): string {
  switch (grade) {
    case 'A': return 'text-emerald-400';
    case 'B': return 'text-blue-400';
    case 'C': return 'text-amber-400';
    case 'D': return 'text-orange-400';
    case 'F': return 'text-red-400';
  }
}

export function gradeBgColor(grade: FiscalHealthScore['grade']): string {
  switch (grade) {
    case 'A': return 'bg-emerald-500';
    case 'B': return 'bg-blue-500';
    case 'C': return 'bg-amber-500';
    case 'D': return 'bg-orange-500';
    case 'F': return 'bg-red-500';
  }
}

export function gradeEmoji(grade: FiscalHealthScore['grade']): string {
  switch (grade) {
    case 'A': return '🟢';
    case 'B': return '🔵';
    case 'C': return '🟡';
    case 'D': return '🟠';
    case 'F': return '🔴';
  }
}

// ============================================================
// 인구 규모별 분류 (Peer Benchmarking)
// ============================================================

export type PopulationGroup = 'mega' | 'large' | 'medium' | 'small';

export function getPopulationGroup(population: number): PopulationGroup {
  if (population >= 5000000) return 'mega';
  if (population >= 2000000) return 'large';
  if (population >= 1000000) return 'medium';
  return 'small';
}

export function getPopulationGroupLabel(group: PopulationGroup): string {
  switch (group) {
    case 'mega': return '메가시티 (500만+)';
    case 'large': return '대규모 (200만~500만)';
    case 'medium': return '중규모 (100만~200만)';
    case 'small': return '소규모 (~100만)';
  }
}

export function getPeerGroupMetros(): Record<PopulationGroup, MetroFiscalData[]> {
  const metros = [...METRO_FISCAL_DATA].sort((a, b) => b.independence - a.independence);
  const groups: Record<PopulationGroup, MetroFiscalData[]> = { mega: [], large: [], medium: [], small: [] };
  metros.forEach((m) => { groups[getPopulationGroup(m.population)].push(m); });
  return groups;
}

export function getPeerGroupStats(group: MetroFiscalData[]): {
  avgIndependence: number;
  avgAutonomy: number;
  avgDebtPerCapita: number;
  totalPop: number;
} {
  if (group.length === 0) return { avgIndependence: 0, avgAutonomy: 0, avgDebtPerCapita: 0, totalPop: 0 };
  const totalPop = group.reduce((s, m) => s + m.population, 0);
  const avgInd = group.reduce((s, m) => s + m.independence, 0) / group.length;
  const avgAut = group.reduce((s, m) => s + m.autonomy, 0) / group.length;
  const totalDebt = group.reduce((s, m) => s + m.debt, 0);
  const avgDpc = (totalDebt * 100000000 / totalPop) / 10000;
  return { avgIndependence: avgInd, avgAutonomy: avgAut, avgDebtPerCapita: avgDpc, totalPop };
}

// ============================================================
// 세금 100원 스토리텔링
// ============================================================

export interface TaxBreakdown {
  category: string;
  amount: number;
  color: string;
  emoji: string;
  description: string;
}

export function getTaxStoryBreakdown(): TaxBreakdown[] {
  return [
    { category: '사회복지', amount: 35, color: '#f87171', emoji: '🏥', description: '기초연금, 아동수당, 장애인 지원 등' },
    { category: '교육', amount: 18, color: '#60a5fa', emoji: '📚', description: '학교 운영, 교육환경 개선, 급식비' },
    { category: '국토·교통', amount: 13, color: '#34d399', emoji: '🛣️', description: '도로, 철도, 주택 건설 및 유지' },
    { category: '일반행정', amount: 10, color: '#a78bfa', emoji: '🏛️', description: '공무원 인건비, 청사 관리' },
    { category: '산업·경제', amount: 8, color: '#fbbf24', emoji: '🏭', description: '중소기업 지원, 일자리 창출' },
    { category: '문화·체육', amount: 5, color: '#f472b6', emoji: '🎭', description: '도서관, 체육시설, 축제 지원' },
    { category: '환경', amount: 4, color: '#2dd4bf', emoji: '🌿', description: '쓰레기 처리, 하수도, 공원 관리' },
    { category: '소방·안전', amount: 4, color: '#fb923c', emoji: '🚒', description: '소방서, 재난 대비, 안전 시설' },
    { category: '채무상환', amount: 3, color: '#94a3b8', emoji: '💳', description: '지역채무 이자 및 원금 상환' },
  ];
}

/** 자치구별 세금 ₩100 배분 추정 (재정자립도·채무비율 기반) */
export function getDistrictTaxBreakdown(district: DistrictFiscalData): TaxBreakdown[] {
  const debtRatio = district.budget > 0 ? (district.debt / district.budget) * 100 : 0;
  const indep = district.independence;

  // 채무상환: 채무비율에 비례 (기본 3, 최대 15)
  const debtRepay = Math.min(15, Math.round(3 + debtRatio * 0.5));
  // 사회복지: 재정자립도 낮을수록 복지비중 높음 (기본 35, 범위 28~42)
  const welfare = Math.round(35 + (50 - indep) * 0.14);
  const welfareClamped = Math.max(28, Math.min(42, welfare));
  // 교육: 상대적 안정 (범위 15~20)
  const edu = Math.round(18 - (50 - indep) * 0.04);
  const eduClamped = Math.max(15, Math.min(20, edu));

  const fixed = welfareClamped + eduClamped + debtRepay;
  const remaining = 100 - fixed;

  // 나머지를 비례 배분 (국토교통 13, 일반행정 10, 산업경제 8, 문화체육 5, 환경 4, 소방안전 4 = 44)
  const ratio = remaining / 44;
  const infra = Math.round(13 * ratio);
  const admin = Math.round(10 * ratio);
  const industry = Math.round(8 * ratio);
  const culture = Math.round(5 * ratio);
  const envir = Math.round(4 * ratio);
  const fire = 100 - welfareClamped - eduClamped - debtRepay - infra - admin - industry - culture - envir;

  return [
    { category: '사회복지', amount: welfareClamped, color: '#f87171', emoji: '🏥', description: '기초연금, 아동수당, 장애인 지원 등' },
    { category: '교육', amount: eduClamped, color: '#60a5fa', emoji: '📚', description: '학교 운영, 교육환경 개선, 급식비' },
    { category: '국토·교통', amount: infra, color: '#34d399', emoji: '🛣️', description: '도로, 철도, 주택 건설 및 유지' },
    { category: '일반행정', amount: admin, color: '#a78bfa', emoji: '🏛️', description: '공무원 인건비, 청사 관리' },
    { category: '산업·경제', amount: industry, color: '#fbbf24', emoji: '🏭', description: '중소기업 지원, 일자리 창출' },
    { category: '문화·체육', amount: culture, color: '#f472b6', emoji: '🎭', description: '도서관, 체육시설, 축제 지원' },
    { category: '환경', amount: envir, color: '#2dd4bf', emoji: '🌿', description: '쓰레기 처리, 하수도, 공원 관리' },
    { category: '소방·안전', amount: Math.max(1, fire), color: '#fb923c', emoji: '🚒', description: '소방서, 재난 대비, 안전 시설' },
    { category: '채무상환', amount: debtRepay, color: '#94a3b8', emoji: '💳', description: '지역채무 이자 및 원금 상환' },
  ];
}

// ============================================================
// 증감률 계산 헬퍼
// ============================================================

export function getChangeRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

// ============================================================
// Helper functions
// ============================================================

/** 시군구 세입·세출 추정 (예산규모 및 재정자립도 기반) */
export function getDistrictRevenueExpenditure(district: DistrictFiscalData): { revenue: number; expenditure: number } {
  // 세입: 예산 대비 102~108% (재정자립도 낮을수록 이전재원 비중↑ → 세입/예산 비율↑)
  const revenueFactor = 1.02 + (1 - district.independence / 100) * 0.06;
  const revenue = Math.round(district.budget * revenueFactor);
  // 세출: 집행률 88~96% (재정자립도 높을수록 집행률↑)
  const executionRate = 0.88 + (district.independence / 100) * 0.08;
  const expenditure = Math.round(district.budget * executionRate);
  return { revenue, expenditure };
}

/** 전체 광역시도 데이터를 재정자립도 내림차순으로 반환 */
export function getMetroFiscalData(): MetroFiscalData[] {
  return [...METRO_FISCAL_DATA].sort((a, b) => b.independence - a.independence);
}

/** 특정 광역시도의 시군구 데이터를 재정자립도 내림차순으로 반환 */
export function getDistrictFiscalData(metroName: string): DistrictFiscalData[] {
  return DISTRICT_FISCAL_DATA
    .filter((d) => d.metro === metroName)
    .sort((a, b) => b.independence - a.independence);
}

/** 전체 시군구 데이터를 재정자립도 내림차순으로 반환 */
export function getAllDistrictFiscalData(): DistrictFiscalData[] {
  return [...DISTRICT_FISCAL_DATA].sort((a, b) => b.independence - a.independence);
}

/** 상위 N개, 하위 N개 시군구 반환 */
export function getTopBottomDistricts(n: number): {
  top: DistrictFiscalData[];
  bottom: DistrictFiscalData[];
} {
  const sorted = getAllDistrictFiscalData();
  return {
    top: sorted.slice(0, n),
    bottom: sorted.slice(-n).reverse(),
  };
}

/** 전국 평균 재정 지표 반환 */
export function getNationalAverage(): {
  independence: number;
  autonomy: number;
  totalDebt: number;
} {
  return {
    independence: 43.18,
    autonomy: 64.87,
    totalDebt: 380000, // 억원 (~38조원)
  };
}

/** 광역시도 이름 목록 (중복 제거) */
export function getMetroNames(): string[] {
  const names = new Set(DISTRICT_FISCAL_DATA.map((d) => d.metro));
  // 광역시도 데이터에 있는 모든 이름도 추가
  METRO_FISCAL_DATA.forEach((m) => names.add(m.name));
  return Array.from(names).sort();
}

/** 국가채무비율 연도별 데이터 반환 */
export function getNationalDebtHistory(): NationalDebtHistoryEntry[] {
  return [...NATIONAL_DEBT_HISTORY];
}

/** 특정 광역시도의 연도별 채무/예산 비율 데이터 반환 */
export function getMetroDebtHistory(metroName: string): MetroDebtHistoryEntry[] {
  return METRO_DEBT_HISTORY[metroName] ?? [];
}

/** 전체 광역시도의 연도별 채무/예산 비율 데이터 반환 */
export function getAllMetroDebtHistory(): Record<string, MetroDebtHistoryEntry[]> {
  return { ...METRO_DEBT_HISTORY };
}

/**
 * 시군구 추정 채무비율 추이 생성
 * 광역시도의 실제 채무비율 변동 패턴을 시군구에 적용하여 추정
 */
export function generateDistrictDebtHistory(
  district: DistrictFiscalData,
): DistrictDebtHistoryEntry[] {
  const metroHistory = METRO_DEBT_HISTORY[district.metro];
  if (!metroHistory || metroHistory.length < 2) return [];

  const latestMetro = metroHistory[metroHistory.length - 1];
  const anchorRatio = latestMetro.ratio;
  const anchorDebt = district.debt;
  const metroLatestDebt = latestMetro.debt;

  return metroHistory.map((entry) => {
    const metroDebtFactor = entry.debt / metroLatestDebt;
    const estimatedDebt = Math.round(anchorDebt * metroDebtFactor);
    const ratioDelta = entry.ratio - anchorRatio;
    const estimatedRatio = Math.max(0, anchorRatio + ratioDelta);

    return {
      year: entry.year,
      debt: estimatedDebt,
      ratio: parseFloat(estimatedRatio.toFixed(1)),
    };
  });
}

// ============================================================
// 광역시도별 가계부채 데이터 (2025 가계금융복지조사)
// 출처: 통계청·한국은행·금융감독원, 2025년 3월말 기준
// 서울/세종/경기: 공표 자산·순자산으로부터 산출
// ============================================================

const METRO_HOUSEHOLD_DEBT: MetroHouseholdDebt[] = [
  { name: '서울특별시',       avgDebt: 12361, avgFinDebt: 8614, avgDeposit: 3747, debtHoldingRate: 65.2, avgAsset: 83649 },
  { name: '부산광역시',       avgDebt: 8725,  avgFinDebt: 6283, avgDeposit: 2442, debtHoldingRate: 52.6, avgAsset: 48200 },
  { name: '대구광역시',       avgDebt: 7932,  avgFinDebt: 5614, avgDeposit: 2318, debtHoldingRate: 50.8, avgAsset: 42217 },
  { name: '인천광역시',       avgDebt: 10842, avgFinDebt: 7720, avgDeposit: 3122, debtHoldingRate: 61.5, avgAsset: 57200 },
  { name: '광주광역시',       avgDebt: 7548,  avgFinDebt: 5280, avgDeposit: 2268, debtHoldingRate: 51.2, avgAsset: 44500 },
  { name: '대전광역시',       avgDebt: 9118,  avgFinDebt: 6462, avgDeposit: 2656, debtHoldingRate: 54.3, avgAsset: 51800 },
  { name: '울산광역시',       avgDebt: 9356,  avgFinDebt: 6854, avgDeposit: 2502, debtHoldingRate: 53.8, avgAsset: 53400 },
  { name: '세종특별자치시',   avgDebt: 14563, avgFinDebt: 11307, avgDeposit: 3256, debtHoldingRate: 67.8, avgAsset: 75211 },
  { name: '경기도',           avgDebt: 12710, avgFinDebt: 9106, avgDeposit: 3604, debtHoldingRate: 63.1, avgAsset: 68716 },
  { name: '강원특별자치도',   avgDebt: 7284,  avgFinDebt: 5124, avgDeposit: 2160, debtHoldingRate: 46.8, avgAsset: 44800 },
  { name: '충청북도',         avgDebt: 7856,  avgFinDebt: 5672, avgDeposit: 2184, debtHoldingRate: 48.2, avgAsset: 46100 },
  { name: '충청남도',         avgDebt: 8412,  avgFinDebt: 5934, avgDeposit: 2478, debtHoldingRate: 49.6, avgAsset: 50800 },
  { name: '전북특별자치도',   avgDebt: 6742,  avgFinDebt: 4684, avgDeposit: 2058, debtHoldingRate: 45.6, avgAsset: 39800 },
  { name: '전라남도',         avgDebt: 6318,  avgFinDebt: 4426, avgDeposit: 1892, debtHoldingRate: 44.2, avgAsset: 36754 },
  { name: '경상북도',         avgDebt: 7068,  avgFinDebt: 4982, avgDeposit: 2086, debtHoldingRate: 47.5, avgAsset: 36754 },
  { name: '경상남도',         avgDebt: 8156,  avgFinDebt: 5832, avgDeposit: 2324, debtHoldingRate: 50.2, avgAsset: 47600 },
  { name: '제주특별자치도',   avgDebt: 9024,  avgFinDebt: 6248, avgDeposit: 2776, debtHoldingRate: 55.4, avgAsset: 56200 },
];

/** 광역시도별 가계부채 데이터 반환 */
export function getMetroHouseholdDebt(): MetroHouseholdDebt[] {
  return [...METRO_HOUSEHOLD_DEBT];
}

/** 전국 가구당 평균 부채 (만원) - 2025 가계금융복지조사 */
export function getNationalAvgHouseholdDebt(): number {
  return 9534;
}

// ============================================================
// 광역시도별 재산세 비중 데이터 (2024 결산 기준)
// 출처: 행정안전부 지방세 통계, 지역재정365
// 자체수입 중 재산세(재산세+종합부동산세 지방분) 비중
// ============================================================

const METRO_PROPERTY_TAX_SHARE: Record<string, number> = {
  '서울특별시': 22.5,
  '부산광역시': 18.3,
  '대구광역시': 17.8,
  '인천광역시': 19.2,
  '광주광역시': 15.6,
  '대전광역시': 16.4,
  '울산광역시': 17.1,
  '세종특별자치시': 20.8,
  '경기도': 21.3,
  '강원특별자치도': 14.2,
  '충청북도': 13.8,
  '충청남도': 14.5,
  '전북특별자치도': 12.6,
  '전라남도': 11.8,
  '경상북도': 13.2,
  '경상남도': 15.4,
  '제주특별자치도': 16.8,
};

/** 광역시도별 재산세 비중(%) 반환 */
export function getPropertyTaxShare(metroName: string): number {
  return METRO_PROPERTY_TAX_SHARE[metroName] ?? 15.0;
}

/** 전체 재산세 비중 데이터 반환 */
export function getAllPropertyTaxShares(): Record<string, number> {
  return { ...METRO_PROPERTY_TAX_SHARE };
}

// ============================================================
// 공공은행 국제 비교 데이터
// ============================================================

/** 노스다코타 은행 (BND) 참조 데이터 */
export const BND_REFERENCE = {
  founded: 1919,
  initialCapitalUSD: 2,          // 초기 자본금 $2M (1919)
  currentAssetsUSD: 10800,       // 현재 총자산 $10.8B (2024)
  currentAssetsEok: 146000,      // 약 14.6조원 (환율 1,350원)
  annualNetIncomeUSD: 200,       // 연간 순이익 $200M (2024)
  annualNetIncomeEok: 2700,      // 약 2,700억원
  totalReturnedUSD: 1000,        // 설립 이후 누적 주정부 환원 $1B+
  mandatoryDepositRate: 100,     // 주정부 세수 의무예치율 (%)
  population: 780000,            // 노스다코타 인구
  roe: 15.8,                     // 자기자본이익률 (%) 2024
  capitalRatio: 12.5,            // BIS 자본비율 (%)
  loanPortfolioUSD: 6100,        // 대출 포트폴리오 $6.1B (2024)
  creditRating: 'A+',            // S&P 신용등급
};

/** 독일 Sparkassen (공공저축은행) 참조 데이터 */
export const SPARKASSEN_REFERENCE = {
  totalAssetsEUR: 15200,         // 총자산 €1.52T (2024, 억유로)
  totalAssetsEok: 2200000,       // 약 220조원
  marketShareDeposits: 40,       // 독일 소매예금 시장점유율 (%)
  localRetention: 85,            // 예금의 지역 내 재대출 비율 (%)
  numberBanks: 352,              // Sparkassen 수 (2024)
  founded: 1778,                 // 최초 설립 (함부르크)
};

/** 코스타리카 BPDC (국민은행) 참조 데이터 */
export const BPDC_REFERENCE = {
  workerContribution: 1.0,       // 근로자 급여 기여율 (%)
  employerContribution: 0.5,     // 고용주 급여 기여율 (%)
  totalAssetsUSD: 5400,          // 총자산 $5.4B (2016)
  totalAssetsEok: 73000,         // 약 7.3조원
  workerOwners: 1200000,         // 소유자(근로자) 수
  population: 5200000,           // 코스타리카 인구
  marketShareLoans: 12,          // 대출 시장점유율 (%)
  nplRatio: 2.6,                 // 부실채권 비율 (%)
  roa: 1.5,                      // 총자산이익률 (%)
};
