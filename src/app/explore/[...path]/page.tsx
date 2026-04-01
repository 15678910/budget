import { redirect } from "next/navigation";
import {
  loadBudgetByDomain,
  loadMetadata,
  loadRegionalMetadata,
  loadEducationMetadata,
} from "@/lib/data/load-budget";
import { BudgetExplorer } from "@/components/BudgetExplorer";
import { DEFAULT_YEAR } from "@/lib/constants";
import type { Metadata } from "next";

interface ExplorePageProps {
  params: Promise<{ path: string[] }>;
}

export async function generateMetadata({
  params,
}: ExplorePageProps): Promise<Metadata> {
  const { path: pathSegments } = await params;
  const decoded = pathSegments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  const title = decoded.length > 0 ? `${decoded.join(" > ")} | 마을살림/나라살림` : "예산 탐색 | 마을살림/나라살림";

  return {
    title,
    description: `${decoded.join(" > ")} 예산 상세 정보`,
  };
}

export default async function ExplorePage({ params }: ExplorePageProps) {
  const { path: pathSegments } = await params;

  const decoded = pathSegments.map((s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  });

  if (!decoded.length) {
    redirect("/");
  }

  const metadata = loadMetadata();
  const regionalMeta = loadRegionalMetadata();
  const educationMeta = loadEducationMetadata();

  const allYears = [...new Set([
    ...metadata.availableYears,
    ...regionalMeta.availableYears,
    ...educationMeta.availableYears,
  ])].sort((a, b) => a - b);

  const initialYear = allYears.includes(DEFAULT_YEAR)
    ? DEFAULT_YEAR
    : allYears[allYears.length - 1];

  // Only load initial view data — rest fetched on demand via API
  const initialData = loadBudgetByDomain(initialYear);

  return (
    <div>
      {/* Path context banner */}
      <div className="mb-4 p-3 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground mb-1">탐색 경로</div>
            <div className="flex items-center gap-1 text-base font-medium text-foreground">
              {decoded.map((segment, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-muted-foreground mx-1">&gt;</span>
                  )}
                  <span>{segment}</span>
                </span>
              ))}
            </div>
          </div>
          <a
            href="/"
            className="text-sm text-primary hover:underline shrink-0"
          >
            트리맵에서 보기
          </a>
        </div>
      </div>

      <BudgetExplorer
        initialData={initialData}
        initialYear={initialYear}
        availableYears={allYears}
      />
    </div>
  );
}
