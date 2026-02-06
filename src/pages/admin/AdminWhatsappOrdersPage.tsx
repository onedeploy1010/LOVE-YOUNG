import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingBag,
  Search,
  Plus,
  Edit,
  Eye,
  Trash2,
  Phone,
  MessageCircle,
  Bell,
  Send,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface WhatsappOrder {
  id: string;
  conversation_id: string | null;
  order_id: string | null;
  customer_phone: string;
  customer_name: string;
  order_data: unknown;
  status: string;
  payment_status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminWhatsappOrdersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Create/Edit dialog
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<WhatsappOrder | null>(null);
  const [formPhone, setFormPhone] = useState("");
  const [formName, setFormName] = useState("");
  const [formOrderData, setFormOrderData] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formStatus, setFormStatus] = useState("pending");
  const [formPaymentStatus, setFormPaymentStatus] = useState("unpaid");
  const [formNotes, setFormNotes] = useState("");

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<WhatsappOrder | null>(null);

  // Notify admin dialog
  const [showNotifyDialog, setShowNotifyDialog] = useState(false);
  const [notifyOrder, setNotifyOrder] = useState<WhatsappOrder | null>(null);
  const [notifyMessage, setNotifyMessage] = useState("");

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-whatsapp-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching whatsapp orders:", error);
        return [];
      }

      return (data || []) as WhatsappOrder[];
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      customer_phone: string;
      customer_name: string;
      order_data: unknown;
      total_amount: number;
      status: string;
      payment_status: string;
      notes: string | null;
    }) => {
      const { error } = await supabase.from("whatsapp_orders").insert(orderData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-orders"] });
      setShowOrderDialog(false);
      resetForm();
      toast({ title: t("admin.whatsappOrdersPage.orderCreated") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappOrdersPage.createFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (
      updateData: Partial<WhatsappOrder> & { id: string }
    ) => {
      const { id, ...data } = updateData;
      const { error } = await supabase
        .from("whatsapp_orders")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-orders"] });
      setShowOrderDialog(false);
      resetForm();
      toast({ title: t("admin.whatsappOrdersPage.orderUpdated") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappOrdersPage.updateFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whatsapp_orders")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-orders"] });
      toast({ title: t("admin.whatsappOrdersPage.orderDeleted") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappOrdersPage.deleteFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setEditingOrder(null);
    setFormPhone("");
    setFormName("");
    setFormOrderData("");
    setFormAmount("");
    setFormStatus("pending");
    setFormPaymentStatus("unpaid");
    setFormNotes("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowOrderDialog(true);
  };

  const handleOpenEdit = (order: WhatsappOrder) => {
    setEditingOrder(order);
    setFormPhone(order.customer_phone);
    setFormName(order.customer_name);
    setFormOrderData(
      order.order_data ? JSON.stringify(order.order_data, null, 2) : ""
    );
    setFormAmount((order.total_amount / 100).toString());
    setFormStatus(order.status);
    setFormPaymentStatus(order.payment_status);
    setFormNotes(order.notes || "");
    setShowOrderDialog(true);
  };

  const handleViewDetails = (order: WhatsappOrder) => {
    setSelectedOrder(order);
    setShowDetailDialog(true);
  };

  const handleOpenNotify = (order: WhatsappOrder) => {
    setNotifyOrder(order);
    setNotifyMessage("");
    setShowNotifyDialog(true);
  };

  const handleSendNotification = () => {
    if (!notifyOrder || !notifyMessage.trim()) return;
    // In a real implementation, this would send a notification via an API
    toast({
      title: t("admin.whatsappOrdersPage.notificationSent"),
      description: `${notifyOrder.customer_name} - ${notifyMessage}`,
    });
    setShowNotifyDialog(false);
    setNotifyMessage("");
  };

  const handleSubmitOrder = () => {
    let parsedOrderData: unknown = null;
    if (formOrderData.trim()) {
      try {
        parsedOrderData = JSON.parse(formOrderData);
      } catch {
        toast({
          title: t("admin.whatsappOrdersPage.invalidJson"),
          variant: "destructive",
        });
        return;
      }
    }

    const amount = Math.round(parseFloat(formAmount || "0") * 100);

    if (!formPhone.trim() || !formName.trim()) {
      toast({
        title: t("admin.whatsappOrdersPage.requiredFields"),
        variant: "destructive",
      });
      return;
    }

    if (editingOrder) {
      updateOrderMutation.mutate({
        id: editingOrder.id,
        customer_phone: formPhone,
        customer_name: formName,
        order_data: parsedOrderData,
        total_amount: amount,
        status: formStatus,
        payment_status: formPaymentStatus,
        notes: formNotes || null,
      });
    } else {
      createOrderMutation.mutate({
        customer_phone: formPhone,
        customer_name: formName,
        order_data: parsedOrderData,
        total_amount: amount,
        status: formStatus,
        payment_status: formPaymentStatus,
        notes: formNotes || null,
      });
    }
  };

  const handleDelete = (order: WhatsappOrder) => {
    if (confirm(t("admin.whatsappOrdersPage.confirmDelete"))) {
      deleteOrderMutation.mutate(order.id);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchQuery === "" ||
      order.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    paid: orders.filter((o) => o.payment_status === "paid").length,
    revenue: orders
      .filter((o) => o.payment_status === "paid")
      .reduce((sum, o) => sum + o.total_amount, 0),
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            {t("admin.whatsappOrdersPage.paymentPaid")}
          </Badge>
        );
      case "refunded":
        return (
          <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            {t("admin.whatsappOrdersPage.paymentRefunded")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            {t("admin.whatsappOrdersPage.paymentUnpaid")}
          </Badge>
        );
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge variant="outline" className="text-blue-500 border-blue-500/30">
            {t("admin.whatsappOrdersPage.statusConfirmed")}
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
            {t("admin.whatsappOrdersPage.statusProcessing")}
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="outline" className="text-primary border-primary/30">
            {t("admin.whatsappOrdersPage.statusShipped")}
          </Badge>
        );
      case "delivered":
        return (
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            {t("admin.whatsappOrdersPage.statusDelivered")}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
            {t("admin.whatsappOrdersPage.statusPending")}
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getOrderItemsSummary = (orderData: unknown): string => {
    if (!orderData) return "-";
    try {
      if (Array.isArray(orderData)) {
        return orderData
          .map(
            (item: { name?: string; quantity?: number }) =>
              `${item.name || "Item"} x${item.quantity || 1}`
          )
          .join(", ");
      }
      if (typeof orderData === "object") {
        return JSON.stringify(orderData).slice(0, 80) + "...";
      }
      return String(orderData).slice(0, 80);
    } catch {
      return "-";
    }
  };

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
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1
              className="text-xl sm:text-2xl font-serif text-primary"
              data-testid="text-whatsapp-orders-title"
            >
              {t("admin.whatsappOrdersPage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.whatsappOrdersPage.subtitle")}
            </p>
          </div>
          <Button
            className="gap-2 bg-secondary text-secondary-foreground w-full sm:w-auto"
            onClick={handleOpenCreate}
            data-testid="button-new-order"
          >
            <Plus className="w-4 h-4" />
            {t("admin.whatsappOrdersPage.newOrder")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappOrdersPage.totalOrders")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-yellow-500">
                  {stats.pending}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappOrdersPage.pendingOrders")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500">
                  {stats.paid}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappOrdersPage.paidOrders")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-primary truncate">
                  RM {(stats.revenue / 100).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappOrdersPage.totalRevenue")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Tabs + Order List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.whatsappOrdersPage.orderList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.whatsappOrdersPage.searchPlaceholder")}
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
              <TabsList className="grid w-full grid-cols-6 h-auto p-1">
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                  data-testid="tab-all"
                >
                  {t("admin.whatsappOrdersPage.tabAll")}
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                  data-testid="tab-pending"
                >
                  <span className="hidden sm:inline">
                    {t("admin.whatsappOrdersPage.statusPending")}
                  </span>
                  <span className="sm:hidden">
                    {t("admin.whatsappOrdersPage.tabPendingShort")}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="confirmed"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                  data-testid="tab-confirmed"
                >
                  <span className="hidden sm:inline">
                    {t("admin.whatsappOrdersPage.statusConfirmed")}
                  </span>
                  <span className="sm:hidden">
                    {t("admin.whatsappOrdersPage.tabConfirmedShort")}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="processing"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                  data-testid="tab-processing"
                >
                  <span className="hidden sm:inline">
                    {t("admin.whatsappOrdersPage.statusProcessing")}
                  </span>
                  <span className="sm:hidden">
                    {t("admin.whatsappOrdersPage.tabProcessingShort")}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="shipped"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                  data-testid="tab-shipped"
                >
                  <span className="hidden sm:inline">
                    {t("admin.whatsappOrdersPage.statusShipped")}
                  </span>
                  <span className="sm:hidden">
                    {t("admin.whatsappOrdersPage.tabShippedShort")}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="delivered"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                  data-testid="tab-delivered"
                >
                  <span className="hidden sm:inline">
                    {t("admin.whatsappOrdersPage.statusDelivered")}
                  </span>
                  <span className="sm:hidden">
                    {t("admin.whatsappOrdersPage.tabDeliveredShort")}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-3 sm:mt-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {t("admin.whatsappOrdersPage.noOrders")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                        data-testid={`order-${order.id}`}
                      >
                        {/* Top row: customer info + badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                              <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-medium text-sm sm:text-base truncate">
                                  {order.customer_name}
                                </span>
                                {getPaymentStatusBadge(order.payment_status)}
                                {getOrderStatusBadge(order.status)}
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {order.customer_phone}
                                </span>
                                <span className="shrink-0">
                                  {formatDate(order.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pl-12 sm:pl-0">
                            <span className="font-bold text-primary text-sm sm:text-base">
                              RM {(order.total_amount / 100).toLocaleString()}
                            </span>
                          </div>
                        </div>

                        {/* Order items summary */}
                        <div className="pl-12 sm:pl-14">
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">
                            {getOrderItemsSummary(order.order_data)}
                          </p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-12 sm:pl-14">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                            onClick={() => handleViewDetails(order)}
                            data-testid={`button-view-${order.id}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t("admin.whatsappOrdersPage.viewDetails")}
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                            onClick={() => handleOpenEdit(order)}
                            data-testid={`button-edit-${order.id}`}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t("admin.whatsappOrdersPage.edit")}
                            </span>
                          </Button>
                          {order.conversation_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-8 text-xs"
                              asChild
                            >
                              <a
                                href={`/admin/whatsapp/conversations/${order.conversation_id}`}
                                data-testid={`button-conversation-${order.id}`}
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  {t("admin.whatsappOrdersPage.viewConversation")}
                                </span>
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                            onClick={() => handleOpenNotify(order)}
                            data-testid={`button-notify-${order.id}`}
                          >
                            <Bell className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t("admin.whatsappOrdersPage.notifyAdmin")}
                            </span>
                          </Button>
                          {order.order_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-8 text-xs"
                              asChild
                            >
                              <a
                                href={`/admin/orders/${order.order_id}`}
                                data-testid={`button-link-order-${order.id}`}
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">
                                  {t("admin.whatsappOrdersPage.linkToOrder")}
                                </span>
                              </a>
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleDelete(order)}
                            data-testid={`button-delete-${order.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {editingOrder ? (
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              ) : (
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              )}
              {editingOrder
                ? t("admin.whatsappOrdersPage.editOrder")
                : t("admin.whatsappOrdersPage.createOrder")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingOrder
                ? t("admin.whatsappOrdersPage.editOrderDesc")
                : t("admin.whatsappOrdersPage.createOrderDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappOrdersPage.customerPhone")} *
                </label>
                <Input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+60123456789"
                  className="h-9 sm:h-10"
                  data-testid="input-customer-phone"
                />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappOrdersPage.customerName")} *
                </label>
                <Input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={t("admin.whatsappOrdersPage.customerNamePlaceholder")}
                  className="h-9 sm:h-10"
                  data-testid="input-customer-name"
                />
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappOrdersPage.orderData")}
              </label>
              <Textarea
                value={formOrderData}
                onChange={(e) => setFormOrderData(e.target.value)}
                placeholder={t("admin.whatsappOrdersPage.orderDataPlaceholder")}
                className="min-h-[100px] font-mono text-xs sm:text-sm"
                data-testid="input-order-data"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappOrdersPage.totalAmount")} (RM)
              </label>
              <Input
                type="number"
                step="0.01"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="h-9 sm:h-10"
                data-testid="input-total-amount"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappOrdersPage.orderStatus")}
                </label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger className="h-9 sm:h-10" data-testid="select-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">
                      {t("admin.whatsappOrdersPage.statusPending")}
                    </SelectItem>
                    <SelectItem value="confirmed">
                      {t("admin.whatsappOrdersPage.statusConfirmed")}
                    </SelectItem>
                    <SelectItem value="processing">
                      {t("admin.whatsappOrdersPage.statusProcessing")}
                    </SelectItem>
                    <SelectItem value="shipped">
                      {t("admin.whatsappOrdersPage.statusShipped")}
                    </SelectItem>
                    <SelectItem value="delivered">
                      {t("admin.whatsappOrdersPage.statusDelivered")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappOrdersPage.paymentStatus")}
                </label>
                <Select
                  value={formPaymentStatus}
                  onValueChange={setFormPaymentStatus}
                >
                  <SelectTrigger
                    className="h-9 sm:h-10"
                    data-testid="select-payment-status"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">
                      {t("admin.whatsappOrdersPage.paymentUnpaid")}
                    </SelectItem>
                    <SelectItem value="paid">
                      {t("admin.whatsappOrdersPage.paymentPaid")}
                    </SelectItem>
                    <SelectItem value="refunded">
                      {t("admin.whatsappOrdersPage.paymentRefunded")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappOrdersPage.notes")}
              </label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder={t("admin.whatsappOrdersPage.notesPlaceholder")}
                className="min-h-[80px]"
                data-testid="input-notes"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowOrderDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappOrdersPage.cancel")}
            </Button>
            <Button
              onClick={handleSubmitOrder}
              disabled={
                createOrderMutation.isPending || updateOrderMutation.isPending
              }
              className="w-full sm:w-auto"
              data-testid="button-confirm-order"
            >
              {(createOrderMutation.isPending ||
                updateOrderMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingOrder
                ? t("admin.whatsappOrdersPage.save")
                : t("admin.whatsappOrdersPage.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.whatsappOrdersPage.orderDetails")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedOrder?.customer_name} - {selectedOrder?.customer_phone}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappOrdersPage.customerName")}
                  </p>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {selectedOrder.customer_name}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {t("admin.whatsappOrdersPage.customerPhone")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {selectedOrder.customer_phone}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappOrdersPage.orderStatus")}
                  </p>
                  {getOrderStatusBadge(selectedOrder.status)}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappOrdersPage.paymentStatus")}
                  </p>
                  {getPaymentStatusBadge(selectedOrder.payment_status)}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappOrdersPage.totalAmount")}
                  </p>
                  <p className="font-bold text-primary text-sm sm:text-base">
                    RM {(selectedOrder.total_amount / 100).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappOrdersPage.createdAt")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {formatDateTime(selectedOrder.created_at)}
                  </p>
                </div>
              </div>

              {/* Order Data */}
              {selectedOrder.order_data && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappOrdersPage.orderData")}
                  </p>
                  <pre className="text-xs bg-muted p-2.5 sm:p-3 rounded-lg overflow-x-auto max-h-48">
                    {JSON.stringify(selectedOrder.order_data, null, 2)}
                  </pre>
                </div>
              )}

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappOrdersPage.notes")}
                  </p>
                  <p className="text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Linked IDs */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {selectedOrder.conversation_id && (
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.whatsappOrdersPage.conversationId")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 w-full sm:w-auto"
                      asChild
                    >
                      <a
                        href={`/admin/whatsapp/conversations/${selectedOrder.conversation_id}`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {t("admin.whatsappOrdersPage.viewConversation")}
                      </a>
                    </Button>
                  </div>
                )}
                {selectedOrder.order_id && (
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.whatsappOrdersPage.linkedOrderId")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 w-full sm:w-auto"
                      asChild
                    >
                      <a href={`/admin/orders/${selectedOrder.order_id}`}>
                        <ShoppingBag className="w-4 h-4" />
                        {t("admin.whatsappOrdersPage.linkToOrder")}
                      </a>
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.whatsappOrdersPage.updatedAt")}
                </p>
                <p className="text-xs sm:text-sm">
                  {formatDateTime(selectedOrder.updated_at)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-3 sm:mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappOrdersPage.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notify Admin Dialog */}
      <Dialog open={showNotifyDialog} onOpenChange={setShowNotifyDialog}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.whatsappOrdersPage.notifyAdminTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {notifyOrder
                ? `${notifyOrder.customer_name} - ${notifyOrder.customer_phone}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappOrdersPage.notificationMessage")}
              </label>
              <Textarea
                value={notifyMessage}
                onChange={(e) => setNotifyMessage(e.target.value)}
                placeholder={t(
                  "admin.whatsappOrdersPage.notificationPlaceholder"
                )}
                className="min-h-[80px]"
                data-testid="input-notify-message"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNotifyDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappOrdersPage.cancel")}
            </Button>
            <Button
              onClick={handleSendNotification}
              disabled={!notifyMessage.trim()}
              className="w-full sm:w-auto gap-2"
              data-testid="button-send-notification"
            >
              <Send className="w-4 h-4" />
              {t("admin.whatsappOrdersPage.send")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
