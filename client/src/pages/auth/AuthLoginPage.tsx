import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { Loader2, Mail, ArrowLeft, User } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { apiRequest } from "@/lib/queryClient";

type AuthStep = "email" | "otp" | "profile";

export default function AuthLoginPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { sendOTP, verifyOTP, signInWithGoogle, user, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<AuthStep>("email");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Profile info for new users
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user && step !== "profile") {
      navigate("/");
    }
  }, [user, step, navigate]);

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
        // Check if user profile exists
        try {
          const response = await fetch('/api/auth/user');
          if (response.status === 404) {
            // New user - need to fill profile
            setIsNewUser(true);
            setStep("profile");
          } else {
            toast({ title: t("auth.loginSuccess") });
            navigate("/");
          }
        } catch {
          // Assume new user
          setIsNewUser(true);
          setStep("profile");
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
      await apiRequest('POST', '/api/auth/complete-profile', {
        firstName,
        lastName,
        phone,
      });
      toast({ title: t("auth.profileSaved") });
      navigate("/");
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
