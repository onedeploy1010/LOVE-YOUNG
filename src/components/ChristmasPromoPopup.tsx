import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Snowflake, Copy, Check } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface ChristmasPromoPopupProps {
  whatsappLink: string;
  metaShopLink: string;
}

export function ChristmasPromoPopup({ whatsappLink, metaShopLink }: ChristmasPromoPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const promoCode = "XMAS2024";
  const discountPercent = 15;

  useEffect(() => {
    const hasSeenPromo = sessionStorage.getItem("christmas_promo_seen");
    if (!hasSeenPromo) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("christmas_promo_seen", "true");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(promoCode);
      setCopied(true);
      toast({
        title: "已复制优惠码",
        description: `优惠码 ${promoCode} 已复制到剪贴板`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "复制失败",
        description: "请手动复制优惠码",
        variant: "destructive",
      });
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`您好！我想使用圣诞优惠码 ${promoCode} 订购产品。`);
    window.open(`${whatsappLink.split("?")[0]}?text=${message}`, "_blank");
    handleClose();
  };

  const handleShopNow = () => {
    window.open(metaShopLink, "_blank");
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className="max-w-md mx-4 p-0 overflow-hidden border-0"
        data-testid="modal-christmas-promo"
      >
        <div className="relative bg-gradient-to-br from-red-600 via-red-700 to-green-800 p-6 pb-4 text-white">
          <div className="absolute top-2 right-10 opacity-30">
            <Snowflake className="w-8 h-8 animate-spin" style={{ animationDuration: "8s" }} />
          </div>
          <div className="absolute top-12 right-4 opacity-20">
            <Snowflake className="w-6 h-6 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
          <div className="absolute bottom-4 left-4 opacity-20">
            <Snowflake className="w-5 h-5 animate-spin" style={{ animationDuration: "10s" }} />
          </div>
          
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <DialogTitle className="text-2xl font-serif text-white">
                圣诞特别优惠
              </DialogTitle>
            </div>
            <DialogDescription className="text-white/90 text-base">
              LOVEYOUNG 祝您圣诞快乐！限时特惠，燕窝花胶全场享折扣
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5 bg-card">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-sm">使用优惠码享受</p>
            <div className="text-4xl font-bold text-primary" data-testid="text-discount-percent">
              {discountPercent}% OFF
            </div>
            <p className="text-muted-foreground text-sm">全场燕窝花胶产品</p>
          </div>

          <div className="bg-muted/50 rounded-md p-4">
            <p className="text-xs text-muted-foreground mb-2 text-center">您的专属优惠码</p>
            <div className="flex items-center justify-center gap-2">
              <code 
                className="text-xl font-mono font-bold tracking-wider text-foreground bg-background px-4 py-2 rounded-md border border-border"
                data-testid="text-promo-code"
              >
                {promoCode}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                data-testid="button-copy-code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full gap-2"
              onClick={handleShopNow}
              data-testid="button-promo-shop"
            >
              <Gift className="w-4 h-4" />
              立即选购
            </Button>
            
            <Button 
              variant="outline"
              className="w-full gap-2"
              onClick={handleWhatsApp}
              data-testid="button-promo-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4" />
              WhatsApp 咨询下单
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            优惠有效期至 2024年12月31日 | 下单时报上优惠码即可
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
