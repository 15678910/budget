/**
 * ⑧ 미래대응기금 쓰임새 네 가지를 같은 엔진으로 비교한다.
 * S1 현행 예탁 · S2 규칙 있는 위탁 · S3 아동 미래 계좌 · S4 기본소득 기금 종잣돈.
 */
import { childScenario } from './child-account';
import { simulate } from './engine';
import { firstPassingYear, maxSustainableNow } from './search';
import type { FutureFundInput, ScenarioId, ScenarioRow, SimInput } from './types';

interface ScenarioText {
  id: ScenarioId;
  label: string;
  control: string;
  futureGeneration: string;
}

const TEXT: readonly ScenarioText[] = [
  {
    id: 'S1',
    label: '현행(공자기금 예탁)',
    control: '국회 통제는 있지만 기본소득 재원은 되지 않는다',
    futureGeneration: '해당 없음',
  },
  {
    id: 'S2',
    label: '규칙 있는 위탁 운용',
    control: '수익은 늘지만 국회 심의 밖 위험이 있다(30% 변경 범위)',
    futureGeneration: '추가 수익은 일반회계로 간다',
  },
  {
    id: 'S3',
    label: '아동 미래 계좌',
    control: '계좌 규칙을 법으로 정하면 국회 통제가 유지된다',
    futureGeneration: '미래 세대에 집중되지만 전 국민 기본소득은 아니다',
  },
  {
    id: 'S4',
    label: '기본소득 기금 종잣돈',
    control: '기금 규칙을 법으로 정해야 하고 기존 사업 재원과 겹친다',
    futureGeneration: '지금 1인당 액수가 생기고 원금은 다음 세대로 넘어간다',
  },
];

export function runFutureFundScenarios(base: SimInput, ff: FutureFundInput): ScenarioRow[] {
  const surplus = Math.max(0, Number.isFinite(ff.surplusFund) ? ff.surplusFund : 0);
  return TEXT.map((t) => {
    const seed = t.id === 'S4' ? base.initialFund + surplus : base.initialFund;
    const input: SimInput = { ...base, initialFund: seed };
    return {
      ...t,
      seed,
      nowAnnualWon: maxSustainableNow(input).annualWon,
      targetYear: firstPassingYear(input),
      sustainable: simulate(input).verdict.sustainable,
      extraReturnToGeneral: t.id === 'S2' ? surplus * (ff.consignReturn - ff.depositRate) : null,
      child:
        t.id === 'S3'
          ? childScenario({ ...ff.child, fund: surplus, withdrawalRate: base.withdrawalRate })
          : null,
    };
  });
}
