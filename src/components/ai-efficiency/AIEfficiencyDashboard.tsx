'use client';

import React, { useState, useRef } from 'react';
import { PDFExportButton } from '@/components/shared/PDFExportButton';
import { TaxAuditSimulator } from './TaxAuditSimulator';
import { ProcurementSimulator } from './ProcurementSimulator';
import { WelfareSimulator } from './WelfareSimulator';
import { HealthcareSimulator } from './HealthcareSimulator';
import { TransportSimulator } from './TransportSimulator';
import { EducationSimulator } from './EducationSimulator';
import { CourtSimulator } from './CourtSimulator';
import { DepartmentChatbot } from './DepartmentChatbot';
import { DataSources } from '@/components/shared/DataSources';

type DepartmentTab = 'nts' | 'pps' | 'mohw' | 'nhis' | 'molit' | 'moe' | 'court';

const TABS: { key: DepartmentTab; label: string; color: string }[] = [
  { key: 'nts', label: '국세청', color: 'text-blue-400' },
  { key: 'pps', label: '조달청', color: 'text-emerald-400' },
  { key: 'mohw', label: '복지부', color: 'text-rose-400' },
  { key: 'nhis', label: '건보공단', color: 'text-green-400' },
  { key: 'molit', label: '국토부', color: 'text-amber-400' },
  { key: 'moe', label: '교육부', color: 'text-violet-400' },
  { key: 'court', label: '법무부', color: 'text-sky-400' },
];

export function AIEfficiencyDashboard() {
  const [activeTab, setActiveTab] = useState<DepartmentTab>('nts');
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={contentRef} className="bg-background text-foreground w-full min-h-screen p-2 md:p-4 space-y-1">
      {/* Title Bar */}
      <div className="border border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-base md:text-lg font-bold tracking-[0.2em] uppercase text-muted-foreground">
          AI 효율화 분석
        </h1>
        <div className="flex items-center gap-2">
          <PDFExportButton targetRef={contentRef} filename="AI효율화" />
          <span className="text-sm md:text-base text-muted-foreground/60">
            부처별 AI 도입 효과 시뮬레이션
          </span>
        </div>
      </div>

      {/* Sub-tab Bar */}
      <div className="border border-border px-4 py-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm md:text-base rounded-md transition-colors font-medium ${
                activeTab === key
                  ? `bg-muted ${color} shadow-sm`
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Simulator */}
      {activeTab === 'nts' && <TaxAuditSimulator />}
      {activeTab === 'pps' && <ProcurementSimulator />}
      {activeTab === 'mohw' && <WelfareSimulator />}
      {activeTab === 'nhis' && <HealthcareSimulator />}
      {activeTab === 'molit' && <TransportSimulator />}
      {activeTab === 'moe' && <EducationSimulator />}
      {activeTab === 'court' && <CourtSimulator />}

      {/* Chatbot */}
      <DepartmentChatbot departmentId={activeTab} />

      {/* Footer */}
      <DataSources />
    </div>
  );
}
