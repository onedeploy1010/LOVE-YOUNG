import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { notifyOrderStatusChange } from "@/lib/notifications";
import { restoreInventoryForOrder } from "@/lib/inventory";
import type { Order } from "@shared/types";
import {
  ShoppingCart, Search, Package, Truck, CheckCircle,
  Clock, XCircle, Eye, RefreshCw, Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch orders from Supabase
  const { data: orders = [], isLoading, refetch } = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching orders:", error);
        return [];
      }

      return (data || []).map((row: Record<string, unknown>) => ({
        id: row.id as string,
        orderNumber: row.order_number as string,
        memberId: row.member_id as string | null,
        customerName: row.customer_name as string,
        customerPhone: row.customer_phone as string,
        customerEmail: row.customer_email as string | null,
        status: row.status as string,
        totalAmount: row.total_amount as number,
        items: row.items as string,
        packageType: row.package_type as string | null,
        shippingAddress: row.shipping_address as string | null,
        shippingCity: row.shipping_city as string | null,
        shippingState: row.shipping_state as string | null,
        shippingPostcode: row.shipping_postcode as string | null,
        preferredDeliveryDate: row.preferred_delivery_date as string | null,
        trackingNumber: row.tracking_number as string | null,
        notes: row.notes as string | null,
        source: row.source as string | null,
        erpnextId: row.erpnext_id as string | null,
        metaOrderId: row.meta_order_id as string | null,
        pointsEarned: row.points_earned as number | null,
        pointsRedeemed: row.points_redeemed as number | null,
        createdAt: row.created_at as string | null,
        updatedAt: row.updated_at as string | null,
      }));
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status, order }: { orderId: string; status: string; order: Order }) => {
      const previousStatus = order.status;

      // Update order status
      const { error } = await supabase
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      // Send notification to member
      if (order.memberId) {
        await notifyOrderStatusChange(orderId, order.orderNumber, order.memberId, status);
      }

      // Restore inventory if order is cancelled
      if (status === "cancelled" && previousStatus !== "cancelled") {
        try {
          const items = JSON.parse(order.items);
          await restoreInventoryForOrder(orderId, items);
        } catch (e) {
          console.error("Error restoring inventory:", e);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setDetailsOpen(false);
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending_payment": return { label: t("admin.ordersPage.pendingPayment"), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "pending": return { label: t("admin.ordersPage.pendingPayment"), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "confirmed": return { label: t("admin.ordersPage.confirmed") || "Confirmed", icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "processing": return { label: t("admin.ordersPage.preparing"), icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "shipped": return { label: t("admin.ordersPage.shipping"), icon: Truck, color: "text-primary", bg: "bg-primary/10" };
      case "delivered": return { label: t("admin.ordersPage.completed"), icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
      case "cancelled": return { label: t("admin.ordersPage.cancelled"), icon: XCircle, color: "text-muted-foreground", bg: "bg-muted" };
      default: return { label: t("admin.ordersPage.unknown"), icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" ||
      order.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone?.includes(searchQuery);
    const matchesTab = activeTab === "all" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending" || o.status === "pending_payment").length,
    processing: orders.filter(o => o.status === "processing" || o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  const formatPrice = (amount: number) => {
    // Amount is stored in cents
    return `RM ${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseItems = (itemsJson: string) => {
    try {
      return JSON.parse(itemsJson);
    } catch {
      return [];
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleStatusChange = (orderId: string, newStatus: string, order: Order) => {
    updateStatusMutation.mutate({ orderId, status: newStatus, order });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-orders-title">{t("admin.ordersPage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.ordersPage.subtitle")}</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{t("admin.ordersPage.totalOrders")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{t("admin.ordersPage.pendingPayment")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
              <p className="text-sm text-muted-foreground">{t("admin.ordersPage.preparing")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.shipped}</p>
              <p className="text-sm text-muted-foreground">{t("admin.ordersPage.shipping")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.delivered}</p>
              <p className="text-sm text-muted-foreground">{t("admin.ordersPage.completed")}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                {t("admin.ordersPage.orderList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.ordersPage.searchPlaceholder")}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all" data-testid="tab-all">{t("admin.ordersPage.tabAll")}</TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">{t("admin.ordersPage.pendingPayment")}</TabsTrigger>
                <TabsTrigger value="processing" data-testid="tab-processing">{t("admin.ordersPage.preparing")}</TabsTrigger>
                <TabsTrigger value="shipped" data-testid="tab-shipped">{t("admin.ordersPage.shipping")}</TabsTrigger>
                <TabsTrigger value="delivered" data-testid="tab-delivered">{t("admin.ordersPage.completed")}</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.ordersPage.noOrders")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      const items = parseItems(order.items);
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`order-${order.orderNumber}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium">#{order.orderNumber}</span>
                                <Badge variant="outline">{statusConfig.label}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{order.customerName}</span>
                                <span>{items.length} {t("admin.ordersPage.items")}</span>
                                <span>{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">{formatPrice(order.totalAmount)}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleViewDetails(order)}
                              data-testid={`button-view-${order.orderNumber}`}
                            >
                              <Eye className="w-4 h-4" />
                              {t("admin.ordersPage.viewDetails")}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status Update */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Status:</span>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleStatusChange(selectedOrder.id, value, selectedOrder)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_payment">Pending Payment</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {updateStatusMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
              </div>

              {/* Customer Info */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="ml-2 font-medium">{selectedOrder.customerPhone}</span>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="ml-2 font-medium">{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Shipping Address</h4>
                <p className="text-sm">
                  {selectedOrder.shippingAddress}<br />
                  {selectedOrder.shippingPostcode} {selectedOrder.shippingCity}<br />
                  {selectedOrder.shippingState}
                </p>
                {selectedOrder.preferredDeliveryDate && (
                  <p className="text-sm mt-2 text-muted-foreground">
                    Preferred delivery: {selectedOrder.preferredDeliveryDate}
                  </p>
                )}
              </Card>

              {/* Order Items */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">Order Items</h4>
                <div className="space-y-2">
                  {parseItems(selectedOrder.items).map((item: { flavorName: string; quantity: number; category: string }, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.flavorName}</span>
                      <span className="text-muted-foreground">x {item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-4 pt-4 flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </Card>

              {/* Timestamps */}
              <div className="text-xs text-muted-foreground">
                <p>Created: {formatDate(selectedOrder.createdAt)}</p>
                <p>Updated: {formatDate(selectedOrder.updatedAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
