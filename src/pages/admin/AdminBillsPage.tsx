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
  Clock, AlertCircle, Eye, Download, Loader2
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
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
}

export default function AdminBillsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showAddBillModal, setShowAddBillModal] = useState(false);

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

  const handleOpenAddBill = () => {
    billForm.reset({ billNumber: generateBillNumber(), type: "purchase", vendor: "", amount: 0, dueDate: "", category: "", description: "", notes: "" });
    setShowAddBillModal(true);
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

  const formatDate = (dateStr: string) => {
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-bills-title">{t("admin.billsPage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.billsPage.subtitle")}</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground" onClick={handleOpenAddBill} data-testid="button-add-bill">
            <Plus className="w-4 h-4" />
            {t("admin.billsPage.addBill")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">RM {(stats.total / 100).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t("admin.billsPage.totalBills")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">RM {(stats.pending / 100).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t("admin.billsPage.pendingPayment")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">RM {(stats.overdue / 100).toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{t("admin.billsPage.overdue")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t("admin.billsPage.billList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.billsPage.searchPlaceholder")}
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
                <TabsTrigger value="all" data-testid="tab-all">{t("admin.billsPage.tabAll")}</TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">{t("admin.billsPage.statusPending")}</TabsTrigger>
                <TabsTrigger value="paid" data-testid="tab-paid">{t("admin.billsPage.statusPaid")}</TabsTrigger>
                <TabsTrigger value="overdue" data-testid="tab-overdue">{t("admin.billsPage.statusOverdue")}</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {filteredBills.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.billsPage.noBills")}</p>
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
                          data-testid={`bill-${bill.bill_number}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{bill.bill_number}</span>
                                <Badge variant="outline">{statusConfig.label}</Badge>
                                <Badge variant="secondary">{getTypeLabel(bill.type)}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{bill.vendor}</span>
                                <span>{t("admin.billsPage.dueDate")}: {formatDate(bill.due_date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">RM {(bill.amount / 100).toLocaleString()}</span>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-${bill.bill_number}`}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="gap-1" data-testid={`button-download-${bill.bill_number}`}>
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" />
              新增账单
            </DialogTitle>
            <DialogDescription>创建新的账单记录</DialogDescription>
          </DialogHeader>
          <Form {...billForm}>
            <form onSubmit={billForm.handleSubmit((data) => createBillMutation.mutate(data))} className="space-y-4 py-4">
              <FormField control={billForm.control} name="billNumber" render={({ field }) => (
                <FormItem>
                  <FormLabel>账单编号</FormLabel>
                  <FormControl><Input {...field} readOnly className="bg-muted" data-testid="input-bill-number" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={billForm.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>类型</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bill-type">
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
                    <FormLabel>供应商</FormLabel>
                    <FormControl><Input {...field} placeholder="输入供应商名称" data-testid="input-bill-vendor" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={billForm.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>金额 (RM)</FormLabel>
                    <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-bill-amount" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={billForm.control} name="dueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>到期日</FormLabel>
                    <FormControl><Input {...field} type="date" data-testid="input-bill-due-date" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={billForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <FormControl><Input {...field} placeholder="分类（可选）" data-testid="input-bill-category" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={billForm.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl><Textarea {...field} placeholder="账单描述（可选）" data-testid="input-bill-desc" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={billForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl><Textarea {...field} placeholder="备注（可选）" data-testid="input-bill-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddBillModal(false)}>取消</Button>
                <Button type="submit" disabled={createBillMutation.isPending} data-testid="button-confirm-add-bill">
                  {createBillMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  创建
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
