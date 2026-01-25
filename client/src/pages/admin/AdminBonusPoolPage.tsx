import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/AdminLayout";
import {
  PiggyBank, TrendingUp, Clock, Users, DollarSign,
  Calendar, ArrowUpRight, Info, RefreshCw
} from "lucide-react";

const mockCycleData = {
  currentCycle: 12,
  startDate: "2026-01-20",
  endDate: "2026-01-30",
  daysRemaining: 5,
  totalPool: 15000,
  totalRwaTokens: 150,
  perTokenValue: 100,
  participatingPartners: 45,
  salesInCycle: 50000,
};

const mockHistory = [
  { cycle: 11, period: "2026-01-10 ~ 2026-01-20", pool: 12500, perToken: 83.33, participants: 42 },
  { cycle: 10, period: "2025-12-31 ~ 2026-01-10", pool: 18000, perToken: 120.00, participants: 40 },
  { cycle: 9, period: "2025-12-21 ~ 2025-12-31", pool: 22000, perToken: 146.67, participants: 38 },
];

export default function AdminBonusPoolPage() {
  const progress = ((10 - mockCycleData.daysRemaining) / 10) * 100;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-bonus-pool-title">奖金池管理</h1>
            <p className="text-muted-foreground">RWA分红周期设置与管理</p>
          </div>
          <Button variant="outline" className="gap-2" data-testid="button-refresh">
            <RefreshCw className="w-4 h-4" />
            刷新数据
          </Button>
        </div>

        <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-6 h-6 text-secondary" />
                当前周期 #{mockCycleData.currentCycle}
              </CardTitle>
              <Badge className="bg-green-500 text-white">进行中</Badge>
            </div>
            <CardDescription>
              {mockCycleData.startDate} ~ {mockCycleData.endDate}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>周期进度</span>
                <span>{10 - mockCycleData.daysRemaining}/10 天</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-4 h-4" />
                还剩 {mockCycleData.daysRemaining} 天结束本周期
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background rounded-lg">
                <DollarSign className="w-6 h-6 mx-auto text-secondary mb-2" />
                <p className="text-2xl font-bold text-secondary">RM {mockCycleData.totalPool.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">当前池子</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <TrendingUp className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold text-primary">RM {mockCycleData.perTokenValue.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">每令牌价值</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <Users className="w-6 h-6 mx-auto text-primary mb-2" />
                <p className="text-2xl font-bold">{mockCycleData.participatingPartners}</p>
                <p className="text-xs text-muted-foreground">参与经营人</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg">
                <ArrowUpRight className="w-6 h-6 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">RM {mockCycleData.salesInCycle.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">本周期销售</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                周期设置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">周期长度</span>
                <span className="font-medium">10 天</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">销售额入池比例</span>
                <span className="font-medium text-secondary">30%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span className="text-sm">总RWA令牌</span>
                <span className="font-medium">{mockCycleData.totalRwaTokens} 枚</span>
              </div>
              <Button className="w-full" variant="outline" data-testid="button-edit-settings">
                编辑设置
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                分红说明
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>每个周期（10天）结束后，系统自动将奖金池金额按RWA令牌比例分配给持有者。</p>
              <ul className="list-disc list-inside space-y-1">
                <li>销售额的30%自动进入奖金池</li>
                <li>每位经营人持有1-4枚RWA令牌（按套餐）</li>
                <li>分红到账后需扣除等额LY积分提现</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              历史周期
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockHistory.map((cycle) => (
                <div
                  key={cycle.cycle}
                  className="flex items-center justify-between p-4 border rounded-lg"
                  data-testid={`cycle-${cycle.cycle}`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">周期 #{cycle.cycle}</span>
                      <Badge variant="outline">已结算</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{cycle.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-secondary">RM {cycle.pool.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      每令牌 RM {cycle.perToken.toFixed(2)} · {cycle.participants} 人
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
