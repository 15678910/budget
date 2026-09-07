/**
 * 시도별 교부금 감소 영향
 *
 * 전국 감소액(억원)을 시도별 이전수입 비중으로 안분해, 그 지역이 실제로
 * 감당해야 할 압박(비인건비 세출 대비 감소율)을 계산한다.
 *
 * 인건비는 단기에 줄이기 어려우므로, 감소액을 인건비를 뺀 나머지 세출로
 * 나눈 값이 그 교육청이 실제로 흡수해야 하는 압박에 가깝다. 1(100%)을
 * 넘으면 인건비를 건드리지 않고는 흡수할 수 없다는 뜻이다.
 */
import { REGIONS } from './regional-data';

export interface RegionImpact {
  name: string;
  /** 전국 이전수입 대비 이 지역의 비중 (0~1) */
  share: number;
  /** 안분된 감소액 (억원) */
  cutEok: number;
  /** 세출 중 인건비 비중 (0~1) */
  payrollRatio: number;
  /** 인건비를 뺀 세출 (억원) */
  nonPayrollEok: number;
  /** 감소액 ÷ 비인건비 세출. 1을 넘으면 인건비를 건드려야 한다는 뜻 */
  pressure: number;
  /** 2025년 초·중·고 학생 수 (명) */
  students: number;
  /** 2024→2025 학생 수 변화율 (소수. -0.03 = 3% 감소) */
  studentChange: number;
  /** 학생 1인당 차액 (원). cutEok가 0이면 0 */
  perStudentWon: number;
}

/** 전 지역 이전수입 합계 (억원) */
export const TOTAL_TRANSFER_EOK = REGIONS.reduce((sum, r) => sum + r.transferEok, 0);

export function regionalImpact(cutEok: number): RegionImpact[] {
  const safeCutEok = Number.isFinite(cutEok) && cutEok > 0 ? cutEok : 0;

  const results = REGIONS.map((region) => {
    const share = region.transferEok / TOTAL_TRANSFER_EOK;
    const regionCutEok = safeCutEok * share;
    const payrollRatio = region.payrollEok / region.spendingEok;
    const nonPayrollEok = region.spendingEok - region.payrollEok;
    const pressure = safeCutEok === 0 ? 0 : regionCutEok / nonPayrollEok;
    const perStudentWon =
      safeCutEok === 0 ? 0 : Math.round((regionCutEok * 100_000_000) / region.studentsFY2025);

    return {
      name: region.name,
      share,
      cutEok: regionCutEok,
      payrollRatio,
      nonPayrollEok,
      pressure,
      students: region.studentsFY2025,
      studentChange: region.studentChangeRate,
      perStudentWon,
    };
  });

  return results.sort((a, b) => b.pressure - a.pressure);
}
