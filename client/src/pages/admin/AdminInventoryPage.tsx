import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Boxes, Search, Plus, AlertTriangle, CheckCircle,
  ArrowUpRight, ArrowDownRight, Package
} from "lucide-react";

const mockInventory = [
  { id: "1", name: "原味红枣燕窝", sku: "BN-001", stock: 150, minStock: 50, status: "normal" },
  { id: "2", name: "可可燕麦燕窝", sku: "BN-002", stock: 80, minStock: 50, status: "normal" },
  { id: "3", name: "抹茶燕麦燕窝", sku: "BN-003", stock: 25, minStock: 50, status: "low" },
  { id: "4", name: "鲜炖花胶", sku: "FM-001", stock: 200, minStock: 80, status: "normal" },
  { id: "5", name: "燕窝礼盒套装", sku: "GS-001", stock: 10, minStock: 20, status: "critical" },
];

const mockLedger = [
  { id: "1", date: "2026-01-25", type: "in", product: "原味红枣燕窝", qty: 100, note: "生产入库" },
  { id: "2", date: "2026-01-24", type: "out", product: "可可燕麦燕窝", qty: 30, note: "销售出库" },
  { id: "3", date: "2026-01-23", type: "in", product: "鲜炖花胶", qty: 50, note: "采购入库" },
];

export default function AdminInventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInventory = mockInventory.filter(item =>
    searchQuery === "" ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalSku: mockInventory.length,
    lowStock: mockInventory.filter(i => i.status === "low").length,
    critical: mockInventory.filter(i => i.status === "critical").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal": return <Badge className="bg-green-500">充足</Badge>;
      case "low": return <Badge className="bg-yellow-500">偏低</Badge>;
      case "critical": return <Badge className="bg-red-500">紧缺</Badge>;
      default: return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-inventory-title">库存管理</h1>
            <p className="text-muted-foreground">库存查询与调整</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-add-stock">
            <Plus className="w-4 h-4" />
            入库登记
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Boxes className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSku}</p>
                <p className="text-sm text-muted-foreground">产品SKU</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{stats.lowStock}</p>
                <p className="text-sm text-muted-foreground">库存偏低</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
                <p className="text-sm text-muted-foreground">库存紧缺</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                库存状态
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索产品或SKU..."
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
              {filteredInventory.map((item) => {
                const stockPercent = Math.min((item.stock / (item.minStock * 2)) * 100, 100);
                return (
                  <div
                    key={item.id}
                    className="p-4 border rounded-lg"
                    data-testid={`inventory-${item.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">({item.sku})</span>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Progress 
                          value={stockPercent} 
                          className={`h-2 ${item.status === "critical" ? "[&>div]:bg-red-500" : item.status === "low" ? "[&>div]:bg-yellow-500" : ""}`}
                        />
                      </div>
                      <div className="text-right min-w-[100px]">
                        <span className="font-bold">{item.stock}</span>
                        <span className="text-muted-foreground text-sm"> / {item.minStock * 2}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-primary" />
              最近库存变动
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockLedger.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  data-testid={`ledger-${record.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${record.type === "in" ? "bg-green-500/10" : "bg-red-500/10"}`}>
                      {record.type === "in" ? (
                        <ArrowUpRight className="w-4 h-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{record.product}</p>
                      <p className="text-xs text-muted-foreground">{record.note}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${record.type === "in" ? "text-green-500" : "text-red-500"}`}>
                      {record.type === "in" ? "+" : "-"}{record.qty}
                    </p>
                    <p className="text-xs text-muted-foreground">{record.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
