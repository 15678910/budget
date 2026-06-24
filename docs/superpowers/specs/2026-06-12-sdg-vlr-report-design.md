# VLR 지역 자기평가 리포트 — 설계 명세

**작성일**: 2026-06-12
**상태**: 설계 확정 (구현 대기)
**근거**: UN-Habitat Action-Oriented VLR Methodology (2024), VLR Guidelines Vol.1/2. A단계(달성도·신호등) 위에 구축.

---

## 1. 목적
광역 자치단체가 **국제 VLR(Voluntary Local Review) 표준 6단계 구조**로 자기평가 리포트를 한 화면에서 자동 생성하고 인쇄(PDF)할 수 있게 한다. 데이터는 기존 자산(달성도 점수·신호등·재정·K-SDGs 세부목표)에서 파생.

## 2. 핵심 결정 (확정)
| # | 결정 | 값 |
|---|------|----|
| D1 | 산출 | **화면 리포트 + 인쇄(PDF) 친화** (`window.print()`, html2canvas 금지) |
| D2 | 범위 | **광역 단위** (실데이터 보유). 기초는 후속 |
| D3 | 내러티브 | ①·⑥ 섹션은 **규칙형 템플릿 + 데이터 bullet** (자유 생성 X) |
| D4 | 정직성 | 전부 데이터 파생, 면책 상시, 정책 인과 주장 0 |

## 3. 6단계 구조 (UN-Habitat) — 자동 채움
| 섹션 | 내용 | 출처 |
|------|------|------|
| ① 배경·지역 맥락 | 지역명·인구·예산규모·재정자립도/자주도·채무 + 거버넌스 안내(템플릿) | fiscal-health-data |
| ② SDG 지역화 현황 | K-SDGs 연계 문구 + 데이터 보유 N/17 목표 + 평가 방법(SDSN) | ksdgs.json·matrix |
| ③ 목표별 진행 현황 | 17목표 **달성도 점수 + 신호등 표/게이지** | scoring/achievement |
| ④ 우선 목표 심층 | **강점 Top3 / 약점 Top3 자동 도출**(달성도순) + 각 목표 K-SDGs 세부목표 | achievement·ksdgs |
| ⑤ 이행 수단 | 재정 맥락(예산·자립도·채무) + 예산 규모 대비 관점 | fiscal |
| ⑥ 교훈·향후 계획 | 약점 목표 기반 **규칙형 요약**("X 목표 달성도 낮음 → 점검 권장") + 면책 | rule-based |

## 4. 컴포넌트
| 파일 | 책임 | 신규/수정 |
|------|------|-----------|
| `src/lib/sdg/vlr.ts` | `buildVLR(region, deps)` → 6섹션 구조화 데이터 (순수) | 신규 |
| `src/components/sdg/VLRReport.tsx` | 6섹션 리포트 + 지역 선택 + 🖨 인쇄 | 신규 |
| `src/app/sdg/vlr/page.tsx` | 라우트, 서버측 데이터 주입 | 신규 |
| `src/app/(ai-society)/sdg/vlr/...` | (라우트 그룹 위치 주의 — 실제 sdg는 `(ai-society)/sdg` 아래) | — |
| print CSS | `@media print`로 헤더·허브 사이드바·네비 숨김, 리포트만 | 신규/수정 |

### 4.1 buildVLR API
- 입력: `region`(CANON_16) + deps(achievement·fiscalByRegion·ksdgs·matrix). 순수 함수(정적 import 가능한 건 내부에서).
- 출력: `{ region, context, localization, goalProgress[], priorities{strengths[],weaknesses[]}, means, lessons }`.
- 강점/약점: 달성도 점수 내림/오름차순 Top3 (데이터 보유 목표만). 데이터 없는 목표는 '준비중' 제외.

## 5. 라우트/위치
- `/sdg/vlr` (라우트 그룹 `(ai-society)/sdg/vlr`). 광역 프로파일·SDG 상황판에서 'VLR 리포트' 링크.
- URL 쿼리 `?region=서울` 또는 페이지 내 드롭다운으로 지역 선택(클라).

## 6. 인쇄 (print CSS)
- `@media print`: 글로벌 헤더·AI허브 사이드바·챗봇·네비 `display:none`. 리포트 컨테이너만 전체폭. 페이지 브레이크 섹션 단위.
- 🖨 버튼 → `window.print()`. (html2canvas/PDF 라이브러리 미사용.)

## 7. 검증
- jest `vlr.test.ts`: buildVLR이 6섹션 채움, 강점/약점 Top3 정렬 정확, 데이터 없는 목표 제외, region 없으면 방어.
- 컴포넌트: tsc + build + 프리뷰(리포트 렌더·지역 전환·인쇄 미리보기 레이아웃). 콘솔 0.

## 8. 정직성/거버넌스
- 전부 데이터 파생. 내러티브 규칙형(자유생성 X). 상시 면책: "데이터 기반 자기진단 · 정책 인과 아님 · SDSN/UN-Habitat VLR/K-SDGs 방법론 인용". 달성도(목표 대비)와 상대점수 구분 유지.
- feat 브랜치 → 리뷰 → 병합.

## 9. 비범위 (후속)
- 추세·목표갭(B)·연계성(C)·실효성(D)을 각 섹션에 후속 연결.
- 기초 시군구 VLR → 후속(데이터 희소).
- VLR 텍스트 AI 윤문 → 후속(옵션, 규칙형 기본 유지).
