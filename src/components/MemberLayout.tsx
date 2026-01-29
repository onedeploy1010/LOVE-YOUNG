import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Home,
  Settings,
  Bell,
  HelpCircle,
  ShoppingBag,
  MapPin,
  Gift,
  CreditCard,
  Menu,
  ArrowLeft,
  ChevronRight,
  LogOut,
  User,
  Star
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";

interface MemberLayoutProps {
  children: React.ReactNode;
}

const getAccountItems = (t: (key: string) => string) => [
  { path: "/member/settings", label: t("member.settings.title"), icon: Settings },
  { path: "/member/notifications", label: t("member.notifications.title"), icon: Bell },
  { path: "/member/help", label: t("member.help.title"), icon: HelpCircle },
];

const getMemberItems = (t: (key: string) => string) => [
  { path: "/member/orders", label: t("member.orders.title"), icon: ShoppingBag },
  { path: "/member/addresses", label: t("member.addresses.title"), icon: MapPin },
  { path: "/member/points", label: t("member.points.title"), icon: Gift },
  { path: "/member/payment", label: t("member.payment.title"), icon: CreditCard },
];

export function MemberLayout({ children }: MemberLayoutProps) {
  const { t } = useTranslation();
  const accountItems = getAccountItems(t);
  const memberItems = getMemberItems(t);
  const allItems = [...accountItems, ...memberItems];
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, member, signOut } = useAuth();

  const isActive = (path: string) => location === path;

  const currentPage = allItems.find(item => isActive(item.path));

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-secondary">
            <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {user?.user_metadata?.first_name?.charAt(0) || member?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{member?.name || user?.user_metadata?.first_name || t("member.center.defaultUser")}</p>
            <Badge variant="default" className="gap-1 text-xs">
              <Star className="w-3 h-3" />
              {t("member.center.memberBadge")}
            </Badge>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs text-muted-foreground mb-2 px-2">{t("member.center.sections.account.title")}</p>
          <div className="space-y-1">
            {accountItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 ${active ? "bg-secondary/20 text-secondary font-medium" : ""}`}
                    onClick={() => setOpen(false)}
                    data-testid={`nav-${item.path.split('/').pop()}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2 px-2">{t("member.center.sections.member.title")}</p>
          <div className="space-y-1">
            {memberItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 ${active ? "bg-secondary/20 text-secondary font-medium" : ""}`}
                    onClick={() => setOpen(false)}
                    data-testid={`nav-${item.path.split('/').pop()}`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        <div className="mb-3">
          <LanguageSwitcher testId="button-language-switcher-sidebar" />
        </div>
        <Link href="/member">
          <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-back-center">
            <ArrowLeft className="w-4 h-4" />
            {t("member.center.backToCenter")}
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-back-home">
            <Home className="w-4 h-4" />
            {t("nav.home")}
          </Button>
        </Link>
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

            <Link href="/">
              <span className="font-serif text-xl font-bold text-secondary cursor-pointer" data-testid="link-logo">LOVE YOUNG</span>
            </Link>

            <div className="hidden lg:flex items-center gap-2 ml-4">
              <User className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium">{t("nav.memberCenter")}</span>
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
            <Link href="/member" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-primary-foreground gap-2" data-testid="button-header-center">
                <ArrowLeft className="w-4 h-4" />
                {t("member.center.backToCenter")}
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-secondary/50">
                <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {user?.user_metadata?.first_name?.charAt(0) || member?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium" data-testid="text-user-name">
                {member?.name || user?.user_metadata?.first_name || t("member.center.defaultUser")}
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
          <div className="max-w-4xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
