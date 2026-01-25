import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberLayout } from "@/components/MemberLayout";
import {
  ShoppingBag, Package, Truck, CheckCircle, Clock,
  ChevronRight, RefreshCw
} from "lucide-react";

const mockOrders = [
  { 
    id: "LY20260120001", 
    date: "2026-01-20", 
    status: "shipped", 
    total: 452,
    items: [
      { name: "原味红枣燕窝", quantity: 2, price: 226 }
    ]
  },
  { 
    id: "LY20260115002", 
    date: "2026-01-15", 
    status: "delivered", 
    total: 678,
    items: [
      { name: "可可燕麦燕窝", quantity: 1, price: 226 },
      { name: "鲜炖花胶", quantity: 2, price: 226 }
    ]
  },
  { 
    id: "LY20260110003", 
    date: "2026-01-10", 
    status: "delivered", 
    total: 226,
    items: [
      { name: "抹茶燕麦燕窝", quantity: 1, price: 226 }
    ]
  },
  { 
    id: "LY20260105004", 
    date: "2026-01-05", 
    status: "cancelled", 
    total: 452,
    items: [
      { name: "原味红枣燕窝", quantity: 2, price: 226 }
    ]
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending":
      return { label: "待付款", icon: Clock, color: "bg-yellow-500/10 text-yellow-600", badgeVariant: "outline" as const };
    case "paid":
      return { label: "已付款", icon: CheckCircle, color: "bg-blue-500/10 text-blue-500", badgeVariant: "default" as const };
    case "processing":
      return { label: "备货中", icon: Package, color: "bg-blue-500/10 text-blue-500", badgeVariant: "default" as const };
    case "shipped":
      return { label: "配送中", icon: Truck, color: "bg-primary/10 text-primary", badgeVariant: "default" as const };
    case "delivered":
      return { label: "已完成", icon: CheckCircle, color: "bg-green-500/10 text-green-500", badgeVariant: "secondary" as const };
    case "cancelled":
      return { label: "已取消", icon: RefreshCw, color: "bg-muted text-muted-foreground", badgeVariant: "outline" as const };
    default:
      return { label: "未知", icon: Clock, color: "bg-muted", badgeVariant: "outline" as const };
  }
};

export default function MemberOrdersPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = activeTab === "all" 
    ? mockOrders 
    : mockOrders.filter(order => order.status === activeTab);

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-orders-title">订单记录</h1>
          <p className="text-muted-foreground">查看您的历史订单</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" data-testid="tab-all">全部</TabsTrigger>
            <TabsTrigger value="pending" data-testid="tab-pending">待付款</TabsTrigger>
            <TabsTrigger value="shipped" data-testid="tab-shipped">配送中</TabsTrigger>
            <TabsTrigger value="delivered" data-testid="tab-delivered">已完成</TabsTrigger>
            <TabsTrigger value="cancelled" data-testid="tab-cancelled">已取消</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">暂无订单</p>
                  <Link href="/products">
                    <Button className="mt-4 bg-secondary text-secondary-foreground" data-testid="button-shop">
                      去逛逛
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <Card key={order.id} className="overflow-hidden" data-testid={`order-${order.id}`}>
                      <div className="flex items-center justify-between p-4 bg-muted/30 border-b">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted-foreground">#{order.id}</span>
                          <span className="text-sm text-muted-foreground">{order.date}</span>
                        </div>
                        <Badge variant={statusConfig.badgeVariant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                  <Package className="w-6 h-6 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">x{item.quantity}</p>
                                </div>
                              </div>
                              <span className="font-medium">RM {item.price}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <span className="text-muted-foreground">
                            共 {order.items.reduce((sum, i) => sum + i.quantity, 0)} 件商品
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-lg">
                              合计: <span className="text-primary">RM {order.total}</span>
                            </span>
                            <Button variant="outline" size="sm" className="gap-1" data-testid={`button-detail-${order.id}`}>
                              查看详情
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
