'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveBar } from '@nivo/bar';
import { StatCard } from './StatCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyEntry {
  date: string;
  views: number;
  visitors: number;
}

interface PageStat {
  page_path: string;
  views: number;
}

interface DeviceStat {
  device: string;
  count: number;
}

interface BrowserStat {
  browser: string;
  count: number;
}

interface OSStat {
  os: string;
  count: number;
}

interface RegionStat {
  country: string;
  city: string;
  count: number;
}

interface ReferrerStat {
  referrer: string;
  count: number;
}

interface HeatmapCell {
  day: number; // 0=Mon … 6=Sun
  hour: number; // 0-23
  count: number;
}

interface StatsData {
  total_views: number;
  today_views: number;
  unique_visitors: number;
  today_visitors: number;
  daily: DailyEntry[];
  pages: PageStat[];
  devices: DeviceStat[];
  browsers: BrowserStat[];
  os: OSStat[];
  regions: RegionStat[];
  referrers: ReferrerStat[];
  heatmap: HeatmapCell[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PAGE_NAME_MAP: Record<string, string> = {
  '/': '트리맵',
  '/table': '테이블',
  '/compare': '비교',
  '/fiscal-health': '재정건전성',
  '/debt-clock': '국채시계',
  '/promise-check': '공약검증',
  '/simulator': 'AI기본사회',
  '/local-simulator': '자치구AI',
  '/goals': '목표추적',
  '/industry-sim': '산업시뮬',
  '/ai-efficiency': 'AI효율화',
  '/fiscal-innovation': '재정혁신',
  '/public-bank': '공공은행',
  '/regional-compare': '지역비교',
  '/search': '검색',
};

const COUNTRY_FLAGS: Record<string, string> = {
  KR: '\u{1F1F0}\u{1F1F7}',
  US: '\u{1F1FA}\u{1F1F8}',
  JP: '\u{1F1EF}\u{1F1F5}',
  CN: '\u{1F1E8}\u{1F1F3}',
  DE: '\u{1F1E9}\u{1F1EA}',
  GB: '\u{1F1EC}\u{1F1E7}',
  FR: '\u{1F1EB}\u{1F1F7}',
  CA: '\u{1F1E8}\u{1F1E6}',
  AU: '\u{1F1E6}\u{1F1FA}',
  SG: '\u{1F1F8}\u{1F1EC}',
};

const DEVICE_ICONS: Record<string, string> = {
  mobile: '\u{1F4F1}',
  tablet: '\u{1F4DF}',
  desktop: '\u{1F5A5}\u{FE0F}',
};

const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일'];
const HOUR_LABELS = [0, 3, 6, 9, 12, 15, 18, 21];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
}

function cleanReferrer(ref: string): string {
  if (!ref || ref === '' || ref === '(direct)') return '직접 방문';
  try {
    return new URL(ref).hostname;
  } catch {
    return ref;
  }
}

function pct(value: number, total: number): string {
  if (!total) return '0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

// ---------------------------------------------------------------------------
// Section Components
// ---------------------------------------------------------------------------

function SectionCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-border rounded-lg p-4 md:p-6 ${className}`}>
      <h2 className="text-lg font-bold text-foreground mb-4">{title}</h2>
      {children}
    </div>
  );
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-muted rounded-lg ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Main Dashboard
// ---------------------------------------------------------------------------

export function AdminDashboard() {
  const router = useRouter();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async (period: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/analytics/stats?days=${period}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch');
      const json: StatsData = await res.json();
      setData(json);
    } catch {
      setError('데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData(days);
  }, [days, fetchData]);

  const handleLogout = useCallback(() => {
    document.cookie = 'admin_token=; path=/; max-age=0';
    router.push('/admin');
  }, [router]);

  // Chart data
  const barChartData = useMemo(() => {
    if (!data?.daily) return [];
    return data.daily.map((d) => ({
      date: formatDate(d.date),
      views: d.views,
      visitors: d.visitors,
    }));
  }, [data?.daily]);

  // Page popularity
  const topPages = useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.slice(0, 10);
  }, [data?.pages]);

  const maxPageViews = useMemo(
    () => Math.max(1, ...topPages.map((p) => p.views)),
    [topPages],
  );

  // Devices
  const totalDevices = useMemo(
    () => (data?.devices ?? []).reduce((s, d) => s + d.count, 0),
    [data?.devices],
  );

  // Browsers
  const topBrowsers = useMemo(() => (data?.browsers ?? []).slice(0, 5), [data?.browsers]);
  const maxBrowserCount = useMemo(
    () => Math.max(1, ...topBrowsers.map((b) => b.count)),
    [topBrowsers],
  );
  const totalBrowsers = useMemo(
    () => topBrowsers.reduce((s, b) => s + b.count, 0),
    [topBrowsers],
  );

  // OS
  const topOS = useMemo(() => (data?.os ?? []).slice(0, 5), [data?.os]);
  const maxOSCount = useMemo(
    () => Math.max(1, ...topOS.map((o) => o.count)),
    [topOS],
  );
  const totalOS = useMemo(
    () => topOS.reduce((s, o) => s + o.count, 0),
    [topOS],
  );

  // Regions
  const topRegions = useMemo(() => (data?.regions ?? []).slice(0, 15), [data?.regions]);

  // Referrers
  const topReferrers = useMemo(() => (data?.referrers ?? []).slice(0, 10), [data?.referrers]);

  // Heatmap
  const heatmapMax = useMemo(
    () => Math.max(1, ...(data?.heatmap ?? []).map((c) => c.count)),
    [data?.heatmap],
  );

  const heatmapGrid = useMemo(() => {
    const grid: number[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => 0),
    );
    (data?.heatmap ?? []).forEach((c) => {
      if (c.day >= 0 && c.day < 7 && c.hour >= 0 && c.hour < 24) {
        grid[c.day][c.hour] = c.count;
      }
    });
    return grid;
  }, [data?.heatmap]);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">
          📊 분석 대시보드
        </h1>
        <div className="flex items-center gap-3">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-muted border border-border rounded-md px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value={7}>7일</option>
            <option value={30}>30일</option>
            <option value={90}>90일</option>
            <option value={365}>365일</option>
          </select>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground border border-border rounded-md px-3 py-1.5 transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-24" />
            ))}
          </div>
          <SkeletonBlock className="h-72" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SkeletonBlock className="h-64" />
            <SkeletonBlock className="h-64" />
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={() => fetchData(days)}
            className="bg-primary text-white rounded-md px-4 py-2 text-sm"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Data loaded */}
      {data && !loading && (
        <>
          {/* Section 1: Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="총 방문"
              value={data.total_views}
              color="text-blue-400"
            />
            <StatCard
              label="오늘 방문"
              value={data.today_views}
              color="text-emerald-400"
            />
            <StatCard
              label="고유 방문자"
              value={data.unique_visitors}
              color="text-purple-400"
            />
            <StatCard
              label="오늘 고유 방문자"
              value={data.today_visitors}
              color="text-amber-400"
            />
          </div>

          {/* Section 2: Daily Trend */}
          <SectionCard title="일별 방문 트렌드" className="col-span-full">
            <div className="h-72">
              {barChartData.length > 0 ? (
                <ResponsiveBar
                  data={barChartData}
                  keys={['views', 'visitors']}
                  indexBy="date"
                  margin={{ top: 10, right: 20, bottom: 50, left: 50 }}
                  padding={0.3}
                  groupMode="grouped"
                  colors={['#3b82f6', '#10b981']}
                  borderRadius={2}
                  enableLabel={false}
                  axisBottom={{
                    tickSize: 0,
                    tickPadding: 8,
                    tickRotation: -45,
                  }}
                  axisLeft={{
                    tickSize: 0,
                    tickPadding: 8,
                  }}
                  theme={{
                    text: { fill: '#a3a3a3', fontSize: 11 },
                    axis: {
                      ticks: { text: { fill: '#a3a3a3' } },
                    },
                    grid: {
                      line: { stroke: '#333', strokeWidth: 1 },
                    },
                    tooltip: {
                      container: {
                        background: '#171717',
                        color: '#ededed',
                        borderRadius: '8px',
                        border: '1px solid #333',
                        fontSize: '12px',
                      },
                    },
                  }}
                  legends={[
                    {
                      dataFrom: 'keys',
                      anchor: 'bottom',
                      direction: 'row',
                      translateY: 48,
                      itemWidth: 80,
                      itemHeight: 18,
                      itemTextColor: '#a3a3a3',
                      symbolSize: 10,
                      symbolShape: 'circle',
                    },
                  ]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  데이터가 없습니다.
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section 3: Page Popularity */}
          <SectionCard title="페이지별 인기도">
            {topPages.length > 0 ? (
              <div className="space-y-2">
                {topPages.map((page, i) => (
                  <div key={page.page_path} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-5 text-right shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-foreground w-24 shrink-0 truncate">
                      {PAGE_NAME_MAP[page.page_path] ?? page.page_path}
                    </span>
                    <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(page.views / maxPageViews) * 100}%`,
                          background:
                            'linear-gradient(90deg, #3b82f6, #93c5fd)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-muted-foreground w-12 text-right shrink-0 tabular-nums">
                      {page.views.toLocaleString('ko-KR')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                데이터가 없습니다.
              </p>
            )}
          </SectionCard>

          {/* Section 4: Device Distribution */}
          <SectionCard title="디바이스 분포">
            {(data.devices ?? []).length > 0 ? (
              <>
                {/* Stacked bar */}
                <div className="h-8 flex rounded-full overflow-hidden mb-4">
                  {data.devices.map((d) => {
                    const colors: Record<string, string> = {
                      desktop: '#3b82f6',
                      mobile: '#10b981',
                      tablet: '#f59e0b',
                    };
                    return (
                      <div
                        key={d.device}
                        style={{
                          width: `${(d.count / totalDevices) * 100}%`,
                          backgroundColor: colors[d.device] ?? '#6b7280',
                        }}
                        title={`${d.device}: ${d.count}`}
                      />
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="flex flex-wrap gap-4">
                  {data.devices.map((d) => (
                    <div key={d.device} className="flex items-center gap-2">
                      <span className="text-lg">
                        {DEVICE_ICONS[d.device] ?? ''}
                      </span>
                      <span className="text-sm text-foreground capitalize">
                        {d.device}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono tabular-nums">
                        {d.count.toLocaleString('ko-KR')} ({pct(d.count, totalDevices)})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                데이터가 없습니다.
              </p>
            )}
          </SectionCard>

          {/* Section 5: Browser / OS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionCard title="브라우저 분포">
              {topBrowsers.length > 0 ? (
                <div className="space-y-2">
                  {topBrowsers.map((b) => (
                    <div key={b.browser} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{b.browser}</span>
                        <span className="text-xs text-muted-foreground font-mono tabular-nums">
                          {b.count.toLocaleString('ko-KR')} ({pct(b.count, totalBrowsers)})
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{
                            width: `${(b.count / maxBrowserCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  데이터가 없습니다.
                </p>
              )}
            </SectionCard>

            <SectionCard title="OS 분포">
              {topOS.length > 0 ? (
                <div className="space-y-2">
                  {topOS.map((o) => (
                    <div key={o.os} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground">{o.os}</span>
                        <span className="text-xs text-muted-foreground font-mono tabular-nums">
                          {o.count.toLocaleString('ko-KR')} ({pct(o.count, totalOS)})
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{
                            width: `${(o.count / maxOSCount) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  데이터가 없습니다.
                </p>
              )}
            </SectionCard>
          </div>

          {/* Section 6: Regions */}
          <SectionCard title="지역별 방문자">
            {topRegions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        국가
                      </th>
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        도시
                      </th>
                      <th className="text-right py-2 text-muted-foreground font-medium">
                        방문수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topRegions.map((r, i) => (
                      <tr
                        key={`${r.country}-${r.city}-${i}`}
                        className="border-b border-border/50"
                      >
                        <td className="py-2 text-foreground">
                          {COUNTRY_FLAGS[r.country] ?? ''} {r.country}
                        </td>
                        <td className="py-2 text-foreground">{r.city || '-'}</td>
                        <td className="py-2 text-right font-mono tabular-nums text-foreground">
                          {r.count.toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                데이터가 없습니다.
              </p>
            )}
          </SectionCard>

          {/* Section 7: Referrers */}
          <SectionCard title="유입 경로">
            {topReferrers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">
                        경로
                      </th>
                      <th className="text-right py-2 text-muted-foreground font-medium">
                        방문수
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {topReferrers.map((r, i) => (
                      <tr
                        key={`${r.referrer}-${i}`}
                        className="border-b border-border/50"
                      >
                        <td className="py-2 text-foreground">
                          {cleanReferrer(r.referrer)}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-foreground">
                          {r.count.toLocaleString('ko-KR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                데이터가 없습니다.
              </p>
            )}
          </SectionCard>

          {/* Section 8: Heatmap */}
          <SectionCard title="시간대별 히트맵">
            <div className="overflow-x-auto">
              <div className="inline-grid gap-px" style={{ gridTemplateColumns: `auto repeat(24, 1fr)` }}>
                {/* Hour header row */}
                <div />
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={`h-${h}`}
                    className="text-[10px] text-muted-foreground text-center pb-1 min-w-[20px]"
                  >
                    {HOUR_LABELS.includes(h) ? h : ''}
                  </div>
                ))}

                {/* Data rows */}
                {heatmapGrid.map((row, dayIdx) => (
                  <>
                    <div
                      key={`label-${dayIdx}`}
                      className="text-[10px] text-muted-foreground pr-2 flex items-center justify-end"
                    >
                      {DAY_LABELS[dayIdx]}
                    </div>
                    {row.map((count, hourIdx) => (
                      <div
                        key={`cell-${dayIdx}-${hourIdx}`}
                        className="w-5 h-5 rounded-sm"
                        style={{
                          backgroundColor: `rgba(59, 130, 246, ${count > 0 ? Math.max(0.1, count / heatmapMax) : 0.03})`,
                        }}
                        title={`${DAY_LABELS[dayIdx]} ${hourIdx}시: ${count}건`}
                      />
                    ))}
                  </>
                ))}
              </div>
            </div>
          </SectionCard>

        </>
      )}
    </div>
  );
}
