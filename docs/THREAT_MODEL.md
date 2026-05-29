# 위협 모델 (THREAT_MODEL)

**목적**: 마을살림/나라살림(budget) 프로젝트의 자산(asset)·위협(threat)·완화(mitigation)를 명문화. CLAUDE.md PART 10 자산.

**갱신 원칙**: 도메인 변경·schema 변경·새 위협 발견 시 즉시 업데이트. `tests/test_threat_scenarios.ts`와 1:1 대응.

---

## 1. 시스템 개요

- **도메인**: 공공 지방재정 데이터 시각화 및 AI 분석 플랫폼 (마을살림/나라살림)
- **기술 스택**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Gemini 2.0 Flash API, Neon (PostgreSQL serverless), Vercel
- **배포 환경**: Vercel (Hobby plan)
- **사용자 클래스**: anonymous(일반 사용자) / admin(관리자, 별도 패스워드 인증)

---

## 2. 자산 (Asset Inventory)

| ID | 자산 | 민감도 | 우선순위 | 위치 |
|----|----|------|---------|----|
| A1 | 관리자 패스워드 (ADMIN_PASSWORD) | High | C | Vercel 환경변수 |
| A2 | Gemini API Key | High | C | Vercel 환경변수 |
| A3 | Neon DATABASE_URL (PostgreSQL connection string) | Critical | C | Vercel 환경변수 |
| A4 | 분석 결과 데이터 (예산 시뮬레이션, AI 응답) | Medium | I | Neon DB / API 응답 캐시 |
| A5 | 공공 재정 원본 데이터 (열린재정, LOFIN 등) | Low | A | 외부 API / 정적 파일 |
| A6 | 사용자 익명 세션 토큰 | Low | C | 쿠키 / localStorage |

---

## 3. 신뢰 경계 (Trust Boundaries)

| 경계 | 외부 (untrusted) | 내부 (trusted) | 검증 메커니즘 |
|------|---------------|-------------|------------|
| B1 | 익명 사용자 | 관리자 | ADMIN_PASSWORD bcrypt 검증 (C4 fix 2026-05-27) |
| B2 | Next.js 클라이언트 | API Routes (서버) | 서버사이드 env var 접근만 허용 |
| B3 | API Routes | Neon DB | DATABASE_URL 환경변수 전용 |
| B4 | API Routes | Gemini API | GEMINI_API_KEY 환경변수 전용 |

---

## 4. 위협 카탈로그 (Threat Catalog)

### A. 인증·세션 (Auth & Session)

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-A1 | ADMIN_PASSWORD 평문 비교 (timing attack) | A1 | Low (이미 수정) | High | bcrypt 비교 적용 (C4 fix 2026-05-27) | test_a1_admin_password_bcrypt |
| T-A2 | 관리자 세션 hijacking | A1 | Med | High | HttpOnly 쿠키 + CSRF 토큰 필요 (TODO: 검증) | test_a2_session_hijack |
| T-A3 | ADMIN_PASSWORD 미설정 → 빈 문자열 비교 허용 | A1 | Low | Critical | fail-fast: 미설정 시 서버 거부 필요 (TODO) | test_a3_admin_pw_failfast |

### B. 권한·Scope

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-B1 | 일반 사용자가 관리자 API 직접 호출 | A4 | Med | High | 서버사이드 admin 인증 미들웨어 확인 필요 | test_b1_admin_api_bypass |
| T-B2 | AI 분석 API 무인증 과호출 | A2, A4 | High | Med | checkGeminiRateLimit() 적용 (CLAUDE.md 필수 패턴) | test_b2_gemini_rate_limit |

### C. Secret·Credential

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-C1 | Neon DATABASE_URL git 노출 | A3 | High | Critical | .gitignore, Vercel env 전용, connection string 커밋 금지 | test_c1_no_db_url_in_git |
| T-C2 | GEMINI_API_KEY VITE_ prefix로 클라이언트 노출 | A2 | Med | High | VITE_ 없이 서버 전용 사용 (CLAUDE.md §Vercel env 규칙) | test_c2_gemini_key_client_leak |
| T-C3 | 하드코딩된 API 키 소스코드 포함 | A2, A3 | Low (CLAUDE.md 금지) | Critical | 금지 패턴 lint 규칙 적용 | test_c3_no_hardcoded_keys |

### D. Input·Injection

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-D1 | SQL injection via Neon raw query | A3, A4 | Med | Critical | parameterized query 전수 확인, Neon SDK 파라미터 바인딩 사용 | test_d1_sql_injection_neon |
| T-D2 | Gemini API prompt injection (사용자 입력) | A2, A4 | Med | Med | 사용자 입력 샌드박싱 + 시스템 프롬프트 고정 | test_d2_prompt_injection |
| T-D3 | JSON parsing 오류 → unhandled exception | A4 | Low | Med | json-parser.ts 모듈 사용 (CLAUDE.md 규칙) | test_d3_json_parse_error |

### E. Data Integrity

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-E1 | AI 분석 캐시 오염 (100건 초과) | A4 | Low | Med | cache.clear() on overflow (CLAUDE.md 필수 패턴) | test_e1_cache_overflow |
| T-E2 | 공공 API 응답 위조 (MITM) | A5 | Low | Med | HTTPS 강제, 응답 schema 검증 필요 | test_e2_public_api_mitm |

### F. Rate / Abuse

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-F1 | Gemini API quota 소진 (DDoS) | A2 | High | High | checkGeminiRateLimit() + markGeminiCall() 필수 | test_f1_gemini_quota_dos |
| T-F2 | Neon DB connection pool 고갈 | A3 | Med | High | 타임아웃 설정 (CLAUDE.md 필수 패턴) | test_f2_db_connection_exhaust |

### G. Domain-Specific (공공 재정 분석)

| ID | 위협 | 자산 | 가능성 | 영향 | 완화 | 회귀 테스트 |
|----|----|----|------|----|----|----------|
| T-G1 | AI 할루시네이션 → 잘못된 예산 분석 결과 제공 | A4 | High | Med | 면책 문구 필수 표시, 시뮬레이션 fallback 결정론적 값 사용 | test_g1_ai_hallucination_disclaimer |
| T-G2 | Math.random() 시뮬레이션 fallback 사용 → 비결정론적 | A4 | Low (CLAUDE.md 금지) | Med | 금지 패턴, local-fallback.ts 결정론적 값 강제 | test_g2_random_in_simulation |

---

## 5. 완화 매트릭스 (Mitigation Matrix)

| 위협 | Layer 1 (예방) | Layer 2 (탐지) | Layer 3 (복구) |
|------|------------|------------|------------|
| T-A1 | bcrypt 비교 | 인증 실패 로그 | 패스워드 rotate |
| T-C1 | .gitignore + Vercel env | git secret scan | DB URL rotate |
| T-D1 | parameterized query | DB 에러 로그 | 쿼리 차단 + 패치 |
| T-F1 | rate limit 함수 | Gemini 에러 응답 | API key rotate |
| T-G1 | 면책 문구 UI | 사용자 피드백 | 분석 결과 정정 |

---

## 6. 미결 위협 (Open / DEFER)

| ID | 위협 | 사유 | 예상 시간 | 우선순위 |
|----|----|----|---------|------|
| T-A2 | 세션 CSRF 토큰 검증 | 미구현 | 3h | High |
| T-A3 | ADMIN_PASSWORD fail-fast | 미구현 | 1h | High |
| T-B1 | 관리자 미들웨어 전수 확인 | API route 늘어남에 따라 | 2h | High |
| T-D1 | Neon raw query SQL injection 감사 | 전수 코드 리뷰 필요 | 4h | High |

---

## 7. 위협-자산 매트릭스 (heat map)

| 자산 \ 위협 | T-A1 | T-A3 | T-C1 | T-C2 | T-D1 | T-F1 | T-G1 |
|----------|------|------|------|------|------|------|------|
| A1 (ADMIN_PW) | 🔴 | 🔴 | - | - | - | - | - |
| A2 (Gemini Key) | - | - | - | 🔴 | - | 🔴 | - |
| A3 (DB URL) | - | - | 🔴 | - | 🔴 | 🟠 | - |
| A4 (분석 결과) | - | - | - | - | 🟠 | 🟠 | 🟠 |
| A5 (공공 데이터) | - | - | - | - | - | - | 🟡 |

범례: 🔴 Critical/High · 🟠 Medium · 🟡 Low

---

## 8. 변경 이력

| 날짜 | 변경 | 작성 |
|------|----|----|
| 2026-05-30 | 초기 작성 — Glasswing 영감 P1-D, bcrypt 패치(C4 2026-05-27) 반영 | P1-D |
