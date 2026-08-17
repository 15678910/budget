'use client';

import { PRESETS } from '@/lib/datacenter/scenarios';

interface ScenarioPickerProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

/**
 * 보고서 재현 프리셋과 리스크 반영 프리셋을 나란히 놓는다.
 * 어느 쪽이 옳다고 표시하지 않는다 — 차이를 보여주는 것이 목적이다.
 */
export function ScenarioPicker({ selectedId, onSelect }: ScenarioPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PRESETS.map((preset) => {
        const active = preset.id === selectedId;
        return (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            aria-pressed={active}
            className={`rounded-lg border p-3 text-left transition-colors ${
              active
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-border bg-muted/20 hover:bg-muted/50'
            }`}
          >
            <p className="text-sm font-semibold text-foreground">{preset.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {preset.description}
            </p>
          </button>
        );
      })}
    </div>
  );
}
