/**
 * build-regional-hierarchy.ts
 *
 * Reads flat regional JSON and outputs two hierarchical JSON files plus metadata.
 *
 * Usage:
 *   tsx scripts/build-regional-hierarchy.ts 2024
 *
 * Input:  data/processed/regional-flat-{year}.json
 * Output:
 *   data/processed/regional-by-metro-{year}.json
 *   data/processed/regional-by-district-{year}.json
 *   data/processed/regional-metadata.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BudgetTreeNode, HierarchyLevel, DatasetMetadata } from '../src/types/budget';

interface RegionalBudgetItem {
  fiscalYear: number;
  regionCode: string;
  regionName: string;
  districtCode: string;
  districtName: string;
  functionName: string;
  accountType: string;
  amount: number;
}

// ---------------------------------------------------------------------------
// CLI argument
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const yearArg = args[0];

if (!yearArg || isNaN(Number(yearArg))) {
  console.error('Usage: tsx scripts/build-regional-hierarchy.ts <year>');
  console.error('Example: tsx scripts/build-regional-hierarchy.ts 2024');
  process.exit(1);
}

const year = Number(yearArg);

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const PROCESSED = path.join(ROOT, 'data', 'processed');
const INPUT_PATH = path.join(PROCESSED, `regional-flat-${year}.json`);
const METRO_OUT = path.join(PROCESSED, `regional-by-metro-${year}.json`);
const DISTRICT_OUT = path.join(PROCESSED, `regional-by-district-${year}.json`);
const META_PATH = path.join(PROCESSED, 'regional-metadata.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type NodeMap = Map<string, BudgetTreeNode>;

function makeKey(...parts: string[]): string {
  return parts.join('::');
}

function getOrCreate(
  map: NodeMap,
  key: string,
  factory: () => BudgetTreeNode
): BudgetTreeNode {
  if (!map.has(key)) {
    map.set(key, factory());
  }
  return map.get(key)!;
}

function sumChildren(node: BudgetTreeNode): number {
  if (!node.children || node.children.length === 0) {
    return node.value ?? 0;
  }
  return node.children.reduce((s, c) => s + sumChildren(c), 0);
}

function finalizeTree(root: BudgetTreeNode): BudgetTreeNode {
  if (root.children) {
    root.children = root.children
      .map(finalizeTree)
      .sort((a, b) => sumChildren(b) - sumChildren(a));
  }
  return root;
}

// ---------------------------------------------------------------------------
// Metro-view hierarchy builder
// Root > 광역시도 > 기능분야 (leaf)
// ---------------------------------------------------------------------------

function buildMetroTree(items: RegionalBudgetItem[]): BudgetTreeNode {
  const metroMap: NodeMap = new Map();

  for (const item of items) {
    const { regionCode, regionName, functionName, accountType, amount } = item;

    // Level 1: 광역시도
    const metroKey = makeKey('metro', regionCode);
    const metroNode = getOrCreate(metroMap, metroKey, () => ({
      id: metroKey,
      name: regionName,
      children: [],
      meta: {
        level: 'domain' as HierarchyLevel,
        code: regionCode,
        parentPath: ['지방재정 총계'],
      },
    }));

    // Level 2: 기능분야 (leaf)
    const functionKey = makeKey('metro-func', regionCode, functionName);
    let functionNode = metroNode.children!.find(c => c.id === functionKey);
    if (!functionNode) {
      functionNode = {
        id: functionKey,
        name: functionName,
        value: 0,
        meta: {
          level: 'detailProject' as HierarchyLevel,
          parentPath: ['지방재정 총계', regionName],
          accountType,
        },
      };
      metroNode.children!.push(functionNode);
    }

    functionNode.value = (functionNode.value ?? 0) + amount;
  }

  const root: BudgetTreeNode = {
    id: '지방재정 총계',
    name: '지방재정 총계',
    children: Array.from(metroMap.values()),
    meta: {
      level: 'root' as HierarchyLevel,
      parentPath: [],
    },
  };

  return finalizeTree(root);
}

// ---------------------------------------------------------------------------
// District-view hierarchy builder
// Root > 광역시도 > 시군구 > 기능분야 (leaf)
// ---------------------------------------------------------------------------

function buildDistrictTree(items: RegionalBudgetItem[]): BudgetTreeNode {
  const metroMap: NodeMap = new Map();

  for (const item of items) {
    const { regionCode, regionName, districtCode, districtName, functionName, accountType, amount } = item;

    // Level 1: 광역시도
    const metroKey = makeKey('metro', regionCode);
    const metroNode = getOrCreate(metroMap, metroKey, () => ({
      id: metroKey,
      name: regionName,
      children: [],
      meta: {
        level: 'domain' as HierarchyLevel,
        code: regionCode,
        parentPath: ['지방재정 총계'],
      },
    }));

    // Level 2: 시군구
    const districtKey = makeKey('district', regionCode, districtCode);
    let districtNode = metroNode.children!.find(c => c.id === districtKey);
    if (!districtNode) {
      districtNode = {
        id: districtKey,
        name: districtName,
        children: [],
        meta: {
          level: 'sector' as HierarchyLevel,
          code: districtCode,
          parentPath: ['지방재정 총계', regionName],
        },
      };
      metroNode.children!.push(districtNode);
    }

    // Level 3: 기능분야 (leaf)
    const functionKey = makeKey('dist-func', regionCode, districtCode, functionName);
    let functionNode = districtNode.children!.find(c => c.id === functionKey);
    if (!functionNode) {
      functionNode = {
        id: functionKey,
        name: functionName,
        value: 0,
        meta: {
          level: 'detailProject' as HierarchyLevel,
          parentPath: ['지방재정 총계', regionName, districtName],
          accountType,
        },
      };
      districtNode.children!.push(functionNode);
    }

    functionNode.value = (functionNode.value ?? 0) + amount;
  }

  const root: BudgetTreeNode = {
    id: '지방재정 총계',
    name: '지방재정 총계',
    children: Array.from(metroMap.values()),
    meta: {
      level: 'root' as HierarchyLevel,
      parentPath: [],
    },
  };

  return finalizeTree(root);
}

// ---------------------------------------------------------------------------
// Metadata updater
// ---------------------------------------------------------------------------

function updateMetadata(yearNum: number, totalAmount: number): void {
  let meta: DatasetMetadata = {
    availableYears: [],
    lastUpdated: new Date().toISOString().split('T')[0],
    totalsByYear: {},
    source: 'static',
  };

  if (fs.existsSync(META_PATH)) {
    try {
      meta = JSON.parse(fs.readFileSync(META_PATH, 'utf-8')) as DatasetMetadata;
    } catch {
      // Start fresh if malformed
    }
  }

  if (!meta.availableYears.includes(yearNum)) {
    meta.availableYears.push(yearNum);
    meta.availableYears.sort((a, b) => a - b);
  }
  meta.totalsByYear[yearNum] = totalAmount;
  meta.lastUpdated = new Date().toISOString().split('T')[0];

  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`[build-regional-hierarchy] Updated metadata → ${META_PATH}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`[build-regional-hierarchy] Input file not found: ${INPUT_PATH}`);
    console.error(`  Ensure regional-flat-${year}.json exists in data/processed/.`);
    process.exit(1);
  }

  const items: RegionalBudgetItem[] = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  console.log(`[build-regional-hierarchy] ${year}: loaded ${items.length} items`);

  const totalAmount = items.reduce((s, r) => s + r.amount, 0);

  // Build metro-view tree
  console.log(`[build-regional-hierarchy] Building metro-view tree...`);
  const metroTree = buildMetroTree(items);
  fs.writeFileSync(METRO_OUT, JSON.stringify(metroTree, null, 2), 'utf-8');
  const metroTotal = sumChildren(metroTree);
  console.log(
    `[build-regional-hierarchy] Metro tree: ${metroTree.children?.length ?? 0} regions, ` +
    `total = ${(metroTotal / 1_000_000).toFixed(1)}조원 → ${METRO_OUT}`
  );

  // Build district-view tree
  console.log(`[build-regional-hierarchy] Building district-view tree...`);
  const districtTree = buildDistrictTree(items);
  fs.writeFileSync(DISTRICT_OUT, JSON.stringify(districtTree, null, 2), 'utf-8');
  const districtTotal = sumChildren(districtTree);
  console.log(
    `[build-regional-hierarchy] District tree: ${districtTree.children?.length ?? 0} regions, ` +
    `total = ${(districtTotal / 1_000_000).toFixed(1)}조원 → ${DISTRICT_OUT}`
  );

  // Update shared metadata
  updateMetadata(year, totalAmount);
}

main();
