import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Crown, Shield, Star,
  ShoppingBag, MapPin, Gift,
  Users,
  ChevronRight,
  CreditCard, Share2,
  ShoppingCart,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { MemberLayout } from "@/components/MemberLayout";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  description?: string;
};

const getMemberItems = (t: (key: string) => string): MenuItem[] => [
  { icon: ShoppingBag, label: t("member.center.menuItems.orderHistory"), href: "/member/orders", description: t("member.center.menuItems.orderHistoryDesc") },
  { icon: MapPin, label: t("member.center.menuItems.addresses"), href: "/member/addresses", description: t("member.center.menuItems.addressesDesc") },
  { icon: Gift, label: t("member.center.menuItems.pointsCenter"), href: "/member/points", description: t("member.center.menuItems.pointsCenterDesc") },
  { icon: CreditCard, label: t("member.center.menuItems.paymentMethods"), href: "/member/payment", description: t("member.center.menuItems.paymentMethodsDesc") },
  { icon: Share2, label: t("member.center.menuItems.referralNetwork"), href: "/member/referrals", description: t("member.center.menuItems.referralNetworkDesc") },
  { icon: Users, label: t("member.center.menuItems.promoMaterials"), href: "/member/materials", description: t("member.center.menuItems.promoMaterialsDesc") },
];

function MenuGrid({ items }: { items: MenuItem[] }) {
  const [, navigate] = useLocation();
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <Card
            key={item.href + item.label}
            className="h-full hover-elevate cursor-pointer group"
            onClick={() => navigate(item.href)}
          >
            <CardContent className="p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-secondary/20 transition-colors">
                <ItemIcon className="w-6 h-6 text-secondary" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-foreground">{item.label}</span>
                {item.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function RoleEntryCards({ role, member, t }: { role: string; member: boolean; t: (key: string) => string }) {
  const [, navigate] = useLocation();
  const [showUpgrade, setShowUpgrade] = useState<string | null>(null);

  const showPartner = role === "partner" || role === "admin";
  const showAdmin = role === "admin";

  // Always show the two entry cards; non-eligible users get an upgrade prompt
  const handlePartnerClick = () => {
    if (showPartner) {
      navigate("/member/partner");
    } else {
      setShowUpgrade("partner");
    }
  };

  const handleAdminClick = () => {
    if (showAdmin) {
      navigate("/admin");
    } else {
      setShowUpgrade("admin");
    }
  };

  return (
    <div className="space-y-4 mt-8">
      {/* Upgrade prompt dialog */}
      {showUpgrade && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 dark:text-amber-300 flex-1">
              {t("member.center.upgradePrompt")}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowUpgrade(null)}>
                ✕
              </Button>
              <Button size="sm" onClick={() => navigate("/products")}>
                {t("member.center.goShopping")}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Partner center entry */}
        <Card
          className={`cursor-pointer hover-elevate group ${
            showPartner
              ? "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
              : "border-dashed opacity-75"
          }`}
          onClick={handlePartnerClick}
          data-testid="entry-partner-center"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              showPartner ? "bg-amber-100 dark:bg-amber-900/40" : "bg-muted"
            }`}>
              <Crown className={`w-6 h-6 ${showPartner ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${showPartner ? "text-amber-800 dark:text-amber-300" : "text-muted-foreground"}`}>
                  {t("member.center.sections.partner.title")}
                </span>
                {showPartner && (
                  <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                    {t("member.center.userStates.partner")}
                  </Badge>
                )}
              </div>
              <p className={`text-sm mt-0.5 ${showPartner ? "text-amber-700/70 dark:text-amber-400/70" : "text-muted-foreground"}`}>
                {t("member.center.sectionDesc.partner")}
              </p>
            </div>
            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${showPartner ? "text-amber-400" : "text-muted-foreground/40"}`} />
          </CardContent>
        </Card>

        {/* Admin panel entry */}
        <Card
          className={`cursor-pointer hover-elevate group ${
            showAdmin
              ? "border-primary/30 bg-primary/5"
              : "border-dashed opacity-75"
          }`}
          onClick={handleAdminClick}
          data-testid="entry-admin-panel"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              showAdmin ? "bg-primary/10" : "bg-muted"
            }`}>
              <Shield className={`w-6 h-6 ${showAdmin ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className={`font-semibold ${showAdmin ? "text-primary" : "text-muted-foreground"}`}>
                  {t("admin.adminPanel")}
                </span>
                {showAdmin && (
                  <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                    {t("member.center.userStates.admin")}
                  </Badge>
                )}
              </div>
              <p className={`text-sm mt-0.5 ${showAdmin ? "text-primary/60" : "text-muted-foreground"}`}>
                {t("member.center.sectionDesc.adminCore")}
              </p>
            </div>
            <ChevronRight className={`w-5 h-5 flex-shrink-0 ${showAdmin ? "text-primary/40" : "text-muted-foreground/40"}`} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function MemberCenter() {
  const { t } = useTranslation();
  const { role, member } = useAuth();
  const memberItems = getMemberItems(t);

  return (
    <MemberLayout>
      {/* Member section header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Star className="w-6 h-6 text-secondary" />
          <h1 className="text-2xl font-serif font-bold text-foreground" data-testid="text-section-title">
            {t("member.center.sections.member.title")}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {t("member.center.sectionDesc.member")}
        </p>
      </div>

      {/* Member feature cards — directly shown, no tabs */}
      <MenuGrid items={memberItems} />

      {/* Role entry cards at the bottom */}
      <RoleEntryCards role={role} member={!!member} t={t} />
    </MemberLayout>
  );
}
