import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import {
  ShoppingCart, Search, Package, Truck, CheckCircle,
  Clock, XCircle, Eye, ChevronRight
} from "lucide-react";

const mockOrders = [
  { id: "LY20260125001", customer: "张三", total: 452, status: "pending", items: 2, date: "2026-01-25" },
  { id: "LY20260124002", customer: "李四", total: 678, status: "processing", items: 3, date: "2026-01-24" },
  { id: "LY20260123003", customer: "王五", total: 226, status: "shipped", items: 1, date: "2026-01-23" },
  { id: "LY20260122004", customer: "赵六", total: 904, status: "delivered", items: 4, date: "2026-01-22" },
  { id: "LY20260121005", customer: "钱七", total: 452, status: "cancelled", items: 2, date: "2026-01-21" },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": return { label: "待付款", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    case "processing": return { label: "备货中", icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "shipped": return { label: "配送中", icon: Truck, color: "text-primary", bg: "bg-primary/10" };
    case "delivered": return { label: "已完成", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
    case "cancelled": return { label: "已取消", icon: XCircle, color: "text-muted-foreground", bg: "bg-muted" };
    default: return { label: "未知", icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || order.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: mockOrders.length,
    pending: mockOrders.filter(o => o.status === "pending").length,
    processing: mockOrders.filter(o => o.status === "processing").length,
    shipped: mockOrders.filter(o => o.status === "shipped").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-orders-title">订单管理</h1>
          <p className="text-muted-foreground">处理与跟踪客户订单</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">总订单</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-sm text-muted-foreground">待付款</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
              <p className="text-sm text-muted-foreground">备货中</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.shipped}</p>
              <p className="text-sm text-muted-foreground">配送中</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                订单列表
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索订单号或客户..."
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
                <TabsTrigger value="all" data-testid="tab-all">全部</TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">待付款</TabsTrigger>
                <TabsTrigger value="processing" data-testid="tab-processing">备货中</TabsTrigger>
                <TabsTrigger value="shipped" data-testid="tab-shipped">配送中</TabsTrigger>
                <TabsTrigger value="delivered" data-testid="tab-delivered">已完成</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无订单</p>
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
                          data-testid={`order-${order.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">#{order.id}</span>
                                <Badge variant="outline">{statusConfig.label}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{order.customer}</span>
                                <span>{order.items} 件商品</span>
                                <span>{order.date}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">RM {order.total}</span>
                            <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-${order.id}`}>
                              <Eye className="w-4 h-4" />
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
    </AdminLayout>
  );
}
