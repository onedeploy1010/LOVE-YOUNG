import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Bell, BellOff, CheckCircle, Send, Loader2,
  Wallet, ShoppingCart, Truck, Users, AlertTriangle, Settings,
  Eye, EyeOff, Filter
} from "lucide-react";

interface AdminNotification {
  id: string;
  type: string;
  title: string;
  content: string;
  related_id: string | null;
  related_type: string | null;
  is_read: boolean;
  sent_to_whatsapp: boolean;
  created_at: string;
}

const typeIcons: Record<string, React.ElementType> = {
  withdrawal_request: Wallet,
  new_order: ShoppingCart,
  order_status: ShoppingCart,
  shipping_update: Truck,
  new_partner: Users,
  escalation: AlertTriangle,
  system: Settings,
};

const typeColors: Record<string, string> = {
  withdrawal_request: "text-orange-500 bg-orange-500/10",
  new_order: "text-blue-500 bg-blue-500/10",
  order_status: "text-blue-500 bg-blue-500/10",
  shipping_update: "text-green-500 bg-green-500/10",
  new_partner: "text-purple-500 bg-purple-500/10",
  escalation: "text-red-500 bg-red-500/10",
  system: "text-gray-500 bg-gray-500/10",
};

export default function AdminNotificationsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [filter, setFilter] = useState<string>("all");

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["admin-notifications", filter],
    queryFn: async () => {
      let query = supabase
        .from("admin_notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filter === "withdrawal") query = query.eq("type", "withdrawal_request");
      else if (filter === "order") query = query.in("type", ["new_order", "order_status"]);
      else if (filter === "shipping") query = query.eq("type", "shipping_update");
      else if (filter === "partner") query = query.eq("type", "new_partner");

      const { data, error } = await query;
      if (error) { console.error("Error fetching notifications:", error); return []; }
      return (data || []) as AdminNotification[];
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const todayCount = notifications.filter(n => {
    const d = new Date(n.created_at);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;
  const weekCount = notifications.filter(n => {
    const d = new Date(n.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return d >= weekAgo;
  }).length;

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("admin_notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-count"] });
    },
  });

  const pushWhatsappMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.functions.invoke("admin-notify-whatsapp", {
        body: { notification_id: notificationId },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast({ title: t("admin.notificationsPage.pushSuccess") });
    },
    onError: (error: Error) => {
      toast({ title: t("admin.notificationsPage.pushFailed"), description: error.message, variant: "destructive" });
    },
  });

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      withdrawal_request: t("admin.notificationsPage.typeWithdrawal"),
      new_order: t("admin.notificationsPage.typeNewOrder"),
      order_status: t("admin.notificationsPage.typeOrderStatus"),
      shipping_update: t("admin.notificationsPage.typeShipping"),
      new_partner: t("admin.notificationsPage.typeNewPartner"),
      escalation: t("admin.notificationsPage.typeEscalation"),
      system: t("admin.notificationsPage.typeSystem"),
    };
    return map[type] || type;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}小时前`;
    return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const filterTabs = [
    { key: "all", label: t("admin.notificationsPage.all") },
    { key: "withdrawal", label: t("admin.notificationsPage.withdrawal") },
    { key: "order", label: t("admin.notificationsPage.order") },
    { key: "shipping", label: t("admin.notificationsPage.shipping") },
    { key: "partner", label: t("admin.notificationsPage.partner") },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif text-primary">{t("admin.notificationsPage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.notificationsPage.subtitle")}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount === 0}
          >
            {markAllReadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            <CheckCircle className="w-4 h-4 mr-2" />
            {t("admin.notificationsPage.markAllRead")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">{t("admin.notificationsPage.unread")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-sm text-muted-foreground">{t("admin.notificationsPage.today")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{weekCount}</p>
                <p className="text-sm text-muted-foreground">{t("admin.notificationsPage.thisWeek")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map(tab => (
            <Button
              key={tab.key}
              variant={filter === tab.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Notification list */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-primary" />
              {filterTabs.find(t => t.key === filter)?.label || t("admin.notificationsPage.all")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <BellOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("admin.notificationsPage.noNotifications")}</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => {
                  const Icon = typeIcons[notif.type] || Bell;
                  const colorClass = typeColors[notif.type] || "text-gray-500 bg-gray-500/10";

                  return (
                    <div
                      key={notif.id}
                      className={`flex items-start gap-4 py-4 ${!notif.is_read ? "bg-primary/5 -mx-4 px-4 rounded-lg" : ""}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${!notif.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notif.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(notif.type)}
                          </Badge>
                          {!notif.is_read && (
                            <Badge className="bg-red-500 text-white text-xs">NEW</Badge>
                          )}
                          {notif.sent_to_whatsapp && (
                            <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                              <Send className="w-3 h-3 mr-1" />
                              {t("admin.notificationsPage.sent")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 truncate">{notif.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!notif.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => markReadMutation.mutate(notif.id)}
                            disabled={markReadMutation.isPending}
                            title={t("admin.notificationsPage.markRead")}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {!notif.sent_to_whatsapp && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-500"
                            onClick={() => pushWhatsappMutation.mutate(notif.id)}
                            disabled={pushWhatsappMutation.isPending}
                            title={t("admin.notificationsPage.pushWhatsapp")}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
