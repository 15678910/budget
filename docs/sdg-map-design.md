# 한국 지역 SDG 지도 — 설계 문서

> 시도·시군구별 지속가능발전목표(SDG/K-SDGs) 현황을 Palantir식 지도로 시각화.
> 작성: 2026-06 / A(설계) → B(시도 MVP) → C(KOSIS 전체 수집)

## 1. 목적 & 원칙
- 17개 SDG goal별로 **한국 지역(시도→시군구)** 현황을 지도(choropleth)로 비교
- 원칙(중립·정직):
  1. **통합 'SDG 점수'는 날조 금지** — 한국 지역 단위 공식 SDG 종합점수는 미공개.
     → goal별 **대표 지표(출처 명시)** 기반 시각화로 제시. "이 지표 = SDG 달성도"라고 단정하지 않음.
  2. 모든 지표에 **출처·연도·해석방향(↑좋음/↓좋음)** 표기.
  3. 데이터 없는 goal·지역은 **"데이터 준비중/미제공"** 으로 정직 표기 (빈칸 채우기 금지).

## 2. 데이터 현실 (조사 결과)
| 단위 | SDG 데이터 | 가용성 |
|---|---|---|
| 국가(한국) | sdgindex.org, ncsd.go.kr | ✅ (1점, 비교 맥락) |
| 시도(17) | 통합점수 미공개. **KOSIS goal별 대표지표는 시도별 존재** | ⚠️ 지표 수집·매핑 필요 |
| 시군구(226) | 종합 SDG 거의 미공개 | ❌ 개별 지표 근사만 |

- 글로벌 소스(sdgindex/impactlibrary) = 국가 단위 → 지역 분해 불가
- 한국 지역 SDG = **KOSIS(국가통계포털) 지표를 goal별로 조립** 필요 (KOSIS OpenAPI 키, 무료)

## 3. Goal ↔ 대표 지표 매핑 (Phase별)
| SDG | 대표 지표 | 출처 | 보유 |
|---|---|---|---|
| 1 빈곤 | 상대빈곤율/기초수급 비율 | KOSIS | C |
| 3 건강 | 기대수명/의료접근 | KOSIS | C |
| **4 교육** | **대학 진학률** | 한국교육개발원(보유) | ✅ B |
| 5 성평등 | 성평등지수 | 여가부/KOSIS | C |
| 8 일자리 | 고용률/실업률 | KOSIS | C |
| 10 불평등 | 지니계수/소득격차 | KOSIS | C |
| 11 지속가능도시 | 1인당 공원/대중교통 | KOSIS | C |
| 13 기후 | 1인당 온실가스/재생에너지 | 환경부/KOSIS | C |
| **16 제도** | **재정자립도(지방재정 자율)** ※proxy | 지방재정365(보유) | ✅ B |
| … | … | … | C |

→ **Phase B(MVP)**: 보유 실데이터(진학률=Goal4, 재정자립도=Goal16 proxy)로 지도 프레임워크 구동.
→ **Phase C**: KOSIS 키로 나머지 goal 지표 시도별 수집.

## 4. 온톨로지 (Palantir식)
```
[SDG Goal] (17: 번호·명칭·색·아이콘)
   │ 대표지표
[지표] (label, 출처, 연도, 해석방향)
   │ 측정
[지역] 시도(17) → 시군구(226)  ←── korea-provinces / municipalities TopoJSON(보유)
   │
[시각화] choropleth(색칠) + 순위 + 드릴다운 + 출처
```

## 5. 기술 아키텍처
- `src/lib/sdg/goals.ts` — 17 goal 정의 + goal별 지표 데이터(시도값, 출처, 해석방향)
- `src/components/sdg/SDGMapDashboard.tsx` — goal 선택 + 시도 choropleth(d3-geo 재사용) + 순위·출처
- `src/app/sdg/page.tsx` — TopoJSON 로드 → 대시보드
- 교육 지도(EducationKoreaMap) 패턴 재사용(휠줌·드래그·드릴)
- Phase C: `scripts/fetch-kosis-sdg.mjs` (KOSIS OpenAPI) → `public/data/sdg-sido.json`

## 6. UI (Palantir)
- 좌: 17 SDG goal 그리드(번호·색·아이콘) 선택
- 중: 시도 choropleth(선택 goal 지표로 색칠) + hover 값
- 우: 시도 순위 + 지표 정의·출처·해석방향 + 데이터 상태(실데이터/준비중)
- 상단: 중립·지표해석 고지

## 7. 다음 액션
1. **B(MVP)**: 진학률(Goal4)·재정자립도(Goal16) 실데이터로 시도 지도 — 즉시 구축
2. **C**: KOSIS OpenAPI 키(무료, kosis.kr) 발급 → goal별 시도 지표 수집 → 17 goal 채움
3. 시군구 확장은 가용 지표 한도 내(honest 제한)
