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
  Star, ArrowUpRight, ArrowDownRight, Gift, ShoppingBag,
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
    fromReferrals: ledger.filter(l => l.type === "bonus" && l.description?.includes("推荐")).reduce((sum, l) => sum + l.points, 0),
    fromReplenishment: ledger.filter(l => l.type === "bonus" && l.description?.includes("补货")).reduce((sum, l) => sum + l.points, 0),
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
          <h1 className="text-2xl font-serif text-primary" data-testid="text-ly-points-title">{t("partner.lyPoints.title")}</h1>
          <p className="text-muted-foreground">{t("partner.lyPoints.subtitle")}</p>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Star className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("partner.lyPoints.currentBalance")}</p>
                  <h2 className="text-4xl font-bold text-primary">{stats.totalBalance.toLocaleString()}</h2>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" data-testid="button-redeem">
                  <Gift className="w-4 h-4 mr-2" />
                  {t("partner.lyPoints.redeemGift")}
                </Button>
                <Button data-testid="button-use-points">
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  {t("partner.lyPoints.usePoints")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">{t("partner.lyPoints.totalEarned")}</span>
              </div>
              <p className="text-2xl font-bold text-green-500">+{stats.totalEarned.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownRight className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">{t("partner.lyPoints.totalSpent")}</span>
              </div>
              <p className="text-2xl font-bold text-orange-500">-{stats.totalSpent.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">{t("partner.lyPoints.fromReferrals")}</span>
              </div>
              <p className="text-2xl font-bold text-primary">+{stats.fromReferrals.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag className="w-4 h-4 text-secondary" />
                <span className="text-xs text-muted-foreground">{t("partner.lyPoints.fromReplenishment")}</span>
              </div>
              <p className="text-2xl font-bold text-secondary">+{stats.fromReplenishment.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  {t("partner.lyPoints.history")}
                </CardTitle>
                <CardDescription>{t("partner.lyPoints.historyDesc")}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" data-testid="button-filter-ledger">
                  <Filter className="w-4 h-4 mr-1" />
                  {t("partner.lyPoints.filter")}
                </Button>
                <Button variant="outline" size="sm" data-testid="button-export-ledger">
                  <Download className="w-4 h-4 mr-1" />
                  {t("partner.lyPoints.export")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all" data-testid="tab-all-ledger">{t("partner.lyPoints.tabs.all")}</TabsTrigger>
                <TabsTrigger value="earn" data-testid="tab-earn">{t("partner.lyPoints.tabs.earn")}</TabsTrigger>
                <TabsTrigger value="spend" data-testid="tab-spend">{t("partner.lyPoints.tabs.spend")}</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-0">
                <div className="divide-y">
                  {ledger.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-4"
                      data-testid={`ledger-item-${item.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.points > 0 ? "bg-green-500/10" : "bg-orange-500/10"
                        }`}>
                          {item.points > 0 ? (
                            <ArrowUpRight className="w-5 h-5 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{item.description || item.type}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${item.points > 0 ? "text-green-500" : "text-orange-500"}`}>
                          {item.points > 0 ? "+" : ""}{item.points.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {ledger.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t("partner.lyPoints.noRecords")}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="earn" className="space-y-0">
                <div className="divide-y">
                  {ledger.filter(i => i.points > 0).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium">{item.description || item.type}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-500">+{item.points.toLocaleString()}</p>
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
                      className="flex items-center justify-between py-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                          <ArrowDownRight className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                          <p className="font-medium">{item.description || item.type}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-orange-500">{item.points.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4">{t("partner.lyPoints.rulesTitle")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("partner.lyPoints.earnBadge")}</Badge>
                  {t("partner.lyPoints.ruleEarn1")}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("partner.lyPoints.earnBadge")}</Badge>
                  {t("partner.lyPoints.ruleEarn2")}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("partner.lyPoints.earnBadge")}</Badge>
                  {t("partner.lyPoints.ruleEarn3")}
                </p>
              </div>
              <div className="space-y-2">
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("partner.lyPoints.useBadge")}</Badge>
                  {t("partner.lyPoints.ruleUse1")}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("partner.lyPoints.useBadge")}</Badge>
                  {t("partner.lyPoints.ruleUse2")}
                </p>
                <p className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{t("partner.lyPoints.noteBadge")}</Badge>
                  {t("partner.lyPoints.ruleNote")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
