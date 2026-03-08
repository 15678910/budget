/**
 * build-education-hierarchy.ts
 *
 * Reads flat education JSON and outputs a hierarchical JSON file plus metadata.
 *
 * Usage:
 *   tsx scripts/build-education-hierarchy.ts 2024
 *
 * Input:  data/processed/education-flat-{year}.json
 * Output:
 *   data/processed/education-by-office-{year}.json
 *   data/processed/education-metadata.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BudgetTreeNode, HierarchyLevel, DatasetMetadata } from '../src/types/budget';

interface EducationBudgetItem {
  fiscalYear: number;
  officeCode: string;
  officeName: string;
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
  console.error('Usage: tsx scripts/build-education-hierarchy.ts <year>');
  console.error('Example: tsx scripts/build-education-hierarchy.ts 2024');
  process.exit(1);
}

const year = Number(yearArg);

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const PROCESSED = path.join(ROOT, 'data', 'processed');
const INPUT_PATH = path.join(PROCESSED, `education-flat-${year}.json`);
const OFFICE_OUT = path.join(PROCESSED, `education-by-office-${year}.json`);
const META_PATH = path.join(PROCESSED, 'education-metadata.json');

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
// Office-view hierarchy builder
// Root > 교육청 > 기능분야 (leaf)
// ---------------------------------------------------------------------------

function buildOfficeTree(items: EducationBudgetItem[]): BudgetTreeNode {
  const officeMap: NodeMap = new Map();

  for (const item of items) {
    const { officeCode, officeName, functionName, accountType, amount } = item;

    // Level 1: 교육청
    const officeKey = makeKey('office', officeCode);
    const officeNode = getOrCreate(officeMap, officeKey, () => ({
      id: officeKey,
      name: officeName,
      children: [],
      meta: {
        level: 'domain' as HierarchyLevel,
        code: officeCode,
        parentPath: ['교육청 총계'],
      },
    }));

    // Level 2: 기능분야 (leaf)
    const functionKey = makeKey('edu-func', officeCode, functionName);
    let functionNode = officeNode.children!.find(c => c.id === functionKey);
    if (!functionNode) {
      functionNode = {
        id: functionKey,
        name: functionName,
        value: 0,
        meta: {
          level: 'detailProject' as HierarchyLevel,
          parentPath: ['교육청 총계', officeName],
          accountType,
        },
      };
      officeNode.children!.push(functionNode);
    }

    functionNode.value = (functionNode.value ?? 0) + amount;
  }

  const root: BudgetTreeNode = {
    id: '교육청 총계',
    name: '교육청 총계',
    children: Array.from(officeMap.values()),
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
  console.log(`[build-education-hierarchy] Updated metadata → ${META_PATH}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`[build-education-hierarchy] Input file not found: ${INPUT_PATH}`);
    console.error(`  Ensure education-flat-${year}.json exists in data/processed/.`);
    process.exit(1);
  }

  const items: EducationBudgetItem[] = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  console.log(`[build-education-hierarchy] ${year}: loaded ${items.length} items`);

  const totalAmount = items.reduce((s, r) => s + r.amount, 0);

  // Build office-view tree
  console.log(`[build-education-hierarchy] Building office-view tree...`);
  const officeTree = buildOfficeTree(items);
  fs.writeFileSync(OFFICE_OUT, JSON.stringify(officeTree, null, 2), 'utf-8');
  const officeTotal = sumChildren(officeTree);
  console.log(
    `[build-education-hierarchy] Office tree: ${officeTree.children?.length ?? 0} offices, ` +
    `total = ${(officeTotal / 1_000_000).toFixed(1)}조원 → ${OFFICE_OUT}`
  );

  // Update shared metadata
  updateMetadata(year, totalAmount);
}

main();
