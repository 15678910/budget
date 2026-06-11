// 기초 시군구 SDG — 실데이터만(진학률 Goal4 + 재정 맥락). 합성 점수 미사용.
//
// ⚠️ 정직성(중요): local-sdg-data의 시군구(해시) 합성 데이터를 import하지 않는다.
//   기초 단위 실측은 진학률(공식 통계)과 재정(지역재정365)뿐이므로 그 둘만 노출하고,
//   나머지 목표는 '데이터 준비중'으로 정직 표기한다.
//
// 데이터 소스:
//   - 진학률: public/data/admission-sgg-2025.json ({year, list:[{sido(약칭), sgg, rate, grads}]})
//   - 재정:   fiscal-health-data.getDistrictFiscalData(metroFullName) → {metro, name, ...}
//
// 키 매칭: CANON_16 약칭 ↔ 재정 full metro명, CANON_16 약칭 ↔ 진학률 sido 약칭(들).
//   광주전남: 재정 metro = '전남광주통합특별시', 진학률 sido = '광주' + '전남'(병합).

import { getDistrictFiscalData, type DistrictFiscalData } from '@/lib/data/fiscal-health-data';
import admissionRaw from '../../../public/data/admission-sgg-2025.json';

interface AdmissionEntry { sido: string; sgg: string; rate: number; grads: number }
interface AdmissionFile { year: number; list: AdmissionEntry[] }
const admission = admissionRaw as AdmissionFile;

export interface MunicipalFiscal {
  independence: number;
  autonomy: number;
  debtRatio: number; // 채무/예산 ×100
  budget: number;    // 억원
  population: number;
}

export interface MunicipalSDG {
  /** Goal4 대학 진학률(%). 매칭 없으면 null. */
  admissionRate: number | null;
  /** 재정 맥락(맥락 자료, 목표 아님). 매칭 없으면 null. */
  fiscal: MunicipalFiscal | null;
  /** 실데이터 보유 목표(진학률 있으면 [4]). 재정은 맥락이라 목표 아님. */
  availableGoals: number[];
  /** 정직성 고지 문구. */
  note: string;
}

// CANON_16 약칭 → 재정 full metro명
const CANON_TO_FISCAL_METRO: Record<string, string> = {
  서울: '서울특별시', 부산: '부산광역시', 대구: '대구광역시', 인천: '인천광역시',
  대전: '대전광역시', 울산: '울산광역시', 세종: '세종특별자치시', 경기: '경기도',
  강원: '강원특별자치도', 충북: '충청북도', 충남: '충청남도', 전북: '전북특별자치도',
  광주전남: '전남광주통합특별시', 경북: '경상북도', 경남: '경상남도', 제주: '제주특별자치도',
};

// CANON_16 약칭 → 진학률 sido 약칭(들). 광주전남은 광주+전남 병합.
const CANON_TO_ADMISSION_SIDO: Record<string, string[]> = {
  서울: ['서울'], 부산: ['부산'], 대구: ['대구'], 인천: ['인천'],
  대전: ['대전'], 울산: ['울산'], 세종: ['세종'], 경기: ['경기'],
  강원: ['강원'], 충북: ['충북'], 충남: ['충남'], 전북: ['전북'],
  광주전남: ['광주', '전남'], 경북: ['경북'], 경남: ['경남'], 제주: ['제주'],
};

const NOTE =
  '기초 단위는 대표지표(대학 진학률)와 재정 맥락만 실측 제공합니다. ' +
  '나머지 목표는 데이터 준비중이며, 종합 SDG 달성도가 아닙니다.';

/** 해당 광역(CANON_16 약칭)의 시군구 목록(진학률+재정 합집합, 중복 제거·정렬). */
export function listMunicipalities(canonMetro: string): string[] {
  const set = new Set<string>();
  const fiscalMetro = CANON_TO_FISCAL_METRO[canonMetro];
  if (fiscalMetro) {
    for (const d of getDistrictFiscalData(fiscalMetro)) set.add(d.name);
  }
  const sidos = CANON_TO_ADMISSION_SIDO[canonMetro] ?? [];
  for (const e of admission.list) {
    if (sidos.includes(e.sido)) set.add(e.sgg);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'ko'));
}

/** 시군구 실데이터(진학률 + 재정). 매칭 없으면 null·공백. */
export function getMunicipalSDG(canonMetro: string, sgg: string): MunicipalSDG {
  // 진학률 매칭 (canon에 속한 admission sido들 안에서 sgg 일치)
  const sidos = CANON_TO_ADMISSION_SIDO[canonMetro] ?? [];
  const adm = admission.list.find((e) => sidos.includes(e.sido) && e.sgg === sgg);
  const admissionRate = adm ? adm.rate : null;

  // 재정 매칭 (full metro명 + sgg name)
  const fiscalMetro = CANON_TO_FISCAL_METRO[canonMetro];
  let fiscal: MunicipalFiscal | null = null;
  if (fiscalMetro) {
    const d = getDistrictFiscalData(fiscalMetro).find((x: DistrictFiscalData) => x.name === sgg);
    if (d) {
      const debtRatio = d.budget > 0 ? Math.round((d.debt / d.budget) * 1000) / 10 : 0;
      fiscal = {
        independence: d.independence,
        autonomy: d.autonomy,
        debtRatio,
        budget: d.budget,
        population: d.population,
      };
    }
  }

  const availableGoals = admissionRate != null ? [4] : [];
  return { admissionRate, fiscal, availableGoals, note: NOTE };
}
