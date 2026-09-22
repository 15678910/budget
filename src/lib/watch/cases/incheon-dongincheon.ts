import type { CaseSource, WatchCase } from '../case-types';

/** 근거: docs/research/2026-09-23-waste-cases-verification.md 「사례 3 — 인천 동인천역(송현자유시장) 착공식」 */

const DAUM_KYEONGIN: CaseSource = {
  title: '착공 구간 토지보상 실적 보도',
  publisher: '경인일보 계열(다음뉴스)',
  date: '2025-12-08',
  url: 'https://v.daum.net/v/20251208202504815',
  quote: '1-1단계와 1-2단계 구역 내 대상자 158명에게 보상금 약 289억원을 지급',
};

const KYEONGGI_START: CaseSource = {
  title: '동인천역 주변 재정비 착공식 보도',
  publisher: '경기일보',
  date: '2025-12-08',
  url: 'https://www.kyeonggi.com/article/20251208580356',
};

const KYEONGGI_STALLED: CaseSource = {
  title: '철거 중단·현장 방치 보도',
  publisher: '경기일보',
  date: '2026-08-10',
  url: 'https://www.kyeonggi.com/article/20260809580185',
  quote: '높이 3m의 펜스… ‘철거하는 척하더니 멈춰 서면서 이제 흉물로 전락했다’',
};

const JOONGBOO: CaseSource = {
  title: '1-2구역 이의재결·사업계획 변경 검토 보도',
  publisher: '중부일보',
  date: '2026-05-27',
  url: 'https://www.joongboo.com/news/articleView.html?idxno=363726967',
};

const VIVA100: CaseSource = {
  title: '지방선거 후보 간 착공식 공방 보도',
  publisher: '브릿지경제',
  date: '2026-05-28',
  url: 'https://www.viva100.com/article/20260528500792',
  quote: '정밀안전진단 E·D등급 건물 밀집… 시민 안전을 위해 더 이상 미룰 수 없는 상황',
};

export const INCHEON_DONGINCHEON: WatchCase = {
  slug: 'incheon-dongincheon',
  gov: { level: 'metro', code: '28', name: '인천광역시' },
  title: '동인천역 주변(송현자유시장) 재정비 착공식',
  amountEok: null,
  amountNote: '보상금 총 319억원 등 부분 금액만 확인',
  summary:
    '동인천역 주변 재정비 사업의 착공식은 2025년 12월 8일 열렸다. 착공식 보도 시점에 1-1·1-2단계 구역 대상자 158명에게 보상금 약 289억원이 지급됐고 총 보상금은 319억원이다. 2026년 8월 보도에서는 철거가 중단된 채 펜스가 설치돼 있었다.',
  timeline: [
    { date: '2025-12-08', label: '착공식', source: KYEONGGI_START },
    { date: '2026-05-27', label: '1-2구역 7개 점포 이의재결 진행·사업계획 변경 검토로 철거 중단 보도', source: JOONGBOO },
    { date: '2026-08-10', label: '펜스만 남은 철거 현장 방치 보도', source: KYEONGGI_STALLED },
  ],
  claims: [
    {
      statement: '토지보상이 5%만 완료된 상태에서 착공식을 열었다.',
      verdict: 'refuted',
      finding:
        '보도된 보상 실적은 1-1단계와 1-2단계 구역 내 대상자 158명에게 보상금 약 289억원 지급으로, 총 319억원 대비 약 91%다. “5%”의 근거 문서는 확인되지 않았다.',
      sources: [DAUM_KYEONGIN],
    },
    {
      statement: '지방선거를 6개월 앞두고 착공식을 열었다.',
      verdict: 'confirmed',
      finding: '착공식은 2025년 12월 8일 열렸고 2026년 6월 3일 지방선거까지 177일이다.',
      sources: [KYEONGGI_START],
    },
    {
      statement: '착공식 이후 공사가 중단되고 철거 현장이 방치됐다.',
      verdict: 'confirmed',
      finding:
        '2026년 8월 보도에서 높이 3m의 펜스만 남은 채 현장이 방치됐다고 전해졌고, 1-2구역 7개 점포의 이의재결이 진행되면서 사업계획 변경 검토로 철거가 중단됐다.',
      sources: [KYEONGGI_STALLED, JOONGBOO],
    },
    {
      statement: '“착공쇼”라는 논란이 있었다.',
      verdict: 'confirmed',
      finding:
        '2026년 5월 지방선거 후보 간 공방이 보도됐다. 김찬진 후보는 “정밀안전진단 E·D등급 건물 밀집… 시민 안전을 위해 더 이상 미룰 수 없는 상황”이라고 밝혔다.',
      sources: [VIVA100],
    },
  ],
  procedures: [
    { key: 'investment-review', status: 'unknown', note: '확인 자료 없음' },
    { key: 'feasibility-study', status: 'unknown', note: '확인 자료 없음' },
    { key: 'council-approval', status: 'unknown', note: '확인 자료 없음' },
    { key: 'disclosure', status: 'unknown', note: '확인 자료 없음' },
  ],
  // election-cycle의 근거는 날짜 사실 하나뿐이다: 착공식 2025-12-08, 지방선거 2026-06-03, 간격 177일.
  tags: ['election-cycle'],
  status: '철거 중단·현장 방치(2026-08 보도 기준)',
  verifiedAt: '2026-09-23',
};
