import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberLayout } from "@/components/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  Gift, Star, TrendingUp, Clock, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Info, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PointsRecord {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  balance_after: number;
}

export default function MemberPointsPage() {
  const { t } = useTranslation();
  const { member } = useAuth();

  // Get points history from member_points_ledger if exists, otherwise use empty array
  const { data: pointsHistory = [], isLoading } = useQuery({
    queryKey: ["member-points-history", member?.id],
    queryFn: async () => {
      if (!member?.id) return [];

      // Try to fetch from member_points_ledger if it exists
      const { data, error } = await supabase
        .from("member_points_ledger")
        .select("*")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        // Table might not exist, return empty
        console.log("Points ledger not available:", error.message);
        return [];
      }

      return (data || []).map((record): PointsRecord => ({
        id: record.id,
        type: record.amount >= 0 ? "earn" : "spend",
        amount: Math.abs(record.amount),
        description: record.description || "积分变动",
        created_at: record.created_at,
        balance_after: record.balance_after || 0,
      }));
    },
    enabled: !!member?.id,
  });

  const totalPoints = member?.pointsBalance || 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const thisMonthEarned = pointsHistory
    .filter(r => r.type === "earn" && r.created_at?.startsWith(currentMonth))
    .reduce((sum, r) => sum + r.amount, 0);

  const stats = {
    totalPoints,
    thisMonthEarned,
    expiringSoon: 0,
    expiryDate: "2026-12-31",
    nextTierPoints: 2000,
    currentTier: totalPoints >= 1000 ? "金卡会员" : "银卡会员",
    nextTier: "金卡会员",
  };

  const tierProgress = (stats.totalPoints / stats.nextTierPoints) * 100;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-points-title">{t("member.points.title")}</h1>
          <p className="text-muted-foreground">{t("member.points.subtitle")}</p>
        </div>

        <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Star className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("member.points.currentPoints")}</p>
                  <p className="text-4xl font-bold text-secondary" data-testid="text-total-points">{stats.totalPoints}</p>
                  <Badge variant="secondary" className="mt-1">{stats.currentTier}</Badge>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.thisMonthEarned}</div>
                  <p className="text-sm text-muted-foreground">{t("member.points.earnedThisMonth")}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{stats.expiringSoon}</div>
                  <p className="text-sm text-muted-foreground">{t("member.points.expiringSoon")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              {t("member.points.tierProgress")}
            </CardTitle>
            <CardDescription>
              {t("member.points.tierProgressDesc").replace("{nextTier}", stats.nextTier).replace("{points}", String(Math.max(0, stats.nextTierPoints - stats.totalPoints)))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{stats.currentTier}</span>
                <span className="text-muted-foreground">{stats.nextTier}</span>
              </div>
              <Progress value={Math.min(100, tierProgress)} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stats.totalPoints} {t("member.points.points")}</span>
                <span className="text-muted-foreground">{stats.nextTierPoints} {t("member.points.points")}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover-elevate cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">{t("member.points.redeem")}</h3>
                <p className="text-sm text-muted-foreground">{t("member.points.redeemRate")}</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-redeem">{t("member.points.redeemNow")}</Button>
            </CardContent>
          </Card>

          <Link href="/products">
            <Card className="hover-elevate cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{t("member.points.earnPoints")}</h3>
                  <p className="text-sm text-muted-foreground">{t("member.points.earnRate")}</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-shop">{t("member.points.goShop")}</Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t("member.points.history")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">{t("member.points.tabAll")}</TabsTrigger>
                <TabsTrigger value="earn" data-testid="tab-earn">{t("member.points.tabEarn")}</TabsTrigger>
                <TabsTrigger value="spend" data-testid="tab-spend">{t("member.points.tabSpend")}</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                {pointsHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无积分记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pointsHistory.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg" data-testid={`record-${record.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${record.type === "spend" ? "bg-red-500/10" : "bg-green-500/10"}`}>
                            {record.type === "spend" ? (
                              <ArrowDownRight className="w-4 h-4 text-red-500" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{record.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(record.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${record.type === "spend" ? "text-red-500" : "text-green-500"}`}>
                            {record.type === "spend" ? "-" : "+"}{record.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">{t("member.points.balance")}: {record.balance_after}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              <TabsContent value="earn" className="mt-4">
                <div className="space-y-3">
                  {pointsHistory.filter(r => r.type !== "spend").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>暂无获取记录</p>
                    </div>
                  ) : (
                    pointsHistory.filter(r => r.type !== "spend").map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10">
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{record.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(record.created_at)}</p>
                          </div>
                        </div>
                        <p className="font-bold text-green-500">+{record.amount}</p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="spend" className="mt-4">
                <div className="space-y-3">
                  {pointsHistory.filter(r => r.type === "spend").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>暂无使用记录</p>
                    </div>
                  ) : (
                    pointsHistory.filter(r => r.type === "spend").map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10">
                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{record.description}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(record.created_at)}</p>
                          </div>
                        </div>
                        <p className="font-bold text-red-500">-{record.amount}</p>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t("member.points.rulesTitle")}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{t("member.points.rule1")}</li>
                <li>{t("member.points.rule2")}</li>
                <li>{t("member.points.rule3")}</li>
                <li>{t("member.points.rule4")}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
