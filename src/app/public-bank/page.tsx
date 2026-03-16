'use client';

import { useState, useMemo } from 'react';
import { getMetroFiscalData, getDistrictFiscalData, getMetroNames } from '@/lib/data/fiscal-health-data';
import { EstablishmentRoadmapSimulator } from '@/components/fiscal-innovation/EstablishmentRoadmapSimulator';
import { CapitalMixOptimizer } from '@/components/fiscal-innovation/CapitalMixOptimizer';
import { LegalFrameworkGuide } from '@/components/fiscal-innovation/LegalFrameworkGuide';
import { VirtuousCycleSimulator } from '@/components/fiscal-innovation/VirtuousCycleSimulator';
import { PublicBankFAQ } from '@/components/fiscal-innovation/PublicBankFAQ';
import { PublicHousingSimulator } from '@/components/fiscal-innovation/PublicHousingSimulator';
import { RegionalRevitalizationSimulator } from '@/components/fiscal-innovation/RegionalRevitalizationSimulator';
import { CurrencyRevolutionSimulator } from '@/components/fiscal-innovation/CurrencyRevolutionSimulator';
import { ApartmentTaxRevenueSimulator } from '@/components/fiscal-innovation/ApartmentTaxRevenueSimulator';

type TabKey = 'roadmap' | 'capital' | 'legal' | 'cycle' | 'housing' | 'regional' | 'currency' | 'apartment-tax' | 'faq';

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: 'roadmap', label: '설립로드맵', color: 'text-cyan-400' },
  { key: 'capital', label: '자본조달', color: 'text-emerald-400' },
  { key: 'cycle', label: 'AI선순환', color: 'text-rose-400' },
  { key: 'housing', label: '공공주택', color: 'text-blue-400' },
  { key: 'regional', label: '지역활성화', color: 'text-orange-400' },
  { key: 'currency', label: '화폐혁명', color: 'text-yellow-400' },
  { key: 'apartment-tax', label: '건설세수', color: 'text-lime-400' },
  { key: 'legal', label: '법률프레임', color: 'text-purple-400' },
  { key: 'faq', label: '질의응답', color: 'text-amber-400' },
];

export default function PublicBankPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('roadmap');

  // Shared region selection state
  const [regionTab, setRegionTab] = useState<'metro' | 'district'>('metro');
  const allMetros = useMemo(() => getMetroFiscalData(), []);
  const metroNames = useMemo(
    () => getMetroNames().sort((a, b) => a.localeCompare(b, 'ko')),
    [],
  );
  const [selectedMetroName, setSelectedMetroName] = useState('서울특별시');

  const districts = useMemo(
    () => getDistrictFiscalData(selectedMetroName).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    [selectedMetroName],
  );
  const [selectedDistrictName, setSelectedDistrictName] = useState('');

  const handleMetroChange = (name: string) => {
    setSelectedMetroName(name);
    const newDistricts = getDistrictFiscalData(name);
    setSelectedDistrictName(newDistricts[0]?.name ?? '');
  };

  const handleRegionTabChange = (t: 'metro' | 'district') => {
    setRegionTab(t);
    if (t === 'district' && districts.length > 0 && !selectedDistrictName) {
      setSelectedDistrictName(districts[0].name);
    }
  };

  // Which tabs hide the region selector (only non-region tabs)
  const NO_REGION_TABS: TabKey[] = ['legal', 'faq'];
  const showRegionSelector = !NO_REGION_TABS.includes(activeTab);

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

        {/* Shared Region Selector */}
        {showRegionSelector && (
          <div className="border border-gray-800 p-4 md:p-5">
            <div className="flex items-center gap-4 overflow-x-auto">
              <div className="text-sm md:text-base font-semibold uppercase tracking-widest text-teal-400 shrink-0">
                지역 선택
              </div>

              {/* Tab buttons */}
              <div className="flex rounded overflow-hidden border border-gray-700 shrink-0">
                <button
                  className={`px-4 py-2 text-base font-medium transition-colors ${regionTab === 'metro' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
                  onClick={() => handleRegionTabChange('metro')}
                >
                  광역시도
                </button>
                <button
                  className={`px-4 py-2 text-base font-medium transition-colors ${regionTab === 'district' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
                  onClick={() => handleRegionTabChange('district')}
                >
                  시군구
                </button>
              </div>

              {/* Dropdowns */}
              <select
                className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
                value={selectedMetroName}
                onChange={(e) => handleMetroChange(e.target.value)}
              >
                {metroNames.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>

              {regionTab === 'district' && (
                <select
                  className="bg-gray-800 border border-gray-700 text-gray-200 rounded px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0"
                  value={selectedDistrictName}
                  onChange={(e) => setSelectedDistrictName(e.target.value)}
                >
                  {districts.length === 0 ? (
                    <option value="">데이터 없음</option>
                  ) : (
                    districts.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))
                  )}
                </select>
              )}

              {regionTab === 'district' && districts.length === 0 && (
                <p className="text-sm text-amber-400/70 shrink-0">
                  해당 광역시도의 시군구 데이터가 없습니다.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === 'roadmap' && <EstablishmentRoadmapSimulator regionTab={regionTab} selectedMetroName={selectedMetroName} selectedDistrictName={selectedDistrictName} />}
        {activeTab === 'capital' && <CapitalMixOptimizer regionTab={regionTab} selectedMetroName={selectedMetroName} selectedDistrictName={selectedDistrictName} />}
        {activeTab === 'cycle' && <VirtuousCycleSimulator regionTab={regionTab} selectedMetroName={selectedMetroName} selectedDistrictName={selectedDistrictName} />}
        {activeTab === 'housing' && <PublicHousingSimulator regionTab={regionTab} selectedMetroName={selectedMetroName} selectedDistrictName={selectedDistrictName} />}
        {activeTab === 'regional' && <RegionalRevitalizationSimulator regionTab={regionTab} selectedMetroName={selectedMetroName} selectedDistrictName={selectedDistrictName} />}
        {activeTab === 'currency' && <CurrencyRevolutionSimulator regionTab={regionTab} selectedMetroName={selectedMetroName} selectedDistrictName={selectedDistrictName} />}
        {activeTab === 'apartment-tax' && <ApartmentTaxRevenueSimulator regionTab={regionTab} selectedMetroName={selectedMetroName} selectedDistrictName={selectedDistrictName} />}
        {activeTab === 'legal' && <LegalFrameworkGuide />}
        {activeTab === 'faq' && <PublicBankFAQ />}
      </div>
    </div>
  );
}
