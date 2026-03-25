# 마을살림/나라살림 프로젝트 규칙

## 기술 스택
- Next.js 16 (App Router, Turbopack)
- React 19, TypeScript 5 strict
- Tailwind CSS v4
- Gemini 2.0 Flash API (무료 티어)
- Vercel 배포 (Hobby plan)

## 파일 구조 규칙

### 컴포넌트 규칙
- 컴포넌트 파일: **300줄 이하** 권장, 500줄 초과 금지
- 300줄 초과 시 반드시 서브 컴포넌트로 분리
- 타입 정의: 같은 폴더의 `types.ts`에 분리
- 유틸리티 함수: 같은 폴더의 별도 파일 또는 `src/lib/`에 배치

### API Route 규칙
- API route 파일: **300줄 이하** 권장
- 비즈니스 로직은 `src/lib/` 모듈로 분리
- JSON 파싱: `src/lib/simulation/json-parser.ts` 사용
- 시뮬레이션 fallback: `src/lib/simulation/local-fallback.ts` 사용

### 명명 규칙
- 컴포넌트: PascalCase (`FiscalDoctorDashboard.tsx`)
- 유틸리티/모듈: kebab-case (`download-helpers.ts`)
- 타입 파일: `types.ts`
- API route: `route.ts` (Next.js 규칙)
- 한국어 변수명 금지 (주석/문자열은 한국어 OK)

### Import 규칙
- 외부 라이브러리 → 내부 모듈 → 상대 경로 순서
- `@/` 절대 경로 사용 (`src/lib/`, `src/components/`)
- barrel export (`index.ts`) 선택적 사용

## 코드 품질 규칙

### 금지 패턴
- ❌ `console.log` / `console.error` (클라이언트 컴포넌트에서)
- ❌ `any` 타입 사용
- ❌ `html2canvas` (Tailwind v4 lab() 색상 미지원 → `window.print()` 사용)
- ❌ 인라인 스타일 (`style={{}}`) — Tailwind 클래스 사용
- ❌ API 키를 소스코드에 하드코딩
- ❌ `Math.random()` (시뮬레이션 fallback에서 — 결정론적 값 사용)

### 필수 패턴
- ✅ 모든 API route에 에러 핸들링 (`try/catch`)
- ✅ 외부 API 호출 시 타임아웃 설정
- ✅ 캐시 사용 시 최대 크기 제한 (100건 초과 시 `cache.clear()`)
- ✅ Gemini API 호출 시 `checkGeminiRateLimit()` + `markGeminiCall()` 사용
- ✅ Gemini 429 에러 시 최대 3회 재시도 후 fallback
- ✅ 비밀번호 비교 시 `timingSafeEqual` 사용
- ✅ 타입은 별도 `types.ts` 파일에 정의

### 비용추계 규칙
- 표준단가 모듈 (`src/lib/data/standard-costs.ts`) 사용 필수
- 정책 카테고리 12개: hospital, infrastructure, education, housing, bank, digitalCurrency, ai, welfare, environment, tourism, culture, general
- 복합 정책: `calculateCompoundCost()` 사용 (시너지 할인 15%)
- 산출방식 텍스트 반드시 포함 (`methodology` 필드)
- 벤치마크 출처 반드시 포함 (`benchmarks` 필드)

## Gemini API 규칙
- 무료 티어: 15 RPM, 1,500 RPD
- 공유 레이트 리미터: `src/lib/gemini-rate-limiter.ts`
- 일일 한도: simulate route 1,000회
- 429 에러 시: 5/7/9초 간격 3회 재시도 → fallback
- 응답 파싱: `extractJSON()` + `cleanJSON()` 사용
- `temperature: 0` (시뮬레이션), `temperature: 0.3` (챗봇)
- `responseMimeType: "application/json"` (시뮬레이션)

## 캐시 전략
- 시뮬레이션 결과: 24시간 TTL, MultiPerspectiveResult 전체 캐시
- 정책 챗봇: 10분 TTL, 최대 200건
- 법률안/조례 검색: 5분 TTL, 최대 100건
- 최적화 결과: 30분 TTL, 최대 100건

## 배포 규칙
- 로컬 전용: `.env.local` (git에 포함 금지)
- Vercel 환경변수: GEMINI_API_KEY, NABO_API_KEY, DATABASE_URL 등
- PDF/대용량 파일: `.gitignore`에 추가
- 커밋 전 반드시: `npx tsc --noEmit` + `npx next build` 통과 확인

## 자주 발생하는 실수
1. `html2canvas` 사용 → Tailwind v4 lab() 색상 에러 → `window.print()` 사용
2. Gemini fallback 시 `general` 카테고리로 빠짐 → 키워드 매칭 확인
3. `.env.local`의 API 키에 불필요한 문자 포함 (예: "발" 접두사)
4. 모바일에서 헤더 메뉴 겹침 → 햄버거 메뉴 사용
5. 시뮬레이션 캐시가 fiscal만 저장 → MultiPerspectiveResult 전체 저장
6. 조례 API가 HTTP → HTTPS 사용 필수
7. Admin 인증: 평문 비교 금지 → `timingSafeEqual` 사용

## 수정 금지 영역
- `src/lib/data/fiscal-health-data.ts` — 재정 데이터 원본 (수동 검증 필요)
- `src/lib/data/standard-costs.ts` — NABO 표준단가 (출처 변경 시 전체 검증 필요)
- `.env.local` — API 키 (자동 수정 금지)

## 작업 템플릿
### 새 시뮬레이터 추가 시
1. `src/components/{name}/` 폴더 생성
2. `types.ts` 타입 정의
3. 메인 컴포넌트 (300줄 이하)
4. `src/app/{route}/page.tsx` 페이지 생성
5. AISidebar에 섹션 추가
6. Header에 네비게이션 추가

### 새 API route 추가 시
1. `src/app/api/{path}/route.ts` 생성
2. 입력 검증 + 에러 핸들링
3. 캐시 (TTL + 100건 제한)
4. 외부 API 호출 시 타임아웃 + 재시도

## 컨텍스트 엔지니어링 규칙 (GSD 원칙)

### 작업 원자화
- 한 번에 **1개 파일만** 수정 (여러 파일 동시 수정 시 버그 확률 증가)
- 큰 기능은 반드시 **3단계 이하**로 분할 후 순차 실행
- 각 단계 완료 후 **빌드 검증** 필수

### 컨텍스트 관리
- 대화가 50턴 이상 길어지면 새 세션 시작 권장
- 이전 세션 요약을 `.claude/` 폴더에 MD 파일로 저장
- 서브 에이전트에게는 **전체 대화가 아닌 구조화된 문서**만 전달

### 검증 자동화
- 코드 변경 후 반드시 검증 커맨드 실행
- 시뮬레이션 결과는 NABO 표준단가 범위 내인지 자동 검증
- 검증 없이 "완료" 선언 금지

## 검증 테스트 규칙

### 시뮬레이션 비용추계 검증
- 공공병원: 초기비용 400-1,200억원 범위
- 공공은행: 초기비용 300-1,000억원 범위
- 지역화폐/블록체인: 초기비용 30-500억원 범위
- 도로/인프라: 초기비용 300-5,000억원 범위
- 복합정책 시너지 할인: 정확히 15%
- 운영비: 초기비용의 3-35% 범위

### API 응답 검증
- Gemini 429 시: 5초 대기 후 재시도, 3회 실패 시 fallback
- NABO API: 응답 코드 INFO-000 확인
- 조례 API: HTTPS 사용 확인

## 배포 전 체크리스트
- [ ] `npx tsc --noEmit` 통과
- [ ] `npx next build` 통과
- [ ] 클라이언트 `console.log` 없음
- [ ] API 키 소스코드에 없음
- [ ] 새 환경변수는 Vercel에도 추가
- [ ] 모바일 레이아웃 확인
- [ ] 시뮬레이션 비용추계 범위 검증 통과
- [ ] PDF 다운로드 정상 작동
