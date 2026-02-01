import { Card } from "@/components/ui/card";
import {
  Users,
  ShoppingCart,
  Wallet,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { AdminLayout } from "@/components/AdminLayout";

export default function AdminDashboardPage() {
  const { t } = useTranslation();

  return (
    <AdminLayout>
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
    </AdminLayout>
  );
}
