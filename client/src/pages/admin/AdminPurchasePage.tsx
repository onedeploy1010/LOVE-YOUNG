import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import {
  ClipboardCheck, Search, Plus, Building2, Eye,
  Clock, CheckCircle, Truck, Package
} from "lucide-react";

const mockPurchaseOrders = [
  { id: "PO-2026-001", supplier: "马来西亚燕窝供应商", total: 25000, status: "pending", items: 5, date: "2026-01-25" },
  { id: "PO-2026-002", supplier: "香港花胶批发商", total: 18000, status: "approved", items: 3, date: "2026-01-23" },
  { id: "PO-2026-003", supplier: "包装材料供应商", total: 5000, status: "shipped", items: 8, date: "2026-01-20" },
  { id: "PO-2026-004", supplier: "马来西亚燕窝供应商", total: 30000, status: "received", items: 6, date: "2026-01-15" },
];

const mockSuppliers = [
  { id: "1", name: "马来西亚燕窝供应商", contact: "Mr. Tan", phone: "+60 12-345 6789", orders: 12 },
  { id: "2", name: "香港花胶批发商", contact: "陈先生", phone: "+852 1234 5678", orders: 8 },
  { id: "3", name: "包装材料供应商", contact: "Mdm. Lee", phone: "+60 12-987 6543", orders: 5 },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": return { label: "待审批", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    case "approved": return { label: "已审批", icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "shipped": return { label: "运输中", icon: Truck, color: "text-primary", bg: "bg-primary/10" };
    case "received": return { label: "已收货", icon: Package, color: "text-green-500", bg: "bg-green-500/10" };
    default: return { label: "未知", icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

export default function AdminPurchasePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("orders");

  const filteredOrders = mockPurchaseOrders.filter(order =>
    searchQuery === "" ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.supplier.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-purchase-title">采购管理</h1>
            <p className="text-muted-foreground">采购订单与供应商管理</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-new-po">
            <Plus className="w-4 h-4" />
            新建采购单
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" data-testid="tab-orders">采购订单</TabsTrigger>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">供应商</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                    采购订单 ({mockPurchaseOrders.length})
                  </CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索订单或供应商..."
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
                  {filteredOrders.map((order) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`po-${order.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                            <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{order.id}</span>
                              <Badge variant="outline">{statusConfig.label}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>{order.supplier}</span>
                              <span>{order.items} 项</span>
                              <span>{order.date}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-primary">RM {order.total.toLocaleString()}</span>
                          <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-${order.id}`}>
                            <Eye className="w-4 h-4" />
                            详情
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    供应商列表
                  </CardTitle>
                  <Button variant="outline" className="gap-2" data-testid="button-add-supplier">
                    <Plus className="w-4 h-4" />
                    添加供应商
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSuppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`supplier-${supplier.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{supplier.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {supplier.contact} · {supplier.phone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">{supplier.orders} 订单</Badge>
                        <Button variant="outline" size="sm" data-testid={`button-edit-${supplier.id}`}>
                          编辑
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
