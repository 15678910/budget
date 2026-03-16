'use client';

import { useState } from 'react';
import { EstablishmentRoadmapSimulator } from '@/components/fiscal-innovation/EstablishmentRoadmapSimulator';
import { CapitalMixOptimizer } from '@/components/fiscal-innovation/CapitalMixOptimizer';
import { LegalFrameworkGuide } from '@/components/fiscal-innovation/LegalFrameworkGuide';
import { VirtuousCycleSimulator } from '@/components/fiscal-innovation/VirtuousCycleSimulator';
import { PublicBankFAQ } from '@/components/fiscal-innovation/PublicBankFAQ';
import { PublicHousingSimulator } from '@/components/fiscal-innovation/PublicHousingSimulator';
import { RegionalRevitalizationSimulator } from '@/components/fiscal-innovation/RegionalRevitalizationSimulator';
import { CurrencyRevolutionSimulator } from '@/components/fiscal-innovation/CurrencyRevolutionSimulator';

type TabKey = 'roadmap' | 'capital' | 'legal' | 'cycle' | 'housing' | 'regional' | 'currency' | 'faq';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'roadmap', label: '설립로드맵', color: 'text-cyan-400' },
  { key: 'capital', label: '자본조달', color: 'text-emerald-400' },
  { key: 'legal', label: '법률프레임', color: 'text-purple-400' },
  { key: 'cycle', label: 'AI선순환', color: 'text-rose-400' },
  { key: 'housing', label: '공공주택', color: 'text-blue-400' },
  { key: 'regional', label: '지역활성화', color: 'text-orange-400' },
  { key: 'currency', label: '화폐혁명', color: 'text-yellow-400' },
  { key: 'faq', label: '질의응답', color: 'text-amber-400' },
];

export default function PublicBankPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roadmap');

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-gray-950 text-gray-300 w-full min-h-screen p-2 md:p-4 space-y-1">
        {/* Title */}
        <div className="border border-gray-800 px-4 py-3">
          <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-gray-200">
            지역공공은행 시뮬레이터
          </h1>
          <p className="text-sm text-gray-500 mt-1">BND 모델 기반 지역공공은행 설립부터 AI기본사회까지의 경로를 시뮬레이션합니다</p>
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
        {activeTab === 'roadmap' && <EstablishmentRoadmapSimulator />}
        {activeTab === 'capital' && <CapitalMixOptimizer />}
        {activeTab === 'legal' && <LegalFrameworkGuide />}
        {activeTab === 'cycle' && <VirtuousCycleSimulator />}
        {activeTab === 'housing' && <PublicHousingSimulator />}
        {activeTab === 'regional' && <RegionalRevitalizationSimulator />}
        {activeTab === 'currency' && <CurrencyRevolutionSimulator />}
        {activeTab === 'faq' && <PublicBankFAQ />}
      </div>
    </div>
  );
}
