import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User, Crown, Shield, Star,
  Home, ShoppingBag, MapPin, Gift, Settings,
  Users, Wallet, TrendingUp, Award, BarChart3,
  Package, ClipboardList, Truck, DollarSign, FileText,
  ChevronRight, LogOut, Loader2
} from "lucide-react";
import type { User as UserType, Member, Partner, UserState } from "@shared/schema";

interface UserStateResponse {
  state: UserState;
  user: UserType | null;
  member: Member | null;
  partner: Partner | null;
}

type MenuSection = {
  title: string;
  items: {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: string;
    description?: string;
  }[];
};

function getMenuByState(state: UserState, partner: Partner | null): MenuSection[] {
  const baseMenu: MenuSection[] = [
    {
      title: "账户管理",
      items: [
        { icon: Home, label: "个人中心", href: "/member", description: "查看账户概览" },
        { icon: Settings, label: "账户设置", href: "/member/settings", description: "修改个人信息" },
      ]
    }
  ];

  if (state === "user") {
    return [
      ...baseMenu,
      {
        title: "开始体验",
        items: [
          { icon: ShoppingBag, label: "浏览产品", href: "/#products", description: "探索我们的产品系列" },
          { icon: Crown, label: "成为会员", href: "/partner", description: "了解会员权益", badge: "推荐" },
        ]
      }
    ];
  }

  if (state === "member") {
    return [
      ...baseMenu,
      {
        title: "会员服务",
        items: [
          { icon: ShoppingBag, label: "订单记录", href: "/member/orders", description: "查看历史订单" },
          { icon: MapPin, label: "地址管理", href: "/member/addresses", description: "管理收货地址" },
          { icon: Gift, label: "积分中心", href: "/member/points", description: "查看积分余额" },
        ]
      },
      {
        title: "更多服务",
        items: [
          { icon: Crown, label: "成为经营人", href: "/partner", description: "解锁更多权益", badge: "热门" },
        ]
      }
    ];
  }

  if (state === "partner") {
    const pendingBadge = partner?.status === "pending" ? "待激活" : undefined;
    return [
      ...baseMenu,
      {
        title: "会员服务",
        items: [
          { icon: ShoppingBag, label: "订单记录", href: "/member/orders", description: "查看历史订单" },
          { icon: MapPin, label: "地址管理", href: "/member/addresses", description: "管理收货地址" },
          { icon: Gift, label: "积分中心", href: "/member/points", description: "查看积分余额" },
        ]
      },
      {
        title: "经营人中心",
        items: [
          { icon: TrendingUp, label: "经营概览", href: "/member/partner", description: "查看经营数据", badge: pendingBadge },
          { icon: Users, label: "推荐网络", href: "/member/partner/referrals", description: "我的团队成员" },
          { icon: Wallet, label: "LY积分", href: "/member/partner/ly-points", description: "积分明细与使用" },
          { icon: DollarSign, label: "现金钱包", href: "/member/partner/wallet", description: "收益与提现" },
          { icon: Award, label: "RWA奖金池", href: "/member/partner/rwa", description: "查看分红周期" },
        ]
      }
    ];
  }

  if (state === "admin") {
    return [
      ...baseMenu,
      {
        title: "管理后台",
        items: [
          { icon: BarChart3, label: "数据看板", href: "/admin", description: "实时业务数据" },
          { icon: Users, label: "经营人管理", href: "/admin/partners", description: "审核与管理经营人" },
          { icon: ShoppingBag, label: "订单管理", href: "/admin/orders", description: "处理客户订单" },
          { icon: Package, label: "产品管理", href: "/admin/products", description: "管理产品目录" },
        ]
      },
      {
        title: "ERP系统",
        items: [
          { icon: ClipboardList, label: "库存管理", href: "/admin/inventory", description: "库存与采购" },
          { icon: Truck, label: "物流追踪", href: "/admin/logistics", description: "冷链物流管理" },
          { icon: FileText, label: "财务报表", href: "/admin/finance", description: "收支与账单" },
        ]
      }
    ];
  }

  return baseMenu;
}

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

function MenuCard({ section }: { section: MenuSection }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{section.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {section.items.map((item, index) => (
          <Link key={item.href} href={item.href}>
            <div
              className="flex items-center gap-4 px-6 py-4 hover-elevate cursor-pointer"
              data-testid={`menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.label}</span>
                  {item.badge && (
                    <Badge variant={item.badge === "待激活" ? "outline" : "default"} className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function QuickStats({ state, partner }: { state: UserState; partner: Partner | null }) {
  if (state === "user" || state === "member") {
    return null;
  }

  if (state === "partner" && partner) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-secondary">{partner.lyBalance || 0}</div>
          <div className="text-sm text-muted-foreground">LY积分</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-secondary">RM {((partner.cashWalletBalance || 0) / 100).toFixed(2)}</div>
          <div className="text-sm text-muted-foreground">现金余额</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-secondary">{partner.rwaTokens || 0}</div>
          <div className="text-sm text-muted-foreground">RWA令牌</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-secondary">RM {((partner.totalSales || 0) / 100).toFixed(0)}</div>
          <div className="text-sm text-muted-foreground">累计销售</div>
        </Card>
      </div>
    );
  }

  if (state === "admin") {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="p-4 bg-primary/5">
          <div className="text-2xl font-bold text-primary">--</div>
          <div className="text-sm text-muted-foreground">活跃经营人</div>
        </Card>
        <Card className="p-4 bg-primary/5">
          <div className="text-2xl font-bold text-primary">--</div>
          <div className="text-sm text-muted-foreground">本月订单</div>
        </Card>
        <Card className="p-4 bg-primary/5">
          <div className="text-2xl font-bold text-primary">--</div>
          <div className="text-sm text-muted-foreground">本月销售</div>
        </Card>
        <Card className="p-4 bg-primary/5">
          <div className="text-2xl font-bold text-primary">--</div>
          <div className="text-sm text-muted-foreground">奖金池余额</div>
        </Card>
      </div>
    );
  }

  return null;
}

export default function MemberCenter() {
  const [, navigate] = useLocation();

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
  const menuSections = getMenuByState(state, partner);
  const StateIcon = stateInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary text-primary-foreground py-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-secondary">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                {user?.firstName?.charAt(0) || member?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold" data-testid="text-user-name">
                {member?.name || user?.firstName || "用户"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={stateInfo.variant} className="gap-1" data-testid="badge-user-state">
                  <StateIcon className="w-3 h-3" />
                  {stateInfo.label}
                </Badge>
                {partner?.referralCode && (
                  <span className="text-xs opacity-70">
                    推荐码: {partner.referralCode}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 -mt-4">
        <QuickStats state={state} partner={partner} />

        {menuSections.map((section, index) => (
          <MenuCard key={index} section={section} />
        ))}

        <Separator className="my-6" />

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </Button>

        <p className="text-center text-xs text-muted-foreground mt-6" data-testid="text-version">
          LOVE YOUNG 养乐 v1.0
        </p>
      </div>
    </div>
  );
}
