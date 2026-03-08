export interface BudgetUnit {
  id: string;
  name: string;
  price: number;
  counter: string;
  emoji?: string;
}

export const BUDGET_UNITS: BudgetUnit[] = [
  { id: 'won', name: '원', price: 1, counter: '원' },
  { id: 'chicken', name: '치킨', price: 20_000, counter: '마리', emoji: '🍗' },
  { id: 'jajangmyeon', name: '짜장면', price: 7_000, counter: '그릇', emoji: '🍜' },
  { id: 'coffee', name: '아메리카노', price: 4_500, counter: '잔', emoji: '☕' },
  { id: 'movie', name: '영화표', price: 15_000, counter: '장', emoji: '🎬' },
  { id: 'pension', name: '국민연금 월수령액', price: 620_000, counter: '개월분', emoji: '👴' },
  { id: 'iphone', name: 'iPhone', price: 1_500_000, counter: '대', emoji: '📱' },
  { id: 'salary', name: '평균 연봉', price: 42_000_000, counter: '명분', emoji: '💼' },
  { id: 'ktx', name: 'KTX 서울-부산', price: 59_800, counter: '편도', emoji: '🚄' },
  { id: 'tuition', name: '대학등록금(1학기)', price: 4_000_000, counter: '학기', emoji: '🎓' },
  { id: 'apartment', name: '서울 아파트(중위)', price: 900_000_000, counter: '채', emoji: '🏠' },
];

export function convertToUnit(
  amountInMillions: number,
  unit: BudgetUnit
): { count: number; formatted: string } {
  const totalWon = amountInMillions * 1_000_000;
  const count = totalWon / unit.price;

  let formatted: string;
  if (count >= 1_000_000_000) {
    formatted = `${(count / 1_000_000_000).toFixed(1)}십억`;
  } else if (count >= 100_000_000) {
    formatted = `${(count / 100_000_000).toFixed(1)}억`;
  } else if (count >= 10_000) {
    formatted = `${Math.round(count / 10_000).toLocaleString('ko-KR')}만`;
  } else if (count >= 1) {
    formatted = Math.round(count).toLocaleString('ko-KR');
  } else {
    formatted = count.toFixed(2);
  }

  return { count, formatted };
}

export function formatUnitConversion(amountInMillions: number, unit: BudgetUnit): string {
  if (unit.id === 'won') return '';
  const { formatted } = convertToUnit(amountInMillions, unit);
  const emoji = unit.emoji ? `${unit.emoji} ` : '';
  return `${emoji}약 ${formatted}${unit.counter} ${unit.name}`;
}
