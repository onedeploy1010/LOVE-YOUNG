import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { PartnerLayout } from "@/components/PartnerLayout";
import { useTranslation } from "@/lib/i18n";
import {
  Award, TrendingUp, Clock, CheckCircle, Coins,
  Calendar, PiggyBank, Users, ChevronRight, Info
} from "lucide-react";

const mockCycles = [
  { id: 3, status: "active", startDate: "2026-01-15", endDate: "2026-01-25", poolAmount: 15000, myTokens: 5, progress: 65 },
  { id: 2, status: "completed", startDate: "2026-01-05", endDate: "2026-01-15", poolAmount: 12500, myTokens: 4, dividend: 180 },
  { id: 1, status: "completed", startDate: "2025-12-26", endDate: "2026-01-05", poolAmount: 10800, myTokens: 3, dividend: 120 },
];

const mockTokenHistory = [
  { id: 1, amount: 2, source: "套餐购买 Phase 1", date: "2025-12-25" },
  { id: 2, amount: 1, source: "推荐奖励 - 李小华", date: "2026-01-05" },
  { id: 3, amount: 1, source: "推荐奖励 - 王美丽", date: "2026-01-10" },
  { id: 4, amount: 1, source: "月度活跃奖励", date: "2026-01-15" },
];

const stats = {
  totalTokens: 15,
  activeTokens: 15,
  totalDividends: 300.00,
  currentCycleEstimate: 95.00,
  avgDividendPerToken: 20.00,
};

export default function PartnerRwaPage() {
  const { t } = useTranslation();
  const activeCycle = mockCycles.find(c => c.status === "active");

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
                <p className="text-2xl font-bold text-foreground">RM {stats.avgDividendPerToken.toFixed(0)}</p>
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
            {activeCycle && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Badge>第 {activeCycle.id} 期</Badge>
                  <Badge variant="outline" className="text-green-500 border-green-500">进行中</Badge>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">周期进度</span>
                    <span className="font-medium">{activeCycle.progress}%</span>
                  </div>
                  <Progress value={activeCycle.progress} className="h-2" />
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">开始日期</p>
                    <p className="font-medium">{activeCycle.startDate}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">结束日期</p>
                    <p className="font-medium">{activeCycle.endDate}</p>
                  </div>
                </div>
                <div className="p-3 bg-secondary/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">本期奖金池</p>
                  <p className="text-xl font-bold text-secondary">RM {activeCycle.poolAmount.toLocaleString()}</p>
                </div>
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
              {mockCycles.map((cycle) => (
                <div 
                  key={cycle.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover-elevate cursor-pointer"
                  data-testid={`cycle-${cycle.id}`}
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
                        <p className="font-medium">第 {cycle.id} 期</p>
                        {cycle.status === "active" && (
                          <Badge className="bg-green-500/10 text-green-500 text-xs">进行中</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {cycle.startDate} ~ {cycle.endDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {cycle.status === "completed" ? (
                      <>
                        <p className="font-bold text-secondary">+RM {cycle.dividend?.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{cycle.myTokens} 令牌参与</p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium text-muted-foreground">预估中...</p>
                        <p className="text-xs text-muted-foreground">{cycle.myTokens} 令牌参与</p>
                      </>
                    )}
                  </div>
                </div>
              ))}
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
              {mockTokenHistory.map((token) => (
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
                      <p className="font-medium text-sm">{token.source}</p>
                      <p className="text-xs text-muted-foreground">{token.date}</p>
                    </div>
                  </div>
                  <Badge className="bg-secondary/20 text-secondary">+{token.amount} 枚</Badge>
                </div>
              ))}
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
