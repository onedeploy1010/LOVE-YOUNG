import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp, Users, Wallet, Award, Share2,
  ArrowUpRight, ArrowDownRight, Copy, Check,
  Crown, Star, Target, Zap
} from "lucide-react";
import { useState } from "react";

export default function PartnerDashboardPage() {
  const [copied, setCopied] = useState(false);
  
  const mockData = {
    referralCode: "LY8X9K2M",
    tier: "Phase 1",
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-primary" data-testid="text-partner-dashboard-title">经营概览</h1>
        <p className="text-muted-foreground">查看您的经营数据与业绩表现</p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">当前等级</p>
                <h2 className="text-2xl font-bold text-primary">{mockData.tier}</h2>
                <Badge className="mt-1 bg-secondary/20 text-secondary">联合经营人</Badge>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <p className="text-sm text-muted-foreground">我的推荐码</p>
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
              <Badge variant="outline" className="text-xs">LY积分</Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">{mockData.lyBalance.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">可用积分余额</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-cash-balance">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-green-500" />
              </div>
              <Badge variant="outline" className="text-xs">现金钱包</Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">RM {mockData.cashBalance.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">可提现余额</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-rwa-tokens">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-secondary" />
              </div>
              <Badge variant="outline" className="text-xs">RWA令牌</Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">{mockData.rwaTokens}</p>
              <p className="text-sm text-muted-foreground">累计持有令牌</p>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-referrals">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <Badge variant="outline" className="text-xs">推荐网络</Badge>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">{mockData.totalReferrals}</p>
              <p className="text-sm text-muted-foreground">{mockData.activeReferrals} 位活跃成员</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              本月收益
            </CardTitle>
            <CardDescription>返现分红与RWA奖金收入</CardDescription>
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
                <p className="text-sm text-muted-foreground">累计收益</p>
                <p className="text-xl font-bold text-foreground">RM {mockData.totalEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">上月收益</p>
                <p className="text-xl font-bold text-foreground">RM {mockData.lastMonthEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-secondary" />
              RWA奖金池周期
            </CardTitle>
            <CardDescription>第 {mockData.currentCycle} 期分红进度</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">周期进度</span>
                  <span className="font-medium">{mockData.cycleProgress}%</span>
                </div>
                <Progress value={mockData.cycleProgress} className="h-3" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">下次分红日期</p>
                  <p className="font-medium text-foreground">{mockData.nextPayout}</p>
                </div>
                <Button variant="outline" size="sm" data-testid="button-view-rwa">
                  查看详情
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
            快捷操作
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-share-materials">
              <Share2 className="w-5 h-5" />
              <span>推广物料</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-invite-friends">
              <Users className="w-5 h-5" />
              <span>邀请好友</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-withdraw">
              <Wallet className="w-5 h-5" />
              <span>申请提现</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" data-testid="button-upgrade">
              <Zap className="w-5 h-5" />
              <span>升级套餐</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
