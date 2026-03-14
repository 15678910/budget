import { getRegionColor } from './regional-colors';
import { getEducationColor } from './education-colors';

/**
 * Color mapping for major 분야 (policy domains) in the Korean national budget.
 * Colors follow a Seaborn-inspired palette for accessibility and visual distinction.
 */
export const DOMAIN_COLORS: Record<string, string> = {
  '교육':                    '#4C72B0',
  '사회복지':                '#DD8452',
  '국방':                    '#55A868',
  '일반·지역행정':           '#C44E52',
  '공공질서·안전':           '#8172B3',
  '농림수산':                '#937860',
  '산업·중소기업·에너지':    '#DA8BC3',
  '교통·물류':               '#8C8C8C',
  '통신':                    '#CCB974',
  '국토·지역개발':           '#64B5CD',
  '과학기술':                '#4C72B0',
  '환경':                    '#55A868',
  '문화·체육·관광':          '#DD8452',
  '보건':                    '#C44E52',
  '외교·통일':               '#8172B3',
};

/**
 * Color mapping for major 부처 (ministries) in the Korean national budget.
 */
export const MINISTRY_COLORS: Record<string, string> = {
  '보건복지부':         '#DD8452',
  '고용노동부':         '#C44E52',
  '여성가족부':         '#DA8BC3',
  '국토교통부':         '#8C8C8C',
  '교육부':             '#4C72B0',
  '국방부':             '#55A868',
  '행정안전부':         '#8172B3',
  '기획재정부':         '#CCB974',
  '인사혁신처':         '#64B5CD',
  '법제처':             '#937860',
  '법무부':             '#6B4C9A',
  '경찰청':             '#4878D0',
  '소방청':             '#EE854A',
  '해양경찰청':         '#6ACC64',
  '농림축산식품부':     '#956CB4',
  '해양수산부':         '#17BECF',
  '농촌진흥청':         '#8C564B',
  '산림청':             '#2CA02C',
  '산업통상자원부':     '#D62728',
  '중소벤처기업부':     '#FF7F0E',
  '공정거래위원회':     '#9467BD',
  '환경부':             '#1F77B4',
  '과학기술정보통신부': '#BCBD22',
  '한국연구재단':       '#7F7F7F',
  '문화체육관광부':     '#E377C2',
  '문화재청':           '#D4A76A',
  '질병관리청':         '#AEC7E8',
  '식품의약품안전처':   '#98DF8A',
  '외교부':             '#FF9896',
  '통일부':             '#C5B0D5',
  '국가정보원':         '#C49C94',
};

/** Fallback color when a domain/ministry is not found in the mapping */
const FALLBACK_COLOR = '#AAAAAA';

/**
 * Returns the hex color for a given 분야명 (policy domain name).
 * Falls back to a neutral grey when the domain is unrecognised.
 */
export function getDomainColor(domainName: string): string {
  return DOMAIN_COLORS[domainName] ?? FALLBACK_COLOR;
}

/**
 * Returns the hex color for a given 부처명 (ministry name).
 */
export function getMinistryColor(ministryName: string): string {
  return MINISTRY_COLORS[ministryName] ?? FALLBACK_COLOR;
}

/**
 * Returns color based on viewMode.
 */
export function getNodeColor(name: string, viewMode: 'domain' | 'ministry' | 'metro' | 'district' | 'education'): string {
  if (viewMode === 'metro' || viewMode === 'district') return getRegionColor(name);
  if (viewMode === 'education') return getEducationColor(name);
  return viewMode === 'ministry' ? getMinistryColor(name) : getDomainColor(name);
}

/**
 * Converts a hex color (#RRGGBB) to an RGB tuple [r, g, b].
 */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

/**
 * Blends a base color toward white by a given ratio (0 = original, 1 = white).
 */
function lighten(hex: string, ratio: number): string {
  const [r, g, b] = hexToRgb(hex);
  const lr = Math.round(r + (255 - r) * ratio);
  const lg = Math.round(g + (255 - g) * ratio);
  const lb = Math.round(b + (255 - b) * ratio);
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

/**
 * Returns a progressively lighter shade of the domain's base color based on
 * the hierarchy depth. Depth 0 = root/domain (full saturation); higher depths
 * are progressively lighter.
 *
 * depth 0 → base color  (0% lightening)
 * depth 1 → 15% lighter
 * depth 2 → 30% lighter
 * depth 3 → 45% lighter
 * depth 4+ → 55% lighter (cap to remain distinguishable)
 */
export function getDomainColorScale(domainName: string, depth: number): string {
  const base = getDomainColor(domainName);
  const LIGHTEN_PER_DEPTH = 0.15;
  const MAX_LIGHTEN = 0.55;
  const ratio = Math.min(depth * LIGHTEN_PER_DEPTH, MAX_LIGHTEN);
  return lighten(base, ratio);
}
