/** One row from the CSV dataset (flat) */
export interface BudgetRawItem {
  fiscalYear: number;
  ministryName: string;          // 부처명
  accountTypeName: string;       // 회계명
  accountType: '일반회계' | '특별회계' | '기금';
  domainName: string;            // 분야명
  domainCode: string;            // 분야코드
  sectorName: string;            // 부문명
  sectorCode: string;            // 부문코드
  programName: string;           // 프로그램명
  unitProjectName: string;       // 단위사업명
  detailProjectName: string;     // 세부사업명
  budgetType: string;            // 예산구분
  amount: number;                // 예산액 (백만원)
}

/** Nivo-compatible treemap node */
export interface BudgetTreeNode {
  id: string;
  name: string;
  value?: number;
  children?: BudgetTreeNode[];
  meta?: {
    level: HierarchyLevel;
    code?: string;
    parentPath: string[];
    ministryName?: string;
    accountType?: string;
    changeFromPrevYear?: number;
    changePercent?: number;
  };
}

export type HierarchyLevel = 'root' | 'domain' | 'sector' | 'program' | 'unitProject' | 'detailProject';
export type ViewMode = 'ministry' | 'domain' | 'metro' | 'district' | 'education';
export type VisualizationMode = 'treemap' | 'bubble';

export interface TreemapNavigationState {
  viewMode: ViewMode;
  year: number;
  path: string[];
  currentNode: BudgetTreeNode;
  breadcrumbs: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  label: string;
  path: string[];
}

export interface BudgetSearchResult {
  item: BudgetRawItem;
  path: string[];
  matchField: string;
  score: number;
}

export interface BudgetComparison {
  id: string;
  name: string;
  yearA: { year: number; amount: number };
  yearB: { year: number; amount: number };
  delta: number;
  deltaPercent: number;
  children?: BudgetComparison[];
}

export interface PerCapitaData {
  year: number;
  population: number;
  totalBudget: number;
  perCapita: number;
}

export interface DatasetMetadata {
  availableYears: number[];
  lastUpdated: string;
  totalsByYear: Record<number, number>;
  source: 'static' | 'api';
}

/** One row from the regional budget dataset (flat) */
export interface RegionalBudgetItem {
  fiscalYear: number;
  regionCode: string;       // 시도 코드 (예: "11" 서울)
  regionName: string;       // 광역시도명
  districtCode: string;     // 시군구 코드 ("000" = 본청)
  districtName: string;     // 시군구명 ("본청" = 광역 자체)
  functionName: string;     // 기능별 분야
  accountType: string;      // 일반회계/특별회계
  amount: number;           // 백만원
}
