import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PartnerLayout } from "@/components/PartnerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Wallet, ArrowUpRight, ArrowDownRight, CreditCard,
  Building2, Clock, CheckCircle, XCircle, AlertCircle,
  Download, History, TrendingUp, Loader2
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  completed: { label: "已完成", icon: CheckCircle, color: "text-green-500" },
  pending: { label: "处理中", icon: Clock, color: "text-orange-500" },
  failed: { label: "失败", icon: XCircle, color: "text-red-500" },
};

export default function PartnerWalletPage() {
  const { t } = useTranslation();
  const { partner } = useAuth();
  const { toast } = useToast();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["partner-wallet-transactions", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];

      const { data, error } = await supabase
        .from("cash_wallet_ledger")
        .select("*")
        .eq("partner_id", partner.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching transactions:", error);
        return [];
      }

      return (data || []).map((row): Transaction => ({
        id: row.id,
        type: row.type,
        amount: row.amount,
        description: row.description || "",
        status: row.status,
        createdAt: row.created_at,
      }));
    },
    enabled: !!partner?.id,
  });

  const { data: pendingWithdrawals = [] } = useQuery({
    queryKey: ["partner-pending-withdrawals", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];

      const { data } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("partner_id", partner.id)
        .eq("status", "pending");

      return data || [];
    },
    enabled: !!partner?.id,
  });

  const withdrawMutation = useMutation({
    mutationFn: async (amount: number) => {
      if (!partner?.id) throw new Error("Not authenticated");

      const { error } = await supabase.from("withdrawal_requests").insert({
        partner_id: partner.id,
        amount: amount * 100,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-pending-withdrawals"] });
      toast({ title: "提现申请已提交", description: "预计1-3个工作日处理完成" });
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
    },
    onError: (error: Error) => {
      toast({ title: "提现失败", description: error.message, variant: "destructive" });
    },
  });

  const stats = {
    availableBalance: (partner?.cashWalletBalance || 0) / 100,
    pendingWithdraw: pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0) / 100,
    totalIncome: transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0) / 100,
    totalWithdrawn: Math.abs(transactions.filter(t => t.type === "withdraw").reduce((sum, t) => sum + t.amount, 0)) / 100,
    thisMonthIncome: transactions
      .filter(t => t.amount > 0 && t.createdAt?.startsWith(new Date().toISOString().slice(0, 7)))
      .reduce((sum, t) => sum + t.amount, 0) / 100,
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const handleWithdraw = () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 50) {
      toast({ title: "提现金额无效", description: "最低提现金额为 RM 50.00", variant: "destructive" });
      return;
    }
    if (amount > stats.availableBalance) {
      toast({ title: "余额不足", description: "提现金额超过可用余额", variant: "destructive" });
      return;
    }
    withdrawMutation.mutate(amount);
  };

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-wallet-title">{t("partner.wallet.title")}</h1>
          <p className="text-muted-foreground">{t("partner.wallet.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">可提现余额</p>
                  <h2 className="text-4xl font-bold text-primary">RM {stats.availableBalance.toFixed(2)}</h2>
                  {stats.pendingWithdraw > 0 && (
                    <p className="text-sm text-orange-500 mt-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      RM {stats.pendingWithdraw.toFixed(2)} 提现处理中
                    </p>
                  )}
                </div>
                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" data-testid="button-withdraw">
                      <Wallet className="w-4 h-4 mr-2" />
                      申请提现
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>申请提现</DialogTitle>
                      <DialogDescription>
                        提现将在1-3个工作日内处理完成
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>提现金额 (RM)</Label>
                        <Input
                          type="number"
                          placeholder="请输入提现金额"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          data-testid="input-withdraw-amount"
                        />
                        <p className="text-xs text-muted-foreground">
                          可提现余额: RM {stats.availableBalance.toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>收款银行账户</Label>
                        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">请先绑定银行账户</p>
                            <p className="text-xs text-muted-foreground">联系客服添加</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-orange-500/10 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                        <p className="text-sm text-orange-500">
                          最低提现金额为 RM 50.00，每笔提现收取 RM 1.00 手续费
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>
                        取消
                      </Button>
                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawMutation.isPending}
                        data-testid="button-confirm-withdraw"
                      >
                        {withdrawMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        确认提现
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">本月收入</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500">+RM {stats.thisMonthIncome.toFixed(2)}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">累计收入</p>
                  <p className="font-bold">RM {stats.totalIncome.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">累计提现</p>
                  <p className="font-bold">RM {stats.totalWithdrawn.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-primary" />
                  交易记录
                </CardTitle>
                <CardDescription>查看所有钱包交易明细</CardDescription>
              </div>
              <Button variant="outline" size="sm" data-testid="button-export-transactions">
                <Download className="w-4 h-4 mr-1" />
                导出记录
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {transactions.map((tx) => {
                const statusInfo = statusConfig[tx.status] || statusConfig.completed;
                const StatusIcon = statusInfo.icon;
                const isIncome = tx.amount > 0;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-4"
                    data-testid={`transaction-${tx.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isIncome ? "bg-green-500/10" : "bg-blue-500/10"
                      }`}>
                        {isIncome ? (
                          <ArrowUpRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{tx.description || tx.type}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{formatDate(tx.createdAt)}</span>
                          <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <p className={`font-bold ${isIncome ? "text-green-500" : "text-foreground"}`}>
                      {isIncome ? "+" : ""}RM {Math.abs(tx.amount / 100).toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>
            {transactions.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>暂无交易记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              收款账户
            </CardTitle>
            <CardDescription>管理您的银行收款账户</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>暂未绑定银行账户</p>
              <p className="text-sm">请联系客服添加收款账户</p>
            </div>
            <Button variant="outline" className="w-full mt-4" data-testid="button-add-bank">
              + 添加银行账户
            </Button>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
