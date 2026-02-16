import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getPartnerByMemberId } from "@/lib/partner";
import { useAuth } from "@/contexts/AuthContext";
import { MemberLayout } from "@/components/MemberLayout";
import { useTranslation } from "@/lib/i18n";
import {
  Crown, CheckCircle, Loader2, Star, Gift,
  TrendingUp, Award, ShieldCheck, CreditCard,
  AlertCircle, PartyPopper, ArrowRight
} from "lucide-react";
import type { Partner } from "@shared/types";

const REFERRAL_STORAGE_KEY = "loveyoung_referral_code";

const getPackages = (t: (key: string) => string) => [
  {
    id: "phase1",
    phase: 1,
    name: t("member.partnerJoin.packages.phase1.name"),
    price: 1000,
    lyPoints: 2000,
    rwaTokens: 1,
    features: [
      t("member.partnerJoin.packages.phase1.feature1"),
      t("member.partnerJoin.packages.phase1.feature2"),
      t("member.partnerJoin.packages.phase1.feature3"),
      t("member.partnerJoin.packages.phase1.feature4"),
    ],
    available: true,
  },
  {
    id: "phase2",
    phase: 2,
    name: t("member.partnerJoin.packages.phase2.name"),
    price: 1300,
    lyPoints: 2600,
    rwaTokens: 1,
    features: [
      t("member.partnerJoin.packages.phase2.feature1"),
      t("member.partnerJoin.packages.phase2.feature2"),
      t("member.partnerJoin.packages.phase2.feature3"),
      t("member.partnerJoin.packages.phase2.feature4"),
    ],
    available: false,
  },
  {
    id: "phase3",
    phase: 3,
    name: t("member.partnerJoin.packages.phase3.name"),
    price: 1500,
    lyPoints: 3000,
    rwaTokens: 1,
    features: [
      t("member.partnerJoin.packages.phase3.feature1"),
      t("member.partnerJoin.packages.phase3.feature2"),
      t("member.partnerJoin.packages.phase3.feature3"),
      t("member.partnerJoin.packages.phase3.feature4"),
      t("member.partnerJoin.packages.phase3.feature5"),
    ],
    available: false,
  },
];

export default function MemberPartnerJoinPage() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, member, refreshUserData } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string | null>("phase1");
  const [referralCode, setReferralCode] = useState("");
  const [step, setStep] = useState<"package" | "payment" | "success">("package");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const packages = getPackages(t);

  // Fetch partner status
  const { data: partner, isLoading, refetch: refetchPartner } = useQuery<Partner | null>({
    queryKey: ["member-partner-join", member?.id],
    queryFn: async () => {
      if (!member?.id) return null;
      const { partner } = await getPartnerByMemberId(member.id);
      return partner;
    },
    enabled: !!member?.id,
    staleTime: 30_000,
  });

  // Auto-fill referral code from URL or localStorage (only needed if not already a partner)
  useEffect(() => {
    if (partner) return; // Partners don't need referral codes
    const params = new URLSearchParams(window.location.search);
    const refFromUrl = params.get("ref");
    if (refFromUrl) {
      setReferralCode(refFromUrl.toUpperCase());
      try { localStorage.setItem(REFERRAL_STORAGE_KEY, refFromUrl.toUpperCase()); } catch {}
    } else {
      try {
        const cached = localStorage.getItem(REFERRAL_STORAGE_KEY);
        if (cached) setReferralCode(cached.toUpperCase());
      } catch {}
    }
  }, [partner]);

  // Handle payment=success redirect from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      setStep("success");
      window.history.replaceState({}, "", window.location.pathname);
      refetchPartner();
      refreshUserData();
    }
  }, []);

  const handleSubmit = async () => {
    if (!selectedPackage || !member) return;

    const selectedPkg = packages.find((p) => p.id === selectedPackage);
    if (!selectedPkg) return;

    setIsProcessingPayment(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-partner-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            memberId: member.id,
            tier: selectedPackage,
            packageName: selectedPkg.name,
            price: selectedPkg.price * 100, // Convert to cents
            referralCode: referralCode || undefined,
            isUpgrade: !!partner,
            successUrl: `${window.location.origin}/member/partner-join?payment=success`,
            cancelUrl: `${window.location.origin}/member/partner-join?payment=cancelled`,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.url) {
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
      <MemberLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  // Payment success screen
  if (step === "success") {
    return (
      <MemberLayout>
        <div className="max-w-lg mx-auto py-8">
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
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>{t("member.partnerJoin.ensurePayment")}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full bg-secondary text-secondary-foreground gap-2"
                  onClick={() => navigate("/member/partner")}
                >
                  <TrendingUp className="w-5 h-5" />
                  {t("member.partnerJoin.goToDashboard")}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/member")}
                >
                  {t("member.partnerJoin.backToMember")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </MemberLayout>
    );
  }

  const selectedPkg = packages.find((p) => p.id === selectedPackage);

  return (
    <MemberLayout>
      <div className="space-y-6 py-4">
        {/* Title section */}
        <div>
          <h1 className="text-2xl font-serif text-primary flex items-center gap-2">
            <Crown className="w-6 h-6 text-secondary" />
            参与经营人
          </h1>
          <p className="text-muted-foreground mt-1">
            购买经营人配套，获得 LY 积分和 RWA 令牌，开启分润收益
          </p>
        </div>

        {/* Existing partner status card */}
        {partner && (
          <Card className="border-secondary/50 bg-secondary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">{t("member.partnerJoin.alreadyPartner")}</span>
                <Badge variant="outline" className="ml-auto">
                  Phase {partner.tier === "phase1" ? 1 : partner.tier === "phase2" ? 2 : 3}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex flex-col items-center p-2 bg-background rounded">
                  <span className="text-muted-foreground text-xs">LY 积分</span>
                  <span className="font-bold text-secondary">{partner.lyBalance ?? 0}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-background rounded">
                  <span className="text-muted-foreground text-xs">RWA 令牌</span>
                  <span className="font-bold text-primary">{partner.rwaTokens ?? 0}</span>
                </div>
                <div className="flex flex-col items-center p-2 bg-background rounded">
                  <span className="text-muted-foreground text-xs">已购配套</span>
                  <span className="font-bold">{partner.packagesPurchased ?? 1}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                追加配套将增加您的 LY 积分和 RWA 令牌
              </p>
            </CardContent>
          </Card>
        )}

        {/* Package selection step */}
        {step === "package" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative transition-all ${
                    !pkg.available
                      ? "opacity-60 cursor-not-allowed"
                      : selectedPackage === pkg.id
                        ? "border-secondary ring-2 ring-secondary/20 cursor-pointer"
                        : "hover:border-primary/50 cursor-pointer"
                  }`}
                  onClick={() => pkg.available && setSelectedPackage(pkg.id)}
                  data-testid={`package-${pkg.id}`}
                >
                  {!pkg.available && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted text-muted-foreground">
                      {t("member.partnerJoin.comingSoon") || "即将推出"}
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
                          <CheckCircle
                            className={`w-4 h-4 flex-shrink-0 ${pkg.available ? "text-green-500" : "text-muted-foreground"}`}
                          />
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

            {/* Referral code display (only for non-partners) */}
            {!partner && referralCode && (
              <Card className="border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/30">
                <CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t("member.partnerJoin.referralCodeLabel")}</p>
                    <p className="font-mono text-lg font-bold text-primary">{referralCode}</p>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    已应用
                  </Badge>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full bg-secondary text-secondary-foreground gap-2"
              size="lg"
              disabled={!selectedPackage}
              onClick={() => setStep("payment")}
              data-testid="button-next"
            >
              {t("member.partnerJoin.nextStep")}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Payment confirmation step */}
        {step === "payment" && selectedPkg && (
          <div className="max-w-lg mx-auto space-y-6">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => setStep("package")}
            >
              {t("member.partnerJoin.backToPackage")}
            </Button>

            <Card>
              <CardHeader>
                <CardTitle>{t("member.partnerJoin.orderConfirm")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {partner && (
                  <div className="flex items-center gap-2 p-2 bg-secondary/10 rounded text-sm mb-2">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span>追加配套 — 额外 RWA 和 LY 将累加到您的账户</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("member.partnerJoin.package")}</span>
                  <span className="font-medium">{selectedPkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("member.partnerDashboard.lyPoints")}</span>
                  <span className="font-medium text-secondary">+{selectedPkg.lyPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("member.partnerDashboard.rwaToken")}</span>
                  <span className="font-medium text-primary">+{selectedPkg.rwaTokens}</span>
                </div>
                {!partner && referralCode && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("member.partnerJoin.referralCodeLabel")}</span>
                    <span className="font-mono">{referralCode}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t("member.partnerJoin.amountToPay")}</span>
                  <span className="text-primary">RM {selectedPkg.price.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-secondary/10 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
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
                  <span>{t("member.partnerJoin.paymentNote")}</span>
                </p>
              </CardContent>
            </Card>

            <Button
              className="w-full bg-[#635BFF] hover:bg-[#5851DB] text-white gap-2"
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
              {t("member.partnerJoin.confirmPay")} RM {selectedPkg.price.toLocaleString()}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              {t("member.partnerJoin.stripePaymentNote") || "支持信用卡、FPX、GrabPay 等支付方式"}
            </p>
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
