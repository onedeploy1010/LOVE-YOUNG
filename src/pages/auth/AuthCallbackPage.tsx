import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedReferralCode, clearCachedReferralCode } from "@/pages/auth/AuthLoginPage";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const { refreshUserData, role, member, loading } = useAuth();
  const processedRef = useRef(false);

  // Step 1: On mount, trigger refreshUserData so AuthContext picks up the new session
  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;
    refreshUserData().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Step 2: Once AuthContext finishes loading (role resolved), redirect
  useEffect(() => {
    if (loading) return;

    // Apply cached referral code if member has no referrer
    const applyReferralAndRedirect = async () => {
      if (member && !member.referrerId) {
        const cachedRef = getCachedReferralCode();
        if (cachedRef) {
          try {
            const { data: refResult } = await supabase.rpc("validate_referral_code", { code: cachedRef });
            if (refResult?.valid && refResult.referrer_member_id) {
              await supabase
                .from("members")
                .update({ referrer_id: refResult.referrer_member_id })
                .eq("id", member.id);
            }
          } catch {}
          clearCachedReferralCode();
        }
      }

      if (role === 'admin') {
        navigate("/admin");
      } else if (role === 'partner') {
        navigate("/member/partner");
      } else if (role === 'member') {
        navigate("/member");
      } else if (member) {
        // member record exists but role hasn't updated yet
        navigate("/member");
      } else {
        // No member record — redirect to login for profile completion
        navigate("/auth/login");
      }
    };

    applyReferralAndRedirect();
  }, [loading, role, member, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">正在完成登录...</p>
      </div>
    </div>
  );
}
