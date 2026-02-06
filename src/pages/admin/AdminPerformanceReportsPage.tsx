import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminLayout } from "@/components/AdminLayout";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Eye,
  MousePointer,
  ShoppingCart,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PerformanceRecord {
  id: string;
  campaign_id: string;
  ad_set_id: string | null;
  date: string;
  platform: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  cpc: number;
  cpm: number;
  roas: number;
  created_at: string;
}

interface CampaignInfo {
  id: string;
  name: string;
  platform: string;
  status: string;
}

type DateRange = "7d" | "30d" | "90d";
type PlatformFilter = "all" | "facebook" | "instagram" | "xiaohongshu";

const COLORS = ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];


export default function AdminPerformanceReportsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>("7d");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("meta-sync-performance");
      if (error) throw error;
      toast({ title: t("admin.performanceReportsPage.syncSuccess", "Performance data synced successfully") });
    } catch (err) {
      toast({
        title: t("admin.performanceReportsPage.syncError", "Sync failed"),
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const getDaysFromRange = (range: DateRange): number => {
    switch (range) {
      case "7d": return 7;
      case "30d": return 30;
      case "90d": return 90;
    }
  };

  const { data: performanceData = [], isLoading } = useQuery({
    queryKey: ["admin-performance", dateRange, platformFilter],
    queryFn: async () => {
      const days = getDaysFromRange(dateRange);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);
      const fromStr = fromDate.toISOString().slice(0, 10);

      let query = supabase
        .from("marketing_performance")
        .select("*, marketing_campaigns(id, name, platform, status)")
        .gte("date", fromStr)
        .order("date", { ascending: true });

      if (platformFilter !== "all") {
        query = query.eq("platform", platformFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching performance data:", error);
        return [];
      }

      return (data || []) as (PerformanceRecord & { marketing_campaigns: CampaignInfo | null })[];
    },
  });

  const hasRealData = performanceData.length > 0;

  // Aggregate stats from real data
  const stats = {
    totalSpend: performanceData.reduce((sum, r) => sum + (r.spend || 0), 0),
    totalImpressions: performanceData.reduce((sum, r) => sum + (r.impressions || 0), 0),
    totalClicks: performanceData.reduce((sum, r) => sum + (r.clicks || 0), 0),
    totalConversions: performanceData.reduce((sum, r) => sum + (r.conversions || 0), 0),
    avgCtr: performanceData.length > 0
      ? performanceData.reduce((sum, r) => sum + (r.ctr || 0), 0) / performanceData.length
      : 0,
    avgRoas: performanceData.length > 0
      ? performanceData.reduce((sum, r) => sum + (r.roas || 0), 0) / performanceData.length
      : 0,
  };

  // Build daily trend data from real data
  const dailyTrendData = (() => {
    const grouped: Record<string, { date: string; impressions: number; clicks: number; conversions: number }> = {};
    performanceData.forEach((r) => {
      const dateKey = r.date.slice(5).replace("-", "/");
      if (!grouped[dateKey]) {
        grouped[dateKey] = { date: dateKey, impressions: 0, clicks: 0, conversions: 0 };
      }
      grouped[dateKey].impressions += r.impressions || 0;
      grouped[dateKey].clicks += r.clicks || 0;
      grouped[dateKey].conversions += r.conversions || 0;
    });
    return Object.values(grouped);
  })();

  // Build platform comparison data from real data
  const platformComparisonData = (() => {
    const grouped: Record<string, { platform: string; spend: number; impressions: number; clicks: number }> = {};
    performanceData.forEach((r) => {
      const p = r.platform || "Unknown";
      if (!grouped[p]) {
        grouped[p] = { platform: p, spend: 0, impressions: 0, clicks: 0 };
      }
      grouped[p].spend += r.spend || 0;
      grouped[p].impressions += r.impressions || 0;
      grouped[p].clicks += r.clicks || 0;
    });
    return Object.values(grouped);
  })();

  // Build budget allocation data from real data
  const budgetAllocationData = (() => {
    const grouped: Record<string, number> = {};
    performanceData.forEach((r) => {
      const p = r.platform || "Unknown";
      grouped[p] = (grouped[p] || 0) + (r.spend || 0);
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  })();

  // Build top campaigns data from real data
  const topCampaignsData = (() => {
    const grouped: Record<string, {
      name: string;
      platform: string;
      spend: number;
      impressions: number;
      clicks: number;
      conversions: number;
      roas: number;
      count: number;
    }> = {};
    performanceData.forEach((r) => {
      const cId = r.campaign_id;
      const cName = r.marketing_campaigns?.name || cId;
      const cPlatform = r.marketing_campaigns?.platform || r.platform || "Unknown";
      if (!grouped[cId]) {
        grouped[cId] = { name: cName, platform: cPlatform, spend: 0, impressions: 0, clicks: 0, conversions: 0, roas: 0, count: 0 };
      }
      grouped[cId].spend += r.spend || 0;
      grouped[cId].impressions += r.impressions || 0;
      grouped[cId].clicks += r.clicks || 0;
      grouped[cId].conversions += r.conversions || 0;
      grouped[cId].roas += r.roas || 0;
      grouped[cId].count += 1;
    });
    return Object.values(grouped)
      .map((c) => ({ ...c, roas: c.count > 0 ? c.roas / c.count : 0 }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);
  })();

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "facebook": return "bg-blue-500/10 text-blue-600";
      case "instagram": return "bg-pink-500/10 text-pink-600";
      case "xiaohongshu": return "bg-red-500/10 text-red-600";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-performance-title">
              {t("admin.performanceReportsPage.title", "Ad Performance Reports")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.performanceReportsPage.subtitle", "Monitor KPIs across all advertising platforms")}
            </p>
          </div>
          <Button onClick={handleSync} disabled={syncing} variant="outline" className="gap-2 w-full sm:w-auto">
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t("admin.performanceReportsPage.syncNow", "Sync Now")}
          </Button>
        </div>

        {/* Filter Bar */}
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              {/* Date range */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                  {t("admin.performanceReportsPage.dateRange", "Date Range")}:
                </span>
                <div className="flex gap-1">
                  {([
                    { key: "7d" as DateRange, label: t("admin.performanceReportsPage.last7Days", "Last 7 Days") },
                    { key: "30d" as DateRange, label: t("admin.performanceReportsPage.last30Days", "Last 30 Days") },
                    { key: "90d" as DateRange, label: t("admin.performanceReportsPage.last90Days", "Last 90 Days") },
                  ]).map((opt) => (
                    <Button
                      key={opt.key}
                      variant={dateRange === opt.key ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs sm:text-sm"
                      onClick={() => setDateRange(opt.key)}
                      data-testid={`btn-range-${opt.key}`}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Platform filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
                  {t("admin.performanceReportsPage.platform", "Platform")}:
                </span>
                <div className="flex gap-1 flex-wrap">
                  {([
                    { key: "all" as PlatformFilter, label: t("admin.performanceReportsPage.all", "All") },
                    { key: "facebook" as PlatformFilter, label: "Facebook" },
                    { key: "instagram" as PlatformFilter, label: "Instagram" },
                    { key: "xiaohongshu" as PlatformFilter, label: "Xiaohongshu" },
                  ]).map((opt) => (
                    <Button
                      key={opt.key}
                      variant={platformFilter === opt.key ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs sm:text-sm"
                      onClick={() => setPlatformFilter(opt.key)}
                      data-testid={`btn-platform-${opt.key}`}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* No data notice with sync CTA */}
        {!hasRealData && (
          <div className="text-center py-8 bg-muted/50 border border-dashed rounded-lg">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              {t("admin.performanceReportsPage.noDataNotice", "No performance data available. Sync your campaign data to see metrics.")}
            </p>
            <Button onClick={handleSync} disabled={syncing} className="gap-2">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {t("admin.performanceReportsPage.syncNow", "Sync Now")}
            </Button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Total Spend */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold truncate">
                RM {stats.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.performanceReportsPage.totalSpend", "Total Spend")}
              </p>
            </CardContent>
          </Card>

          {/* Total Impressions */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold truncate">
                {stats.totalImpressions.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.performanceReportsPage.totalImpressions", "Total Impressions")}
              </p>
            </CardContent>
          </Card>

          {/* Total Clicks */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                  <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold truncate">
                {stats.totalClicks.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.performanceReportsPage.totalClicks", "Total Clicks")}
              </p>
            </CardContent>
          </Card>

          {/* Total Conversions */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold truncate">
                {stats.totalConversions.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.performanceReportsPage.totalConversions", "Total Conversions")}
              </p>
            </CardContent>
          </Card>

          {/* Avg CTR */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold truncate">
                {stats.avgCtr.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.performanceReportsPage.avgCtr", "Avg CTR")}
              </p>
            </CardContent>
          </Card>

          {/* Avg ROAS */}
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-lg sm:text-xl font-bold truncate">
                {stats.avgRoas.toFixed(2)}x
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.performanceReportsPage.avgRoas", "Avg ROAS")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Daily Trend Line Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.performanceReportsPage.dailyTrend", "Daily Trend")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    stroke={COLORS[0]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={t("admin.performanceReportsPage.impressions", "Impressions")}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke={COLORS[1]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={t("admin.performanceReportsPage.clicks", "Clicks")}
                  />
                  <Line
                    type="monotone"
                    dataKey="conversions"
                    stroke={COLORS[3]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={t("admin.performanceReportsPage.conversions", "Conversions")}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Platform Comparison Bar Chart */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.performanceReportsPage.platformComparison", "Platform Comparison")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={platformComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="spend"
                    fill={COLORS[0]}
                    name={t("admin.performanceReportsPage.spend", "Spend")}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="clicks"
                    fill={COLORS[1]}
                    name={t("admin.performanceReportsPage.clicks", "Clicks")}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Budget Allocation Pie Chart */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.performanceReportsPage.budgetAllocation", "Budget Allocation")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={budgetAllocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {budgetAllocationData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `RM ${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Campaigns */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.performanceReportsPage.topCampaigns", "Top Campaigns")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            {topCampaignsData.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {t("admin.performanceReportsPage.noCampaigns", "No campaign data available")}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {/* Table header - desktop only */}
                <div className="hidden sm:grid sm:grid-cols-7 gap-4 px-4 py-2 text-xs text-muted-foreground font-medium border-b">
                  <span className="col-span-2">{t("admin.performanceReportsPage.campaign", "Campaign")}</span>
                  <span className="text-right">{t("admin.performanceReportsPage.spend", "Spend")}</span>
                  <span className="text-right">{t("admin.performanceReportsPage.impressions", "Impressions")}</span>
                  <span className="text-right">{t("admin.performanceReportsPage.clicks", "Clicks")}</span>
                  <span className="text-right">{t("admin.performanceReportsPage.conversions", "Conversions")}</span>
                  <span className="text-right">{t("admin.performanceReportsPage.roas", "ROAS")}</span>
                </div>

                {topCampaignsData.map((campaign, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:grid sm:grid-cols-7 gap-2 sm:gap-4 p-3 sm:px-4 sm:py-3 border rounded-lg sm:items-center"
                    data-testid={`campaign-row-${index}`}
                  >
                    {/* Campaign name + platform */}
                    <div className="sm:col-span-2 min-w-0">
                      <p className="font-medium text-sm truncate">{campaign.name}</p>
                      <Badge variant="secondary" className={`text-xs mt-0.5 ${getPlatformColor(campaign.platform)}`}>
                        {campaign.platform}
                      </Badge>
                    </div>

                    {/* Mobile: stats in a grid; Desktop: inline columns */}
                    <div className="grid grid-cols-4 sm:contents gap-2 text-sm">
                      <div className="sm:text-right">
                        <span className="text-xs text-muted-foreground sm:hidden">Spend</span>
                        <p className="font-medium sm:font-normal">RM {campaign.spend.toLocaleString()}</p>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-xs text-muted-foreground sm:hidden">Impr.</span>
                        <p>{campaign.impressions.toLocaleString()}</p>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-xs text-muted-foreground sm:hidden">Clicks</span>
                        <p>{campaign.clicks.toLocaleString()}</p>
                      </div>
                      <div className="sm:text-right">
                        <span className="text-xs text-muted-foreground sm:hidden">Conv.</span>
                        <p>{campaign.conversions}</p>
                      </div>
                      <div className="sm:text-right hidden sm:block">
                        <Badge variant="outline" className="text-xs font-mono">
                          {campaign.roas.toFixed(1)}x
                        </Badge>
                      </div>
                    </div>

                    {/* Mobile-only ROAS */}
                    <div className="flex justify-end sm:hidden">
                      <Badge variant="outline" className="text-xs font-mono">
                        ROAS: {campaign.roas.toFixed(1)}x
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
