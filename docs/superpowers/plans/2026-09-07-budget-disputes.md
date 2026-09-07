# 예산분쟁 카테고리 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 매년 반복되는 예산 갈등 3건을 `/disputes`에 모아, 독자가 쟁점을 이해하고 진행 단계를 추적하고 각 주장을 직접 수치로 검증할 수 있게 한다.

**Architecture:** 분쟁을 데이터로 정의하고 화면은 하나만 만든다. 검증 계층(계산기)은 키-컴포넌트 레지스트리로 느슨하게 연결해, 계산기가 없는 분쟁도 같은 화면을 쓴다. 타입과 계산 로직은 `src/lib/disputes/`에, 표현은 `src/components/disputes/`에 둔다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5 strict, Tailwind CSS v4, Jest + ts-jest

**Spec:** `docs/superpowers/specs/2026-09-07-budget-disputes-design.md`

## Global Constraints

- 컴포넌트 파일 300줄 이하. 초과 시 서브 컴포넌트로 분리 (하드 리밋 500줄)
- `any` 타입 금지. 타입 정의는 별도 `types.ts`에 분리
- 인라인 스타일(`style={{}}`) 금지 — Tailwind 클래스만 사용
- 클라이언트 컴포넌트에서 `console.log` / `console.error` 금지
- 한국어 변수명 금지 (주석·문자열은 한국어 사용)
- 색상은 테마 토큰(`text-foreground`, `bg-muted`, `border-border`) 또는 알파 틴트(`bg-red-500/10`) 사용. `globals.css`의 `@custom-variant dark (&:where(.dark, .dark *))` 선언에 의존한다
- 컴포넌트: PascalCase. 유틸리티 모듈: kebab-case. `@/` 절대 경로 사용
- 수정 금지: `src/lib/data/fiscal-health-data.ts`, `src/lib/data/standard-costs.ts`, `.env.local`
- 각 태스크 종료 시 `npx tsc --noEmit` 통과 필수
- 커밋 메시지는 한국어, 마지막 줄에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`
- 커밋은 각 태스크 끝에서만. 푸시는 Task 6 마지막에 한 번

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/lib/disputes/types.ts` | 타입·라벨 상수만. 로직 없음 |
| `src/lib/disputes/education-grant.ts` | 교부금 분쟁 데이터 |
| `src/lib/disputes/future-fund.ts` | 미래대응기금 분쟁 데이터 |
| `src/lib/disputes/pension.ts` | 연금 분쟁 데이터 |
| `src/lib/disputes/grant-formula.ts` | 교부금 산식 계산 (순수 함수) |
| `src/lib/disputes/index.ts` | 목록 집계 + slug 조회 |
| `src/lib/disputes/tracking.ts` | 타임라인 추적 어댑터 (설계문서 §6) |
| `src/components/disputes/DisputeCard.tsx` | 목록 카드 |
| `src/components/disputes/DisputeHeader.tsx` | ① 요약 절 |
| `src/components/disputes/DisputeTimeline.tsx` | ② 진행 절 |
| `src/components/disputes/DisputePositions.tsx` | ③ 쟁점 절 |
| `src/components/disputes/DisputeComparison.tsx` | ④ 대체 — 수치 대조표 |
| `src/components/disputes/DisputeFooter.tsx` | ⑤ 한계·출처 절 |
| `src/components/disputes/calculators/index.ts` | 계산기 레지스트리 |
| `src/components/disputes/calculators/GrantFormula.tsx` | 교부금 산식 계산기 |
| `src/components/disputes/calculators/FundScenario.tsx` | 기금 운용 시나리오 계산기 |
| `src/app/disputes/page.tsx` | 목록 라우트 |
| `src/app/disputes/[slug]/page.tsx` | 상세 라우트 |

상세 화면을 절 단위 컴포넌트로 쪼갠 이유는 두 가지다. 절마다 데이터 의존이 다르고, 한 파일에 다 넣으면 300줄을 넘긴다.

---

## Task 1: 타입과 교부금 데이터

**Files:**
- Create: `src/lib/disputes/types.ts`
- Create: `src/lib/disputes/education-grant.ts`
- Create: `src/lib/disputes/index.ts`
- Create: `src/lib/disputes/tracking.ts`
- Test: `src/lib/disputes/__tests__/disputes.test.ts`

**Interfaces:**
- Consumes: `FigureKind` from `@/lib/datacenter/types`
- Produces: `Dispute`, `DisputeFigure`, `DisputeSource`, `TimelineEvent`, `Position`, `DisputeStage`, `CalculatorKey`, `CALCULATOR_KEYS`, `STAGE_LABEL`, `ALL_DISPUTES`, `getDispute(slug: string): Dispute | undefined`, `TrackingAdapter`, `staticAdapter`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/lib/disputes/__tests__/disputes.test.ts`

```ts
import { ALL_DISPUTES, getDispute } from '../index';
import { CALCULATOR_KEYS } from '../types';

describe('분쟁 데이터 무결성', () => {
  it('slug가 중복되지 않는다', () => {
    const slugs = ALL_DISPUTES.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('모든 수치가 출처 태그를 갖는다', () => {
    for (const d of ALL_DISPUTES) {
      for (const f of d.figures) {
        expect(['measured', 'announced', 'derived', 'estimated']).toContain(f.kind);
      }
    }
  });

  it('calculator 키가 레지스트리 목록에 존재한다', () => {
    for (const d of ALL_DISPUTES) {
      if (d.calculator) expect(CALCULATOR_KEYS).toContain(d.calculator);
    }
  });

  it('updatedAt이 YYYY-MM-DD 형식이다', () => {
    for (const d of ALL_DISPUTES) {
      expect(d.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('출처가 비어 있지 않다', () => {
    for (const d of ALL_DISPUTES) {
      expect(d.sources.length).toBeGreaterThan(0);
    }
  });

  it('타임라인이 날짜순으로 정렬돼 있다', () => {
    for (const d of ALL_DISPUTES) {
      const dates = d.timeline.map((e) => e.date);
      expect([...dates].sort()).toEqual(dates);
    }
  });

  it('입장에 찬반이 모두 담겨 있다', () => {
    for (const d of ALL_DISPUTES) {
      expect(d.positions.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('getDispute가 없는 slug에 undefined를 낸다', () => {
    expect(getDispute('does-not-exist')).toBeUndefined();
  });

  it('교부금 분쟁을 slug로 찾는다', () => {
    expect(getDispute('education-grant')?.title).toBe('지방교육재정교부금 개편');
  });
});

describe('추적 어댑터', () => {
  it('StaticAdapter가 데이터 파일의 타임라인을 그대로 낸다', async () => {
    const events = await staticAdapter.fetchTimeline('education-grant');
    expect(events).toEqual(getDispute('education-grant')?.timeline);
  });

  it('없는 slug에는 빈 배열을 낸다', async () => {
    expect(await staticAdapter.fetchTimeline('does-not-exist')).toEqual([]);
  });
});
```

import 줄에 어댑터를 추가한다.

```ts
import { staticAdapter } from '../tracking';
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx jest src/lib/disputes`
Expected: FAIL — `Cannot find module '../index'`

- [ ] **Step 3: 타입 정의**

`src/lib/disputes/types.ts`

```ts
/**
 * 예산분쟁 타입 정의 (설계문서 §4)
 *
 * 출처 태그(FigureKind)는 데이터센터 모듈 것을 그대로 쓴다.
 * 사이트 전체가 같은 표기 관습을 쓰게 하기 위해서다.
 */
import type { FigureKind } from '@/lib/datacenter/types';

/**
 * 계산기 키는 components가 아니라 lib에 둔다.
 * components는 lib을 import하지만 lib은 components를 import하지 않는다.
 */
export const CALCULATOR_KEYS = ['grant-formula', 'fund-scenario'] as const;
export type CalculatorKey = (typeof CALCULATOR_KEYS)[number];

export type DisputeStage =
  | 'proposed'
  | 'committee'
  | 'subcommittee'
  | 'plenary'
  | 'enacted'
  | 'ongoing';

export const STAGE_LABEL: Record<DisputeStage, string> = {
  proposed: '국회 제출',
  committee: '소관위 심사',
  subcommittee: '법안심사소위',
  plenary: '본회의',
  enacted: '공포',
  ongoing: '상시',
};

export interface DisputeFigure {
  label: string;
  value: string;
  note?: string;
  kind: FigureKind;
}

export interface TimelineEvent {
  /** YYYY-MM-DD */
  date: string;
  label: string;
  detail?: string;
  status: 'done' | 'current' | 'upcoming';
  /** 의안번호 등 독자가 직접 확인할 수 있는 식별자 */
  source?: string;
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
  /** 한 문장으로 쓴 쟁점 */
  question: string;
  stage: DisputeStage;
  /** 목록 카드에 표시할 규모 */
  scale: string;
  nextMilestone?: { date: string; label: string };
  figures: DisputeFigure[];
  timeline: TimelineEvent[];
  positions: Position[];
  /** 없으면 ④ 절에 계산기를 렌더링하지 않는다 */
  calculator?: CalculatorKey;
  /** 계산기가 없는 분쟁의 ④ 대체 — 확인된 수치 대조표 */
  comparison?: { caption: string; rows: DisputeFigure[] };
  caveats: string[];
  sources: DisputeSource[];
  /** YYYY-MM-DD. 화면 상단에 표시해 독자가 신선도를 판단하게 한다 */
  updatedAt: string;
}
```

- [ ] **Step 4: 교부금 데이터 작성**

`src/lib/disputes/education-grant.ts`

```ts
import type { Dispute } from './types';

export const educationGrant: Dispute = {
  slug: 'education-grant',
  title: '지방교육재정교부금 개편',
  question:
    '55년 된 내국세 20.79% 연동제를 폐지하고 학령인구를 반영한 산식으로 바꿀 것인가',
  stage: 'proposed',
  scale: '78조 8,718억원',
  nextMilestone: { date: '2026-12-02', label: '예산 법정 처리기한' },

  figures: [
    {
      label: '2027년 교부금 (정부안)',
      value: '78조 8,718억원',
      note: '올해 본예산 대비 +10.1%, 추경 포함 대비 +3.2%',
      kind: 'announced',
    },
    {
      label: '기존 산식 유지 시',
      value: '약 100조원',
      note: '정부 추산. 차액 약 21조원',
      kind: 'derived',
    },
    {
      label: '학생 수로 산정하는 항목',
      value: '8.8%',
      note: '7조 2,587억원. 나머지는 학교·학급·교직원 규모에 좌우된다 (국회입법조사처)',
      kind: 'measured',
    },
  ],

  timeline: [
    { date: '2026-08-24', label: '입법예고 시작', status: 'done' },
    {
      date: '2026-08-28',
      label: '입법예고 종료',
      detail: '예고 당일 오후에만 반대 의견 100여 건',
      status: 'done',
    },
    { date: '2026-09-01', label: '국무회의 의결', status: 'done' },
    {
      date: '2026-09-03',
      label: '국회 제출',
      detail: '소관 교육위원회. 의원안 6건이 함께 계류 중이다',
      status: 'current',
      source: '의안번호 2221053',
    },
    {
      date: '2026-11-30',
      label: '법안심사소위 · 위원장 대안 논의',
      detail: '7건이 병합될 가능성이 높다. 대안 문안이 최종 결과가 된다',
      status: 'upcoming',
    },
    { date: '2026-12-02', label: '예산 법정 처리기한', status: 'upcoming' },
  ],

  positions: [
    {
      side: 'for',
      actor: '기획예산처',
      claim:
        '현행 제도는 학령인구 감소를 반영하지 못하고, 내국세 변동에 따라 교부금이 급등락한다',
      source: '2026~2030년 국가재정운용계획 17쪽',
    },
    {
      side: 'for',
      actor: 'KDI 김학수 선임연구위원',
      claim:
        '세수에 연동된 교육재정이 오히려 불안정하다. 초과세수가 나면 소진성 사업이 급조된다',
      source: '더스쿠프 보도',
    },
    {
      side: 'against',
      actor: '대한민국교육감협의회',
      claim:
        '학생이 줄어도 학교 운영비·시설 관리비·교직원 인건비는 같은 비율로 줄지 않는다',
      source: '교육감협의회 성명',
    },
    {
      side: 'against',
      actor: '전국교수노동조합',
      claim:
        '내국세 연동제는 교육재정을 정부의 단기 판단과 그때그때의 재정 여건으로부터 떼어놓는 장치다',
      source: '더스쿠프 보도',
    },
    {
      side: 'against',
      actor: '363개 교육·시민사회단체 연대',
      claim:
        '감소분 보전은 명목 동결일 뿐이다. 물가·공공요금·호봉 승급에만 연 약 2조 4,000억원이 든다',
      evidence: '명목 금액이 같아도 실질로는 매년 삭감된다',
      source: '지방교육재정교부금 개편 대응 긴급행동 기자회견',
    },
    {
      side: 'neutral',
      actor: '국회입법조사처',
      claim:
        '학생 수를 측정단위로 삼는 항목은 8.8%뿐이며, 반영률을 0.35로 정한 근거가 충분히 제시되지 않았다',
      evidence: '대안으로 국회가 반영률을 심의·확정하고 상·하한을 법률로 정할 것을 제안',
      source: '교육플러스 보도',
    },
  ],

  calculator: 'grant-formula',

  caveats: [
    '개정안은 아직 국회를 통과하지 않았다. 78조 8,718억원은 법 개정을 전제로 편성된 정부안이며 확정 금액이 아니다.',
    '경상성장률에는 물가가 이미 포함돼 있다. 교육계가 지적하는 것은 산식이 아니라, 감소분 보전 규정의 기준선이 명목 금액이라는 점이다.',
    '차액은 미래대응기금 교육·인재계정 수입으로 보장된다고 국가재정운용계획이 밝히고 있다. 교육 밖으로 나가는 것이 아니라 초·중등에서 영유아·고등·평생교육으로 이동한다.',
    '지역별 배분 기준과 특별교부금 비율이 함께 바뀌는지는 개정안 조문 대조가 필요하다.',
  ],

  sources: [
    {
      title: '2026~2030년 국가재정운용계획',
      publisher: '기획예산처',
      date: '2026-09-01',
    },
    {
      title: '지방교육재정교부금법 일부개정법률안(정부)',
      publisher: '국회 의안정보시스템',
      date: '2026-09-03',
      url: 'https://likms.assembly.go.kr/bill/main.do',
    },
    {
      title: '입법조사처, 교부금 개편에 제동',
      publisher: '교육플러스',
      date: '2026-09-04',
    },
  ],

  updatedAt: '2026-09-07',
};
```

- [ ] **Step 5: 목록 집계 작성**

`src/lib/disputes/index.ts`

```ts
import type { Dispute } from './types';
import { educationGrant } from './education-grant';

/** 목록 화면의 표시 순서이기도 하다. 규모가 큰 것부터 둔다. */
export const ALL_DISPUTES: readonly Dispute[] = [educationGrant];

export function getDispute(slug: string): Dispute | undefined {
  return ALL_DISPUTES.find((d) => d.slug === slug);
}

export * from './types';
```

- [ ] **Step 6: 추적 어댑터 작성**

`src/lib/disputes/tracking.ts`

설계문서 §6. 국회 API 인증키와 엔드포인트 명세를 아직 확보하지 못했으므로 1차 출시는 정적 어댑터를 쓴다. 어댑터로 분리한 이유는 API 확인이 막혀도 나머지 구현이 멈추지 않게 하기 위해서다. 나중에 `AssemblyApiAdapter`를 만들어 갈아끼울 때 화면 코드는 손대지 않는다.

```ts
import type { TimelineEvent } from './types';
import { getDispute } from './index';

export interface TrackingAdapter {
  fetchTimeline(slug: string): Promise<TimelineEvent[]>;
}

/**
 * 데이터 파일의 timeline을 그대로 반환한다.
 *
 * 열린국회정보 Open API는 인증키가 필요하고, 설계 시점에 의안 엔드포인트를
 * sample 키로 시험했을 때 Bad Request가 났다. 명세서를 확보하면 같은 인터페이스로
 * AssemblyApiAdapter를 추가한다.
 */
export const staticAdapter: TrackingAdapter = {
  async fetchTimeline(slug: string): Promise<TimelineEvent[]> {
    return getDispute(slug)?.timeline ?? [];
  },
};
```

- [ ] **Step 7: 테스트 통과 확인**

Run: `npx jest src/lib/disputes`
Expected: PASS — 11 tests

- [ ] **Step 8: 타입 검사**

Run: `npx tsc --noEmit`
Expected: 출력 없음

- [ ] **Step 9: 커밋**

```bash
git add src/lib/disputes
git commit -m "$(cat <<'EOF'
feat(disputes): 분쟁 타입과 교부금 데이터

설계문서 §4·§6을 구현한다. 출처 태그는 데이터센터 모듈 것을 재사용해
사이트 전체가 같은 표기 관습을 쓰게 했고, CalculatorKey는 lib에 두어
components → lib 단방향 의존을 지켰다.

타임라인은 어댑터를 거쳐 읽는다. 국회 API 인증키와 엔드포인트 명세를
아직 확보하지 못해 지금은 정적 어댑터를 쓰지만, 화면이 처음부터 어댑터를
통하게 해두면 나중에 갈아끼울 때 화면 코드를 손대지 않아도 된다.

무결성 테스트 11종을 함께 넣는다. slug 중복, 출처 태그 누락, calculator
키 오타, updatedAt 형식, 타임라인 정렬 오류를 데이터 추가 시점에 잡는다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: 목록 화면

**Files:**
- Create: `src/components/disputes/DisputeCard.tsx`
- Create: `src/app/disputes/page.tsx`

**Interfaces:**
- Consumes: `ALL_DISPUTES`, `Dispute`, `STAGE_LABEL` (Task 1)
- Produces: `/disputes` 라우트, `DisputeCard` 컴포넌트

- [ ] **Step 1: 카드 컴포넌트 작성**

`src/components/disputes/DisputeCard.tsx`

서버 컴포넌트다. `'use client'`를 붙이지 않는다.

```tsx
import Link from 'next/link';
import type { Dispute } from '@/lib/disputes/types';
import { STAGE_LABEL } from '@/lib/disputes/types';

export function DisputeCard({ dispute }: { dispute: Dispute }) {
  return (
    <Link
      href={`/disputes/${dispute.slug}`}
      className="block rounded-lg border border-border bg-muted/20 p-5 transition-colors hover:bg-muted/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          {STAGE_LABEL[dispute.stage]}
        </span>
        <span className="text-sm tabular-nums text-muted-foreground">{dispute.scale}</span>
      </div>
      <h2 className="mt-2 text-xl font-bold text-foreground">{dispute.title}</h2>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{dispute.question}</p>
      {dispute.nextMilestone && (
        <p className="mt-3 text-sm text-muted-foreground">
          다음 분기점 — {dispute.nextMilestone.date} {dispute.nextMilestone.label}
        </p>
      )}
    </Link>
  );
}
```

- [ ] **Step 2: 목록 라우트 작성**

`src/app/disputes/page.tsx`

```tsx
import type { Metadata } from 'next';
import { ALL_DISPUTES } from '@/lib/disputes';
import { DisputeCard } from '@/components/disputes/DisputeCard';

export const metadata: Metadata = {
  title: '예산분쟁 | 마을살림/나라살림',
  description: '매년 반복되는 예산 갈등의 쟁점·진행·근거를 정리합니다.',
};

export default function DisputesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">예산분쟁</h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
        예산은 금액이기 전에 선택입니다. 무엇을 두고 다투고 있는지, 지금 어느 단계인지,
        각 주장의 근거가 무엇인지 정리합니다.
      </p>
      <div className="mt-8 flex flex-col gap-4">
        {ALL_DISPUTES.map((d) => (
          <DisputeCard key={d.slug} dispute={d} />
        ))}
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npx tsc --noEmit && npx next build`
Expected: 정적 생성 목록에 `/disputes`가 나타난다

- [ ] **Step 4: 커밋**

```bash
git add src/components/disputes src/app/disputes
git commit -m "$(cat <<'EOF'
feat(disputes): 분쟁 목록 화면

카드에 쟁점 한 줄·규모·현재 단계·다음 분기점만 담는다. 분쟁이 3건뿐이라
필터와 검색은 두지 않았다. 건수가 늘면 그때 붙인다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: 상세 화면

**Files:**
- Create: `src/components/disputes/DisputeHeader.tsx`
- Create: `src/components/disputes/DisputeTimeline.tsx`
- Create: `src/components/disputes/DisputePositions.tsx`
- Create: `src/components/disputes/DisputeFooter.tsx`
- Create: `src/app/disputes/[slug]/page.tsx`

**Interfaces:**
- Consumes: `Dispute`, `TimelineEvent`, `Position`, `getDispute`, `ALL_DISPUTES`, `STAGE_LABEL`, `staticAdapter` (Task 1), `FIGURE_KIND_LABEL` from `@/lib/datacenter/types`
- Produces: `/disputes/[slug]` 라우트. ④ 절 자리는 Task 4·5에서 채운다

`FIGURE_KIND_LABEL`은 `src/lib/datacenter/types.ts:17`에 이미 정의돼 있다. `Record<FigureKind, string>`이며 `measured → 실측`처럼 한국어 라벨을 낸다.

- [ ] **Step 1: ① 요약 절 작성**

`src/components/disputes/DisputeHeader.tsx`

```tsx
import type { Dispute } from '@/lib/disputes/types';
import { STAGE_LABEL } from '@/lib/disputes/types';
import { FIGURE_KIND_LABEL } from '@/lib/datacenter/types';

export function DisputeHeader({ dispute }: { dispute: Dispute }) {
  return (
    <header>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-foreground">
          {STAGE_LABEL[dispute.stage]}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {dispute.updatedAt} 기준
        </span>
      </div>
      <h1 className="mt-3 text-2xl font-bold text-foreground md:text-3xl">{dispute.title}</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">
        {dispute.question}
      </p>
      <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {dispute.figures.map((f) => (
          <div key={f.label} className="rounded-lg border border-border bg-muted/30 p-4">
            <dt className="text-sm text-muted-foreground">
              {f.label}{' '}
              <span className="font-mono text-xs">{FIGURE_KIND_LABEL[f.kind]}</span>
            </dt>
            <dd className="mt-1 text-2xl font-bold tabular-nums text-foreground">{f.value}</dd>
            {f.note && (
              <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.note}</dd>
            )}
          </div>
        ))}
      </dl>
    </header>
  );
}
```

- [ ] **Step 2: ② 진행 절 작성**

`src/components/disputes/DisputeTimeline.tsx`

```tsx
import type { TimelineEvent } from '@/lib/disputes/types';

const STATUS_CLASS: Record<TimelineEvent['status'], string> = {
  done: 'border-l-muted-foreground/40',
  current: 'border-l-blue-500 bg-blue-500/10',
  upcoming: 'border-l-border',
};

export function DisputeTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <ol className="flex flex-col gap-2">
      {events.map((e) => (
        <li
          key={`${e.date}-${e.label}`}
          className={`rounded-md border-l-4 bg-muted/20 px-4 py-3 ${STATUS_CLASS[e.status]}`}
        >
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-mono text-sm tabular-nums text-muted-foreground">{e.date}</span>
            <span className="text-base font-semibold text-foreground">{e.label}</span>
            {e.source && (
              <span className="font-mono text-xs text-muted-foreground">{e.source}</span>
            )}
          </div>
          {e.detail && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{e.detail}</p>
          )}
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 3: ③ 쟁점 절 작성**

`src/components/disputes/DisputePositions.tsx`

```tsx
import type { Position } from '@/lib/disputes/types';

const SIDE_LABEL: Record<Position['side'], string> = {
  for: '찬성',
  against: '반대',
  neutral: '중립',
};

const SIDE_CLASS: Record<Position['side'], string> = {
  for: 'border-l-emerald-500/60',
  against: 'border-l-red-500/60',
  neutral: 'border-l-border',
};

export function DisputePositions({ positions }: { positions: Position[] }) {
  return (
    <div className="flex flex-col gap-3">
      {positions.map((p) => (
        <article
          key={`${p.actor}-${p.claim.slice(0, 12)}`}
          className={`rounded-md border border-border border-l-4 bg-muted/20 p-4 ${SIDE_CLASS[p.side]}`}
        >
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-mono text-xs text-muted-foreground">{SIDE_LABEL[p.side]}</span>
            <span className="text-base font-bold text-foreground">{p.actor}</span>
          </div>
          <p className="mt-2 text-base leading-relaxed text-foreground">{p.claim}</p>
          {p.evidence && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.evidence}</p>
          )}
          <p className="mt-2 font-mono text-xs text-muted-foreground">출처 — {p.source}</p>
        </article>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: ⑤ 한계·출처 절 작성**

`src/components/disputes/DisputeFooter.tsx`

```tsx
import type { Dispute } from '@/lib/disputes/types';

export function DisputeFooter({ dispute }: { dispute: Dispute }) {
  return (
    <footer className="border-t-2 border-border pt-6">
      <h2 className="text-xl font-bold text-foreground">확인이 필요한 것</h2>
      <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
        {dispute.caveats.map((c) => (
          <li key={c} className="text-base leading-relaxed text-muted-foreground">
            {c}
          </li>
        ))}
      </ul>
      <h3 className="mt-6 text-base font-bold text-foreground">출처</h3>
      <ol className="mt-2 flex list-decimal flex-col gap-1 pl-5">
        {dispute.sources.map((s) => (
          <li key={s.title} className="text-sm text-muted-foreground">
            {s.publisher}, 「{s.title}」, {s.date}
            {s.url && (
              <>
                {' '}
                <a
                  href={s.url}
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  원문
                </a>
              </>
            )}
          </li>
        ))}
      </ol>
    </footer>
  );
}
```

- [ ] **Step 5: 상세 라우트 작성**

`src/app/disputes/[slug]/page.tsx`

Next.js 16에서 `params`는 Promise다. 반드시 `await`한다.

타임라인은 `dispute.timeline`을 직접 읽지 않고 추적 어댑터를 거친다. 지금은 정적 어댑터라 결과가 같지만, 나중에 국회 API 어댑터로 갈아끼울 때 이 파일을 고치지 않기 위해서다.

```tsx
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ALL_DISPUTES, getDispute } from '@/lib/disputes';
import { staticAdapter } from '@/lib/disputes/tracking';
import { DisputeHeader } from '@/components/disputes/DisputeHeader';
import { DisputeTimeline } from '@/components/disputes/DisputeTimeline';
import { DisputePositions } from '@/components/disputes/DisputePositions';
import { DisputeFooter } from '@/components/disputes/DisputeFooter';

export function generateStaticParams() {
  return ALL_DISPUTES.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dispute = getDispute(slug);
  if (!dispute) return { title: '예산분쟁 | 마을살림/나라살림' };
  return {
    title: `${dispute.title} | 마을살림/나라살림`,
    description: dispute.question,
  };
}

export default async function DisputeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dispute = getDispute(slug);
  if (!dispute) notFound();

  const timeline = await staticAdapter.fetchTimeline(slug);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-4 py-10 md:px-6">
      <DisputeHeader dispute={dispute} />

      <section>
        <h2 className="text-xl font-bold text-foreground">진행</h2>
        <div className="mt-4">
          <DisputeTimeline events={timeline} />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-bold text-foreground">쟁점</h2>
        <div className="mt-4">
          <DisputePositions positions={dispute.positions} />
        </div>
      </section>

      <DisputeFooter dispute={dispute} />
    </main>
  );
}
```

- [ ] **Step 6: 빌드 확인**

Run: `npx tsc --noEmit && npx next build`
Expected: 생성 목록에 `/disputes/education-grant`가 나타난다

- [ ] **Step 7: 화면 확인**

`.claude/launch.json`의 dev 서버를 띄우고 `/disputes/education-grant`를 연다.
확인 항목 — 수치 카드 3개, 타임라인 6줄(2026-09-03 줄이 파란 강조), 쟁점 6건(찬성 2·반대 3·중립 1), 브라우저 콘솔 오류 0건.

- [ ] **Step 8: 커밋**

```bash
git add src/components/disputes src/app/disputes
git commit -m "$(cat <<'EOF'
feat(disputes): 분쟁 상세 화면

절 단위로 컴포넌트를 나눴다. 절마다 데이터 의존이 다르고 한 파일에
다 넣으면 300줄을 넘기기 때문이다. 계산기 절은 다음 커밋에서 붙인다.

타임라인은 dispute.timeline을 직접 읽지 않고 추적 어댑터를 거친다.
지금은 정적 어댑터라 결과가 같지만, 국회 API 어댑터로 갈아끼울 때
이 파일을 고치지 않기 위해서다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: 교부금 산식 계산기와 레지스트리

**Files:**
- Create: `src/lib/disputes/grant-formula.ts`
- Test: `src/lib/disputes/__tests__/grant-formula.test.ts`
- Create: `src/components/disputes/calculators/GrantFormula.tsx`
- Create: `src/components/disputes/calculators/index.ts`
- Modify: `src/app/disputes/[slug]/page.tsx`

**Interfaces:**
- Consumes: `CalculatorKey` (Task 1)
- Produces: `computeGrant(input: GrantInput): GrantResult`, `LEGACY_LINK_RATE`, `CALCULATORS: Partial<Record<CalculatorKey, ComponentType>>`

- [ ] **Step 1: 실패하는 계산 테스트 작성**

`src/lib/disputes/__tests__/grant-formula.test.ts`

```ts
import { computeGrant, LEGACY_LINK_RATE } from '../grant-formula';

describe('교부금 산식', () => {
  it('반영률이 0이면 학령인구가 결과를 바꾸지 못한다', () => {
    const base = { previousGrantJo: 100, nominalGrowth: 0.05, reflectRate: 0 };
    const a = computeGrant({ ...base, schoolAgeChange: -0.05 });
    const b = computeGrant({ ...base, schoolAgeChange: -0.2 });
    expect(a.grantJo).toBeCloseTo(b.grantJo, 6);
    expect(a.grantJo).toBeCloseTo(105, 6);
  });

  it('학령인구가 줄면 반영률이 클수록 교부금이 적어진다', () => {
    const base = { previousGrantJo: 100, nominalGrowth: 0.05, schoolAgeChange: -0.05 };
    const low = computeGrant({ ...base, reflectRate: 0.35 });
    const high = computeGrant({ ...base, reflectRate: 0.5 });
    expect(high.grantJo).toBeLessThan(low.grantJo);
  });

  it('산식 결과가 전년보다 적으면 감소분 보전 하한이 걸린다', () => {
    const r = computeGrant({
      previousGrantJo: 100,
      nominalGrowth: -0.1,
      schoolAgeChange: -0.05,
      reflectRate: 0.35,
    });
    expect(r.grantJo).toBe(100);
    expect(r.rawJo).toBeLessThan(100);
    expect(r.floorApplied).toBe(true);
  });

  it('하한이 걸리지 않으면 floorApplied가 false다', () => {
    const r = computeGrant({
      previousGrantJo: 100,
      nominalGrowth: 0.05,
      schoolAgeChange: -0.05,
      reflectRate: 0.35,
    });
    expect(r.floorApplied).toBe(false);
    expect(r.grantJo).toBeCloseTo(r.rawJo, 6);
  });

  it('내국세를 주면 기존 연동 방식 금액과 차액을 함께 낸다', () => {
    const r = computeGrant({
      previousGrantJo: 100,
      nominalGrowth: 0.05,
      schoolAgeChange: -0.05,
      reflectRate: 0.35,
      internalTaxJo: 500,
    });
    expect(r.legacyJo).toBeCloseTo(500 * LEGACY_LINK_RATE, 6);
    expect(r.gapJo).toBeCloseTo(r.grantJo - 500 * LEGACY_LINK_RATE, 6);
  });

  it('내국세를 주지 않으면 비교값이 null이다', () => {
    const r = computeGrant({
      previousGrantJo: 100,
      nominalGrowth: 0.05,
      schoolAgeChange: -0.05,
      reflectRate: 0.35,
    });
    expect(r.legacyJo).toBeNull();
    expect(r.gapJo).toBeNull();
  });

  it('범위를 벗어난 반영률을 거부한다', () => {
    expect(() =>
      computeGrant({
        previousGrantJo: 100,
        nominalGrowth: 0.05,
        schoolAgeChange: -0.05,
        reflectRate: 1.5,
      }),
    ).toThrow();
  });

  it('전년도 교부금이 0 이하면 거부한다', () => {
    expect(() =>
      computeGrant({
        previousGrantJo: 0,
        nominalGrowth: 0.05,
        schoolAgeChange: -0.05,
        reflectRate: 0.35,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx jest src/lib/disputes/__tests__/grant-formula.test.ts`
Expected: FAIL — `Cannot find module '../grant-formula'`

- [ ] **Step 3: 계산 로직 구현**

`src/lib/disputes/grant-formula.ts`

```ts
/**
 * 지방교육재정교부금 산식 (2027년 정부 개정안)
 *
 *   전년도 교부금
 *     × (1 + 3년 연평균 경상성장률)
 *     × [1 + (3년 연평균 학령인구 변화율 × 반영률)]
 *
 * 국가재정운용계획 17쪽에 실린 산식을 그대로 옮긴다.
 * 감소분 보전 규정에 따라 결과가 전년보다 적으면 전년 금액을 유지한다.
 */

/** 폐지 대상인 현행 내국세 연동 비율 */
export const LEGACY_LINK_RATE = 0.2079;

export interface GrantInput {
  /** 전년도 교부금 (조원) */
  previousGrantJo: number;
  /** 3년 연평균 경상성장률. 0.05 = 5% */
  nominalGrowth: number;
  /** 3년 연평균 학령인구 변화율. -0.03 = 3% 감소 */
  schoolAgeChange: number;
  /** 학령인구 반영률. 정부안은 0.35 */
  reflectRate: number;
  /** 비교용 내국세 총액 (조원). 주면 기존 연동 방식 결과를 함께 낸다 */
  internalTaxJo?: number;
}

export interface GrantResult {
  /** 하한 적용 후 최종 교부금 (조원) */
  grantJo: number;
  /** 하한 적용 전 산식 결과 (조원) */
  rawJo: number;
  floorApplied: boolean;
  /** 기존 20.79% 연동 시 금액. internalTaxJo를 주지 않으면 null */
  legacyJo: number | null;
  /** 기존 방식 대비 차액. 음수면 새 산식이 적다 */
  gapJo: number | null;
}

export function computeGrant(input: GrantInput): GrantResult {
  const { previousGrantJo, nominalGrowth, schoolAgeChange, reflectRate, internalTaxJo } = input;

  if (!Number.isFinite(previousGrantJo) || previousGrantJo <= 0) {
    throw new Error(`전년도 교부금은 양수여야 합니다: ${previousGrantJo}`);
  }
  if (!Number.isFinite(reflectRate) || reflectRate < 0 || reflectRate > 1) {
    throw new Error(`반영률은 0 이상 1 이하여야 합니다: ${reflectRate}`);
  }
  if (!Number.isFinite(nominalGrowth) || !Number.isFinite(schoolAgeChange)) {
    throw new Error('경상성장률과 학령인구 변화율은 유한한 수여야 합니다');
  }

  const rawJo = previousGrantJo * (1 + nominalGrowth) * (1 + schoolAgeChange * reflectRate);
  const floorApplied = rawJo < previousGrantJo;
  const grantJo = floorApplied ? previousGrantJo : rawJo;

  const legacyJo = internalTaxJo === undefined ? null : internalTaxJo * LEGACY_LINK_RATE;

  return {
    grantJo,
    rawJo,
    floorApplied,
    legacyJo,
    gapJo: legacyJo === null ? null : grantJo - legacyJo,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx jest src/lib/disputes`
Expected: PASS — Task 1의 11개 + 이번 8개 = 19개

- [ ] **Step 5: 계산기 컴포넌트 작성**

`src/components/disputes/calculators/GrantFormula.tsx`

클라이언트 컴포넌트다. `console.log` 금지 규칙이 여기에 적용된다.

```tsx
'use client';

import { useState } from 'react';
import { computeGrant } from '@/lib/disputes/grant-formula';

/** 2026년 본예산 교부금 (조원) */
const PREVIOUS_GRANT_JO = 71.67;
/** 비교용 내국세 총액 (조원) */
const INTERNAL_TAX_JO = 481;

export function GrantFormula() {
  const [growth, setGrowth] = useState(0.062);
  const [change, setChange] = useState(-0.03);
  const [rate, setRate] = useState(0.35);

  const result = computeGrant({
    previousGrantJo: PREVIOUS_GRANT_JO,
    nominalGrowth: growth,
    schoolAgeChange: change,
    reflectRate: rate,
    internalTaxJo: INTERNAL_TAX_JO,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Slider
          label="학령인구 반영률"
          value={rate}
          min={0}
          max={1}
          step={0.05}
          display={`${(rate * 100).toFixed(0)}%`}
          note="정부안은 35%. 입법조사처는 이 숫자의 근거가 충분히 제시되지 않았다고 지적했다"
          onChange={setRate}
        />
        <Slider
          label="경상성장률"
          value={growth}
          min={-0.02}
          max={0.12}
          step={0.002}
          display={`${(growth * 100).toFixed(1)}%`}
          note="3년 연평균. 명목 GDP 증가율이라 물가가 이미 포함돼 있다"
          onChange={setGrowth}
        />
        <Slider
          label="학령인구 변화율"
          value={change}
          min={-0.1}
          max={0}
          step={0.005}
          display={`${(change * 100).toFixed(1)}%`}
          note="3년 연평균. 음수는 감소를 뜻한다"
          onChange={setChange}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Figure label="새 산식" value={`${result.grantJo.toFixed(1)}조원`} />
        <Figure
          label="기존 20.79% 연동"
          value={result.legacyJo === null ? '—' : `${result.legacyJo.toFixed(1)}조원`}
        />
        <Figure
          label="차이"
          value={
            result.gapJo === null
              ? '—'
              : `${result.gapJo >= 0 ? '+' : '−'}${Math.abs(result.gapJo).toFixed(1)}조원`
          }
        />
      </div>

      {result.floorApplied && (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm leading-relaxed text-foreground">
          산식 결과가 전년보다 적어 <b>감소분 보전 규정</b>이 적용됐습니다. 다만 이 보전은
          명목 금액 기준이라 호봉 승급과 공공요금 인상은 반영되지 않습니다.
        </p>
      )}

      <p className="text-sm leading-relaxed text-muted-foreground">
        전년도 교부금 {PREVIOUS_GRANT_JO}조원, 내국세 {INTERNAL_TAX_JO}조원을 기준값으로 둔
        계산입니다. 실제 편성에서는 추가세수를 제외한 내국세가 기준이 되므로 비교값은
        참고용입니다.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  note,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  note: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-medium text-foreground">{label}</span>
        <span className="text-base font-bold tabular-nums text-foreground">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-blue-600"
        aria-label={label}
      />
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
```

- [ ] **Step 6: 레지스트리 작성**

`src/components/disputes/calculators/index.ts`

```ts
import type { ComponentType } from 'react';
import type { CalculatorKey } from '@/lib/disputes/types';
import { GrantFormula } from './GrantFormula';

/**
 * 분쟁별 계산기. 키는 lib/disputes/types.ts가 소유한다.
 * fund-scenario는 다음 태스크에서 추가한다. 그래서 Partial이다.
 */
export const CALCULATORS: Partial<Record<CalculatorKey, ComponentType>> = {
  'grant-formula': GrantFormula,
};
```

- [ ] **Step 7: 상세 라우트에 ④ 절 삽입**

`src/app/disputes/[slug]/page.tsx`를 수정한다. import를 추가하고, 쟁점 섹션과 `<DisputeFooter />` 사이에 계산기 섹션을 넣는다.

import 추가:

```tsx
import { CALCULATORS } from '@/components/disputes/calculators';
```

`export default async function DisputeDetailPage` 안, `const timeline = await staticAdapter.fetchTimeline(slug);` 다음 줄에 계산기 조회를 둔다. JSX 안에서 non-null 단언을 쓰지 않기 위해서다.

```tsx
  const Calculator = dispute.calculator ? CALCULATORS[dispute.calculator] : undefined;
```

쟁점 `</section>` 다음, `<DisputeFooter ... />` 앞에 삽입:

```tsx
      {Calculator && (
        <section>
          <h2 className="text-xl font-bold text-foreground">숫자로 보기</h2>
          <p className="mt-1 mb-4 text-base leading-relaxed text-muted-foreground">
            가정을 바꾸면 결과가 어떻게 움직이는지 직접 확인하세요. 판단은 독자가 합니다.
          </p>
          <Calculator />
        </section>
      )}
```

- [ ] **Step 8: 빌드와 화면 확인**

Run: `npx tsc --noEmit && npx jest && npx next build`

dev 서버에서 `/disputes/education-grant`를 열고 확인한다.
- 반영률 슬라이더를 0%까지 내리면 "새 산식" 값이 커진다
- 100%까지 올리면 값이 작아진다
- 경상성장률을 −2%까지 내리면 감소분 보전 경고 박스가 나타난다
- 콘솔 오류 0건

- [ ] **Step 9: 커밋**

```bash
git add src/lib/disputes src/components/disputes src/app/disputes
git commit -m "$(cat <<'EOF'
feat(disputes): 교부금 산식 계산기와 레지스트리 슬롯

국가재정운용계획 17쪽 산식을 그대로 구현하고 반영률·경상성장률·학령인구
변화율을 슬라이더로 노출한다. 숫자 하나가 조 단위를 가르는 구조를 독자가
직접 확인하게 하는 것이 목적이다.

감소분 보전 하한이 걸리면 그 보전이 명목 금액 기준이라는 한계를 함께 띄운다.

테스트 8종 추가 — 하한 작동, 반영률 0일 때 학령인구 무영향, 반영률
증가에 따른 감소, 잘못된 입력 거부.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: 미래대응기금·연금 분쟁

**Files:**
- Create: `src/lib/disputes/future-fund.ts`
- Create: `src/lib/disputes/pension.ts`
- Create: `src/components/disputes/DisputeComparison.tsx`
- Create: `src/components/disputes/calculators/FundScenario.tsx`
- Modify: `src/lib/disputes/index.ts`
- Modify: `src/components/disputes/calculators/index.ts`
- Modify: `src/app/disputes/[slug]/page.tsx`

**Interfaces:**
- Consumes: Task 1~4의 타입과 컴포넌트 전부
- Produces: `futureFund: Dispute`, `pension: Dispute`, `FundScenario` 컴포넌트, `DisputeComparison` 컴포넌트

- [ ] **Step 1: 미래대응기금 데이터 작성**

`src/lib/disputes/future-fund.ts`

```ts
import type { Dispute } from './types';

export const futureFund: Dispute = {
  slug: 'future-fund',
  title: '미래대응기금 신설과 위탁 운용',
  question: '162조원 규모 신설 기금의 여유자금 104조원을 민간에 위탁해 운용할 것인가',
  stage: 'committee',
  scale: '162조 3,000억원',
  nextMilestone: { date: '2026-12-02', label: '예산 법정 처리기한' },

  figures: [
    {
      label: '기금 총 규모',
      value: '162조 3,000억원',
      kind: 'announced',
    },
    {
      label: '여유자금',
      value: '104조 4,000억원',
      note: '사업비 45조 4,000억원과 국채발행 축소분 12조 5,000억원을 뺀 금액',
      kind: 'announced',
    },
    {
      label: '교육·인재계정',
      value: '10조 1,000억원',
      note: '전체의 약 6%. 교부금 개편 차액이 이 계정으로 들어간다',
      kind: 'announced',
    },
  ],

  timeline: [
    { date: '2026-09-01', label: '국무회의 의결', status: 'done' },
    {
      date: '2026-09-03',
      label: '국회 제출',
      detail: '기금운용계획안이 예산안과 함께 제출됐다',
      status: 'current',
    },
    { date: '2026-12-02', label: '예산 법정 처리기한', status: 'upcoming' },
  ],

  positions: [
    {
      side: 'for',
      actor: '기획예산처',
      claim:
        '전략적 투자 플랫폼이자 경기 변동에 대응하는 재정 안정화 장치다',
      source: '2027년 예산안 보도자료',
    },
    {
      side: 'against',
      actor: '임이자 의원',
      claim:
        '국회 심의를 피해 언제든 꺼내 쓸 수 있는 상시 추경 통로가 된다',
      source: '국정감사 질의',
    },
    {
      side: 'against',
      actor: '참여연대',
      claim:
        '기금 사업을 변경할 때의 요건과 절차를 지금보다 엄격하게 정해야 한다',
      source: '참여연대 논평',
    },
    {
      side: 'neutral',
      actor: '노르웨이 국부펀드(GPFG) 사례',
      claim:
        '국내 자산 투자를 전면 금지하고 원금 인출을 막는 규정으로 정치적 사용을 차단한다',
      evidence: '한국 미래대응기금에는 이에 해당하는 규정이 아직 없다',
      source: '자본시장연구원 OCIO 개선과제',
    },
  ],

  calculator: 'fund-scenario',

  caveats: [
    '민간 위탁(OCIO) 운용은 확정된 것이 아니라 검토 단계다. 장관 발표문에는 위탁 운용 언급 없이 재정 안정화 기능만 설명돼 있다.',
    '세수 결손으로 기금을 헐어야 하는 시점과 자산가격이 떨어지는 시점은 대체로 겹친다. 손실을 확정하고 인출하게 되는 구조다.',
    '교육·인재계정은 전체의 6%다. 교부금 차액이 이 계정으로 보장된다는 설명은 계정 간 이동이지 증액이 아니다.',
  ],

  sources: [
    {
      title: '2027년 예산안 및 2026~2030년 국가재정운용계획',
      publisher: '기획예산처',
      date: '2026-09-01',
    },
    {
      title: '미래대응기금, 국회 통제 밖 상시 추경 우려',
      publisher: '뉴스토마토',
      date: '2026-09-04',
    },
    {
      title: 'OCIO 제도 개선과제',
      publisher: '자본시장연구원',
      date: '2025-11',
    },
  ],

  updatedAt: '2026-09-07',
};
```

- [ ] **Step 2: 연금 데이터 작성 (계산기 없음)**

`src/lib/disputes/pension.ts`

`calculator`를 넣지 않고 `comparison`을 채운다.

```ts
import type { Dispute } from './types';

export const pension: Dispute = {
  slug: 'pension',
  title: '공적연금 적자 보전',
  question:
    '교부금에는 인구 연동 산식을 씌우면서 연금 보전금에는 상한을 두지 않는 것이 일관적인가',
  stage: 'ongoing',
  scale: '연 10조원',

  figures: [
    {
      label: '2025년 공무원연금 국가보전금',
      value: '10조 475억원',
      kind: 'announced',
    },
    {
      label: '2026~2065 누적 국고 부담',
      value: '약 629조원',
      note: '공무원연금·군인연금 합산 추계',
      kind: 'estimated',
    },
    {
      label: '교부금 개편 차액 (비교)',
      value: '약 21조원',
      note: '연 단위. 연금 보전금 두 해 치에 해당한다',
      kind: 'derived',
    },
  ],

  timeline: [
    {
      date: '2015-05-29',
      label: '공무원연금법 개정',
      detail: '기여율 인상·지급률 인하. 군인연금은 개혁 대상에서 빠졌다',
      status: 'done',
    },
    {
      date: '2022-09-20',
      label: 'OECD 한국 경제보고서',
      detail: '공적연금 통합을 개혁 방안 가운데 하나로 제시',
      status: 'done',
    },
    {
      date: '2026-09-01',
      label: '의무지출 구조개편 착수 발표',
      detail: '국가재정운용계획에 연금·의료·국채이자를 포함한 의무지출 개편 방침이 담겼다',
      status: 'current',
    },
  ],

  positions: [
    {
      side: 'for',
      actor: '기획예산처',
      claim: '그간 성역으로 여겨져 온 의무지출의 구조개편에 착수한다',
      source: '2026~2030년 국가재정운용계획',
    },
    {
      side: 'neutral',
      actor: 'OECD',
      claim: '공적연금 통합을 한국 연금개혁의 선택지 가운데 하나로 제시했다',
      source: 'OECD 한국 경제보고서 2022',
    },
    {
      side: 'against',
      actor: '공무원노동조합',
      claim:
        '2015년 개혁으로 이미 기여율을 올리고 지급률을 낮췄다. 추가 삭감은 이중 부담이다',
      source: '공무원노조 성명',
    },
  ],

  comparison: {
    caption: '2026~2030년 연평균 증가율 (국가재정운용계획)',
    rows: [
      {
        label: '의무지출',
        value: '8.5%',
        note: '연금·의료·국채이자 등 법으로 지출이 정해진 항목',
        kind: 'announced',
      },
      {
        label: '재량지출',
        value: '8.3%',
        note: '해마다 국회 심의로 정하는 항목',
        kind: 'announced',
      },
    ],
  },

  caveats: [
    '이미 확정된 연금 수급권을 소급해 깎는 것은 위헌 소지가 있다. 지급액 삭감은 현실적인 선택지가 아니다.',
    '자동조정장치는 국내에 도입된 전례가 없다. 계산 결과가 전부 가정이 되므로 이 분쟁에는 계산기를 두지 않았다.',
    '군인연금은 2015년 공무원연금 개혁 대상에서 제외됐다. 두 제도를 같은 기준으로 비교할 때 주의가 필요하다.',
  ],

  sources: [
    {
      title: '공적연금 재정통계',
      publisher: '기획재정부 열린재정 (mods.go.kr)',
      date: '2026-08',
      url: 'https://www.mods.go.kr',
    },
    {
      title: '2026~2030년 국가재정운용계획',
      publisher: '기획예산처',
      date: '2026-09-01',
    },
    {
      title: 'OECD Economic Surveys: Korea 2022',
      publisher: 'OECD',
      date: '2022-09-20',
    },
  ],

  updatedAt: '2026-09-07',
};
```

- [ ] **Step 3: ④ 대체 컴포넌트 작성**

`src/components/disputes/DisputeComparison.tsx`

```tsx
import type { DisputeFigure } from '@/lib/disputes/types';
import { FIGURE_KIND_LABEL } from '@/lib/datacenter/types';

export function DisputeComparison({
  caption,
  rows,
}: {
  caption: string;
  rows: DisputeFigure[];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[420px] text-base">
        <caption className="p-3 text-left font-mono text-xs text-muted-foreground">
          {caption}
        </caption>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-border">
              <td className="px-4 py-3 text-foreground">
                {r.label}{' '}
                <span className="font-mono text-xs text-muted-foreground">
                  {FIGURE_KIND_LABEL[r.kind]}
                </span>
                {r.note && (
                  <span className="block text-sm text-muted-foreground">{r.note}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right font-bold tabular-nums text-foreground">
                {r.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 4: 기금 시나리오 계산기 작성**

`src/components/disputes/calculators/FundScenario.tsx`

`GrantFormula.tsx`의 `Slider`·`Figure` 보조 컴포넌트를 같은 형태로 이 파일에도 둔다. 공용 파일로 추출하는 것은 세 번째 계산기가 생길 때 한다.

```tsx
'use client';

import { useState } from 'react';

/** 여유자금 기본값 (조원) */
const IDLE_FUND_JO = 104.4;

export function FundScenario() {
  const [annualReturn, setAnnualReturn] = useState(0.04);
  const [years, setYears] = useState(3);

  const endingJo = IDLE_FUND_JO * Math.pow(1 + annualReturn, years);
  const gainJo = endingJo - IDLE_FUND_JO;
  const gainPct = (gainJo / IDLE_FUND_JO) * 100;
  const isLoss = gainJo < 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Slider
          label="연 수익률"
          value={annualReturn}
          min={-0.2}
          max={0.1}
          step={0.005}
          display={`${(annualReturn * 100).toFixed(1)}%`}
          note="2008년 금융위기에 주요 연기금은 −20%대를 기록했다"
          onChange={setAnnualReturn}
        />
        <Slider
          label="보유 기간"
          value={years}
          min={1}
          max={10}
          step={1}
          display={`${years}년`}
          note="세수 결손이 나면 이 기간을 채우지 못하고 헐어야 한다"
          onChange={setYears}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Figure label="원금" value={`${IDLE_FUND_JO.toFixed(1)}조원`} />
        <Figure label={`${years}년 후`} value={`${endingJo.toFixed(1)}조원`} />
        <Figure
          label="손익"
          value={`${gainJo >= 0 ? '+' : '−'}${Math.abs(gainJo).toFixed(1)}조원 (${gainPct >= 0 ? '+' : '−'}${Math.abs(gainPct).toFixed(1)}%)`}
        />
      </div>

      {isLoss && (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-sm leading-relaxed text-foreground">
          손실 구간입니다. 세수 결손으로 재정 보강이 필요해지는 시점은 자산가격이 떨어지는
          시점과 대체로 겹칩니다. 손실을 확정한 채로 인출해야 하는 상황이 이 기금의 구조적
          위험입니다.
        </p>
      )}

      <p className="text-sm leading-relaxed text-muted-foreground">
        여유자금 {IDLE_FUND_JO}조원이 전액 같은 수익률로 운용된다고 가정한 단순 복리
        계산입니다. 실제 운용은 자산군별 배분과 인출 일정에 따라 달라집니다.
      </p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  note,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  note: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-medium text-foreground">{label}</span>
        <span className="text-base font-bold tabular-nums text-foreground">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-blue-600"
        aria-label={label}
      />
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
```

- [ ] **Step 5: 레지스트리와 목록에 등록**

`src/components/disputes/calculators/index.ts`를 다음으로 바꾼다.

```ts
import type { ComponentType } from 'react';
import type { CalculatorKey } from '@/lib/disputes/types';
import { GrantFormula } from './GrantFormula';
import { FundScenario } from './FundScenario';

/** 분쟁별 계산기. 키는 lib/disputes/types.ts가 소유한다. */
export const CALCULATORS: Partial<Record<CalculatorKey, ComponentType>> = {
  'grant-formula': GrantFormula,
  'fund-scenario': FundScenario,
};
```

`src/lib/disputes/index.ts`를 다음으로 바꾼다.

```ts
import type { Dispute } from './types';
import { educationGrant } from './education-grant';
import { futureFund } from './future-fund';
import { pension } from './pension';

/** 목록 화면의 표시 순서이기도 하다. 규모가 큰 것부터 둔다. */
export const ALL_DISPUTES: readonly Dispute[] = [educationGrant, futureFund, pension];

export function getDispute(slug: string): Dispute | undefined {
  return ALL_DISPUTES.find((d) => d.slug === slug);
}

export * from './types';
```

- [ ] **Step 6: 상세 라우트에 comparison 분기 추가**

`src/app/disputes/[slug]/page.tsx`에 import를 추가한다.

```tsx
import { DisputeComparison } from '@/components/disputes/DisputeComparison';
```

Task 4에서 넣은 `{Calculator && ( ... )}` 블록 바로 아래에 삽입한다.

```tsx
      {!Calculator && dispute.comparison && (
        <section>
          <h2 className="text-xl font-bold text-foreground">숫자로 보기</h2>
          <p className="mt-1 mb-4 text-base leading-relaxed text-muted-foreground">
            이 분쟁에는 계산기를 두지 않았습니다. 자동조정장치는 국내에 도입된 전례가 없어
            계산 결과가 전부 가정이 되기 때문입니다. 확인된 수치만 나란히 놓습니다.
          </p>
          <DisputeComparison
            caption={dispute.comparison.caption}
            rows={dispute.comparison.rows}
          />
        </section>
      )}
```

- [ ] **Step 7: 검증**

Run: `npx tsc --noEmit && npx jest && npx next build`
Expected: 무결성 테스트가 3건 모두를 검사하고 통과한다. 빌드 목록에 `/disputes/future-fund`와 `/disputes/pension`이 나타난다.

dev 서버에서 확인한다.
- `/disputes/future-fund` — 연 수익률을 −20%로 내리면 빨간 경고 박스가 나타난다
- `/disputes/pension` — 계산기 대신 2행짜리 대조표가 나오고, 그 위에 계산기를 두지 않은 이유가 적혀 있다

- [ ] **Step 8: 커밋**

```bash
git add src/lib/disputes src/components/disputes src/app/disputes
git commit -m "$(cat <<'EOF'
feat(disputes): 미래대응기금·연금 분쟁 추가

연금에는 계산기를 두지 않는다. 자동조정장치가 국내에 도입된 적이 없어
계산 결과가 전부 가정이 되기 때문이다. 확인된 수치 대조표로 대체하고
계산기를 두지 않은 이유를 화면에 그대로 적었다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: 네비게이션과 sitemap

**Files:**
- Modify: `src/components/layout/Header.tsx:13-22`
- Modify: `src/app/sitemap.ts:29`

**Interfaces:**
- Consumes: `/disputes` 라우트 (Task 2)
- Produces: 헤더 진입점, 검색엔진 등록

- [ ] **Step 1: 헤더 탭 추가**

`src/components/layout/Header.tsx:13`의 `MAIN_TABS` 배열 마지막에 한 줄을 넣는다. `PLEDGE_TABS`와 `AI_SUB_TABS`는 이 배열 밖의 드롭다운이므로, 배열 끝에 두면 화면상 `국채시계 · 분쟁 · 공약∨` 순서가 된다.

```ts
const MAIN_TABS = [
  { href: "/about", label: "소개" },
  { href: "/guide", label: "가이드" },
  { href: "/", label: "트리맵" },
  { href: "/table", label: "테이블" },
  { href: "/compare", label: "비교" },
  { href: "/regional", label: "지역지도" },
  { href: "/fiscal-health", label: "재정건전성" },
  { href: "/debt-clock", label: "국채시계" },
  { href: "/disputes", label: "분쟁" },
];
```

데스크톱(`Header.tsx:116`)과 모바일 메뉴(`Header.tsx:359`)가 모두 이 배열을 순회하므로 추가 수정은 없다.

- [ ] **Step 2: sitemap에 등록**

`src/app/sitemap.ts`는 수동 목록이라 페이지를 만들어도 자동 등록되지 않는다. `/datacenter` 줄(29행) 다음에 네 줄을 추가한다.

```ts
    { url: `${base}/disputes`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/disputes/education-grant`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/disputes/future-fund`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/disputes/pension`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
```

- [ ] **Step 3: 최종 검증**

Run: `npx tsc --noEmit && npx eslint src/components/disputes src/lib/disputes src/app/disputes && npx jest && npx next build`

dev 서버에서 확인한다.
- 헤더에 `분쟁`이 보이고 클릭하면 `/disputes`로 이동한다
- 목록에 카드 3장이 뜬다
- 각 상세 페이지의 절이 올바르게 나온다 (연금만 계산기 대신 대조표)
- 모바일 폭 375px에서 가로 스크롤이 없다
- 브라우저 콘솔 오류 0건

- [ ] **Step 4: 커밋과 푸시**

```bash
git add src/components/layout/Header.tsx src/app/sitemap.ts
git commit -m "$(cat <<'EOF'
feat(disputes): 헤더 진입점과 sitemap 등록

드롭다운 대신 단일 링크를 둔다. 헤더에 이미 항목이 많아 좁고, 분쟁이
3건뿐이라 목록으로 바로 보내는 편이 낫다.

sitemap.ts는 수동 목록이라 페이지를 만들어도 자동 등록되지 않는다.
네 경로를 직접 추가했다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
git push origin main
```

---

## 완료 기준

- `budget.ai.kr/disputes`에 분쟁 3건이 보인다
- 헤더 `분쟁` 링크가 데스크톱·모바일 모두에서 동작한다
- 교부금 상세에서 반영률 슬라이더를 움직이면 금액과 차액이 함께 바뀐다
- 기금 상세에서 수익률을 음수로 내리면 손실 경고가 나타난다
- 연금 상세에는 계산기 대신 대조표가 나오고, 계산기를 두지 않은 이유가 화면에 적혀 있다
- `npx jest` 전체 통과 (신규 19건 포함)
- `npx next build` 통과, `/disputes` 계열 4개 경로가 정적 생성된다
