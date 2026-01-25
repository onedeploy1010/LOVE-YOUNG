import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PartnerLayout } from "@/components/PartnerLayout";
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
  Download, History, TrendingUp
} from "lucide-react";

const mockTransactions = [
  { id: 1, type: "income", amount: 150.00, description: "返现分红 - 1月第2周", date: "2026-01-20", status: "completed" },
  { id: 2, type: "income", amount: 80.00, description: "RWA奖金池分红", date: "2026-01-15", status: "completed" },
  { id: 3, type: "withdraw", amount: -200.00, description: "提现至银行账户", date: "2026-01-12", status: "completed" },
  { id: 4, type: "income", amount: 120.00, description: "返现分红 - 1月第1周", date: "2026-01-08", status: "completed" },
  { id: 5, type: "withdraw", amount: -150.00, description: "提现至银行账户", date: "2026-01-05", status: "pending" },
  { id: 6, type: "income", amount: 200.00, description: "返现分红 - 12月第4周", date: "2025-12-28", status: "completed" },
];

const stats = {
  availableBalance: 450.00,
  pendingWithdraw: 150.00,
  totalIncome: 1850.00,
  totalWithdrawn: 1400.00,
  thisMonthIncome: 350.00,
};

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  completed: { label: "已完成", icon: CheckCircle, color: "text-green-500" },
  pending: { label: "处理中", icon: Clock, color: "text-orange-500" },
  failed: { label: "失败", icon: XCircle, color: "text-red-500" },
};

export default function PartnerWalletPage() {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-wallet-title">现金钱包</h1>
          <p className="text-muted-foreground">收益查看与提现申请</p>
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
                          <p className="font-medium">Maybank ****1234</p>
                          <p className="text-xs text-muted-foreground">张美丽</p>
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
                    <Button onClick={() => setIsWithdrawOpen(false)} data-testid="button-confirm-withdraw">
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
            {mockTransactions.map((tx) => {
              const statusInfo = statusConfig[tx.status];
              const StatusIcon = statusInfo.icon;
              return (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between py-4"
                  data-testid={`transaction-${tx.id}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === "income" ? "bg-green-500/10" : "bg-blue-500/10"
                    }`}>
                      {tx.type === "income" ? (
                        <ArrowUpRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{tx.date}</span>
                        <Badge variant="outline" className={`text-xs ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className={`font-bold ${tx.type === "income" ? "text-green-500" : "text-foreground"}`}>
                    {tx.type === "income" ? "+" : ""}RM {Math.abs(tx.amount).toFixed(2)}
                  </p>
                </div>
              );
            })}
          </div>
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
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Maybank</p>
                <p className="text-sm text-muted-foreground">**** **** **** 1234</p>
                <p className="text-xs text-muted-foreground">张美丽</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-500/10 text-green-500">默认账户</Badge>
              <Button variant="outline" size="sm">编辑</Button>
            </div>
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
