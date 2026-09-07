import type { Dispute } from './types';

export const futureFund: Dispute = {
  slug: 'future-fund',
  title: '미래대응기금 신설과 위탁 운용',
  question:
    '162조원 규모로 신설되는 기금과, 민간 위탁이 검토되고 있는 여유자금 104조원을 국회 심의 밖에 두는 것이 타당한가',
  stage: 'proposed',
  scale: '162조 3,000억원',
  nextMilestone: { date: '2026-12-02', label: '예산 법정 처리기한' },

  figures: [
    {
      label: '기금 총 규모',
      value: '162조 3,000억원',
      kind: 'announced',
      source: '기획예산처 2027년 예산안',
    },
    {
      label: '여유자금',
      value: '104조 4,000억원',
      note: '사업비 45조 4,000억원과 국채발행 축소분 12조 5,000억원을 뺀 금액',
      kind: 'derived',
      source: '기획예산처 2027년 예산안',
    },
    {
      label: '교육·인재계정',
      value: '10조 1,000억원',
      note: '전체의 약 6%. 교부금 개편 차액이 이 계정으로 들어간다',
      kind: 'announced',
      source: '기획예산처 2027년 예산안',
    },
  ],

  timeline: [
    { date: '2026-09-01', label: '국무회의 의결', status: 'done' },
    {
      date: '2026-09-03',
      label: '국회 제출',
      detail: '기금운용계획안이 예산안과 함께 제출됐다',
      status: 'current',
    },
    { date: '2026-12-02', label: '예산 법정 처리기한', status: 'upcoming' },
  ],

  positions: [
    {
      side: 'for',
      actor: '기획예산처',
      claim:
        '전략적 투자 플랫폼이자 경기 변동에 대응하는 재정 안정화 장치다',
      source: '2027년 예산안 보도자료',
      url: 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156776382',
    },
    {
      side: 'against',
      actor: '임이자 의원',
      claim:
        '국회 심의를 피해 언제든 꺼내 쓸 수 있는 상시 추경 통로가 된다',
      source: '뉴스토마토 보도',
      url: 'https://www.newstomato.com/ReadNews.aspx?no=1312211',
    },
    {
      side: 'against',
      actor: '참여연대',
      claim:
        '기금 사업을 변경할 때의 요건과 절차를 지금보다 엄격하게 정해야 한다',
      source: '참여연대 논평',
      url: 'https://www.ngonews.kr/news/articleView.html?idxno=236930',
    },
  ],

  calculator: 'fund-scenario',

  caveats: [
    '민간 위탁(OCIO) 운용은 확정된 것이 아니라 검토 단계다. 장관 발표문에는 위탁 운용 언급 없이 재정 안정화 기능만 설명돼 있다.',
    '세수 결손으로 기금을 헐어야 하는 시점과 자산가격이 떨어지는 시점은 대체로 겹친다. 손실을 확정하고 인출하게 되는 구조다.',
    '교육·인재계정은 전체의 6%다. 교부금 차액이 이 계정으로 보장된다는 설명은 계정 간 이동이지 증액이 아니다. 게다가 계정 규모 10조 1,000억원은 교부금 개편 차액 약 21조원의 절반에 못 미친다.',
    '비교 대상으로 자주 거론되는 세 나라는 각기 다른 방식으로 기금의 정치적 사용을 막는다. 노르웨이 국부펀드(GPFG)는 국내 자산 투자를 전면 금지하고 원금 인출을 막아, 무엇에 쓸 수 있는지를 제한한다. 캐나다 연금투자위원회(CPPIB)는 연방·주 정부와 분리된 독립 기구가 운용을 맡고, 근거 법률을 고치려면 연방정부와 인구 3분의 2를 대표하는 주 3분의 2의 동의가 필요해 헌법 개정보다 문턱이 높다. 네덜란드 공무원연금(ABP)은 1996년까지 부처 소속이었다가 그해 독립 법인으로 분리됐다. 한국 미래대응기금에는 이 셋 중 어느 것에 해당하는 규정도 아직 없다.',
  ],

  sources: [
    {
      title: '2027년 예산안 및 2026~2030년 국가재정운용계획',
      publisher: '기획예산처',
      date: '2026-09-01',
    },
    {
      title: '미래대응기금, 국회 통제 밖 상시 추경 우려',
      publisher: '뉴스토마토',
      date: '2026-09-04',
    },
    {
      title: 'OCIO 제도 개선과제',
      publisher: '자본시장연구원',
      date: '2025-11',
    },
    {
      title: 'Governance — Independence',
      publisher: 'CPP Investments',
      date: '2026-09',
      url: 'https://www.cppinvestments.com/about-us/governance/independence/',
    },
    {
      title: 'Pension fund ABP exists 100 years',
      publisher: 'APG',
      date: '2022',
      url: 'https://apg.nl/en/publication/pension-fund-abp-exists-100-years/',
    },
  ],

  updatedAt: '2026-09-07',
};
