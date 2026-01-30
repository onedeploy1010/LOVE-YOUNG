import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberLayout } from "@/components/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  ShoppingBag, Package, Truck, CheckCircle, Clock,
  ChevronRight, RefreshCw, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface OrderItem {
  product_name?: string;
  productName?: string;
  flavorName?: string;
  name?: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  customer_name: string;
  items: string;
}

function parseItems(itemsRaw: unknown): OrderItem[] {
  if (Array.isArray(itemsRaw)) return itemsRaw;
  if (typeof itemsRaw === "string") {
    try { return JSON.parse(itemsRaw); } catch { return []; }
  }
  return [];
}

function getItemName(item: OrderItem): string {
  return item.product_name || item.productName || item.flavorName || item.name || "Order Item";
}

function getItemPrice(item: OrderItem): number {
  return item.price || item.unitPrice || 0;
}

export default function MemberOrdersPage() {
  const { t } = useTranslation();
  const { user, member } = useAuth();
  const [activeTab, setActiveTab] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["member-orders", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", user.email)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        return [];
      }

      return (data || []).map((order): Order => ({
        id: order.id,
        order_number: order.order_number || `LY${order.id.slice(0, 8).toUpperCase()}`,
        created_at: order.created_at,
        status: order.status,
        total_amount: order.total_amount || 0,
        customer_name: order.customer_name,
        items: order.items || "[]",
      }));
    },
    enabled: !!user?.email,
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending":
        return { label: t("member.orders.statusPending"), icon: Clock, color: "bg-yellow-500/10 text-yellow-600", badgeVariant: "outline" as const };
      case "paid":
        return { label: t("member.orders.statusPaid"), icon: CheckCircle, color: "bg-blue-500/10 text-blue-500", badgeVariant: "default" as const };
      case "processing":
        return { label: t("member.orders.statusProcessing"), icon: Package, color: "bg-blue-500/10 text-blue-500", badgeVariant: "default" as const };
      case "shipped":
        return { label: t("member.orders.statusShipped"), icon: Truck, color: "bg-primary/10 text-primary", badgeVariant: "default" as const };
      case "delivered":
        return { label: t("member.orders.statusDelivered"), icon: CheckCircle, color: "bg-green-500/10 text-green-500", badgeVariant: "secondary" as const };
      case "cancelled":
        return { label: t("member.orders.statusCancelled"), icon: RefreshCw, color: "bg-muted text-muted-foreground", badgeVariant: "outline" as const };
      default:
        return { label: t("member.orders.statusUnknown"), icon: Clock, color: "bg-muted", badgeVariant: "outline" as const };
    }
  };

  const filteredOrders = activeTab === "all"
    ? orders
    : orders.filter(order => order.status === activeTab);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-orders-title">{t("member.orders.title")}</h1>
          <p className="text-muted-foreground">{t("member.orders.subtitle")}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" data-testid="tab-all">{t("member.orders.tabAll")}</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">{t("member.orders.tabPending")}</TabsTrigger>
            <TabsTrigger value="shipped" data-testid="tab-shipped">{t("member.orders.tabShipped")}</TabsTrigger>
            <TabsTrigger value="delivered" data-testid="tab-delivered">{t("member.orders.tabDelivered")}</TabsTrigger>
            <TabsTrigger value="cancelled" data-testid="tab-cancelled">{t("member.orders.tabCancelled")}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("member.orders.noOrders")}</p>
                  <Link href="/products">
                    <Button className="mt-4 bg-secondary text-secondary-foreground" data-testid="button-shop">
                      {t("member.orders.goShop")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  const items = parseItems(order.items);
                  const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
                  return (
                    <Card key={order.id} className="overflow-hidden" data-testid={`order-${order.id}`}>
                      <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted-foreground">#{order.order_number}</span>
                          <span className="text-sm text-muted-foreground">{formatDate(order.created_at)}</span>
                        </div>
                        <Badge variant={statusConfig.badgeVariant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {items.length > 0 ? (
                            items.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                    <Package className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium">{getItemName(item)}</p>
                                    <p className="text-sm text-muted-foreground">x{item.quantity || 1}</p>
                                  </div>
                                </div>
                                {getItemPrice(item) > 0 && (
                                  <span className="font-medium">RM {(getItemPrice(item) / 100).toFixed(2)}</span>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{t("member.orders.orderItems") || "Order Items"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-muted-foreground">
                            {t("member.orders.totalItems").replace("{count}", String(totalItems || 1))}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">
                              {t("member.orders.total")}: <span className="text-primary">RM {(order.total_amount / 100).toFixed(2)}</span>
                            </span>
                            <Button variant="outline" size="sm" className="gap-1" data-testid={`button-detail-${order.id}`}>
                              {t("member.orders.viewDetails")}
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MemberLayout>
  );
}
