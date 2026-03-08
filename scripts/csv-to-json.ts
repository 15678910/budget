/**
 * csv-to-json.ts
 *
 * Reads a CSV budget file for a given year and outputs a flat JSON array.
 *
 * Usage:
 *   tsx scripts/csv-to-json.ts 2024
 *   tsx scripts/csv-to-json.ts 2023
 *
 * Input:  data/raw/budget-{year}.csv
 * Output: data/processed/budget-flat-{year}.json
 */

import * as fs from 'fs';
import * as path from 'path';
import Papa from 'papaparse';
import type { BudgetRawItem } from '../src/types/budget';

// ---------------------------------------------------------------------------
// CLI argument
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const yearArg = args[0];

if (!yearArg || isNaN(Number(yearArg))) {
  console.error('Usage: tsx scripts/csv-to-json.ts <year>');
  console.error('Example: tsx scripts/csv-to-json.ts 2024');
  process.exit(1);
}

const year = Number(yearArg);

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const INPUT_PATH  = path.join(ROOT, 'data', 'raw', `budget-${year}.csv`);
const OUTPUT_DIR  = path.join(ROOT, 'data', 'processed');
const OUTPUT_PATH = path.join(OUTPUT_DIR, `budget-flat-${year}.json`);

// ---------------------------------------------------------------------------
// CSV → flat JSON
// ---------------------------------------------------------------------------

function stripBom(content: string): string {
  // Remove UTF-8 BOM (\uFEFF) if present
  return content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
}

function parseAmount(raw: string | undefined | null): number {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/,/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

function mapAccountType(val: string): '일반회계' | '특별회계' | '기금' {
  if (val.includes('기금')) return '기금';
  if (val.includes('특별')) return '특별회계';
  return '일반회계';
}

interface RawCsvRow {
  회계연도?: string;
  부처명?: string;
  회계명?: string;
  분야명?: string;
  분야코드?: string;
  부문명?: string;
  부문코드?: string;
  프로그램명?: string;
  단위사업명?: string;
  세부사업명?: string;
  예산구분?: string;
  예산액?: string;
  [key: string]: string | undefined;
}

function transformRow(row: RawCsvRow, idx: number): BudgetRawItem | null {
  const fiscalYear = Number(row['회계연도'] ?? year);
  const ministryName     = (row['부처명'] ?? '').trim();
  const accountTypeName  = (row['회계명'] ?? '일반회계').trim();
  const domainName       = (row['분야명'] ?? '').trim();
  const domainCode       = (row['분야코드'] ?? '').trim();
  const sectorName       = (row['부문명'] ?? '').trim();
  const sectorCode       = (row['부문코드'] ?? '').trim();
  const programName      = (row['프로그램명'] ?? '').trim();
  const unitProjectName  = (row['단위사업명'] ?? '').trim();
  const detailProjectName = (row['세부사업명'] ?? '').trim();
  const budgetType       = (row['예산구분'] ?? '예산').trim();
  const amount           = parseAmount(row['예산액']);

  // Skip rows with missing essential fields
  if (!domainName || !sectorName || !programName) {
    console.warn(`[csv-to-json] Skipping row ${idx + 2}: missing required fields`);
    return null;
  }

  return {
    fiscalYear: isNaN(fiscalYear) ? year : fiscalYear,
    ministryName,
    accountTypeName,
    accountType: mapAccountType(accountTypeName),
    domainName,
    domainCode,
    sectorName,
    sectorCode,
    programName,
    unitProjectName,
    detailProjectName,
    budgetType,
    amount,
  };
}

function main(): void {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`[csv-to-json] Input file not found: ${INPUT_PATH}`);
    console.error(`  Run "npm run data:generate" first to create sample CSV files.`);
    process.exit(1);
  }

  // Read raw CSV (handles UTF-8 BOM)
  const rawContent = stripBom(fs.readFileSync(INPUT_PATH, 'utf-8'));

  // Parse with PapaParse
  const result = Papa.parse<RawCsvRow>(rawContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.errors.length > 0) {
    console.warn(`[csv-to-json] Parse warnings (${result.errors.length}):`);
    result.errors.slice(0, 5).forEach((e) => console.warn(' ', e.message));
  }

  const items: BudgetRawItem[] = [];
  let skipped = 0;

  result.data.forEach((row, idx) => {
    const item = transformRow(row, idx);
    if (item) {
      items.push(item);
    } else {
      skipped++;
    }
  });

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(items, null, 2), 'utf-8');

  const total = items.reduce((s, r) => s + r.amount, 0);
  console.log(
    `[csv-to-json] ${year}: parsed ${items.length} items (${skipped} skipped), ` +
    `total = ${(total / 1_000_000).toFixed(1)}조원 → ${OUTPUT_PATH}`
  );
}

main();
