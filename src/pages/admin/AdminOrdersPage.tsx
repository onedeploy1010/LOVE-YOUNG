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
  Clock, XCircle, Eye, RefreshCw, Loader2, Trash2, MessageSquare, Globe, Shield
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

export default function AdminOrdersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

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
        userId: row.user_id as string | null,
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
        sourceChannel: row.source_channel as string | null,
        whatsappConversationId: row.whatsapp_conversation_id as string | null,
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

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (order: Order) => {
      // Restore inventory before deleting
      if (order.status !== "cancelled") {
        try {
          const items = JSON.parse(order.items);
          await restoreInventoryForOrder(order.id, items);
        } catch (e) {
          console.error("Error restoring inventory:", e);
        }
      }

      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      setDetailsOpen(false);
      setDeleteConfirmOpen(false);
      setOrderToDelete(null);
      toast({ title: "订单已删除" });
    },
    onError: (error) => {
      toast({ title: "删除失败", description: String(error), variant: "destructive" });
    },
  });

  const handleDeleteClick = (order: Order) => {
    setOrderToDelete(order);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (orderToDelete) {
      deleteOrderMutation.mutate(orderToDelete);
    }
  };

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
    const matchesTab = activeTab === "all" ||
      (activeTab === "pending" && (order.status === "pending" || order.status === "pending_payment")) ||
      (activeTab === "processing" && (order.status === "processing" || order.status === "confirmed")) ||
      (activeTab !== "pending" && activeTab !== "processing" && order.status === activeTab);
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending" || o.status === "pending_payment").length,
    processing: orders.filter(o => o.status === "processing" || o.status === "confirmed").length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    cancelled: orders.filter(o => o.status === "cancelled").length,
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
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-orders-title">{t("admin.ordersPage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.ordersPage.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading} className="flex-shrink-0">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t("admin.ordersPage.totalOrders")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t("admin.ordersPage.pendingPayment")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-blue-500">{stats.processing}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t("admin.ordersPage.preparing")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-primary">{stats.shipped}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t("admin.ordersPage.shipping")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-green-500">{stats.delivered}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t("admin.ordersPage.completed")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-2 sm:p-4 text-center">
              <p className="text-lg sm:text-2xl font-bold text-muted-foreground">{stats.cancelled}</p>
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{t("admin.ordersPage.cancelled")}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.ordersPage.orderList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.ordersPage.searchPlaceholder")}
                  className="pl-9 h-9 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto -mx-1 px-1 pb-1">
                <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-6 h-auto p-1">
                  <TabsTrigger value="all" className="flex-1 md:flex-none text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3" data-testid="tab-all">{t("admin.ordersPage.tabAll")}</TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1 md:flex-none text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 whitespace-nowrap" data-testid="tab-pending">
                    <span className="hidden sm:inline">{t("admin.ordersPage.pendingPayment")}</span>
                    <span className="sm:hidden">待付</span>
                  </TabsTrigger>
                  <TabsTrigger value="processing" className="flex-1 md:flex-none text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 whitespace-nowrap" data-testid="tab-processing">
                    <span className="hidden sm:inline">{t("admin.ordersPage.preparing")}</span>
                    <span className="sm:hidden">处理</span>
                  </TabsTrigger>
                  <TabsTrigger value="shipped" className="flex-1 md:flex-none text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 whitespace-nowrap" data-testid="tab-shipped">
                    <span className="hidden sm:inline">{t("admin.ordersPage.shipping")}</span>
                    <span className="sm:hidden">发货</span>
                  </TabsTrigger>
                  <TabsTrigger value="delivered" className="flex-1 md:flex-none text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 whitespace-nowrap" data-testid="tab-delivered">
                    <span className="hidden sm:inline">{t("admin.ordersPage.completed")}</span>
                    <span className="sm:hidden">完成</span>
                  </TabsTrigger>
                  <TabsTrigger value="cancelled" className="flex-1 md:flex-none text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 whitespace-nowrap" data-testid="tab-cancelled">
                    <span className="hidden sm:inline">{t("admin.ordersPage.cancelled")}</span>
                    <span className="sm:hidden">取消</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-3 sm:mt-4">
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
                  <div className="space-y-2 sm:space-y-3">
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      const items = parseItems(order.items);
                      return (
                        <div
                          key={order.id}
                          className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`order-${order.orderNumber}`}
                        >
                          {/* Mobile: 2-row layout, Desktop: single row */}
                          <div className="flex items-start sm:items-center gap-2.5 sm:gap-4">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full shrink-0 flex items-center justify-center ${statusConfig.bg}`}>
                              <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfig.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                <span className="font-mono text-xs sm:text-sm font-medium">#{order.orderNumber}</span>
                                <Badge variant="outline" className="text-[10px] sm:text-xs h-5 sm:h-6">{statusConfig.label}</Badge>
                                {order.sourceChannel === "whatsapp" && (
                                  <Badge className="text-[10px] sm:text-xs h-5 sm:h-6 bg-green-500/10 text-green-600 border-green-500/20 gap-0.5">
                                    <MessageSquare className="w-3 h-3" />
                                    WA
                                  </Badge>
                                )}
                                {order.sourceChannel === "admin" && (
                                  <Badge className="text-[10px] sm:text-xs h-5 sm:h-6 bg-purple-500/10 text-purple-600 border-purple-500/20 gap-0.5">
                                    <Shield className="w-3 h-3" />
                                    Admin
                                  </Badge>
                                )}
                                {(!order.sourceChannel || order.sourceChannel === "website") && (
                                  <Badge className="text-[10px] sm:text-xs h-5 sm:h-6 bg-blue-500/10 text-blue-600 border-blue-500/20 gap-0.5">
                                    <Globe className="w-3 h-3" />
                                    Web
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 text-xs sm:text-sm text-muted-foreground mt-0.5">
                                <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">{order.customerName}</span>
                                <span>{items.length} {t("admin.ordersPage.items")}</span>
                                <span className="hidden md:inline">{formatDate(order.createdAt)}</span>
                              </div>
                            </div>
                            {/* Desktop: price and button inline */}
                            <div className="hidden sm:flex items-center gap-3 sm:gap-4 shrink-0">
                              <span className="font-bold text-primary text-sm sm:text-base">{formatPrice(order.totalAmount)}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8"
                                onClick={() => handleViewDetails(order)}
                                data-testid={`button-view-${order.orderNumber}`}
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden md:inline">{t("admin.ordersPage.viewDetails")}</span>
                              </Button>
                            </div>
                          </div>
                          {/* Mobile: second row with price and button */}
                          <div className="flex sm:hidden items-center justify-between mt-2 pl-[46px]">
                            <span className="font-bold text-primary text-sm">{formatPrice(order.totalAmount)}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-7 text-xs"
                              onClick={() => handleViewDetails(order)}
                              data-testid={`button-view-mobile-${order.orderNumber}`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              详情
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
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">订单详情 - #{selectedOrder?.orderNumber}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 sm:space-y-6">
              {/* Status Update */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="text-sm text-muted-foreground">状态:</span>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedOrder.status}
                    onValueChange={(value) => handleStatusChange(selectedOrder.id, value, selectedOrder)}
                  >
                    <SelectTrigger className="w-full sm:w-48 h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_payment">待付款</SelectItem>
                      <SelectItem value="pending">待处理</SelectItem>
                      <SelectItem value="confirmed">已确认</SelectItem>
                      <SelectItem value="processing">处理中</SelectItem>
                      <SelectItem value="shipped">已发货</SelectItem>
                      <SelectItem value="delivered">已完成</SelectItem>
                      <SelectItem value="cancelled">已取消</SelectItem>
                    </SelectContent>
                  </Select>
                  {updateStatusMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <Card className="p-3 sm:p-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">客户信息</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">姓名:</span>
                    <span className="ml-2 font-medium">{selectedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">电话:</span>
                    <span className="ml-2 font-medium">{selectedOrder.customerPhone}</span>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="col-span-1 sm:col-span-2">
                      <span className="text-muted-foreground">邮箱:</span>
                      <span className="ml-2 font-medium break-all">{selectedOrder.customerEmail}</span>
                    </div>
                  )}
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className="p-3 sm:p-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">收货地址</h4>
                <p className="text-xs sm:text-sm">
                  {selectedOrder.shippingAddress}<br />
                  {selectedOrder.shippingPostcode} {selectedOrder.shippingCity}<br />
                  {selectedOrder.shippingState}
                </p>
                {selectedOrder.preferredDeliveryDate && (
                  <p className="text-xs sm:text-sm mt-2 text-muted-foreground">
                    期望送达: {selectedOrder.preferredDeliveryDate}
                  </p>
                )}
              </Card>

              {/* Order Items */}
              <Card className="p-3 sm:p-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">订单商品</h4>
                <div className="space-y-2">
                  {parseItems(selectedOrder.items).map((item: { flavorName: string; quantity: number; category: string }, index: number) => (
                    <div key={index} className="flex justify-between text-xs sm:text-sm gap-2">
                      <span className="truncate">{item.flavorName}</span>
                      <span className="text-muted-foreground shrink-0">x {item.quantity}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 sm:mt-4 pt-3 sm:pt-4 flex justify-between font-semibold text-sm sm:text-base">
                  <span>总计</span>
                  <span className="text-primary">{formatPrice(selectedOrder.totalAmount)}</span>
                </div>
              </Card>

              {/* Timestamps */}
              <div className="text-[10px] sm:text-xs text-muted-foreground">
                <p>创建时间: {formatDate(selectedOrder.createdAt)}</p>
                <p>更新时间: {formatDate(selectedOrder.updatedAt)}</p>
              </div>

              {/* Delete Button */}
              <div className="flex justify-end pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1"
                  onClick={() => handleDeleteClick(selectedOrder)}
                  disabled={deleteOrderMutation.isPending}
                >
                  {deleteOrderMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  删除订单
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="w-[95vw] max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除订单</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除订单 <span className="font-mono font-bold">#{orderToDelete?.orderNumber}</span> 吗？此操作不可撤销，库存将会被恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
