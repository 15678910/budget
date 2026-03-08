// ============================================================
// 지방재정 건전성 데이터 (2025 당초예산 기준)
// 출처: 지방재정365, 행정안전부, 통계청
// ============================================================

export interface MetroFiscalData {
  name: string;
  independence: number;  // 재정자립도 (%)
  autonomy: number;      // 재정자주도 (%)
  debt: number;          // 지방채무 (억원)
  population: number;    // 인구 (명)
  budget: number;        // 예산규모 (억원)
}

export interface DistrictFiscalData {
  metro: string;
  name: string;
  independence: number;  // 재정자립도 (%)
  autonomy: number;      // 재정자주도 (%)
  debt: number;          // 지방채무 (억원)
  population: number;    // 인구 (명)
}

export interface NationalDebtHistoryEntry {
  year: number;
  debt: number;     // 국가채무 D1 (조원)
  gdp: number;      // GDP (조원)
  ratio: number;    // GDP 대비 국가채무비율 (%)
}

export interface MetroDebtHistoryEntry {
  year: number;
  debt: number;     // 지방채무 (억원)
  budget: number;   // 예산규모 (억원)
  ratio: number;    // 예산 대비 채무비율 (%)
}

export interface DistrictDebtHistoryEntry {
  year: number;
  debt: number;     // 지방채무 추정 (억원)
  ratio: number;    // 채무비율 추정 (%)
}

// ============================================================
// 17개 광역시도 데이터
// ============================================================

const METRO_FISCAL_DATA: MetroFiscalData[] = [
  { name: '서울특별시',       independence: 73.62, autonomy: 74.67, debt: 11544,  population: 9411000,  budget: 464000 },
  { name: '부산광역시',       independence: 42.73, autonomy: 55.53, debt: 31586,  population: 3298000,  budget: 195000 },
  { name: '대구광역시',       independence: 41.91, autonomy: 59.95, debt: 18500,  population: 2365000,  budget: 140000 },
  { name: '인천광역시',       independence: 49.17, autonomy: 60.33, debt: 22000,  population: 2988000,  budget: 168000 },
  { name: '광주광역시',       independence: 39.75, autonomy: 58.30, debt: 12800,  population: 1431000,  budget: 98000 },
  { name: '대전광역시',       independence: 41.06, autonomy: 59.80, debt: 11200,  population: 1446000,  budget: 89000 },
  { name: '울산광역시',       independence: 46.07, autonomy: 66.16, debt: 8500,   population: 1104000,  budget: 72000 },
  { name: '세종특별자치시',   independence: 54.30, autonomy: 62.33, debt: 5200,   population: 398000,   budget: 35000 },
  { name: '경기도',           independence: 55.72, autonomy: 63.17, debt: 49847,  population: 13636000, budget: 650000 },
  { name: '강원특별자치도',   independence: 25.72, autonomy: 70.60, debt: 15200,  population: 1533000,  budget: 115000 },
  { name: '충청북도',         independence: 31.83, autonomy: 64.60, debt: 12400,  population: 1595000,  budget: 98000 },
  { name: '충청남도',         independence: 32.22, autonomy: 63.74, debt: 14600,  population: 2122000,  budget: 125000 },
  { name: '전북특별자치도',   independence: 23.64, autonomy: 61.87, debt: 11800,  population: 1761000,  budget: 112000 },
  { name: '전라남도',         independence: 23.66, autonomy: 64.80, debt: 13200,  population: 1804000,  budget: 120000 },
  { name: '경상북도',         independence: 24.35, autonomy: 65.56, debt: 17800,  population: 2577000,  budget: 155000 },
  { name: '경상남도',         independence: 34.30, autonomy: 65.85, debt: 21500,  population: 3262000,  budget: 180000 },
  { name: '제주특별자치도',   independence: 33.07, autonomy: 64.39, debt: 7500,   population: 678000,   budget: 55000 },
];

// ============================================================
// 시군구 데이터
// ============================================================

const DISTRICT_FISCAL_DATA: DistrictFiscalData[] = [
  // ─── 서울특별시 ───
  { metro: '서울특별시', name: '강남구',   independence: 56.1, autonomy: 78.0, debt: 1200, population: 545000 },
  { metro: '서울특별시', name: '서초구',   independence: 53.2, autonomy: 76.5, debt: 980,  population: 430000 },
  { metro: '서울특별시', name: '중구',     independence: 53.6, autonomy: 77.2, debt: 650,  population: 130000 },
  { metro: '서울특별시', name: '송파구',   independence: 42.8, autonomy: 72.1, debt: 1100, population: 670000 },
  { metro: '서울특별시', name: '종로구',   independence: 45.2, autonomy: 74.5, debt: 420,  population: 150000 },
  { metro: '서울특별시', name: '용산구',   independence: 42.1, autonomy: 73.8, debt: 550,  population: 230000 },
  { metro: '서울특별시', name: '영등포구', independence: 39.5, autonomy: 70.2, debt: 890,  population: 370000 },
  { metro: '서울특별시', name: '마포구',   independence: 36.2, autonomy: 68.5, debt: 780,  population: 370000 },
  { metro: '서울특별시', name: '성동구',   independence: 33.5, autonomy: 66.1, debt: 680,  population: 310000 },
  { metro: '서울특별시', name: '강동구',   independence: 30.5, autonomy: 65.2, debt: 780,  population: 450000 },
  { metro: '서울특별시', name: '금천구',   independence: 29.2, autonomy: 64.3, debt: 480,  population: 240000 },
  { metro: '서울특별시', name: '광진구',   independence: 28.8, autonomy: 63.5, debt: 520,  population: 350000 },
  { metro: '서울특별시', name: '강서구',   independence: 28.5, autonomy: 62.3, debt: 850,  population: 580000 },
  { metro: '서울특별시', name: '구로구',   independence: 27.5, autonomy: 63.1, debt: 720,  population: 400000 },
  { metro: '서울특별시', name: '양천구',   independence: 26.3, autonomy: 62.5, debt: 680,  population: 450000 },
  { metro: '서울특별시', name: '동작구',   independence: 25.1, autonomy: 61.8, debt: 550,  population: 390000 },
  { metro: '서울특별시', name: '서대문구', independence: 23.5, autonomy: 60.1, debt: 580,  population: 310000 },
  { metro: '서울특별시', name: '동대문구', independence: 22.1, autonomy: 59.3, debt: 610,  population: 340000 },
  { metro: '서울특별시', name: '관악구',   independence: 21.3, autonomy: 58.2, debt: 620,  population: 490000 },
  { metro: '서울특별시', name: '성북구',   independence: 20.8, autonomy: 57.5, debt: 700,  population: 430000 },
  { metro: '서울특별시', name: '은평구',   independence: 19.5, autonomy: 56.8, debt: 650,  population: 470000 },
  { metro: '서울특별시', name: '노원구',   independence: 18.5, autonomy: 55.8, debt: 720,  population: 510000 },
  { metro: '서울특별시', name: '중랑구',   independence: 17.2, autonomy: 54.8, debt: 560,  population: 390000 },
  { metro: '서울특별시', name: '도봉구',   independence: 15.8, autonomy: 53.6, debt: 420,  population: 320000 },
  { metro: '서울특별시', name: '강북구',   independence: 14.2, autonomy: 52.1, debt: 480,  population: 300000 },

  // ─── 경기도 ───
  { metro: '경기도', name: '과천시',   independence: 63.1, autonomy: 80.2, debt: 450,  population: 72000 },
  { metro: '경기도', name: '성남시',   independence: 57.2, autonomy: 79.5, debt: 3200, population: 920000 },
  { metro: '경기도', name: '화성시',   independence: 55.8, autonomy: 78.1, debt: 4500, population: 950000 },
  { metro: '경기도', name: '용인시',   independence: 51.2, autonomy: 76.3, debt: 3100, population: 1100000 },
  { metro: '경기도', name: '수원시',   independence: 48.5, autonomy: 74.2, debt: 2800, population: 1200000 },
  { metro: '경기도', name: '평택시',   independence: 45.2, autonomy: 73.5, debt: 2100, population: 580000 },
  { metro: '경기도', name: '하남시',   independence: 44.5, autonomy: 73.8, debt: 850,  population: 310000 },
  { metro: '경기도', name: '김포시',   independence: 42.8, autonomy: 72.1, debt: 1400, population: 480000 },
  { metro: '경기도', name: '이천시',   independence: 42.1, autonomy: 72.5, debt: 680,  population: 220000 },
  { metro: '경기도', name: '안양시',   independence: 41.2, autonomy: 70.5, debt: 1500, population: 550000 },
  { metro: '경기도', name: '시흥시',   independence: 40.5, autonomy: 71.2, debt: 1300, population: 510000 },
  { metro: '경기도', name: '광주시',   independence: 39.8, autonomy: 70.8, debt: 920,  population: 390000 },
  { metro: '경기도', name: '안산시',   independence: 38.8, autonomy: 69.5, debt: 1700, population: 650000 },
  { metro: '경기도', name: '고양시',   independence: 38.5, autonomy: 68.2, debt: 2200, population: 1050000 },
  { metro: '경기도', name: '파주시',   independence: 38.2, autonomy: 69.1, debt: 1600, population: 480000 },
  { metro: '경기도', name: '남양주시', independence: 36.5, autonomy: 67.5, debt: 1900, population: 720000 },
  { metro: '경기도', name: '부천시',   independence: 35.8, autonomy: 66.8, debt: 1800, population: 810000 },
  { metro: '경기도', name: '구리시',   independence: 32.8, autonomy: 66.1, debt: 580,  population: 200000 },
  { metro: '경기도', name: '양주시',   independence: 32.5, autonomy: 65.8, debt: 780,  population: 230000 },
  { metro: '경기도', name: '의정부시', independence: 30.2, autonomy: 64.5, debt: 1200, population: 460000 },
  { metro: '경기도', name: '광명시',   independence: 40.1, autonomy: 70.5, debt: 1200, population: 280000 },
  { metro: '경기도', name: '군포시',   independence: 38.5, autonomy: 69.2, debt: 850,  population: 260000 },
  { metro: '경기도', name: '의왕시',   independence: 37.8, autonomy: 68.8, debt: 450,  population: 155000 },
  { metro: '경기도', name: '오산시',   independence: 36.2, autonomy: 67.5, debt: 620,  population: 240000 },
  { metro: '경기도', name: '안성시',   independence: 30.8, autonomy: 64.8, debt: 720,  population: 185000 },
  { metro: '경기도', name: '여주시',   independence: 28.5, autonomy: 63.2, debt: 520,  population: 115000 },
  { metro: '경기도', name: '포천시',   independence: 25.5, autonomy: 61.2, debt: 680,  population: 142000 },
  { metro: '경기도', name: '동두천시', independence: 22.8, autonomy: 58.5, debt: 380,  population: 87000 },
  { metro: '경기도', name: '양평군',   independence: 22.5, autonomy: 58.2, debt: 350,  population: 127000 },
  { metro: '경기도', name: '가평군',   independence: 20.2, autonomy: 56.8, debt: 280,  population: 63000 },
  { metro: '경기도', name: '연천군',   independence: 18.5, autonomy: 55.2, debt: 220,  population: 43000 },

  // ─── 부산광역시 ───
  { metro: '부산광역시', name: '해운대구', independence: 42.5, autonomy: 72.1, debt: 1800, population: 410000 },
  { metro: '부산광역시', name: '수영구',   independence: 34.2, autonomy: 67.5, debt: 450,  population: 180000 },
  { metro: '부산광역시', name: '부산진구', independence: 32.8, autonomy: 65.2, debt: 1200, population: 350000 },
  { metro: '부산광역시', name: '동래구',   independence: 30.5, autonomy: 64.8, debt: 780,  population: 260000 },
  { metro: '부산광역시', name: '남구',     independence: 28.2, autonomy: 62.1, debt: 680,  population: 270000 },
  { metro: '부산광역시', name: '연제구',   independence: 26.5, autonomy: 61.3, debt: 520,  population: 210000 },
  { metro: '부산광역시', name: '사상구',   independence: 25.1, autonomy: 60.8, debt: 620,  population: 210000 },
  { metro: '부산광역시', name: '금정구',   independence: 24.8, autonomy: 60.2, debt: 580,  population: 230000 },
  { metro: '부산광역시', name: '사하구',   independence: 22.1, autonomy: 58.5, debt: 950,  population: 290000 },
  { metro: '부산광역시', name: '북구',     independence: 20.8, autonomy: 57.2, debt: 780,  population: 280000 },
  { metro: '부산광역시', name: '강서구',   independence: 35.2, autonomy: 67.8, debt: 1500, population: 130000 },
  { metro: '부산광역시', name: '기장군',   independence: 32.5, autonomy: 65.2, debt: 1200, population: 190000 },
  { metro: '부산광역시', name: '중구',     independence: 30.2, autonomy: 63.5, debt: 280,  population: 42000 },
  { metro: '부산광역시', name: '서구',     independence: 22.5, autonomy: 58.8, debt: 320,  population: 100000 },
  { metro: '부산광역시', name: '동구',     independence: 20.8, autonomy: 57.2, debt: 250,  population: 85000 },
  { metro: '부산광역시', name: '영도구',   independence: 19.5, autonomy: 56.5, debt: 380,  population: 110000 },

  // ─── 대구광역시 ───
  { metro: '대구광역시', name: '수성구', independence: 38.5, autonomy: 69.2, debt: 850,  population: 420000 },
  { metro: '대구광역시', name: '달서구', independence: 28.1, autonomy: 62.5, debt: 920,  population: 540000 },
  { metro: '대구광역시', name: '군위군', independence: 10.0, autonomy: 48.5, debt: 180,  population: 22000 },
  { metro: '대구광역시', name: '달성군', independence: 35.8, autonomy: 68.5, debt: 1800, population: 250000 },
  { metro: '대구광역시', name: '중구',   independence: 32.5, autonomy: 65.8, debt: 320,  population: 75000 },
  { metro: '대구광역시', name: '북구',   independence: 25.5, autonomy: 61.2, debt: 720,  population: 430000 },
  { metro: '대구광역시', name: '동구',   independence: 24.2, autonomy: 60.1, debt: 580,  population: 340000 },
  { metro: '대구광역시', name: '서구',   independence: 20.8, autonomy: 57.5, debt: 280,  population: 170000 },

  // ─── 인천광역시 ───
  { metro: '인천광역시', name: '서구',   independence: 45.2, autonomy: 74.1, debt: 1500, population: 550000 },
  { metro: '인천광역시', name: '연수구', independence: 42.8, autonomy: 72.5, debt: 1100, population: 380000 },
  { metro: '인천광역시', name: '강화군', independence: 15.2, autonomy: 52.8, debt: 320,  population: 65000 },
  { metro: '인천광역시', name: '중구',     independence: 38.5, autonomy: 70.2, debt: 1800, population: 120000 },
  { metro: '인천광역시', name: '남동구',   independence: 35.2, autonomy: 67.5, debt: 1200, population: 530000 },
  { metro: '인천광역시', name: '부평구',   independence: 30.8, autonomy: 64.2, debt: 920,  population: 490000 },
  { metro: '인천광역시', name: '미추홀구', independence: 28.5, autonomy: 62.8, debt: 680,  population: 390000 },
  { metro: '인천광역시', name: '계양구',   independence: 28.2, autonomy: 62.5, debt: 650,  population: 300000 },
  { metro: '인천광역시', name: '동구',     independence: 22.1, autonomy: 58.5, debt: 280,  population: 63000 },
  { metro: '인천광역시', name: '옹진군',   independence: 15.8, autonomy: 53.2, debt: 180,  population: 20000 },

  // ─── 광주광역시 ───
  { metro: '광주광역시', name: '광산구', independence: 32.8, autonomy: 66.1, debt: 1200, population: 410000 },
  { metro: '광주광역시', name: '서구',   independence: 30.5, autonomy: 64.8, debt: 520,  population: 290000 },
  { metro: '광주광역시', name: '북구',   independence: 28.2, autonomy: 62.5, debt: 680,  population: 430000 },
  { metro: '광주광역시', name: '동구',   independence: 25.2, autonomy: 61.5, debt: 280,  population: 95000 },
  { metro: '광주광역시', name: '남구',   independence: 24.8, autonomy: 60.2, debt: 380,  population: 200000 },

  // ─── 대전광역시 ───
  { metro: '대전광역시', name: '유성구', independence: 38.5, autonomy: 70.8, debt: 920,  population: 370000 },
  { metro: '대전광역시', name: '서구',   independence: 32.1, autonomy: 66.2, debt: 680,  population: 480000 },
  { metro: '대전광역시', name: '중구',   independence: 28.8, autonomy: 63.5, debt: 450,  population: 240000 },
  { metro: '대전광역시', name: '대덕구', independence: 25.2, autonomy: 61.5, debt: 420,  population: 180000 },
  { metro: '대전광역시', name: '동구',   independence: 22.5, autonomy: 59.2, debt: 380,  population: 220000 },

  // ─── 울산광역시 ───
  { metro: '울산광역시', name: '울주군', independence: 42.5, autonomy: 73.2, debt: 1500, population: 230000 },
  { metro: '울산광역시', name: '남구',   independence: 38.2, autonomy: 70.5, debt: 580,  population: 340000 },
  { metro: '울산광역시', name: '중구',   independence: 32.5, autonomy: 65.8, debt: 350,  population: 210000 },
  { metro: '울산광역시', name: '북구',   independence: 30.8, autonomy: 64.5, debt: 480,  population: 200000 },
  { metro: '울산광역시', name: '동구',   independence: 28.5, autonomy: 63.2, debt: 320,  population: 160000 },

  // ─── 강원특별자치도 ───
  { metro: '강원특별자치도', name: '원주시', independence: 30.2, autonomy: 65.1, debt: 1500, population: 360000 },
  { metro: '강원특별자치도', name: '춘천시', independence: 28.5, autonomy: 63.8, debt: 1200, population: 285000 },
  { metro: '강원특별자치도', name: '강릉시', independence: 25.8, autonomy: 62.5, debt: 980,  population: 215000 },
  { metro: '강원특별자치도', name: '속초시', independence: 24.5, autonomy: 61.2, debt: 380,  population: 82000 },
  { metro: '강원특별자치도', name: '동해시', independence: 22.1, autonomy: 59.2, debt: 450,  population: 90000 },
  { metro: '강원특별자치도', name: '삼척시', independence: 16.5, autonomy: 54.2, debt: 420,  population: 65000 },
  { metro: '강원특별자치도', name: '태백시', independence: 15.8, autonomy: 53.5, debt: 320,  population: 42000 },
  { metro: '강원특별자치도', name: '양양군', independence: 15.5, autonomy: 53.2, debt: 200,  population: 28000 },
  { metro: '강원특별자치도', name: '철원군', independence: 15.2, autonomy: 52.8, debt: 260,  population: 45000 },
  { metro: '강원특별자치도', name: '고성군', independence: 14.8, autonomy: 52.5, debt: 220,  population: 28000 },
  { metro: '강원특별자치도', name: '평창군', independence: 14.5, autonomy: 52.1, debt: 350,  population: 42000 },
  { metro: '강원특별자치도', name: '홍천군', independence: 14.2, autonomy: 51.8, debt: 280,  population: 68000 },
  { metro: '강원특별자치도', name: '양구군', independence: 13.8, autonomy: 51.5, debt: 150,  population: 22000 },
  { metro: '강원특별자치도', name: '인제군', independence: 13.5, autonomy: 51.2, debt: 200,  population: 32000 },
  { metro: '강원특별자치도', name: '횡성군', independence: 13.5, autonomy: 51.2, debt: 250,  population: 45000 },
  { metro: '강원특별자치도', name: '정선군', independence: 13.2, autonomy: 50.8, debt: 280,  population: 35000 },
  { metro: '강원특별자치도', name: '영월군', independence: 12.8, autonomy: 50.5, debt: 220,  population: 38000 },
  { metro: '강원특별자치도', name: '화천군', independence: 12.5, autonomy: 50.2, debt: 180,  population: 25000 },

  // ─── 충청북도 ───
  { metro: '충청북도', name: '청주시', independence: 35.2, autonomy: 67.8, debt: 2800, population: 850000 },
  { metro: '충청북도', name: '충주시', independence: 25.5, autonomy: 62.1, debt: 780,  population: 210000 },
  { metro: '충청북도', name: '진천군', independence: 25.2, autonomy: 61.8, debt: 320,  population: 85000 },
  { metro: '충청북도', name: '제천시', independence: 22.8, autonomy: 59.5, debt: 520,  population: 130000 },
  { metro: '충청북도', name: '음성군', independence: 22.5, autonomy: 59.8, debt: 380,  population: 100000 },
  { metro: '충청북도', name: '증평군', independence: 18.5, autonomy: 55.8, debt: 150,  population: 38000 },
  { metro: '충청북도', name: '단양군', independence: 14.2, autonomy: 52.1, debt: 180,  population: 28000 },
  { metro: '충청북도', name: '옥천군', independence: 12.8, autonomy: 50.5, debt: 210,  population: 50000 },
  { metro: '충청북도', name: '영동군', independence: 11.2, autonomy: 49.1, debt: 180,  population: 46000 },
  { metro: '충청북도', name: '괴산군', independence: 10.8, autonomy: 48.5, debt: 180,  population: 35000 },
  { metro: '충청북도', name: '보은군', independence: 10.5, autonomy: 48.2, debt: 180,  population: 32000 },

  // ─── 충청남도 ───
  { metro: '충청남도', name: '아산시', independence: 40.2, autonomy: 71.5, debt: 1800, population: 340000 },
  { metro: '충청남도', name: '천안시', independence: 38.5, autonomy: 70.2, debt: 2500, population: 680000 },
  { metro: '충청남도', name: '당진시', independence: 32.5, autonomy: 66.8, debt: 820,  population: 170000 },
  { metro: '충청남도', name: '서산시', independence: 28.5, autonomy: 63.8, debt: 680,  population: 175000 },
  { metro: '충청남도', name: '계룡시', independence: 22.8, autonomy: 59.5, debt: 120,  population: 45000 },
  { metro: '충청남도', name: '보령시', independence: 18.8, autonomy: 56.2, debt: 380,  population: 95000 },
  { metro: '충청남도', name: '홍성군', independence: 18.5, autonomy: 55.8, debt: 320,  population: 90000 },
  { metro: '충청남도', name: '공주시', independence: 18.2, autonomy: 55.5, debt: 420,  population: 105000 },
  { metro: '충청남도', name: '논산시', independence: 16.5, autonomy: 54.2, debt: 380,  population: 115000 },
  { metro: '충청남도', name: '태안군', independence: 16.2, autonomy: 54.5, debt: 250,  population: 62000 },
  { metro: '충청남도', name: '예산군', independence: 15.8, autonomy: 53.5, debt: 280,  population: 78000 },
  { metro: '충청남도', name: '금산군', independence: 12.8, autonomy: 50.5, debt: 180,  population: 50000 },
  { metro: '충청남도', name: '서천군', independence: 12.2, autonomy: 49.8, debt: 180,  population: 50000 },
  { metro: '충청남도', name: '부여군', independence: 11.5, autonomy: 49.2, debt: 220,  population: 62000 },
  { metro: '충청남도', name: '청양군', independence: 10.2, autonomy: 47.8, debt: 150,  population: 30000 },

  // ─── 전북특별자치도 ───
  { metro: '전북특별자치도', name: '전주시', independence: 30.2, autonomy: 64.5, debt: 1800, population: 650000 },
  { metro: '전북특별자치도', name: '군산시', independence: 25.5, autonomy: 62.1, debt: 1200, population: 265000 },
  { metro: '전북특별자치도', name: '익산시', independence: 22.8, autonomy: 59.5, debt: 980,  population: 280000 },
  { metro: '전북특별자치도', name: '완주군', independence: 18.5, autonomy: 55.8, debt: 420,  population: 95000 },
  { metro: '전북특별자치도', name: '정읍시', independence: 14.2, autonomy: 52.1, debt: 380,  population: 108000 },
  { metro: '전북특별자치도', name: '남원시', independence: 12.8, autonomy: 50.5, debt: 320,  population: 78000 },
  { metro: '전북특별자치도', name: '김제시', independence: 12.5, autonomy: 50.2, debt: 280,  population: 82000 },
  { metro: '전북특별자치도', name: '고창군', independence: 12.2, autonomy: 49.8, debt: 220,  population: 55000 },
  { metro: '전북특별자치도', name: '부안군', independence: 12.5, autonomy: 50.2, debt: 200,  population: 52000 },
  { metro: '전북특별자치도', name: '무주군', independence: 10.2, autonomy: 47.8, debt: 180,  population: 24000 },
  { metro: '전북특별자치도', name: '순창군', independence: 9.8,  autonomy: 47.5, debt: 140,  population: 27000 },
  { metro: '전북특별자치도', name: '진안군', independence: 9.5,  autonomy: 47.2, debt: 150,  population: 25000 },
  { metro: '전북특별자치도', name: '장수군', independence: 9.2,  autonomy: 46.8, debt: 120,  population: 21000 },
  { metro: '전북특별자치도', name: '임실군', independence: 8.6,  autonomy: 47.8, debt: 160,  population: 26000 },

  // ─── 전라남도 ───
  { metro: '전라남도', name: '광양시', independence: 38.5, autonomy: 70.8, debt: 780,  population: 155000 },
  { metro: '전라남도', name: '여수시', independence: 30.8, autonomy: 65.2, debt: 1200, population: 280000 },
  { metro: '전라남도', name: '순천시', independence: 28.2, autonomy: 63.5, debt: 980,  population: 285000 },
  { metro: '전라남도', name: '목포시', independence: 22.5, autonomy: 59.8, debt: 680,  population: 220000 },
  { metro: '전라남도', name: '나주시', independence: 18.5, autonomy: 56.2, debt: 520,  population: 115000 },
  { metro: '전라남도', name: '무안군', independence: 15.8, autonomy: 53.5, debt: 280,  population: 90000 },
  { metro: '전라남도', name: '영암군', independence: 14.2, autonomy: 52.1, debt: 220,  population: 55000 },
  { metro: '전라남도', name: '화순군', independence: 12.5, autonomy: 50.2, debt: 220,  population: 63000 },
  { metro: '전라남도', name: '영광군', independence: 12.2, autonomy: 49.8, debt: 200,  population: 52000 },
  { metro: '전라남도', name: '장성군', independence: 11.5, autonomy: 49.2, debt: 180,  population: 43000 },
  { metro: '전라남도', name: '해남군', independence: 10.8, autonomy: 48.5, debt: 240,  population: 68000 },
  { metro: '전라남도', name: '구례군', independence: 10.8, autonomy: 48.5, debt: 150,  population: 25000 },
  { metro: '전라남도', name: '담양군', independence: 10.2, autonomy: 47.8, debt: 180,  population: 46000 },
  { metro: '전라남도', name: '함평군', independence: 9.8,  autonomy: 47.5, debt: 150,  population: 32000 },
  { metro: '전라남도', name: '장흥군', independence: 9.5,  autonomy: 47.2, debt: 160,  population: 35000 },
  { metro: '전라남도', name: '곡성군', independence: 9.5,  autonomy: 47.2, debt: 130,  population: 27000 },
  { metro: '전라남도', name: '보성군', independence: 9.2,  autonomy: 46.8, debt: 170,  population: 38000 },
  { metro: '전라남도', name: '진도군', independence: 9.2,  autonomy: 46.8, debt: 150,  population: 30000 },
  { metro: '전라남도', name: '강진군', independence: 8.9,  autonomy: 48.1, debt: 190,  population: 32000 },
  { metro: '전라남도', name: '고흥군', independence: 8.8,  autonomy: 46.5, debt: 200,  population: 60000 },
  { metro: '전라남도', name: '신안군', independence: 8.4,  autonomy: 47.5, debt: 150,  population: 38000 },
  { metro: '전라남도', name: '완도군', independence: 7.2,  autonomy: 45.8, debt: 220,  population: 47000 },

  // ─── 경상북도 ───
  { metro: '경상북도', name: '구미시', independence: 35.8, autonomy: 68.5, debt: 1500, population: 410000 },
  { metro: '경상북도', name: '포항시', independence: 32.5, autonomy: 66.2, debt: 1800, population: 500000 },
  { metro: '경상북도', name: '경산시', independence: 30.5, autonomy: 64.8, debt: 1200, population: 280000 },
  { metro: '경상북도', name: '경주시', independence: 25.8, autonomy: 62.5, debt: 1200, population: 255000 },
  { metro: '경상북도', name: '칠곡군', independence: 25.2, autonomy: 61.8, debt: 420,  population: 115000 },
  { metro: '경상북도', name: '김천시', independence: 20.5, autonomy: 57.8, debt: 520,  population: 140000 },
  { metro: '경상북도', name: '영천시', independence: 18.8, autonomy: 56.2, debt: 420,  population: 98000 },
  { metro: '경상북도', name: '안동시', independence: 18.2, autonomy: 55.5, debt: 680,  population: 155000 },
  { metro: '경상북도', name: '영주시', independence: 16.5, autonomy: 54.2, debt: 380,  population: 102000 },
  { metro: '경상북도', name: '문경시', independence: 15.2, autonomy: 52.8, debt: 280,  population: 70000 },
  { metro: '경상북도', name: '고령군', independence: 14.8, autonomy: 52.5, debt: 200,  population: 33000 },
  { metro: '경상북도', name: '상주시', independence: 14.5, autonomy: 52.1, debt: 320,  population: 96000 },
  { metro: '경상북도', name: '울진군', independence: 14.2, autonomy: 52.1, debt: 220,  population: 48000 },
  { metro: '경상북도', name: '예천군', independence: 12.8, autonomy: 50.5, debt: 180,  population: 55000 },
  { metro: '경상북도', name: '성주군', independence: 12.5, autonomy: 50.2, debt: 160,  population: 43000 },
  { metro: '경상북도', name: '청도군', independence: 11.2, autonomy: 49.1, debt: 180,  population: 42000 },
  { metro: '경상북도', name: '영덕군', independence: 10.5, autonomy: 48.2, debt: 160,  population: 35000 },
  { metro: '경상북도', name: '울릉군', independence: 10.5, autonomy: 48.2, debt: 80,   population: 9000 },
  { metro: '경상북도', name: '의성군', independence: 9.8,  autonomy: 47.5, debt: 180,  population: 50000 },
  { metro: '경상북도', name: '청송군', independence: 8.8,  autonomy: 46.5, debt: 130,  population: 25000 },
  { metro: '경상북도', name: '영양군', independence: 8.2,  autonomy: 45.8, debt: 100,  population: 16000 },
  { metro: '경상북도', name: '봉화군', independence: 7.5,  autonomy: 46.2, debt: 180,  population: 30000 },

  // ─── 경상남도 ───
  { metro: '경상남도', name: '창원시', independence: 40.2, autonomy: 72.5, debt: 3500, population: 1040000 },
  { metro: '경상남도', name: '김해시', independence: 35.2, autonomy: 67.8, debt: 1800, population: 540000 },
  { metro: '경상남도', name: '양산시', independence: 32.8, autonomy: 66.5, debt: 1200, population: 370000 },
  { metro: '경상남도', name: '거제시', independence: 28.5, autonomy: 63.2, debt: 1500, population: 235000 },
  { metro: '경상남도', name: '진주시', independence: 25.8, autonomy: 62.5, debt: 1200, population: 350000 },
  { metro: '경상남도', name: '사천시', independence: 22.8, autonomy: 59.5, debt: 420,  population: 110000 },
  { metro: '경상남도', name: '통영시', independence: 20.5, autonomy: 57.8, debt: 580,  population: 125000 },
  { metro: '경상남도', name: '밀양시', independence: 15.8, autonomy: 53.5, debt: 380,  population: 105000 },
  { metro: '경상남도', name: '함안군', independence: 15.2, autonomy: 52.8, debt: 220,  population: 65000 },
  { metro: '경상남도', name: '창녕군', independence: 14.5, autonomy: 52.1, debt: 200,  population: 60000 },
  { metro: '경상남도', name: '고성군', independence: 13.8, autonomy: 51.5, debt: 180,  population: 50000 },
  { metro: '경상남도', name: '거창군', independence: 13.5, autonomy: 51.2, debt: 220,  population: 62000 },
  { metro: '경상남도', name: '남해군', independence: 12.2, autonomy: 49.8, debt: 160,  population: 42000 },
  { metro: '경상남도', name: '하동군', independence: 11.5, autonomy: 49.2, debt: 180,  population: 45000 },
  { metro: '경상남도', name: '함양군', independence: 10.8, autonomy: 48.5, debt: 170,  population: 38000 },
  { metro: '경상남도', name: '합천군', independence: 10.5, autonomy: 48.2, debt: 180,  population: 43000 },
  { metro: '경상남도', name: '산청군', independence: 10.2, autonomy: 47.8, debt: 150,  population: 33000 },
  { metro: '경상남도', name: '의령군', independence: 9.5,  autonomy: 47.2, debt: 150,  population: 26000 },

  // ─── 제주특별자치도 ───
  { metro: '제주특별자치도', name: '제주시',   independence: 32.5, autonomy: 66.8, debt: 1800, population: 490000 },
  { metro: '제주특별자치도', name: '서귀포시', independence: 22.8, autonomy: 59.5, debt: 680,  population: 190000 },
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
// 출처: 지방재정365, 행정안전부
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
// Helper functions
// ============================================================

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
