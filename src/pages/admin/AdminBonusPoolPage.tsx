import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  PiggyBank, TrendingUp, Clock, Users, DollarSign,
  Calendar, ArrowUpRight, Info, RefreshCw, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface BonusPoolCycle {
  id: string;
  cycle_number: number;
  start_date: string;
  end_date: string;
  total_pool: number;
  total_rwa_tokens: number;
  per_token_value: number;
  participating_partners: number;
  sales_in_cycle: number;
  status: string;
  created_at: string;
}

export default function AdminBonusPoolPage() {
  const { t } = useTranslation();

  // Fetch current and historical cycles
  const { data: cycles = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-bonus-pool-cycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonus_pool_cycles")
        .select("*")
        .order("cycle_number", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching bonus pool cycles:", error);
        return [];
      }

      return (data || []).map((c): BonusPoolCycle => ({
        id: c.id,
        cycle_number: c.cycle_number,
        start_date: c.start_date,
        end_date: c.end_date,
        total_pool: c.total_pool || 0,
        total_rwa_tokens: c.total_rwa_tokens || 0,
        per_token_value: c.per_token_value || 0,
        participating_partners: c.participating_partners || 0,
        sales_in_cycle: c.sales_in_cycle || 0,
        status: c.status || "pending",
        created_at: c.created_at,
      }));
    },
  });

  const currentCycle = cycles.find(c => c.status === "active") || cycles[0];
  const historyCycles = cycles.filter(c => c.status === "settled");

  // Calculate days remaining
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const daysRemaining = currentCycle ? getDaysRemaining(currentCycle.end_date) : 0;
  const progress = currentCycle ? ((10 - daysRemaining) / 10) * 100 : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-bonus-pool-title">{t("admin.bonusPoolPage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.bonusPoolPage.subtitle")}</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => refetch()} data-testid="button-refresh">
            <RefreshCw className="w-4 h-4" />
            {t("admin.bonusPoolPage.refreshData")}
          </Button>
        </div>

        {currentCycle ? (
          <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="w-6 h-6 text-secondary" />
                  {t("admin.bonusPoolPage.currentCycle")} #{currentCycle.cycle_number}
                </CardTitle>
                <Badge className={currentCycle.status === "active" ? "bg-green-500 text-white" : "bg-yellow-500"}>
                  {currentCycle.status === "active" ? t("admin.bonusPoolPage.inProgress") : currentCycle.status}
                </Badge>
              </div>
              <CardDescription>
                {formatDate(currentCycle.start_date)} ~ {formatDate(currentCycle.end_date)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{t("admin.bonusPoolPage.cycleProgress")}</span>
                  <span>{10 - daysRemaining}/10 {t("admin.bonusPoolPage.days")}</span>
                </div>
                <Progress value={progress} className="h-3" />
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {t("admin.bonusPoolPage.daysRemaining").replace("{days}", String(daysRemaining))}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-background rounded-lg">
                  <DollarSign className="w-6 h-6 mx-auto text-secondary mb-2" />
                  <p className="text-2xl font-bold text-secondary">RM {(currentCycle.total_pool / 100).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.bonusPoolPage.currentPool")}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold text-primary">RM {(currentCycle.per_token_value / 100).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.bonusPoolPage.perTokenValue")}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <Users className="w-6 h-6 mx-auto text-primary mb-2" />
                  <p className="text-2xl font-bold">{currentCycle.participating_partners}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.bonusPoolPage.participatingPartners")}</p>
                </div>
                <div className="text-center p-4 bg-background rounded-lg">
                  <ArrowUpRight className="w-6 h-6 mx-auto text-green-500 mb-2" />
                  <p className="text-2xl font-bold">RM {(currentCycle.sales_in_cycle / 100).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("admin.bonusPoolPage.cycleSales")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <PiggyBank className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">暂无活跃的分红周期</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {t("admin.bonusPoolPage.cycleSettings")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">{t("admin.bonusPoolPage.cycleLength")}</span>
                <span className="font-medium">10 {t("admin.bonusPoolPage.days")}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">{t("admin.bonusPoolPage.salesPoolRatio")}</span>
                <span className="font-medium text-secondary">30%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">{t("admin.bonusPoolPage.totalRwaTokens")}</span>
                <span className="font-medium">{currentCycle?.total_rwa_tokens || 0} {t("admin.bonusPoolPage.tokens")}</span>
              </div>
              <Button className="w-full" variant="outline" data-testid="button-edit-settings">
                {t("admin.bonusPoolPage.editSettings")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {t("admin.bonusPoolPage.dividendNote")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>{t("admin.bonusPoolPage.dividendDesc1")}</p>
              <ul className="list-disc list-inside space-y-1">
                <li>{t("admin.bonusPoolPage.dividendRule1")}</li>
                <li>{t("admin.bonusPoolPage.dividendRule2")}</li>
                <li>{t("admin.bonusPoolPage.dividendRule3")}</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {t("admin.bonusPoolPage.historyCycles")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyCycles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无历史周期记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {historyCycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`cycle-${cycle.cycle_number}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t("admin.bonusPoolPage.cycle")} #{cycle.cycle_number}</span>
                        <Badge variant="outline">{t("admin.bonusPoolPage.settled")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(cycle.start_date)} ~ {formatDate(cycle.end_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-secondary">RM {(cycle.total_pool / 100).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("admin.bonusPoolPage.perToken")} RM {(cycle.per_token_value / 100).toFixed(2)} · {cycle.participating_partners} {t("admin.bonusPoolPage.people")}
                      </p>
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
