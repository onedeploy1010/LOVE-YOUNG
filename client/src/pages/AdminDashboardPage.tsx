import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { 
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  Truck,
  ClipboardCheck,
  Wallet,
  FileText,
  Settings,
  BarChart3,
  Boxes,
  Factory,
  Thermometer,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

export default function AdminDashboardPage() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");

  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: member } = useQuery<any>({
    queryKey: ["/api/member/profile"],
    enabled: !!user,
  });

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <p className="text-muted-foreground mb-6">您需要管理员权限才能访问此页面</p>
          <Button onClick={() => window.location.href = "/api/login"} data-testid="button-login">
            登录
          </Button>
        </Card>
      </div>
    );
  }

  if (member?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">权限不足</h1>
          <p className="text-muted-foreground mb-6">您没有管理员权限</p>
          <Button onClick={() => setLocation("/")} data-testid="button-go-home">
            返回首页
          </Button>
        </Card>
      </div>
    );
  }

  const menuItems = [
    { id: "dashboard", label: "控制台", icon: LayoutDashboard },
    { id: "partners", label: "经营人管理", icon: Users },
    { id: "orders", label: "订单管理", icon: ShoppingCart },
    { id: "inventory", label: "库存管理", icon: Boxes },
    { id: "production", label: "生产管理", icon: Factory },
    { id: "hygiene", label: "卫生检查", icon: ClipboardCheck },
    { id: "coldchain", label: "冷链物流", icon: Thermometer },
    { id: "finance", label: "财务管理", icon: DollarSign },
    { id: "bonuspool", label: "奖金池管理", icon: Wallet },
    { id: "reports", label: "报表分析", icon: BarChart3 },
    { id: "settings", label: "系统设置", icon: Settings },
  ];

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-emerald-900 rounded-lg flex items-center justify-center">
                    <span className="text-amber-400 font-bold text-sm">LY</span>
                  </div>
                  <span className="font-bold text-foreground">LOVEYOUNG ERP</span>
                </div>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton 
                        onClick={() => setActiveSection(item.id)}
                        data-active={activeSection === item.id}
                        className="data-[active=true]:bg-sidebar-accent"
                        data-testid={`nav-${item.id}`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <h1 className="text-xl font-bold text-foreground">
                {menuItems.find(m => m.id === activeSection)?.label}
              </h1>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/")} data-testid="button-back-home">
              返回前台
            </Button>
          </header>

          <main className="flex-1 overflow-auto p-6 bg-background">
            {activeSection === "dashboard" && <DashboardContent />}
            {activeSection === "partners" && <PartnersContent />}
            {activeSection === "orders" && <OrdersContent />}
            {activeSection === "inventory" && <InventoryContent />}
            {activeSection === "production" && <ProductionContent />}
            {activeSection === "hygiene" && <HygieneContent />}
            {activeSection === "coldchain" && <ColdChainContent />}
            {activeSection === "finance" && <FinanceContent />}
            {activeSection === "bonuspool" && <BonusPoolContent />}
            {activeSection === "reports" && <ReportsContent />}
            {activeSection === "settings" && <SettingsContent />}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function DashboardContent() {
  return (
    <div className="space-y-6" data-testid="section-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">0</div>
          <div className="text-sm text-muted-foreground">活跃经营人</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-amber-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">0</div>
          <div className="text-sm text-muted-foreground">本月订单</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">RM 0</div>
          <div className="text-sm text-muted-foreground">本月销售额</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">RM 0</div>
          <div className="text-sm text-muted-foreground">当前奖金池</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">最近订单</h3>
          <div className="text-center py-8 text-muted-foreground">
            暂无订单数据
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">待处理事项</h3>
          <div className="text-center py-8 text-muted-foreground">
            暂无待处理事项
          </div>
        </Card>
      </div>
    </div>
  );
}

function PartnersContent() {
  return (
    <div className="space-y-6" data-testid="section-partners">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">经营人列表</h3>
          <Button size="sm">添加经营人</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          暂无经营人数据
        </div>
      </Card>
    </div>
  );
}

function OrdersContent() {
  return (
    <div className="space-y-6" data-testid="section-orders">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">订单列表</h3>
          <Button size="sm">新建订单</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          暂无订单数据
        </div>
      </Card>
    </div>
  );
}

function InventoryContent() {
  return (
    <div className="space-y-6" data-testid="section-inventory">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">库存管理</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">入库</Button>
            <Button size="sm" variant="outline">出库</Button>
            <Button size="sm">添加物料</Button>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          暂无库存数据
        </div>
      </Card>
    </div>
  );
}

function ProductionContent() {
  return (
    <div className="space-y-6" data-testid="section-production">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">生产批次</h3>
          <Button size="sm">创建批次</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          暂无生产数据
        </div>
      </Card>
    </div>
  );
}

function HygieneContent() {
  return (
    <div className="space-y-6" data-testid="section-hygiene">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">卫生检查记录</h3>
          <Button size="sm">添加检查</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          暂无检查记录
        </div>
      </Card>
    </div>
  );
}

function ColdChainContent() {
  return (
    <div className="space-y-6" data-testid="section-coldchain">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">冷链物流追踪</h3>
          <Button size="sm">添加运单</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          暂无物流数据
        </div>
      </Card>
    </div>
  );
}

function FinanceContent() {
  return (
    <div className="space-y-6" data-testid="section-finance">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h4 className="text-sm text-muted-foreground mb-2">本月收入</h4>
          <div className="text-2xl font-bold text-green-600">RM 0</div>
        </Card>
        <Card className="p-6">
          <h4 className="text-sm text-muted-foreground mb-2">本月支出</h4>
          <div className="text-2xl font-bold text-red-600">RM 0</div>
        </Card>
        <Card className="p-6">
          <h4 className="text-sm text-muted-foreground mb-2">净利润</h4>
          <div className="text-2xl font-bold">RM 0</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">账单记录</h3>
          <Button size="sm">添加账单</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          暂无账单数据
        </div>
      </Card>
    </div>
  );
}

function BonusPoolContent() {
  return (
    <div className="space-y-6" data-testid="section-bonuspool">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">RWA 奖金池周期管理</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">当前周期</div>
            <div className="text-2xl font-bold">第 1 周期</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">奖金池总额</div>
            <div className="text-2xl font-bold text-amber-600">RM 0</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">总令牌数</div>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>
        <Button>结算当前周期</Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">历史周期记录</h3>
        <div className="text-center py-8 text-muted-foreground">
          暂无历史记录
        </div>
      </Card>
    </div>
  );
}

function ReportsContent() {
  return (
    <div className="space-y-6" data-testid="section-reports">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">销售报表</h3>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            图表区域
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">经营人增长</h3>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            图表区域
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingsContent() {
  return (
    <div className="space-y-6" data-testid="section-settings">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">系统设置</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">返现比例设置</div>
              <div className="text-sm text-muted-foreground">配置不同阶段的返现比例</div>
            </div>
            <Button variant="outline" size="sm">配置</Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">奖金池分红周期</div>
              <div className="text-sm text-muted-foreground">当前设置：10天/周期</div>
            </div>
            <Button variant="outline" size="sm">修改</Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">推荐奖励比例</div>
              <div className="text-sm text-muted-foreground">10层推荐奖励配置</div>
            </div>
            <Button variant="outline" size="sm">配置</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
