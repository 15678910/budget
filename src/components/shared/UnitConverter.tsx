"use client";

import { useState } from 'react';
import { BUDGET_UNITS, type BudgetUnit } from '@/lib/utils/units';
import { cn } from '@/lib/utils/format';

interface UnitConverterProps {
  selectedUnit: BudgetUnit | null;
  onSelectUnit: (unit: BudgetUnit | null) => void;
}

export function UnitConverter({ selectedUnit, onSelectUnit }: UnitConverterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [customCounter, setCustomCounter] = useState('');

  const handleSelect = (unit: BudgetUnit | null) => {
    onSelectUnit(unit);
    setIsOpen(false);
  };

  const handleCustomSubmit = () => {
    const price = Number(customPrice);
    if (!customName || !price || price <= 0 || !customCounter) return;
    const customUnit: BudgetUnit = {
      id: 'custom',
      name: customName,
      price,
      counter: customCounter,
    };
    onSelectUnit(customUnit);
    setCustomMode(false);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'px-3 py-1.5 text-sm rounded-lg border transition-colors',
          selectedUnit
            ? 'bg-primary text-primary-foreground border-primary'
            : 'border-border bg-background text-muted-foreground hover:text-foreground'
        )}
      >
        {selectedUnit ? `${selectedUnit.emoji ?? ''} ${selectedUnit.name}`.trim() : '단위환산'}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setCustomMode(false); }} />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px] max-h-[320px] overflow-y-auto">
            {/* Clear option */}
            {selectedUnit && (
              <button
                onClick={() => handleSelect(null)}
                className="w-full text-left px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                단위 해제
              </button>
            )}

            {/* Preset units */}
            {BUDGET_UNITS.filter(u => u.id !== 'won').map(unit => (
              <button
                key={unit.id}
                onClick={() => handleSelect(unit)}
                className={cn(
                  'w-full text-left px-3 py-1.5 text-sm hover:bg-muted transition-colors',
                  selectedUnit?.id === unit.id ? 'bg-muted font-medium' : ''
                )}
              >
                {unit.emoji && <span className="mr-1.5">{unit.emoji}</span>}
                {unit.name}
                <span className="text-muted-foreground ml-1">({unit.price.toLocaleString('ko-KR')}원)</span>
              </button>
            ))}

            {/* Separator */}
            <div className="border-t border-border my-1" />

            {/* Custom unit */}
            {!customMode ? (
              <button
                onClick={() => setCustomMode(true)}
                className="w-full text-left px-3 py-1.5 text-sm text-primary hover:bg-muted transition-colors"
              >
                + 사용자 정의 단위
              </button>
            ) : (
              <div className="px-3 py-2 space-y-2">
                <input
                  type="text"
                  placeholder="단위명 (예: 금반지)"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                />
                <input
                  type="text"
                  placeholder="양사 (예: 개)"
                  value={customCounter}
                  onChange={e => setCustomCounter(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                />
                <input
                  type="number"
                  placeholder="단가 (원)"
                  value={customPrice}
                  onChange={e => setCustomPrice(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-border rounded bg-background"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setCustomMode(false)}
                    className="flex-1 px-2 py-1 text-xs rounded border border-border hover:bg-muted"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleCustomSubmit}
                    className="flex-1 px-2 py-1 text-xs rounded bg-primary text-primary-foreground"
                  >
                    적용
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
