import { useState, useEffect } from "react";
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
import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { createPartner, getPartnerByMemberId, PARTNER_TIERS } from "@/lib/partner";
import { getMemberByUserId, createOrGetMember } from "@/lib/members";
import {
  Crown, ArrowLeft, CheckCircle, Loader2, Star, Gift,
  Users, TrendingUp, Award, ShieldCheck, CreditCard,
  Building2, Wallet, AlertCircle, PartyPopper, User
} from "lucide-react";
import type { User as UserType, Member, Partner } from "@shared/types";
import { useTranslation } from "@/lib/i18n";

interface UserStateData {
  user: UserType | null;
  member: Member | null;
  partner: Partner | null;
}

const getPackages = (t: (key: string) => string) => [
  {
    id: "phase1",
    phase: 1,
    name: t("member.partnerJoin.packages.phase1.name"),
    price: 1000,
    lyPoints: 2000,
    rwaTokens: 2,
    features: [
      t("member.partnerJoin.packages.phase1.feature1"),
      t("member.partnerJoin.packages.phase1.feature2"),
      t("member.partnerJoin.packages.phase1.feature3"),
      t("member.partnerJoin.packages.phase1.feature4")
    ],
    popular: false
  },
  {
    id: "phase2",
    phase: 2,
    name: t("member.partnerJoin.packages.phase2.name"),
    price: 1300,
    lyPoints: 2600,
    rwaTokens: 3,
    features: [
      t("member.partnerJoin.packages.phase2.feature1"),
      t("member.partnerJoin.packages.phase2.feature2"),
      t("member.partnerJoin.packages.phase2.feature3"),
      t("member.partnerJoin.packages.phase2.feature4")
    ],
    popular: true
  },
  {
    id: "phase3",
    phase: 3,
    name: t("member.partnerJoin.packages.phase3.name"),
    price: 1500,
    lyPoints: 3000,
    rwaTokens: 4,
    features: [
      t("member.partnerJoin.packages.phase3.feature1"),
      t("member.partnerJoin.packages.phase3.feature2"),
      t("member.partnerJoin.packages.phase3.feature3"),
      t("member.partnerJoin.packages.phase3.feature4"),
      t("member.partnerJoin.packages.phase3.feature5")
    ],
    popular: false
  }
];

const getPaymentMethods = (t: (key: string) => string) => [
  { id: "fpx", name: t("member.partnerJoin.paymentMethods.fpx"), icon: Building2 },
  { id: "tng", name: t("member.partnerJoin.paymentMethods.tng"), icon: Wallet },
  { id: "card", name: t("member.partnerJoin.paymentMethods.card"), icon: CreditCard },
];

export default function PartnerJoinPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("fpx");
  const [referralCode, setReferralCode] = useState("");
  const [step, setStep] = useState<"profile" | "package" | "payment" | "success">("profile");

  // Profile form state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const packages = getPackages(t);
  const paymentMethods = getPaymentMethods(t);

  // Fetch current user state from Supabase
  const { data: userState, isLoading, refetch: refetchUserState } = useQuery<UserStateData>({
    queryKey: ["partner-join-state"],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { user: null, member: null, partner: null };

        // Get member
        const { member } = await getMemberByUserId(user.id);

        // Get partner if member exists
        let partner: Partner | null = null;
        if (member) {
          const partnerResult = await getPartnerByMemberId(member.id);
          partner = partnerResult.partner;
        }

        return {
          user: { id: user.id, email: user.email } as UserType,
          member,
          partner,
        };
      } catch (error) {
        console.error("Error fetching user state:", error);
        return { user: null, member: null, partner: null };
      }
    },
    retry: 1,
    staleTime: 0,
  });

  // Determine initial step based on user state
  useEffect(() => {
    if (userState) {
      if (userState.member) {
        // Has member profile, go to package selection
        setStep("package");
      } else if (userState.user) {
        // Has user but no member profile, show profile form
        setStep("profile");
      }
    }
  }, [userState]);

  // Handle profile creation
  const handleCreateProfile = async () => {
    if (!profileName.trim() || !profilePhone.trim()) {
      toast({
        title: t("auth.fillRequired") || "请填写必填项",
        variant: "destructive",
      });
      return;
    }

    if (!userState?.user) return;

    setIsCreatingProfile(true);
    try {
      const { member, error } = await createOrGetMember(userState.user.id, {
        name: profileName.trim(),
        phone: profilePhone.trim(),
        email: userState.user.email,
      });

      if (error) throw error;

      // Also update users table
      await supabase
        .from("users")
        .update({
          first_name: profileName.trim(),
          phone: profilePhone.trim(),
          role: "member",
        })
        .eq("id", userState.user.id);

      toast({
        title: t("auth.profileSaved") || "资料已保存",
      });

      // Refetch user state and proceed to package selection
      await refetchUserState();
      setStep("package");
    } catch (err: any) {
      toast({
        title: t("auth.profileSaveFailed") || "保存失败",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const joinMutation = useMutation({
    mutationFn: async (data: { tier: "phase1" | "phase2" | "phase3"; referralCode?: string }) => {
      if (!userState?.member) {
        throw new Error("Please complete your member profile first");
      }

      const { partner, error } = await createPartner(
        userState.member.id,
        data.tier,
        data.referralCode,
        `PAY_${Date.now()}` // Payment reference - in production, get from Stripe
      );

      if (error) throw error;
      return partner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-join-state"] });
      setStep("success");
      toast({
        title: t("member.partnerJoin.applicationSubmitted"),
        description: t("member.partnerJoin.applicationDesc"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("member.partnerJoin.applicationFailed"),
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async () => {
    if (!selectedPackage || !userState?.member) return;

    const selectedPkg = packages.find(p => p.id === selectedPackage);
    if (!selectedPkg) return;

    setIsProcessingPayment(true);

    try {
      // Create Stripe checkout session for partner package
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-partner-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            memberId: userState.member.id,
            tier: selectedPackage,
            packageName: selectedPkg.name,
            price: selectedPkg.price * 100, // Convert to cents
            referralCode: referralCode || undefined,
            successUrl: `${window.location.origin}/member/partner?payment=success`,
            cancelUrl: `${window.location.origin}/partner/join?payment=cancelled`,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || "Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        title: t("member.partnerJoin.applicationFailed"),
        description: error.message,
        variant: "destructive",
      });
      setIsProcessingPayment(false);
    }
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
              <CardTitle className="text-2xl">{t("member.partnerJoin.title")}</CardTitle>
              <CardDescription>{t("member.partnerJoin.loginRequired")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg text-left">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-secondary" />
                  {t("member.partnerJoin.exclusiveBenefits")}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {t("member.partnerJoin.maxLyPoints")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {t("member.partnerJoin.rwaDividend")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {t("member.partnerJoin.tenLevelNetwork")}
                  </li>
                </ul>
              </div>

              <Button
                className="w-full bg-secondary text-secondary-foreground gap-2"
                size="lg"
                onClick={() => window.location.href = "/auth/login"}
                data-testid="button-login-join"
              >
                <Crown className="w-5 h-5" />
                {t("member.partnerJoin.loginToJoin")}
              </Button>

              <Link href="/partner">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {t("member.partnerJoin.learnMore")}
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
              <CardTitle className="text-2xl">{t("member.partnerJoin.alreadyPartner")}</CardTitle>
              <CardDescription>
                {userState.partner.status === "active" 
                  ? t("member.partnerJoin.accountActive")
                  : t("member.partnerJoin.pendingReview")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">{userState.partner.lyBalance}</div>
                  <div className="text-xs text-muted-foreground">{t("member.partnerDashboard.lyPoints")}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{userState.partner.rwaTokens}</div>
                  <div className="text-xs text-muted-foreground">{t("member.partnerDashboard.rwaToken")}</div>
                </div>
                <div className="text-center">
                  <Badge variant={userState.partner.status === "active" ? "default" : "outline"}>
                    {userState.partner.status === "active" ? t("member.partnerJoin.activated") : t("member.partnerJoin.pending")}
                  </Badge>
                </div>
              </div>

              <Link href="/member/partner">
                <Button className="w-full bg-secondary text-secondary-foreground gap-2" data-testid="button-go-dashboard">
                  <TrendingUp className="w-5 h-5" />
                  {t("member.partnerJoin.goToDashboard")}
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
              <CardTitle className="text-2xl">{t("member.partnerJoin.applicationSuccess")}</CardTitle>
              <CardDescription>{t("member.partnerJoin.congratsMessage")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t("member.partnerJoin.reviewProcess")}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <span>{t("member.partnerJoin.ensurePayment")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Link href="/member">
                  <Button variant="outline" className="w-full">{t("member.partnerJoin.backToMember")}</Button>
                </Link>
                <Link href="/">
                  <Button variant="ghost" className="w-full">{t("member.partnerJoin.backToHome")}</Button>
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
              <span className="font-semibold">{t("member.partnerJoin.joinPartner")}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-primary-foreground border-primary-foreground/30">
            {step === "profile"
              ? (t("member.partnerJoin.stepProfile") || "步骤 1/3")
              : step === "package"
                ? (t("member.partnerJoin.step1") || "步骤 2/3")
                : (t("member.partnerJoin.step2") || "步骤 3/3")}
          </Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Profile Step - Show when user is logged in but has no member profile */}
        {step === "profile" && userState?.user && !userState?.member && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-secondary" />
              </div>
              <h1 className="text-2xl font-serif text-primary mb-2">
                {t("member.partnerJoin.completeProfile") || "完善个人资料"}
              </h1>
              <p className="text-muted-foreground">
                {t("member.partnerJoin.profileDesc") || "成为经营人前，请先填写基本信息"}
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profileName">
                    {t("auth.firstName") || "姓名"} *
                  </Label>
                  <Input
                    id="profileName"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={t("member.partnerJoin.namePlaceholder") || "请输入您的姓名"}
                    data-testid="input-profile-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePhone">
                    {t("auth.phone") || "手机号码"} *
                  </Label>
                  <Input
                    id="profilePhone"
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+60 12-345 6789"
                    data-testid="input-profile-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    {t("auth.email") || "邮箱"}
                  </Label>
                  <Input
                    value={userState.user.email || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full bg-secondary text-secondary-foreground gap-2"
              size="lg"
              onClick={handleCreateProfile}
              disabled={isCreatingProfile || !profileName.trim() || !profilePhone.trim()}
              data-testid="button-save-profile"
            >
              {isCreatingProfile ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5" />
              )}
              {t("member.partnerJoin.continueToPackage") || "继续选择配套"}
            </Button>
          </div>
        )}

        {step === "package" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-serif text-primary mb-2">{t("member.partnerJoin.selectPackage")}</h1>
              <p className="text-muted-foreground">{t("member.partnerJoin.selectPackageDesc")}</p>
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
                      {t("member.partnerJoin.mostPopular")}
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
                <Label htmlFor="referral" className="text-sm font-medium">{t("member.partnerJoin.referralCodeLabel")}</Label>
                <Input 
                  id="referral"
                  placeholder={t("member.partnerJoin.referralCodePlaceholder")}
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
              {t("member.partnerJoin.nextStep")}
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
              {t("member.partnerJoin.backToPackage")}
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t("member.partnerJoin.orderConfirm")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedPackage && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("member.partnerJoin.package")}</span>
                          <span className="font-medium">
                            {packages.find(p => p.id === selectedPackage)?.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("member.partnerDashboard.lyPoints")}</span>
                          <span className="font-medium text-secondary">
                            +{packages.find(p => p.id === selectedPackage)?.lyPoints}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("member.partnerDashboard.rwaToken")}</span>
                          <span className="font-medium text-primary">
                            +{packages.find(p => p.id === selectedPackage)?.rwaTokens}
                          </span>
                        </div>
                        {referralCode && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("member.partnerJoin.referralCodeLabel")}</span>
                            <span className="font-mono">{referralCode}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>{t("member.partnerJoin.amountToPay")}</span>
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
                    <CardTitle>{t("member.partnerJoin.selectPayment")}</CardTitle>
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
                      {t("member.partnerJoin.securityGuarantee")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>{t("member.partnerJoin.encryptedTransaction")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>{t("member.partnerJoin.activationTime")}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>{t("member.partnerJoin.support24h")}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {t("member.partnerJoin.paymentNote")}
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Button
                  className="w-full bg-secondary text-secondary-foreground gap-2"
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isProcessingPayment}
                  data-testid="button-pay"
                >
                  {isProcessingPayment ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {t("member.partnerJoin.confirmPay")} RM {packages.find(p => p.id === selectedPackage)?.price.toLocaleString()}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
