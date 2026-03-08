/** Color mapping for 17 시도교육청 */
export const EDUCATION_COLORS: Record<string, string> = {
  '서울특별시교육청': '#D32F2F',
  '부산광역시교육청': '#F57C00',
  '대구광역시교육청': '#FBC02D',
  '인천광역시교육청': '#388E3C',
  '광주광역시교육청': '#00897B',
  '대전광역시교육청': '#1976D2',
  '울산광역시교육청': '#7B1FA2',
  '세종특별자치시교육청': '#C2185B',
  '경기도교육청': '#1565C0',
  '강원특별자치도교육청': '#0097A7',
  '충청북도교육청': '#2E7D32',
  '충청남도교육청': '#558B2F',
  '전북특별자치도교육청': '#EF6C00',
  '전라남도교육청': '#D84315',
  '경상북도교육청': '#5D4037',
  '경상남도교육청': '#455A64',
  '제주특별자치도교육청': '#00796B',
};

const DEFAULT_COLOR = '#9E9E9E';

export function getEducationColor(officeName: string): string {
  return EDUCATION_COLORS[officeName] ?? DEFAULT_COLOR;
}
