import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedReferralCode, clearCachedReferralCode } from "@/pages/auth/AuthLoginPage";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const { refreshUserData, user, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          navigate("/auth/login");
          return;
        }

        if (session) {
          // Wait for user data to be fetched and role to be determined
          await refreshUserData().catch(() => {});

          const userId = session.user.id;

          // Check user role from users table
          const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

          if (userData?.role === 'admin') {
            navigate("/admin");
            return;
          }

          // Check member role
          const { data: memberData } = await supabase
            .from('members')
            .select('id, role, referrer_id')
            .eq('user_id', userId)
            .single();

          // If member exists but has no referrer, apply cached referral code
          if (memberData && !memberData.referrer_id) {
            const cachedRef = getCachedReferralCode();
            if (cachedRef) {
              // Look up referrer via RPC (works regardless of RLS)
              const { data: refResult } = await supabase.rpc("validate_referral_code", { code: cachedRef });
              if (refResult?.valid && refResult.referrer_member_id) {
                await supabase
                  .from("members")
                  .update({ referrer_id: refResult.referrer_member_id })
                  .eq("id", memberData.id);
              }
              clearCachedReferralCode();
            }
          }

          if (memberData?.role === 'partner' || memberData?.role === 'admin') {
            navigate("/member/partner");
          } else if (memberData) {
            navigate("/member");
          } else {
            // No member record — redirect to login for profile completion
            // Keep cached referral code for the profile step
            navigate("/auth/login");
          }
        } else {
          navigate("/auth/login");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        navigate("/auth/login");
      } finally {
        setIsProcessing(false);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">正在完成登录...</p>
      </div>
    </div>
  );
}
