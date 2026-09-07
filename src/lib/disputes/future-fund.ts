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
    },
    {
      side: 'against',
      actor: '임이자 의원',
      claim:
        '국회 심의를 피해 언제든 꺼내 쓸 수 있는 상시 추경 통로가 된다',
      source: '국정감사 질의',
    },
    {
      side: 'against',
      actor: '참여연대',
      claim:
        '기금 사업을 변경할 때의 요건과 절차를 지금보다 엄격하게 정해야 한다',
      source: '참여연대 논평',
    },
  ],

  calculator: 'fund-scenario',

  caveats: [
    '민간 위탁(OCIO) 운용은 확정된 것이 아니라 검토 단계다. 장관 발표문에는 위탁 운용 언급 없이 재정 안정화 기능만 설명돼 있다.',
    '세수 결손으로 기금을 헐어야 하는 시점과 자산가격이 떨어지는 시점은 대체로 겹친다. 손실을 확정하고 인출하게 되는 구조다.',
    '교육·인재계정은 전체의 6%다. 교부금 차액이 이 계정으로 보장된다는 설명은 계정 간 이동이지 증액이 아니다. 게다가 계정 규모 10조 1,000억원은 교부금 개편 차액 약 21조원의 절반에 못 미친다.',
    '비교 대상으로 자주 거론되는 노르웨이 국부펀드(GPFG)는 국내 자산 투자를 전면 금지하고 원금 인출을 막는 규정으로 정치적 사용을 차단하는데, 한국 미래대응기금에는 이에 해당하는 규정이 아직 없다 (자본시장연구원 OCIO 제도 개선과제).',
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
  ],

  updatedAt: '2026-09-07',
};
