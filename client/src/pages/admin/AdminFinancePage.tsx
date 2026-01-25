import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import {
  DollarSign, TrendingUp, TrendingDown, PieChart,
  ArrowUpRight, ArrowDownRight, Download, Calendar
} from "lucide-react";

const mockFinanceData = {
  revenue: { current: 125000, previous: 98000, growth: 27.6 },
  expenses: { current: 45000, previous: 42000, growth: 7.1 },
  profit: { current: 80000, previous: 56000, growth: 42.9 },
  partnerPayouts: 35000,
  bonusPoolPayout: 15000,
};

const mockTransactions = [
  { id: "1", date: "2026-01-25", type: "income", category: "产品销售", amount: 12500, description: "在线销售收入" },
  { id: "2", date: "2026-01-24", type: "expense", category: "采购成本", amount: 8000, description: "燕窝原料采购" },
  { id: "3", date: "2026-01-23", type: "expense", category: "物流费用", amount: 2500, description: "冷链配送费用" },
  { id: "4", date: "2026-01-22", type: "income", category: "产品销售", amount: 18000, description: "礼盒套装销售" },
  { id: "5", date: "2026-01-21", type: "expense", category: "经营人分红", amount: 5000, description: "返现分红支出" },
];

export default function AdminFinancePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-finance-title">财务报表</h1>
            <p className="text-muted-foreground">收支分析与报表</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" data-testid="button-export">
              <Download className="w-4 h-4" />
              导出报表
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-500" />
                </div>
                <Badge className="bg-green-500 text-white gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +{mockFinanceData.revenue.growth}%
                </Badge>
              </div>
              <p className="text-3xl font-bold text-green-600">RM {mockFinanceData.revenue.current.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">本月收入</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-red-500" />
                </div>
                <Badge variant="outline" className="text-red-500 gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +{mockFinanceData.expenses.growth}%
                </Badge>
              </div>
              <p className="text-3xl font-bold text-red-500">RM {mockFinanceData.expenses.current.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">本月支出</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-primary" />
                </div>
                <Badge className="bg-primary text-primary-foreground gap-1">
                  <ArrowUpRight className="w-3 h-3" />
                  +{mockFinanceData.profit.growth}%
                </Badge>
              </div>
              <p className="text-3xl font-bold text-primary">RM {mockFinanceData.profit.current.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">本月净利润</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                支出构成
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span>采购成本</span>
                <span className="font-bold">RM 25,000 (55%)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span>物流费用</span>
                <span className="font-bold">RM 8,000 (18%)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span>运营费用</span>
                <span className="font-bold">RM 7,000 (16%)</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <span>其他费用</span>
                <span className="font-bold">RM 5,000 (11%)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-secondary" />
                经营人相关支出
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span>返现分红支出</span>
                  <span className="font-bold text-secondary">RM {mockFinanceData.partnerPayouts.toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">包含直接推荐和3代网络返现</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span>RWA奖金池支出</span>
                  <span className="font-bold text-primary">RM {mockFinanceData.bonusPoolPayout.toLocaleString()}</span>
                </div>
                <p className="text-sm text-muted-foreground">本周期奖金池分红</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              最近交易记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">全部</TabsTrigger>
                <TabsTrigger value="income" data-testid="tab-income">收入</TabsTrigger>
                <TabsTrigger value="expense" data-testid="tab-expense">支出</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-4">
                <div className="space-y-3">
                  {mockTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`transaction-${tx.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "income" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                          {tx.type === "income" ? (
                            <ArrowUpRight className="w-5 h-5 text-green-500" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tx.description}</span>
                            <Badge variant="outline">{tx.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}>
                        {tx.type === "income" ? "+" : "-"}RM {tx.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="income" className="mt-4">
                <div className="space-y-3">
                  {mockTransactions.filter(tx => tx.type === "income").map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10">
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <span className="font-medium">{tx.description}</span>
                          <p className="text-sm text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <span className="font-bold text-green-500">+RM {tx.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="expense" className="mt-4">
                <div className="space-y-3">
                  {mockTransactions.filter(tx => tx.type === "expense").map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10">
                          <ArrowDownRight className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <span className="font-medium">{tx.description}</span>
                          <p className="text-sm text-muted-foreground">{tx.date}</p>
                        </div>
                      </div>
                      <span className="font-bold text-red-500">-RM {tx.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
