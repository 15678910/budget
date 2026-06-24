import {
  scoreTargetBased,
  trafficLight,
  trafficColor,
  scoreColor,
  goalAchievement,
  indicatorAchievement,
  TRAFFIC_GREEN_MIN,
  TRAFFIC_YELLOW_MIN,
  TRAFFIC_ORANGE_MIN,
  TRAFFIC_COLORS,
} from '@/lib/sdg/scoring';
import type { IndicatorDirection } from '@/lib/data/local-sdg-data';

describe('scoreTargetBased', () => {
  describe('higher_better', () => {
    const green = 100;
    const floor = 0;
    it('value=green → 100', () => {
      expect(scoreTargetBased(green, green, floor, 'higher_better')).toBe(100);
    });
    it('value=floor → 0', () => {
      expect(scoreTargetBased(floor, green, floor, 'higher_better')).toBe(0);
    });
    it('중간값 → 비례', () => {
      expect(scoreTargetBased(50, green, floor, 'higher_better')).toBe(50);
      expect(scoreTargetBased(75, green, floor, 'higher_better')).toBe(75);
    });
    it('non-zero floor 보정', () => {
      // green=100, floor=60: value=80 → (80-60)/(100-60)=0.5 → 50
      expect(scoreTargetBased(80, 100, 60, 'higher_better')).toBe(50);
    });
    it('범위 밖 clamp (위/아래)', () => {
      expect(scoreTargetBased(150, green, floor, 'higher_better')).toBe(100);
      expect(scoreTargetBased(-50, green, floor, 'higher_better')).toBe(0);
    });
  });

  describe('lower_better', () => {
    // green < floor (낮을수록 양호). 예: PM2.5 green=5, floor=18
    const green = 5;
    const floor = 18;
    it('value=green → 100', () => {
      expect(scoreTargetBased(green, green, floor, 'lower_better')).toBe(100);
    });
    it('value=floor → 0', () => {
      expect(scoreTargetBased(floor, green, floor, 'lower_better')).toBe(0);
    });
    it('중간값 → 비례', () => {
      // value=11.5 (=(5+18)/2) → 50
      expect(scoreTargetBased(11.5, green, floor, 'lower_better')).toBe(50);
    });
    it('범위 밖 clamp (목표보다 우수/하한보다 악화)', () => {
      expect(scoreTargetBased(2, green, floor, 'lower_better')).toBe(100); // green보다 낮음
      expect(scoreTargetBased(30, green, floor, 'lower_better')).toBe(0); // floor보다 높음
    });
  });

  describe('green==floor 방어', () => {
    it('분모 0이면 50 반환 (higher_better)', () => {
      expect(scoreTargetBased(10, 50, 50, 'higher_better')).toBe(50);
    });
    it('분모 0이면 50 반환 (lower_better)', () => {
      expect(scoreTargetBased(10, 50, 50, 'lower_better')).toBe(50);
    });
  });

  it('반올림된 정수를 반환한다', () => {
    // green=100 floor=0 value=33.333 → 33
    const s = scoreTargetBased(33.333, 100, 0, 'higher_better');
    expect(Number.isInteger(s)).toBe(true);
    expect(s).toBe(33);
  });
});

describe('trafficLight', () => {
  it('밴드 경계가 정확하다 (green 하한 75)', () => {
    expect(trafficLight(100)).toBe('green');
    expect(trafficLight(75)).toBe('green'); // 75 = green 하한 포함
    expect(trafficLight(74.9)).toBe('yellow'); // 74.9 → green 미만 → yellow
  });

  it('75 미만 50 이상은 yellow (74.9 포함)', () => {
    expect(trafficLight(74.9)).toBe('yellow');
    expect(trafficLight(50)).toBe('yellow'); // 50 = yellow 하한 포함
    expect(trafficLight(60)).toBe('yellow');
  });

  it('50 미만 25 이상은 orange', () => {
    expect(trafficLight(49.9)).toBe('orange');
    expect(trafficLight(25)).toBe('orange'); // 25 = orange 하한 포함
    expect(trafficLight(30)).toBe('orange');
  });

  it('25 미만은 red', () => {
    expect(trafficLight(24.9)).toBe('red');
    expect(trafficLight(0)).toBe('red');
  });

  it('임계값 상수가 75/50/25', () => {
    expect(TRAFFIC_GREEN_MIN).toBe(75);
    expect(TRAFFIC_YELLOW_MIN).toBe(50);
    expect(TRAFFIC_ORANGE_MIN).toBe(25);
  });
});

describe('색 헬퍼', () => {
  it('trafficColor가 팔레트 HEX를 반환한다', () => {
    expect(trafficColor('green')).toBe('#16a34a');
    expect(trafficColor('yellow')).toBe('#eab308');
    expect(trafficColor('orange')).toBe('#f97316');
    expect(trafficColor('red')).toBe('#dc2626');
  });
  it('scoreColor가 점수→색을 합성한다', () => {
    expect(scoreColor(90)).toBe(TRAFFIC_COLORS.green);
    expect(scoreColor(10)).toBe(TRAFFIC_COLORS.red);
  });
});

describe('indicatorAchievement', () => {
  it('임계값 있는 지표는 score/light/type/source를 채운다 (env_pm25 official)', () => {
    // env_pm25 green=5 floor=18 lower_better. value=5 → 100
    const a = indicatorAchievement('env_pm25', 5, 'lower_better');
    expect(a).not.toBeNull();
    expect(a!.score).toBe(100);
    expect(a!.light).toBe('green');
    expect(a!.type).toBe('official');
    expect(a!.source.length).toBeGreaterThan(0);
  });
  it('임계값 없는 지표는 null (fin_independence — 맥락 지표)', () => {
    expect(indicatorAchievement('fin_independence', 50, 'higher_better')).toBeNull();
  });
});

describe('goalAchievement', () => {
  const direction: Record<string, IndicatorDirection> = {
    env_pm25: 'lower_better',
    env_recycle: 'higher_better',
    env_sewage: 'higher_better',
    saf_crime: 'lower_better',
    saf_traffic: 'lower_better',
    saf_fire: 'lower_better',
  };

  it('goal13 = env 지표 달성도 평균', () => {
    // env_pm25 green5 floor18: value5→100
    // env_recycle green68 floor55: value68→100
    // env_sewage green100 floor88: value100→100
    const values = { env_pm25: 5, env_recycle: 68, env_sewage: 100 };
    const out = goalAchievement(values, direction);
    expect(out[13]).not.toBeNull();
    expect(out[13]!.score).toBe(100);
    expect(out[13]!.light).toBe('green');
    expect(out[13]!.indicatorCount).toBe(3);
  });

  it('매핑 지표 데이터가 없는 goal은 null', () => {
    const out = goalAchievement({ env_pm25: 5 }, direction);
    expect(out[2]).toBeNull(); // goal2 매핑 없음
    expect(out[13]).not.toBeNull();
  });

  it('17개 goal 키가 모두 존재한다', () => {
    const out = goalAchievement({}, direction);
    for (let g = 1; g <= 17; g++) expect(g in out).toBe(true);
  });

  it('floor 값 입력 시 0점', () => {
    // saf_crime green22 floor42 lower_better: value42→0
    const out = goalAchievement({ saf_crime: 42, saf_traffic: 10, saf_fire: 6.2 }, direction);
    expect(out[16]).not.toBeNull();
    expect(out[16]!.score).toBe(0);
    expect(out[16]!.light).toBe('red');
  });
});
