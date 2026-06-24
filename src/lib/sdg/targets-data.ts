// ============================================================
// SDG 목표값 데이터셋 (국제기준 달성도 점수용)
// ============================================================
//
// 목적: 지표 id별 green(=100점)·floor(=0점) 임계값 + 유형(type) + 출처(source).
//   scoreTargetBased(value, green, floor, direction)으로 0~100 달성도 점수를 산정한다.
//   (기존 16광역 상대 min-max 점수와 별개. SDSN/Bertelsmann SDG Index 방법론 적응.)
//
// ⚠️ 정직성 원칙 (CLAUDE.md PART 9 §1, spec D3·D5):
//   - local-sdg-data RAW의 `target` 컬럼은 **출처 없는 지역 추정값** → official 목표로 절대 사용 금지.
//     본 데이터셋의 임계값은 그 RAW target을 인용하지 않는다.
//   - **official**: 실제 인용 가능한 정량 목표만(문서·기관명 명시). 불확실하면 official로 쓰지 않고
//     normative/benchmark로 강등한다. 가짜 official 금지.
//   - **normative**: 자연 상한/규범이 있는 비율·보건/환경 규범 기준값.
//   - **benchmark**: 위 둘이 없으면 국내 16광역 분포 상위/하위를 기준으로 명시(type='benchmark').
//
// green/floor 일관성 규칙(direction 반영):
//   - higher_better: green > floor (높을수록 양호 → green이 큰 값)
//   - lower_better:  green < floor (낮을수록 양호 → green이 작은 값)
//
// 적용 범위: 달성도 점수는 INDICATOR_TO_GOAL에 매핑된 지표에만 적용한다(맥락 지표 fin_*/dem_* 제외).
//   본 데이터셋도 매핑 지표(30개)만 수록한다.
//
// 분포 출처(benchmark/floor 산정 근거):
//   16광역 실값 분포는 local-sdg-data RAW의 currentValue(2024~2025 기준)를 16광역으로 병합한 값.
//   benchmark green=분포 상위(우수 광역 수준), floor=분포 하위(최저 광역 수준)를 라운드해 사용.
// ============================================================

export type TargetType = 'official' | 'normative' | 'benchmark';

export interface IndicatorTarget {
  /** 100점 기준값 (목표 달성 앵커) */
  green: number;
  /** 0점 기준값 (하한 앵커) */
  floor: number;
  /** 임계값 유형 — 해석 라벨 결정 */
  type: TargetType;
  /** 출처/근거 (빈 문자열 금지) */
  source: string;
}

// ────────────────────────────────────────────────────────────
// 지표별 임계값.
// 각 항목 주석에 direction과 산정 근거를 남긴다.
// ────────────────────────────────────────────────────────────
export const INDICATOR_TARGETS: Record<string, IndicatorTarget> = {
  // ── Goal 1 빈곤 ──
  // wel_basic 기초생활수급자 비율 % (lower_better). 0%는 비현실적 하한이 아니라
  // '빈곤 부재'라는 규범 목표 → green=2.0(우수 수준), floor=6.0(분포 최악 부근).
  // 절대 0은 수급 사각 의미라 normative 우수기준 사용.
  wel_basic: { green: 2.0, floor: 6.0, type: 'normative', source: '규범: 빈곤 최소화(우수 광역 수준 2% / 분포 하위 6%)' },
  // wel_budget 사회복지 예산비중 % (higher_better). 자연 상한 100% 비현실 →
  // 분포 상위/하위 벤치마크.
  wel_budget: { green: 45, floor: 28, type: 'benchmark', source: '국내 광역 분포 상위/하위 (45% / 28%)' },

  // ── Goal 3 건강 ──
  // hlt_life 기대수명 세 (higher_better). green=86(국내 최상위·장수국 수준),
  // floor=80(분포 하위).
  hlt_life: { green: 86, floor: 80, type: 'benchmark', source: '국내 광역 분포 상위/하위 (86세 / 80세)' },
  // hlt_doctor 인구10만명당 의사수 명 (higher_better). OECD 평균 인구1천명당 약 3.7명 ≈
  // 인구10만명당 370명. 다만 본 데이터는 활동의사 정의가 OECD와 정확히 일치한다고
  // 단정할 수 없어 official 대신 benchmark(국내 분포 상위)로 둔다.
  hlt_doctor: { green: 420, floor: 190, type: 'benchmark', source: '국내 광역 분포 상위/하위 (420 / 190); OECD 평균(~370/10만명) 참고' },
  // hlt_suicide 자살률 명/10만명 (lower_better). OECD 평균 약 11명/10만명(정상화 표준).
  // 한국은 OECD 최고 수준이라 green=OECD 평균 11을 규범 목표로, floor=분포 최악 36 부근.
  hlt_suicide: { green: 11, floor: 36, type: 'normative', source: '규범: OECD 평균 자살률 약 11명/10만명(green) / 국내 분포 하위 36(floor)' },
  // hlt_obesity 비만율 % (lower_better). WHO/보건 규범상 명확한 단일 목표치는 없어
  // 분포 상위(우수)·하위 벤치마크.
  hlt_obesity: { green: 28, floor: 37, type: 'benchmark', source: '국내 광역 분포 상위/하위 (28% / 37%)' },

  // ── Goal 4 교육 ──
  // edu_student 교원1인당 학생수 명 (lower_better). OECD 초등 평균 약 14명 부근이나
  // 학교급 정의 차이로 official 단정 불가 → benchmark.
  edu_student: { green: 10, floor: 16, type: 'benchmark', source: '국내 광역 분포 상위/하위 (10명 / 16명); OECD 평균(~14) 참고' },
  // edu_private 사교육비 만원/월 (lower_better). 규범 목표 부재 → 분포 상위/하위 벤치마크.
  edu_private: { green: 22, floor: 55, type: 'benchmark', source: '국내 광역 분포 상위/하위 (22만원 / 55만원)' },
  // edu_univ 대학진학률 % (higher_better). 자연 상한 100%이나 100% 진학은 규범 목표가
  // 아님(직업 경로 다양성). 분포 상위/하위 벤치마크.
  edu_univ: { green: 78, floor: 64, type: 'benchmark', source: '국내 광역 분포 상위/하위 (78% / 64%)' },

  // ── Goal 5 성평등 ──
  // emp_female 여성경활참가율 % (higher_better). 성평등 규범상 남성 수준(약 73%) 도달이
  // 목표 → green=70(국내 상위·남성근접), floor=48(분포 최저).
  emp_female: { green: 70, floor: 48, type: 'normative', source: '규범: 성별 격차 해소(남성 경활 수준 근접 ~70%) / 분포 하위 48%' },

  // ── Goal 8 일자리 ──
  // emp_rate 고용률 % (higher_better). 정부/OECD 고용률 70% 목표가 통용되나 연령범위
  // 정의차로 official 단정 회피 → benchmark(분포 상위)로 두되 source에 70% 참고 명시.
  emp_rate: { green: 70, floor: 58, type: 'benchmark', source: '국내 광역 분포 상위/하위 (70% / 58%); 고용률 70% 정책목표 참고' },
  // emp_unemp 실업률 % (lower_better). 완전고용 규범상 자연실업률 ~2.5~3%. green=2.0(우수),
  // floor=4.0(분포 최악).
  emp_unemp: { green: 2.0, floor: 4.0, type: 'normative', source: '규범: 완전고용 수준 실업률(~2%) / 국내 분포 하위 4%' },
  // emp_youth 청년실업률 % (lower_better). 분포 상위/하위 벤치마크.
  emp_youth: { green: 5.0, floor: 9.0, type: 'benchmark', source: '국내 광역 분포 상위/하위 (5% / 9%)' },

  // ── Goal 9 인프라 ──
  // trn_road 도로포장률 % (higher_better). 100% 포장이 자연 상한·규범 목표 → green=100,
  // floor=76(분포 최저).
  trn_road: { green: 100, floor: 76, type: 'normative', source: '규범: 완전 포장 100%(green) / 국내 분포 하위 76%(floor)' },

  // ── Goal 10 불평등 ──
  // wel_pension 국민연금 가입률 % (higher_better). 보편 가입이 규범 목표지만 적용대상
  // 정의상 100%는 비현실 → green=85(국내 상위·우수), floor=58(분포 최저). normative.
  wel_pension: { green: 85, floor: 58, type: 'normative', source: '규범: 보편적 노후소득보장 지향(우수 85%) / 분포 하위 58%' },
  // wel_elderly 노인복지시설 개/만명 (higher_better). 규범 목표치 부재 → 분포 벤치마크.
  wel_elderly: { green: 3.5, floor: 2.0, type: 'benchmark', source: '국내 광역 분포 상위/하위 (3.5 / 2.0 개·만명)' },

  // ── Goal 11 도시 ──
  // hou_supply 주택보급률 % (higher_better). 100%(가구수=주택수)가 규범 균형점 → green=100,
  // floor=97(분포 최저). normative.
  hou_supply: { green: 100, floor: 97, type: 'normative', source: '규범: 주택수=가구수 균형 100%(green) / 분포 하위 97%(floor)' },
  // hou_area 1인당 주거면적 m² (higher_better). 분포 상위/하위 벤치마크.
  hou_area: { green: 38, floor: 28, type: 'benchmark', source: '국내 광역 분포 상위/하위 (38 / 28 m²)' },
  // hou_pir 주택가격소득비 배 (lower_better). 국제 주거부담 규범상 PIR 3~5배가 'affordable'.
  // green=4.5(affordable 상한), floor=15(서울 등 최악). normative.
  hou_pir: { green: 4.5, floor: 15, type: 'normative', source: "규범: 주거부담 적정 PIR 약 4.5배(green, 국제 'affordable' 기준) / 국내 분포 하위 15배(floor)" },
  // hou_rental 공공임대주택 비율 % (higher_better). OECD 평균 약 7%, 상위국 15%+.
  // green=15(상위국·정책 지향), floor=5(국내 최저). normative.
  hou_rental: { green: 15, floor: 5, type: 'normative', source: '규범: 공공임대 확충 지향(상위국 ~15%) / 국내 분포 하위 5%' },
  // env_park 1인당 공원면적 m² (higher_better). WHO 권고 1인당 최소 9m² 부근. green=20(우수),
  // floor=8.5(분포 최저). benchmark(상위)로 두되 WHO 9m² 참고.
  env_park: { green: 20, floor: 8.5, type: 'benchmark', source: '국내 광역 분포 상위/하위 (20 / 8.5 m²); WHO 권고 최소 9m² 참고' },
  // trn_public 대중교통 분담률 % (higher_better). 분포 상위/하위 벤치마크.
  trn_public: { green: 50, floor: 10, type: 'benchmark', source: '국내 광역 분포 상위/하위 (50% / 10%)' },
  // cul_facility 문화시설 개/만명 (higher_better). 분포 벤치마크.
  cul_facility: { green: 4.0, floor: 1.8, type: 'benchmark', source: '국내 광역 분포 상위/하위 (4.0 / 1.8 개·만명)' },
  // cul_sports 체육시설 개/만명 (higher_better). 분포 벤치마크.
  cul_sports: { green: 4.5, floor: 2.5, type: 'benchmark', source: '국내 광역 분포 상위/하위 (4.5 / 2.5 개·만명)' },

  // ── Goal 13 기후 ──
  // env_pm25 미세먼지 PM2.5 μg/m³ (lower_better). WHO 2021 연평균 가이드라인 5μg/m³(official).
  // green=5(WHO 권고), floor=18(국내 분포 최악). 출처 명확한 official.
  env_pm25: { green: 5, floor: 18, type: 'official', source: 'WHO Global Air Quality Guidelines 2021: 연평균 PM2.5 5μg/m³(green) / 국내 분포 하위 18(floor)' },
  // env_recycle 재활용률 % (higher_better). 분포 상위/하위 벤치마크.
  env_recycle: { green: 68, floor: 55, type: 'benchmark', source: '국내 광역 분포 상위/하위 (68% / 55%)' },
  // env_sewage 하수처리율 % (higher_better). 100% 처리가 환경 규범 목표 → green=100,
  // floor=88(분포 최저). normative.
  env_sewage: { green: 100, floor: 88, type: 'normative', source: '규범: 완전 하수처리 100%(green) / 국내 분포 하위 88%(floor)' },

  // ── Goal 16 제도 ──
  // saf_crime 범죄발생률 건/만명 (lower_better). 규범 목표치 부재 → 분포 벤치마크.
  saf_crime: { green: 22, floor: 42, type: 'benchmark', source: '국내 광역 분포 상위/하위 (22 / 42 건·만명)' },
  // saf_traffic 교통사고 사망률 명/10만명 (lower_better). 'Vision Zero' 규범(궁극 0)이 있으나
  // 단기 0은 비현실 → green=3.5(국내 최우수·선진국 수준), floor=10(분포 최악). benchmark.
  saf_traffic: { green: 3.5, floor: 10, type: 'benchmark', source: '국내 광역 분포 상위/하위 (3.5 / 10 명·10만명); Vision Zero 규범 참고' },
  // saf_fire 화재발생건수 건/만명 (lower_better). 분포 벤치마크.
  saf_fire: { green: 3.5, floor: 6.2, type: 'benchmark', source: '국내 광역 분포 상위/하위 (3.5 / 6.2 건·만명)' },
};
