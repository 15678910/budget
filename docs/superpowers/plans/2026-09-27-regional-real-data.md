# 0단계 — 지역지도·지역재정 비교를 실제 데이터로 교체

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** `/regional`, `/regional-compare`, `/compare`, `/api/budget/data?view=metro|district`가 읽는 `data/processed/regional-*.json`을 **난수 표본 데이터**(`scripts/generate-regional-data.ts`, seeded PRNG)에서 **지방재정365 세부사업별 세출(OpenAPI `QWGJK`) 집계**로 바꾼다.

**배경 (2026-09-27 확인):**
- 현행 데이터는 "realistic sample data" — 전국 평균 분야 비율 × 0.8~1.2 난수. 서울 농림해양수산 2.5조(5.3%) 같은 불가능한 값이 화면에 나온다.
- `QWGJK`: `https://www.lofin365.go.kr/lf/hub/QWGJK?Key=&Type=json&pIndex=&pSize=&fyr=<연도>&exe_ymd=<YYYYMMDD>[&laf_cd=<7자리>]`. `fyr`·`exe_ymd` 필수. 필드: fyr, wa_laf_cd, wa_laf_hg_nm, laf_cd, laf_hg_nm, acnt_dv_cd, acnt_dv_nm, dept_cd, dbiz_cd, dbiz_nm, exe_ymd, **bdg_cash_amt(예산현액)**, bdg_ntep(국비), capep(시도비), sggep(시군구비), etc_amt, **ep_amt(지출액)**, cpl_amt, fld_cd, **fld_nm(분야)**, ane_part_cd, **part_nm(부문)**, padm_laf_cd, lup_ord, zon_cd. 단위 원.
- 행 수: 2022~2025 연말(`exe_ymd=YYYY1231`) 각 46.6만~48.0만, 2026 최신 기준일 **20260926**(중랑구 1,153건). 요청제한 없음.
- 인증키: `.env.local`의 `LOFIN_API_KEY`. **키 값을 출력·로그·커밋하지 않는다.**
- 데이터 파일 `data/processed/regional-*.json`은 git 추적 중. 원자료(`data/regional/**`)는 gitignore.

## 설계 결정
1. **광역 = 본청만.** 광역 노드 금액은 `laf_cd`가 `wa_laf_cd`와 같은 본청 행만 합산한다. 시·군·구는 각자 따로. 본청+시·군·구 단순 합산은 시·도→시·군·구 이전재원(조정교부금·시도비 보조)을 두 번 센다. 화면에 "시·도 본청 예산(소속 시·군·구 제외)"라고 적는다.
2. **내부거래·보전지출 제외.** 분야 비교에는 회계 간 이동을 뺀다. 판정 규칙: 세부사업명(`dbiz_nm`)에 「내부거래」 또는 「보전지출」이 **포함**되면 제외한다(시작 문자열만 보는 규칙은 `기획예산과 내부거래지출`, `○○기금(보전지출)`, `내부거래(자체)` 등을 놓쳐 연 1.8~2.1조원이 새서 포함 규칙으로 바꿨다). 2025년 새로 제외되는 145개 사업명 표본을 전수 확인한 결과 전부 회계·기금 간 내부거래 또는 보전지출 계정이었고, 실제 사업인데 우연히 `보전지출`을 이름에 포함한 사례는 없었다(예: `환경보전사업`처럼 `보전`만 들어간 이름은 `보전지출` 문자열이 아니므로 규칙에 걸리지 않는다) — 별도 예외 없음. 제외액은 연도별 전국 합계를 메타(`excludedTransfersEok`)에 기록하고 화면 각주에 적는다.
3. **금액 = 예산현액**(최종 예산, `bdg_cash_amt`). 집행액(`ep_amt`)도 함께 저장해 두되 0단계 화면은 예산현액만. 연도: 2023·2024·2025는 연말(12.31) 기준, 2026은 최신 기준일.
4. **분야명 매핑**: 원자료 `fld_nm` → 기존 14개 이름. `산업ㆍ중소기업및에너지`→`산업중소기업및에너지`, `예비비`→`예비비기타`, 목록 밖 → `기타`. `과학기술`은 원자료에 없으면 0행.
5. **회계구분**: `acnt_dv_nm == '일반회계'` → 일반회계, 이름에 `기금` 포함 → 기금, 나머지 → 특별회계. (`BudgetItem.accountType` 타입이 이미 3종)
6. 가짜 데이터 생성기 `scripts/generate-regional-data.ts` 삭제.

---

### Task 1: 원자료 수집 스크립트
**Files:** Create `scripts/fetch-lofin-projects.py` (stdlib only).
- 연도·기준일: 2023/20231231, 2024/20241231, 2025/20251231, 2026/최신(오늘부터 하루씩 거꾸로 `laf_cd=1117000`로 존재 확인, 최대 30일).
- 연도마다 `pSize=1000`으로 전체 페이지 수집(총건수는 첫 응답의 `list_total_count`). 재시도 3회(지수 대기), 호출 간 0.3초. 진행률 출력.
- 저장: `data/regional/lofin-projects/<year>.csv.gz`(모든 필드), `_source.md`(연도별 기준일·행 수·수집일·API 설명). 키는 `.env.local`에서 읽고 절대 출력하지 않는다.
- 이어받기: 이미 있는 연도 파일은 건너뛰는 `--force` 없는 기본 동작.
- 커밋: 스크립트만. `chore(scripts): 지방재정365 세부사업별 세출(QWGJK) 수집 스크립트`

### Task 2: 집계·생성
**Files:** Create `scripts/build-regional-from-lofin.py`; Modify `scripts/build-regional-hierarchy.ts` (광역 = 본청만); Delete `scripts/generate-regional-data.ts`; Regenerate `data/processed/regional-flat-{2023..2026}.json`, `regional-by-metro-*.json`, `regional-by-district-*.json`, `regional-metadata.json`.
- `regional-flat` 스키마 유지: `{fiscalYear, regionCode(시도 2자리), regionName(시도 정식명), districtCode('000'=본청, 그 외 laf_cd 3~5자리), districtName('본청' 또는 자치단체명), functionName, accountType, amount(백만원, 반올림)}` + 추가 필드 `executed`(백만원). 기존 소비 코드가 추가 필드를 무시하는지 확인.
- 시도 정식명: 기존 파일의 regionName 17종과 같게(강원특별자치도·전북특별자치도 등). 2026년 전남·광주 통합 등 이름 변경이 원자료에 있으면 원자료를 따르지 말고 기존 17개 이름에 맞추되 메타에 적는다.
- `regional-metadata.json`: `source: 'lofin365-QWGJK'`, 연도별 `asOf`(기준일), `excludedTransfersEok`(연도별 전국 제외액), `note`.
- 검증(테스트 `src/lib/data/__tests__/regional-real.test.ts`): 4개 연도 모두 17개 시도·본청 17행 이상; 서울 본청 농림해양수산 비중 < 2%; 연도별 시·군·구 수 ≥ 220; `metadata.source === 'lofin365-QWGJK'`; 가짜 생성기 파일이 없다.
- 커밋: `feat(data): 지역 예산을 지방재정365 세부사업별 세출 집계로 교체 — 난수 표본 데이터 제거`

### Task 3: 화면 문구
**Files:** `/regional`(KoreaMap·RegionDetailPanel), `/regional-compare`(RegionalCompareDashboard), `/compare`, `DataSources`.
- 출처 문구: "지방재정365 세부사업별 세출(예산현액) · 연도별 기준일 · 회계 간 내부거래·보전지출 제외". "예산안 기준이며 실제 집행액과 다를 수 있습니다" 같은 틀린 문구 제거.
- 광역 총액 옆: "시·도 본청 예산(소속 시·군·구 제외)".
- 커밋: `fix(regional): 지역 예산 화면 출처·기준 문구를 실제 데이터에 맞게`

### Task 4: 검증
- 브라우저: 지역지도 17개 시도 색·금액, 시군구 클릭, 지역재정 비교(서울 vs 경기 분야별이 서로 다른 비율), `/compare`. tsc·eslint·jest·build. 푸시는 사용자에게 묻는다.
