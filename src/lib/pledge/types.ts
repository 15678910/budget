// 선거 공약 분석 — 데이터 모델
// 출처: 중앙선관위 선거공약정보 API (getCnddtElecPrmsInfoInqire)
// ※ 필드명은 선관위 표준 기준. 최초 수집 시 실응답으로 검증/보정.

/** 선관위 공약 API 원시 항목 (정규화 전) */
export interface PledgeRaw {
  sgId: string;        // 선거ID (예: 20260603)
  sgTypecode: string;  // 선거종류 (11=교육감, 3=시도지사, 4=구시군의장)
  cnddtId: string;     // 후보ID
  krName: string;      // 후보 성명
  jdName: string;      // 정당명 (교육감은 '무소속' 통상)
  sidoName?: string;   // 시도명
  sggName?: string;    // 선거구명
  prmsOrd: string;     // 공약 순번
  prmsRealmName: string; // 공약 분야
  prmsTitle: string;   // 공약 제목
  prmsCont: string;    // 공약 내용
}

/** 정규화된 공약 */
export interface Pledge {
  ord: number;       // 순번
  realm: string;     // 분야 (선관위 분류)
  title: string;     // 제목
  content: string;   // 내용
}

/** 후보 (공약 묶음) */
export interface Candidate {
  cnddtId: string;
  name: string;
  party: string;
  sido: string;      // 시도(약칭 또는 정식)
  sgg?: string;      // 선거구(단체장·의원)
  pledges: Pledge[];
}

/** 수집 산출물 */
export interface PledgeDataset {
  sgId: string;
  sgTypecode: string;
  sgName: string;        // 선거명
  collectedAt: string;   // 수집 시각(주입)
  candidates: Candidate[];
}
