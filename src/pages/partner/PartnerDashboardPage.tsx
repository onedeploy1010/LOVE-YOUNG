import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PartnerLayout } from "@/components/PartnerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  TrendingUp, Users, Wallet, Award, Share2,
  ArrowUpRight, ArrowDownRight, Copy, Check,
  Crown, Star, Target, Zap, Loader2, Package, AlertCircle
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export default function PartnerDashboardPage() {
  const { t } = useTranslation();
  const { partner, member } = useAuth();
  const [copied, setCopied] = useState(false);

  // Fetch partner stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["partner-dashboard-stats", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return null;

      // Get referral count
      const { count: referralCount } = await supabase
        .from("partners")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", partner.id);

      // Get active referral count
      const { count: activeReferralCount } = await supabase
        .from("partners")
        .select("*", { count: "exact", head: true })
        .eq("referrer_id", partner.id)
        .eq("status", "active");

      // Get current month earnings from cash_wallet_ledger
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: monthlyEarnings } = await supabase
        .from("cash_wallet_ledger")
        .select("amount")
        .eq("partner_id", partner.id)
        .gte("created_at", `${currentMonth}-01`);

      const thisMonthTotal = monthlyEarnings?.reduce((sum, e) => sum + (e.amount > 0 ? e.amount : 0), 0) || 0;

      // Get last month earnings
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const lastMonthStr = lastMonth.toISOString().slice(0, 7);
      const { data: lastMonthEarnings } = await supabase
        .from("cash_wallet_ledger")
        .select("amount")
        .eq("partner_id", partner.id)
        .gte("created_at", `${lastMonthStr}-01`)
        .lt("created_at", `${currentMonth}-01`);

      const lastMonthTotal = lastMonthEarnings?.reduce((sum, e) => sum + (e.amount > 0 ? e.amount : 0), 0) || 0;

      // Get total earnings
      const { data: totalEarnings } = await supabase
        .from("cash_wallet_ledger")
        .select("amount")
        .eq("partner_id", partner.id)
        .gt("amount", 0);

      const totalEarningsAmount = totalEarnings?.reduce((sum, e) => sum + e.amount, 0) || 0;

      // Get blocked cashback count
      const { count: blockedCount } = await supabase
        .from("cashback_blocked_records")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", partner.id);

      // Get current bonus pool cycle
      const { data: currentCycle } = await supabase
        .from("bonus_pool_cycles")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      let cycleProgress = 0;
      let nextPayout = "";
      if (currentCycle) {
        const startDate = new Date(currentCycle.start_date);
        const endDate = new Date(currentCycle.end_date);
        const now = new Date();
        const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        const daysPassed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
        cycleProgress = Math.min(100, Math.max(0, (daysPassed / totalDays) * 100));
        nextPayout = currentCycle.end_date;
      }

      return {
        totalReferrals: referralCount || 0,
        activeReferrals: activeReferralCount || 0,
        monthlyEarnings: thisMonthTotal,
        lastMonthEarnings: lastMonthTotal,
        totalEarnings: totalEarningsAmount,
        blockedCashback: blockedCount || 0,
        currentCycle: currentCycle?.cycle_number || 1,
        cycleProgress,
        nextPayout,
      };
    },
    enabled: !!partner?.id,
  });

  const getTierLabel = (tier: string) => {
    const tierMap: Record<string, string> = {
      "phase1": t("member.partnerDashboard.tiers.phase1"),
      "phase2": t("member.partnerDashboard.tiers.phase2"),
      "phase3": t("member.partnerDashboard.tiers.phase3")
    };
    return tierMap[tier] || tier;
  };

  const formatCurrency = (amount: number) => {
    return `RM ${(amount / 100).toFixed(2)}`;
  };

  const earningsChange = stats && stats.lastMonthEarnings > 0
    ? ((stats.monthlyEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings * 100).toFixed(1)
    : "0";
  const isPositive = stats ? stats.monthlyEarnings >= stats.lastMonthEarnings : true;

  const copyReferralCode = () => {
    if (partner?.referralCode) {
      navigator.clipboard.writeText(partner.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
          <h1 className="text-2xl font-serif text-primary" data-testid="text-partner-dashboard-title">{t("member.partnerDashboard.title")}</h1>
          <p className="text-muted-foreground">{t("member.partnerDashboard.subtitle")}</p>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Crown className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.currentTier")}</p>
                  <h2 className="text-2xl font-bold text-primary">{getTierLabel(partner?.tier || "phase1")}</h2>
                  <Badge className="mt-1 bg-secondary/20 text-secondary">{t("member.partnerDashboard.partnerBadge")}</Badge>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end gap-2">
                <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.myReferralCode")}</p>
                <div className="flex items-center gap-2">
                  <code className="px-4 py-2 bg-background rounded-lg font-mono text-lg font-bold text-primary">
                    {partner?.referralCode || "--------"}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={copyReferralCode}
                    data-testid="button-copy-referral"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card data-testid="card-ly-balance">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-xs">{t("member.partnerDashboard.lyPoints")}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{(partner?.lyBalance || 0).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.lyBalance")}</p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-cash-balance">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-green-500" />
                </div>
                <Badge variant="outline" className="text-xs">{t("member.partnerDashboard.cashWallet")}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{formatCurrency(partner?.cashWalletBalance || 0)}</p>
                <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.cashBalance")}</p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-rwa-tokens">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Award className="w-5 h-5 text-secondary" />
                </div>
                <Badge variant="outline" className="text-xs">{t("member.partnerDashboard.rwaToken")}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{partner?.rwaTokens || 0}</p>
                <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.rwaBalance")}</p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-referrals">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <Badge variant="outline" className="text-xs">{t("member.partnerDashboard.referralNetwork")}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-foreground">{stats?.totalReferrals || 0}</p>
                <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.activeMembers").replace("{count}", String(stats?.activeReferrals || 0))}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                {t("member.partnerDashboard.monthlyEarnings")}
              </CardTitle>
              <CardDescription>{t("member.partnerDashboard.earningsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4 mb-6">
                <p className="text-4xl font-bold text-foreground">{formatCurrency(stats?.monthlyEarnings || 0)}</p>
                <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                  {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {earningsChange}%
                </div>
              </div>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.totalEarnings")}</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(stats?.totalEarnings || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.lastMonthEarnings")}</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(stats?.lastMonthEarnings || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-secondary" />
                {t("member.partnerDashboard.rwaCycle")}
              </CardTitle>
              <CardDescription>{t("member.partnerDashboard.cycleDesc").replace("{cycle}", String(stats?.currentCycle || 1))}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{t("member.partnerDashboard.cycleProgress")}</span>
                    <span className="font-medium">{Math.round(stats?.cycleProgress || 0)}%</span>
                  </div>
                  <Progress value={stats?.cycleProgress || 0} className="h-3" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.nextPayoutDate")}</p>
                    <p className="font-medium text-foreground">{stats?.nextPayout || "-"}</p>
                  </div>
                  <Button variant="outline" size="sm" data-testid="button-view-rwa">
                    {t("member.partnerDashboard.viewDetails")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cashback Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              {t("member.partnerDashboard.cashbackProgress")}
            </CardTitle>
            <CardDescription>{t("member.partnerDashboard.cashbackProgressDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{t("member.partnerDashboard.boxesProcessed")}</span>
                  <span className="font-medium">
                    {partner?.totalBoxesProcessed || 0} / {(partner?.packagesPurchased || 1) * 5}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, ((partner?.totalBoxesProcessed || 0) / ((partner?.packagesPurchased || 1) * 5)) * 100)}
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {(partner?.totalBoxesProcessed || 0) < (partner?.packagesPurchased || 1) * 5
                    ? t("member.partnerDashboard.currentRate50")
                    : t("member.partnerDashboard.currentRate30")}
                </p>
              </div>
              {(stats?.blockedCashback || 0) > 0 && (
                <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  <p className="text-sm text-orange-500">
                    {t("member.partnerDashboard.blockedCashback").replace("{count}", String(stats?.blockedCashback || 0))}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              {t("member.partnerDashboard.quickActions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-share-materials">
                <Share2 className="w-5 h-5" />
                <span>{t("member.partnerDashboard.promoMaterials")}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-invite-friends">
                <Users className="w-5 h-5" />
                <span>{t("member.partnerDashboard.inviteFriends")}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-withdraw">
                <Wallet className="w-5 h-5" />
                <span>{t("member.partnerDashboard.withdraw")}</span>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-upgrade">
                <Zap className="w-5 h-5" />
                <span>{t("member.partnerDashboard.upgradePlan")}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
