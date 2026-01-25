import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight
} from "lucide-react";

interface PartnerLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  { path: "/member/partner", label: "经营概览", icon: LayoutDashboard },
  { path: "/member/partner/referrals", label: "推荐网络", icon: Users },
  { path: "/member/partner/materials", label: "推广物料", icon: FileText },
  { path: "/member/partner/ly-points", label: "LY积分", icon: Star },
  { path: "/member/partner/wallet", label: "现金钱包", icon: Wallet },
  { path: "/member/partner/rwa", label: "RWA奖金池", icon: PieChart },
  { path: "/member/partner/earnings", label: "收益记录", icon: TrendingUp },
];

export function PartnerLayout({ children }: PartnerLayoutProps) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/member/partner") {
      return location === path;
    }
    return location.startsWith(path);
  };

  const currentPage = menuItems.find(item => isActive(item.path));

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <Crown className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h2 className="font-semibold text-primary">经营人中心</h2>
            <Badge variant="outline" className="text-xs">Phase 1</Badge>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
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
      <div className="lg:hidden sticky top-0 z-50 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" data-testid="button-mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <NavContent />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            {currentPage && (
              <>
                <currentPage.icon className="w-5 h-5 text-primary" />
                <span className="font-medium">{currentPage.label}</span>
              </>
            )}
          </div>

          <Link href="/member">
            <Button variant="ghost" size="icon" data-testid="button-mobile-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:block w-64 border-r bg-card min-h-screen sticky top-0">
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
