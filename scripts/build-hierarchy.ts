/**
 * build-hierarchy.ts
 *
 * Reads the flat JSON produced by csv-to-json.ts and outputs two hierarchical
 * JSON files suitable for Nivo treemaps, plus a metadata file.
 *
 * Usage:
 *   tsx scripts/build-hierarchy.ts 2024
 *   tsx scripts/build-hierarchy.ts 2023
 *
 * Input:  data/processed/budget-flat-{year}.json
 * Output:
 *   data/processed/budget-by-domain-{year}.json
 *   data/processed/budget-by-ministry-{year}.json
 *   data/processed/metadata.json  (aggregated across all processed years)
 */

import * as fs from 'fs';
import * as path from 'path';
import type { BudgetRawItem, BudgetTreeNode, HierarchyLevel, DatasetMetadata } from '../src/types/budget';

// ---------------------------------------------------------------------------
// CLI argument
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const yearArg = args[0];

if (!yearArg || isNaN(Number(yearArg))) {
  console.error('Usage: tsx scripts/build-hierarchy.ts <year>');
  console.error('Example: tsx scripts/build-hierarchy.ts 2024');
  process.exit(1);
}

const year = Number(yearArg);

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT         = process.cwd();
const PROCESSED    = path.join(ROOT, 'data', 'processed');
const INPUT_PATH   = path.join(PROCESSED, `budget-flat-${year}.json`);
const DOMAIN_OUT   = path.join(PROCESSED, `budget-by-domain-${year}.json`);
const MINISTRY_OUT = path.join(PROCESSED, `budget-by-ministry-${year}.json`);
const META_PATH    = path.join(PROCESSED, 'metadata.json');

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

/**
 * Converts a flat NodeMap into a proper tree, given the root node.
 * Children are sorted by value descending.
 */
function finalizeTree(root: BudgetTreeNode): BudgetTreeNode {
  if (root.children) {
    root.children = root.children
      .map(finalizeTree)
      .sort((a, b) => sumChildren(b) - sumChildren(a));
  }
  return root;
}

// ---------------------------------------------------------------------------
// Domain-view hierarchy builder
// Root > 분야 > 부문 > 프로그램 > 세부사업
// ---------------------------------------------------------------------------

function buildDomainTree(items: BudgetRawItem[]): BudgetTreeNode {
  const domainMap: NodeMap = new Map();

  for (const item of items) {
    const {
      domainName,
      domainCode,
      sectorName,
      sectorCode,
      programName,
      detailProjectName,
      ministryName,
      accountType,
      amount,
    } = item;

    // Level 1: 분야 (domain)
    const domainKey = makeKey('domain', domainCode || domainName);
    const domainNode = getOrCreate(domainMap, domainKey, () => ({
      id: domainKey,
      name: domainName,
      children: [],
      meta: {
        level: 'domain' as HierarchyLevel,
        code: domainCode,
        parentPath: ['총지출'],
      },
    }));

    // Level 2: 부문 (sector)
    const sectorKey = makeKey('sector', domainCode, sectorCode || sectorName);
    let sectorNode = domainNode.children!.find((c) => c.id === sectorKey);
    if (!sectorNode) {
      sectorNode = {
        id: sectorKey,
        name: sectorName,
        children: [],
        meta: {
          level: 'sector' as HierarchyLevel,
          code: sectorCode,
          parentPath: ['총지출', domainName],
        },
      };
      domainNode.children!.push(sectorNode);
    }

    // Level 3: 프로그램 (program)
    const programKey = makeKey('program', domainCode, sectorCode, programName);
    let programNode = sectorNode.children!.find((c) => c.id === programKey);
    if (!programNode) {
      programNode = {
        id: programKey,
        name: programName,
        children: [],
        meta: {
          level: 'program' as HierarchyLevel,
          parentPath: ['총지출', domainName, sectorName],
        },
      };
      sectorNode.children!.push(programNode);
    }

    // Level 4: 세부사업 (detail project) — leaf node
    const detailKey = makeKey('detail', domainCode, sectorCode, programName, detailProjectName);
    let detailNode = programNode.children!.find((c) => c.id === detailKey);
    if (!detailNode) {
      detailNode = {
        id: detailKey,
        name: detailProjectName || programName,
        value: 0,
        meta: {
          level: 'detailProject' as HierarchyLevel,
          parentPath: ['총지출', domainName, sectorName, programName],
          ministryName,
          accountType,
        },
      };
      programNode.children!.push(detailNode);
    }

    // Accumulate amount on leaf
    detailNode.value = (detailNode.value ?? 0) + amount;
  }

  const root: BudgetTreeNode = {
    id: '총지출',
    name: '총지출',
    children: Array.from(domainMap.values()),
    meta: {
      level: 'root' as HierarchyLevel,
      parentPath: [],
    },
  };

  return finalizeTree(root);
}

// ---------------------------------------------------------------------------
// Ministry-view hierarchy builder
// Root > 부처 > 분야 > 프로그램 > 세부사업
// ---------------------------------------------------------------------------

function buildMinistryTree(items: BudgetRawItem[]): BudgetTreeNode {
  const ministryMap: NodeMap = new Map();

  for (const item of items) {
    const {
      ministryName,
      domainName,
      domainCode,
      programName,
      detailProjectName,
      accountType,
      amount,
    } = item;

    // Level 1: 부처 (ministry)
    const ministryKey = makeKey('ministry', ministryName);
    const ministryNode = getOrCreate(ministryMap, ministryKey, () => ({
      id: ministryKey,
      name: ministryName,
      children: [],
      meta: {
        level: 'domain' as HierarchyLevel,   // Reuse 'domain' level for consistent styling
        parentPath: ['총지출'],
      },
    }));

    // Level 2: 분야 within ministry
    const domainKey = makeKey('ministry-domain', ministryName, domainCode || domainName);
    let domainNode = ministryNode.children!.find((c) => c.id === domainKey);
    if (!domainNode) {
      domainNode = {
        id: domainKey,
        name: domainName,
        children: [],
        meta: {
          level: 'sector' as HierarchyLevel,
          code: domainCode,
          parentPath: ['총지출', ministryName],
        },
      };
      ministryNode.children!.push(domainNode);
    }

    // Level 3: 프로그램 within domain within ministry
    const programKey = makeKey('ministry-program', ministryName, domainCode, programName);
    let programNode = domainNode.children!.find((c) => c.id === programKey);
    if (!programNode) {
      programNode = {
        id: programKey,
        name: programName,
        children: [],
        meta: {
          level: 'program' as HierarchyLevel,
          parentPath: ['총지출', ministryName, domainName],
        },
      };
      domainNode.children!.push(programNode);
    }

    // Level 4: 세부사업 — leaf node
    const detailKey = makeKey('ministry-detail', ministryName, domainCode, programName, detailProjectName);
    let detailNode = programNode.children!.find((c) => c.id === detailKey);
    if (!detailNode) {
      detailNode = {
        id: detailKey,
        name: detailProjectName || programName,
        value: 0,
        meta: {
          level: 'detailProject' as HierarchyLevel,
          parentPath: ['총지출', ministryName, domainName, programName],
          accountType,
        },
      };
      programNode.children!.push(detailNode);
    }

    detailNode.value = (detailNode.value ?? 0) + amount;
  }

  const root: BudgetTreeNode = {
    id: '총지출',
    name: '총지출',
    children: Array.from(ministryMap.values()),
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

function updateMetadata(year: number, totalAmount: number): void {
  let meta: DatasetMetadata = {
    availableYears: [],
    lastUpdated: new Date().toISOString().split('T')[0],
    totalsByYear: {},
    source: 'static',
  };

  // Load existing metadata if present
  if (fs.existsSync(META_PATH)) {
    try {
      meta = JSON.parse(fs.readFileSync(META_PATH, 'utf-8')) as DatasetMetadata;
    } catch {
      // Start fresh if malformed
    }
  }

  // Update year entry
  if (!meta.availableYears.includes(year)) {
    meta.availableYears.push(year);
    meta.availableYears.sort((a, b) => a - b);
  }
  meta.totalsByYear[year] = totalAmount;
  meta.lastUpdated = new Date().toISOString().split('T')[0];

  fs.writeFileSync(META_PATH, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`[build-hierarchy] Updated metadata → ${META_PATH}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(): void {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`[build-hierarchy] Input file not found: ${INPUT_PATH}`);
    console.error(`  Run "npm run data:parse" first.`);
    process.exit(1);
  }

  const items: BudgetRawItem[] = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf-8'));
  console.log(`[build-hierarchy] ${year}: loaded ${items.length} items`);

  const totalAmount = items.reduce((s, r) => s + r.amount, 0);

  // Build domain-view tree
  console.log(`[build-hierarchy] Building domain-view tree...`);
  const domainTree = buildDomainTree(items);
  fs.writeFileSync(DOMAIN_OUT, JSON.stringify(domainTree, null, 2), 'utf-8');
  const domainTotal = sumChildren(domainTree);
  console.log(
    `[build-hierarchy] Domain tree: ${domainTree.children?.length ?? 0} domains, ` +
    `total = ${(domainTotal / 1_000_000).toFixed(1)}조원 → ${DOMAIN_OUT}`
  );

  // Build ministry-view tree
  console.log(`[build-hierarchy] Building ministry-view tree...`);
  const ministryTree = buildMinistryTree(items);
  fs.writeFileSync(MINISTRY_OUT, JSON.stringify(ministryTree, null, 2), 'utf-8');
  const ministryTotal = sumChildren(ministryTree);
  console.log(
    `[build-hierarchy] Ministry tree: ${ministryTree.children?.length ?? 0} ministries, ` +
    `total = ${(ministryTotal / 1_000_000).toFixed(1)}조원 → ${MINISTRY_OUT}`
  );

  // Update shared metadata
  updateMetadata(year, totalAmount);
}

main();
