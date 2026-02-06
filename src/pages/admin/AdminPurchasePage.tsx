import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
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
import { useAuth } from "@/contexts/AuthContext";
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
  ClipboardCheck, Search, Plus, Building2, Eye,
  Clock, CheckCircle, Truck, Package, Loader2, Trash2,
  FileText, Upload, CreditCard, Receipt, User, Calendar,
  DollarSign, ExternalLink, AlertCircle
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const supplierFormSchema = z.object({
  name: z.string().min(1, "请输入供应商名称"),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

const poFormSchema = z.object({
  supplierId: z.string().min(1, "请选择供应商"),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemName: z.string().min(1, "请输入物品名"),
    quantity: z.coerce.number().min(1, "数量至少为1"),
    unitPrice: z.coerce.number().min(0.01, "单价必须大于0"),
  })).min(1, "至少添加一项物品"),
});

type PoFormValues = z.infer<typeof poFormSchema>;

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_id: string | null;
  supplier_name: string;
  total_amount: number;
  status: string;
  items: unknown;
  expected_date: string | null;
  received_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Approval fields
  approved_by: string | null;
  approved_at: string | null;
  // Invoice fields
  invoice_number: string | null;
  invoice_url: string | null;
  invoice_amount: number | null;
  // Bank payment fields
  bank_status: string | null;
  bank_maker_id: string | null;
  bank_maker_at: string | null;
  bank_approver_id: string | null;
  bank_approver_at: string | null;
  bank_reference: string | null;
  // Receipt fields
  receipt_url: string | null;
  paid_at: string | null;
  // Bill link
  bill_id: string | null;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  total_orders: number | null;
  category: string | null;
  created_at: string;
}

interface MemberInfo {
  id: string;
  name: string;
}

export default function AdminPurchasePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { member } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [detailsTab, setDetailsTab] = useState("info");

  // File upload refs
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // Invoice form state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");

  const supplierForm = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: { name: "", contactPerson: "", phone: "", email: "", address: "", category: "", notes: "" },
  });

  const poForm = useForm<PoFormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues: { supplierId: "", expectedDate: "", notes: "", items: [{ itemName: "", quantity: 1, unitPrice: 0 }] },
  });

  const { fields: poItems, append: addPoItem, remove: removePoItem } = useFieldArray({
    control: poForm.control,
    name: "items",
  });

  const generatePoNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `PO-${datePart}-${rand}`;
  };

  const generateBillNumber = () => {
    const now = new Date();
    const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `BILL-${datePart}-${rand}`;
  };

  // Fetch member names for display
  const { data: memberNames = {} } = useQuery({
    queryKey: ["member-names"],
    queryFn: async () => {
      const { data } = await supabase.from("members").select("id, name");
      const map: Record<string, string> = {};
      (data || []).forEach((m: MemberInfo) => { map[m.id] = m.name; });
      return map;
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: async (data: SupplierFormValues) => {
      const { error } = await supabase.from("suppliers").insert({
        name: data.name,
        contact_person: data.contactPerson || null,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        category: data.category || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      setShowSupplierModal(false);
      supplierForm.reset();
      toast({ title: "供应商已创建" });
    },
    onError: (error) => {
      toast({ title: "创建失败", description: String(error), variant: "destructive" });
    },
  });

  const createPoMutation = useMutation({
    mutationFn: async (data: PoFormValues) => {
      const supplier = suppliers.find(s => s.id === data.supplierId);
      const itemsJson = data.items.map(item => ({
        name: item.itemName,
        quantity: item.quantity,
        unit_price: Math.round(item.unitPrice * 100),
        total: Math.round(item.quantity * item.unitPrice * 100),
      }));
      const totalAmount = itemsJson.reduce((sum, i) => sum + i.total, 0);

      const { error } = await supabase.from("purchase_orders").insert({
        order_number: generatePoNumber(),
        supplier_id: data.supplierId,
        supplier_name: supplier?.name || "",
        items: itemsJson,
        total_amount: totalAmount,
        status: "pending",
        expected_date: data.expectedDate || null,
        notes: data.notes || null,
        created_by: member?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchase-orders"] });
      setShowPoModal(false);
      poForm.reset();
      toast({ title: "采购单已创建" });
    },
    onError: (error) => {
      toast({ title: "创建失败", description: String(error), variant: "destructive" });
    },
  });

  const watchedPoItems = poForm.watch("items");
  const poTotal = (watchedPoItems || []).reduce((sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0), 0);

  // Generic update mutation
  const updatePoMutation = useMutation({
    mutationFn: async (updateData: Partial<PurchaseOrder> & { id: string }) => {
      const { id, ...data } = updateData;
      const { error } = await supabase
        .from("purchase_orders")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchase-orders"] });
      toast({ title: "更新成功" });
    },
    onError: (error) => {
      toast({ title: "更新失败", description: String(error), variant: "destructive" });
    },
  });

  // Approve PO
  const handleApprove = () => {
    if (!selectedOrder || !member?.id) return;
    updatePoMutation.mutate({
      id: selectedOrder.id,
      status: "approved",
      approved_by: member.id,
      approved_at: new Date().toISOString(),
    });
    setSelectedOrder({
      ...selectedOrder,
      status: "approved",
      approved_by: member.id,
      approved_at: new Date().toISOString(),
    });
  };

  // Save invoice info
  const handleSaveInvoice = () => {
    if (!selectedOrder) return;
    const amount = invoiceAmount ? Math.round(parseFloat(invoiceAmount) * 100) : null;
    updatePoMutation.mutate({
      id: selectedOrder.id,
      invoice_number: invoiceNumber || null,
      invoice_amount: amount,
    });
    setSelectedOrder({
      ...selectedOrder,
      invoice_number: invoiceNumber || null,
      invoice_amount: amount,
    });
  };

  // Upload invoice file
  const handleInvoiceUpload = async (file: File) => {
    if (!selectedOrder) return;
    setUploadingInvoice(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `invoices/${selectedOrder.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("purchase-docs")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("purchase-docs")
        .getPublicUrl(path);

      await updatePoMutation.mutateAsync({
        id: selectedOrder.id,
        invoice_url: publicUrl,
      });
      setSelectedOrder({ ...selectedOrder, invoice_url: publicUrl });
      toast({ title: "发票已上传" });
    } catch (error) {
      toast({ title: "上传失败", description: String(error), variant: "destructive" });
    } finally {
      setUploadingInvoice(false);
    }
  };

  // Bank workflow: Maker done
  const handleBankMakerDone = () => {
    if (!selectedOrder || !member?.id) return;
    updatePoMutation.mutate({
      id: selectedOrder.id,
      bank_status: "maker_done",
      bank_maker_id: member.id,
      bank_maker_at: new Date().toISOString(),
    });
    setSelectedOrder({
      ...selectedOrder,
      bank_status: "maker_done",
      bank_maker_id: member.id,
      bank_maker_at: new Date().toISOString(),
    });
  };

  // Bank workflow: Approver done
  const handleBankApproverDone = () => {
    if (!selectedOrder || !member?.id) return;
    updatePoMutation.mutate({
      id: selectedOrder.id,
      bank_status: "approver_done",
      bank_approver_id: member.id,
      bank_approver_at: new Date().toISOString(),
    });
    setSelectedOrder({
      ...selectedOrder,
      bank_status: "approver_done",
      bank_approver_id: member.id,
      bank_approver_at: new Date().toISOString(),
    });
  };

  // Upload receipt and mark as paid
  const handleReceiptUpload = async (file: File) => {
    if (!selectedOrder) return;
    setUploadingReceipt(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `receipts/${selectedOrder.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("purchase-docs")
        .upload(path, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("purchase-docs")
        .getPublicUrl(path);

      // Create bill record
      const billNumber = generateBillNumber();
      const { data: billData, error: billError } = await supabase
        .from("bills")
        .insert({
          bill_number: billNumber,
          type: "purchase",
          category: "采购",
          amount: selectedOrder.invoice_amount || selectedOrder.total_amount,
          description: `采购单 ${selectedOrder.order_number} - ${selectedOrder.supplier_name}`,
          status: "paid",
          paid_date: new Date().toISOString(),
          vendor: selectedOrder.supplier_name,
          reference_type: "purchase_order",
          reference_id: selectedOrder.id,
          created_by: member?.id,
        })
        .select("id")
        .single();

      if (billError) throw billError;

      // Update PO with receipt and bill link
      await updatePoMutation.mutateAsync({
        id: selectedOrder.id,
        receipt_url: publicUrl,
        paid_at: new Date().toISOString(),
        bank_status: "paid",
        bill_id: billData.id,
        status: "received", // Mark order as complete
      });

      setSelectedOrder({
        ...selectedOrder,
        receipt_url: publicUrl,
        paid_at: new Date().toISOString(),
        bank_status: "paid",
        bill_id: billData.id,
        status: "received",
      });

      toast({ title: "付款凭证已上传，账单已生成" });
    } catch (error) {
      toast({ title: "上传失败", description: String(error), variant: "destructive" });
    } finally {
      setUploadingReceipt(false);
    }
  };

  // Mark as shipped
  const handleMarkShipped = () => {
    if (!selectedOrder) return;
    updatePoMutation.mutate({
      id: selectedOrder.id,
      status: "shipped",
    });
    setSelectedOrder({ ...selectedOrder, status: "shipped" });
  };

  // Mark as received
  const handleMarkReceived = () => {
    if (!selectedOrder) return;
    updatePoMutation.mutate({
      id: selectedOrder.id,
      status: "received",
      received_date: new Date().toISOString(),
    });
    setSelectedOrder({
      ...selectedOrder,
      status: "received",
      received_date: new Date().toISOString(),
    });
  };

  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setInvoiceNumber(order.invoice_number || "");
    setInvoiceAmount(order.invoice_amount ? (order.invoice_amount / 100).toString() : "");
    setDetailsTab("info");
    setShowDetailsModal(true);
  };

  // Fetch purchase orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["admin-purchase-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchase_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching purchase orders:", error);
        return [];
      }

      return (data || []) as PurchaseOrder[];
    },
  });

  // Fetch suppliers
  const { data: suppliers = [], isLoading: loadingSuppliers } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching suppliers:", error);
        return [];
      }

      return (data || []) as Supplier[];
    },
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "pending": return { label: "待批准", icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "approved": return { label: "已批准", icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "shipped": return { label: "已发货", icon: Truck, color: "text-primary", bg: "bg-primary/10" };
      case "received": return { label: "已完成", icon: Package, color: "text-green-500", bg: "bg-green-500/10" };
      default: return { label: "未知", icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const getBankStatusConfig = (status: string | null) => {
    switch (status) {
      case "pending": return { label: "待处理", color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "maker_done": return { label: "Maker已处理", color: "text-blue-500", bg: "bg-blue-500/10" };
      case "approver_done": return { label: "Approver已批准", color: "text-primary", bg: "bg-primary/10" };
      case "paid": return { label: "已付款", color: "text-green-500", bg: "bg-green-500/10" };
      case "failed": return { label: "失败", color: "text-red-500", bg: "bg-red-500/10" };
      default: return { label: "未开始", color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const filteredOrders = orders.filter(order =>
    searchQuery === "" ||
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const isLoading = loadingOrders || loadingSuppliers;

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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-purchase-title">{t("admin.purchasePage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.purchasePage.subtitle")}</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground w-full sm:w-auto" onClick={() => { poForm.reset({ supplierId: "", expectedDate: "", notes: "", items: [{ itemName: "", quantity: 1, unitPrice: 0 }] }); setShowPoModal(true); }} data-testid="button-new-po">
            <Plus className="w-4 h-4" />
            {t("admin.purchasePage.newPo")}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" data-testid="tab-orders">{t("admin.purchasePage.purchaseOrders")}</TabsTrigger>
            <TabsTrigger value="suppliers" data-testid="tab-suppliers">{t("admin.purchasePage.suppliers")}</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                    {t("admin.purchasePage.purchaseOrders")} ({orders.length})
                  </CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.purchasePage.searchPlaceholder")}
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无采购订单</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      const bankConfig = getBankStatusConfig(order.bank_status);
                      return (
                        <div
                          key={order.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                          data-testid={`po-${order.order_number}`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${statusConfig.bg}`}>
                              <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfig.color}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-mono text-xs sm:text-sm">{order.order_number}</span>
                                <Badge variant="outline" className="text-xs">{statusConfig.label}</Badge>
                                {order.bank_status && order.bank_status !== "pending" && (
                                  <Badge className={`${bankConfig.bg} ${bankConfig.color} text-xs`}>
                                    {bankConfig.label}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <span className="truncate">{order.supplier_name}</span>
                                <span className="shrink-0">{formatDate(order.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-12 sm:pl-0">
                            <span className="font-bold text-primary text-sm sm:text-base">RM {(order.total_amount / 100).toLocaleString()}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-8"
                              onClick={() => handleViewDetails(order)}
                              data-testid={`button-view-${order.order_number}`}
                            >
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">详情</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="mt-4">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    {t("admin.purchasePage.supplierList")}
                  </CardTitle>
                  <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => { supplierForm.reset(); setShowSupplierModal(true); }} data-testid="button-add-supplier">
                    <Plus className="w-4 h-4" />
                    {t("admin.purchasePage.addSupplier")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {suppliers.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无供应商</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suppliers.map((supplier) => (
                      <div
                        key={supplier.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3"
                        data-testid={`supplier-${supplier.id}`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{supplier.name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {supplier.contact_person || "-"} · {supplier.phone || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 sm:gap-4 pl-12 sm:pl-0">
                          <Badge variant="outline" className="text-xs">{supplier.total_orders ?? 0} 单</Badge>
                          <Button variant="outline" size="sm" className="h-8" data-testid={`button-edit-${supplier.id}`}>
                            编辑
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Supplier Modal */}
      <Dialog open={showSupplierModal} onOpenChange={setShowSupplierModal}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              新增供应商
            </DialogTitle>
            <DialogDescription className="text-sm">添加新的供应商信息</DialogDescription>
          </DialogHeader>
          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit((data) => createSupplierMutation.mutate(data))} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <FormField control={supplierForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">名称 *</FormLabel>
                  <FormControl><Input {...field} placeholder="供应商名称" className="h-9 sm:h-10" data-testid="input-supplier-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <FormField control={supplierForm.control} name="contactPerson" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">联系人</FormLabel>
                    <FormControl><Input {...field} placeholder="联系人姓名" className="h-9 sm:h-10" data-testid="input-supplier-contact" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={supplierForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm">电话</FormLabel>
                    <FormControl><Input {...field} placeholder="电话号码" className="h-9 sm:h-10" data-testid="input-supplier-phone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={supplierForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">邮箱</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="邮箱地址" className="h-9 sm:h-10" data-testid="input-supplier-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={supplierForm.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">地址</FormLabel>
                  <FormControl><Input {...field} placeholder="供应商地址" className="h-9 sm:h-10" data-testid="input-supplier-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={supplierForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">分类</FormLabel>
                  <FormControl><Input {...field} placeholder="分类（可选）" className="h-9 sm:h-10" data-testid="input-supplier-category" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={supplierForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">备注</FormLabel>
                  <FormControl><Textarea {...field} placeholder="备注（可选）" className="min-h-[80px]" data-testid="input-supplier-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowSupplierModal(false)} className="w-full sm:w-auto">取消</Button>
                <Button type="submit" disabled={createSupplierMutation.isPending} className="w-full sm:w-auto" data-testid="button-confirm-supplier">
                  {createSupplierMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  创建
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* New Purchase Order Modal */}
      <Dialog open={showPoModal} onOpenChange={setShowPoModal}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              新增采购单
            </DialogTitle>
            <DialogDescription className="text-sm">创建新的采购订单</DialogDescription>
          </DialogHeader>
          <Form {...poForm}>
            <form onSubmit={poForm.handleSubmit((data) => createPoMutation.mutate(data))} className="space-y-3 sm:space-y-4 py-2 sm:py-4">
              <FormField control={poForm.control} name="supplierId" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">供应商 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-9 sm:h-10" data-testid="select-po-supplier">
                        <SelectValue placeholder="选择供应商" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <FormLabel className="text-sm">物品清单 *</FormLabel>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-xs sm:text-sm" onClick={() => addPoItem({ itemName: "", quantity: 1, unitPrice: 0 })}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> 添加
                  </Button>
                </div>
                <div className="space-y-3">
                  {poItems.map((item, index) => (
                    <div key={item.id} className="p-2.5 sm:p-3 border rounded-lg space-y-2 sm:space-y-0">
                      {/* Mobile: stacked layout, Desktop: row layout */}
                      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                        <FormField control={poForm.control} name={`items.${index}.itemName`} render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs sm:text-sm">{index === 0 ? "物品名" : <span className="sm:hidden">物品名</span>}</FormLabel>
                            <FormControl><Input {...field} placeholder="物品名称" className="h-9 sm:h-10" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <div className="flex gap-2">
                          <FormField control={poForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                            <FormItem className="w-20 sm:w-24">
                              <FormLabel className="text-xs sm:text-sm">{index === 0 ? "数量" : <span className="sm:hidden">数量</span>}</FormLabel>
                              <FormControl><Input {...field} type="number" min={1} placeholder="1" className="h-9 sm:h-10" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          <FormField control={poForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                            <FormItem className="w-24 sm:w-28">
                              <FormLabel className="text-xs sm:text-sm">{index === 0 ? "单价(RM)" : <span className="sm:hidden">单价</span>}</FormLabel>
                              <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" className="h-9 sm:h-10" /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )} />
                          {poItems.length > 1 && (
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 mt-auto shrink-0" onClick={() => removePoItem(index)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2 font-bold text-primary text-sm sm:text-base">
                  合计: RM {poTotal.toFixed(2)}
                </div>
              </div>

              <FormField control={poForm.control} name="expectedDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">预计到货日</FormLabel>
                  <FormControl><Input {...field} type="date" className="h-9 sm:h-10" data-testid="input-po-expected-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={poForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm">备注</FormLabel>
                  <FormControl><Textarea {...field} placeholder="备注（可选）" className="min-h-[80px]" data-testid="input-po-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowPoModal(false)} className="w-full sm:w-auto">取消</Button>
                <Button type="submit" disabled={createPoMutation.isPending} className="w-full sm:w-auto" data-testid="button-confirm-po">
                  {createPoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  创建采购单
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Purchase Order Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="w-[95vw] max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ClipboardCheck className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="truncate">采购单 - {selectedOrder?.order_number}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <Tabs value={detailsTab} onValueChange={setDetailsTab} className="mt-2 sm:mt-4">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1">
                <TabsTrigger value="info" className="flex flex-col sm:flex-row gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1 sm:px-3 py-1.5 sm:py-2">
                  <FileText className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">基本信息</span>
                  <span className="sm:hidden">信息</span>
                </TabsTrigger>
                <TabsTrigger value="invoice" className="flex flex-col sm:flex-row gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1 sm:px-3 py-1.5 sm:py-2">
                  <Receipt className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">发票/账单</span>
                  <span className="sm:hidden">发票</span>
                </TabsTrigger>
                <TabsTrigger value="payment" className="flex flex-col sm:flex-row gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1 sm:px-3 py-1.5 sm:py-2">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">付款流程</span>
                  <span className="sm:hidden">付款</span>
                </TabsTrigger>
                <TabsTrigger value="receipt" className="flex flex-col sm:flex-row gap-0.5 sm:gap-1 text-[10px] sm:text-xs px-1 sm:px-3 py-1.5 sm:py-2">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">付款凭证</span>
                  <span className="sm:hidden">凭证</span>
                </TabsTrigger>
              </TabsList>

              {/* Info Tab */}
              <TabsContent value="info" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">供应商</p>
                    <p className="font-medium text-sm sm:text-base truncate">{selectedOrder.supplier_name}</p>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">订单状态</p>
                    <Badge className={`${getStatusConfig(selectedOrder.status).bg} text-xs`}>
                      {getStatusConfig(selectedOrder.status).label}
                    </Badge>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 采购人
                    </p>
                    <p className="font-medium text-sm sm:text-base truncate">{selectedOrder.created_by ? (memberNames[selectedOrder.created_by] || selectedOrder.created_by) : "-"}</p>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 创建日期
                    </p>
                    <p className="font-medium text-sm sm:text-base">{formatDateTime(selectedOrder.created_at)}</p>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 批准人
                    </p>
                    <p className="font-medium text-sm sm:text-base truncate">{selectedOrder.approved_by ? (memberNames[selectedOrder.approved_by] || selectedOrder.approved_by) : "-"}</p>
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">批准时间</p>
                    <p className="font-medium text-sm sm:text-base">{formatDateTime(selectedOrder.approved_at)}</p>
                  </div>
                </div>

                <Separator />

                {/* Items List */}
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">物品清单</p>
                  <div className="border rounded-lg divide-y">
                    {Array.isArray(selectedOrder.items) && (selectedOrder.items as Array<{ name: string; quantity: number; unit_price: number; total: number }>).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{item.name}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {item.quantity} × RM {(item.unit_price / 100).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold text-sm sm:text-base shrink-0">RM {(item.total / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2 sm:mt-3 pt-2 sm:pt-3 border-t">
                    <span className="font-medium text-sm sm:text-base">订单总计</span>
                    <span className="text-lg sm:text-xl font-bold text-primary">
                      RM {(selectedOrder.total_amount / 100).toLocaleString()}
                    </span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-1">备注</p>
                      <p className="text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}

                {/* Approve button */}
                {selectedOrder.status === "pending" && (
                  <div className="flex justify-end pt-2 sm:pt-4">
                    <Button onClick={handleApprove} disabled={updatePoMutation.isPending} className="w-full sm:w-auto">
                      {updatePoMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <CheckCircle className="w-4 h-4 mr-2" />
                      批准采购单
                    </Button>
                  </div>
                )}

                {/* Shipping buttons */}
                {selectedOrder.status === "approved" && (
                  <div className="flex justify-end gap-2 pt-2 sm:pt-4">
                    <Button variant="outline" onClick={handleMarkShipped} disabled={updatePoMutation.isPending} className="w-full sm:w-auto">
                      <Truck className="w-4 h-4 mr-2" />
                      标记已发货
                    </Button>
                  </div>
                )}

                {selectedOrder.status === "shipped" && (
                  <div className="flex justify-end gap-2 pt-2 sm:pt-4">
                    <Button onClick={handleMarkReceived} disabled={updatePoMutation.isPending} className="w-full sm:w-auto">
                      <Package className="w-4 h-4 mr-2" />
                      确认收货
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Invoice Tab */}
              <TabsContent value="invoice" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <div className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                    <Receipt className="w-4 h-4 text-primary" />
                    发票信息
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm text-muted-foreground">发票号码</label>
                      <Input
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="输入发票号码"
                        className="h-9 sm:h-10"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm text-muted-foreground">发票金额 (RM)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={invoiceAmount}
                        onChange={(e) => setInvoiceAmount(e.target.value)}
                        placeholder="0.00"
                        className="h-9 sm:h-10"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSaveInvoice} disabled={updatePoMutation.isPending} className="w-full sm:w-auto">
                      保存发票信息
                    </Button>
                  </div>
                </div>

                <div className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                    <Upload className="w-4 h-4 text-primary" />
                    上传发票文件
                  </h4>

                  <input
                    type="file"
                    ref={invoiceInputRef}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleInvoiceUpload(file);
                    }}
                  />

                  {selectedOrder.invoice_url ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-500/10 rounded-lg">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                        <span className="text-sm truncate">发票已上传</span>
                      </div>
                      <div className="flex gap-2 pl-7 sm:pl-0">
                        <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none" asChild>
                          <a href={selectedOrder.invoice_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            查看
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 flex-1 sm:flex-none" onClick={() => invoiceInputRef.current?.click()}>
                          重新上传
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => invoiceInputRef.current?.click()}
                      disabled={uploadingInvoice}
                      className="w-full sm:w-auto"
                    >
                      {uploadingInvoice ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      上传发票 (PDF/图片)
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* Payment Tab */}
              <TabsContent value="payment" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <div className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                      <CreditCard className="w-4 h-4 text-primary" />
                      银行付款流程
                    </h4>
                    <Badge className={`${getBankStatusConfig(selectedOrder.bank_status).bg} text-xs`}>
                      {getBankStatusConfig(selectedOrder.bank_status).label}
                    </Badge>
                  </div>

                  {/* Workflow steps */}
                  <div className="space-y-2 sm:space-y-3">
                    {/* Step 1: Maker */}
                    <div className={`p-2.5 sm:p-3 rounded-lg border ${selectedOrder.bank_maker_id ? "bg-green-500/5 border-green-500/20" : "bg-muted/50"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm ${selectedOrder.bank_maker_id ? "bg-green-500 text-white" : "bg-muted-foreground/20"}`}>
                            1
                          </div>
                          <span className="font-medium text-sm sm:text-base">Maker 制单</span>
                        </div>
                        {selectedOrder.bank_maker_id ? (
                          <div className="text-xs sm:text-sm text-muted-foreground pl-7 sm:pl-0">
                            {memberNames[selectedOrder.bank_maker_id] || selectedOrder.bank_maker_id} · {formatDateTime(selectedOrder.bank_maker_at)}
                          </div>
                        ) : (
                          selectedOrder.status === "approved" && !selectedOrder.bank_maker_id && (
                            <Button size="sm" onClick={handleBankMakerDone} disabled={updatePoMutation.isPending} className="h-8 ml-7 sm:ml-0 w-fit">
                              确认完成
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Step 2: Approver */}
                    <div className={`p-2.5 sm:p-3 rounded-lg border ${selectedOrder.bank_approver_id ? "bg-green-500/5 border-green-500/20" : "bg-muted/50"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm ${selectedOrder.bank_approver_id ? "bg-green-500 text-white" : "bg-muted-foreground/20"}`}>
                            2
                          </div>
                          <span className="font-medium text-sm sm:text-base">Approver 审批</span>
                        </div>
                        {selectedOrder.bank_approver_id ? (
                          <div className="text-xs sm:text-sm text-muted-foreground pl-7 sm:pl-0">
                            {memberNames[selectedOrder.bank_approver_id] || selectedOrder.bank_approver_id} · {formatDateTime(selectedOrder.bank_approver_at)}
                          </div>
                        ) : (
                          selectedOrder.bank_status === "maker_done" && (
                            <Button size="sm" onClick={handleBankApproverDone} disabled={updatePoMutation.isPending} className="h-8 ml-7 sm:ml-0 w-fit">
                              确认批准
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Step 3: Payment */}
                    <div className={`p-2.5 sm:p-3 rounded-lg border ${selectedOrder.bank_status === "paid" ? "bg-green-500/5 border-green-500/20" : "bg-muted/50"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm ${selectedOrder.bank_status === "paid" ? "bg-green-500 text-white" : "bg-muted-foreground/20"}`}>
                            3
                          </div>
                          <span className="font-medium text-sm sm:text-base">付款完成</span>
                        </div>
                        {selectedOrder.paid_at && (
                          <div className="text-xs sm:text-sm text-muted-foreground pl-7 sm:pl-0">
                            {formatDateTime(selectedOrder.paid_at)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedOrder.bank_status === "approver_done" && !selectedOrder.receipt_url && (
                    <div className="p-2.5 sm:p-3 bg-yellow-500/10 rounded-lg flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                      <p className="text-xs sm:text-sm">银行已批准，请在"付款凭证"页上传 Receipt 完成付款流程</p>
                    </div>
                  )}
                </div>

                {/* Payment summary */}
                <div className="p-3 sm:p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">付款摘要</h4>
                  <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">订单金额</span>
                      <span>RM {(selectedOrder.total_amount / 100).toFixed(2)}</span>
                    </div>
                    {selectedOrder.invoice_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">发票金额</span>
                        <span>RM {(selectedOrder.invoice_amount / 100).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between font-bold text-sm sm:text-base">
                      <span>应付金额</span>
                      <span className="text-primary">
                        RM {((selectedOrder.invoice_amount || selectedOrder.total_amount) / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Receipt Tab */}
              <TabsContent value="receipt" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                <div className="p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm sm:text-base">
                    <DollarSign className="w-4 h-4 text-primary" />
                    付款凭证 (Receipt)
                  </h4>

                  <input
                    type="file"
                    ref={receiptInputRef}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleReceiptUpload(file);
                    }}
                  />

                  {selectedOrder.receipt_url ? (
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-500/10 rounded-lg">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                          <span className="text-sm truncate">付款凭证已上传</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 w-full sm:w-auto" asChild>
                          <a href={selectedOrder.receipt_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-1" />
                            查看
                          </a>
                        </Button>
                      </div>

                      {selectedOrder.paid_at && (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          付款时间: {formatDateTime(selectedOrder.paid_at)}
                        </div>
                      )}

                      {selectedOrder.bill_id && (
                        <div className="p-2.5 sm:p-3 bg-primary/5 rounded-lg">
                          <p className="text-xs sm:text-sm">
                            <span className="text-muted-foreground">已生成账单记录，账单ID: </span>
                            <span className="font-mono text-xs break-all">{selectedOrder.bill_id}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {selectedOrder.bank_status === "approver_done" ? (
                        <div className="space-y-2 sm:space-y-3">
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            银行已批准付款，请上传付款凭证完成流程。上传后将自动：
                          </p>
                          <ul className="text-xs sm:text-sm text-muted-foreground list-disc list-inside space-y-0.5 sm:space-y-1">
                            <li>标记订单为已付款</li>
                            <li>生成账单记录用于财务分类</li>
                            <li>完成采购流程</li>
                          </ul>
                          <Button
                            onClick={() => receiptInputRef.current?.click()}
                            disabled={uploadingReceipt}
                            className="w-full sm:w-auto"
                          >
                            {uploadingReceipt ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4 mr-2" />
                            )}
                            上传付款凭证
                          </Button>
                        </div>
                      ) : (
                        <div className="p-2.5 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm text-muted-foreground">
                          请先完成银行付款流程（Maker制单 → Approver审批）后再上传付款凭证
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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
