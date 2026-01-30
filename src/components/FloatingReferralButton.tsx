import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Share2, Copy, X, CheckCircle } from "lucide-react";

export function FloatingReferralButton() {
  const { user, member } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const referralCode = member?.referralCode || "";
  const referralLink = referralCode
    ? `${window.location.origin}/auth/login?ref=${referralCode}`
    : "";

  // Only show for logged-in members with a referral code
  if (!user || !member || !referralCode) return null;

  const copyToClipboard = async (text: string, field: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({ title: `${label}已复制到剪贴板` });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  const shareToWhatsApp = () => {
    const text = `LOVEYOUNG 养乐鲜炖 - 马来西亚优质燕窝花胶品牌！使用我的推荐码 ${referralCode} 注册享优惠！\n${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-[61] w-[calc(100%-2rem)] max-w-sm bg-card border rounded-xl shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-200">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-sm">我的推荐链接</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-4 space-y-3">
            {/* Referral Code */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">推荐码</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-mono font-bold text-primary tracking-wider flex-1">
                  {referralCode}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => copyToClipboard(referralCode, "code", "推荐码")}
                >
                  {copiedField === "code" ? (
                    <CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1" />
                  )}
                  复制
                </Button>
              </div>
            </div>

            {/* Referral Link */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">推荐链接</p>
              <div className="flex items-center gap-2">
                <Input
                  value={referralLink}
                  readOnly
                  className="font-mono text-xs h-8"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => copyToClipboard(referralLink, "link", "推荐链接")}
                >
                  {copiedField === "link" ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Share */}
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                onClick={shareToWhatsApp}
              >
                <Share2 className="w-3.5 h-3.5 mr-1" />
                WhatsApp
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => copyToClipboard(referralLink, "link", "推荐链接")}
              >
                <Copy className="w-3.5 h-3.5 mr-1" />
                复制链接
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      <Button
        onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-[60] h-12 w-12 rounded-full shadow-lg bg-primary hover:bg-primary/90"
        size="icon"
        data-testid="button-floating-referral"
      >
        {open ? (
          <X className="w-5 h-5" />
        ) : (
          <Share2 className="w-5 h-5" />
        )}
      </Button>
    </>
  );
}
