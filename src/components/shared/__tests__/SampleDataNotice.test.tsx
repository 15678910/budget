/**
 * SampleDataNotice 카피 검증.
 * 리포지토리에 React 렌더링 테스트 환경(jsdom/@testing-library)이 없으므로
 * (jest.config.js testEnvironment: 'node'), 컴포넌트를 렌더링하지 않고
 * 내보낸 카피 상수만 검증한다.
 */
import {
  SAMPLE_DATA_BADGE,
  SAMPLE_DATA_COPY,
} from '../SampleDataNotice';

describe('SampleDataNotice copy', () => {
  it('배지 문구에 「표본 데이터」가 포함된다', () => {
    expect(SAMPLE_DATA_BADGE).toBe('「표본 데이터」');
  });

  it('central 카피는 표본 데이터임을 밝히고 열린재정 공식 URL을 가리킨다', () => {
    const { central } = SAMPLE_DATA_COPY;
    expect(central.badge).toContain('표본 데이터');
    expect(central.body).toContain('실제 예산이 아닙니다');
    expect(central.officialName).toBe('열린재정');
    expect(central.officialUrl).toBe('https://www.openfiscaldata.go.kr');
  });

  it('education 카피는 표본 데이터임을 밝히고 지방교육재정알리미 공식 URL을 가리킨다', () => {
    const { education } = SAMPLE_DATA_COPY;
    expect(education.badge).toContain('표본 데이터');
    expect(education.body).toContain('실제 예산이 아닙니다');
    expect(education.officialName).toBe('지방교육재정알리미');
    expect(education.officialUrl).toBe('https://www.eduinfo.go.kr');
  });

  it('두 카피 모두 실제 데이터로 교체할 예정임을 안내한다', () => {
    for (const copy of Object.values(SAMPLE_DATA_COPY)) {
      expect(copy.suffix).toContain('실제 데이터로 교체할 예정');
    }
  });
});
