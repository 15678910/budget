/**
 * generate-sample-data.ts
 *
 * Generates realistic Korean government budget sample CSV data based on
 * the 2024 fiscal year structure from data.go.kr.
 *
 * Outputs:
 *   data/raw/budget-2024.csv
 *   data/raw/budget-2023.csv
 */

import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Domain definitions with realistic 2024 budget amounts (in 백만원)
// ---------------------------------------------------------------------------

interface DomainDef {
  code: string;
  name: string;
  amount2024: number;         // 백만원
  ministries: string[];
  sectors: SectorDef[];
}

interface SectorDef {
  code: string;
  name: string;
  share: number;              // fraction of domain total
  programs: ProgramDef[];
}

interface ProgramDef {
  name: string;
  share: number;              // fraction of sector total
  unitProjects: UnitProjectDef[];
}

interface UnitProjectDef {
  name: string;
  share: number;
  detailProjects: string[];
}

const DOMAINS: DomainDef[] = [
  {
    code: '010',
    name: '사회복지',
    amount2024: 220_000_000,
    ministries: ['보건복지부', '고용노동부', '여성가족부', '국토교통부'],
    sectors: [
      {
        code: '011',
        name: '기초생활보장',
        share: 0.18,
        programs: [
          {
            name: '기초생활보장 지원',
            share: 0.6,
            unitProjects: [
              {
                name: '생계급여',
                share: 0.5,
                detailProjects: ['생계급여 지급', '수급자 관리', '급여 조정'],
              },
              {
                name: '의료급여',
                share: 0.3,
                detailProjects: ['의료급여 1종', '의료급여 2종', '의료급여 사후관리'],
              },
              {
                name: '주거급여',
                share: 0.2,
                detailProjects: ['임차급여', '수선유지급여'],
              },
            ],
          },
          {
            name: '자활 지원',
            share: 0.4,
            unitProjects: [
              {
                name: '자활사업',
                share: 0.7,
                detailProjects: ['자활근로', '자활기업 지원', '취업지원 서비스'],
              },
              {
                name: '희망키움통장',
                share: 0.3,
                detailProjects: ['희망키움통장 Ⅰ', '희망키움통장 Ⅱ'],
              },
            ],
          },
        ],
      },
      {
        code: '012',
        name: '취약계층 지원',
        share: 0.12,
        programs: [
          {
            name: '노인복지 지원',
            share: 0.5,
            unitProjects: [
              {
                name: '기초연금',
                share: 0.7,
                detailProjects: ['기초연금 지급', '기초연금 관리운영'],
              },
              {
                name: '노인장기요양',
                share: 0.3,
                detailProjects: ['장기요양급여', '장기요양기관 지원'],
              },
            ],
          },
          {
            name: '장애인복지 지원',
            share: 0.3,
            unitProjects: [
              {
                name: '장애인연금',
                share: 0.6,
                detailProjects: ['장애인연금 기초급여', '장애인연금 부가급여'],
              },
              {
                name: '장애인활동지원',
                share: 0.4,
                detailProjects: ['활동지원급여', '긴급활동지원'],
              },
            ],
          },
          {
            name: '아동복지 지원',
            share: 0.2,
            unitProjects: [
              {
                name: '아동수당',
                share: 0.7,
                detailProjects: ['아동수당 지급', '아동수당 운영'],
              },
              {
                name: '아동보호 서비스',
                share: 0.3,
                detailProjects: ['아동학대 예방', '드림스타트', '지역아동센터'],
              },
            ],
          },
        ],
      },
      {
        code: '013',
        name: '보육·가족 및 여성',
        share: 0.14,
        programs: [
          {
            name: '보육지원',
            share: 0.6,
            unitProjects: [
              {
                name: '어린이집 운영 지원',
                share: 0.5,
                detailProjects: ['기본보육료', '누리과정 보육료', '방과후 보육료'],
              },
              {
                name: '가정양육 지원',
                share: 0.5,
                detailProjects: ['양육수당', '아이돌봄서비스'],
              },
            ],
          },
          {
            name: '가족 및 여성지원',
            share: 0.4,
            unitProjects: [
              {
                name: '다문화가족 지원',
                share: 0.4,
                detailProjects: ['다문화가족지원센터', '다문화가족 통합지원'],
              },
              {
                name: '여성 사회참여 지원',
                share: 0.6,
                detailProjects: ['경력단절여성 지원', '여성새로일하기센터', '폭력피해여성 지원'],
              },
            ],
          },
        ],
      },
      {
        code: '014',
        name: '노동',
        share: 0.14,
        programs: [
          {
            name: '고용보험 운영',
            share: 0.6,
            unitProjects: [
              {
                name: '실업급여',
                share: 0.7,
                detailProjects: ['구직급여', '취업촉진수당', '연장급여'],
              },
              {
                name: '고용안정사업',
                share: 0.3,
                detailProjects: ['고용유지지원금', '채용장려금'],
              },
            ],
          },
          {
            name: '직업능력개발',
            share: 0.4,
            unitProjects: [
              {
                name: '국민내일배움카드',
                share: 0.6,
                detailProjects: ['훈련비 지원', '훈련장려금'],
              },
              {
                name: '사업주 훈련 지원',
                share: 0.4,
                detailProjects: ['사업주 직업훈련', 'K-디지털 트레이닝'],
              },
            ],
          },
        ],
      },
      {
        code: '015',
        name: '주택',
        share: 0.14,
        programs: [
          {
            name: '주거복지 지원',
            share: 0.7,
            unitProjects: [
              {
                name: '공공임대주택',
                share: 0.6,
                detailProjects: ['영구임대주택', '국민임대주택', '행복주택'],
              },
              {
                name: '주거급여',
                share: 0.4,
                detailProjects: ['임차가구 주거급여', '자가가구 수선유지급여'],
              },
            ],
          },
          {
            name: '주거환경 개선',
            share: 0.3,
            unitProjects: [
              {
                name: '도시재생 지원',
                share: 0.5,
                detailProjects: ['도시재생 뉴딜', '주거환경 개선사업'],
              },
              {
                name: '노후 주거지 정비',
                share: 0.5,
                detailProjects: ['재개발 지원', '재건축 지원'],
              },
            ],
          },
        ],
      },
      {
        code: '016',
        name: '사회복지 일반',
        share: 0.28,
        programs: [
          {
            name: '국민연금 운영',
            share: 0.7,
            unitProjects: [
              {
                name: '국민연금 급여',
                share: 0.8,
                detailProjects: ['노령연금', '장애연금', '유족연금'],
              },
              {
                name: '국민연금 관리운영',
                share: 0.2,
                detailProjects: ['공단 운영', 'IT 인프라'],
              },
            ],
          },
          {
            name: '사회서비스 확충',
            share: 0.3,
            unitProjects: [
              {
                name: '바우처 사회서비스',
                share: 0.6,
                detailProjects: ['산모·신생아 건강관리', '가사간병 방문지원', '장애아동가족지원'],
              },
              {
                name: '지역사회 통합돌봄',
                share: 0.4,
                detailProjects: ['커뮤니티케어 선도사업', '재가의료급여'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '020',
    name: '교육',
    amount2024: 96_000_000,
    ministries: ['교육부'],
    sectors: [
      {
        code: '021',
        name: '유아 및 초중등교육',
        share: 0.6,
        programs: [
          {
            name: '초중등 교육 지원',
            share: 0.6,
            unitProjects: [
              {
                name: '지방교육재정교부금',
                share: 0.8,
                detailProjects: ['보통교부금', '특별교부금'],
              },
              {
                name: '누리과정 지원',
                share: 0.2,
                detailProjects: ['유치원 누리과정', '어린이집 누리과정'],
              },
            ],
          },
          {
            name: '특수·대안교육 지원',
            share: 0.2,
            unitProjects: [
              {
                name: '특수교육 지원',
                share: 0.7,
                detailProjects: ['특수학교 운영', '특수학급 지원', '보조인력 지원'],
              },
              {
                name: '방과후 학교 지원',
                share: 0.3,
                detailProjects: ['방과후 학교 운영', '저소득층 방과후'],
              },
            ],
          },
          {
            name: '학교급식 지원',
            share: 0.2,
            unitProjects: [
              {
                name: '학교급식 시설',
                share: 0.4,
                detailProjects: ['급식시설 현대화', '급식기구 구입'],
              },
              {
                name: '무상급식 지원',
                share: 0.6,
                detailProjects: ['초등 무상급식', '중학교 무상급식'],
              },
            ],
          },
        ],
      },
      {
        code: '022',
        name: '고등교육',
        share: 0.3,
        programs: [
          {
            name: '대학 지원',
            share: 0.5,
            unitProjects: [
              {
                name: '국립대학 운영',
                share: 0.5,
                detailProjects: ['국립대학 인건비', '국립대학 시설', '국립대학 연구'],
              },
              {
                name: '대학 혁신 지원',
                share: 0.5,
                detailProjects: ['대학혁신지원사업', 'BK21'],
              },
            ],
          },
          {
            name: '학자금 지원',
            share: 0.5,
            unitProjects: [
              {
                name: '국가장학금',
                share: 0.7,
                detailProjects: ['소득분위별 국가장학금', '다자녀 국가장학금'],
              },
              {
                name: '학자금 대출',
                share: 0.3,
                detailProjects: ['취업후 상환 학자금', '일반 상환 학자금'],
              },
            ],
          },
        ],
      },
      {
        code: '023',
        name: '평생·직업교육',
        share: 0.1,
        programs: [
          {
            name: '평생교육 진흥',
            share: 0.6,
            unitProjects: [
              {
                name: '평생교육바우처',
                share: 0.5,
                detailProjects: ['성인 학습 지원', '문해교육 지원'],
              },
              {
                name: '지역평생교육',
                share: 0.5,
                detailProjects: ['평생학습도시', '평생교육이용권'],
              },
            ],
          },
          {
            name: '직업교육 지원',
            share: 0.4,
            unitProjects: [
              {
                name: '직업계고 지원',
                share: 0.6,
                detailProjects: ['마이스터고 운영', '직업계고 취업지원'],
              },
              {
                name: '전문대학 지원',
                share: 0.4,
                detailProjects: ['전문대학 혁신지원', '전문대학 특성화'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '050',
    name: '국방',
    amount2024: 59_000_000,
    ministries: ['국방부'],
    sectors: [
      {
        code: '051',
        name: '병력운영',
        share: 0.45,
        programs: [
          {
            name: '병력 유지',
            share: 0.7,
            unitProjects: [
              {
                name: '장교·부사관 인건비',
                share: 0.6,
                detailProjects: ['현역 장교 인건비', '현역 부사관 인건비'],
              },
              {
                name: '병 운영',
                share: 0.4,
                detailProjects: ['병 봉급', '병영생활 개선'],
              },
            ],
          },
          {
            name: '부대 운영',
            share: 0.3,
            unitProjects: [
              {
                name: '부대 유지·운영',
                share: 0.6,
                detailProjects: ['시설 유지', '장비 운영유지', '피복·급식'],
              },
              {
                name: '교육훈련',
                share: 0.4,
                detailProjects: ['부대 전투훈련', '교육기관 운영'],
              },
            ],
          },
        ],
      },
      {
        code: '052',
        name: '전력유지',
        share: 0.25,
        programs: [
          {
            name: '무기체계 유지',
            share: 0.6,
            unitProjects: [
              {
                name: '육군 무기체계',
                share: 0.4,
                detailProjects: ['전차 운영유지', '자주포 운영유지', '소화기 정비'],
              },
              {
                name: '해군 무기체계',
                share: 0.3,
                detailProjects: ['함정 운영유지', '잠수함 운영유지'],
              },
              {
                name: '공군 무기체계',
                share: 0.3,
                detailProjects: ['전투기 운영유지', '방공체계 운영유지'],
              },
            ],
          },
          {
            name: '정보·감시·정찰',
            share: 0.4,
            unitProjects: [
              {
                name: '감시정찰 자산',
                share: 0.6,
                detailProjects: ['정찰위성 운용', '무인기 운용', '전자전 자산'],
              },
              {
                name: '사이버 작전',
                share: 0.4,
                detailProjects: ['사이버방어', '사이버 작전 역량'],
              },
            ],
          },
        ],
      },
      {
        code: '053',
        name: '방위력개선',
        share: 0.3,
        programs: [
          {
            name: '핵심전력 확보',
            share: 0.6,
            unitProjects: [
              {
                name: 'F-35A 전투기',
                share: 0.3,
                detailProjects: ['F-35A 구매', 'F-35A 부품 확보'],
              },
              {
                name: '차세대 전투기',
                share: 0.3,
                detailProjects: ['KF-21 개발', 'KF-21 양산'],
              },
              {
                name: '지상 핵심전력',
                share: 0.4,
                detailProjects: ['K2 전차 양산', '자주포 개량', '신형 장갑차'],
              },
            ],
          },
          {
            name: '방산 연구개발',
            share: 0.4,
            unitProjects: [
              {
                name: '무기체계 연구개발',
                share: 0.7,
                detailProjects: ['미사일 개발', '해상전력 개발', '위성통신 개발'],
              },
              {
                name: '국방과학기술',
                share: 0.3,
                detailProjects: ['기초연구 지원', 'ADD 운영'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '060',
    name: '일반·지방행정',
    amount2024: 89_000_000,
    ministries: ['행정안전부', '기획재정부', '인사혁신처', '법제처'],
    sectors: [
      {
        code: '061',
        name: '입법 및 선거관리',
        share: 0.05,
        programs: [
          {
            name: '국회 운영',
            share: 0.7,
            unitProjects: [
              {
                name: '국회 의정활동',
                share: 0.7,
                detailProjects: ['본회의 운영', '상임위원회 운영', '국회 예산'],
              },
              {
                name: '국회 인프라',
                share: 0.3,
                detailProjects: ['국회 시설관리', '입법조사 서비스'],
              },
            ],
          },
          {
            name: '선거 관리',
            share: 0.3,
            unitProjects: [
              {
                name: '선거 실시',
                share: 0.8,
                detailProjects: ['대선 관리', '총선 관리', '지방선거 관리'],
              },
              {
                name: '선관위 운영',
                share: 0.2,
                detailProjects: ['선관위 인건비', '선관위 시설'],
              },
            ],
          },
        ],
      },
      {
        code: '062',
        name: '재정·금융',
        share: 0.15,
        programs: [
          {
            name: '재정 운용',
            share: 0.6,
            unitProjects: [
              {
                name: '국채 이자',
                share: 0.7,
                detailProjects: ['국고채 이자', '외화채권 이자'],
              },
              {
                name: '재정 투·융자',
                share: 0.3,
                detailProjects: ['재정융자', '예산집행 관리'],
              },
            ],
          },
          {
            name: '세정 운영',
            share: 0.4,
            unitProjects: [
              {
                name: '국세청 운영',
                share: 0.7,
                detailProjects: ['조세행정', '세무조사', 'IT 인프라 구축'],
              },
              {
                name: '관세청 운영',
                share: 0.3,
                detailProjects: ['수출입 통관', '관세 징수'],
              },
            ],
          },
        ],
      },
      {
        code: '063',
        name: '지방행정·재정지원',
        share: 0.65,
        programs: [
          {
            name: '지방교부세',
            share: 0.7,
            unitProjects: [
              {
                name: '보통교부세',
                share: 0.8,
                detailProjects: ['보통교부세 지원', '교부세 산정'],
              },
              {
                name: '특별교부세',
                share: 0.2,
                detailProjects: ['재해대책 특교세', '지역현안 특교세'],
              },
            ],
          },
          {
            name: '균형발전 지원',
            share: 0.3,
            unitProjects: [
              {
                name: '국가균형발전특별회계',
                share: 0.7,
                detailProjects: ['생활권 사업', '지역 특화 발전', '행복생활권'],
              },
              {
                name: '지방 재정 운영',
                share: 0.3,
                detailProjects: ['지방재정 혁신', '지방 자치 강화'],
              },
            ],
          },
        ],
      },
      {
        code: '064',
        name: '정부자원관리',
        share: 0.15,
        programs: [
          {
            name: '인사·조직 관리',
            share: 0.5,
            unitProjects: [
              {
                name: '공무원 인사관리',
                share: 0.6,
                detailProjects: ['인사혁신 운영', '공무원 교육', '성과관리'],
              },
              {
                name: '정부조직 운영',
                share: 0.4,
                detailProjects: ['정부청사 관리', '국유재산 관리'],
              },
            ],
          },
          {
            name: '전자정부 구현',
            share: 0.5,
            unitProjects: [
              {
                name: '행정정보화',
                share: 0.6,
                detailProjects: ['정부24 운영', '행정정보 공동이용', '전자문서 관리'],
              },
              {
                name: '디지털 정부 혁신',
                share: 0.4,
                detailProjects: ['마이데이터 구축', '클라우드 전환', 'AI 행정서비스'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '070',
    name: '공공질서·안전',
    amount2024: 23_000_000,
    ministries: ['법무부', '경찰청', '소방청', '해양경찰청'],
    sectors: [
      {
        code: '071',
        name: '경찰',
        share: 0.45,
        programs: [
          {
            name: '생활안전 및 범죄예방',
            share: 0.5,
            unitProjects: [
              {
                name: '지역 경찰 운영',
                share: 0.6,
                detailProjects: ['파출소·지구대 운영', '순찰활동', '범죄예방 활동'],
              },
              {
                name: '교통 관리',
                share: 0.4,
                detailProjects: ['교통 단속', '교통 인프라 운영'],
              },
            ],
          },
          {
            name: '수사·형사',
            share: 0.5,
            unitProjects: [
              {
                name: '과학수사',
                share: 0.5,
                detailProjects: ['과학수사 센터', '디지털 포렌식'],
              },
              {
                name: '사이버 범죄 수사',
                share: 0.5,
                detailProjects: ['사이버수사대', '해킹 대응'],
              },
            ],
          },
        ],
      },
      {
        code: '072',
        name: '해경·소방',
        share: 0.3,
        programs: [
          {
            name: '소방 서비스',
            share: 0.6,
            unitProjects: [
              {
                name: '소방력 확충',
                share: 0.5,
                detailProjects: ['소방차 확충', '소방관 증원', '소방장비 현대화'],
              },
              {
                name: '119 구조·구급',
                share: 0.5,
                detailProjects: ['구급대 운영', '구조대 운영', '항공 소방대'],
              },
            ],
          },
          {
            name: '해양 안전',
            share: 0.4,
            unitProjects: [
              {
                name: '해상 경비',
                share: 0.6,
                detailProjects: ['함정 운영', '항공기 운영', '연안 경비'],
              },
              {
                name: '해양 오염 방제',
                share: 0.4,
                detailProjects: ['방제 장비 운영', '해양오염 감시'],
              },
            ],
          },
        ],
      },
      {
        code: '073',
        name: '법원 및 헌재',
        share: 0.25,
        programs: [
          {
            name: '사법 서비스',
            share: 0.7,
            unitProjects: [
              {
                name: '재판 운영',
                share: 0.7,
                detailProjects: ['민사 재판', '형사 재판', '행정 재판'],
              },
              {
                name: '사법지원 서비스',
                share: 0.3,
                detailProjects: ['법원도서관', '전자소송 시스템'],
              },
            ],
          },
          {
            name: '검찰·교정',
            share: 0.3,
            unitProjects: [
              {
                name: '검찰 운영',
                share: 0.5,
                detailProjects: ['공소유지', '수사 활동'],
              },
              {
                name: '교정 시설',
                share: 0.5,
                detailProjects: ['교정시설 운영', '수용자 처우 개선'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '080',
    name: '농림수산',
    amount2024: 23_000_000,
    ministries: ['농림축산식품부', '해양수산부', '농촌진흥청', '산림청'],
    sectors: [
      {
        code: '081',
        name: '농업·농촌',
        share: 0.55,
        programs: [
          {
            name: '농업인 소득·경영 지원',
            share: 0.45,
            unitProjects: [
              {
                name: '농업인 직접직불',
                share: 0.6,
                detailProjects: ['기본직불금', '선택직불금'],
              },
              {
                name: '농업 재해 대응',
                share: 0.4,
                detailProjects: ['농작물 재해보험', '가축재해보험', '재해복구 지원'],
              },
            ],
          },
          {
            name: '친환경·고품질 농업',
            share: 0.3,
            unitProjects: [
              {
                name: '친환경농업 지원',
                share: 0.5,
                detailProjects: ['친환경인증 지원', '유기농업 육성'],
              },
              {
                name: '스마트팜 보급',
                share: 0.5,
                detailProjects: ['스마트팜 인프라', '스마트팜 혁신밸리'],
              },
            ],
          },
          {
            name: '농촌 개발',
            share: 0.25,
            unitProjects: [
              {
                name: '농촌 생활 인프라',
                share: 0.6,
                detailProjects: ['농어촌도로 정비', '마을상수도', '오·폐수 처리'],
              },
              {
                name: '농촌 활력화',
                share: 0.4,
                detailProjects: ['귀농·귀촌 지원', '농촌 관광'],
              },
            ],
          },
        ],
      },
      {
        code: '082',
        name: '해양수산',
        share: 0.3,
        programs: [
          {
            name: '수산업 육성',
            share: 0.6,
            unitProjects: [
              {
                name: '수산자원 관리',
                share: 0.5,
                detailProjects: ['수산자원 조사', '어류 방류', '금어구역 관리'],
              },
              {
                name: '어업인 지원',
                share: 0.5,
                detailProjects: ['어업인 직불금', '어업재해보험', '어선 현대화'],
              },
            ],
          },
          {
            name: '항만 개발',
            share: 0.4,
            unitProjects: [
              {
                name: '항만 건설',
                share: 0.6,
                detailProjects: ['무역항 개발', '어항 개발', '마리나 개발'],
              },
              {
                name: '항만 운영',
                share: 0.4,
                detailProjects: ['항만 시설 유지', '항만 안전 관리'],
              },
            ],
          },
        ],
      },
      {
        code: '083',
        name: '산림',
        share: 0.15,
        programs: [
          {
            name: '산림자원 조성',
            share: 0.5,
            unitProjects: [
              {
                name: '산림 조성',
                share: 0.5,
                detailProjects: ['신규조림', '숲가꾸기', '경제림 조성'],
              },
              {
                name: '산불 예방·진화',
                share: 0.5,
                detailProjects: ['산불 감시', '산불 진화 인프라', '산불 재해 복구'],
              },
            ],
          },
          {
            name: '산림복지 서비스',
            share: 0.5,
            unitProjects: [
              {
                name: '국립공원 관리',
                share: 0.5,
                detailProjects: ['국립공원 운영', '자연환경 보전'],
              },
              {
                name: '숲 복지 서비스',
                share: 0.5,
                detailProjects: ['치유의숲 운영', '유아숲 체험원'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '090',
    name: '산업·중소기업·에너지',
    amount2024: 29_000_000,
    ministries: ['산업통상자원부', '중소벤처기업부', '공정거래위원회'],
    sectors: [
      {
        code: '091',
        name: '산업·중소기업 일반',
        share: 0.35,
        programs: [
          {
            name: '중소기업 지원',
            share: 0.6,
            unitProjects: [
              {
                name: '중소기업 정책자금',
                share: 0.5,
                detailProjects: ['시설자금 융자', '운전자금 융자'],
              },
              {
                name: '창업 지원',
                share: 0.5,
                detailProjects: ['창업넷', '스타트업 육성', '창업보육센터'],
              },
            ],
          },
          {
            name: '산업구조 고도화',
            share: 0.4,
            unitProjects: [
              {
                name: '소재·부품·장비 경쟁력',
                share: 0.6,
                detailProjects: ['소부장 핵심기술 개발', '소부장 전문기업 육성'],
              },
              {
                name: '디지털 전환',
                share: 0.4,
                detailProjects: ['스마트공장 보급', 'AI·빅데이터 활용'],
              },
            ],
          },
        ],
      },
      {
        code: '092',
        name: '에너지 및 자원개발',
        share: 0.35,
        programs: [
          {
            name: '에너지 공급 안정',
            share: 0.5,
            unitProjects: [
              {
                name: '전력 공급',
                share: 0.7,
                detailProjects: ['발전소 건설', '송배전 망 확충', '전력수급 관리'],
              },
              {
                name: '에너지 가격 안정',
                share: 0.3,
                detailProjects: ['연료비 조정', '취약계층 에너지 지원'],
              },
            ],
          },
          {
            name: '신재생에너지 보급',
            share: 0.5,
            unitProjects: [
              {
                name: '태양광·풍력 확대',
                share: 0.6,
                detailProjects: ['태양광 보급 지원', '해상풍력 개발'],
              },
              {
                name: '수소경제 육성',
                share: 0.4,
                detailProjects: ['수소충전소 구축', '연료전지 발전'],
              },
            ],
          },
        ],
      },
      {
        code: '093',
        name: '무역 및 투자유치',
        share: 0.3,
        programs: [
          {
            name: '수출 지원',
            share: 0.6,
            unitProjects: [
              {
                name: '수출 마케팅',
                share: 0.5,
                detailProjects: ['해외 전시회 참가', '수출기업 지원', 'K-브랜드 홍보'],
              },
              {
                name: '무역금융 지원',
                share: 0.5,
                detailProjects: ['수출보험', '수출입은행 지원'],
              },
            ],
          },
          {
            name: '외국인 투자유치',
            share: 0.4,
            unitProjects: [
              {
                name: '투자 환경 조성',
                share: 0.5,
                detailProjects: ['규제자유특구', '경제자유구역 운영'],
              },
              {
                name: '외투기업 지원',
                share: 0.5,
                detailProjects: ['현금지원', '입지지원', '세금혜택'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '100',
    name: '교통·물류',
    amount2024: 26_000_000,
    ministries: ['국토교통부', '해양수산부'],
    sectors: [
      {
        code: '101',
        name: '도로',
        share: 0.45,
        programs: [
          {
            name: '고속도로 건설',
            share: 0.5,
            unitProjects: [
              {
                name: '고속도로 신설',
                share: 0.6,
                detailProjects: ['수도권 고속도로', '지방 고속도로'],
              },
              {
                name: '고속도로 관리',
                share: 0.4,
                detailProjects: ['도로 유지보수', '터널·교량 점검'],
              },
            ],
          },
          {
            name: '국도 건설',
            share: 0.5,
            unitProjects: [
              {
                name: '국도 건설',
                share: 0.5,
                detailProjects: ['4차로 확장', '안전시설 설치'],
              },
              {
                name: '국도 유지관리',
                share: 0.5,
                detailProjects: ['포장 보수', '시설물 관리'],
              },
            ],
          },
        ],
      },
      {
        code: '102',
        name: '철도',
        share: 0.35,
        programs: [
          {
            name: '고속철도 건설',
            share: 0.5,
            unitProjects: [
              {
                name: 'KTX 노선 확장',
                share: 0.7,
                detailProjects: ['수도권광역급행철도', '남부내륙철도', '동해선 복선'],
              },
              {
                name: '도시철도 지원',
                share: 0.3,
                detailProjects: ['광역철도 지원', '도심 지하철'],
              },
            ],
          },
          {
            name: '철도 운영',
            share: 0.5,
            unitProjects: [
              {
                name: '철도 안전관리',
                share: 0.5,
                detailProjects: ['신호시스템 개선', '선로 유지보수'],
              },
              {
                name: '대중교통 지원',
                share: 0.5,
                detailProjects: ['저상버스 도입', '대중교통 적자 보전'],
              },
            ],
          },
        ],
      },
      {
        code: '103',
        name: '항공·공항',
        share: 0.2,
        programs: [
          {
            name: '공항 건설',
            share: 0.6,
            unitProjects: [
              {
                name: '국제공항 확장',
                share: 0.7,
                detailProjects: ['인천공항 확장', '김해신공항', '제주 제2공항'],
              },
              {
                name: '지방공항 운영',
                share: 0.3,
                detailProjects: ['지방공항 시설', '항공안전 관리'],
              },
            ],
          },
          {
            name: '항공 산업 육성',
            share: 0.4,
            unitProjects: [
              {
                name: '항공기 산업',
                share: 0.6,
                detailProjects: ['항공MRO 육성', 'UAM 실증'],
              },
              {
                name: '항공안전 기반',
                share: 0.4,
                detailProjects: ['항공안전 시스템', '항공보안 강화'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '110',
    name: '환경',
    amount2024: 12_000_000,
    ministries: ['환경부'],
    sectors: [
      {
        code: '111',
        name: '상하수도·수질',
        share: 0.4,
        programs: [
          {
            name: '상수도 공급',
            share: 0.5,
            unitProjects: [
              {
                name: '광역상수도 관리',
                share: 0.6,
                detailProjects: ['정수장 운영', '광역관로 관리'],
              },
              {
                name: '마을상수도',
                share: 0.4,
                detailProjects: ['소규모 수도 지원', '노후관 교체'],
              },
            ],
          },
          {
            name: '하수처리 및 수질보전',
            share: 0.5,
            unitProjects: [
              {
                name: '하수처리 시설',
                share: 0.6,
                detailProjects: ['하수처리장 건설', '하수관거 정비'],
              },
              {
                name: '수질 오염 방지',
                share: 0.4,
                detailProjects: ['4대강 수질 관리', '비점오염 저감'],
              },
            ],
          },
        ],
      },
      {
        code: '112',
        name: '대기·기후·자연',
        share: 0.4,
        programs: [
          {
            name: '기후변화 대응',
            share: 0.5,
            unitProjects: [
              {
                name: '탄소중립 이행',
                share: 0.6,
                detailProjects: ['온실가스 감축', '배출권거래제 운영', 'RE100 지원'],
              },
              {
                name: '대기오염 관리',
                share: 0.4,
                detailProjects: ['미세먼지 저감', '사업장 배출 관리'],
              },
            ],
          },
          {
            name: '자연환경 보전',
            share: 0.5,
            unitProjects: [
              {
                name: '생태계 복원',
                share: 0.5,
                detailProjects: ['습지 보전', '멸종위기종 보호', '도시생태축 복원'],
              },
              {
                name: '자연환경조사',
                share: 0.5,
                detailProjects: ['국토환경 DB 구축', '생물다양성 조사'],
              },
            ],
          },
        ],
      },
      {
        code: '113',
        name: '폐기물관리',
        share: 0.2,
        programs: [
          {
            name: '폐기물 처리',
            share: 0.6,
            unitProjects: [
              {
                name: '생활폐기물 처리',
                share: 0.5,
                detailProjects: ['소각시설 건설', '매립지 관리'],
              },
              {
                name: '산업폐기물 관리',
                share: 0.5,
                detailProjects: ['사업장 폐기물 감시', '유해폐기물 처리'],
              },
            ],
          },
          {
            name: '재활용 촉진',
            share: 0.4,
            unitProjects: [
              {
                name: '재활용 인프라',
                share: 0.6,
                detailProjects: ['선별시설 현대화', '재활용 기술 개발'],
              },
              {
                name: '자원 순환',
                share: 0.4,
                detailProjects: ['플라스틱 감축', '음식물쓰레기 자원화'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '120',
    name: '과학기술',
    amount2024: 10_000_000,
    ministries: ['과학기술정보통신부', '한국연구재단'],
    sectors: [
      {
        code: '121',
        name: '기초연구',
        share: 0.4,
        programs: [
          {
            name: '기초과학 연구 지원',
            share: 0.7,
            unitProjects: [
              {
                name: '개인기초연구',
                share: 0.5,
                detailProjects: ['우수연구자 지원', '신진연구자 지원', '기초연구실'],
              },
              {
                name: '집단연구',
                share: 0.5,
                detailProjects: ['선도연구센터', '기초과학연구원'],
              },
            ],
          },
          {
            name: '과학기술 인재 양성',
            share: 0.3,
            unitProjects: [
              {
                name: '이공계 인재 육성',
                share: 0.6,
                detailProjects: ['이공계 장학금', '글로벌 석학 초청'],
              },
              {
                name: '과학문화 확산',
                share: 0.4,
                detailProjects: ['과학관 운영', '과학 교육 콘텐츠'],
              },
            ],
          },
        ],
      },
      {
        code: '122',
        name: '미래원천기술개발',
        share: 0.35,
        programs: [
          {
            name: '원천기술 확보',
            share: 0.6,
            unitProjects: [
              {
                name: '나노·소재 기술',
                share: 0.4,
                detailProjects: ['나노기술 개발', '첨단소재 개발'],
              },
              {
                name: '바이오·의료 기술',
                share: 0.6,
                detailProjects: ['신약 개발', '의료기기 개발', '바이오헬스'],
              },
            ],
          },
          {
            name: '국가전략기술 육성',
            share: 0.4,
            unitProjects: [
              {
                name: '반도체 원천기술',
                share: 0.5,
                detailProjects: ['반도체 기초연구', '차세대 반도체'],
              },
              {
                name: '양자기술 개발',
                share: 0.5,
                detailProjects: ['양자컴퓨팅', '양자통신'],
              },
            ],
          },
        ],
      },
      {
        code: '123',
        name: '연구개발 환경 기반',
        share: 0.25,
        programs: [
          {
            name: '연구 인프라 구축',
            share: 0.6,
            unitProjects: [
              {
                name: '대형 연구 시설',
                share: 0.6,
                detailProjects: ['방사광가속기', '중이온가속기 운영'],
              },
              {
                name: '연구데이터 플랫폼',
                share: 0.4,
                detailProjects: ['국가슈퍼컴퓨팅', '연구데이터 공유'],
              },
            ],
          },
          {
            name: '기술사업화 지원',
            share: 0.4,
            unitProjects: [
              {
                name: '기술 이전·사업화',
                share: 0.6,
                detailProjects: ['기술이전 촉진', '스핀오프 지원'],
              },
              {
                name: '특허·표준화',
                share: 0.4,
                detailProjects: ['지식재산권 관리', '국제표준 획득'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '130',
    name: '문화·체육·관광',
    amount2024: 9_000_000,
    ministries: ['문화체육관광부', '문화재청'],
    sectors: [
      {
        code: '131',
        name: '문화예술',
        share: 0.45,
        programs: [
          {
            name: '문화예술 진흥',
            share: 0.6,
            unitProjects: [
              {
                name: '예술 창작 지원',
                share: 0.5,
                detailProjects: ['예술인 복지', '문화예술 교육', '독립예술 지원'],
              },
              {
                name: '문화시설 운영',
                share: 0.5,
                detailProjects: ['국립극장', '국립현대미술관', '국립중앙도서관'],
              },
            ],
          },
          {
            name: '문화재 보존',
            share: 0.4,
            unitProjects: [
              {
                name: '국가유산 관리',
                share: 0.6,
                detailProjects: ['문화재 보수·정비', '매장문화재 발굴'],
              },
              {
                name: '궁궐·유네스코 관리',
                share: 0.4,
                detailProjects: ['궁궐 관리', '세계문화유산 보존'],
              },
            ],
          },
        ],
      },
      {
        code: '132',
        name: '체육',
        share: 0.25,
        programs: [
          {
            name: '생활체육 활성화',
            share: 0.5,
            unitProjects: [
              {
                name: '체육시설 확충',
                share: 0.6,
                detailProjects: ['공공체육시설 건설', '노인체육시설 지원'],
              },
              {
                name: '스포츠 강좌 이용권',
                share: 0.4,
                detailProjects: ['스포츠강좌이용권', '스포츠클럽 지원'],
              },
            ],
          },
          {
            name: '엘리트 스포츠',
            share: 0.5,
            unitProjects: [
              {
                name: '국가대표 육성',
                share: 0.7,
                detailProjects: ['국가대표 훈련', '태릉선수촌 운영'],
              },
              {
                name: '국제대회 유치',
                share: 0.3,
                detailProjects: ['올림픽 준비', '아시안게임 지원'],
              },
            ],
          },
        ],
      },
      {
        code: '133',
        name: '관광',
        share: 0.3,
        programs: [
          {
            name: '관광 산업 육성',
            share: 0.6,
            unitProjects: [
              {
                name: '외래 관광객 유치',
                share: 0.5,
                detailProjects: ['해외 관광 홍보', 'K-콘텐츠 연계 관광'],
              },
              {
                name: '국내 관광 활성화',
                share: 0.5,
                detailProjects: ['지역 관광 개발', '관광 인프라 지원'],
              },
            ],
          },
          {
            name: '한류 콘텐츠 진흥',
            share: 0.4,
            unitProjects: [
              {
                name: '콘텐츠 제작 지원',
                share: 0.6,
                detailProjects: ['드라마·영화 지원', '게임·웹툰 육성', 'K-POP 지원'],
              },
              {
                name: '한류 확산',
                share: 0.4,
                detailProjects: ['해외문화원 운영', '세계한국어교육'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '140',
    name: '보건',
    amount2024: 17_000_000,
    ministries: ['보건복지부', '식품의약품안전처', '질병관리청'],
    sectors: [
      {
        code: '141',
        name: '건강보험',
        share: 0.55,
        programs: [
          {
            name: '건강보험 지원',
            share: 0.8,
            unitProjects: [
              {
                name: '건강보험 국고지원',
                share: 0.8,
                detailProjects: ['직장가입자 지원', '지역가입자 지원'],
              },
              {
                name: '의료급여 관리',
                share: 0.2,
                detailProjects: ['의료급여비 지급', '의료급여 심사'],
              },
            ],
          },
          {
            name: '건강보험 적용 확대',
            share: 0.2,
            unitProjects: [
              {
                name: '비급여 급여화',
                share: 0.6,
                detailProjects: ['MRI 급여화', '초음파 급여화'],
              },
              {
                name: '치매 국가책임',
                share: 0.4,
                detailProjects: ['치매검진 지원', '치매치료관리비'],
              },
            ],
          },
        ],
      },
      {
        code: '142',
        name: '식품·의약품 안전',
        share: 0.2,
        programs: [
          {
            name: '식품 안전 관리',
            share: 0.5,
            unitProjects: [
              {
                name: '식품 검사·인증',
                share: 0.6,
                detailProjects: ['식품 안전성 검사', '수입식품 검역'],
              },
              {
                name: '식품 위해 예방',
                share: 0.4,
                detailProjects: ['식품위해정보 수집', '식중독 예방'],
              },
            ],
          },
          {
            name: '의약품 안전 관리',
            share: 0.5,
            unitProjects: [
              {
                name: '의약품 허가·심사',
                share: 0.6,
                detailProjects: ['신약 허가', '제네릭 허가 관리'],
              },
              {
                name: '의료기기 안전',
                share: 0.4,
                detailProjects: ['의료기기 허가', '임상시험 관리'],
              },
            ],
          },
        ],
      },
      {
        code: '143',
        name: '질병 예방·관리',
        share: 0.25,
        programs: [
          {
            name: '감염병 예방',
            share: 0.6,
            unitProjects: [
              {
                name: '예방접종 지원',
                share: 0.5,
                detailProjects: ['어린이 무료 예방접종', '인플루엔자 접종'],
              },
              {
                name: '감염병 대응',
                share: 0.5,
                detailProjects: ['감염병 감시', '검역 체계', '백신 비축'],
              },
            ],
          },
          {
            name: '만성질환 예방',
            share: 0.4,
            unitProjects: [
              {
                name: '암 검진 지원',
                share: 0.6,
                detailProjects: ['국가암 검진', '암 조기 진단'],
              },
              {
                name: '정신건강 증진',
                share: 0.4,
                detailProjects: ['정신건강복지센터', '자살예방 사업'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '150',
    name: '외교·통일',
    amount2024: 6_000_000,
    ministries: ['외교부', '통일부', '국가정보원'],
    sectors: [
      {
        code: '151',
        name: '외교',
        share: 0.55,
        programs: [
          {
            name: '외교 활동',
            share: 0.6,
            unitProjects: [
              {
                name: '재외공관 운영',
                share: 0.6,
                detailProjects: ['대사관 운영', '영사서비스', '재외국민 보호'],
              },
              {
                name: '국제협력 ODA',
                share: 0.4,
                detailProjects: ['무상원조 (KOICA)', '유상원조 (EDCF)'],
              },
            ],
          },
          {
            name: '국제기구 기여',
            share: 0.4,
            unitProjects: [
              {
                name: '유엔 분담금',
                share: 0.5,
                detailProjects: ['유엔 일반예산', '유엔 PKO 분담금'],
              },
              {
                name: '국제기구 기여금',
                share: 0.5,
                detailProjects: ['WHO 기여금', 'OECD 기여금', '기후기금'],
              },
            ],
          },
        ],
      },
      {
        code: '152',
        name: '통일',
        share: 0.45,
        programs: [
          {
            name: '남북교류 협력',
            share: 0.5,
            unitProjects: [
              {
                name: '남북협력기금',
                share: 0.7,
                detailProjects: ['인도적 지원', '이산가족 상봉', '교류협력 사업'],
              },
              {
                name: '대북 지원',
                share: 0.3,
                detailProjects: ['식량 지원', '영유아 지원', '보건의료 지원'],
              },
            ],
          },
          {
            name: '북한이탈주민 정착',
            share: 0.5,
            unitProjects: [
              {
                name: '하나원 운영',
                share: 0.4,
                detailProjects: ['초기 정착 지원', '직업훈련 교육'],
              },
              {
                name: '이탈주민 지원',
                share: 0.6,
                detailProjects: ['정착지원금', '취업지원', '심리상담 지원'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '160',
    name: '통신',
    amount2024: 2_000_000,
    ministries: ['과학기술정보통신부'],
    sectors: [
      {
        code: '161',
        name: '정보통신',
        share: 0.7,
        programs: [
          {
            name: '디지털 인프라 구축',
            share: 0.6,
            unitProjects: [
              {
                name: '5G 네트워크 확산',
                share: 0.5,
                detailProjects: ['5G 농어촌 커버리지', '5G 공공망 구축'],
              },
              {
                name: '초고속통신망 고도화',
                share: 0.5,
                detailProjects: ['기가인터넷 보급', '와이파이 6 전환'],
              },
            ],
          },
          {
            name: '방송·통신 규제',
            share: 0.4,
            unitProjects: [
              {
                name: '전파 관리',
                share: 0.6,
                detailProjects: ['주파수 배분', '전파 모니터링'],
              },
              {
                name: '방송 지원',
                share: 0.4,
                detailProjects: ['공익채널 지원', '지역방송 지원'],
              },
            ],
          },
        ],
      },
      {
        code: '162',
        name: '우편·집배',
        share: 0.3,
        programs: [
          {
            name: '우편 서비스',
            share: 0.8,
            unitProjects: [
              {
                name: '우편물 처리',
                share: 0.6,
                detailProjects: ['우편집중국 운영', '우편집배원 운영'],
              },
              {
                name: '우편 물류 혁신',
                share: 0.4,
                detailProjects: ['스마트 물류센터', '드론 배송 실증'],
              },
            ],
          },
          {
            name: '금융·보험 서비스',
            share: 0.2,
            unitProjects: [
              {
                name: '우체국 금융',
                share: 1.0,
                detailProjects: ['우체국 예금', '우체국 보험'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '170',
    name: '국토·지역개발',
    amount2024: 3_000_000,
    ministries: ['국토교통부', '행정안전부'],
    sectors: [
      {
        code: '171',
        name: '국토개발',
        share: 0.5,
        programs: [
          {
            name: '국토계획 수립',
            share: 0.4,
            unitProjects: [
              {
                name: '국토 공간계획',
                share: 0.6,
                detailProjects: ['국토종합계획', '수도권 계획'],
              },
              {
                name: '도시계획 지원',
                share: 0.4,
                detailProjects: ['도시기본계획 지원', '공간정보 구축'],
              },
            ],
          },
          {
            name: '도시재생 뉴딜',
            share: 0.6,
            unitProjects: [
              {
                name: '도시재생 사업',
                share: 0.7,
                detailProjects: ['주거지원형 재생', '일반 근린형 재생', '중심시가지형 재생'],
              },
              {
                name: '스마트 도시 조성',
                share: 0.3,
                detailProjects: ['스마트시티 실증', '디지털 트윈 도시'],
              },
            ],
          },
        ],
      },
      {
        code: '172',
        name: '지역개발',
        share: 0.5,
        programs: [
          {
            name: '지역 특화 발전',
            share: 0.6,
            unitProjects: [
              {
                name: '지역혁신체계 구축',
                share: 0.5,
                detailProjects: ['지역혁신클러스터', '지역SW산업 육성'],
              },
              {
                name: '균형발전 프로젝트',
                share: 0.5,
                detailProjects: ['혁신도시 조성', '기업도시 개발'],
              },
            ],
          },
          {
            name: '농어촌 지역 개발',
            share: 0.4,
            unitProjects: [
              {
                name: '농촌중심지 활성화',
                share: 0.5,
                detailProjects: ['농촌중심지 활성화', '기초생활거점 육성'],
              },
              {
                name: '섬 지역 지원',
                share: 0.5,
                detailProjects: ['도서종합개발', '낙도 생활 지원'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    code: '180',
    name: 'R&D',
    amount2024: 30_000_000,
    ministries: ['과학기술정보통신부', '산업통상자원부', '국방부', '교육부'],
    sectors: [
      {
        code: '181',
        name: '기초·원천연구',
        share: 0.35,
        programs: [
          {
            name: '기초연구 지원',
            share: 0.6,
            unitProjects: [
              {
                name: '기초과학 지원',
                share: 0.5,
                detailProjects: ['개인 기초연구', '집단 기초연구', 'IBS 연구'],
              },
              {
                name: '원천기술 연구',
                share: 0.5,
                detailProjects: ['원천기술 확보', '선도연구 지원'],
              },
            ],
          },
          {
            name: '글로벌 연구 협력',
            share: 0.4,
            unitProjects: [
              {
                name: '국제 공동연구',
                share: 0.6,
                detailProjects: ['글로벌연구실', '해외우수연구기관 유치'],
              },
              {
                name: '연구자 해외 파견',
                share: 0.4,
                detailProjects: ['박사후연구원 지원', '해외연수'],
              },
            ],
          },
        ],
      },
      {
        code: '182',
        name: '응용·개발연구',
        share: 0.4,
        programs: [
          {
            name: '산업기술 개발',
            share: 0.6,
            unitProjects: [
              {
                name: '반도체·디스플레이',
                share: 0.35,
                detailProjects: ['반도체 공정 개발', 'OLED 기술', '차세대 메모리'],
              },
              {
                name: '배터리·이차전지',
                share: 0.3,
                detailProjects: ['전고체 배터리', '배터리 재활용'],
              },
              {
                name: 'AI·소프트웨어',
                share: 0.35,
                detailProjects: ['AI 핵심기술', '클라우드 인프라', '빅데이터 분석'],
              },
            ],
          },
          {
            name: '바이오·헬스 R&D',
            share: 0.4,
            unitProjects: [
              {
                name: '신약 개발',
                share: 0.5,
                detailProjects: ['항암제 개발', '희귀질환 치료제'],
              },
              {
                name: '의료기기 혁신',
                share: 0.5,
                detailProjects: ['디지털 치료기기', 'AI 진단기기'],
              },
            ],
          },
        ],
      },
      {
        code: '183',
        name: '국방 R&D',
        share: 0.25,
        programs: [
          {
            name: '핵심기술 연구',
            share: 0.5,
            unitProjects: [
              {
                name: '무기체계 개발',
                share: 0.6,
                detailProjects: ['지능형 무기체계', '극초음속 기술', '드론봇 전투체계'],
              },
              {
                name: '국방 사이버보안',
                share: 0.4,
                detailProjects: ['사이버방어 기술', '보안 AI'],
              },
            ],
          },
          {
            name: '민군협력 기술',
            share: 0.5,
            unitProjects: [
              {
                name: '민군 겸용기술',
                share: 0.6,
                detailProjects: ['항공우주 기술', '해양기술'],
              },
              {
                name: '방산 수출 지원',
                share: 0.4,
                detailProjects: ['방산수출 기술협력', '해외 방산 마케팅'],
              },
            ],
          },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Account types
// ---------------------------------------------------------------------------

const ACCOUNT_TYPES: Array<'일반회계' | '특별회계' | '기금'> = ['일반회계', '특별회계', '기금'];
const BUDGET_TYPES = ['예산', '기금'];

function pickAccountType(domainCode: string, detailIdx: number): '일반회계' | '특별회계' | '기금' {
  // Deterministic account type based on domain and detail index
  if (domainCode === '010' || domainCode === '140') return detailIdx % 3 === 0 ? '기금' : '일반회계';
  if (domainCode === '050') return detailIdx % 7 === 0 ? '특별회계' : '일반회계';
  return detailIdx % 5 === 0 ? '특별회계' : '일반회계';
}

// ---------------------------------------------------------------------------
// CSV row generator
// ---------------------------------------------------------------------------

interface CsvRow {
  회계연도: number;
  부처명: string;
  회계명: string;
  분야명: string;
  분야코드: string;
  부문명: string;
  부문코드: string;
  프로그램명: string;
  단위사업명: string;
  세부사업명: string;
  예산구분: string;
  예산액: number;
}

function generateRows(year: number): CsvRow[] {
  const rows: CsvRow[] = [];
  // Variation factor per year (base: 2024 ≈ 656.9조원)
  // 실제 한국 정부 총지출: 2023 ~639조, 2024 ~657조, 2025 ~673조, 2026(안) 728조
  const yearFactors: Record<number, number> = {
    2023: 0.973,
    2024: 1.0,
    2025: 1.030,
    2026: 1.110,
  };
  // 2026년 분야별 차등 성장률 반영 (실제 예산안 기반)
  // 국방: 65.8조 (7.5%↑), R&D: 35.3조 (19.3%↑)
  const domainYearOverrides: Record<string, Record<number, number>> = {
    'R&D': { 2025: 0.987, 2026: 1.177 },
    '국방': { 2025: 1.037, 2026: 1.115 },
  };
  const yearFactor = yearFactors[year] ?? 1.0;

  let programIdx = 0;
  for (const domain of DOMAINS) {
    const domainFactor = domainYearOverrides[domain.name]?.[year] ?? yearFactor;
    const domainTotal = Math.round(domain.amount2024 * domainFactor);

    for (const sector of domain.sectors) {
      const sectorTotal = Math.round(domainTotal * sector.share);

      for (const program of sector.programs) {
        const programTotal = Math.round(sectorTotal * program.share);

        // Deterministic ministry assignment based on program index (consistent across years)
        const progMinistry = domain.ministries[programIdx % domain.ministries.length];
        programIdx++;

        for (const unit of program.unitProjects) {
          const unitTotal = Math.round(programTotal * unit.share);
          const detailCount = unit.detailProjects.length;

          // Allocate detail amounts that properly sum to unitTotal
          const weights: number[] = [];
          for (let i = 0; i < detailCount; i++) {
            weights.push(0.5 + Math.random() * 1.0);
          }
          const totalWeight = weights.reduce((s, w) => s + w, 0);

          let remaining = unitTotal;
          unit.detailProjects.forEach((detail, idx) => {
            const isLast = idx === detailCount - 1;
            const detailAmount = isLast
              ? remaining
              : Math.round(unitTotal * weights[idx] / totalWeight);
            remaining -= detailAmount;

            const accountType = pickAccountType(domain.code, idx);
            const accountTypeName = accountType === '일반회계' ? '일반회계'
              : accountType === '특별회계' ? `${domain.name.split('·')[0]} 특별회계`
              : `${domain.name.split('·')[0]} 기금`;

            rows.push({
              회계연도: year,
              부처명: progMinistry,
              회계명: accountTypeName,
              분야명: domain.name,
              분야코드: domain.code,
              부문명: sector.name,
              부문코드: sector.code,
              프로그램명: program.name,
              단위사업명: unit.name,
              세부사업명: detail,
              예산구분: BUDGET_TYPES[idx % 5 === 0 ? 1 : 0],
              예산액: Math.max(100, detailAmount),
            });
          });
        }
      }
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// CSV serializer
// ---------------------------------------------------------------------------

function rowsToCsv(rows: CsvRow[]): string {
  const headers: (keyof CsvRow)[] = [
    '회계연도', '부처명', '회계명', '분야명', '분야코드',
    '부문명', '부문코드', '프로그램명', '단위사업명', '세부사업명',
    '예산구분', '예산액',
  ];

  const lines: string[] = [headers.join(',')];

  for (const row of rows) {
    const values = headers.map((h) => {
      const val = row[h];
      const str = String(val);
      // Quote if contains comma or quote
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    });
    lines.push(values.join(','));
  }

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  const outDir = path.resolve(process.cwd(), 'data', 'raw');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const years = [2023, 2024, 2025, 2026];

  for (const year of years) {
    const rows = generateRows(year);
    const csv = rowsToCsv(rows);
    const outPath = path.join(outDir, `budget-${year}.csv`);
    fs.writeFileSync(outPath, '\uFEFF' + csv, 'utf-8');  // Write with UTF-8 BOM

    const total = rows.reduce((s, r) => s + r.예산액, 0);
    console.log(
      `[generate] ${year}: ${rows.length} rows, total = ${(total / 1_000_000).toFixed(1)}조원 → ${outPath}`
    );
  }
}

main();
