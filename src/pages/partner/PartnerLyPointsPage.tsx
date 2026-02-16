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
  Star, ArrowUpRight, ArrowDownRight,
  Users, TrendingUp, History, Filter, Download, Loader2
} from "lucide-react";

interface LyLedgerEntry {
  id: string;
  type: string;
  points: number;
  description: string;
  createdAt: string;
}

export default function PartnerLyPointsPage() {
  const { t } = useTranslation();
  const { partner } = useAuth();

  const { data: ledger = [], isLoading } = useQuery({
    queryKey: ["partner-ly-ledger", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];

      const { data, error } = await supabase
        .from("ly_points_ledger")
        .select("*")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Error fetching LY ledger:", error);
        return [];
      }

      return (data || []).map((row): LyLedgerEntry => ({
        id: row.id,
        type: row.type,
        points: row.points,
        description: row.description || "",
        createdAt: row.created_at,
      }));
    },
    enabled: !!partner?.id,
  });

  const stats = {
    totalBalance: partner?.lyBalance || 0,
    totalEarned: ledger.filter(l => l.points > 0).reduce((sum, l) => sum + l.points, 0),
    totalSpent: Math.abs(ledger.filter(l => l.points < 0).reduce((sum, l) => sum + l.points, 0)),
    fromNetwork: ledger.filter(l => l.type === "replenish").reduce((sum, l) => sum + l.points, 0),
  };

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
          <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-ly-points-title">{t("member.lyPoints.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("member.lyPoints.subtitle")}</p>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-secondary/20 flex items-center justify-center shrink-0">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-secondary" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("member.lyPoints.currentBalance")}</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-primary">{stats.totalBalance.toLocaleString()}</h2>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">{t("member.lyPoints.totalEarned")}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-500">+{stats.totalEarned.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">{t("member.lyPoints.totalSpent")}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-orange-500">-{stats.totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground leading-tight truncate">团队消费补充</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-primary">+{stats.fromNetwork.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <History className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  {t("member.lyPoints.history")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">{t("member.lyPoints.historyDesc")}</CardDescription>
              </div>
              <div className="flex gap-1.5 sm:gap-2 shrink-0">
                <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" data-testid="button-filter-ledger">
                  <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">{t("member.lyPoints.filter")}</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" data-testid="button-export-ledger">
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline ml-1">{t("member.lyPoints.export")}</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all" data-testid="tab-all-ledger">{t("member.lyPoints.tabs.all")}</TabsTrigger>
                <TabsTrigger value="earn" data-testid="tab-earn">{t("member.lyPoints.tabs.earn")}</TabsTrigger>
                <TabsTrigger value="spend" data-testid="tab-spend">{t("member.lyPoints.tabs.spend")}</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-0">
                <div className="divide-y">
                  {ledger.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 sm:py-4 gap-3"
                      data-testid={`ledger-item-${item.id}`}
                    >
                      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${
                          item.points > 0 ? "bg-green-500/10" : "bg-orange-500/10"
                        }`}>
                          {item.points > 0 ? (
                            <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{item.description || item.type}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold text-sm sm:text-base ${item.points > 0 ? "text-green-500" : "text-orange-500"}`}>
                          {item.points > 0 ? "+" : ""}{item.points.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {ledger.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t("member.lyPoints.noRecords")}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="earn" className="space-y-0">
                <div className="divide-y">
                  {ledger.filter(i => i.points > 0).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 sm:py-4 gap-3"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{item.description || item.type}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm sm:text-base text-green-500">+{item.points.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="spend" className="space-y-0">
                <div className="divide-y">
                  {ledger.filter(i => i.points < 0).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 sm:py-4 gap-3"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                          <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{item.description || item.type}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm sm:text-base text-orange-500">{item.points.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="p-4 sm:p-6">
            <h3 className="font-bold text-sm sm:text-base mb-3 sm:mb-4">{t("member.lyPoints.rulesTitle")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("member.lyPoints.earnBadge")}</Badge>
                  {t("member.lyPoints.ruleEarn1")}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("member.lyPoints.earnBadge")}</Badge>
                  {t("member.lyPoints.ruleEarn2")}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("member.lyPoints.earnBadge")}</Badge>
                  {t("member.lyPoints.ruleEarn3")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("member.lyPoints.useBadge")}</Badge>
                  {t("member.lyPoints.ruleUse1")}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("member.lyPoints.useBadge")}</Badge>
                  {t("member.lyPoints.ruleUse2")}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("member.lyPoints.noteBadge")}</Badge>
                  {t("member.lyPoints.ruleNote")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
