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
      package: t("member.rwa.sourcePackage"),
      network_order: t("member.rwa.sourceNetworkOrder"),
      milestone: t("member.rwa.sourceMilestone"),
      referral: t("member.rwa.sourceReferral"),
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
          <h1 className="text-2xl font-serif text-primary" data-testid="text-rwa-title">{t("member.rwa.title")}</h1>
          <p className="text-muted-foreground">{t("member.rwa.subtitle")}</p>
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
                    <p className="text-sm text-muted-foreground">{t("member.rwa.myTokens")}</p>
                    <h2 className="text-3xl font-bold text-primary">{stats.totalTokens} <span className="text-lg font-normal">{t("member.rwa.tokenUnit")}</span></h2>
                  </div>
                </div>
                <Badge className="bg-secondary/20 text-secondary">{t("member.rwa.activeHolding")}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-secondary">RM {stats.totalDividends.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{t("member.rwa.totalDividends")}</p>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">RM {stats.currentCycleEstimate.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{t("member.rwa.currentEstimate")}</p>
                </div>
                <div className="text-center p-3 bg-background/50 rounded-lg">
                  <p className="text-2xl font-bold text-foreground">RM {stats.avgDividendPerToken.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{t("member.rwa.avgPerToken")}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {t("member.rwa.currentCycle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeCycle ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Badge>{t("member.rwa.cycle").replace("{n}", String(activeCycle.cycleNumber))}</Badge>
                    <Badge variant="outline" className="text-green-500 border-green-500">{t("member.rwa.active")}</Badge>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{t("member.rwa.cycleProgress")}</span>
                      <span className="font-medium">{Math.round(calculateProgress(activeCycle))}%</span>
                    </div>
                    <Progress value={calculateProgress(activeCycle)} className="h-2" />
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("member.rwa.startDate")}</p>
                      <p className="font-medium">{formatDate(activeCycle.startDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("member.rwa.endDate")}</p>
                      <p className="font-medium">{formatDate(activeCycle.endDate)}</p>
                    </div>
                  </div>
                  <div className="p-3 bg-secondary/10 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">{t("member.rwa.currentPool")}</p>
                    <p className="text-xl font-bold text-secondary">RM {(activeCycle.poolAmount / 100).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{t("member.rwa.noCycle")}</p>
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
                {t("member.rwa.cycleHistory")}
              </CardTitle>
              <CardDescription>{t("member.rwa.cycleHistoryDesc")}</CardDescription>
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
                          <p className="font-medium">{t("member.rwa.cycle").replace("{n}", String(cycle.cycleNumber))}</p>
                          {cycle.status === "active" && (
                            <Badge className="bg-green-500/10 text-green-500 text-xs">{t("member.rwa.active")}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(cycle.startDate)} ~ {formatDate(cycle.endDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-secondary">RM {(cycle.poolAmount / 100).toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{cycle.totalTokens || 0} {t("member.rwa.tokensParticipated")}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t("member.rwa.noCycles")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-secondary" />
                {t("member.rwa.tokenHistory")}
              </CardTitle>
              <CardDescription>{t("member.rwa.tokenHistoryDesc")}</CardDescription>
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
                    <Badge className="bg-secondary/20 text-secondary">+{token.tokens} {t("member.rwa.tokenUnit")}</Badge>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Coins className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t("member.rwa.noTokens")}</p>
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
                <h3 className="font-bold mb-2">{t("member.rwa.howItWorks")}</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>{t("member.rwa.rule1")}</p>
                  <p>{t("member.rwa.rule2")}</p>
                  <p>{t("member.rwa.rule3")}</p>
                  <p>{t("member.rwa.rule4")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
