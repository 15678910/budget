'use client';

import { useState } from 'react';
import { EducationBudgetDashboard } from './EducationBudgetDashboard';
import { EducationDistrictExplorer } from './EducationDistrictExplorer';

type Tab = 'metro' | 'district';

export function EducationBudgetView() {
  const [tab, setTab] = useState<Tab>('metro');

  return (
    <div className="space-y-5">
      <div className="flex gap-2 border-b border-gray-800">
        <button
          onClick={() => setTab('metro')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'metro'
              ? 'border-blue-500 text-blue-300'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          시도교육청 (17)
        </button>
        <button
          onClick={() => setTab('district')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === 'district'
              ? 'border-blue-500 text-blue-300'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          교육지원청·학교 (183 · 8,661)
        </button>
      </div>

      {tab === 'metro' ? <EducationBudgetDashboard /> : <EducationDistrictExplorer />}
    </div>
  );
}
