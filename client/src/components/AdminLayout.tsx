import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
  Menu,
  ArrowLeft,
  ChevronRight,
  LogOut,
  Shield,
  Loader2
} from "lucide-react";
import type { User as UserType, Member, Partner, UserState } from "@shared/schema";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface UserStateResponse {
  state: UserState;
  user: UserType | null;
  member: Member | null;
  partner: Partner | null;
}

const coreItems = [
  { path: "/admin", label: "控制台", icon: LayoutDashboard },
  { path: "/admin/partners", label: "经营人管理", icon: Users },
  { path: "/admin/orders", label: "订单管理", icon: ShoppingCart },
  { path: "/admin/products", label: "产品管理", icon: Package },
  { path: "/admin/members", label: "会员管理", icon: Users },
  { path: "/admin/bonus-pool", label: "奖金池管理", icon: PiggyBank },
];

const erpItems = [
  { path: "/admin/inventory", label: "库存管理", icon: Boxes },
  { path: "/admin/purchase", label: "采购管理", icon: ClipboardCheck },
  { path: "/admin/logistics", label: "物流追踪", icon: Thermometer },
  { path: "/admin/bills", label: "账单管理", icon: FileText },
  { path: "/admin/finance", label: "财务报表", icon: DollarSign },
];

const allItems = [...coreItems, ...erpItems];

export function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: userState, isLoading } = useQuery<UserStateResponse>({
    queryKey: ["/api/auth/state"],
  });

  const isActive = (path: string) => location === path;

  const currentPage = allItems.find(item => isActive(item.path));
  const user = userState?.user;

  const handleLogout = () => {
    window.location.href = "/api/logout";
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
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <p className="text-muted-foreground mb-6">您需要管理员权限才能访问此页面</p>
          <Button onClick={() => window.location.href = "/api/login"} data-testid="button-login">
            登录
          </Button>
        </Card>
      </div>
    );
  }

  if (userState?.state !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <Shield className="w-12 h-12 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-4">权限不足</h1>
          <p className="text-muted-foreground mb-6">您没有管理员权限访问此页面</p>
          <Link href="/">
            <Button data-testid="button-go-home">返回首页</Button>
          </Link>
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
            <p className="font-medium">{user?.firstName || "管理员"}</p>
            <Badge className="bg-primary text-primary-foreground gap-1 text-xs">
              <Shield className="w-3 h-3" />
              管理员
            </Badge>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
        <div>
          <p className="text-xs text-muted-foreground mb-2 px-2">管理后台</p>
          <div className="space-y-1">
            {coreItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 ${active ? "bg-primary/20 text-primary font-medium" : ""}`}
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
          <p className="text-xs text-muted-foreground mb-2 px-2">ERP系统</p>
          <div className="space-y-1">
            {erpItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 ${active ? "bg-primary/20 text-primary font-medium" : ""}`}
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
        <Link href="/member">
          <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-back-member">
            <ArrowLeft className="w-4 h-4" />
            返回会员中心
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start gap-2" data-testid="button-back-home">
            <Home className="w-4 h-4" />
            返回首页
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
              <Shield className="w-5 h-5 text-secondary" />
              <span className="text-sm font-medium">管理后台</span>
              {currentPage && (
                <>
                  <ChevronRight className="w-4 h-4 text-primary-foreground/60" />
                  <span className="text-sm text-primary-foreground/80">{currentPage.label}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/member" className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-primary-foreground gap-2" data-testid="button-header-member">
                <ArrowLeft className="w-4 h-4" />
                会员中心
              </Button>
            </Link>

            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-secondary/50">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {user?.firstName?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium" data-testid="text-admin-name">
                {user?.firstName || "管理员"}
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
