import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  DollarSign, TrendingUp, TrendingDown, PieChart,
  ArrowUpRight, ArrowDownRight, Download, Calendar, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface FinanceTransaction {
  id: string;
  date: string;
  type: string;
  category: string;
  amount: number;
  description: string | null;
  created_at: string;
}

interface FinanceSummary {
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  partner_payouts: number;
  bonus_pool_payouts: number;
}

export default function AdminFinancePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("all");

  // Fetch finance transactions
  const { data: transactions = [], isLoading: loadingTx } = useQuery({
    queryKey: ["admin-finance-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("finance_transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching transactions:", error);
        return [];
      }

      return (data || []) as FinanceTransaction[];
    },
  });

  // Fetch finance summary
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["admin-finance-summary"],
    queryFn: async () => {
      // Try using the function first
      const { data, error } = await supabase.rpc("get_finance_summary");

      if (error) {
        console.log("Finance summary function not available:", error.message);
        // Manual calculation from transactions
        const income = transactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
        const expenses = transactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
        return {
          total_revenue: income,
          total_expenses: expenses,
          total_profit: income - expenses,
          partner_payouts: 0,
          bonus_pool_payouts: 0,
        };
      }

      return (data?.[0] || {
        total_revenue: 0,
        total_expenses: 0,
        total_profit: 0,
        partner_payouts: 0,
        bonus_pool_payouts: 0,
      }) as FinanceSummary;
    },
  });

  // Calculate expense breakdown from transactions
  const expenseBreakdown = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const totalExpenses = Object.values(expenseBreakdown).reduce((sum, v) => sum + v, 0);

  const filteredTransactions = activeTab === "all"
    ? transactions
    : transactions.filter(t => t.type === activeTab);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const isLoading = loadingTx || loadingSummary;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-finance-title">{t("admin.financePage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.financePage.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" data-testid="button-export">
              <Download className="w-4 h-4" />
              {t("admin.financePage.exportReport")}
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
                  收入
                </Badge>
              </div>
              <p className="text-3xl font-bold text-green-600">
                RM {((summary?.total_revenue || 0) / 100).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{t("admin.financePage.monthlyRevenue")}</p>
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
                  支出
                </Badge>
              </div>
              <p className="text-3xl font-bold text-red-500">
                RM {((summary?.total_expenses || 0) / 100).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{t("admin.financePage.monthlyExpenses")}</p>
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
                  利润
                </Badge>
              </div>
              <p className="text-3xl font-bold text-primary">
                RM {((summary?.total_profit || 0) / 100).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">{t("admin.financePage.monthlyProfit")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-primary" />
                {t("admin.financePage.expenseBreakdown")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(expenseBreakdown).length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">暂无支出数据</p>
              ) : (
                Object.entries(expenseBreakdown).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span>{category}</span>
                    <span className="font-bold">
                      RM {(amount / 100).toLocaleString()} ({totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-secondary" />
                {t("admin.financePage.partnerExpenses")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-secondary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span>{t("admin.financePage.cashbackPayout")}</span>
                  <span className="font-bold text-secondary">
                    RM {((summary?.partner_payouts || 0) / 100).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{t("admin.financePage.cashbackDesc")}</p>
              </div>
              <div className="p-4 bg-primary/10 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span>{t("admin.financePage.bonusPoolPayout")}</span>
                  <span className="font-bold text-primary">
                    RM {((summary?.bonus_pool_payouts || 0) / 100).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{t("admin.financePage.bonusPoolDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              {t("admin.financePage.recentTransactions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">{t("admin.financePage.tabAll")}</TabsTrigger>
                <TabsTrigger value="income" data-testid="tab-income">{t("admin.financePage.tabIncome")}</TabsTrigger>
                <TabsTrigger value="expense" data-testid="tab-expense">{t("admin.financePage.tabExpense")}</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无交易记录</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTransactions.map((tx) => (
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
                              <span className="font-medium">{tx.description || tx.category}</span>
                              <Badge variant="outline">{tx.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{formatDate(tx.date)}</p>
                          </div>
                        </div>
                        <span className={`font-bold ${tx.type === "income" ? "text-green-500" : "text-red-500"}`}>
                          {tx.type === "income" ? "+" : "-"}RM {(tx.amount / 100).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
