// ============================================================
// 선거구(광역) 지역별 맞춤형 정책 추천 목록
// ─────────────────────────────────────────────────────────────
// 목적: FiscalDoctorDashboard 정책 시뮬레이터의 "빠른 선택" 버튼을
//       현재 선택된 광역에 맞춰 동적으로 바꾼다.
// 설계 근거:
//   1. regional-industry-data.ts 의 strengths/recommended 산업 반영
//   2. 재정자립도 낮은 지역 → 세입 증가형 정책 (세제 개편·주민세 등)
//   3. 청년실업률 높은 지역 → 일자리·창업 정책
//   4. 공통 정책 1~2개는 유지 (비교 기준선 제공)
// 반환 규칙:
//   • category 는 standard-costs.ts 의 키워드와 매칭되도록 정책명 선정
//   • text 는 10자 내외 간결한 정책명 (기존 버튼 톤 유지)
//   • 최대 7개, 기본 6개 권장
// ============================================================

export interface PolicySuggestion {
  text: string;        // 입력창에 채워질 정책명
  icon?: string;       // 한글자 이모지 (선택)
  highlight?: boolean; // 시각적 강조 여부 (NEW/추천)
  rationale?: string;  // 호버 툴팁: "왜 이 지역에 추천하나"
}

// ── 공통 기본값 (알려지지 않은 지역이나 기초단체 모드용) ──
export const DEFAULT_POLICY_SUGGESTIONS: PolicySuggestion[] = [
  { text: '주민세 10% 인상' },
  { text: '공공병원 신설' },
  { text: '지역화폐 30% 확대' },
  { text: '공무원 5% 감축' },
  { text: '관광특구 지정' },
  {
    text: '지역공공은행 설립',
    icon: '🏦',
    highlight: true,
    rationale: '지역 중소기업·서민금융을 전담하는 공공은행 (대구은행·부산은행 사례 참고)',
  },
];

// ── 사회 과제 대응 정책 (전국 공통, 모든 지역에 추가 노출) ──
// 배경: 부의 양극화·자영업자 어려움·가계대출 1,900조·AI로 인한 실업 대안 등
//       지역에 관계없이 시민이 체감하는 구조적 이슈에 대응하는 정책군
export const SOCIAL_POLICY_SUGGESTIONS: PolicySuggestion[] = [
  {
    text: '자영업자 상생보증 1조원',
    icon: '🏪',
    rationale: '자영업 폐업률 증가 · 카드수수료·임대료 부담 완화 · 보증 프로그램 확대',
  },
  {
    text: '가계부채 조정 프로그램',
    icon: '💳',
    rationale: '가계대출 1,900조원 돌파 · 저신용자 원금 일부 탕감 + 장기 분할상환 전환',
  },
  {
    text: 'AI 실업 대응 기본소득',
    icon: '🤖',
    rationale: 'AI·자동화로 대체되는 일자리 대응 · 월 50만원 수준 선별적 기본소득 + 재교육',
  },
  {
    text: 'AI 시대 직업 재교육',
    icon: '🎓',
    rationale: 'AI 시대 직무 전환 훈련 바우처 · 40대 이상 중장년 경력 재설계 지원',
  },
  {
    text: '플랫폼노동자 사회보험',
    icon: '🛵',
    rationale: '배달·택배·대리운전 등 플랫폼 노동자 4대보험 적용 확대',
  },
  {
    text: '청년 자산형성 매칭지원',
    icon: '💰',
    rationale: '청년 저축 1:1 매칭 · 부의 양극화 완화를 위한 자산 출발선 평준화',
  },
];

// ── 17개 광역 + 통합 특별시 맞춤 추천 ──
export const METRO_POLICY_RECOMMENDATIONS: Record<string, PolicySuggestion[]> = {
  '서울특별시': [
    { text: 'AI 스타트업 펀드 조성', icon: '🤖', rationale: '글로벌 스타트업 생태계 세계 8위 · 판교·강남 벤처 허브' },
    { text: '청년창업 보증금 지원', icon: '🚀', rationale: '청년실업률 7.2%, 고급 인력풀 활용' },
    { text: 'K-콘텐츠 제작지원금', icon: '🎬', rationale: 'OTT·K-콘텐츠 수도, 넷플릭스 한국 본사' },
    { text: '공공임대 5만호 공급', icon: '🏢', rationale: '주거비 부담 전국 최고 (가계부채비율 141%)' },
    { text: '주민세 10% 인상' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '세계 7대 금융허브 지향 · 서민금융 접근성 강화',
    },
  ],

  '경기도': [
    { text: '반도체 인재 양성 지원', icon: '🔬', rationale: '세계 최대 반도체 클러스터 · 600조원 민간투자' },
    { text: '팹리스 스타트업 지원', icon: '💎', rationale: '시스템반도체 설계(Fabless) 생태계 조성' },
    { text: 'GTX 역세권 개발', icon: '🚄', rationale: '광역교통·수도권 물류망 강점' },
    { text: '청년 주거비 지원', icon: '🏠', rationale: '인구 1,364만 · 주거 부담 완화' },
    { text: '주민세 10% 인상' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '중소기업 14만개 · 경기신용보증 확장형 공공금융',
    },
  ],

  '인천광역시': [
    { text: 'K-바이오랩허브 조성', icon: '🧬', rationale: '바이오의약품 생산 세계 3위 · 송도 메가클러스터' },
    { text: 'UAM 도심항공 실증', icon: '🛸', rationale: '인천공항 중심 항공물류 허브' },
    { text: '항공물류 특화도시', icon: '✈️', rationale: '세계적 공항·송도 경제자유구역' },
    { text: '공공병원 신설' },
    { text: '관광특구 지정' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '경제자유구역 기업 금융지원·송도 바이오 R&D 투자',
    },
  ],

  '부산광역시': [
    { text: '스마트항만 고도화', icon: '🏗️', rationale: '세계 7위 컨테이너 항만 · 자동화 투자' },
    { text: '해양바이오 클러스터', icon: '🌊', rationale: '해양수산 R&D 강점' },
    { text: '북항 재개발 가속', icon: '🏖️', rationale: '북항 재개발 · 해양관광 MICE' },
    { text: '디지털물류 플랫폼', icon: '📦', rationale: '물류 자동화·AI 공급망' },
    { text: '주민세 10% 인상' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: 'BNK부산은행·해양금융 클러스터 강화',
    },
  ],

  '대구광역시': [
    { text: '지능형 로봇 생태계', icon: '🦾', rationale: 'AI·로봇 R&D 거점 · DGIST 연구인력' },
    { text: '미래모빌리티 허브', icon: '🚗', rationale: '자율주행·전기차 전환 투자' },
    { text: '디지털헬스케어 지원', icon: '💻', rationale: '의료기기 인허가·생산 허브' },
    { text: '청년창업 보증금 지원', icon: '🎓', rationale: '청년실업률 9.0% (전국 최고권)' },
    { text: '공공병원 신설' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: 'iM뱅크(前 대구은행) 전국은행 전환 가속 · 지역 중소기업 자금 공급',
    },
  ],

  '광주광역시': [
    { text: '초거대 AI 모델 개발', icon: '🧠', rationale: 'AI 집적단지 · GIST 연구역량' },
    { text: '휴머노이드 로봇 개발', icon: '🦾', rationale: '차세대 로봇 상용화 거점화' },
    { text: '양자광학 연구단지', icon: '⚛️', rationale: '광(光)산업 · 양자 융합 기회' },
    { text: '청년 일자리 1만개', icon: '👨‍💻', rationale: '청년실업률 9.5% (전국 1위)' },
    { text: '공공병원 신설' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '광주은행·지역 상공인 금융 지원',
    },
  ],

  '대전광역시': [
    { text: '반도체 융합도시 조성', icon: '💎', rationale: 'KAIST·ETRI 연구역량 + 반도체 설계' },
    { text: '양자암호통신 네트워크', icon: '🔐', rationale: '양자기술 국가전략 연구' },
    { text: '바이오 클러스터 확장', icon: '🧬', rationale: '대덕 4대 바이오클러스터' },
    { text: '우주항공 실증사업', icon: '🛰️', rationale: '국방과학연구소·KARI 거점' },
    { text: '주민세 10% 인상' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: 'R&D 스타트업 자금 공급 · 기술금융 전문기관',
    },
  ],

  '울산광역시': [
    { text: '그린수소 생산 확대', icon: '💧', rationale: '전국 수소 생산 50% · 수소도시' },
    { text: '암모니아 추진선 실증', icon: '⚓', rationale: '현대중공업 조선해양 + 수소 융합' },
    { text: 'PEM 수전해 장치 생산', icon: '⚗️', rationale: '수소 생태계 밸류체인 완성' },
    { text: '친환경 모빌리티 전환', icon: '🚗', rationale: '현대차 울산공장 전기차 전환' },
    { text: '관광특구 지정' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '산업재편·근로자 재취업 지원 공공금융',
    },
  ],

  '세종특별자치시': [
    { text: '스마트시티 테스트베드', icon: '🌃', rationale: '행정중심복합도시 · 신도시 인프라' },
    { text: '디지털트윈 플랫폼', icon: '🖥️', rationale: '도시 전체 실증 환경' },
    { text: '자율주행 BRT 확장', icon: '🚙', rationale: '자율주행 시범도시 선도' },
    { text: '공공데이터 산업화', icon: '📊', rationale: '정부기관 집중 · 데이터 접근성' },
    { text: '공공병원 신설' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '신도시 청년 가구 금융지원 · 공공주택 연계',
    },
  ],

  '강원특별자치도': [
    { text: '의료관광 특구 지정', icon: '🏥', rationale: '청정환경 + 원주 의료기기 클러스터' },
    { text: '기후테크 연구단지', icon: '🌡️', rationale: '강원 특별자치도 규제특례' },
    { text: '바이오헬스 단지 확대', icon: '🧬', rationale: '춘천·홍천 바이오 특화단지' },
    { text: '관광특구 지정' },
    { text: '주민세 10% 인상' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '강원 자치도 전환 · 1차산업·관광업자 금융',
    },
  ],

  '충청북도': [
    { text: '오송 바이오 생산 확대', icon: '💊', rationale: '바이오 국가클러스터 · 성장률 전국 1위' },
    { text: 'K-뷰티 글로벌화 지원', icon: '💄', rationale: '화장품 OEM/ODM 집적' },
    { text: '반도체 소재 단지 조성', icon: '🔬', rationale: '반도체 소재 제조 기반' },
    { text: '공공병원 신설' },
    { text: '주민세 10% 인상' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '바이오·화장품 중소기업 기술금융',
    },
  ],

  '충청남도': [
    { text: '탄소중립수소 생산', icon: '💧', rationale: '서해안 산업벨트 · 석유화학 전환' },
    { text: '초격차 디스플레이 양산', icon: '🖥️', rationale: '삼성디스플레이 아산캠퍼스' },
    { text: '친환경 모빌리티 허브', icon: '🚗', rationale: '당진 철강 + 수소 융합' },
    { text: '공공병원 신설' },
    { text: '주민세 10% 인상' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '산업구조 전환기 중소기업 금융 지원',
    },
  ],

  '전북특별자치도': [
    { text: '새만금 이차전지 특화', icon: '🔋', rationale: '새만금 현대차 9조 투자 확정' },
    { text: 'AI 데이터센터 유치', icon: '🖥️', rationale: '재생에너지 연계 AI 인프라' },
    { text: '스마트팜 정밀농업', icon: '🚜', rationale: '농생명 거점 · 농업 바이오 자원' },
    { text: '그린수소 생산', icon: '🌱', rationale: '재생에너지 연계 수소' },
    { text: '공공병원 신설' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '재정자립도 27.1% · 지역 소상공인 금융 사각지대',
    },
  ],

  '전라남도': [
    { text: 'AI 데이터센터 유치', icon: '🖥️', rationale: '전국 최대 재생에너지 잠재력' },
    { text: '해상풍력 기자재 제조', icon: '🌊', rationale: '해상풍력 최적 입지 · 서남해안' },
    { text: '그린수소 생산 허브', icon: '🌱', rationale: '여수 부생수소 33% · 재생E 연계' },
    { text: '농어촌 청년 유치', icon: '🌾', rationale: '고령화 심화 · 청년실업률 8%' },
    { text: '관광특구 지정' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '재정자립도 27.1%(최하위권) · 농어민 금융지원',
    },
  ],

  '경상북도': [
    { text: '포항 이차전지 확장', icon: '🔋', rationale: '양극재 세계 1위 · 에코프로·POSCO' },
    { text: 'SiC 전력반도체 단지', icon: '⚡', rationale: '구미 반도체 소부장 연계' },
    { text: '분산에너지 특구', icon: '🌍', rationale: '포항 그린암모니아 분산E 특구' },
    { text: '공공병원 신설' },
    { text: '주민세 10% 인상' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '재정자립도 31% · 구미공단 중소기업 자금',
    },
  ],

  '경상남도': [
    { text: 'K-방산 수출 고도화', icon: '🎯', rationale: '방산 해외수주 전국 87%' },
    { text: '우주발사체 제조', icon: '🚀', rationale: '사천 항공우주 클러스터' },
    { text: '조선해양 MRO 확대', icon: '⚓', rationale: '함정·상선 MRO 클러스터' },
    { text: '공공병원 신설' },
    { text: '관광특구 지정' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '재정자립도 39% · BNK경남은행 전국 전환 지원',
    },
  ],

  '제주특별자치도': [
    { text: '그린 데이터센터 유치', icon: '🖥️', rationale: '재생E 비중 20% (전국 1위) · CFI 2035' },
    { text: '탄소중립 도시 전환', icon: '🌿', rationale: 'CFI 2035 탄소중립 선도' },
    { text: '스마트팜 특산물', icon: '🌱', rationale: '한라봉·감귤 등 특산 농업' },
    { text: '의료관광 특구', icon: '🏥', rationale: '관광 기반 + 청정 이미지' },
    { text: '관광특구 지정' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '관광업·소상공인 금융지원 · 제주은행 공공기능 강화',
    },
  ],

  // ── 통합 특별시 (확정/추진 중) ──
  '전남광주통합특별시': [
    { text: 'AI 데이터센터 허브', icon: '🖥️', rationale: '광주 AI집적단지 + 전남 재생E 최대잠재력' },
    { text: '그린수소 생산 허브', icon: '🌱', rationale: '여수 부생수소 + 재생에너지 연계' },
    { text: '해상풍력 기자재 단지', icon: '🌊', rationale: '서남해안 해상풍력 최적 입지' },
    { text: '초거대 AI 모델 개발', icon: '🧠', rationale: 'GIST 연구역량 + 전남 데이터센터 인프라' },
    { text: '청년 일자리 확대', icon: '👨‍💻', rationale: '광주 청년실업률 9.5%, 전남 8.0%' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: '통합특별시 출범 계기 · 광주·전남 서민금융 단일화',
    },
  ],

  '대구경북통합특별시': [
    { text: '포항 이차전지 확장', icon: '🔋', rationale: '양극재 세계 1위 · 대구 배터리 소재' },
    { text: 'SiC 전력반도체 단지', icon: '⚡', rationale: '구미 반도체 + 대구 AI·로봇' },
    { text: '지능형 로봇 생태계', icon: '🦾', rationale: 'DGIST + 구미공단 제조기반' },
    { text: '미래모빌리티 허브', icon: '🚗', rationale: '자율주행 + 전기차 전환' },
    { text: '공공병원 신설' },
    {
      text: '지역공공은행 설립',
      icon: '🏦',
      highlight: true,
      rationale: 'iM뱅크 전국 전환 + 경북 중소기업 자금 공급',
    },
  ],
};

/**
 * 현재 선택 지역에 맞는 추천 정책 목록 반환.
 * 매핑 없는 지역(기초단체 모드 등)은 DEFAULT_POLICY_SUGGESTIONS 반환.
 */
export function getPolicyRecommendations(regionName: string): PolicySuggestion[] {
  return METRO_POLICY_RECOMMENDATIONS[regionName] ?? DEFAULT_POLICY_SUGGESTIONS;
}
