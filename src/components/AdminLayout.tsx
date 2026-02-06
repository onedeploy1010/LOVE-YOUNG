import { useLocation } from "wouter";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";
import {
  Home,
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Boxes,
  Factory,
  ClipboardCheck,
  Thermometer,
  DollarSign,
  FileText,
  PiggyBank,
  Wallet,
  Gift,
  Settings,
  Menu,
  ArrowLeft,
  ChevronRight,
  LogOut,
  Shield,
  Loader2,
  Megaphone,
  BookOpen,
  Calendar,
  Target,
  BarChart3,
  MessageSquare,
  ShoppingBag,
  UserPlus,
  Bot,
  Send
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const getCoreItems = (t: (key: string) => string) => [
  { path: "/admin", label: t("admin.menu.dashboard"), icon: LayoutDashboard },
  { path: "/admin/partners", label: t("admin.menu.partners"), icon: Users },
  { path: "/admin/orders", label: t("admin.menu.orders"), icon: ShoppingCart },
  { path: "/admin/products", label: t("admin.menu.products"), icon: Package },
  { path: "/admin/bundles", label: t("admin.menu.bundles"), icon: Gift },
  { path: "/admin/members", label: t("admin.menu.members"), icon: Users },
  { path: "/admin/bonus-pool", label: t("admin.menu.bonusPool"), icon: PiggyBank },
  { path: "/admin/withdrawals", label: t("admin.menu.withdrawals"), icon: Wallet },
  { path: "/admin/site-settings", label: t("admin.menu.siteSettings"), icon: Settings },
];

const getErpItems = (t: (key: string) => string) => [
  { path: "/admin/inventory", label: t("admin.menu.inventory"), icon: Boxes },
  { path: "/admin/production", label: t("admin.menu.production"), icon: Factory },
  { path: "/admin/purchase", label: t("admin.menu.purchase"), icon: ClipboardCheck },
  { path: "/admin/logistics", label: t("admin.menu.logistics"), icon: Thermometer },
  { path: "/admin/bills", label: t("admin.menu.bills"), icon: FileText },
  { path: "/admin/finance", label: t("admin.menu.finance"), icon: DollarSign },
];

const getMarketingItems = (t: (key: string) => string) => [
  { path: "/admin/marketing/meta-ads", label: t("admin.menu.metaAds"), icon: Megaphone },
  { path: "/admin/marketing/xiaohongshu", label: t("admin.menu.xiaohongshu"), icon: BookOpen },
  { path: "/admin/marketing/media-plan", label: t("admin.menu.mediaPlan"), icon: Calendar },
  { path: "/admin/marketing/ad-placement", label: t("admin.menu.adPlacement"), icon: Target },
  { path: "/admin/marketing/reports", label: t("admin.menu.performanceReports"), icon: BarChart3 },
];

const getWhatsappItems = (t: (key: string) => string) => [
  { path: "/admin/whatsapp/config", label: t("admin.menu.whatsappConfig"), icon: MessageSquare },
  { path: "/admin/whatsapp/orders", label: t("admin.menu.whatsappOrders"), icon: ShoppingBag },
  { path: "/admin/whatsapp/members", label: t("admin.menu.whatsappMembers"), icon: UserPlus },
  { path: "/admin/whatsapp/ai-service", label: t("admin.menu.aiCustomerService"), icon: Bot },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const { user, loading: isLoading, signOut } = useAuth();

  const coreItems = useMemo(() => getCoreItems(t), [t]);
  const erpItems = useMemo(() => getErpItems(t), [t]);
  const marketingItems = useMemo(() => getMarketingItems(t), [t]);
  const whatsappItems = useMemo(() => getWhatsappItems(t), [t]);
  const allItems = useMemo(() => [...coreItems, ...erpItems, ...marketingItems, ...whatsappItems], [coreItems, erpItems, marketingItems, whatsappItems]);

  const isActive = (path: string) => location === path;

  const currentPage = allItems.find(item => isActive(item.path));

  const handleLogout = async () => {
    try { await signOut(); } catch (e) { console.error('Logout error:', e); }
    window.location.href = "/";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Shield className="w-12 h-12 mx-auto text-primary mb-4" />
          <h1 className="text-2xl font-bold mb-4">{t("admin.pleaseLogin")}</h1>
          <p className="text-muted-foreground mb-6">{t("admin.adminRequired")}</p>
          <Button onClick={() => window.location.href = "/auth/login"} data-testid="button-login">
            {t("admin.login")}
          </Button>
        </Card>
      </div>
    );
  }

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium">{user?.user_metadata?.first_name || t("admin.adminRole")}</p>
            <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
              <Shield className="w-3 h-3" />
              {t("admin.adminRole")}
            </Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs text-muted-foreground mb-2 px-2">{t("admin.adminPanel")}</p>
          <div className="space-y-1">
            {coreItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant={active ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${active ? "bg-primary/20 text-primary font-medium" : ""}`}
                  onClick={() => { navigate(item.path); setOpen(false); }}
                  data-testid={`nav-${item.path.split('/').pop()}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 px-2">{t("admin.erpSystem")}</p>
          <div className="space-y-1">
            {erpItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Button
                  key={item.path}
                  variant={active ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 ${active ? "bg-primary/20 text-primary font-medium" : ""}`}
                  onClick={() => { navigate(item.path); setOpen(false); }}
                  data-testid={`nav-${item.path.split('/').pop()}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        <div className="mb-3">
          <LanguageSwitcher testId="button-language-switcher-sidebar" />
        </div>
        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/member")} data-testid="button-back-member">
          <ArrowLeft className="w-4 h-4" />
          {t("admin.backToMember")}
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/")} data-testid="button-back-home">
          <Home className="w-4 h-4" />
          {t("admin.backToHome")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground" data-testid="button-mobile-menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <NavContent />
              </SheetContent>
            </Sheet>

            <span className="font-serif text-xl font-bold text-secondary cursor-pointer" onClick={() => navigate("/")} data-testid="link-logo">LOVE YOUNG</span>

            <div className="hidden lg:flex items-center gap-2 ml-4">
              <Shield className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium">{t("admin.adminPanel")}</span>
              {currentPage && (
                <>
                  <ChevronRight className="w-4 h-4 text-primary-foreground/60" />
                  <span className="text-sm text-primary-foreground/80">{currentPage.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher testId="button-language-switcher-header" />
            <Button variant="ghost" size="sm" className="hidden sm:flex text-primary-foreground gap-2" onClick={() => navigate("/member")} data-testid="button-header-member">
              <ArrowLeft className="w-4 h-4" />
              {t("admin.memberCenter")}
            </Button>

            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-secondary/50">
                <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {user?.user_metadata?.first_name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium" data-testid="text-admin-name">
                {user?.user_metadata?.first_name || t("admin.adminRole")}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hidden lg:flex"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="lg:hidden flex items-center justify-center gap-2 py-2 bg-primary/90 border-t border-primary-foreground/10">
          {currentPage && (
            <>
              <currentPage.icon className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">{currentPage.label}</span>
            </>
          )}
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-64 border-r bg-card min-h-[calc(100vh-56px)] sticky top-14">
          <NavContent />
        </aside>

        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
