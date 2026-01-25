import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import {
  FileText, Search, Plus, DollarSign, CheckCircle,
  Clock, AlertCircle, Eye, Download
} from "lucide-react";

const mockBills = [
  { id: "BILL-2026-001", vendor: "马来西亚燕窝供应商", amount: 25000, status: "pending", type: "purchase", dueDate: "2026-02-01" },
  { id: "BILL-2026-002", vendor: "冷链物流公司", amount: 3500, status: "paid", type: "logistics", dueDate: "2026-01-25" },
  { id: "BILL-2026-003", vendor: "包装材料供应商", amount: 5000, status: "overdue", type: "purchase", dueDate: "2026-01-20" },
  { id: "BILL-2026-004", vendor: "仓库租赁", amount: 8000, status: "pending", type: "operation", dueDate: "2026-01-31" },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "pending": return { label: "待付款", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    case "paid": return { label: "已付款", icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
    case "overdue": return { label: "已逾期", icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" };
    default: return { label: "未知", icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "purchase": return "采购";
    case "logistics": return "物流";
    case "operation": return "运营";
    default: return type;
  }
};

export default function AdminBillsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filteredBills = mockBills.filter(bill => {
    const matchesSearch = searchQuery === "" ||
      bill.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || bill.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: mockBills.reduce((sum, b) => sum + b.amount, 0),
    pending: mockBills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0),
    overdue: mockBills.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-bills-title">账单管理</h1>
            <p className="text-muted-foreground">费用与账单记录</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-add-bill">
            <Plus className="w-4 h-4" />
            新增账单
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">RM {stats.total.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">总账单</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">RM {stats.pending.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">待付款</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">RM {stats.overdue.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">已逾期</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                账单列表
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索账单..."
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
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" data-testid="tab-all">全部</TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">待付款</TabsTrigger>
                <TabsTrigger value="paid" data-testid="tab-paid">已付款</TabsTrigger>
                <TabsTrigger value="overdue" data-testid="tab-overdue">已逾期</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredBills.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无账单</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredBills.map((bill) => {
                      const statusConfig = getStatusConfig(bill.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div
                          key={bill.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`bill-${bill.id}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{bill.id}</span>
                                <Badge variant="outline">{statusConfig.label}</Badge>
                                <Badge variant="secondary">{getTypeLabel(bill.type)}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{bill.vendor}</span>
                                <span>到期: {bill.dueDate}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">RM {bill.amount.toLocaleString()}</span>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-${bill.id}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1" data-testid={`button-download-${bill.id}`}>
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
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
