// ============================================================
// VLR(Voluntary Local Review) 지역 자기평가 리포트 — 데이터 구조화기 (순수)
// ============================================================
//
// 근거: UN-Habitat Action-Oriented VLR Methodology (2024), VLR Guidelines Vol.1/2.
//   SDSN/Bertelsmann SDG Index 달성도(green/red 앵커) 위에 6단계 구조를 파생한다.
//
// 정직성 원칙(설계 명세 §8):
//   - 전부 데이터 파생. 내러티브는 규칙형 템플릿(자유 생성 금지).
//   - 달성도(목표값 대비)와 16광역 상대점수는 의미가 다르며, 여기서는 '달성도'만 쓴다.
//   - 정책 인과 주장 0. lessons는 "달성도 낮음 → 점검 권장" 류의 점검 권고만.
//
// 순수 함수: 동일 입력 → 동일 출력. 외부 IO 없음(getTargets는 주입).
// ============================================================

import type { IndicatorDirection } from '@/lib/data/local-sdg-data';
import { regionGoalAchievement } from './achievement';
import type { GoalAchievementByGoal } from './scoring';
import type { TrafficLight } from './scoring';
import { SDG_GOALS } from './goals';
import type { KsdgsTarget } from './ontology';

// ── 입력 ────────────────────────────────────────────────────

/** 단일 지역 재정 맥락(page에서 fiscalByRegion[region]로 주입). */
export interface VLRFiscal {
  /** 예산규모(억원) */
  budget: number;
  /** 재정자립도(%) */
  independence: number;
  /** 재정자주도(%) */
  autonomy: number;
  /** 채무비율(%) = debt/budget*100 */
  debtRatio: number;
  /** 인구(명) */
  population: number;
}

/** 전국 평균 재정 기준값(재정 취약 판정용). 미주입 시 문서화된 기본값 사용. */
export interface VLRNationalAvg {
  independence: number;
  autonomy: number;
}

export interface VLRDeps {
  /** 지표 id → (지역 약칭 → 값). board-data assembleIndicatorValues() 산출. */
  valuesByIndicator: Record<string, Record<string, number>>;
  /** 지표 id → 해석방향. */
  direction: Record<string, IndicatorDirection>;
  /** 단일 지역 재정. 없으면 null(방어). */
  fiscal: VLRFiscal | null;
  /** 목표 번호 → K-SDGs 세부목표. ontology.getTargets 주입. */
  getTargets: (goalNum: number) => KsdgsTarget[];
  /** 전국 평균 재정(재정 취약 판정). 생략 시 DEFAULT_NATIONAL_AVG. */
  nationalAvg?: VLRNationalAvg;
}

// 16광역 평균 재정 기준(2024 회계연도 기준 광역 평균 근사).
// page에서 fiscalByRegion으로 실측 평균을 주입하면 그 값을 우선한다.
// 미주입 시의 보수적 기본값(자립도 약 45%, 자주도 약 70%) — 광역 평균대.
export const DEFAULT_NATIONAL_AVG: VLRNationalAvg = { independence: 45, autonomy: 70 };

// ── 출력 ────────────────────────────────────────────────────

/** ① 배경·지역 맥락 */
export interface VLRContext {
  population: number;
  budget: number;
  independence: number;
  autonomy: number;
  debtRatio: number;
}

/** ② SDG 지역화 현황 */
export interface VLRLocalization {
  /** 데이터 보유 목표 수(/17) */
  dataGoalCount: number;
  /** 평가 방법 안내(규칙형 템플릿) */
  methodologyNote: string;
}

/** ③ 목표별 진행 현황(목표 1건) */
export interface VLRGoalProgress {
  goalNum: number;
  name: string;
  /** 달성도 0~100. 데이터 없으면 null. */
  score: number | null;
  /** 신호등. 데이터 없으면 null. */
  light: TrafficLight | null;
  /** 대표값 텍스트(있을 때만) — 산정 지표 수 등. */
  repValueText?: string;
}

/** ④ 우선 목표(강·약점 1건) */
export interface VLRPriorityGoal {
  goalNum: number;
  name: string;
  score: number;
  light: TrafficLight;
  /** 해당 목표의 K-SDGs 세부목표(심층 참고용). */
  targets: KsdgsTarget[];
}

export interface VLRPriorities {
  strengths: VLRPriorityGoal[];
  weaknesses: VLRPriorityGoal[];
}

/** ⑤ 이행 수단(재정) */
export interface VLRMeans {
  budget: number;
  independence: number;
  autonomy: number;
  debtRatio: number;
}

/** VLR 6섹션 구조 */
export interface VLRReport {
  region: string;
  context: VLRContext;
  localization: VLRLocalization;
  goalProgress: VLRGoalProgress[];
  priorities: VLRPriorities;
  means: VLRMeans;
  /** ⑥ 교훈·향후 계획(규칙형 문장 배열) */
  lessons: string[];
}

// ── 내부 헬퍼 ────────────────────────────────────────────────

const GOAL_NAME: Record<number, string> = Object.fromEntries(
  SDG_GOALS.map((g) => [g.num, g.name]),
);

const LIGHT_LABEL: Record<TrafficLight, string> = {
  green: '양호',
  yellow: '보통',
  orange: '주의',
  red: '취약',
};

/** 빈/방어 컨텍스트(fiscal 없음). */
function emptyContext(): VLRContext {
  return { population: 0, budget: 0, independence: 0, autonomy: 0, debtRatio: 0 };
}

function contextOf(fiscal: VLRFiscal | null): VLRContext {
  if (!fiscal) return emptyContext();
  return {
    population: fiscal.population,
    budget: fiscal.budget,
    independence: fiscal.independence,
    autonomy: fiscal.autonomy,
    debtRatio: fiscal.debtRatio,
  };
}

function meansOf(fiscal: VLRFiscal | null): VLRMeans {
  if (!fiscal) return { budget: 0, independence: 0, autonomy: 0, debtRatio: 0 };
  return {
    budget: fiscal.budget,
    independence: fiscal.independence,
    autonomy: fiscal.autonomy,
    debtRatio: fiscal.debtRatio,
  };
}

/** 17목표 진행 현황 배열(데이터 없는 목표는 score/light=null). */
function buildGoalProgress(ach: GoalAchievementByGoal): VLRGoalProgress[] {
  const out: VLRGoalProgress[] = [];
  for (let goalNum = 1; goalNum <= 17; goalNum++) {
    const a = ach[goalNum];
    if (!a) {
      out.push({ goalNum, name: GOAL_NAME[goalNum] ?? `목표 ${goalNum}`, score: null, light: null });
      continue;
    }
    out.push({
      goalNum,
      name: GOAL_NAME[goalNum] ?? `목표 ${goalNum}`,
      score: a.score,
      light: a.light,
      repValueText: `달성도 ${a.score}점 · 산정 지표 ${a.indicatorCount}개`,
    });
  }
  return out;
}

/** 강점/약점 도출 — 데이터 보유 목표만, 달성도 내림/오름차순 Top3. */
function buildPriorities(
  ach: GoalAchievementByGoal,
  getTargets: (goalNum: number) => KsdgsTarget[],
): VLRPriorities {
  const withData: { goalNum: number; score: number; light: TrafficLight }[] = [];
  for (let goalNum = 1; goalNum <= 17; goalNum++) {
    const a = ach[goalNum];
    if (a) withData.push({ goalNum, score: a.score, light: a.light });
  }
  // 강점: 점수 내림차순(동점 시 goalNum 오름차순으로 안정 정렬)
  const byDesc = [...withData].sort((x, y) => y.score - x.score || x.goalNum - y.goalNum);
  // 약점: 점수 오름차순(동점 시 goalNum 오름차순)
  const byAsc = [...withData].sort((x, y) => x.score - y.score || x.goalNum - y.goalNum);

  const toGoal = (g: { goalNum: number; score: number; light: TrafficLight }): VLRPriorityGoal => ({
    goalNum: g.goalNum,
    name: GOAL_NAME[g.goalNum] ?? `목표 ${g.goalNum}`,
    score: g.score,
    light: g.light,
    targets: getTargets(g.goalNum),
  });

  return {
    strengths: byDesc.slice(0, 3).map(toGoal),
    weaknesses: byAsc.slice(0, 3).map(toGoal),
  };
}

/**
 * ⑥ 교훈 — 규칙형(자유 생성 금지). 약점 목표별 점검 권고 + 재정 취약 시 한 줄.
 * 정해진 템플릿 문장만 생성한다.
 */
function buildLessons(
  weaknesses: VLRPriorityGoal[],
  fiscal: VLRFiscal | null,
  natAvg: VLRNationalAvg,
): string[] {
  const lessons: string[] = [];
  for (const w of weaknesses) {
    lessons.push(
      `${w.name}(목표 ${w.goalNum}) 달성도 ${w.score}점(${LIGHT_LABEL[w.light]}) — 점검 권장.`,
    );
  }
  if (fiscal) {
    if (fiscal.independence < natAvg.independence) {
      lessons.push(
        `재정자립도 ${fiscal.independence}%로 전국 광역 평균(${natAvg.independence}%) 미만 — 이행 수단(재원) 점검 권장.`,
      );
    } else if (fiscal.autonomy < natAvg.autonomy) {
      lessons.push(
        `재정자주도 ${fiscal.autonomy}%로 전국 광역 평균(${natAvg.autonomy}%) 미만 — 자주재원 기반 점검 권장.`,
      );
    }
  }
  return lessons;
}

// ── 본체 ────────────────────────────────────────────────────

/**
 * 한 지역의 VLR 6섹션 구조를 파생한다(순수).
 * region이 빈 문자열/미존재면 달성도 데이터가 비어 방어적 빈 구조를 반환한다.
 */
export function buildVLR(region: string, deps: VLRDeps): VLRReport {
  const { valuesByIndicator, direction, fiscal, getTargets } = deps;
  const natAvg = deps.nationalAvg ?? DEFAULT_NATIONAL_AVG;

  // region이 없거나 데이터가 없으면 regionGoalAchievement가 전 목표 null을 반환한다.
  const ach: GoalAchievementByGoal = region
    ? regionGoalAchievement(valuesByIndicator, region, direction)
    : {};

  const goalProgress = buildGoalProgress(ach);
  const dataGoalCount = goalProgress.filter((g) => g.score !== null).length;
  const priorities = buildPriorities(ach, getTargets);
  const lessons = buildLessons(priorities.weaknesses, fiscal, natAvg);

  return {
    region,
    context: contextOf(fiscal),
    localization: {
      dataGoalCount,
      methodologyNote:
        `K-SDGs(국가지속가능발전목표) 17개 목표 중 실데이터 보유 ${dataGoalCount}개 목표를 ` +
        `SDSN 방식(목표값 대비 달성도·신호등)으로 평가했습니다. 상대순위가 아닌 목표 대비 달성도입니다.`,
    },
    goalProgress,
    priorities,
    means: meansOf(fiscal),
    lessons,
  };
}
