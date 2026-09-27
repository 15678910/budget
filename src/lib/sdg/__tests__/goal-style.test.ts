import { SDG_GOALS } from '../goals';
import { TRAFFIC_COLORS } from '../scoring';
import { GOAL_BG_CLASS, TRAFFIC_BG_CLASS } from '../goal-style';

describe('goal-style', () => {
  it('GOAL_BG_CLASS covers all 17 SDG goals with a matching official hex color', () => {
    expect(Object.keys(GOAL_BG_CLASS)).toHaveLength(17);
    for (const g of SDG_GOALS) {
      expect(GOAL_BG_CLASS[g.num]).toBe(`bg-[${g.color}]`);
    }
  });

  it('TRAFFIC_BG_CLASS matches the TRAFFIC_COLORS palette for every traffic light', () => {
    const lights = Object.keys(TRAFFIC_COLORS) as (keyof typeof TRAFFIC_COLORS)[];
    expect(lights).toHaveLength(4);
    for (const light of lights) {
      expect(TRAFFIC_BG_CLASS[light]).toBe(`bg-[${TRAFFIC_COLORS[light]}]`);
    }
  });
});
