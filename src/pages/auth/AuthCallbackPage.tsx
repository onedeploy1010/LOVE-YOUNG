import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const { refreshUserData, role } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        navigate("/auth/login");
        return;
      }

      if (session) {
        // Refresh user data to get role info
        await refreshUserData();

        // Redirect based on role
        if (role === 'admin') {
          navigate("/admin");
        } else if (role === 'partner') {
          navigate("/member/partner");
        } else if (role === 'member') {
          navigate("/member");
        } else {
          navigate("/");
        }
      } else {
        navigate("/auth/login");
      }
    };

    handleAuthCallback();
  }, [navigate, refreshUserData, role]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">正在完成登录...</p>
      </div>
    </div>
  );
}
