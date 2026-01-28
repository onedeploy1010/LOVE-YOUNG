import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PartnerLayout } from "@/components/PartnerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import {
  Award, Clock, CheckCircle, Coins,
  Calendar, Info, Loader2
} from "lucide-react";

interface BonusCycle {
  id: string;
  cycleNumber: number;
  status: string;
  startDate: string;
  endDate: string;
  poolAmount: number;
  totalTokens: number;
}

interface TokenHistory {
  id: string;
  tokens: number;
  source: string;
  createdAt: string;
}

export default function PartnerRwaPage() {
  const { t } = useTranslation();
  const { partner } = useAuth();

  const { data: cycles = [], isLoading: cyclesLoading } = useQuery({
    queryKey: ["bonus-pool-cycles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bonus_pool_cycles")
        .select("*")
        .order("cycle_number", { ascending: false })
        .limit(10);

      if (error) {
        console.error("Error fetching cycles:", error);
        return [];
      }

      return (data || []).map((row): BonusCycle => ({
        id: row.id,
        cycleNumber: row.cycle_number,
        status: row.status,
        startDate: row.start_date,
        endDate: row.end_date,
        poolAmount: row.pool_amount || 0,
        totalTokens: row.total_tokens || 0,
      }));
    },
  });

  const { data: tokenHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["partner-rwa-history", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];

      const { data, error } = await supabase
        .from("rwa_token_ledger")
        .select("*")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching token history:", error);
        return [];
      }

      return (data || []).map((row): TokenHistory => ({
        id: row.id,
        tokens: row.tokens,
        source: row.source,
        createdAt: row.created_at,
      }));
    },
    enabled: !!partner?.id,
  });

  const activeCycle = cycles.find(c => c.status === "active");

  const stats = {
    totalTokens: partner?.rwaTokens || 0,
    totalDividends: 0,
    currentCycleEstimate: 0,
    avgDividendPerToken: 0,
  };

  if (activeCycle && activeCycle.totalTokens > 0 && stats.totalTokens > 0) {
    stats.currentCycleEstimate = (activeCycle.poolAmount / activeCycle.totalTokens) * stats.totalTokens / 100;
    stats.avgDividendPerToken = activeCycle.poolAmount / activeCycle.totalTokens / 100;
  }

  const calculateProgress = (cycle: BonusCycle) => {
    if (cycle.status !== "active") return 100;
    const start = new Date(cycle.startDate).getTime();
    const end = new Date(cycle.endDate).getTime();
    const now = Date.now();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return dateStr.split("T")[0];
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      package: "套餐购买",
      network_order: "网络订单奖励",
      milestone: "里程碑奖励",
      referral: "推荐奖励",
    };
    return labels[source] || source;
  };

  const isLoading = cyclesLoading || historyLoading;

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
          <h1 className="text-2xl font-serif text-primary" data-testid="text-rwa-title">{t("partner.rwa.title")}</h1>
          <p className="text-muted-foreground">{t("partner.rwa.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Award className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">我的RWA令牌</p>
                    <h2 className="text-3xl font-bold text-primary">{stats.totalTokens} <span className="text-lg font-normal">枚</span></h2>
                  </div>
                </div>
                <Badge className="bg-secondary/20 text-secondary">活跃持有</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-secondary">RM {stats.totalDividends.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">累计分红</p>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">RM {stats.currentCycleEstimate.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">本期预估</p>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">RM {stats.avgDividendPerToken.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">平均每令牌</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                当前周期
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeCycle ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge>第 {activeCycle.cycleNumber} 期</Badge>
                    <Badge variant="outline" className="text-green-500 border-green-500">进行中</Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">周期进度</span>
                      <span className="font-medium">{Math.round(calculateProgress(activeCycle))}%</span>
                    </div>
                    <Progress value={calculateProgress(activeCycle)} className="h-2" />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">开始日期</p>
                      <p className="font-medium">{formatDate(activeCycle.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">结束日期</p>
                      <p className="font-medium">{formatDate(activeCycle.endDate)}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">本期奖金池</p>
                    <p className="text-xl font-bold text-secondary">RM {(activeCycle.poolAmount / 100).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>暂无活跃周期</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                分红周期历史
              </CardTitle>
              <CardDescription>过往周期的分红记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cycles.length > 0 ? cycles.map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`cycle-${cycle.cycleNumber}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        cycle.status === "active" ? "bg-green-500/10" : "bg-muted"
                      }`}>
                        {cycle.status === "active" ? (
                          <Clock className="w-5 h-5 text-green-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">第 {cycle.cycleNumber} 期</p>
                          {cycle.status === "active" && (
                            <Badge className="bg-green-500/10 text-green-500 text-xs">进行中</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(cycle.startDate)} ~ {formatDate(cycle.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-secondary">RM {(cycle.poolAmount / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{cycle.totalTokens || 0} 令牌参与</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无分红周期记录</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-secondary" />
                令牌获得记录
              </CardTitle>
              <CardDescription>RWA令牌来源明细</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tokenHistory.length > 0 ? tokenHistory.map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                    data-testid={`token-history-${token.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Award className="w-4 h-4 text-secondary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{getSourceLabel(token.source)}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(token.createdAt)}</p>
                      </div>
                    </div>
                    <Badge className="bg-secondary/20 text-secondary">+{token.tokens} 枚</Badge>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>暂无令牌获得记录</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-2">RWA奖金池规则说明</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>1. RWA奖金池每10天为一个分红周期，销售额的30%注入奖金池</p>
                  <p>2. 购买套餐、推荐新经营人等行为可获得RWA令牌</p>
                  <p>3. 周期结束后，奖金池按令牌比例分配给所有持有者</p>
                  <p>4. 令牌为永久持有，可持续参与每期分红</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
