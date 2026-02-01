import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User, Crown, Shield, Star,
  Home, ShoppingBag, MapPin, Gift, Settings,
  Users, Wallet, TrendingUp, Award,
  ChevronRight,
  CreditCard, Bell, HelpCircle, Share2,
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

type MenuSection = {
  id: string;
  title: string;
  icon: React.ElementType;
  items: MenuItem[];
};

const getMenuSections = (t: (key: string) => string): MenuSection[] => [
  {
    id: "account",
    title: t("member.center.sections.account.title"),
    icon: User,
    items: [
      { icon: Home, label: t("member.center.menuItems.personalCenter"), href: "/member/settings", description: t("member.center.menuItems.personalCenterDesc") },
      { icon: Settings, label: t("member.center.menuItems.accountSettings"), href: "/member/settings", description: t("member.center.menuItems.accountSettingsDesc") },
      { icon: Bell, label: t("member.center.menuItems.notifications"), href: "/member/notifications", description: t("member.center.menuItems.notificationsDesc") },
      { icon: HelpCircle, label: t("member.center.menuItems.helpCenter"), href: "/member/help", description: t("member.center.menuItems.helpCenterDesc") },
    ]
  },
  {
    id: "member",
    title: t("member.center.sections.member.title"),
    icon: Star,
    items: [
      { icon: ShoppingBag, label: t("member.center.menuItems.orderHistory"), href: "/member/orders", description: t("member.center.menuItems.orderHistoryDesc") },
      { icon: MapPin, label: t("member.center.menuItems.addresses"), href: "/member/addresses", description: t("member.center.menuItems.addressesDesc") },
      { icon: Gift, label: t("member.center.menuItems.pointsCenter"), href: "/member/points", description: t("member.center.menuItems.pointsCenterDesc") },
      { icon: CreditCard, label: t("member.center.menuItems.paymentMethods"), href: "/member/payment", description: t("member.center.menuItems.paymentMethodsDesc") },
      { icon: Share2, label: t("member.center.menuItems.referralNetwork"), href: "/member/referrals", description: t("member.center.menuItems.referralNetworkDesc") },
      { icon: Users, label: t("member.center.menuItems.promoMaterials"), href: "/member/materials", description: t("member.center.menuItems.promoMaterialsDesc") },
    ]
  },
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
            data-testid={`menu-card-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
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

function RoleEntryCards({ role, t }: { role: string; t: (key: string) => string }) {
  const [, navigate] = useLocation();
  const showPartner = role === "partner" || role === "admin";
  const showAdmin = role === "admin";

  if (!showPartner && !showAdmin) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {showPartner && (
        <Card
          className="cursor-pointer hover-elevate group border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"
          onClick={() => navigate("/member/partner")}
          data-testid="entry-partner-center"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-amber-800 dark:text-amber-300">
                  {t("member.center.sections.partner.title")}
                </span>
                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400">
                  {t("member.center.userStates.partner")}
                </Badge>
              </div>
              <p className="text-sm text-amber-700/70 dark:text-amber-400/70 mt-0.5">
                {t("member.center.sectionDesc.partner")}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-amber-400 flex-shrink-0" />
          </CardContent>
        </Card>
      )}
      {showAdmin && (
        <Card
          className="cursor-pointer hover-elevate group border-primary/30 bg-primary/5"
          onClick={() => navigate("/admin")}
          data-testid="entry-admin-panel"
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-primary">
                  {t("admin.adminPanel")}
                </span>
                <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                  {t("member.center.userStates.admin")}
                </Badge>
              </div>
              <p className="text-sm text-primary/60 mt-0.5">
                {t("member.center.sectionDesc.adminCore")}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-primary/40 flex-shrink-0" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function MemberCenter() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("account");
  const { role } = useAuth();

  const sections = getMenuSections(t);
  const currentSection = sections.find(s => s.id === activeSection) || sections[0];
  const CurrentSectionIcon = currentSection.icon;

  return (
    <MemberLayout>
      {/* Role entry cards — always visible, especially on mobile */}
      <RoleEntryCards role={role} t={t} />

      {/* Section header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <CurrentSectionIcon className="w-6 h-6 text-secondary" />
          <h1 className="text-2xl font-serif font-bold text-foreground" data-testid="text-section-title">
            {currentSection.title}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {activeSection === "account" && t("member.center.sectionDesc.account")}
          {activeSection === "member" && t("member.center.sectionDesc.member")}
        </p>
      </div>

      {/* Section tabs: account / member only */}
      <div className="flex gap-2 mb-6">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-secondary/20 text-secondary font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
              data-testid={`tab-section-${section.id}`}
            >
              <SectionIcon className="w-4 h-4" />
              {section.title}
            </button>
          );
        })}
      </div>

      <MenuGrid items={currentSection.items} />
    </MemberLayout>
  );
}
