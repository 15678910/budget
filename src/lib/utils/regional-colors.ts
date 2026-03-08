/** Color mapping for 17 광역시도 */
export const REGION_COLORS: Record<string, string> = {
  '서울특별시': '#E74C3C',
  '부산광역시': '#E67E22',
  '대구광역시': '#F1C40F',
  '인천광역시': '#2ECC71',
  '광주광역시': '#1ABC9C',
  '대전광역시': '#3498DB',
  '울산광역시': '#9B59B6',
  '세종특별자치시': '#E91E63',
  '경기도': '#2196F3',
  '강원특별자치도': '#00BCD4',
  '충청북도': '#4CAF50',
  '충청남도': '#8BC34A',
  '전북특별자치도': '#FF9800',
  '전라남도': '#FF5722',
  '경상북도': '#795548',
  '경상남도': '#607D8B',
  '제주특별자치도': '#009688',
};

const DEFAULT_COLOR = '#9E9E9E';

export function getRegionColor(regionName: string): string {
  return REGION_COLORS[regionName] ?? DEFAULT_COLOR;
}
