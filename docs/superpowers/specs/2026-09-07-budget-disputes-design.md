# 예산분쟁 카테고리 — 설계 문서

- 작성일: 2026-09-07
- 상태: 승인됨 (구현 대기)
- 산출물: `/disputes` 목록과 `/disputes/[slug]` 상세, 분쟁 3건

---

## 1. 목적

매년 반복되는 예산 갈등을 한곳에 모은다. 독자는 세 가지를 하고 나간다.

1. 쟁점이 무엇인지 이해한다
2. 지금 어느 단계인지 확인한다
3. 각 측 주장을 수치로 검증한다

이 사이트는 예산을 **금액**으로는 이미 보여준다(트리맵·테이블·비교). 그러나
**무엇을 두고 다투는가**는 다루지 않는다. 그 공백을 메운다.

### 1.1 다루지 않는 것 (YAGNI)

- 필터·검색·태그 — 분쟁이 3건뿐이다
- 댓글·투표 — 여론 수집은 이 도구의 목적이 아니다
- 분쟁 자동 발굴 — 무엇이 분쟁인지는 사람이 정한다
- 관리자 편집 화면 — 데이터 파일 수정으로 충분하다

---

## 2. 범위

첫 출시에 세 건을 담는다. 세 건은 서로 연결돼 있어 함께 놓을 때 구조가 드러난다.

| 분쟁 | 규모 | 단계 | 검증 |
|---|---|---|---|
| 지방교육재정교부금 개편 | 78.9조원 (차액 약 21조) | 국회 제출 (의안 2221053) | 산식 계산기 |
| 미래대응기금 | 162.3조원 (여유자금 104.4조) | 예산안 심사 | 시나리오 비교 |
| 공적연금 적자 보전 | 연 10조원 (40년 629조) | 상시 | 없음 — 대조표로 대체 |

연금에 계산기를 두지 않는 이유는 데이터 부족이 아니라 **모델 신뢰도**다. 자동조정장치는
한국에 도입된 적이 없어 계산 결과가 전부 가정이 된다. 「출처 없는 숫자는 쓰지 않는다」는
기존 원칙과 충돌하므로, 확인된 수치(의무지출 8.5% 대 재량지출 8.3% 등) 대조표로 대체한다.

---

## 3. 화면 구성

### 3.1 상세 화면 (`/disputes/[slug]`)

| 절 | 내용 | 성격 |
|---|---|---|
| ① 요약 | 한 문장 쟁점 + 핵심 수치 3개 + 현재 단계 | 정적 |
| ② 진행 | 타임라인 (입법예고 → 국무회의 → 제출 → 소위 → 본회의) | 추적 어댑터 |
| ③ 쟁점 | 찬/반/중립 대조 — 주체·주장·근거·출처 | 정적 |
| ④ 숫자로 보기 | 분쟁별 계산기 | 검증 슬롯 (선택) |
| ⑤ 확인이 필요한 것 | 한계·출처·미검증 항목 | 정적 |

「당사자별 입장」을 별도 절로 두지 않는다. ③의 각 행에 주체를 적으면 충분하고,
절이 늘면 읽는 부담만 커진다.

### 3.2 목록 화면 (`/disputes`)

카드 하나에 **쟁점 한 줄 + 규모 + 현재 단계 + 다음 분기점**만 표시한다.

---

## 4. 데이터 타입

`src/lib/disputes/types.ts`

```ts
/** 데이터센터 모듈의 출처 태그를 재사용한다. 새로 만들지 않는다. */
import type { FigureKind } from '@/lib/datacenter/types';

/** 계산기 키는 lib에 둔다. components가 lib을 import하지 그 반대가 아니다. */
export type CalculatorKey = 'grant-formula' | 'fund-scenario';

export type DisputeStage =
  | 'proposed'      // 발의·제출
  | 'committee'     // 소관위 심사
  | 'subcommittee'  // 법안심사소위
  | 'plenary'       // 본회의
  | 'enacted'       // 공포
  | 'ongoing';      // 상시 — 특정 절차가 없는 분쟁

export interface DisputeFigure {
  label: string;
  value: string;
  note?: string;
  kind: FigureKind;   // measured | announced | derived | estimated
}

export interface TimelineEvent {
  date: string;                                  // YYYY-MM-DD
  label: string;
  detail?: string;
  status: 'done' | 'current' | 'upcoming';
  source?: string;                               // 의안번호 등
}

export interface Position {
  side: 'for' | 'against' | 'neutral';
  actor: string;
  claim: string;
  evidence?: string;
  source: string;
}

export interface DisputeSource {
  title: string;
  publisher: string;
  date: string;
  url?: string;
}

export interface Dispute {
  slug: string;
  title: string;
  question: string;                              // 한 문장 쟁점
  stage: DisputeStage;
  scale: string;                                 // 목록 카드용
  nextMilestone?: { date: string; label: string };
  figures: DisputeFigure[];                      // ①
  timeline: TimelineEvent[];                     // ②
  positions: Position[];                         // ③
  calculator?: CalculatorKey;                    // ④ 없으면 절 생략
  comparison?: { caption: string; rows: DisputeFigure[] };  // ④ 대체
  caveats: string[];                             // ⑤
  sources: DisputeSource[];                      // ⑤
  updatedAt: string;                             // YYYY-MM-DD — 필수
}
```

### 4.1 설계 결정

- **출처 태그 재사용** — 데이터센터의 `실측/발표/역산/추정`을 그대로 쓴다. 사이트 전체의
  표기 관습을 하나로 유지한다.
- **`calculator`는 선택 항목** — 값이 없으면 ④ 절 자체를 렌더링하지 않는다. 빈 계산기를
  억지로 만들지 않기 위한 장치다.
- **`CalculatorKey`는 `lib`에 둔다** — 레지스트리 구현은 `components`에 있지만 키 타입은
  `lib/disputes/types.ts`에 정의한다. `lib`이 `components`를 import하면 계층이 뒤집힌다.
- **`updatedAt` 필수** — 타입에서 강제하고 화면 상단에 크게 표시한다. 추적 정보가 낡았을 때
  독자가 스스로 판단할 수 있어야 한다. 자동 연동 전까지 유일한 안전장치다.

---

## 5. 계산기 레지스트리

분쟁마다 계산기가 다르므로 일반화하지 않는다. 키로 연결한다.

```ts
// src/components/disputes/calculators/index.ts
import type { CalculatorKey } from '@/lib/disputes/types';

export const CALCULATORS: Record<CalculatorKey, ComponentType> = {
  'grant-formula': GrantFormulaCalculator,   // 반영률·경상성장률 슬라이더
  'fund-scenario': FundScenarioCalculator,   // 수익률·손실 구간
};
```

`grant-formula`는 정부가 공개한 산식을 그대로 구현한다.

```
전년도 교부금 × (1 + 3년 연평균 경상성장률)
              × [1 + (3년 연평균 학령인구 변화율 × 0.35)]
```

반영률 0.35와 경상성장률을 슬라이더로 노출해, 숫자 하나가 조 단위를 가르는 구조를
독자가 직접 확인하게 한다.

---

## 6. 추적 어댑터

```ts
// src/lib/disputes/tracking.ts
export interface TrackingAdapter {
  fetchTimeline(slug: string): Promise<TimelineEvent[]>;
}
```

1차 출시는 `StaticAdapter`(데이터 파일의 `timeline`을 그대로 반환)를 쓴다.
국회 API 인증키를 확보하면 `AssemblyApiAdapter`로 교체하며, **화면 코드는 손대지 않는다.**

### 6.1 국회 API 확인 결과

열린국회정보 Open API는 RESTful이며 인증키가 필요하다. 키 없이는 `sample`로 처리돼
10건만 반환된다. 설계 시점에 의안 엔드포인트 두 개를 `sample` 키로 시험했으나
`Bad Request`였고, 공식 개발 가이드에도 의안 서비스의 정확한 엔드포인트명이 없다
(명세서를 별도로 내려받아야 함). 어댑터로 분리한 이유가 여기 있다 — **API 확인이
막혀도 나머지 구현이 멈추지 않는다.**

---

## 7. 라우팅과 네비게이션

```
/disputes           목록
/disputes/[slug]    상세 — generateStaticParams로 정적 생성
```

헤더에는 **드롭다운이 아니라 단일 링크**를 둔다. 이미 10개 항목이 있어 1580px에서도
꽉 차 있고, 분쟁은 3건뿐이라 목록으로 바로 보내는 편이 낫다.

```
... 재정건전성 · 국채시계 · 분쟁 · 공약 ∨ · AI기본사회 ∨
```

`공약` 앞에 둔다. 둘 다 정치 쟁점 콘텐츠라 인접이 자연스럽다.

함께 수정할 곳:

- **모바일 메뉴** — `Header.tsx`의 `mobileMenuOpen` 블록
- **`sitemap.ts`** — 수동 목록이라 자동 반영되지 않는다

---

## 8. 테스트 전략

데이터센터의 「출처 없는 숫자는 테스트가 막는다」 방식을 그대로 가져온다.

```ts
describe('분쟁 데이터 무결성', () => {
  it('모든 수치가 출처 태그(kind)를 갖는다');
  it('calculator 키가 레지스트리에 존재한다');   // 오타 방지
  it('updatedAt이 YYYY-MM-DD 형식이다');
  it('sources가 비어 있지 않다');
  it('slug가 중복되지 않는다');
  it('timeline이 날짜순으로 정렬돼 있다');
});
```

두 번째가 특히 중요하다. `calculator` 키에 오타가 나면 화면에서 절이 **조용히 사라진다.**
테스트가 없으면 발견하기 어렵다.

---

## 9. 구현 순서

세 단계로 나누고, 각 단계 끝에 `tsc --noEmit` + `next build` + 테스트를 돌린다.

| 단계 | 내용 | 완료 기준 |
|---|---|---|
| 1 | 타입 + 교부금 데이터 + 목록·상세 화면 (계산기 없이) | 교부금 분쟁이 화면에 뜬다 |
| 2 | 계산기 슬롯 + 교부금 산식 계산기 | 반영률을 움직이면 금액이 바뀐다 |
| 3 | 미래대응기금·연금 데이터 + 네비게이션 + sitemap | 세 분쟁이 모두 뜬다 |

1단계에서 **교부금 하나로 틀을 검증**한 뒤 나머지를 붙인다. 틀이 잘못됐다면 1단계에서
드러나고, 그때 고치는 비용이 가장 싸다.

---

## 10. 한계와 미결정 사항

1. **추적 정보는 수동 갱신이다.** 국회 API 연동 전까지 `updatedAt` 표시가 유일한
   안전장치다. 갱신이 멈추면 틀린 정보를 보여주게 된다.
2. **국회 API 엔드포인트가 미확인이다.** 인증키 발급과 명세서 확보가 선행돼야 한다.
3. **분쟁 선정 기준이 없다.** 무엇을 분쟁으로 볼지는 사람이 정한다. 3건을 넘어설 때
   기준을 문서화해야 한다.
4. **연금 계산기는 유보한다.** 자동조정장치를 한국에 적용한 전례가 없어 모델 전체가
   가정이 된다. 스웨덴·일본·독일의 실제 계수를 확보하면 재검토한다.
