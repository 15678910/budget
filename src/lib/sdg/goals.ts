// 한국 지역 SDG 지도 — Goal 정의 + 시도별 대표 지표
// ⚠️ 통합 'SDG 점수'는 한국 지역 단위 미공개 → goal별 대표 지표(출처 명시) 기반 시각화.
//    "지표 = SDG 달성도"라고 단정하지 않음. 데이터 없는 goal은 null(준비중).
import { ADMISSION_SIDO } from '@/lib/data/admission-rate';

/** SDG 5대 영역(5 Ps) — UN 공식 People/Planet/Prosperity/Peace/Partnership */
export type SDGDomain5 = 'people' | 'planet' | 'prosperity' | 'peace' | 'partnership';

export interface SDGGoal { num: number; name: string; short: string; en: string; color: string; domain: SDGDomain5 }

// UN 공식 17 SDG (색상·영문제목 = UN 공식)
// domain: people 1-5 · planet 6,12,13,14,15 · prosperity 7,8,9,10,11 · peace 16 · partnership 17
export const SDG_GOALS: SDGGoal[] = [
  { num: 1, name: '빈곤 종식', short: '빈곤', en: 'NO POVERTY', color: '#E5243B', domain: 'people' },
  { num: 2, name: '기아 종식', short: '기아', en: 'ZERO HUNGER', color: '#DDA63A', domain: 'people' },
  { num: 3, name: '건강과 웰빙', short: '건강', en: 'GOOD HEALTH AND WELL-BEING', color: '#4C9F38', domain: 'people' },
  { num: 4, name: '양질의 교육', short: '교육', en: 'QUALITY EDUCATION', color: '#C5192D', domain: 'people' },
  { num: 5, name: '성평등', short: '성평등', en: 'GENDER EQUALITY', color: '#FF3A21', domain: 'people' },
  { num: 6, name: '깨끗한 물과 위생', short: '물·위생', en: 'CLEAN WATER AND SANITATION', color: '#26BDE2', domain: 'planet' },
  { num: 7, name: '깨끗한 에너지', short: '에너지', en: 'AFFORDABLE AND CLEAN ENERGY', color: '#FCC30B', domain: 'prosperity' },
  { num: 8, name: '양질의 일자리·경제성장', short: '일자리', en: 'DECENT WORK AND ECONOMIC GROWTH', color: '#A21942', domain: 'prosperity' },
  { num: 9, name: '산업·혁신·인프라', short: '인프라', en: 'INDUSTRY, INNOVATION AND INFRASTRUCTURE', color: '#FD6925', domain: 'prosperity' },
  { num: 10, name: '불평등 감소', short: '불평등', en: 'REDUCED INEQUALITIES', color: '#DD1367', domain: 'prosperity' },
  { num: 11, name: '지속가능한 도시', short: '도시', en: 'SUSTAINABLE CITIES AND COMMUNITIES', color: '#FD9D24', domain: 'prosperity' },
  { num: 12, name: '책임있는 소비·생산', short: '소비·생산', en: 'RESPONSIBLE CONSUMPTION AND PRODUCTION', color: '#BF8B2E', domain: 'planet' },
  { num: 13, name: '기후변화 대응', short: '기후', en: 'CLIMATE ACTION', color: '#3F7E44', domain: 'planet' },
  { num: 14, name: '해양 생태계', short: '해양', en: 'LIFE BELOW WATER', color: '#0A97D9', domain: 'planet' },
  { num: 15, name: '육상 생태계', short: '육상', en: 'LIFE ON LAND', color: '#56C02B', domain: 'planet' },
  { num: 16, name: '평화·정의·제도', short: '제도', en: 'PEACE, JUSTICE AND STRONG INSTITUTIONS', color: '#00689D', domain: 'peace' },
  { num: 17, name: '목표를 위한 파트너십', short: '파트너십', en: 'PARTNERSHIPS FOR THE GOALS', color: '#19486A', domain: 'partnership' },
];

/** SDG 5대 영역(5 Ps) 분류 — 목표를 영역 단위로 묶을 때 사용 */
export const SDG_DOMAINS_5 = [
  { id: 'people', label: '인간', en: 'People', goals: [1, 2, 3, 4, 5] },
  { id: 'planet', label: '지구', en: 'Planet', goals: [6, 12, 13, 14, 15] },
  { id: 'prosperity', label: '번영', en: 'Prosperity', goals: [7, 8, 9, 10, 11] },
  { id: 'peace', label: '평화', en: 'Peace', goals: [16] },
  { id: 'partnership', label: '파트너십', en: 'Partnership', goals: [17] },
] as const;

export interface SDGIndicator {
  label: string;        // 지표명
  source: string;       // 출처
  year: string;         // 기준연도
  unit: string;         // 단위
  higherBetter: boolean; // 해석방향 (true=높을수록 좋음)
  bySido: Record<string, number>; // 시도 약칭 → 값
}

/** goal별 대표 지표 (시도 실데이터 보유분만; 나머지는 null = KOSIS 수집 예정) */
export function getGoalIndicator(goalNum: number): SDGIndicator | null {
  switch (goalNum) {
    case 4: {
      // 양질의 교육 — 대학 진학률 (한국교육개발원, 보유)
      const bySido: Record<string, number> = {};
      for (const s of ADMISSION_SIDO) bySido[s.sido] = s.latest;
      return {
        label: '대학 진학률', source: '한국교육개발원 교육기본통계',
        year: '2025', unit: '%', higherBetter: true, bySido,
      };
    }
    default:
      return null; // Phase C(KOSIS) 수집 예정
  }
}

/** 시도 정식명 → 약칭 (TopoJSON properties.name ↔ 지표 키 매칭) */
export const SIDO_FULL_TO_SHORT: Record<string, string> = {
  서울특별시: '서울', 부산광역시: '부산', 대구광역시: '대구', 인천광역시: '인천',
  광주광역시: '광주', 대전광역시: '대전', 울산광역시: '울산', 세종특별자치시: '세종',
  경기도: '경기', 강원도: '강원', 강원특별자치도: '강원', 충청북도: '충북', 충청남도: '충남',
  전라북도: '전북', 전북특별자치도: '전북', 전라남도: '전남', 경상북도: '경북', 경상남도: '경남',
  제주특별자치도: '제주',
};
