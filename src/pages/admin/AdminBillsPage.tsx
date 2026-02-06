import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  FileText, Search, Plus, DollarSign, CheckCircle,
  Clock, AlertCircle, Eye, Download, Loader2,
  ClipboardCheck, ExternalLink, Calendar, Building2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const billFormSchema = z.object({
  billNumber: z.string().min(1),
  type: z.enum(["purchase", "logistics", "operation"], { required_error: "请选择类型" }),
  vendor: z.string().min(1, "请输入供应商"),
  amount: z.coerce.number().min(0.01, "金额必须大于0"),
  dueDate: z.string().min(1, "请选择到期日"),
  category: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type BillFormValues = z.infer<typeof billFormSchema>;

interface Bill {
  id: string;
  bill_number: string;
  vendor: string;
  amount: number;
  status: string;
  type: string;
  category: string | null;
  description: string | null;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function AdminBillsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const generateBillNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BILL-${datePart}-${rand}`;
  };

  const billForm = useForm<BillFormValues>({
    resolver: zodResolver(billFormSchema),
    defaultValues: {
      billNumber: "",
      type: "purchase",
      vendor: "",
      amount: 0,
      dueDate: "",
      category: "",
      description: "",
      notes: "",
    },
  });

  const createBillMutation = useMutation({
    mutationFn: async (data: BillFormValues) => {
      const { error } = await supabase.from("bills").insert({
        bill_number: data.billNumber,
        type: data.type,
        vendor: data.vendor,
        amount: Math.round(data.amount * 100),
        due_date: data.dueDate,
        category: data.category || null,
        description: data.description || null,
        notes: data.notes || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bills"] });
      setShowAddBillModal(false);
      billForm.reset();
      toast({ title: "账单已创建" });
    },
    onError: (error) => {
      toast({ title: "创建失败", description: String(error), variant: "destructive" });
    },
  });

  // Mark bill as paid
  const markPaidMutation = useMutation({
    mutationFn: async (billId: string) => {
      const { error } = await supabase
        .from("bills")
        .update({ status: "paid", paid_date: new Date().toISOString() })
        .eq("id", billId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bills"] });
      if (selectedBill) {
        setSelectedBill({ ...selectedBill, status: "paid", paid_date: new Date().toISOString() });
      }
      toast({ title: "账单已标记为已付款" });
    },
    onError: (error) => {
      toast({ title: "更新失败", description: String(error), variant: "destructive" });
    },
  });

  const handleOpenAddBill = () => {
    billForm.reset({ billNumber: generateBillNumber(), type: "purchase", vendor: "", amount: 0, dueDate: "", category: "", description: "", notes: "" });
    setShowAddBillModal(true);
  };

  const handleViewDetails = (bill: Bill) => {
    setSelectedBill(bill);
    setShowDetailsModal(true);
  };

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ["admin-bills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bills")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) {
        console.error("Error fetching bills:", error);
        return [];
      }

      return (data || []) as Bill[];
    },
  });

  // Fetch linked purchase order if bill has reference
  const { data: linkedPo } = useQuery({
    queryKey: ["linked-po", selectedBill?.reference_id],
    queryFn: async () => {
      if (!selectedBill?.reference_id || selectedBill.reference_type !== "purchase_order") return null;
      const { data } = await supabase
        .from("purchase_orders")
        .select("id, order_number, supplier_name, total_amount, status, created_at")
        .eq("id", selectedBill.reference_id)
        .single();
      return data as PurchaseOrder | null;
    },
    enabled: !!selectedBill?.reference_id && selectedBill?.reference_type === "purchase_order",
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { label: t("admin.billsPage.statusPending"), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "paid": return { label: t("admin.billsPage.statusPaid"), icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
      case "overdue": return { label: t("admin.billsPage.statusOverdue"), icon: AlertCircle, color: "text-red-500", bg: "bg-red-500/10" };
      default: return { label: t("admin.billsPage.statusUnknown"), icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "purchase": return t("admin.billsPage.typePurchase");
      case "logistics": return t("admin.billsPage.typeLogistics");
      case "operation": return t("admin.billsPage.typeOperation");
      default: return type;
    }
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = searchQuery === "" ||
      bill.bill_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || bill.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: bills.reduce((sum, b) => sum + b.amount, 0),
    pending: bills.filter(b => b.status === "pending").reduce((sum, b) => sum + b.amount, 0),
    overdue: bills.filter(b => b.status === "overdue").reduce((sum, b) => sum + b.amount, 0),
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-bills-title">{t("admin.billsPage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.billsPage.subtitle")}</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground w-full sm:w-auto" onClick={handleOpenAddBill} data-testid="button-add-bill">
            <Plus className="w-4 h-4" />
            {t("admin.billsPage.addBill")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold truncate">RM {(stats.total / 100).toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.billsPage.totalBills")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-yellow-500 truncate">RM {(stats.pending / 100).toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.billsPage.pendingPayment")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-red-500 truncate">RM {(stats.overdue / 100).toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.billsPage.overdue")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.billsPage.billList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.billsPage.searchPlaceholder")}
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
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-all">{t("admin.billsPage.tabAll")}</TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-pending">
                  <span className="hidden sm:inline">{t("admin.billsPage.statusPending")}</span>
                  <span className="sm:hidden">待付</span>
                </TabsTrigger>
                <TabsTrigger value="paid" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-paid">
                  <span className="hidden sm:inline">{t("admin.billsPage.statusPaid")}</span>
                  <span className="sm:hidden">已付</span>
                </TabsTrigger>
                <TabsTrigger value="overdue" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-overdue">
                  <span className="hidden sm:inline">{t("admin.billsPage.statusOverdue")}</span>
                  <span className="sm:hidden">逾期</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-3 sm:mt-4">
                {filteredBills.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.billsPage.noBills")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredBills.map((bill) => {
                      const statusConfig = getStatusConfig(bill.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div
                          key={bill.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3"
                          data-testid={`bill-${bill.bill_number}`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${statusConfig.bg}`}>
                              <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfig.color}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-mono text-xs sm:text-sm">{bill.bill_number}</span>
                                <Badge variant="outline" className="text-xs">{statusConfig.label}</Badge>
                                <Badge variant="secondary" className="text-xs hidden sm:inline-flex">{getTypeLabel(bill.type)}</Badge>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <span className="truncate">{bill.vendor}</span>
                                <span className="shrink-0">{formatDate(bill.due_date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 pl-12 sm:pl-0">
                            <span className="font-bold text-primary text-sm sm:text-base">RM {(bill.amount / 100).toLocaleString()}</span>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8"
                                onClick={() => handleViewDetails(bill)}
                                data-testid={`button-view-${bill.bill_number}`}
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">详情</span>
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1 h-8" data-testid={`button-download-${bill.bill_number}`}>
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

      {/* Add Bill Modal */}
      <Dialog open={showAddBillModal} onOpenChange={setShowAddBillModal}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              新增账单
            </DialogTitle>
            <DialogDescription className="text-sm">创建新的账单记录</DialogDescription>
          </DialogHeader>
          <Form {...billForm}>
            <form onSubmit={billForm.handleSubmit((data) => createBillMutation.mutate(data))} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <FormField control={billForm.control} name="billNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">账单编号</FormLabel>
                  <FormControl><Input {...field} readOnly className="bg-muted h-9 sm:h-10" data-testid="input-bill-number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField control={billForm.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">类型</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9 sm:h-10" data-testid="select-bill-type">
                          <SelectValue placeholder="选择类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="purchase">{t("admin.billsPage.typePurchase")}</SelectItem>
                        <SelectItem value="logistics">{t("admin.billsPage.typeLogistics")}</SelectItem>
                        <SelectItem value="operation">{t("admin.billsPage.typeOperation")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={billForm.control} name="vendor" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">供应商</FormLabel>
                    <FormControl><Input {...field} placeholder="输入供应商名称" className="h-9 sm:h-10" data-testid="input-bill-vendor" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField control={billForm.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">金额 (RM)</FormLabel>
                    <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" className="h-9 sm:h-10" data-testid="input-bill-amount" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={billForm.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">到期日</FormLabel>
                    <FormControl><Input {...field} type="date" className="h-9 sm:h-10" data-testid="input-bill-due-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={billForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">分类</FormLabel>
                  <FormControl><Input {...field} placeholder="分类（可选）" className="h-9 sm:h-10" data-testid="input-bill-category" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={billForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">描述</FormLabel>
                  <FormControl><Textarea {...field} placeholder="账单描述（可选）" className="min-h-[80px]" data-testid="input-bill-desc" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={billForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">备注</FormLabel>
                  <FormControl><Textarea {...field} placeholder="备注（可选）" className="min-h-[80px]" data-testid="input-bill-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddBillModal(false)} className="w-full sm:w-auto">取消</Button>
                <Button type="submit" disabled={createBillMutation.isPending} className="w-full sm:w-auto" data-testid="button-confirm-add-bill">
                  {createBillMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  创建
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bill Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="truncate">账单详情 - {selectedBill?.bill_number}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedBill && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">账单状态</p>
                  <Badge className={`${getStatusConfig(selectedBill.status).bg} text-xs`}>
                    {getStatusConfig(selectedBill.status).label}
                  </Badge>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">账单类型</p>
                  <Badge variant="secondary" className="text-xs">{getTypeLabel(selectedBill.type)}</Badge>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 供应商
                  </p>
                  <p className="font-medium text-sm sm:text-base truncate">{selectedBill.vendor}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 金额
                  </p>
                  <p className="font-bold text-primary text-sm sm:text-base">RM {(selectedBill.amount / 100).toLocaleString()}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 到期日
                  </p>
                  <p className="font-medium text-sm sm:text-base">{formatDate(selectedBill.due_date)}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">付款日期</p>
                  <p className="font-medium text-sm sm:text-base">{formatDate(selectedBill.paid_date)}</p>
                </div>
              </div>

              {selectedBill.category && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">分类</p>
                  <p className="text-sm sm:text-base">{selectedBill.category}</p>
                </div>
              )}

              {selectedBill.description && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">描述</p>
                  <p className="text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg">{selectedBill.description}</p>
                </div>
              )}

              {selectedBill.notes && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">备注</p>
                  <p className="text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg">{selectedBill.notes}</p>
                </div>
              )}

              {/* Linked Purchase Order */}
              {linkedPo && (
                <>
                  <Separator />
                  <div className="p-3 sm:p-4 border rounded-lg bg-primary/5">
                    <h4 className="font-medium flex items-center gap-2 mb-3 text-sm sm:text-base">
                      <ClipboardCheck className="w-4 h-4 text-primary" />
                      关联采购单
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-sm">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">采购单号</p>
                        <p className="font-mono text-xs sm:text-sm">{linkedPo.order_number}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">供应商</p>
                        <p className="text-xs sm:text-sm truncate">{linkedPo.supplier_name}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">采购金额</p>
                        <p className="text-xs sm:text-sm">RM {(linkedPo.total_amount / 100).toLocaleString()}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground">创建日期</p>
                        <p className="text-xs sm:text-sm">{formatDateTime(linkedPo.created_at)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" className="h-8 gap-1 w-full sm:w-auto">
                        <ExternalLink className="w-4 h-4" />
                        查看采购单
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {/* Mark as Paid */}
              {selectedBill.status === "pending" && (
                <div className="flex justify-end pt-2 sm:pt-4">
                  <Button onClick={() => markPaidMutation.mutate(selectedBill.id)} disabled={markPaidMutation.isPending} className="w-full sm:w-auto">
                    {markPaidMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <CheckCircle className="w-4 h-4 mr-2" />
                    标记为已付款
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-3 sm:mt-4">
            <Button variant="outline" onClick={() => setShowDetailsModal(false)} className="w-full sm:w-auto">
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
