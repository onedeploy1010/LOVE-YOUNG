import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Crown, ArrowLeft, CheckCircle, Loader2, Star, Gift,
  Users, TrendingUp, Award, ShieldCheck, CreditCard,
  Building2, Wallet, AlertCircle, PartyPopper
} from "lucide-react";
import type { User as UserType, Member, Partner, UserState } from "@shared/schema";

interface UserStateResponse {
  state: UserState;
  user: UserType | null;
  member: Member | null;
  partner: Partner | null;
}

const packages = [
  {
    id: "phase1",
    phase: 1,
    name: "Phase 1 套餐",
    price: 1000,
    lyPoints: 2000,
    rwaTokens: 2,
    features: [
      "2000 LY积分",
      "2枚RWA令牌",
      "推荐佣金8%",
      "10层网络收益"
    ],
    popular: false
  },
  {
    id: "phase2",
    phase: 2,
    name: "Phase 2 套餐",
    price: 1300,
    lyPoints: 2600,
    rwaTokens: 3,
    features: [
      "2600 LY积分",
      "3枚RWA令牌",
      "推荐佣金10%",
      "10层网络收益"
    ],
    popular: true
  },
  {
    id: "phase3",
    phase: 3,
    name: "Phase 3 套餐",
    price: 1500,
    lyPoints: 3000,
    rwaTokens: 4,
    features: [
      "3000 LY积分",
      "4枚RWA令牌",
      "推荐佣金12%",
      "10层网络收益",
      "优先客服支持"
    ],
    popular: false
  }
];

const paymentMethods = [
  { id: "fpx", name: "FPX网银", icon: Building2 },
  { id: "tng", name: "Touch n Go", icon: Wallet },
  { id: "card", name: "信用卡/借记卡", icon: CreditCard },
];

export default function PartnerJoinPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("fpx");
  const [referralCode, setReferralCode] = useState("");
  const [step, setStep] = useState<"package" | "payment" | "success">("package");

  const { data: userState, isLoading } = useQuery<UserStateResponse>({
    queryKey: ["/api/auth/state"],
  });

  const joinMutation = useMutation({
    mutationFn: async (data: { tier: "phase1" | "phase2" | "phase3"; referralCode?: string }) => {
      return apiRequest("POST", "/api/partner/join", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/state"] });
      setStep("success");
      toast({
        title: "申请成功",
        description: "您的经营人申请已提交，请等待审核激活",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "申请失败",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = () => {
    if (!selectedPackage) return;
    
    joinMutation.mutate({
      tier: selectedPackage as "phase1" | "phase2" | "phase3",
      referralCode: referralCode || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-secondary" />
      </div>
    );
  }

  if (!userState?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle className="text-2xl">加入联合经营人计划</CardTitle>
              <CardDescription>请先登录后再申请成为联合经营人</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg text-left">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-secondary" />
                  加入即享专属权益
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    最高2000-3000 LY积分
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    RWA令牌持续分红
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    10层推荐网络收益
                  </li>
                </ul>
              </div>

              <Button
                className="w-full bg-secondary text-secondary-foreground gap-2"
                size="lg"
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login-join"
              >
                <Crown className="w-5 h-5" />
                登录后加入
              </Button>

              <Link href="/partner">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  返回了解更多
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (userState.partner) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-2xl">您已是联合经营人</CardTitle>
              <CardDescription>
                {userState.partner.status === "active" 
                  ? "您的经营人账户已激活，可以开始使用全部功能" 
                  : "您的申请正在审核中，请耐心等待"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{userState.partner.lyBalance}</div>
                  <div className="text-xs text-muted-foreground">LY积分</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{userState.partner.rwaTokens}</div>
                  <div className="text-xs text-muted-foreground">RWA令牌</div>
                </div>
                <div className="text-center">
                  <Badge variant={userState.partner.status === "active" ? "default" : "outline"}>
                    {userState.partner.status === "active" ? "已激活" : "待审核"}
                  </Badge>
                </div>
              </div>

              <Link href="/member/partner">
                <Button className="w-full bg-secondary text-secondary-foreground gap-2" data-testid="button-go-dashboard">
                  <TrendingUp className="w-5 h-5" />
                  进入经营人中心
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-secondary/10 to-background">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                <PartyPopper className="w-10 h-10 text-green-500" />
              </div>
              <CardTitle className="text-2xl">申请成功!</CardTitle>
              <CardDescription>恭喜您成功提交经营人申请</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">
                  您的申请已进入审核流程，通常1-2个工作日内会完成审核。审核通过后您将收到通知，届时可以开始使用全部经营人功能。
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span>请确保您已完成套餐支付</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link href="/member">
                  <Button variant="outline" className="w-full">返回会员中心</Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="w-full">返回首页</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/partner">
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-secondary" />
              <span className="font-semibold">加入联合经营人</span>
            </div>
          </div>
          <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30">
            {step === "package" ? "第1步：选择套餐" : "第2步：确认支付"}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {step === "package" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-serif text-primary mb-2">选择您的套餐</h1>
              <p className="text-muted-foreground">选择最适合您的经营人套餐，开启财富之旅</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`relative cursor-pointer transition-all ${
                    selectedPackage === pkg.id 
                      ? "border-secondary ring-2 ring-secondary/20" 
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                  data-testid={`package-${pkg.id}`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-secondary-foreground">
                      最受欢迎
                    </Badge>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <div className="text-3xl font-bold text-primary mt-2">
                      RM {pkg.price.toLocaleString()}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {pkg.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-4 pt-4 border-t">
                      <div className="text-center">
                        <Star className="w-5 h-5 text-secondary mx-auto" />
                        <div className="text-lg font-bold text-secondary">{pkg.lyPoints}</div>
                        <div className="text-xs text-muted-foreground">LY积分</div>
                      </div>
                      <div className="text-center">
                        <Award className="w-5 h-5 text-primary mx-auto" />
                        <div className="text-lg font-bold text-primary">{pkg.rwaTokens}</div>
                        <div className="text-xs text-muted-foreground">RWA令牌</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardContent className="p-4">
                <Label htmlFor="referral" className="text-sm font-medium">推荐码（选填）</Label>
                <Input 
                  id="referral"
                  placeholder="如有推荐人，请输入8位推荐码"
                  className="mt-2"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  data-testid="input-referral"
                />
              </CardContent>
            </Card>

            <Button
              className="w-full bg-secondary text-secondary-foreground gap-2"
              size="lg"
              disabled={!selectedPackage}
              onClick={() => setStep("payment")}
              data-testid="button-next"
            >
              下一步：确认支付
            </Button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              className="gap-2" 
              onClick={() => setStep("package")}
            >
              <ArrowLeft className="w-4 h-4" />
              返回修改套餐
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>订单确认</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPackage && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">套餐</span>
                          <span className="font-medium">
                            {packages.find(p => p.id === selectedPackage)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LY积分</span>
                          <span className="font-medium text-secondary">
                            +{packages.find(p => p.id === selectedPackage)?.lyPoints}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">RWA令牌</span>
                          <span className="font-medium text-primary">
                            +{packages.find(p => p.id === selectedPackage)?.rwaTokens}
                          </span>
                        </div>
                        {referralCode && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">推荐码</span>
                            <span className="font-mono">{referralCode}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>应付金额</span>
                          <span className="text-primary">
                            RM {packages.find(p => p.id === selectedPackage)?.price.toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>选择支付方式</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <div 
                            key={method.id}
                            className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedPayment === method.id ? "border-secondary bg-secondary/5" : ""
                            }`}
                            onClick={() => setSelectedPayment(method.id)}
                          >
                            <RadioGroupItem value={method.id} id={method.id} />
                            <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                              <Icon className="w-5 h-5" />
                              {method.name}
                            </Label>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-gradient-to-br from-secondary/10 to-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      安全保障
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>所有交易均经过加密保护</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>支付后1-2个工作日内激活账户</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>24小时客服支持</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        点击"确认支付"后，您将跳转至支付页面完成付款。支付成功后，您的申请将进入审核流程。
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Button
                  className="w-full bg-secondary text-secondary-foreground gap-2"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={joinMutation.isPending}
                  data-testid="button-pay"
                >
                  {joinMutation.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  确认支付 RM {packages.find(p => p.id === selectedPackage)?.price.toLocaleString()}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
