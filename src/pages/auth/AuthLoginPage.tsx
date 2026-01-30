import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Loader2, Mail, ArrowLeft, User, Gift } from "lucide-react";
import { SiGoogle } from "react-icons/si";

type AuthStep = "email" | "otp" | "profile";

const REFERRAL_STORAGE_KEY = "loveyoung_referral_code";

/** Save referral code to localStorage so it survives redirects and page reloads */
function cacheReferralCode(code: string) {
  try { localStorage.setItem(REFERRAL_STORAGE_KEY, code); } catch {}
}

/** Read cached referral code */
export function getCachedReferralCode(): string | null {
  try { return localStorage.getItem(REFERRAL_STORAGE_KEY); } catch { return null; }
}

/** Clear cached referral code after it's been applied */
export function clearCachedReferralCode() {
  try { localStorage.removeItem(REFERRAL_STORAGE_KEY); } catch {}
}

export default function AuthLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { sendOTP, verifyOTP, signInWithGoogle, user, role, loading: authLoading, refreshUserData } = useAuth();

  const [step, setStep] = useState<AuthStep>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);

  // Profile info for new users
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Referral code from URL or localStorage cache
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);

  // Capture referral code from URL on mount — cache to localStorage IMMEDIATELY
  // so it survives any redirect (e.g. already-logged-in user visiting ref link)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      const code = ref.toUpperCase();
      cacheReferralCode(code);
      setReferralCode(code);
      validateReferralCode(code);
    } else {
      // No ref in URL — check localStorage for a previously cached code
      const cached = getCachedReferralCode();
      if (cached) {
        setReferralCode(cached);
        validateReferralCode(cached);
      }
    }
  }, []);

  // Validate referral code via RPC (works for anon + authenticated)
  const validateReferralCode = async (code: string) => {
    const { data, error } = await supabase.rpc("validate_referral_code", { code });
    if (!error && data?.valid) {
      setReferrerName(data.referrer_name || "LOVEYOUNG 会员");
    }
  };

  // Redirect if already logged in based on role.
  // Only redirect from the initial "email" step — never during "otp" or "profile"
  // because verifyOTP sets user in AuthContext before handleVerifyOTP can check
  // whether the user needs the profile step (race condition).
  useEffect(() => {
    if (user && !authLoading && step === "email") {
      if (role === 'admin') {
        navigate("/admin");
      } else if (role === 'partner') {
        navigate("/member/partner");
      } else if (role === 'member') {
        navigate("/member");
      } else {
        navigate("/");
      }
    }
  }, [user, role, authLoading, step, navigate]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const { error } = await sendOTP(email);
      if (error) {
        toast({
          title: t("auth.sendOTPFailed"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.otpSent"),
          description: t("auth.checkEmailForOTP"),
        });
        setStep("otp");
      }
    } catch (err: any) {
      toast({
        title: t("auth.sendOTPFailed"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setIsLoading(true);

    try {
      const { error } = await verifyOTP(email, otpCode);
      if (error) {
        toast({
          title: t("auth.verifyOTPFailed"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Refresh user data after login (ignore abort if component unmounts)
        await refreshUserData().catch(() => {});

        // Check if user profile exists in users table
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          const { data: userData } = await supabase
            .from('users')
            .select('first_name, phone')
            .eq('id', authUser.id)
            .single();

          if (!userData?.first_name || !userData?.phone) {
            // New user - need to fill profile
            setIsNewUser(true);
            setStep("profile");
          } else {
            toast({ title: t("auth.loginSuccess") });
            // Navigation will be handled by useEffect
          }
        }
      }
    } catch (err: any) {
      toast({
        title: t("auth.verifyOTPFailed"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !phone) {
      toast({
        title: t("auth.fillRequired"),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not authenticated");

      // Update user profile in users table
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
          role: 'member',
        })
        .eq('id', authUser.id);

      if (userError) throw userError;

      // Generate unique referral code for new member
      const generateCode = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      // Find referrer member ID from referral code (codes live on members table)
      let referrerId: string | null = null;
      if (referralCode) {
        const { data: refResult } = await supabase.rpc("validate_referral_code", { code: referralCode });
        if (refResult?.valid) {
          referrerId = refResult.referrer_member_id;
        }
      }

      // Create member record
      const { error: memberError } = await supabase
        .from('members')
        .insert({
          user_id: authUser.id,
          name: `${firstName} ${lastName}`.trim(),
          phone: phone,
          email: authUser.email,
          role: 'member',
          points_balance: 0,
          referral_code: generateCode(),
          referrer_id: referrerId,
          created_at: new Date().toISOString(),
        });

      if (memberError && !memberError.message.includes('duplicate')) {
        console.error("Error creating member:", memberError);
      }

      // If there's a referrer, notify them and clear cached code
      if (referrerId) {
        clearCachedReferralCode();
        toast({
          title: t("auth.referralApplied") || "推荐码已应用",
          description: referrerName ? `感谢 ${referrerName} 的推荐！` : undefined,
        });
      }

      await refreshUserData();
      toast({ title: t("auth.profileSaved") });
      navigate("/member");
    } catch (err: any) {
      toast({
        title: t("auth.profileSaveFailed"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: t("auth.loginFailed"),
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: t("auth.loginFailed"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === "profile") {
      setStep("otp");
    } else {
      setStep("email");
      setOtpCode("");
    }
  };

  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const { error } = await sendOTP(email);
      if (error) {
        toast({
          title: t("auth.sendOTPFailed"),
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.otpResent"),
          description: t("auth.checkEmailForOTP"),
        });
      }
    } catch (err: any) {
      toast({
        title: t("auth.sendOTPFailed"),
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-primary/5 to-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif text-primary">LOVEYOUNG</CardTitle>
          <CardDescription>
            {step === "profile" ? t("auth.completeProfile") : t("auth.welcomeBack")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "email" && (
            <>
              {referralCode && referrerName && (
                <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Gift className="w-4 h-4 text-secondary" />
                    <span className="text-muted-foreground">推荐人:</span>
                    <Badge variant="secondary" className="font-medium">{referrerName}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    注册后将自动绑定推荐关系
                  </p>
                </div>
              )}

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isLoading || !email}
                  data-testid="button-send-otp"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {t("auth.sendOTP")}
                    </>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t("auth.or")}</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                data-testid="button-google-login"
              >
                <SiGoogle className="w-4 h-4" />
                {t("auth.continueWithGoogle")}
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <div className="text-center space-y-2 mb-4">
                <p className="text-sm text-muted-foreground">
                  {t("auth.otpSentTo")} <strong>{email}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">{t("auth.enterOTP")}</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                    data-testid="input-otp"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || otpCode.length !== 6}
                  data-testid="button-verify-otp"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.verifyOTP")}
                </Button>
              </form>

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleResendOTP}
                  disabled={isLoading}
                  data-testid="button-resend-otp"
                >
                  {t("auth.resendOTP")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2"
                  onClick={handleBack}
                  disabled={isLoading}
                  data-testid="button-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t("auth.changeEmail")}
                </Button>
              </div>
            </>
          )}

          {step === "profile" && (
            <>
              <div className="text-center space-y-2 mb-4">
                <User className="w-12 h-12 mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t("auth.newUserWelcome")}
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t("auth.firstName")} *</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("auth.lastName")}</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("auth.phone")} *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+60 12-345 6789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    data-testid="input-phone"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !firstName || !phone}
                  data-testid="button-save-profile"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.saveAndContinue")}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
