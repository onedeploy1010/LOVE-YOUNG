import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Thermometer, Search, Truck, Package, CheckCircle,
  Clock, MapPin, Eye, AlertTriangle
} from "lucide-react";

const mockShipments = [
  { id: "SH-2026-001", order: "LY20260125001", destination: "Kuala Lumpur", status: "in_transit", temp: "-18°C", eta: "2026-01-27" },
  { id: "SH-2026-002", order: "LY20260124002", destination: "Penang", status: "pending", temp: "-18°C", eta: "2026-01-28" },
  { id: "SH-2026-003", order: "LY20260123003", destination: "Johor Bahru", status: "delivered", temp: "-18°C", eta: "2026-01-25" },
  { id: "SH-2026-004", order: "LY20260122004", destination: "Ipoh", status: "in_transit", temp: "-15°C", eta: "2026-01-26" },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": return { label: "待发货", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    case "in_transit": return { label: "运输中", icon: Truck, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "delivered": return { label: "已送达", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
    default: return { label: "未知", icon: Package, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

export default function AdminLogisticsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredShipments = mockShipments.filter(s =>
    searchQuery === "" ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.order.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: mockShipments.length,
    inTransit: mockShipments.filter(s => s.status === "in_transit").length,
    pending: mockShipments.filter(s => s.status === "pending").length,
    delivered: mockShipments.filter(s => s.status === "delivered").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-logistics-title">物流追踪</h1>
          <p className="text-muted-foreground">冷链物流与配送管理</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">总运单</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">待发货</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.inTransit}</p>
              <p className="text-sm text-muted-foreground">运输中</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.delivered}</p>
              <p className="text-sm text-muted-foreground">已送达</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-blue-500/10 to-primary/10 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Thermometer className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="font-bold">冷链监控</p>
              <p className="text-sm text-muted-foreground">
                所有运输中货品温度正常 (-18°C ~ -15°C)
              </p>
            </div>
            <Badge className="ml-auto bg-green-500 text-white gap-1">
              <CheckCircle className="w-3 h-3" />
              正常
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-primary" />
                运单列表
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索运单或目的地..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredShipments.map((shipment) => {
                const statusConfig = getStatusConfig(shipment.status);
                const StatusIcon = statusConfig.icon;
                return (
                  <div
                    key={shipment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`shipment-${shipment.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                        <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{shipment.id}</span>
                          <Badge variant="outline">{statusConfig.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>订单: {shipment.order}</span>
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
                          {shipment.temp}
                        </p>
                        <p className="text-xs text-muted-foreground">ETA: {shipment.eta}</p>
                      </div>
                      <Button variant="outline" size="sm" className="gap-1" data-testid={`button-track-${shipment.id}`}>
                        <Eye className="w-4 h-4" />
                        追踪
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
