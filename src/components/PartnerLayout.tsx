import { useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Users,
  FileText,
  Star,
  Wallet,
  PieChart,
  TrendingUp,
  Menu,
  ArrowLeft,
  Home,
  Crown,
  ChevronRight,
  LogOut,
  Shield
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";

interface PartnerLayoutProps {
  children: React.ReactNode;
}

const getMenuItems = (t: (key: string) => string) => [
  { path: "/member/partner", label: t("member.center.sections.partner.dashboard"), icon: LayoutDashboard },
  { path: "/member/partner/referrals", label: t("partner.referrals.title"), icon: Users },
  { path: "/member/partner/materials", label: t("partner.materials.title"), icon: FileText },
  { path: "/member/partner/ly-points", label: t("partner.lyPoints.title"), icon: Star },
  { path: "/member/partner/wallet", label: t("partner.wallet.title"), icon: Wallet },
  { path: "/member/partner/rwa", label: t("partner.rwa.title"), icon: PieChart },
  { path: "/member/partner/earnings", label: t("partner.earnings.title"), icon: TrendingUp },
];

export function PartnerLayout({ children }: PartnerLayoutProps) {
  const { t } = useTranslation();
  const menuItems = getMenuItems(t);
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, member, partner, role, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === "/member/partner") {
      return location === path;
    }
    return location.startsWith(path);
  };

  const currentPage = menuItems.find(item => isActive(item.path));

  const handleLogout = async () => {
    try { await signOut(); } catch (e) { console.error('Logout error:', e); }
    window.location.href = "/";
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-semibold text-primary">{t("member.center.sections.partner.title")}</h2>
            <Badge variant="outline" className="text-xs">Phase 1</Badge>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Button
              key={item.path}
              variant={active ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 ${active ? "bg-secondary/20 text-secondary font-medium" : ""}`}
              onClick={() => { navigate(item.path); setOpen(false); }}
              data-testid={`nav-${item.path.split('/').pop()}`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
              {active && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Button>
          );
        })}
      </nav>

      <div className="p-4 border-t space-y-2">
        {role === "admin" && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-primary hover:bg-primary/10"
            onClick={() => { navigate("/admin"); setOpen(false); }}
            data-testid="nav-admin-panel"
          >
            <Shield className="w-4 h-4" />
            {t("admin.adminPanel")}
            <ChevronRight className="w-4 h-4 ml-auto" />
          </Button>
        )}
        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/member")} data-testid="button-back-member">
          <ArrowLeft className="w-4 h-4" />
          {t("member.center.backToCenter")}
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={() => navigate("/")} data-testid="button-back-home">
          <Home className="w-4 h-4" />
          {t("nav.home")}
        </Button>
        <div className="mt-3">
          <LanguageSwitcher testId="button-language-switcher-sidebar" />
        </div>
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
              <Crown className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium">{t("member.center.sections.partner.title")}</span>
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
              {t("member.center.backToCenter")}
            </Button>

            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-secondary/50">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {user?.user_metadata?.first_name?.charAt(0) || member?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium" data-testid="text-user-name">
                {member?.name || user?.user_metadata?.first_name || t("member.center.sections.partner.title")}
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
