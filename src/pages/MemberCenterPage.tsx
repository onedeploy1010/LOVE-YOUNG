import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User, Crown, Shield, Star,
  Home, ShoppingBag, MapPin, Gift, Settings,
  Users, Wallet, TrendingUp, Award, BarChart3,
  Package, ClipboardList, Truck, DollarSign, FileText,
  ChevronRight,
  CreditCard, Bell, HelpCircle, Share2,
  Building2, Boxes, Receipt, PiggyBank, UserPlus
} from "lucide-react";
import type { UserState, Partner } from "@shared/types";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { MemberLayout } from "@/components/MemberLayout";

type MenuItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
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
  {
    id: "partner",
    title: t("member.center.sections.partner.title"),
    icon: Crown,
    items: [
      { icon: TrendingUp, label: t("member.center.menuItems.overview"), href: "/member/partner", description: t("member.center.menuItems.overviewDesc") },
      { icon: Wallet, label: t("member.center.menuItems.lyPoints"), href: "/member/partner/ly-points", description: t("member.center.menuItems.lyPointsDesc") },
      { icon: DollarSign, label: t("member.center.menuItems.cashWallet"), href: "/member/partner/wallet", description: t("member.center.menuItems.cashWalletDesc") },
      { icon: Award, label: t("member.center.menuItems.rwaPool"), href: "/member/partner/rwa", description: t("member.center.menuItems.rwaPoolDesc") },
      { icon: TrendingUp, label: t("member.center.menuItems.earningsHistory"), href: "/member/partner/earnings", description: t("member.center.menuItems.earningsHistoryDesc") },
    ]
  },
  {
    id: "admin-core",
    title: t("member.center.sections.adminCore.title"),
    icon: Shield,
    items: [
      { icon: BarChart3, label: t("member.center.menuItems.dashboard"), href: "/admin", description: t("member.center.menuItems.dashboardDesc") },
      { icon: UserPlus, label: t("member.center.menuItems.partnerManagement"), href: "/admin/partners", description: t("member.center.menuItems.partnerManagementDesc") },
      { icon: ShoppingBag, label: t("member.center.menuItems.orderManagement"), href: "/admin/orders", description: t("member.center.menuItems.orderManagementDesc") },
      { icon: Package, label: t("member.center.menuItems.productManagement"), href: "/admin/products", description: t("member.center.menuItems.productManagementDesc") },
      { icon: Users, label: t("member.center.menuItems.memberManagement"), href: "/admin/members", description: t("member.center.menuItems.memberManagementDesc") },
      { icon: PiggyBank, label: t("member.center.menuItems.bonusPool"), href: "/admin/bonus-pool", description: t("member.center.menuItems.bonusPoolDesc") },
    ]
  },
  {
    id: "erp",
    title: t("member.center.sections.erp.title"),
    icon: Building2,
    items: [
      { icon: Boxes, label: t("member.center.menuItems.inventory"), href: "/admin/inventory", description: t("member.center.menuItems.inventoryDesc") },
      { icon: ClipboardList, label: t("member.center.menuItems.purchase"), href: "/admin/purchase", description: t("member.center.menuItems.purchaseDesc") },
      { icon: Truck, label: t("member.center.menuItems.logistics"), href: "/admin/logistics", description: t("member.center.menuItems.logisticsDesc") },
      { icon: Receipt, label: t("member.center.menuItems.bills"), href: "/admin/bills", description: t("member.center.menuItems.billsDesc") },
      { icon: FileText, label: t("member.center.menuItems.finance"), href: "/admin/finance", description: t("member.center.menuItems.financeDesc") },
    ]
  }
];

function MenuGrid({ items, t }: { items: MenuItem[]; t: (key: string) => string }) {
  const [, navigate] = useLocation();
  const pendingBadge = t("member.center.badges.pendingActivation");
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
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badge === pendingBadge ? "outline" : "default"} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
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

function QuickStatsCards({ partner, t }: { partner: Partner | null; t: (key: string) => string }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary">{partner?.lyBalance || 0}</div>
            <div className="text-xs text-muted-foreground">{t("member.center.quickStats.lyPoints")}</div>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">RM {((partner?.cashWalletBalance || 0) / 100).toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">{t("member.center.quickStats.cashBalance")}</div>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary">{partner?.rwaTokens || 0}</div>
            <div className="text-xs text-muted-foreground">{t("member.center.quickStats.rwaTokens")}</div>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">RM {((partner?.totalSales || 0) / 100).toFixed(0)}</div>
            <div className="text-xs text-muted-foreground">{t("member.center.quickStats.totalSales")}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function AdminQuickStats({ t }: { t: (key: string) => string }) {
  const [stats, setStats] = useState({ activePartners: 0, monthlyOrders: 0, monthlySales: 0, bonusPool: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString();

    async function fetchStats() {
      try {
        const [partnersRes, ordersRes, salesRes, poolRes] = await Promise.all([
          supabase.from("partners").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", monthStartISO),
          supabase.from("orders").select("total_amount").gte("created_at", monthStartISO),
          supabase.from("bonus_pool_cycles").select("pool_amount").order("created_at", { ascending: false }).limit(1),
        ]);

        const totalSales = (salesRes.data || []).reduce((sum, o) => sum + (o.total_amount || 0), 0);
        const poolAmount = poolRes.data?.[0]?.pool_amount || 0;

        setStats({
          activePartners: partnersRes.count || 0,
          monthlyOrders: ordersRes.count || 0,
          monthlySales: totalSales,
          bonusPool: poolAmount,
        });
      } catch (err) {
        console.error("Error fetching admin stats:", err);
      } finally {
        setLoaded(true);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-4 bg-primary/5">
        <div className="text-2xl font-bold text-primary">{loaded ? stats.activePartners : "--"}</div>
        <div className="text-xs text-muted-foreground">{t("member.center.quickStats.activePartners")}</div>
      </Card>
      <Card className="p-4 bg-primary/5">
        <div className="text-2xl font-bold text-primary">{loaded ? stats.monthlyOrders : "--"}</div>
        <div className="text-xs text-muted-foreground">{t("member.center.quickStats.monthlyOrders")}</div>
      </Card>
      <Card className="p-4 bg-primary/5">
        <div className="text-2xl font-bold text-primary">{loaded ? `RM ${(stats.monthlySales / 100).toFixed(0)}` : "--"}</div>
        <div className="text-xs text-muted-foreground">{t("member.center.quickStats.monthlySales")}</div>
      </Card>
      <Card className="p-4 bg-primary/5">
        <div className="text-2xl font-bold text-primary">{loaded ? `RM ${(stats.bonusPool / 100).toFixed(0)}` : "--"}</div>
        <div className="text-xs text-muted-foreground">{t("member.center.quickStats.bonusPoolBalance")}</div>
      </Card>
    </div>
  );
}

export default function MemberCenter() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("account");

  const { partner, role } = useAuth();

  const ALL_MENU_SECTIONS = getMenuSections(t).filter(section => {
    if (section.id === "admin-core" || section.id === "erp") return role === "admin";
    if (section.id === "partner") return role === "partner" || role === "admin";
    return true;
  });

  const currentSection = ALL_MENU_SECTIONS.find(s => s.id === activeSection) || ALL_MENU_SECTIONS[0];
  const CurrentSectionIcon = currentSection.icon;

  return (
    <MemberLayout>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <CurrentSectionIcon className="w-6 h-6 text-secondary" />
          <h1 className="text-2xl font-serif font-bold text-foreground" data-testid="text-section-title">
            {currentSection.title}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {activeSection === "account" && t("member.center.sectionDesc.account")}
          {activeSection === "member" && t("member.center.sectionDesc.member")}
          {activeSection === "partner" && t("member.center.sectionDesc.partner")}
          {activeSection === "admin-core" && t("member.center.sectionDesc.adminCore")}
          {activeSection === "erp" && t("member.center.sectionDesc.erp")}
        </p>
      </div>

      {/* Section tabs for switching content areas */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ALL_MENU_SECTIONS.map((section) => {
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

      {activeSection === "partner" && (
        <QuickStatsCards partner={partner} t={t} />
      )}

      {activeSection === "admin-core" && (
        <AdminQuickStats t={t} />
      )}

      <MenuGrid items={currentSection.items} t={t} />
    </MemberLayout>
  );
}
