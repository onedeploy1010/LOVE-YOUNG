import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PartnerLayout } from "@/components/PartnerLayout";
import {
  TrendingUp, Users, Wallet, Award, Share2,
  ArrowUpRight, ArrowDownRight, Copy, Check,
  Crown, Star, Target, Zap
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export default function PartnerDashboardPage() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  
  const getTierLabel = (tier: string) => {
    const tierMap: Record<string, string> = {
      "phase1": t("member.partnerDashboard.tiers.phase1"),
      "phase2": t("member.partnerDashboard.tiers.phase2"),
      "phase3": t("member.partnerDashboard.tiers.phase3")
    };
    return tierMap[tier] || tier;
  };
  
  const mockData = {
    referralCode: "LY8X9K2M",
    tier: "phase1",
    lyBalance: 2000,
    cashBalance: 450.00,
    rwaTokens: 15,
    totalReferrals: 12,
    activeReferrals: 8,
    monthlyEarnings: 380.00,
    lastMonthEarnings: 320.00,
    totalEarnings: 2850.00,
    currentCycle: 3,
    cycleProgress: 65,
    nextPayout: "2026-02-01"
  };

  const earningsChange = ((mockData.monthlyEarnings - mockData.lastMonthEarnings) / mockData.lastMonthEarnings * 100).toFixed(1);
  const isPositive = mockData.monthlyEarnings >= mockData.lastMonthEarnings;

  const copyReferralCode = () => {
    navigator.clipboard.writeText(mockData.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                <h2 className="text-2xl font-bold text-primary">{getTierLabel(mockData.tier)}</h2>
                <Badge className="mt-1 bg-secondary/20 text-secondary">{t("member.partnerDashboard.partnerBadge")}</Badge>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.myReferralCode")}</p>
              <div className="flex items-center gap-2">
                <code className="px-4 py-2 bg-background rounded-lg font-mono text-lg font-bold text-primary">
                  {mockData.referralCode}
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
              <p className="text-3xl font-bold text-foreground">{mockData.lyBalance.toLocaleString()}</p>
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
              <p className="text-3xl font-bold text-foreground">RM {mockData.cashBalance.toFixed(2)}</p>
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
              <p className="text-3xl font-bold text-foreground">{mockData.rwaTokens}</p>
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
              <p className="text-3xl font-bold text-foreground">{mockData.totalReferrals}</p>
              <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.activeMembers").replace("{count}", String(mockData.activeReferrals))}</p>
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
              <p className="text-4xl font-bold text-foreground">RM {mockData.monthlyEarnings.toFixed(2)}</p>
              <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {earningsChange}%
              </div>
            </div>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.totalEarnings")}</p>
                <p className="text-xl font-bold text-foreground">RM {mockData.totalEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.lastMonthEarnings")}</p>
                <p className="text-xl font-bold text-foreground">RM {mockData.lastMonthEarnings.toFixed(2)}</p>
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
            <CardDescription>{t("member.partnerDashboard.cycleDesc").replace("{cycle}", String(mockData.currentCycle))}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{t("member.partnerDashboard.cycleProgress")}</span>
                  <span className="font-medium">{mockData.cycleProgress}%</span>
                </div>
                <Progress value={mockData.cycleProgress} className="h-3" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t("member.partnerDashboard.nextPayoutDate")}</p>
                  <p className="font-medium text-foreground">{mockData.nextPayout}</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-view-rwa">
                  {t("member.partnerDashboard.viewDetails")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
