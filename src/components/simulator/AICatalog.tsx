'use client';

import { useState, useMemo } from 'react';
import {
  AI_ACTIVITIES,
  SDG_GOALS,
  getUniqueDepartments,
  getUniqueActivityTypes,
  calculateTotalSavings,
  savingsToEfficiencyRate,
  getSDGColor,
  getSDGName,
  type AIActivity,
  type AIActivityType,
  type AIActivityStatus,
} from '@/lib/data/ai-activities-data';
import { DataDownload } from '@/components/shared/DataDownload';

// ─── Props ───

interface AICatalogProps {
  onApplyEfficiency: (rate: number) => void;
  currentEfficiencyRate: number;
  onScrollToParams?: () => void;
}

// ─── StatusBadge ───

function StatusBadge({ status }: { status: AIActivityStatus }) {
  const styles: Record<AIActivityStatus, string> = {
    '도입완료': 'bg-emerald-900/50 text-emerald-400 border-emerald-800',
    '시범운영': 'bg-blue-900/50 text-blue-400 border-blue-800',
    '확산중': 'bg-amber-900/50 text-amber-400 border-amber-800',
    '계획중': 'bg-gray-800/50 text-gray-400 border-gray-700',
  };

  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${styles[status]}`}>
      {status}
    </span>
  );
}

// ─── Main Component ───

export function AICatalog({ onApplyEfficiency, currentEfficiencyRate, onScrollToParams }: AICatalogProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterDept, setFilterDept] = useState<string>('전체');
  const [filterSDG, setFilterSDG] = useState<number>(0);
  const [filterType, setFilterType] = useState<string>('전체');

  // ─── Computed ───

  const departments = useMemo(() => getUniqueDepartments(), []);
  const activityTypes = useMemo(() => getUniqueActivityTypes(), []);

  const filteredActivities = useMemo(() => {
    return AI_ACTIVITIES.filter((a) => {
      if (filterDept !== '전체' && a.departmentShort !== filterDept) return false;
      if (filterSDG !== 0 && !a.sdgGoals.includes(filterSDG)) return false;
      if (filterType !== '전체' && a.activityType !== filterType) return false;
      return true;
    });
  }, [filterDept, filterSDG, filterType]);

  const totalSavings = useMemo(() => {
    return calculateTotalSavings([...selectedIds]);
  }, [selectedIds]);

  const efficiencyRate = useMemo(() => {
    return savingsToEfficiencyRate(totalSavings);
  }, [totalSavings]);

  // ─── Handlers ───

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ─── Download Data ───

  const downloadData = AI_ACTIVITIES.map((a) => ({
    부처: a.department,
    활동명: a.title,
    설명: a.description,
    '절감액(조원)': a.annualSavings,
    SDG: a.sdgGoals.join(', '),
    활동유형: a.activityType,
    상태: a.status,
  }));

  // ─── Render ───

  return (
    <div className="border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-200">
              공공부문 AI 활동 카탈로그{' '}
              <span className="text-gray-600 text-sm font-normal">
                GOVERNMENT AI INITIATIVES
              </span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              부처별 AI 도입 현황 및 예상 절감 효과 · 카드를 클릭하여 선택
            </p>
          </div>
          <DataDownload data={downloadData} filename="ai-activities-catalog" />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-gray-800 flex flex-wrap gap-2 items-center">
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1"
        >
          <option value="전체">부처 전체</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        <select
          value={filterSDG}
          onChange={(e) => setFilterSDG(Number(e.target.value))}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1"
        >
          <option value={0}>SDG 전체</option>
          {SDG_GOALS.map((sdg) => (
            <option key={sdg.number} value={sdg.number}>
              SDG {sdg.number}: {sdg.name}
            </option>
          ))}
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-gray-900 border border-gray-700 text-gray-300 text-sm rounded px-2 py-1"
        >
          <option value="전체">유형 전체</option>
          {activityTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Card Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredActivities.map((activity) => {
            const isSelected = selectedIds.has(activity.id);
            return (
              <div
                key={activity.id}
                onClick={() => toggleSelection(activity.id)}
                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500/50 bg-blue-950/20'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {/* Top: dept + status badge */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">
                    {activity.departmentShort}
                  </span>
                  <StatusBadge status={activity.status} />
                </div>

                {/* Title */}
                <h4 className="text-sm font-bold text-gray-200 mb-1">
                  {activity.title}
                </h4>

                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  {activity.description}
                </p>

                {/* Bottom row: savings + SDG pills */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-mono font-bold text-cyan-400">
                    {activity.annualSavings}조원
                  </span>
                  <div className="flex items-center gap-1">
                    {activity.sdgGoals.map((sdg) => (
                      <span
                        key={sdg}
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[10px] font-bold"
                        style={{ backgroundColor: getSDGColor(sdg) }}
                        title={`SDG ${sdg}: ${getSDGName(sdg)}`}
                      >
                        {sdg}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Activity type */}
                <div className="mt-1.5">
                  <span className="text-[10px] text-gray-600 border border-gray-800 rounded px-1.5 py-0.5">
                    {activity.activityType}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Bar */}
      <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/50">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-400">
              선택:{' '}
              <span className="text-blue-400 font-bold">{selectedIds.size}개</span>
            </span>
            <span className="text-gray-400">
              총 절감:{' '}
              <span className="text-cyan-400 font-bold">
                {totalSavings.toFixed(1)}조원
              </span>
            </span>
            <span className="text-gray-400">
              효율화율:{' '}
              <span className="text-amber-400 font-bold">
                {efficiencyRate.toFixed(2)}%
              </span>
            </span>
          </div>
          <button
            onClick={() => { onApplyEfficiency(efficiencyRate); onScrollToParams?.(); }}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-bold rounded transition-colors"
          >
            시뮬레이터에 반영하기
          </button>
        </div>
      </div>
    </div>
  );
}
