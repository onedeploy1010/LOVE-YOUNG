import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MemberLayout } from "@/components/MemberLayout";
import { useTranslation } from "@/lib/i18n";
import {
  CreditCard, Plus, Trash2, CheckCircle, Building2,
  Wallet, ShieldCheck, Info, Loader2, Landmark, Banknote
} from "lucide-react";

type PaymentMethod = {
  id: string;
  user_id: string;
  stripe_payment_method_id: string | null;
  type: "card" | "bank" | "ewallet";
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  name: string | null;
  is_default: boolean;
  created_at: string;
};

export default function MemberPaymentPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newType, setNewType] = useState("bank");
  const [newName, setNewName] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const zh = language === "zh";

  const { data: methods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["payment-methods", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) { console.error("Error fetching payment methods:", error); return []; }
      return data || [];
    },
    enabled: !!user?.id,
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) return;
      await supabase
        .from("payment_methods")
        .update({ is_default: false })
        .eq("user_id", user.id);
      await supabase
        .from("payment_methods")
        .update({ is_default: true })
        .eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("payment_methods").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payment-methods"] }),
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) return;
      const last4 = newAccount.slice(-4).replace(/\D/g, "") || "0000";
      await supabase.from("payment_methods").insert({
        user_id: user.id,
        type: newType,
        name: newName,
        last4,
        is_default: methods.length === 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payment-methods"] });
      setIsDialogOpen(false);
      setNewName("");
      setNewAccount("");
      setNewType("bank");
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bank": return <Building2 className="w-5 h-5 text-primary" />;
      case "ewallet": return <Wallet className="w-5 h-5 text-secondary" />;
      default: return <CreditCard className="w-5 h-5 text-primary" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "bank": return zh ? "银行账户" : "Bank Account";
      case "ewallet": return zh ? "电子钱包" : "E-Wallet";
      default: return zh ? "银行卡" : "Card";
    }
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-payment-title">
            {t("member.payment.title")}
          </h1>
          <p className="text-muted-foreground">{t("member.payment.subtitle")}</p>
        </div>

        {/* Online Payment Info - Stripe */}
        <Card className="bg-gradient-to-r from-[#635BFF]/10 to-primary/10 border-[#635BFF]/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-[#635BFF]/20 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-6 h-6 text-[#635BFF]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">
                  {zh ? "在线支付" : "Online Payment"}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {zh
                    ? "所有订单支付通过 Stripe 安全处理，无需预先绑定支付方式。下单时直接选择支付即可。"
                    : "All order payments are securely processed via Stripe. No need to save payment methods — simply pay at checkout."}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1.5">
                    <CreditCard className="w-3 h-3" />
                    {zh ? "信用卡/借记卡" : "Credit / Debit Card"}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5">
                    <Landmark className="w-3 h-3" />
                    FPX
                  </Badge>
                  <Badge variant="outline" className="gap-1.5">
                    <Banknote className="w-3 h-3" />
                    GrabPay
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{t("member.payment.securityTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("member.payment.securityDesc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal / Payout Accounts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {zh ? "提现账户" : "Withdrawal Accounts"}
              </CardTitle>
              <CardDescription>
                {zh
                  ? `已绑定 ${methods.length} 个账户 · 用于经营人佣金提现`
                  : `${methods.length} account(s) linked · For partner commission withdrawals`}
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-add-payment">
                  <Plus className="w-4 h-4" />
                  {t("member.payment.add")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {zh ? "添加提现账户" : "Add Withdrawal Account"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <RadioGroup value={newType} onValueChange={setNewType}>
                    <div className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${newType === "bank" ? "border-secondary bg-secondary/5" : ""}`}
                      onClick={() => setNewType("bank")}>
                      <RadioGroupItem value="bank" id="pm-bank" />
                      <Label htmlFor="pm-bank" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Building2 className="w-5 h-5" />
                        {t("member.payment.bankAccount")}
                      </Label>
                    </div>
                    <div className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${newType === "ewallet" ? "border-secondary bg-secondary/5" : ""}`}
                      onClick={() => setNewType("ewallet")}>
                      <RadioGroupItem value="ewallet" id="pm-ewallet" />
                      <Label htmlFor="pm-ewallet" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Wallet className="w-5 h-5" />
                        {t("member.payment.ewallet")}
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label htmlFor="bank-name">
                      {newType === "bank"
                        ? (zh ? "银行名称" : "Bank Name")
                        : (zh ? "电子钱包名称" : "E-Wallet Name")}
                    </Label>
                    <Input
                      id="bank-name"
                      placeholder={newType === "bank"
                        ? (zh ? "例如: Maybank, CIMB, Public Bank" : "e.g. Maybank, CIMB, Public Bank")
                        : (zh ? "例如: Touch 'n Go, GrabPay, Boost" : "e.g. Touch 'n Go, GrabPay, Boost")}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">
                      {newType === "bank"
                        ? (zh ? "账户号码" : "Account Number")
                        : (zh ? "手机号码 / 账号" : "Phone Number / Account ID")}
                    </Label>
                    <Input
                      id="account"
                      placeholder={newType === "bank" ? "1234567890" : "012-345 6789"}
                      value={newAccount}
                      onChange={(e) => setNewAccount(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      {t("member.payment.cancel")}
                    </Button>
                    <Button
                      className="bg-secondary text-secondary-foreground"
                      onClick={() => addMutation.mutate()}
                      disabled={addMutation.isPending || !newName || !newAccount}
                      data-testid="button-save-payment"
                    >
                      {addMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t("member.payment.save")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : methods.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {zh ? "暂无提现账户" : "No withdrawal accounts yet"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {zh ? "添加银行账户或电子钱包以便提现佣金" : "Add a bank account or e-wallet to withdraw commissions"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {methods.map((method) => (
                  <div
                    key={method.id}
                    className={`flex items-center justify-between p-4 border rounded-lg ${method.is_default ? "border-secondary bg-secondary/5" : ""}`}
                    data-testid={`payment-${method.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method.type === "bank" ? "bg-primary/10" : "bg-secondary/10"}`}>
                        {getTypeIcon(method.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{method.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(method.type)}
                          </Badge>
                          {method.is_default && (
                            <Badge className="bg-secondary text-secondary-foreground gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {t("member.payment.default")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.last4 ? `****${method.last4}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultMutation.mutate(method.id)}
                          disabled={setDefaultMutation.isPending}
                          data-testid={`button-default-${method.id}`}
                        >
                          {t("member.payment.setDefault")}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => deleteMutation.mutate(method.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${method.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">
                {zh ? "支付与提现说明" : "Payment & Withdrawal Info"}
              </p>
              <ul className="space-y-1.5 list-disc list-inside">
                <li>
                  {zh
                    ? "购物支付：通过 Stripe 在线支付，支持信用卡、FPX、GrabPay"
                    : "Purchases: Paid online via Stripe (Credit Card, FPX, GrabPay)"}
                </li>
                <li>
                  {zh
                    ? "佣金提现：绑定银行账户或电子钱包后即可申请提现"
                    : "Withdrawals: Link a bank account or e-wallet to request payouts"}
                </li>
                <li>
                  {zh
                    ? "默认账户将用于自动提现处理"
                    : "The default account will be used for automatic payout processing"}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
