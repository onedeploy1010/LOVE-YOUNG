import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberLayout } from "@/components/MemberLayout";
import { useTranslation } from "@/lib/i18n";
import {
  Bell, ShoppingBag, Gift, TrendingUp, MessageSquare,
  Check, CheckCheck, Trash2, Clock
} from "lucide-react";

const getMockNotifications = (t: (key: string) => string) => [
  { id: 1, type: "order", title: t("member.notifications.tabs.order"), content: "Order #LY20260120001 shipped", time: "2h ago", read: false },
  { id: 2, type: "earning", title: t("member.notifications.tabs.earning"), content: "RWA dividend RM 95.00 received", time: "1d ago", read: false },
  { id: 3, type: "promo", title: t("member.notifications.tabs.promo"), content: "New Year special - 20% off", time: "2d ago", read: true },
  { id: 4, type: "system", title: "System", content: "Maintenance scheduled Jan 26, 2:00-4:00 AM", time: "3d ago", read: true },
  { id: 5, type: "order", title: t("member.notifications.tabs.order"), content: "Order #LY20260118002 confirmed", time: "1w ago", read: true },
];

const getIcon = (type: string) => {
  switch (type) {
    case "order": return ShoppingBag;
    case "earning": return TrendingUp;
    case "promo": return Gift;
    case "system": return MessageSquare;
    default: return Bell;
  }
};

const getIconBg = (type: string) => {
  switch (type) {
    case "order": return "bg-blue-500/10 text-blue-500";
    case "earning": return "bg-green-500/10 text-green-500";
    case "promo": return "bg-secondary/10 text-secondary";
    case "system": return "bg-muted text-muted-foreground";
    default: return "bg-primary/10 text-primary";
  }
};

export default function MemberNotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState(() => getMockNotifications(t));
  const [activeTab, setActiveTab] = useState("all");

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = activeTab === "all" 
    ? notifications 
    : activeTab === "unread" 
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => n.type === activeTab);

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-notifications-title">{t("member.notifications.title")}</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 
                ? t("member.notifications.unreadCount").replace("{count}", String(unreadCount))
                : t("member.notifications.noUnread")}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead} data-testid="button-mark-all-read">
              <CheckCheck className="w-4 h-4" />
              {t("member.notifications.markAllRead")}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" data-testid="tab-all">
              {t("member.notifications.tabs.all")}
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{notifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread" data-testid="tab-unread">
              {t("member.notifications.tabs.unread")}
              {unreadCount > 0 && (
                <Badge className="ml-1 text-xs bg-red-500">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="order" data-testid="tab-order">{t("member.notifications.tabs.order")}</TabsTrigger>
            <TabsTrigger value="earning" data-testid="tab-earning">{t("member.notifications.tabs.earning")}</TabsTrigger>
            <TabsTrigger value="promo" data-testid="tab-promo">{t("member.notifications.tabs.promo")}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredNotifications.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">{t("member.notifications.noMessages")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => {
                  const Icon = getIcon(notification.type);
                  const iconClass = getIconBg(notification.type);
                  return (
                    <Card 
                      key={notification.id} 
                      className={`transition-colors ${!notification.read ? "bg-primary/5 border-primary/20" : ""}`}
                      data-testid={`notification-${notification.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconClass}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{notification.title}</span>
                              {!notification.read && (
                                <Badge className="bg-red-500 text-white text-xs">{t("member.notifications.new")}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{notification.content}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {notification.time}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => markAsRead(notification.id)}
                                data-testid={`button-read-${notification.id}`}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-red-500"
                              onClick={() => deleteNotification(notification.id)}
                              data-testid={`button-delete-${notification.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
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
