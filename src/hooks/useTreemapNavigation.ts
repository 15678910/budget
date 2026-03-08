"use client";

import { useState, useMemo, useCallback } from 'react';
import type { BudgetTreeNode, BreadcrumbItem } from '@/types/budget';

function traversePath(root: BudgetTreeNode, path: string[]): BudgetTreeNode {
  let current = root;
  for (const segment of path) {
    const child = current.children?.find(c => c.name === segment);
    if (!child) break;
    current = child;
  }
  return current;
}

export function useTreemapNavigation(rootData: BudgetTreeNode) {
  const [path, setPath] = useState<string[]>([]);

  const currentNode = useMemo(() => {
    return traversePath(rootData, path);
  }, [rootData, path]);

  const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
    return [
      { label: '총지출', path: [] },
      ...path.map((segment, i) => ({
        label: segment,
        path: path.slice(0, i + 1),
      })),
    ];
  }, [path]);

  const drillDown = useCallback((nodeName: string) => {
    setPath(prev => [...prev, nodeName]);
  }, []);

  const navigateTo = useCallback((newPath: string[]) => {
    setPath(newPath);
  }, []);

  const canDrillDown = useCallback((node: BudgetTreeNode) => {
    return !!node.children && node.children.length > 0;
  }, []);

  return { currentNode, breadcrumbs, path, drillDown, navigateTo, canDrillDown };
}
