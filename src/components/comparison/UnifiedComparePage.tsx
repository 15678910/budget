'use client';

import { useState } from 'react';
import { ComparePage } from '@/components/comparison/ComparePage';
import { RegionalCompareDashboard } from '@/components/regional/RegionalCompareDashboard';
import type { BudgetTreeNode, DatasetMetadata } from '@/types/budget';

type CompareTab = 'yearly' | 'regional';

interface UnifiedComparePageProps {
  // For ComparePage (yearly)
  domainDataByYear: Record<number, BudgetTreeNode>;
  metadata: DatasetMetadata;
  defaultYearA: number;
  defaultYearB: number;
  // Shared
  metroDataByYear: Record<number, BudgetTreeNode>;
  districtDataByYear: Record<number, BudgetTreeNode>;
  educationDataByYear: Record<number, BudgetTreeNode>;
  // For RegionalCompareDashboard
  availableYears: number[];
  defaultYear: number;
}

export function UnifiedComparePage(props: UnifiedComparePageProps) {
  const [tab, setTab] = useState<CompareTab>('yearly');

  return (
    <div className="w-full">
      {/* Tab switcher */}
      <div className="flex items-center gap-2 pb-2">
        <button
          onClick={() => setTab('yearly')}
          className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
            tab === 'yearly'
              ? 'bg-blue-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          연도별 비교
        </button>
        <button
          onClick={() => setTab('regional')}
          className={`px-4 py-2 rounded-lg text-base font-medium transition-colors ${
            tab === 'regional'
              ? 'bg-blue-600 text-white'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          지역별 비교
        </button>
      </div>

      {/* Content */}
      {tab === 'yearly' && (
        <ComparePage
          domainDataByYear={props.domainDataByYear}
          metroDataByYear={props.metroDataByYear}
          districtDataByYear={props.districtDataByYear}
          educationDataByYear={props.educationDataByYear}
          metadata={props.metadata}
          defaultYearA={props.defaultYearA}
          defaultYearB={props.defaultYearB}
        />
      )}

      {tab === 'regional' && (
        <RegionalCompareDashboard
          metroDataByYear={props.metroDataByYear}
          districtDataByYear={props.districtDataByYear}
          educationDataByYear={props.educationDataByYear}
          availableYears={props.availableYears}
          defaultYear={props.defaultYear}
        />
      )}
    </div>
  );
}
