import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Header } from "@/components/Header";
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Network,
  DollarSign,
  Gift
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Partner, LyPointsLedger, CashWalletLedger } from "@shared/types";

const WHATSAPP_PHONE = "60178228658";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}`;
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

export default function PartnerDashboardPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: partner, isLoading: partnerLoading } = useQuery<Partner>({
    queryKey: ["/api/partner/profile"],
    enabled: !!user,
  });

  const { data: lyLedger = [] } = useQuery<LyPointsLedger[]>({
    queryKey: ["/api/partner/ly-ledger"],
    enabled: !!partner,
  });

  const { data: cashLedger = [] } = useQuery<CashWalletLedger[]>({
    queryKey: ["/api/partner/cash-ledger"],
    enabled: !!partner,
  });

  const { data: referralStats } = useQuery<{
    directReferrals: number;
    totalNetwork: number;
    monthlyEarnings: number;
  }>({
    queryKey: ["/api/partner/referral-stats"],
    enabled: !!partner,
  });

  const { data: currentCycle } = useQuery<{
    cycleNumber: number;
    daysRemaining: number;
    poolAmount: number;
    myTokens: number;
    totalTokens: number;
  }>({
    queryKey: ["/api/partner/current-cycle"],
    enabled: !!partner,
  });

  if (userLoading || partnerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <p className="text-muted-foreground mb-6">您需要登录才能访问经营人仪表板</p>
          <Button onClick={() => window.location.href = "/auth/login"} data-testid="button-login">
            登录
          </Button>
        </div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-background">
        <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">尚未成为经营人</h1>
          <p className="text-muted-foreground mb-6">您还不是联合经营人，快来加入我们吧！</p>
          <Button onClick={() => setLocation("/partner")} data-testid="button-join-partner">
            了解经营人计划
          </Button>
        </div>
      </div>
    );
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(partner.id.slice(0, 8).toUpperCase());
    toast({
      title: "已复制",
      description: "推荐码已复制到剪贴板",
    });
  };

  const tierLabels: Record<string, string> = {
    phase1: "Phase 1",
    phase2: "Phase 2", 
    phase3: "Phase 3"
  };

  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "待激活", color: "bg-yellow-500" },
    active: { label: "活跃", color: "bg-green-500" },
    suspended: { label: "暂停", color: "bg-red-500" },
    expired: { label: "已过期", color: "bg-gray-500" }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8" data-testid="partner-dashboard">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
              经营人仪表板
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge className={`${statusLabels[partner.status]?.color} text-white`} data-testid="badge-partner-status">
                {statusLabels[partner.status]?.label}
              </Badge>
              <span className="text-muted-foreground">
                {tierLabels[partner.tier]} 经营人
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-card border rounded-lg px-4 py-2">
              <div className="text-xs text-muted-foreground">我的推荐码</div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold" data-testid="text-referral-code">
                  {partner.id.slice(0, 8).toUpperCase()}
                </span>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={copyReferralCode} data-testid="button-copy-referral">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="p-6" data-testid="card-ly-balance">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-amber-600" />
              </div>
              <Badge variant="outline" className="text-amber-600 border-amber-300">LY</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {(partner.lyBalance || 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">LY 能量值余额</div>
          </Card>

          <Card className="p-6" data-testid="card-cash-balance">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-emerald-600" />
              </div>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">RM</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              RM {((partner.cashWalletBalance || 0) / 100).toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">现金钱包余额</div>
          </Card>

          <Card className="p-6" data-testid="card-rwa-tokens">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-300">RWA</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {partner.rwaTokens || 0}
            </div>
            <div className="text-sm text-muted-foreground">当前周期令牌</div>
          </Card>

          <Card className="p-6" data-testid="card-network">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-300">团队</Badge>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">
              {referralStats?.totalNetwork || 0}
            </div>
            <div className="text-sm text-muted-foreground">网体成员</div>
          </Card>
        </div>

        {currentCycle && (
          <Card className="p-6 mb-8 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white" data-testid="card-current-cycle">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-bold">第 {currentCycle.cycleNumber} 周期</span>
                </div>
                <h3 className="text-xl font-bold mb-1">RWA 奖金池分红倒计时</h3>
                <p className="text-white/70">还剩 {currentCycle.daysRemaining} 天结算</p>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    RM {((currentCycle.poolAmount || 0) / 100).toFixed(0)}
                  </div>
                  <div className="text-xs text-white/60">奖金池总额</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {currentCycle.myTokens}
                  </div>
                  <div className="text-xs text-white/60">我的令牌</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">
                    {currentCycle.totalTokens > 0 
                      ? ((currentCycle.myTokens / currentCycle.totalTokens) * 100).toFixed(1) 
                      : 0}%
                  </div>
                  <div className="text-xs text-white/60">占比</div>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="ly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ly" data-testid="tab-ly">LY 能量值</TabsTrigger>
            <TabsTrigger value="cash" data-testid="tab-cash">现金钱包</TabsTrigger>
            <TabsTrigger value="network" data-testid="tab-network">我的网体</TabsTrigger>
          </TabsList>

          <TabsContent value="ly">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">LY 能量值流水</h3>
              {lyLedger.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无记录
                </div>
              ) : (
                <div className="space-y-3">
                  {lyLedger.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.points > 0 ? "bg-green-100" : "bg-red-100"
                        }`}>
                          {item.points > 0 ? (
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{item.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        item.points > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {item.points > 0 ? "+" : ""}{item.points} LY
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="cash">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">现金钱包流水</h3>
                <Button variant="outline" size="sm" data-testid="button-withdraw">
                  申请提现
                </Button>
              </div>
              {cashLedger.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无记录
                </div>
              ) : (
                <div className="space-y-3">
                  {cashLedger.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.amount > 0 ? "bg-green-100" : "bg-red-100"
                        }`}>
                          {item.amount > 0 ? (
                            <ArrowUpRight className="w-5 h-5 text-green-600" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{item.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                          </div>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        item.amount > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {item.amount > 0 ? "+" : ""}RM {(item.amount / 100).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="network">
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-4">10层推荐网体</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tier) => (
                  <div key={tier} className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">第 {tier} 层</div>
                    <div className="text-xl font-bold text-foreground">0</div>
                    <div className="text-xs text-amber-600">
                      {tier === 1 ? "20%" : tier <= 4 ? "10%" : "5%"} LY
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center text-muted-foreground">
                邀请更多朋友加入，扩大您的推荐网体
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
