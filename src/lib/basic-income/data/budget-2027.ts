/**
 * 2027년 정부 예산안 12대 분야 지출(조 원, 기획예산처 2026.9.1 발표).
 * 금액은 보도자료 첨부 PDF에 있고, 여기 값은 그 표를 옮긴 보도(파이낸셜뉴스)에서 가져왔다. 원문 PDF 대조 전.
 * 분야 합계(약 824.4조)는 총지출 820.9조와 다르다(분야 간 중복 집계로 보이나 설명 없음).
 */
import type { BudgetSector, SourcedValue } from '../types';

export const BUDGET_2027_URL = 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156776382';
const NOTE = '보도 표(파이낸셜뉴스 2026.9.1)에서 옮김. 원문 PDF 대조 전';

function sector(id: string, label: string, amount: number): BudgetSector {
  const source: SourcedValue = {
    label: `2027 예산안 ${label}`,
    value: amount,
    unit: '조 원',
    kind: 'source',
    source: '기획예산처 2027년 예산안 보도자료',
    url: BUDGET_2027_URL,
    note: NOTE,
  };
  return { id, label, amount, source };
}

export const BUDGET_2027: BudgetSector[] = [
  sector('welfare', '보건·복지·고용', 289.0),
  sector('admin', '일반·지방행정', 149.0),
  sector('education', '교육', 110.7),
  sector('defense', '국방', 73.3),
  sector('industry', '산업·중소기업·에너지', 41.2),
  sector('rnd', 'R&D', 39.5),
  sector('agri', '농림·수산·식품', 30.7),
  sector('soc', 'SOC', 28.9),
  sector('safety', '공공질서·안전', 28.8),
  sector('environment', '환경', 14.6),
  sector('culture', '문화·체육·관광', 11.6),
  sector('diplomacy', '외교·통일', 7.1),
];
