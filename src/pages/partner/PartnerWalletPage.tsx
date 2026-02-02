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

const statusConfig: Record<string, { icon: React.ElementType; color: string }> = {
  completed: { icon: CheckCircle, color: "text-green-500" },
  pending: { icon: Clock, color: "text-orange-500" },
  failed: { icon: XCircle, color: "text-red-500" },
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
      toast({ title: t("member.wallet.withdrawSuccess"), description: t("member.wallet.withdrawSuccessDesc") });
      setIsWithdrawOpen(false);
      setWithdrawAmount("");
    },
    onError: (error: Error) => {
      toast({ title: t("member.wallet.withdrawFailed"), description: error.message, variant: "destructive" });
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
      toast({ title: t("member.wallet.invalidAmount"), description: t("member.wallet.minAmountMsg"), variant: "destructive" });
      return;
    }
    if (amount > stats.availableBalance) {
      toast({ title: t("member.wallet.insufficientBalance"), description: t("member.wallet.exceedsBalanceMsg"), variant: "destructive" });
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
          <h1 className="text-2xl font-serif text-primary" data-testid="text-wallet-title">{t("member.wallet.title")}</h1>
          <p className="text-muted-foreground">{t("member.wallet.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t("member.wallet.availableBalance")}</p>
                  <h2 className="text-4xl font-bold text-primary">RM {stats.availableBalance.toFixed(2)}</h2>
                  {stats.pendingWithdraw > 0 && (
                    <p className="text-sm text-orange-500 mt-2 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      RM {stats.pendingWithdraw.toFixed(2)} {t("member.wallet.pendingWithdraw")}
                    </p>
                  )}
                </div>
                <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" data-testid="button-withdraw">
                      <Wallet className="w-4 h-4 mr-2" />
                      {t("member.wallet.applyWithdraw")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t("member.wallet.withdrawTitle")}</DialogTitle>
                      <DialogDescription>
                        {t("member.wallet.withdrawDesc")}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>{t("member.wallet.withdrawAmount")}</Label>
                        <Input
                          type="number"
                          placeholder={t("member.wallet.withdrawPlaceholder")}
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          data-testid="input-withdraw-amount"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t("member.wallet.availableBalanceLabel")}: RM {stats.availableBalance.toFixed(2)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>{t("member.wallet.selectBank")}</Label>
                        <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{t("member.wallet.bindBankFirst")}</p>
                            <p className="text-xs text-muted-foreground">{t("member.wallet.contactToAdd")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 bg-orange-500/10 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                        <p className="text-sm text-orange-500">
                          {t("member.wallet.minWithdrawNote")}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsWithdrawOpen(false)}>
                        {t("member.wallet.cancel")}
                      </Button>
                      <Button
                        onClick={handleWithdraw}
                        disabled={withdrawMutation.isPending}
                        data-testid="button-confirm-withdraw"
                      >
                        {withdrawMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {t("member.wallet.confirmWithdraw")}
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
                <span className="text-sm text-muted-foreground">{t("member.wallet.thisMonthIncome")}</span>
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-green-500">+RM {stats.thisMonthIncome.toFixed(2)}</p>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("member.wallet.totalIncome")}</p>
                  <p className="font-bold">RM {stats.totalIncome.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("member.wallet.totalWithdrawn")}</p>
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
                  {t("member.wallet.transactions")}
                </CardTitle>
                <CardDescription>{t("member.wallet.transactionsDesc")}</CardDescription>
              </div>
              <Button variant="outline" size="sm" data-testid="button-export-transactions">
                <Download className="w-4 h-4 mr-1" />
                {t("member.wallet.exportRecords")}
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
                            {t(`member.wallet.status.${tx.status}`)}
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
                <p>{t("member.wallet.noTransactions")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              {t("member.wallet.bankAccount")}
            </CardTitle>
            <CardDescription>{t("member.wallet.bankAccountDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t("member.wallet.noBankAccount")}</p>
              <p className="text-sm">{t("member.wallet.contactForBank")}</p>
            </div>
            <Button variant="outline" className="w-full mt-4" data-testid="button-add-bank">
              {t("member.wallet.addBankAccount")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
