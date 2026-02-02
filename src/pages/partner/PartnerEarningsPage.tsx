import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PartnerLayout } from "@/components/PartnerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import {
  TrendingUp, DollarSign, Award, Users,
  Calendar, Download, Filter, ArrowUpRight, PieChart, Loader2
} from "lucide-react";

interface EarningEntry {
  id: string;
  type: string;
  amount: number;
  description: string;
  source: string;
  createdAt: string;
}

const typeIcons: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  cashback: { icon: DollarSign, color: "text-green-500", bgColor: "bg-green-500/10" },
  pool_reward: { icon: Award, color: "text-secondary", bgColor: "bg-secondary/10" },
  referral: { icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  income: { icon: TrendingUp, color: "text-green-500", bgColor: "bg-green-500/10" },
};

export default function PartnerEarningsPage() {
  const { t } = useTranslation();
  const { partner } = useAuth();

  const typeLabels: Record<string, string> = {
    cashback: t("partner.earnings.cashback"),
    pool_reward: t("partner.earnings.rwaDividend"),
    referral: t("partner.earnings.referralReward"),
    income: t("partner.earnings.income"),
  };

  const { data: earnings = [], isLoading } = useQuery({
    queryKey: ["partner-earnings", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];

      const { data, error } = await supabase
        .from("cash_wallet_ledger")
        .select("*")
        .eq("partner_id", partner.id)
        .gt("amount", 0)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching earnings:", error);
        return [];
      }

      return (data || []).map((row): EarningEntry => ({
        id: row.id,
        type: row.type,
        amount: row.amount,
        description: row.description || "",
        source: row.reference_type || row.type,
        createdAt: row.created_at,
      }));
    },
    enabled: !!partner?.id,
  });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthStr = lastMonth.toISOString().slice(0, 7);

  const stats = {
    totalEarnings: earnings.reduce((sum, e) => sum + e.amount, 0) / 100,
    thisMonthEarnings: earnings.filter(e => e.createdAt?.startsWith(currentMonth)).reduce((sum, e) => sum + e.amount, 0) / 100,
    lastMonthEarnings: earnings.filter(e => e.createdAt?.startsWith(lastMonthStr)).reduce((sum, e) => sum + e.amount, 0) / 100,
    cashbackTotal: earnings.filter(e => e.type === "cashback").reduce((sum, e) => sum + e.amount, 0) / 100,
    rwaTotal: earnings.filter(e => e.type === "pool_reward").reduce((sum, e) => sum + e.amount, 0) / 100,
    referralTotal: earnings.filter(e => e.type === "referral").reduce((sum, e) => sum + e.amount, 0) / 100,
  };

  const growthPercent = stats.lastMonthEarnings > 0
    ? ((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings * 100).toFixed(1)
    : "0";

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-earnings-title">{t("partner.earnings.title")}</h1>
          <p className="text-muted-foreground">{t("partner.earnings.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{t("partner.earnings.totalEarnings")}</p>
                  <h2 className="text-4xl font-bold text-primary">RM {stats.totalEarnings.toFixed(2)}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className="bg-green-500/20 text-green-500">
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                      +{growthPercent}%
                    </Badge>
                    <span className="text-sm text-muted-foreground">{t("partner.earnings.vsLastMonth")}</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <Badge variant="outline">{t("partner.earnings.thisMonth")}</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">RM {stats.thisMonthEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("partner.earnings.thisMonthEarnings")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <Badge variant="outline">{t("partner.earnings.lastMonth")}</Badge>
              </div>
              <p className="text-3xl font-bold text-foreground">RM {stats.lastMonthEarnings.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">{t("partner.earnings.lastMonthEarnings")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("partner.earnings.cashback")}</p>
                  <p className="text-xl font-bold">RM {stats.cashbackTotal.toFixed(2)}</p>
                </div>
                {stats.totalEarnings > 0 && (
                  <Badge className="bg-green-500/10 text-green-500">
                    {((stats.cashbackTotal / stats.totalEarnings) * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("partner.earnings.rwaDividend")}</p>
                  <p className="text-xl font-bold">RM {stats.rwaTotal.toFixed(2)}</p>
                </div>
                {stats.totalEarnings > 0 && (
                  <Badge className="bg-secondary/10 text-secondary">
                    {((stats.rwaTotal / stats.totalEarnings) * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t("partner.earnings.referralReward")}</p>
                  <p className="text-xl font-bold">RM {stats.referralTotal.toFixed(2)}</p>
                </div>
                {stats.totalEarnings > 0 && (
                  <Badge className="bg-blue-500/10 text-blue-500">
                    {((stats.referralTotal / stats.totalEarnings) * 100).toFixed(0)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  {t("partner.earnings.history")}
                </CardTitle>
                <CardDescription>{t("partner.earnings.historyDesc")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" data-testid="button-filter-earnings">
                  <Filter className="w-4 h-4 mr-1" />
                  {t("partner.earnings.filter")}
                </Button>
                <Button variant="outline" size="sm" data-testid="button-export-earnings">
                  <Download className="w-4 h-4 mr-1" />
                  {t("partner.earnings.export")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all" data-testid="tab-all-earnings">{t("partner.earnings.tabs.all")}</TabsTrigger>
                <TabsTrigger value="cashback" data-testid="tab-cashback">{t("partner.earnings.cashback")}</TabsTrigger>
                <TabsTrigger value="pool_reward" data-testid="tab-rwa-earnings">{t("partner.earnings.rwaDividend")}</TabsTrigger>
                <TabsTrigger value="referral" data-testid="tab-referral">{t("partner.earnings.referralReward")}</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-0">
                <div className="divide-y">
                  {earnings.map((earning) => {
                    const icons = typeIcons[earning.type] || typeIcons.income;
                    const TypeIcon = icons.icon;
                    return (
                      <div
                        key={earning.id}
                        className="flex items-center justify-between py-4"
                        data-testid={`earning-${earning.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${icons.bgColor}`}>
                            <TypeIcon className={`w-5 h-5 ${icons.color}`} />
                          </div>
                          <div>
                            <p className="font-medium">{earning.description || typeLabels[earning.type] || earning.type}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">{formatDate(earning.createdAt)}</span>
                              <Badge variant="outline" className="text-xs">{earning.source}</Badge>
                            </div>
                          </div>
                        </div>
                        <p className={`font-bold ${icons.color}`}>+RM {(earning.amount / 100).toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
                {earnings.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t("partner.earnings.noRecords")}</p>
                  </div>
                )}
              </TabsContent>

              {["cashback", "pool_reward", "referral"].map((type) => (
                <TabsContent key={type} value={type} className="space-y-0">
                  <div className="divide-y">
                    {earnings.filter(e => e.type === type).map((earning) => {
                      const icons = typeIcons[earning.type] || typeIcons.income;
                      const TypeIcon = icons.icon;
                      return (
                        <div
                          key={earning.id}
                          className="flex items-center justify-between py-4"
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${icons.bgColor}`}>
                              <TypeIcon className={`w-5 h-5 ${icons.color}`} />
                            </div>
                            <div>
                              <p className="font-medium">{earning.description || typeLabels[earning.type] || earning.type}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">{formatDate(earning.createdAt)}</span>
                                <Badge variant="outline" className="text-xs">{earning.source}</Badge>
                              </div>
                            </div>
                          </div>
                          <p className={`font-bold ${icons.color}`}>+RM {(earning.amount / 100).toFixed(2)}</p>
                        </div>
                      );
                    })}
                  </div>
                  {earnings.filter(e => e.type === type).length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>{t("partner.earnings.noRecordsForType")}</p>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
