import type { Dispute } from './types';

export const educationGrant: Dispute = {
  slug: 'education-grant',
  title: '지방교육재정교부금 개편',
  question:
    '55년 된 내국세 20.79% 연동제를 폐지하고 학령인구를 반영한 산식으로 바꿀 것인가',
  stage: 'proposed',
  scale: '78조 8,718억원',
  nextMilestone: { date: '2026-11-30', label: '법안심사소위 · 위원장 대안 논의' },

  figures: [
    {
      label: '2027년 교부금 (정부안)',
      value: '78조 8,718억원',
      note: '올해 본예산 대비 +10.1%, 추경 포함 대비 +3.2%',
      kind: 'announced',
      source: '기획예산처 2027년 예산안',
    },
    {
      label: '기존 산식 유지 시',
      value: '약 100조원',
      note: '정부 추산. 차액 약 21조원',
      kind: 'announced',
      source: '기획예산처 2026~2030년 국가재정운용계획',
    },
    {
      label: '학생 수로 산정하는 항목',
      value: '8.8%',
      note: '7조 2,587억원. 나머지는 학교·학급·교직원 규모에 좌우된다 (국회입법조사처)',
      kind: 'announced',
      source: '국회입법조사처 (교육플러스 보도)',
    },
  ],

  timeline: [
    { date: '2026-08-24', label: '입법예고 시작', status: 'done' },
    {
      date: '2026-08-28',
      label: '입법예고 종료',
      detail: '예고 당일 오후에만 반대 의견 100여 건',
      status: 'done',
    },
    { date: '2026-09-01', label: '국무회의 의결', status: 'done' },
    {
      date: '2026-09-03',
      label: '국회 제출',
      detail: '소관 교육위원회. 의원안 6건이 함께 계류 중이다',
      status: 'current',
      source: '의안번호 2221053',
    },
    {
      date: '2026-11-30',
      label: '법안심사소위 · 위원장 대안 논의',
      detail: '7건이 병합될 가능성이 높다. 대안 문안이 최종 결과가 된다',
      status: 'upcoming',
    },
    { date: '2026-12-02', label: '예산 법정 처리기한', status: 'upcoming' },
  ],

  positions: [
    {
      side: 'for',
      actor: '기획예산처',
      claim:
        '현행 제도는 학령인구 감소를 반영하지 못하고, 내국세 변동에 따라 교부금이 급등락한다',
      source: '2026~2030년 국가재정운용계획 17쪽',
      url: 'https://www.korea.kr/briefing/pressReleaseView.do?newsId=156776382',
    },
    {
      side: 'for',
      actor: 'KDI 김학수 선임연구위원',
      claim:
        '세수에 연동된 교육재정이 오히려 불안정하다. 초과세수가 나면 소진성 사업이 급조된다',
      source: '더스쿠프 보도',
      url: 'https://www.thescoop.co.kr/news/articleView.html?idxno=311328',
    },
    {
      side: 'against',
      actor: '대한민국교육감협의회',
      claim:
        '학생이 줄어도 학교 운영비·시설 관리비·교직원 인건비는 같은 비율로 줄지 않는다',
      source: '교육감협의회 성명',
      url: 'https://www.edpl.co.kr/news/articleView.html?idxno=21442',
    },
    {
      side: 'against',
      actor: '전국교수노동조합',
      claim:
        '내국세 연동제는 교육재정을 정부의 단기 판단과 그때그때의 재정 여건으로부터 떼어놓는 장치다',
      source: '더스쿠프 보도',
      url: 'https://www.thescoop.co.kr/news/articleView.html?idxno=311408',
    },
    {
      side: 'against',
      actor: '363개 교육·시민사회단체 연대',
      claim:
        '감소분 보전은 명목 금액 기준이라 실질로는 매년 삭감이다. 물가, 공공요금, 호봉 승급은 학생 수와 무관하게 계속 오른다',
      evidence:
        '국가재정운용계획은 "교부금 금액이 전년대비 감소하는 경우 그 차액을 보전하여 총액이 줄어들지 않도록 보장"이라고만 적고 있다. 물가나 학생 수로 조정한다는 문구는 없다',
      source: '지방교육재정교부금 개편 대응 긴급행동 기자회견',
      url: 'https://www.edpl.co.kr/news/articleView.html?idxno=21463',
    },
    {
      side: 'neutral',
      actor: '국회입법조사처',
      claim:
        '학생 수를 측정단위로 삼는 항목은 8.8%뿐이며, 반영률을 0.35로 정한 근거가 충분히 제시되지 않았다',
      evidence: '대안으로 국회가 반영률을 심의·확정하고 상·하한을 법률로 정할 것을 제안',
      source: '교육플러스 보도',
      url: 'https://www.edpl.co.kr/news/articleView.html?idxno=21443',
    },
  ],

  calculator: 'grant-formula',

  caveats: [
    '개정안은 아직 국회를 통과하지 않았다. 78조 8,718억원은 법 개정을 전제로 편성된 정부안이며 확정 금액이 아니다.',
    '경상성장률에는 물가가 이미 포함돼 있다. 교육계가 지적하는 것은 산식이 아니라, 감소분 보전 규정의 기준선이 명목 금액이라는 점이다. 국회입법조사처에 따르면 교직원 인건비는 2021년 46조 3,000억원에서 2025년 56조 4,000억원으로 연평균 약 2조 5,000억원 늘었다. 교육감협의회가 계산한 2027년 교부금 순증액 2조 4,300억원(2026년 추경 대비 3.2%)은 이 인건비 증가분에도 미치지 못한다. 다만 정부는 2026년 본예산 대비 7조 2,000억원(10.1%) 증액이라고 설명하므로, 두 수치는 비교 기준연도가 다르다.',
    '차액은 미래대응기금 교육·인재계정 수입으로 보장되며, 교육 밖으로 나가는 것이 아니라 초·중등에서 영유아·고등·평생교육으로 이동한다고 국가재정운용계획은 밝히고 있다. 다만 차액이 연 약 21조원인 데 비해 교육·인재계정 규모는 10조 1,000억원이므로, 차액 전부를 이 계정이 받는다는 뜻인지는 계정 수입 구조를 따로 확인해야 한다.',
    '지역별 배분 기준과 특별교부금 비율이 함께 바뀌는지는 개정안 조문 대조가 필요하다.',
  ],

  sources: [
    {
      title: '2027년 예산안',
      publisher: '기획예산처',
      date: '2026-09-01',
    },
    {
      title: '2026~2030년 국가재정운용계획',
      publisher: '기획예산처',
      date: '2026-09-01',
    },
    {
      title: '지방교육재정교부금법 일부개정법률안(정부)',
      publisher: '국회 의안정보시스템',
      date: '2026-09-03',
      url: 'https://likms.assembly.go.kr/bill/main.do',
    },
    {
      title: '입법조사처, 교부금 개편에 제동',
      publisher: '교육플러스',
      date: '2026-09-04',
    },
  ],

  updatedAt: '2026-09-07',
};
