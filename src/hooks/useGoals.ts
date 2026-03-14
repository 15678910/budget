'use client';

import { useState, useCallback, useEffect } from 'react';
import type { UserGoalOverride } from '@/lib/data/local-sdg-data';

const STORAGE_KEY = 'narasalim-sdg-goals';

function loadGoals(): UserGoalOverride[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGoals(data: UserGoalOverride[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable
  }
}

export function useGoals() {
  const [goals, setGoals] = useState<UserGoalOverride[]>([]);

  useEffect(() => {
    setGoals(loadGoals());
  }, []);

  const setGoalTarget = useCallback((
    indicatorId: string,
    metroName: string,
    targetValue: number,
    districtName?: string
  ) => {
    setGoals(prev => {
      const filtered = prev.filter(g =>
        !(g.indicatorId === indicatorId &&
          g.metroName === metroName &&
          g.districtName === districtName)
      );
      const updated = [...filtered, {
        indicatorId,
        metroName,
        targetValue,
        districtName,
        updatedAt: new Date().toISOString(),
      }];
      saveGoals(updated);
      return updated;
    });
  }, []);

  const getEffectiveTarget = useCallback((
    indicatorId: string,
    metroName: string,
    defaultTarget: number,
    districtName?: string
  ): number => {
    const override = goals.find(g =>
      g.indicatorId === indicatorId &&
      g.metroName === metroName &&
      g.districtName === districtName
    );
    return override ? override.targetValue : defaultTarget;
  }, [goals]);

  const resetGoal = useCallback((
    indicatorId: string,
    metroName: string,
    districtName?: string
  ) => {
    setGoals(prev => {
      const filtered = prev.filter(g =>
        !(g.indicatorId === indicatorId &&
          g.metroName === metroName &&
          g.districtName === districtName)
      );
      saveGoals(filtered);
      return filtered;
    });
  }, []);

  const resetAllGoals = useCallback(() => {
    saveGoals([]);
    setGoals([]);
  }, []);

  const exportGoals = useCallback((): string => {
    return JSON.stringify(goals, null, 2);
  }, [goals]);

  const importGoals = useCallback((jsonString: string): boolean => {
    try {
      const imported = JSON.parse(jsonString) as UserGoalOverride[];
      if (!Array.isArray(imported)) return false;
      saveGoals(imported);
      setGoals(imported);
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    goals,
    setGoalTarget,
    getEffectiveTarget,
    resetGoal,
    resetAllGoals,
    exportGoals,
    importGoals,
  };
}
