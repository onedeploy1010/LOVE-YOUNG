import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp, DollarSign, Award, Users, ShoppingBag,
  Calendar, Download, Filter, ArrowUpRight, PieChart
} from "lucide-react";

const mockEarnings = [
  { id: 1, type: "cashback", amount: 150.00, description: "返现分红 - 团队销售", date: "2026-01-20", source: "团队业绩" },
  { id: 2, type: "rwa", amount: 80.00, description: "RWA奖金池分红 - 第3期", date: "2026-01-15", source: "奖金池" },
  { id: 3, type: "referral", amount: 100.00, description: "推荐奖励 - 李小华激活", date: "2026-01-12", source: "推荐奖励" },
  { id: 4, type: "cashback", amount: 120.00, description: "返现分红 - 个人销售", date: "2026-01-08", source: "个人业绩" },
  { id: 5, type: "rwa", amount: 60.00, description: "RWA奖金池分红 - 第2期", date: "2026-01-05", source: "奖金池" },
  { id: 6, type: "referral", amount: 150.00, description: "推荐奖励 - 王美丽激活", date: "2026-01-02", source: "推荐奖励" },
  { id: 7, type: "cashback", amount: 200.00, description: "返现分红 - 团队销售", date: "2025-12-28", source: "团队业绩" },
  { id: 8, type: "rwa", amount: 45.00, description: "RWA奖金池分红 - 第1期", date: "2025-12-25", source: "奖金池" },
];

const stats = {
  totalEarnings: 2850.00,
  thisMonthEarnings: 510.00,
  lastMonthEarnings: 420.00,
  cashbackTotal: 1120.00,
  rwaTotal: 485.00,
  referralTotal: 1245.00,
};

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  cashback: { label: "返现分红", icon: DollarSign, color: "text-green-500", bgColor: "bg-green-500/10" },
  rwa: { label: "RWA分红", icon: Award, color: "text-secondary", bgColor: "bg-secondary/10" },
  referral: { label: "推荐奖励", icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
};

export default function PartnerEarningsPage() {
  const growthPercent = ((stats.thisMonthEarnings - stats.lastMonthEarnings) / stats.lastMonthEarnings * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif text-primary" data-testid="text-earnings-title">收益记录</h1>
        <p className="text-muted-foreground">查看返现分红与RWA奖金历史</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">累计总收益</p>
                <h2 className="text-4xl font-bold text-primary">RM {stats.totalEarnings.toFixed(2)}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className="bg-green-500/20 text-green-500">
                    <ArrowUpRight className="w-3 h-3 mr-1" />
                    +{growthPercent}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">较上月</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Badge variant="outline">本月</Badge>
            </div>
            <p className="text-3xl font-bold text-foreground">RM {stats.thisMonthEarnings.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">本月收益</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <Badge variant="outline">上月</Badge>
            </div>
            <p className="text-3xl font-bold text-foreground">RM {stats.lastMonthEarnings.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground mt-1">上月收益</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">返现分红</p>
                <p className="text-xl font-bold">RM {stats.cashbackTotal.toFixed(2)}</p>
              </div>
              <Badge className="bg-green-500/10 text-green-500">
                {((stats.cashbackTotal / stats.totalEarnings) * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">RWA分红</p>
                <p className="text-xl font-bold">RM {stats.rwaTotal.toFixed(2)}</p>
              </div>
              <Badge className="bg-secondary/10 text-secondary">
                {((stats.rwaTotal / stats.totalEarnings) * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">推荐奖励</p>
                <p className="text-xl font-bold">RM {stats.referralTotal.toFixed(2)}</p>
              </div>
              <Badge className="bg-blue-500/10 text-blue-500">
                {((stats.referralTotal / stats.totalEarnings) * 100).toFixed(0)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                收益明细
              </CardTitle>
              <CardDescription>查看所有收益来源记录</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-filter-earnings">
                <Filter className="w-4 h-4 mr-1" />
                筛选
              </Button>
              <Button variant="outline" size="sm" data-testid="button-export-earnings">
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all" data-testid="tab-all-earnings">全部</TabsTrigger>
              <TabsTrigger value="cashback" data-testid="tab-cashback">返现分红</TabsTrigger>
              <TabsTrigger value="rwa" data-testid="tab-rwa-earnings">RWA分红</TabsTrigger>
              <TabsTrigger value="referral" data-testid="tab-referral">推荐奖励</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-0">
              <div className="divide-y">
                {mockEarnings.map((earning) => {
                  const config = typeConfig[earning.type];
                  const TypeIcon = config.icon;
                  return (
                    <div 
                      key={earning.id} 
                      className="flex items-center justify-between py-4"
                      data-testid={`earning-${earning.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
                          <TypeIcon className={`w-5 h-5 ${config.color}`} />
                        </div>
                        <div>
                          <p className="font-medium">{earning.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm text-muted-foreground">{earning.date}</span>
                            <Badge variant="outline" className="text-xs">{earning.source}</Badge>
                          </div>
                        </div>
                      </div>
                      <p className={`font-bold ${config.color}`}>+RM {earning.amount.toFixed(2)}</p>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {["cashback", "rwa", "referral"].map((type) => (
              <TabsContent key={type} value={type} className="space-y-0">
                <div className="divide-y">
                  {mockEarnings.filter(e => e.type === type).map((earning) => {
                    const config = typeConfig[earning.type];
                    const TypeIcon = config.icon;
                    return (
                      <div 
                        key={earning.id} 
                        className="flex items-center justify-between py-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.bgColor}`}>
                            <TypeIcon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <p className="font-medium">{earning.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-muted-foreground">{earning.date}</span>
                              <Badge variant="outline" className="text-xs">{earning.source}</Badge>
                            </div>
                          </div>
                        </div>
                        <p className={`font-bold ${config.color}`}>+RM {earning.amount.toFixed(2)}</p>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
