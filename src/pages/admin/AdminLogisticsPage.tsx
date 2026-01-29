import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import {
  Thermometer, Search, Truck, Package, CheckCircle,
  Clock, MapPin, Eye, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Shipment {
  id: string;
  shipment_number: string;
  order_id: string | null;
  order_number: string | null;
  destination: string;
  status: string;
  temperature: string;
  eta: string | null;
  delivered_at: string | null;
  tracking_number: string | null;
  carrier: string | null;
  created_at: string;
}

export default function AdminLogisticsPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["admin-shipments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipments")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching shipments:", error);
        return [];
      }

      return (data || []) as Shipment[];
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { label: t("admin.logisticsPage.pendingShipment"), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "in_transit": return { label: t("admin.logisticsPage.inTransit"), icon: Truck, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "delivered": return { label: t("admin.logisticsPage.delivered"), icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
      default: return { label: t("admin.logisticsPage.statusUnknown"), icon: Package, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const filteredShipments = shipments.filter(s =>
    searchQuery === "" ||
    s.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.order_number && s.order_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
    s.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === "in_transit").length,
    pending: shipments.filter(s => s.status === "pending").length,
    delivered: shipments.filter(s => s.status === "delivered").length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-logistics-title">{t("admin.logisticsPage.title")}</h1>
          <p className="text-muted-foreground">{t("admin.logisticsPage.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">{t("admin.logisticsPage.totalShipments")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">{t("admin.logisticsPage.pendingShipment")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.inTransit}</p>
              <p className="text-sm text-muted-foreground">{t("admin.logisticsPage.inTransit")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.delivered}</p>
              <p className="text-sm text-muted-foreground">{t("admin.logisticsPage.delivered")}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-blue-500/10 to-primary/10 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-bold">{t("admin.logisticsPage.coldChainMonitor")}</p>
              <p className="text-sm text-muted-foreground">
                {t("admin.logisticsPage.tempNormal")}
              </p>
            </div>
            <Badge className="ml-auto bg-green-500 text-white gap-1">
              <CheckCircle className="w-3 h-3" />
              {t("admin.logisticsPage.statusNormal")}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                {t("admin.logisticsPage.shipmentList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.logisticsPage.searchPlaceholder")}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredShipments.length === 0 ? (
              <div className="text-center py-12">
                <Truck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">暂无物流记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredShipments.map((shipment) => {
                  const statusConfig = getStatusConfig(shipment.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <div
                      key={shipment.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`shipment-${shipment.shipment_number}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                          <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{shipment.shipment_number}</span>
                            <Badge variant="outline">{statusConfig.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{t("admin.logisticsPage.order")}: {shipment.order_number || "-"}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {shipment.destination}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                          <p className="text-sm font-medium flex items-center gap-1">
                            <Thermometer className="w-4 h-4 text-blue-500" />
                            {shipment.temperature}
                          </p>
                          <p className="text-xs text-muted-foreground">ETA: {formatDate(shipment.eta)}</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1" data-testid={`button-track-${shipment.shipment_number}`}>
                          <Eye className="w-4 h-4" />
                          {t("admin.logisticsPage.track")}
                        </Button>
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
