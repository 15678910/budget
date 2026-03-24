'use client';

import { useState } from 'react';
import { AISidebar } from '@/components/layout/AISidebar';
import { InterestBurdenSimulator } from '@/components/fiscal-innovation/InterestBurdenSimulator';
import { PublicCreditSimulator } from '@/components/fiscal-innovation/PublicCreditSimulator';
import { LocalCurrencySimulator } from '@/components/fiscal-innovation/LocalCurrencySimulator';
import { TaxVsLendingComparator } from '@/components/fiscal-innovation/TaxVsLendingComparator';
import { IntegratedScenarioSimulator } from '@/components/fiscal-innovation/IntegratedScenarioSimulator';

type TabKey = 'interest' | 'credit' | 'currency' | 'taxCompare' | 'integrated';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'interest', label: '이자부담', color: 'text-cyan-400' },
  { key: 'credit', label: '공공신용', color: 'text-emerald-400' },
  { key: 'currency', label: '지역화폐', color: 'text-purple-400' },
  { key: 'taxCompare', label: '재산세비교', color: 'text-amber-400' },
  { key: 'integrated', label: '통합시나리오', color: 'text-rose-400' },
];

export default function FiscalInnovationPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('interest');

  return (
    <div className="flex min-h-screen">
      <AISidebar />
      <main className="flex-1 min-w-0">
      <div className="w-full max-w-7xl mx-auto">
      <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
        {/* Title */}
        <div className="border border-gray-800 px-4 py-3">
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-200">
            재정혁신 시뮬레이터
          </h1>
          <p className="text-sm text-gray-500 mt-1">자치구 재정 혁신 정책의 효과를 시뮬레이션합니다</p>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 overflow-x-auto border border-gray-800 p-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

        {/* Content */}
        {activeTab === 'interest' && <InterestBurdenSimulator />}
        {activeTab === 'credit' && <PublicCreditSimulator />}
        {activeTab === 'currency' && <LocalCurrencySimulator />}
        {activeTab === 'taxCompare' && <TaxVsLendingComparator />}
        {activeTab === 'integrated' && <IntegratedScenarioSimulator />}
      </div>
      </div>
      </main>
    </div>
  );
}
