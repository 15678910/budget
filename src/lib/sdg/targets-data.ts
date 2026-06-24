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
//   광주광역시+전라남도는 인구가중 평균으로 '광주전남'으로 병합(mergeToCanon16 사용).
//   benchmark green=16광역 실분포 best(higher_better→max, lower_better→min),
//             floor=16광역 실분포 worst (반대 끝값).
//   green/floor가 실분포 끝값과 ±0.5 이내인 경우 허용(aspirational 미세 조정).
//   green이 실분포 밖인 경우 normative로 강등하고 source에 'aspirational' 명시.
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
  // [B안] 16광역 실분포: max=44%(전북), min=28%(세종). 구 green=45는 전라남 RAW값(merge 전)으로
  // 16광역 병합 후 실제 최고는 44%(전북)임 → 정정.
  wel_budget: { green: 44, floor: 28, type: 'benchmark', source: '국내 16광역 분포 (상위 44%(전북) / 하위 28%(세종))' },

  // ── Goal 3 건강 ──
  // hlt_life 기대수명 세 (higher_better). 16광역 실분포: max=84.5(서울), min=82.0(강원).
  // green=86은 분포 최고 84.5를 초과하는 aspirational 장수 지향 목표 → [A안] normative로 강등.
  // floor=80은 분포 최저 82.0보다 낮은 aspirational 하한(선진국 하위 참고) → normative 유지.
  hlt_life: { green: 86, floor: 80, type: 'normative', source: '규범: 장수사회 기대수명 86세 지향(aspirational, 분포 최고 84.5세 초과) / floor=80은 분포 최저 82.0보다 낮은 aspirational 하한' },
  // hlt_doctor 인구10만명당 의사수 명 (higher_better). OECD 평균 인구1천명당 약 3.7명 ≈
  // 인구10만명당 370명. 다만 본 데이터는 활동의사 정의가 OECD와 정확히 일치한다고
  // 단정할 수 없어 official 대신 benchmark(국내 분포 상위)로 둔다.
  // [B안] 16광역 실분포: max=420(서울), min=190(충남) — 현재값과 정확히 일치.
  hlt_doctor: { green: 420, floor: 190, type: 'benchmark', source: '국내 16광역 분포 (상위 420명/10만(서울) / 하위 190명/10만(충남)); OECD 평균(~370/10만명) 참고' },
  // hlt_suicide 자살률 명/10만명 (lower_better). OECD 평균 약 11명/10만명(정상화 표준).
  // 한국은 OECD 최고 수준이라 green=OECD 평균 11을 규범 목표로, floor=분포 최악 36 부근.
  hlt_suicide: { green: 11, floor: 36, type: 'normative', source: '규범: OECD 평균 자살률 약 11명/10만명(green) / 국내 분포 하위 36(floor)' },
  // hlt_obesity 비만율 % (lower_better). 16광역 실분포: best(min)=31%(세종), worst(max)=37%(강원·경북).
  // green=28은 분포 최우수 31%보다 낮아 현재 어떤 광역도 도달 불가 → [A안] normative로 강등.
  hlt_obesity: { green: 28, floor: 37, type: 'normative', source: '규범: 비만율 최소화 28% 지향(aspirational, 분포 최우수 세종 31% 초과 불가) / 분포 최악 37%(강원·경북)' },

  // ── Goal 4 교육 ──
  // edu_student 교원1인당 학생수 명 (lower_better). 16광역 실분포: best≈10.2(경북), worst=16.5(세종).
  // green=10은 best 10.2 대비 ±0.5 허용오차 내 aspirational 하한. [B안] 분포 준거 유지.
  edu_student: { green: 10, floor: 16, type: 'benchmark', source: '국내 16광역 분포 (상위 ≈10.2명(경북) / 하위 16.5명(세종)); green=10은 ±0.5 허용오차 내 aspirational 수준; OECD 평균(~14) 참고' },
  // edu_private 사교육비 만원/월 (lower_better). 16광역 실분포: best=25만원(전북), worst=55만원(서울).
  // green=22는 분포 최우수 25보다 낮아 현재 어떤 광역도 도달 불가 → [A안] normative로 강등.
  edu_private: { green: 22, floor: 55, type: 'normative', source: '규범: 사교육비 억제 목표 22만원/월(aspirational, 분포 최우수 전북 25만원 미달 수준) / 분포 최악 55만원(서울)' },
  // edu_univ 대학진학률 % (higher_better). 16광역 실분포: max=76%(세종), min=65%(강원).
  // green=78은 분포 최고 76을 초과, floor=64는 분포 최저 65 미만 → [A안] normative로 강등.
  edu_univ: { green: 78, floor: 64, type: 'normative', source: '규범: 대학진학률 향상 78% 지향(aspirational, 분포 최고 세종 76% 초과) / floor=64는 분포 최저 강원 65% 미만 aspirational 하한' },

  // ── Goal 5 성평등 ──
  // emp_female 여성경활참가율 % (higher_better). 성평등 규범상 남성 수준(약 73%) 도달이
  // 목표 → green=70(국내 상위·남성근접), floor=48(분포 최저).
  emp_female: { green: 70, floor: 48, type: 'normative', source: '규범: 성별 격차 해소(남성 경활 수준 근접 ~70%) / 분포 하위 48%' },

  // ── Goal 8 일자리 ──
  // emp_rate 고용률 % (higher_better). 16광역 실분포: max=68%(제주), min=58%(부산).
  // green=70은 분포 최고 68%를 초과하는 aspirational 정책목표 → [A안] normative로 강등.
  emp_rate: { green: 70, floor: 58, type: 'normative', source: '규범: 고용률 70% 정책목표(aspirational, 분포 최고 제주 68% 초과) / 분포 하위 58%(부산)' },
  // emp_unemp 실업률 % (lower_better). 완전고용 규범상 자연실업률 ~2.5~3%. green=2.0(우수),
  // floor=4.0(분포 최악).
  emp_unemp: { green: 2.0, floor: 4.0, type: 'normative', source: '규범: 완전고용 수준 실업률(~2%) / 국내 분포 하위 4%' },
  // emp_youth 청년실업률 % (lower_better). 16광역 실분포: best=5.0%(세종), worst=9.0%(부산).
  // [B안] 현재값과 정확히 일치.
  emp_youth: { green: 5.0, floor: 9.0, type: 'benchmark', source: '국내 16광역 분포 (상위 5.0%(세종) / 하위 9.0%(부산))' },

  // ── Goal 9 인프라 ──
  // trn_road 도로포장률 % (higher_better). 100% 포장이 자연 상한·규범 목표 → green=100,
  // floor=76(분포 최저).
  trn_road: { green: 100, floor: 76, type: 'normative', source: '규범: 완전 포장 100%(green) / 국내 분포 하위 76%(floor)' },

  // ── Goal 10 불평등 ──
  // wel_pension 국민연금 가입률 % (higher_better). 보편 가입이 규범 목표지만 적용대상
  // 정의상 100%는 비현실 → green=85(국내 상위·우수), floor=58(분포 최저). normative.
  wel_pension: { green: 85, floor: 58, type: 'normative', source: '규범: 보편적 노후소득보장 지향(우수 85%) / 분포 하위 58%' },
  // wel_elderly 노인복지시설 개/만명 (higher_better). 16광역 실분포: max=3.5(세종), min=2.0(울산).
  // [B안] 현재값과 정확히 일치.
  wel_elderly: { green: 3.5, floor: 2.0, type: 'benchmark', source: '국내 16광역 분포 (상위 3.5개/만명(세종) / 하위 2.0개/만명(울산))' },

  // ── Goal 11 도시 ──
  // hou_supply 주택보급률 % (higher_better). 100%(가구수=주택수)가 규범 균형점 → green=100,
  // floor=97(분포 최저). normative.
  hou_supply: { green: 100, floor: 97, type: 'normative', source: '규범: 주택수=가구수 균형 100%(green) / 분포 하위 97%(floor)' },
  // hou_area 1인당 주거면적 m² (higher_better). 16광역 실분포: max=38.0(강원), min≈28.5(서울).
  // [B안] green=38 정확, floor=28은 실제 최저 28.5 대비 ±0.5 허용오차 내.
  hou_area: { green: 38, floor: 28, type: 'benchmark', source: '국내 16광역 분포 (상위 38m²(강원) / 하위 ≈28.5m²(서울), floor=28은 ±0.5 허용오차 내)' },
  // hou_pir 주택가격소득비 배 (lower_better). 국제 주거부담 규범상 PIR 3~5배가 'affordable'.
  // green=4.5(affordable 상한), floor=15(서울 등 최악). normative.
  hou_pir: { green: 4.5, floor: 15, type: 'normative', source: "규범: 주거부담 적정 PIR 약 4.5배(green, 국제 'affordable' 기준) / 국내 분포 하위 15배(floor)" },
  // hou_rental 공공임대주택 비율 % (higher_better). OECD 평균 약 7%, 상위국 15%+.
  // green=15(상위국·정책 지향), floor=5(국내 최저). normative.
  hou_rental: { green: 15, floor: 5, type: 'normative', source: '규범: 공공임대 확충 지향(상위국 ~15%) / 국내 분포 하위 5%' },
  // env_park 1인당 공원면적 m² (higher_better). 16광역 실분포: max=25.0(세종), min=8.5(경기).
  // [B안] 구 green=20은 실분포 최고 25.0 미만 중간값 → 실제 max로 정정.
  env_park: { green: 25, floor: 8.5, type: 'benchmark', source: '국내 16광역 분포 (상위 25.0m²(세종) / 하위 8.5m²(경기)); WHO 권고 최소 9m² 참고' },
  // trn_public 대중교통 분담률 % (higher_better). 16광역 실분포: max=65%(서울), min=12%(강원·경북).
  // [B안] 구 green=50은 분포 중간, floor=10은 실제 최저 12 미만 → 실제 min/max로 정정.
  trn_public: { green: 65, floor: 12, type: 'benchmark', source: '국내 16광역 분포 (상위 65%(서울) / 하위 12%(강원·경북))' },
  // cul_facility 문화시설 개/만명 (higher_better). 16광역 실분포: max=4.0(세종), min=1.8(울산).
  // [B안] 현재값과 정확히 일치.
  cul_facility: { green: 4.0, floor: 1.8, type: 'benchmark', source: '국내 16광역 분포 (상위 4.0개/만명(세종) / 하위 1.8개/만명(울산))' },
  // cul_sports 체육시설 개/만명 (higher_better). 16광역 실분포: max=4.5(세종), min=2.5(인천·울산).
  // [B안] 현재값과 정확히 일치.
  cul_sports: { green: 4.5, floor: 2.5, type: 'benchmark', source: '국내 16광역 분포 (상위 4.5개/만명(세종) / 하위 2.5개/만명(인천·울산))' },

  // ── Goal 13 기후 ──
  // env_pm25 미세먼지 PM2.5 μg/m³ (lower_better). WHO 2021 연평균 가이드라인 5μg/m³(official).
  // green=5(WHO 권고), floor=18(국내 분포 최악). 출처 명확한 official.
  env_pm25: { green: 5, floor: 18, type: 'official', source: 'WHO Global Air Quality Guidelines 2021: 연평균 PM2.5 5μg/m³(green) / 국내 분포 하위 18(floor)' },
  // env_recycle 재활용률 % (higher_better). 16광역 실분포: max=68%(세종), min=55%(강원·경북).
  // [B안] 현재값과 정확히 일치.
  env_recycle: { green: 68, floor: 55, type: 'benchmark', source: '국내 16광역 분포 (상위 68%(세종) / 하위 55%(강원·경북))' },
  // env_sewage 하수처리율 % (higher_better). 100% 처리가 환경 규범 목표 → green=100,
  // floor=88(분포 최저). normative.
  env_sewage: { green: 100, floor: 88, type: 'normative', source: '규범: 완전 하수처리 100%(green) / 국내 분포 하위 88%(floor)' },

  // ── Goal 16 제도 ──
  // saf_crime 범죄발생률 건/만명 (lower_better). 16광역 실분포: best=22(세종), worst=42(서울).
  // [B안] 현재값과 정확히 일치.
  saf_crime: { green: 22, floor: 42, type: 'benchmark', source: '국내 16광역 분포 (상위 22건/만명(세종) / 하위 42건/만명(서울))' },
  // saf_traffic 교통사고 사망률 명/10만명 (lower_better). 16광역 실분포: best=3.5(서울), worst≈9.8(경북).
  // [B안] green=3.5 정확. floor=10은 실제 최악 9.8 대비 ±0.5 허용오차 내.
  saf_traffic: { green: 3.5, floor: 10, type: 'benchmark', source: '국내 16광역 분포 (상위 3.5명/10만(서울) / 하위 ≈9.8명/10만(경북), floor=10은 ±0.5 허용오차 내); Vision Zero 규범 참고' },
  // saf_fire 화재발생건수 건/만명 (lower_better). 16광역 실분포: best=3.5(세종), worst=6.2(강원).
  // [B안] 현재값과 정확히 일치.
  saf_fire: { green: 3.5, floor: 6.2, type: 'benchmark', source: '국내 16광역 분포 (상위 3.5건/만명(세종) / 하위 6.2건/만명(강원))' },
};
