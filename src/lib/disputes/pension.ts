import type { Dispute } from './types';

export const pension: Dispute = {
  slug: 'pension',
  title: '공적연금 적자 보전',
  question:
    '교부금에는 인구 연동 산식을 씌우면서 연금 보전금에는 상한을 두지 않는 것이 일관적인가',
  stage: 'ongoing',
  scale: '연 10조원',

  figures: [
    {
      label: '2025년 공무원연금 국가보전금',
      value: '10조 475억원',
      kind: 'announced',
      source: '기획재정부 열린재정 공적연금 재정통계',
    },
    {
      label: '2026~2065 누적 국고 부담',
      value: '약 629조원',
      note: '공무원연금·군인연금 합산 추계',
      kind: 'estimated',
      source: '기획재정부 열린재정 공적연금 재정통계',
    },
    {
      label: '교부금 개편 차액 (비교)',
      value: '약 21조원',
      note: '연 단위. 연금 보전금 두 해 치에 해당한다',
      kind: 'derived',
      source: '기획예산처 2026~2030년 국가재정운용계획',
    },
  ],

  timeline: [
    {
      date: '2015-05-29',
      label: '공무원연금법 개정',
      detail: '기여율 인상·지급률 인하. 군인연금은 개혁 대상에서 빠졌다',
      status: 'done',
    },
    {
      date: '2022-09-20',
      label: 'OECD 한국 경제보고서',
      detail: '공적연금 통합을 개혁 방안 가운데 하나로 제시',
      status: 'done',
    },
    {
      date: '2026-09-01',
      label: '의무지출 구조개편 착수 발표',
      detail: '국가재정운용계획에 연금·의료·국채이자를 포함한 의무지출 개편 방침이 담겼다',
      status: 'current',
    },
  ],

  positions: [
    {
      side: 'for',
      actor: '기획예산처',
      claim: '그간 성역으로 여겨져 온 의무지출의 구조개편에 착수한다',
      source: '2026~2030년 국가재정운용계획',
    },
    {
      side: 'neutral',
      actor: 'OECD',
      claim: '공적연금 통합을 한국 연금개혁의 선택지 가운데 하나로 제시했다',
      source: 'OECD 한국 경제보고서 2022',
    },
    {
      side: 'against',
      actor: '공무원노동조합',
      claim:
        '2015년 개혁으로 이미 기여율을 올리고 지급률을 낮췄다. 추가 삭감은 이중 부담이다',
      source: '공무원노조 성명',
    },
  ],

  comparison: {
    caption: '2026~2030년 연평균 증가율 (국가재정운용계획)',
    rows: [
      {
        label: '의무지출',
        value: '8.5%',
        note: '연금·의료·국채이자 등 법으로 지출이 정해진 항목',
        kind: 'announced',
        source: '기획예산처 2026~2030년 국가재정운용계획',
      },
      {
        label: '재량지출',
        value: '8.3%',
        note: '해마다 국회 심의로 정하는 항목',
        kind: 'announced',
        source: '기획예산처 2026~2030년 국가재정운용계획',
      },
    ],
  },

  caveats: [
    '이미 확정된 연금 수급권을 소급해 깎는 것은 위헌 소지가 있다. 지급액 삭감은 현실적인 선택지가 아니다.',
    '자동조정장치는 국내에 도입된 전례가 없다. 계산 결과가 전부 가정이 되므로 이 분쟁에는 계산기를 두지 않았다.',
    '군인연금은 2015년 공무원연금 개혁 대상에서 제외됐다. 두 제도를 같은 기준으로 비교할 때 주의가 필요하다.',
  ],

  sources: [
    {
      title: '공적연금 재정통계',
      publisher: '기획재정부 열린재정 (mods.go.kr)',
      date: '2026-08',
      url: 'https://www.mods.go.kr',
    },
    {
      title: '2026~2030년 국가재정운용계획',
      publisher: '기획예산처',
      date: '2026-09-01',
    },
    {
      title: 'OECD Economic Surveys: Korea 2022',
      publisher: 'OECD',
      date: '2022-09-20',
    },
  ],

  updatedAt: '2026-09-07',
};
