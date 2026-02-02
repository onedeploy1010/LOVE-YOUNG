import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  ClipboardCheck, Search, Plus, Building2, Eye,
  Clock, CheckCircle, Truck, Package, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string | null;
  supplier_name: string;
  total_amount: number;
  status: string;
  items: unknown;
  expected_date: string | null;
  received_date: string | null;
  notes: string | null;
  created_at: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  total_orders: number | null;
  category: string | null;
  created_at: string;
}

export default function AdminPurchasePage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("orders");

  // Fetch purchase orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["admin-purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching purchase orders:", error);
        return [];
      }

      return (data || []) as PurchaseOrder[];
    },
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching suppliers:", error);
        return [];
      }

      return (data || []) as Supplier[];
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { label: t("admin.purchasePage.statusPending"), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "approved": return { label: t("admin.purchasePage.statusApproved"), icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "shipped": return { label: t("admin.purchasePage.statusShipped"), icon: Truck, color: "text-primary", bg: "bg-primary/10" };
      case "received": return { label: t("admin.purchasePage.statusReceived"), icon: Package, color: "text-green-500", bg: "bg-green-500/10" };
      default: return { label: t("admin.purchasePage.statusUnknown"), icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const filteredOrders = orders.filter(order =>
    searchQuery === "" ||
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const isLoading = loadingOrders || loadingSuppliers;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-purchase-title">{t("admin.purchasePage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.purchasePage.subtitle")}</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-new-po">
            <Plus className="w-4 h-4" />
            {t("admin.purchasePage.newPo")}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" data-testid="tab-orders">{t("admin.purchasePage.purchaseOrders")}</TabsTrigger>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">{t("admin.purchasePage.suppliers")}</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                    {t("admin.purchasePage.purchaseOrders")} ({orders.length})
                  </CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.purchasePage.searchPlaceholder")}
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无采购订单</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`po-${order.order_number}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{order.order_number}</span>
                                <Badge variant="outline">{statusConfig.label}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{order.supplier_name}</span>
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">RM {(order.total_amount / 100).toLocaleString()}</span>
                            <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-${order.order_number}`}>
                              <Eye className="w-4 h-4" />
                              {t("admin.purchasePage.viewDetails")}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    {t("admin.purchasePage.supplierList")}
                  </CardTitle>
                  <Button variant="outline" className="gap-2" data-testid="button-add-supplier">
                    <Plus className="w-4 h-4" />
                    {t("admin.purchasePage.addSupplier")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {suppliers.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无供应商</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`supplier-${supplier.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {supplier.contact_person || "-"} · {supplier.phone || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{supplier.total_orders ?? 0} {t("admin.purchasePage.orders")}</Badge>
                          <Button variant="outline" size="sm" data-testid={`button-edit-${supplier.id}`}>
                            {t("admin.purchasePage.edit")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
