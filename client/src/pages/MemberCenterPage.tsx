import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  User, Crown, Shield, Star,
  Home, ShoppingBag, MapPin, Gift, Settings,
  Users, Wallet, TrendingUp, Award, BarChart3,
  Package, ClipboardList, Truck, DollarSign, FileText,
  ChevronRight, LogOut, Loader2, Menu, X,
  CreditCard, Bell, History, HelpCircle, Share2,
  Building2, Boxes, Receipt, PiggyBank, UserPlus
} from "lucide-react";
import type { User as UserType, Member, Partner, UserState } from "@shared/schema";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface UserStateResponse {
  state: UserState;
  user: UserType | null;
  member: Member | null;
  partner: Partner | null;
}

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

const ALL_MENU_SECTIONS: MenuSection[] = [
  {
    id: "account",
    title: "账户管理",
    icon: User,
    items: [
      { icon: Home, label: "个人中心", href: "/member", description: "查看账户概览" },
      { icon: Settings, label: "账户设置", href: "/member/settings", description: "修改个人信息" },
      { icon: Bell, label: "消息通知", href: "/member/notifications", description: "系统消息与提醒" },
      { icon: HelpCircle, label: "帮助中心", href: "/member/help", description: "常见问题解答" },
    ]
  },
  {
    id: "member",
    title: "会员服务",
    icon: Star,
    items: [
      { icon: ShoppingBag, label: "订单记录", href: "/member/orders", description: "查看历史订单" },
      { icon: MapPin, label: "地址管理", href: "/member/addresses", description: "管理收货地址" },
      { icon: Gift, label: "积分中心", href: "/member/points", description: "查看积分余额与兑换" },
      { icon: CreditCard, label: "支付方式", href: "/member/payment", description: "管理支付方式" },
    ]
  },
  {
    id: "partner",
    title: "经营人中心",
    icon: Crown,
    items: [
      { icon: TrendingUp, label: "经营概览", href: "/member/partner", description: "查看经营数据与业绩" },
      { icon: Users, label: "推荐网络", href: "/member/partner/referrals", description: "我的团队与下线成员" },
      { icon: Share2, label: "推广物料", href: "/member/partner/materials", description: "获取分享素材" },
      { icon: Wallet, label: "LY积分", href: "/member/partner/ly-points", description: "积分明细与使用记录" },
      { icon: DollarSign, label: "现金钱包", href: "/member/partner/wallet", description: "收益查看与提现申请" },
      { icon: Award, label: "RWA奖金池", href: "/member/partner/rwa", description: "查看分红周期与令牌" },
      { icon: History, label: "收益记录", href: "/member/partner/earnings", description: "返现与分红历史" },
    ]
  },
  {
    id: "admin-core",
    title: "管理后台",
    icon: Shield,
    items: [
      { icon: BarChart3, label: "数据看板", href: "/admin", description: "实时业务数据分析" },
      { icon: UserPlus, label: "经营人管理", href: "/admin/partners", description: "审核激活与管理经营人" },
      { icon: ShoppingBag, label: "订单管理", href: "/admin/orders", description: "处理与跟踪客户订单" },
      { icon: Package, label: "产品管理", href: "/admin/products", description: "管理产品目录与定价" },
      { icon: Users, label: "会员管理", href: "/admin/members", description: "查看与管理所有会员" },
      { icon: PiggyBank, label: "奖金池管理", href: "/admin/bonus-pool", description: "RWA分红周期设置" },
    ]
  },
  {
    id: "erp",
    title: "ERP系统",
    icon: Building2,
    items: [
      { icon: Boxes, label: "库存管理", href: "/admin/inventory", description: "库存查询与调整" },
      { icon: ClipboardList, label: "采购管理", href: "/admin/purchase", description: "采购订单与供应商" },
      { icon: Truck, label: "物流追踪", href: "/admin/logistics", description: "冷链物流与配送" },
      { icon: Receipt, label: "账单管理", href: "/admin/bills", description: "费用与账单记录" },
      { icon: FileText, label: "财务报表", href: "/admin/finance", description: "收支分析与报表" },
    ]
  }
];

function getStateLabel(state: UserState): { label: string; variant: "default" | "secondary" | "outline"; icon: React.ElementType } {
  switch (state) {
    case "user":
      return { label: "用户", variant: "secondary", icon: User };
    case "member":
      return { label: "会员", variant: "default", icon: Star };
    case "partner":
      return { label: "联合经营人", variant: "default", icon: Crown };
    case "admin":
      return { label: "管理员", variant: "default", icon: Shield };
    default:
      return { label: "用户", variant: "secondary", icon: User };
  }
}

function SidebarNav({ 
  sections, 
  activeSection, 
  onSectionChange,
  onClose 
}: { 
  sections: MenuSection[]; 
  activeSection: string;
  onSectionChange: (id: string) => void;
  onClose?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {sections.map((section) => {
        const SectionIcon = section.icon;
        const isActive = activeSection === section.id;
        return (
          <button
            key={section.id}
            onClick={() => {
              onSectionChange(section.id);
              onClose?.();
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              isActive 
                ? "bg-secondary/20 text-secondary font-medium" 
                : "text-muted-foreground hover-elevate"
            }`}
            data-testid={`nav-section-${section.id}`}
          >
            <SectionIcon className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{section.title}</span>
          </button>
        );
      })}
    </nav>
  );
}

function MenuGrid({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const ItemIcon = item.icon;
        return (
          <Link key={item.href} href={item.href}>
            <Card 
              className="h-full hover-elevate cursor-pointer group"
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
                      <Badge variant={item.badge === "待激活" ? "outline" : "default"} className="text-xs">
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
          </Link>
        );
      })}
    </div>
  );
}

function QuickStatsCards({ partner }: { partner: Partner | null }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <div className="text-2xl font-bold text-secondary">{partner?.lyBalance || 0}</div>
            <div className="text-xs text-muted-foreground">LY积分</div>
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
            <div className="text-xs text-muted-foreground">现金余额</div>
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
            <div className="text-xs text-muted-foreground">RWA令牌</div>
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
            <div className="text-xs text-muted-foreground">累计销售</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function MemberCenter() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState("account");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: userState, isLoading, error } = useQuery<UserStateResponse>({
    queryKey: ["/api/auth/state"],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-secondary" />
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error || !userState) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>请先登录</CardTitle>
            <CardDescription>登录后即可访问会员中心</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full bg-secondary text-secondary-foreground"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              登录 / 注册
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { state, user, member, partner } = userState;
  const stateInfo = getStateLabel(state);
  const StateIcon = stateInfo.icon;
  const currentSection = ALL_MENU_SECTIONS.find(s => s.id === activeSection) || ALL_MENU_SECTIONS[0];
  const CurrentSectionIcon = currentSection.icon;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-primary-foreground">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-secondary">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {user?.firstName?.charAt(0) || member?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member?.name || user?.firstName || "用户"}</p>
                      <Badge variant={stateInfo.variant} className="gap-1 text-xs">
                        <StateIcon className="w-3 h-3" />
                        {stateInfo.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <SidebarNav 
                    sections={ALL_MENU_SECTIONS} 
                    activeSection={activeSection}
                    onSectionChange={setActiveSection}
                    onClose={() => setMobileMenuOpen(false)}
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    退出登录
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/">
              <span className="font-serif text-xl font-bold text-secondary cursor-pointer">LOVE YOUNG</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <Avatar className="w-8 h-8 border border-secondary/50">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
                  {user?.firstName?.charAt(0) || member?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium" data-testid="text-user-name">
                {member?.name || user?.firstName || "用户"}
              </span>
              <Badge variant={stateInfo.variant} className="gap-1 text-xs" data-testid="badge-user-state">
                <StateIcon className="w-3 h-3" />
                {stateInfo.label}
              </Badge>
            </div>
            <LanguageSwitcher testId="button-language-switcher-member" />
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground hidden lg:flex"
              onClick={handleLogout}
              data-testid="button-logout-desktop"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden lg:block w-64 border-r bg-card min-h-[calc(100vh-56px)] sticky top-14 overflow-y-auto">
          <div className="p-4">
            <SidebarNav 
              sections={ALL_MENU_SECTIONS} 
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>
          <div className="p-4 border-t mt-auto">
            <p className="text-xs text-muted-foreground text-center">
              LOVE YOUNG 养乐 v1.0
            </p>
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="p-4 lg:p-8 max-w-6xl">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-2">
                <CurrentSectionIcon className="w-6 h-6 text-secondary" />
                <h1 className="text-2xl font-serif font-bold text-foreground" data-testid="text-section-title">
                  {currentSection.title}
                </h1>
              </div>
              <p className="text-muted-foreground text-sm">
                {activeSection === "account" && "管理您的账户信息和偏好设置"}
                {activeSection === "member" && "查看订单、管理地址和积分"}
                {activeSection === "partner" && "经营数据、团队管理和收益提现"}
                {activeSection === "admin-core" && "平台核心管理功能"}
                {activeSection === "erp" && "供应链与财务管理"}
              </p>
            </div>

            {activeSection === "partner" && (
              <QuickStatsCards partner={partner} />
            )}

            {activeSection === "admin-core" && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-4 bg-primary/5">
                  <div className="text-2xl font-bold text-primary">--</div>
                  <div className="text-xs text-muted-foreground">活跃经营人</div>
                </Card>
                <Card className="p-4 bg-primary/5">
                  <div className="text-2xl font-bold text-primary">--</div>
                  <div className="text-xs text-muted-foreground">本月订单</div>
                </Card>
                <Card className="p-4 bg-primary/5">
                  <div className="text-2xl font-bold text-primary">--</div>
                  <div className="text-xs text-muted-foreground">本月销售额</div>
                </Card>
                <Card className="p-4 bg-primary/5">
                  <div className="text-2xl font-bold text-primary">--</div>
                  <div className="text-xs text-muted-foreground">奖金池余额</div>
                </Card>
              </div>
            )}

            <MenuGrid items={currentSection.items} />

            <div className="mt-8 lg:hidden">
              <Separator className="mb-4" />
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
