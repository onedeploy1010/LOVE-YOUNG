import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberLayout } from "@/components/MemberLayout";
import {
  Gift, Star, TrendingUp, Clock, ShoppingBag,
  ArrowUpRight, ArrowDownRight, Info
} from "lucide-react";

const mockPointsHistory = [
  { id: 1, type: "earn", amount: 226, description: "订单消费 #LY20260120001", date: "2026-01-20", balance: 1580 },
  { id: 2, type: "spend", amount: 100, description: "积分抵扣", date: "2026-01-18", balance: 1354 },
  { id: 3, type: "earn", amount: 452, description: "订单消费 #LY20260115002", date: "2026-01-15", balance: 1454 },
  { id: 4, type: "earn", amount: 226, description: "订单消费 #LY20260110003", date: "2026-01-10", balance: 1002 },
  { id: 5, type: "bonus", amount: 100, description: "新年双倍积分活动", date: "2026-01-01", balance: 776 },
  { id: 6, type: "earn", amount: 676, description: "首次消费奖励", date: "2025-12-25", balance: 676 },
];

const stats = {
  totalPoints: 1580,
  thisMonthEarned: 904,
  expiringSoon: 200,
  expiryDate: "2026-02-28",
  nextTierPoints: 2000,
  currentTier: "银卡会员",
  nextTier: "金卡会员",
};

export default function MemberPointsPage() {
  const tierProgress = (stats.totalPoints / stats.nextTierPoints) * 100;

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-points-title">积分中心</h1>
          <p className="text-muted-foreground">查看积分余额与兑换</p>
        </div>

        <Card className="bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                  <Star className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">当前积分</p>
                  <p className="text-4xl font-bold text-secondary" data-testid="text-total-points">{stats.totalPoints}</p>
                  <Badge variant="secondary" className="mt-1">{stats.currentTier}</Badge>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.thisMonthEarned}</div>
                  <p className="text-sm text-muted-foreground">本月获得</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-500">{stats.expiringSoon}</div>
                  <p className="text-sm text-muted-foreground">即将过期</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              会员等级进度
            </CardTitle>
            <CardDescription>
              距离升级到 {stats.nextTier} 还需 {stats.nextTierPoints - stats.totalPoints} 积分
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{stats.currentTier}</span>
                <span className="text-muted-foreground">{stats.nextTier}</span>
              </div>
              <Progress value={tierProgress} className="h-3" />
              <div className="flex justify-between text-sm">
                <span className="font-medium">{stats.totalPoints} 积分</span>
                <span className="text-muted-foreground">{stats.nextTierPoints} 积分</span>
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
                <h3 className="font-bold">积分兑换</h3>
                <p className="text-sm text-muted-foreground">100积分 = RM1</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-redeem">立即兑换</Button>
            </CardContent>
          </Card>

          <Card className="hover-elevate cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold">消费赚积分</h3>
                <p className="text-sm text-muted-foreground">每消费RM1得1积分</p>
              </div>
              <Button variant="outline" size="sm" data-testid="button-shop">去购物</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              积分明细
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">全部</TabsTrigger>
                <TabsTrigger value="earn" data-testid="tab-earn">获得</TabsTrigger>
                <TabsTrigger value="spend" data-testid="tab-spend">使用</TabsTrigger>
              </TabsList>
              <TabsContent value="all" className="mt-4">
                <div className="space-y-3">
                  {mockPointsHistory.map((record) => (
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
                          <p className="text-xs text-muted-foreground">{record.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${record.type === "spend" ? "text-red-500" : "text-green-500"}`}>
                          {record.type === "spend" ? "-" : "+"}{record.amount}
                        </p>
                        <p className="text-xs text-muted-foreground">余额: {record.balance}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="earn" className="mt-4">
                <div className="space-y-3">
                  {mockPointsHistory.filter(r => r.type !== "spend").map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500/10">
                          <ArrowUpRight className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{record.description}</p>
                          <p className="text-xs text-muted-foreground">{record.date}</p>
                        </div>
                      </div>
                      <p className="font-bold text-green-500">+{record.amount}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="spend" className="mt-4">
                <div className="space-y-3">
                  {mockPointsHistory.filter(r => r.type === "spend").map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500/10">
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{record.description}</p>
                          <p className="text-xs text-muted-foreground">{record.date}</p>
                        </div>
                      </div>
                      <p className="font-bold text-red-500">-{record.amount}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">积分规则</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>每消费RM1可获得1积分</li>
                <li>100积分可抵扣RM1</li>
                <li>积分有效期为获得后12个月</li>
                <li>积分仅限本人使用，不可转让</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
