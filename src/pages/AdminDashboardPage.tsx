import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  ShoppingCart,
  ClipboardCheck,
  Wallet,
  Settings,
  BarChart3,
  Boxes,
  Factory,
  Thermometer,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const { user, loading } = useAuth();

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold mb-4">{t("admin.loginRequired")}</h1>
          <p className="text-muted-foreground mb-6">{t("admin.loginRequiredDesc")}</p>
          <Button onClick={() => window.location.href = "/auth/login"} data-testid="button-login">
            {t("admin.login")}
          </Button>
        </Card>
      </div>
    );
  }

  // AdminRoute already verifies admin role, so no need to check again here

  const menuItems = [
    { id: "dashboard", label: t("admin.dashboard"), icon: LayoutDashboard },
    { id: "partners", label: t("admin.partners"), icon: Users },
    { id: "orders", label: t("admin.orders"), icon: ShoppingCart },
    { id: "inventory", label: t("admin.inventory"), icon: Boxes },
    { id: "production", label: t("admin.production"), icon: Factory },
    { id: "hygiene", label: t("admin.hygiene"), icon: ClipboardCheck },
    { id: "coldchain", label: t("admin.coldchain"), icon: Thermometer },
    { id: "finance", label: t("admin.finance"), icon: DollarSign },
    { id: "bonuspool", label: t("admin.bonusPool"), icon: Wallet },
    { id: "reports", label: t("admin.reports"), icon: BarChart3 },
    { id: "settings", label: t("admin.settings"), icon: Settings },
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
              {t("admin.backToFront")}
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
  const { t } = useTranslation();
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
          <div className="text-sm text-muted-foreground">{t("admin.activePartners")}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-amber-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">0</div>
          <div className="text-sm text-muted-foreground">{t("admin.monthlyOrders")}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">RM 0</div>
          <div className="text-sm text-muted-foreground">{t("admin.monthlySales")}</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-purple-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold mb-1">RM 0</div>
          <div className="text-sm text-muted-foreground">{t("admin.currentBonusPool")}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">{t("admin.recentOrders")}</h3>
          <div className="text-center py-8 text-muted-foreground">
            {t("admin.noOrderData")}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">{t("admin.pendingItems")}</h3>
          <div className="text-center py-8 text-muted-foreground">
            {t("admin.noPendingItems")}
          </div>
        </Card>
      </div>
    </div>
  );
}

function PartnersContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-partners">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("admin.partnerList")}</h3>
          <Button size="sm">{t("admin.addPartner")}</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {t("admin.noPartnerData")}
        </div>
      </Card>
    </div>
  );
}

function OrdersContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-orders">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("admin.orderList")}</h3>
          <Button size="sm">{t("admin.createOrder")}</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {t("admin.noOrderData")}
        </div>
      </Card>
    </div>
  );
}

function InventoryContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-inventory">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("admin.inventoryManagement")}</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">{t("admin.stockIn")}</Button>
            <Button size="sm" variant="outline">{t("admin.stockOut")}</Button>
            <Button size="sm">{t("admin.addMaterial")}</Button>
          </div>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {t("admin.noInventoryData")}
        </div>
      </Card>
    </div>
  );
}

function ProductionContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-production">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("admin.productionBatch")}</h3>
          <Button size="sm">{t("admin.createBatch")}</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {t("admin.noProductionData")}
        </div>
      </Card>
    </div>
  );
}

function HygieneContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-hygiene">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("admin.hygieneRecords")}</h3>
          <Button size="sm">{t("admin.addInspection")}</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {t("admin.noInspectionData")}
        </div>
      </Card>
    </div>
  );
}

function ColdChainContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-coldchain">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("admin.coldChainTracking")}</h3>
          <Button size="sm">{t("admin.addWaybill")}</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {t("admin.noLogisticsData")}
        </div>
      </Card>
    </div>
  );
}

function FinanceContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-finance">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h4 className="text-sm text-muted-foreground mb-2">{t("admin.monthlyIncome")}</h4>
          <div className="text-2xl font-bold text-green-600">RM 0</div>
        </Card>
        <Card className="p-6">
          <h4 className="text-sm text-muted-foreground mb-2">{t("admin.monthlyExpenses")}</h4>
          <div className="text-2xl font-bold text-red-600">RM 0</div>
        </Card>
        <Card className="p-6">
          <h4 className="text-sm text-muted-foreground mb-2">{t("admin.netProfit")}</h4>
          <div className="text-2xl font-bold">RM 0</div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{t("admin.billRecords")}</h3>
          <Button size="sm">{t("admin.addBill")}</Button>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          {t("admin.noBillData")}
        </div>
      </Card>
    </div>
  );
}

function BonusPoolContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-bonuspool">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">{t("admin.rwaBonusPoolCycle")}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">{t("admin.currentCycle")}</div>
            <div className="text-2xl font-bold">{t("admin.cycleNumber", { number: 1 })}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">{t("admin.totalPoolAmount")}</div>
            <div className="text-2xl font-bold text-amber-600">RM 0</div>
          </div>
          <div className="p-4 bg-muted rounded-lg text-center">
            <div className="text-sm text-muted-foreground mb-1">{t("admin.totalTokens")}</div>
            <div className="text-2xl font-bold">0</div>
          </div>
        </div>
        <Button>{t("admin.settleCycle")}</Button>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">{t("admin.historyCycles")}</h3>
        <div className="text-center py-8 text-muted-foreground">
          {t("admin.noHistoryData")}
        </div>
      </Card>
    </div>
  );
}

function ReportsContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-reports">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">{t("admin.salesReport")}</h3>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            {t("admin.chartArea")}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">{t("admin.partnerGrowth")}</h3>
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            {t("admin.chartArea")}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SettingsContent() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6" data-testid="section-settings">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">{t("admin.systemSettings")}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">{t("admin.cashbackRatioSettings")}</div>
              <div className="text-sm text-muted-foreground">{t("admin.cashbackRatioDesc")}</div>
            </div>
            <Button variant="outline" size="sm">{t("admin.configure")}</Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">{t("admin.bonusPoolCycleSetting")}</div>
              <div className="text-sm text-muted-foreground">{t("admin.bonusPoolCycleDesc")}</div>
            </div>
            <Button variant="outline" size="sm">{t("admin.modify")}</Button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">{t("admin.referralRewardRatio")}</div>
              <div className="text-sm text-muted-foreground">{t("admin.referralRewardDesc")}</div>
            </div>
            <Button variant="outline" size="sm">{t("admin.configure")}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
