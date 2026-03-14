'use client';

import React, { useState, useMemo, useRef } from 'react';
import { PDFExportButton } from '@/components/shared/PDFExportButton';
import { DataSources } from '@/components/shared/DataSources';

// ============================================================
// Types
// ============================================================

interface QAData {
  id: number;
  category: string;
  question: string;
  answer: React.ReactNode;
}

type CategoryKey = 'all' | 'basic' | 'finance' | 'legal' | 'simulator' | 'resource';

interface CategoryInfo {
  key: CategoryKey;
  label: string;
  fullLabel: string;
  color: string;
}

// ============================================================
// Sub-components
// ============================================================

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div className={`col-span-full border border-gray-800 px-4 py-2 ${color}`}>
      <span className="text-sm md:text-base font-semibold uppercase tracking-widest">{title}</span>
    </div>
  );
}

function QAItem({ question, answer, color = 'text-gray-300' }: { question: string; answer: React.ReactNode; color?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-800 rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-900/50 transition-colors text-left"
      >
        <span className="text-cyan-400 font-bold text-lg leading-tight mt-0.5 shrink-0">Q</span>
        <span className={`text-base font-medium leading-relaxed ${color}`}>{question}</span>
        <span className="text-gray-500 text-lg leading-none ml-auto shrink-0">{open ? '\u2212' : '+'}</span>
      </button>
      {open && (
        <div className="px-4 py-4 border-t border-gray-800 bg-gray-950/50">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold text-lg leading-tight mt-0.5 shrink-0">A</span>
            <div className="text-base text-gray-400 leading-relaxed space-y-3">
              {answer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Constants
// ============================================================

const CATEGORIES: CategoryInfo[] = [
  { key: 'all', label: '전체', fullLabel: '전체', color: 'text-gray-300' },
  { key: 'basic', label: '기본개념', fullLabel: '공공은행 기본 개념', color: 'text-cyan-400' },
  { key: 'finance', label: '금융용어', fullLabel: '금융 용어 해설', color: 'text-emerald-400' },
  { key: 'legal', label: '법률제도', fullLabel: '한국 법률\u00B7제도', color: 'text-purple-400' },
  { key: 'simulator', label: '시뮬레이터', fullLabel: '시뮬레이터 해석 가이드', color: 'text-amber-400' },
  { key: 'resource', label: '지역자원', fullLabel: '지역자원과 자본조달', color: 'text-rose-400' },
];

const COMPARISON_ROWS = [
  { label: '소유', private: '민간 주주', public: '정부/시민' },
  { label: '목적', private: '주주 이익 극대화', public: '지역 경제 발전' },
  { label: '수익 배분', private: '주주 배당', public: '지역사회 환원' },
  { label: '예금 유출', private: '본사(서울) 집중', public: '지역 내 재순환' },
  { label: '대출 대상', private: '수익성 높은 고객', public: '소상공인\u00B7서민 포함' },
];

function buildQAData(): QAData[] {
  return [
    // ── Category 1: 공공은행 기본 개념 ──
    {
      id: 1,
      category: 'basic',
      question: 'BND(노스다코타 은행)가 무엇인가요?',
      answer: (
        <>
          <p>1919년 설립된 미국 유일의 주정부 소유 은행입니다. 핵심 특징:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>주정부의 모든 세금·수수료가 BND에 의무 예치됩니다</li>
            <li>시민에게 직접 대출하지 않고, 지역 소규모 은행의 대출에 50~80% 참여하는 &apos;도매은행&apos; 모델입니다</li>
            <li>경쟁이 아닌 협력: 지역 은행을 대체하지 않고 보완합니다</li>
            <li>2024년 기준 총자산 $108억(약 14.6조원), 순이익 $2억(약 2,700억원)</li>
            <li>2008년 금융위기 때 서브프라임 노출이 없어 미국에서 유일하게 흑자를 유지했습니다</li>
          </ul>
        </>
      ),
    },
    {
      id: 2,
      category: 'basic',
      question: '독일 Sparkassen(슈파카센)은 어떤 모델인가요?',
      answer: (
        <>
          <p>독일의 공공저축은행 시스템으로 세계에서 가장 발달한 공공은행 네트워크입니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>352개 은행이 각 지역에서 독립 운영 (2024년 기준)</li>
            <li>총자산 약 &euro;1.52조(약 220조원)</li>
            <li>&apos;지역원칙&apos;(Regionalprinzip): 수집한 예금은 반드시 해당 지역에 재대출</li>
            <li>수익은 주주에게 배당하지 않고 전액 내부 유보하여 자본 축적</li>
            <li>지자체가 &apos;신탁관리자(Tr&auml;ger)&apos;로서 감독하지만, 수익을 추출할 권리는 없음</li>
          </ul>
        </>
      ),
    },
    {
      id: 3,
      category: 'basic',
      question: '코스타리카 BPDC(국민은행)는 무엇인가요?',
      answer: (
        <>
          <p>세계에서 가장 민주적인 공공은행 모델입니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>자본 조달: 근로자 급여의 1% + 고용주 0.5% 자동 적립 → 영구적 자본화</li>
            <li>소유: 1년 이상 저축한 모든 근로자가 소유주 (120만명)</li>
            <li>290명 근로자 총회(50% 여성)가 이사 7명 중 4명 선출</li>
            <li>총자산 약 $54억(약 7.3조원), 부실채권 비율 2.6%</li>
          </ul>
        </>
      ),
    },
    {
      id: 18,
      category: 'basic',
      question: '기존 금융기관(시중은행, 신협 등)이 반발하면 어떻게 설득하나요?',
      answer: (
        <>
          <p>BND(노스다코타 은행)의 105년 성공 비결이 바로 이 문제의 해답입니다: <strong className="text-cyan-400">&quot;경쟁이 아닌 협력&quot;</strong></p>
          <p className="font-semibold text-gray-300 mt-2">공공은행이 하지 않는 것:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>시민에게 직접 대출하지 않음 → 기존 은행 고객 빼앗기 없음</li>
            <li>예금 유치 경쟁하지 않음 → 의무예치로 안정적 자금 확보</li>
            <li>지점 개설하지 않음 → 기존 은행 인프라 활용</li>
          </ul>
          <p className="font-semibold text-gray-300 mt-2">공공은행이 하는 것 (기존 은행을 강하게 만듦):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>지역은행 대출에 50~80% 참여 → 소규모 은행도 대형 대출 가능</li>
            <li>금리 보조 (최대 5%p 인하) → 지역은행의 경쟁력 향상</li>
            <li>기존 은행이 기피하는 소상공인·서민 대출 → 시장 보완</li>
          </ul>
          <p className="mt-2 text-emerald-400 font-semibold">결과: 노스다코타는 미국에서 인구 대비 지역은행 밀집도 1위입니다. 공공은행이 지역은행을 죽인 것이 아니라, 오히려 번성시켰습니다.</p>
          <p className="mt-2">한국 적용 시에도 &quot;도매은행&quot; 모델(기존 신협·새마을금고의 대출에 참여)로 설계하면, 기존 금융기관을 적이 아닌 동맹으로 만들 수 있습니다.</p>
        </>
      ),
    },
    {
      id: 4,
      category: 'basic',
      question: '공공은행과 일반 은행의 차이점은 무엇인가요?',
      answer: (
        <div className="grid grid-cols-3 gap-px bg-gray-800 rounded overflow-hidden text-sm">
          <div className="bg-gray-900 p-2 font-semibold text-gray-500">구분</div>
          <div className="bg-gray-900 p-2 font-semibold text-amber-400">일반 은행</div>
          <div className="bg-gray-900 p-2 font-semibold text-cyan-400">공공은행</div>
          {COMPARISON_ROWS.map((row) => (
            <React.Fragment key={row.label}>
              <div className="bg-gray-950 p-2 text-gray-500">{row.label}</div>
              <div className="bg-gray-950 p-2 text-gray-400">{row.private}</div>
              <div className="bg-gray-950 p-2 text-gray-300">{row.public}</div>
            </React.Fragment>
          ))}
        </div>
      ),
    },

    // ── Category 2: 금융 용어 해설 ──
    {
      id: 5,
      category: 'finance',
      question: 'ROE(자기자본이익률)가 무엇인가요?',
      answer: (
        <>
          <p>ROE = (순이익 / 자기자본) &times; 100</p>
          <p>&apos;내가 투자한 돈으로 얼마나 벌었나&apos;를 보여주는 핵심 수익성 지표입니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>5% 미만: 저조 (예금 이자 수준)</li>
            <li>5~10%: 보통 (일반 은행 평균)</li>
            <li>10~15%: 우수</li>
            <li>15%+: 매우 우수 (BND 15.8%)</li>
          </ul>
          <p className="text-gray-500 text-sm">
            시뮬레이터에서 ROE가 20%를 넘으면 매우 낙관적인 시나리오로,
            실제 운영 시 다양한 변수로 이보다 낮을 수 있습니다.
          </p>
        </>
      ),
    },
    {
      id: 6,
      category: 'finance',
      question: 'BIS 자본비율이 무엇인가요?',
      answer: (
        <>
          <p>국제결제은행(BIS)이 정한 은행의 최소 자기자본 비율입니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>기본 규정: 위험가중자산 대비 자기자본이 8% 이상이어야 함</li>
            <li>한국 기준: 통상 10~12% 유지 권고</li>
            <li>의미: 자본금이 1,000억원이면 최대 1조원까지 대출 가능 (레버리지 10배)</li>
          </ul>
          <p className="text-gray-500 text-sm">
            시뮬레이터에서 &apos;BIS 10%&apos;란 자본금의 10배까지 대출을 확장할 수 있다는 뜻입니다.
          </p>
        </>
      ),
    },
    {
      id: 7,
      category: 'finance',
      question: '의무예치란 무엇인가요?',
      answer: (
        <>
          <p>지방정부의 세금·수수료 수입을 공공은행에 의무적으로 예치하는 제도입니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>BND의 핵심 성공 요인: 노스다코타주 세수 100%가 BND에 의무 예치</li>
            <li>이를 통해 저비용의 안정적인 예금 기반($71억)을 확보</li>
            <li>일반 은행처럼 높은 이자를 주고 예금을 유치할 필요가 없어 대출 금리를 낮출 수 있음</li>
          </ul>
          <p className="text-gray-500 text-sm">
            한국에서는 현재 이런 의무예치 제도가 없으며, 특별법에 포함 필요
          </p>
        </>
      ),
    },
    {
      id: 8,
      category: 'finance',
      question: '재정자립도와 재정자주도의 차이는?',
      answer: (
        <>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>재정자립도 = (자체수입 / 총세입) &times; 100 → 자체 재원으로 얼마나 운영 가능한지</li>
            <li>재정자주도 = (자체수입 + 자주재원) / 총세입 &times; 100 → 교부세 포함한 자율 재원 비율</li>
          </ul>
          <p className="text-gray-500 text-sm">
            재정자립도가 낮은 자치구일수록 공공은행의 수익이 재정에 미치는 영향이 큽니다.
          </p>
        </>
      ),
    },

    // ── Category 2b: 금융 용어 해설 (추가) ──
    {
      id: 19,
      category: 'finance',
      question: '화폐 공유부와 시뇨리지란 무엇이고, 지자체에서 활용 가능한가요?',
      answer: (
        <>
          <p><strong className="text-gray-300">시뇨리지(Seigniorage)</strong>: 화폐를 발행하는 주체가 얻는 이익입니다. 화폐의 액면가와 제조비용의 차이로, 현재 한국은행이 독점하고 있습니다 (연간 약 2조원).</p>
          <p className="mt-2"><strong className="text-gray-300">화폐 공유부</strong>: 화폐는 공공재(공유부)이므로, 화폐 창출의 이익은 시민 모두에게 귀속되어야 한다는 주권화폐론의 개념입니다.</p>
          <p className="font-semibold text-gray-300 mt-3">지자체 수준에서의 활용:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-gray-300">1단계</strong> (현재 가능): 지역화폐 경제승수 효과의 세수환류분 = &quot;유사 시뇨리지&quot;</li>
            <li><strong className="text-gray-300">2단계</strong> (특별법 후): 공공은행의 신용창출 → 대출이자 수익</li>
            <li><strong className="text-gray-300">3단계</strong> (장기): 공공은행 기반 디지털 지역화폐 발행 → 직접적 지역 시뇨리지</li>
          </ul>
          <p className="mt-2">현재 지역화폐는 원화 1:1 교환이므로 진정한 시뇨리지는 없지만, 공공은행이 자체 신용으로 지역화폐를 발행하면 발행액과 비용의 차이가 지역 시뇨리지가 됩니다.</p>
        </>
      ),
    },

    // ── Category 3: 한국 법률·제도 ──
    {
      id: 9,
      category: 'legal',
      question: '한국에서 공공은행을 설립할 수 있나요?',
      answer: (
        <>
          <p>현행법상은 어렵지만 길이 열리고 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>현재 장벽: 은행법상 지자체 과반 지분 소유 불가, 지방재정법 제한</li>
            <li>돌파구: 2025년 1월 송재봉 의원이 「지역공공은행 설립 및 운영에 관한 특별법」 발의 (국회 계류중)</li>
            <li>핵심 내용: 지자체 51% 이상 지분 허용, 은행법 적용 면제, 시민 공동거버넌스</li>
            <li>파주시가 &apos;2-트랙&apos; 전략으로 가장 앞서 추진 중 (2026.3 연구 완료)</li>
          </ul>
        </>
      ),
    },
    {
      id: 10,
      category: 'legal',
      question: '자치구에 신용보증재단이 있나요?',
      answer: (
        <>
          <p>자치구(구) 단위에는 없고, 광역시·도 단위에 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>전국 16개 지역신용보증재단이 광역시·도별로 운영 (서울, 부산, 경기 등)</li>
            <li>중앙회: 신용보증재단중앙회(KOREG)가 총괄</li>
            <li>자치구 소상공인은 해당 광역시 재단을 통해 보증을 받습니다</li>
          </ul>
          <p className="text-gray-500 text-sm">
            따라서 시뮬레이터의 Phase 1은 &apos;자치구 독자 재단 설립&apos;이 아닌 &apos;광역 재단 협력 + 보증 확대&apos;로 이해해야 합니다.
          </p>
        </>
      ),
    },
    {
      id: 11,
      category: 'legal',
      question: '공공은행 설립에 필요한 조례는?',
      answer: (
        <>
          <p>최소 2개의 필수 조례가 필요합니다:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>필수: ① 공공은행 설립 조례 (준비 ~6개월), ② 의무예치 조례 (준비 ~12개월)</li>
            <li>선택: ③ 지역화폐 연계 조례, ④ 주민참여 기여금 조례, ⑤ 지역자원 수익화 조례</li>
            <li>특별법이 통과되어야 조례 제정의 법적 근거가 확보됩니다</li>
            <li>파주시는 특별법 제정 전에도 운영 가능한 &apos;공공금융기관(비은행)&apos; 모델을 병행 추진 중</li>
          </ul>
        </>
      ),
    },
    {
      id: 12,
      category: 'legal',
      question: '자치구 단독으로 공공은행을 만들 수 있나요?',
      answer: (
        <>
          <p>현실적으로 어렵습니다. 이유:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>자치구 예산(3,000~5,000억원)이 광역시(수조원)에 비해 작아 충분한 자본 확보 어려움</li>
            <li>재정자립도가 20~40%로 낮아 출자 여력 제한</li>
            <li>대안: 광역시 차원의 공공은행에 자치구가 공동 출자하는 모델이 현실적</li>
            <li>또는 여러 자치구가 연합하여 &apos;공동설립 공공은행&apos; 추진 (지방자치단체 조합 활용)</li>
          </ul>
        </>
      ),
    },

    {
      id: 20,
      category: 'legal',
      question: '개발환수이익금을 공공은행 자본으로 활용할 수 있나요?',
      answer: (
        <>
          <p>네, 법적 기반이 이미 존재합니다. 「개발이익 환수에 관한 법률」에 따라 공공개발로 발생한 지가 상승분의 일부를 개발부담금으로 환수하며, 이 중 50%가 지자체에 귀속됩니다.</p>
          <p className="font-semibold text-gray-300 mt-2">활용 경로:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>개발부담금 → 지역개발기금 적립 (현행 조례로 가능)</li>
            <li>기금 용도 조항에 &quot;지역공공금융기관 출자&quot; 추가 (조례 개정)</li>
            <li>적립된 기금 → 공공은행 초기 자본으로 전환</li>
          </ul>
          <p className="mt-2">창원시의 경우 지역개발기금 설치 조례가 이미 존재하므로, 기금 용도 조항 개정만으로 공공은행 출자의 법적 근거를 확보할 수 있습니다. 이는 특별법 통과 전에도 준비할 수 있는 현실적인 경로입니다.</p>
        </>
      ),
    },
    {
      id: 21,
      category: 'legal',
      question: '창원시 지역개발기금 조례를 공공은행에 어떻게 활용하나요?',
      answer: (
        <>
          <p>「창원시 지역개발기금 설치 조례」는 공공은행 자본 조달의 법적 통로가 될 수 있습니다.</p>
          <p className="font-semibold text-gray-300 mt-2">현행 조례 구조:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>기금 재원: 일반회계 전입금, 개발부담금, 이자수입, 차입금 등</li>
            <li>기금 용도: 지역개발사업, 인프라 구축, 소규모 융자</li>
          </ul>
          <p className="font-semibold text-gray-300 mt-2">개정 시 추가할 조항:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>기금 재원에 &quot;개발환수이익금의 별도 적립&quot; 및 &quot;지역화폐 경제효과 환류분&quot; 추가</li>
            <li>기금 용도에 &quot;지역공공금융기관 설립 및 출자&quot; 및 &quot;소상공인 공공대출 재원&quot; 추가</li>
          </ul>
          <p className="mt-2">이 방식의 장점은 특별법 통과 전에도 조례 개정만으로 기금을 적립할 수 있다는 점입니다. 파주시의 2-트랙 전략과 유사하게, 창원시도 특별법 제정 전에 기금 기반을 먼저 구축하는 것이 가능합니다.</p>
        </>
      ),
    },

    // ── Category 4: 시뮬레이터 해석 가이드 ──
    {
      id: 13,
      category: 'simulator',
      question: '시뮬레이터 결과를 어떻게 해석해야 하나요?',
      answer: (
        <>
          <p>시뮬레이터는 정책 효과의 &apos;방향과 크기&apos;를 보여주는 도구이지, 정확한 예측이 아닙니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>판정이 &apos;빠른 성장&apos;이라도 실제로는 정치적·법적 변수가 있습니다</li>
            <li>슬라이더를 극단값으로 놓으면 비현실적 결과가 나올 수 있습니다</li>
            <li>같은 지역에서 슬라이더를 조금씩 바꿔가며 &apos;민감도&apos;를 확인하는 것이 중요합니다</li>
            <li>여러 지역을 비교하면 어떤 자치단체가 공공은행에 더 적합한지 파악할 수 있습니다</li>
          </ul>
        </>
      ),
    },
    {
      id: 14,
      category: 'simulator',
      question: "AI기본사회 '30만원/월' 기준은 어디서 나왔나요?",
      answer: (
        <>
          <p>이 시뮬레이터의 분석용 기준선이며 공식 정책 수치가 아닙니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>2024년 기준 1인 가구 생계급여: 약 71만원/월</li>
            <li>30만원/월은 생계급여의 약 42%로, &apos;기본적 생활 보조&apos; 수준</li>
            <li>실제 AI기본사회의 기본소득 수준은 정치적·재정적 합의에 따라 달라집니다</li>
            <li>슬라이더를 통해 다른 목표 금액에 도달하는 경로도 탐색할 수 있습니다</li>
          </ul>
        </>
      ),
    },
    {
      id: 15,
      category: 'simulator',
      question: '30년 시뮬레이션에서 은행 자산이 수십조원까지 성장하는 것이 현실적인가요?',
      answer: (
        <>
          <p>복리 효과로 이론적으로는 가능하지만, 현실에서는 여러 제약이 있습니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>시뮬레이터는 은행자산 상한(지역 예산의 5배)을 적용하여 무한 성장을 제한합니다</li>
            <li>BND 실제 사례: 105년간 $200만 → $108억 (5,400배 성장)</li>
            <li>그러나 경기 변동, 부실채권, 규제 변화, 정치적 리스크 등은 반영하지 않습니다</li>
          </ul>
          <p className="text-gray-500 text-sm">
            낙관적 시나리오(상한)와 보수적 시나리오(슬라이더 낮춤)를 모두 탐색해보세요.
          </p>
        </>
      ),
    },

    // ── Category 5: 지역자원과 자본조달 ──
    {
      id: 16,
      category: 'resource',
      question: '지역자원 수익화란 구체적으로 무엇인가요?',
      answer: (
        <>
          <p>자치구가 보유한 공공 자산과 데이터를 금융 자본으로 전환하는 것입니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>공유재산: 공유 토지·건물의 임대 수익 또는 현물출자</li>
            <li>지역 데이터: 교통·환경·소비 데이터를 AI 학습용으로 라이선스</li>
            <li>재생에너지: 공공건물 태양광 발전 수익</li>
            <li>주차·교통: 공영주차장, 교통 수수료 수익의 일부를 은행에 예치</li>
            <li>관광·문화: 지역 축제, 문화시설 수익의 지역화폐 연계 수수료</li>
          </ul>
        </>
      ),
    },
    {
      id: 17,
      category: 'resource',
      question: '주민 기여(BPDC 모델)가 한국에서 가능한가요?',
      answer: (
        <>
          <p>직접적인 급여 공제 방식은 어렵지만, 변형된 형태는 가능합니다.</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>코스타리카 BPDC: 법률로 근로자 1% + 고용주 0.5% 의무 기여 (강제)</li>
            <li>한국 적용: 의무 기여는 법적으로 어려움 (재산권 침해 논란)</li>
            <li>대안 1: 자발적 주민 출자 (협동조합 방식)</li>
            <li>대안 2: 지역화폐 캐시백의 일부를 자동으로 공공은행 예치</li>
            <li>대안 3: 주민참여예산에서 공공은행 출자 의결</li>
          </ul>
        </>
      ),
    },
  ];
}

// ============================================================
// Main Component
// ============================================================

export function PublicBankFAQ() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  const qaData = useMemo(() => buildQAData(), []);

  const filteredData = useMemo(() => {
    let items = qaData;

    // Filter by category
    if (activeCategory !== 'all') {
      items = items.filter((item) => item.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      items = items.filter((item) => item.question.toLowerCase().includes(query));
    }

    return items;
  }, [qaData, activeCategory, searchQuery]);

  // Group filtered items by category for section headers
  const groupedData = useMemo(() => {
    const groups: { category: CategoryInfo; items: QAData[] }[] = [];
    const categoryOrder: CategoryKey[] = ['basic', 'finance', 'legal', 'simulator', 'resource'];

    for (const catKey of categoryOrder) {
      const catItems = filteredData.filter((item) => item.category === catKey);
      if (catItems.length > 0) {
        const catInfo = CATEGORIES.find((c) => c.key === catKey)!;
        groups.push({ category: catInfo, items: catItems });
      }
    }

    return groups;
  }, [filteredData]);

  return (
    <div ref={contentRef} className="space-y-6">
      {/* Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-100">공공은행 FAQ</h2>
          <p className="text-sm text-gray-500 mt-1">자주 묻는 질문</p>
        </div>
        <PDFExportButton targetRef={contentRef} filename="공공은행-FAQ" />
      </div>

      {/* Search input */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="질문 검색..."
          className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-300 placeholder-gray-600 w-full focus:border-cyan-500 focus:outline-none"
        />
      </div>

      {/* Category filter buttons */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                isActive
                  ? `${cat.color} bg-gray-800/60`
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Q&A content */}
      {groupedData.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className="space-y-4">
          {groupedData.map((group) => (
            <div key={group.category.key} className="space-y-2">
              <SectionHeader title={group.category.fullLabel} color={group.category.color} />
              {group.items.map((item) => (
                <QAItem
                  key={item.id}
                  question={item.question}
                  answer={item.answer}
                  color="text-gray-300"
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <DataSources />
    </div>
  );
}
