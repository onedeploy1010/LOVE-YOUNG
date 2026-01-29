import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

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
          await refreshUserData();

          // After refresh, get the latest role from database
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
            .select('role')
            .eq('user_id', userId)
            .single();

          if (memberData?.role === 'partner' || memberData?.role === 'admin') {
            navigate("/member/partner");
          } else if (memberData) {
            navigate("/member");
          } else {
            navigate("/");
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

    // Only run once when component mounts
    handleAuthCallback();
  }, []); // Remove dependencies to run only once

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">正在完成登录...</p>
      </div>
    </div>
  );
}
