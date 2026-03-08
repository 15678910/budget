/**
 * Color scale for budget year-over-year change rates.
 * Inspired by the g0v Taiwan budget visualization.
 *
 * Green spectrum = decrease/stable
 * Pink/magenta spectrum = increase
 * Black = large decrease
 * Red = new item
 */

export interface ChangeColorStop {
  threshold: number;  // minimum change % for this color
  color: string;
  label: string;      // Korean label
}

export const CHANGE_COLOR_SCALE: ChangeColorStop[] = [
  { threshold: 25, color: '#C44E8A', label: '+25% 이상' },
  { threshold: 10, color: '#DA8BC3', label: '+10%~+25%' },
  { threshold: 2, color: '#F0C0D0', label: '+2%~+10%' },
  { threshold: -2, color: '#C8E6C0', label: '-2%~+2%' },
  { threshold: -10, color: '#55A868', label: '-2%~-10%' },
  { threshold: -25, color: '#2D7A3E', label: '-10%~-25%' },
  { threshold: -Infinity, color: '#1A1A1A', label: '-25% 이상' },
];

export const NEW_ITEM_COLOR = '#E74C3C';
export const NEW_ITEM_LABEL = '신규';

/**
 * Returns the color for a given year-over-year change percentage.
 * @param changePercent - The YoY change in percent (e.g., 5.2 means +5.2%)
 * @param isNew - Whether this is a newly added budget item
 */
export function getChangeColor(changePercent: number, isNew = false): string {
  if (isNew) return NEW_ITEM_COLOR;

  for (const stop of CHANGE_COLOR_SCALE) {
    if (changePercent >= stop.threshold) {
      return stop.color;
    }
  }

  return CHANGE_COLOR_SCALE[CHANGE_COLOR_SCALE.length - 1].color;
}

/**
 * Returns the label for a given change percentage.
 */
export function getChangeLabel(changePercent: number, isNew = false): string {
  if (isNew) return NEW_ITEM_LABEL;

  for (const stop of CHANGE_COLOR_SCALE) {
    if (changePercent >= stop.threshold) {
      return stop.label;
    }
  }

  return CHANGE_COLOR_SCALE[CHANGE_COLOR_SCALE.length - 1].label;
}
