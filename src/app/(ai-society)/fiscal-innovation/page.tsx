'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AISidebar } from '@/components/layout/AISidebar';
import { InterestBurdenSimulator } from '@/components/fiscal-innovation/InterestBurdenSimulator';
import { PublicCreditSimulator } from '@/components/fiscal-innovation/PublicCreditSimulator';
import { LocalCurrencySimulator } from '@/components/fiscal-innovation/LocalCurrencySimulator';
import { TaxVsLendingComparator } from '@/components/fiscal-innovation/TaxVsLendingComparator';
import { IntegratedScenarioSimulator } from '@/components/fiscal-innovation/IntegratedScenarioSimulator';
import { EarlyWarningSection } from '@/components/fiscal-watch/EarlyWarningSection';
import { CaseArchiveSection } from '@/components/fiscal-watch/CaseArchiveSection';

type TabKey = 'interest' | 'credit' | 'currency' | 'taxCompare' | 'integrated' | 'watch' | 'cases';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'interest', label: '이자부담', color: 'text-cyan-400' },
  { key: 'credit', label: '공공신용', color: 'text-emerald-400' },
  { key: 'currency', label: '지역화폐', color: 'text-purple-400' },
  { key: 'taxCompare', label: '재산세비교', color: 'text-amber-400' },
  { key: 'integrated', label: '통합시나리오', color: 'text-rose-400' },
  { key: 'watch', label: '조기경보', color: 'text-red-400' },
  { key: 'cases', label: '사례 아카이브', color: 'text-orange-400' },
];

const DEFAULT_TAB: TabKey = 'interest';

function isTabKey(value: string | null): value is TabKey {
  return TABS.some((tab) => tab.key === value);
}

const AI_SIDEBAR_SECTIONS = [
  { id: 'title', label: '개요' },
  { id: 'tabs', label: '탭 선택' },
  { id: 'content', label: '탭 내용' },
];

function TitleBlock() {
  return (
    <div id="title" className="border border-gray-800 px-4 py-3">
      <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-200">
        재정혁신 시뮬레이터
      </h1>
      <p className="text-sm text-gray-500 mt-1">재정 혁신 정책 시뮬레이션과 지방재정 감시 자료</p>
    </div>
  );
}

/** 탭 줄. `onSelect`가 없으면(프리렌더 fallback) 버튼을 눌러도 아무 일이 없도록 비활성으로 둔다 */
function TabBar({ activeTab, onSelect }: { activeTab: TabKey; onSelect?: (key: TabKey) => void }) {
  return (
    <div id="tabs" className="flex items-center gap-1 overflow-x-auto border border-gray-800 p-1.5">
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          disabled={!onSelect}
          onClick={onSelect ? () => onSelect(tab.key) : undefined}
          className={`px-4 py-2 text-sm font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === tab.key
              ? `${tab.color} bg-gray-800/60 font-semibold`
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AISidebar title="재정혁신" sections={AI_SIDEBAR_SECTIONS} />
      <main className="flex-1 min-w-0">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

function FiscalInnovationTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const urlTab: TabKey = isTabKey(tabParam) ? tabParam : DEFAULT_TAB;
  const [activeTab, setActiveTab] = useState<TabKey>(urlTab);

  // 사이드바 하위 링크 등으로 쿼리가 바뀌면 탭도 따라간다
  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

  const selectTab = (key: TabKey) => {
    setActiveTab(key);
    router.replace(`?tab=${key}`, { scroll: false });
  };

  return (
    <PageShell>
      <TitleBlock />
      <TabBar activeTab={activeTab} onSelect={selectTab} />

      {/* Content */}
      <div id="content">
        {activeTab === 'interest' && <InterestBurdenSimulator />}
        {activeTab === 'credit' && <PublicCreditSimulator />}
        {activeTab === 'currency' && <LocalCurrencySimulator />}
        {activeTab === 'taxCompare' && <TaxVsLendingComparator />}
        {activeTab === 'integrated' && <IntegratedScenarioSimulator />}
        {activeTab === 'watch' && <EarlyWarningSection />}
        {activeTab === 'cases' && <CaseArchiveSection />}
      </div>
    </PageShell>
  );
}

/**
 * 프리렌더용 뼈대. `useSearchParams` 때문에 탭 본문은 정적 HTML에 들어가지 못하지만,
 * 제목과 탭 줄까지 빈 화면으로 두면 검색엔진과 자바스크립트 없는 환경에서 이 페이지가 사라진다.
 */
function FiscalInnovationFallback() {
  return (
    <PageShell>
      <TitleBlock />
      <TabBar activeTab={DEFAULT_TAB} />
      <div id="content" />
    </PageShell>
  );
}

export default function FiscalInnovationPage() {
  // useSearchParams는 Suspense 경계 안에서만 프리렌더된다
  return (
    <Suspense fallback={<FiscalInnovationFallback />}>
      <FiscalInnovationTabs />
    </Suspense>
  );
}
