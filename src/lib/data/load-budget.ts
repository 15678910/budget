import { BudgetTreeNode, DatasetMetadata } from '@/types/budget';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'processed');

export function loadBudgetByDomain(year: number): BudgetTreeNode {
  const filePath = path.join(DATA_DIR, `budget-by-domain-${year}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadBudgetByMinistry(year: number): BudgetTreeNode {
  const filePath = path.join(DATA_DIR, `budget-by-ministry-${year}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadMetadata(): DatasetMetadata {
  const filePath = path.join(DATA_DIR, 'metadata.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadFlatBudget(year: number): any[] {
  const filePath = path.join(DATA_DIR, `budget-flat-${year}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadRegionalByMetro(year: number): BudgetTreeNode {
  const filePath = path.join(DATA_DIR, `regional-by-metro-${year}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadRegionalByDistrict(year: number): BudgetTreeNode {
  const filePath = path.join(DATA_DIR, `regional-by-district-${year}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadRegionalMetadata(): DatasetMetadata {
  const filePath = path.join(DATA_DIR, 'regional-metadata.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadEducationByOffice(year: number): BudgetTreeNode {
  const filePath = path.join(DATA_DIR, `education-by-office-${year}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadEducationMetadata(): DatasetMetadata {
  const filePath = path.join(DATA_DIR, 'education-metadata.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function loadKoreaGeoData() {
  const filePath = path.join(process.cwd(), 'data', 'geo', 'korea-provinces-topo.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}
