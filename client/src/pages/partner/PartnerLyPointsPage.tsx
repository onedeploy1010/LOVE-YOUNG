import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Star, ArrowUpRight, ArrowDownRight, Gift, ShoppingBag,
  Users, TrendingUp, History, Filter, Download
} from "lucide-react";

const mockLedger = [
  { id: 1, type: "earn", amount: 200, description: "套餐购买奖励 - Phase 1", date: "2026-01-20", balance: 2000 },
  { id: 2, type: "earn", amount: 100, description: "推荐奖励 - 李小华加入", date: "2026-01-18", balance: 1800 },
  { id: 3, type: "spend", amount: -50, description: "兑换优惠券", date: "2026-01-15", balance: 1700 },
  { id: 4, type: "earn", amount: 80, description: "团队补货奖励", date: "2026-01-12", balance: 1750 },
  { id: 5, type: "earn", amount: 150, description: "推荐奖励 - 王美丽加入", date: "2026-01-10", balance: 1670 },
  { id: 6, type: "spend", amount: -100, description: "积分抵扣订单", date: "2026-01-08", balance: 1520 },
  { id: 7, type: "earn", amount: 60, description: "二层网络补货", date: "2026-01-05", balance: 1620 },
  { id: 8, type: "earn", amount: 500, description: "初始套餐积分", date: "2025-12-25", balance: 1560 },
];

const stats = {
  totalBalance: 2000,
  totalEarned: 1590,
  totalSpent: 150,
  thisMonth: 380,
  fromReferrals: 330,
  fromReplenishment: 140,
};

export default function PartnerLyPointsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-primary" data-testid="text-ly-points-title">LY积分</h1>
        <p className="text-muted-foreground">查看积分明细与使用记录</p>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                <Star className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">当前LY积分余额</p>
                <h2 className="text-4xl font-bold text-primary">{stats.totalBalance.toLocaleString()}</h2>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" data-testid="button-redeem">
                <Gift className="w-4 h-4 mr-2" />
                兑换礼品
              </Button>
              <Button data-testid="button-use-points">
                <ShoppingBag className="w-4 h-4 mr-2" />
                积分抵扣
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">累计获得</span>
            </div>
            <p className="text-2xl font-bold text-green-500">+{stats.totalEarned}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowDownRight className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">累计使用</span>
            </div>
            <p className="text-2xl font-bold text-orange-500">-{stats.totalSpent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">推荐获得</span>
            </div>
            <p className="text-2xl font-bold text-primary">+{stats.fromReferrals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingBag className="w-4 h-4 text-secondary" />
              <span className="text-xs text-muted-foreground">补货获得</span>
            </div>
            <p className="text-2xl font-bold text-secondary">+{stats.fromReplenishment}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                积分明细
              </CardTitle>
              <CardDescription>查看所有LY积分交易记录</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-filter-ledger">
                <Filter className="w-4 h-4 mr-1" />
                筛选
              </Button>
              <Button variant="outline" size="sm" data-testid="button-export-ledger">
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all-ledger">全部</TabsTrigger>
              <TabsTrigger value="earn" data-testid="tab-earn">获得</TabsTrigger>
              <TabsTrigger value="spend" data-testid="tab-spend">使用</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-0">
              <div className="divide-y">
                {mockLedger.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between py-4"
                    data-testid={`ledger-item-${item.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.type === "earn" ? "bg-green-500/10" : "bg-orange-500/10"
                      }`}>
                        {item.type === "earn" ? (
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${item.type === "earn" ? "text-green-500" : "text-orange-500"}`}>
                        {item.type === "earn" ? "+" : ""}{item.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">余额: {item.balance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="earn" className="space-y-0">
              <div className="divide-y">
                {mockLedger.filter(i => i.type === "earn").map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                        <ArrowUpRight className="w-5 h-5 text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">+{item.amount}</p>
                      <p className="text-xs text-muted-foreground">余额: {item.balance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="spend" className="space-y-0">
              <div className="divide-y">
                {mockLedger.filter(i => i.type === "spend").map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between py-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <ArrowDownRight className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <p className="text-sm text-muted-foreground">{item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-orange-500">{item.amount}</p>
                      <p className="text-xs text-muted-foreground">余额: {item.balance}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-6">
          <h3 className="font-bold mb-4">LY积分规则说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">获得</Badge>
                购买套餐获得对应LY积分
              </p>
              <p className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">获得</Badge>
                推荐新经营人加入获得奖励
              </p>
              <p className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">获得</Badge>
                团队成员补货获得10层网络积分
              </p>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">使用</Badge>
                可兑换礼品或优惠券
              </p>
              <p className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">使用</Badge>
                可抵扣订单金额
              </p>
              <p className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">注意</Badge>
                积分有效期为获得后12个月
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
