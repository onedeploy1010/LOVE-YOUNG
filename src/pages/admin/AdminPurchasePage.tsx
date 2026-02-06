import { useState } from "react";
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
  ClipboardCheck, Search, Plus, Building2, Eye,
  Clock, CheckCircle, Truck, Package, Loader2, Trash2
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
  created_at: string;
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

export default function AdminPurchasePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("orders");
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showPoModal, setShowPoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

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

  // Update PO status mutation
  const updatePoStatusMutation = useMutation({
    mutationFn: async ({ id, status, receivedDate }: { id: string; status: string; receivedDate?: string }) => {
      const updateData: { status: string; received_date?: string } = { status };
      if (receivedDate) {
        updateData.received_date = receivedDate;
      }
      const { error } = await supabase
        .from("purchase_orders")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-purchase-orders"] });
      // Refresh selectedOrder from updated list
      if (selectedOrder) {
        const updated = orders.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
      toast({ title: "状态已更新" });
    },
    onError: (error) => {
      toast({ title: "更新失败", description: String(error), variant: "destructive" });
    },
  });

  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const getNextStatus = (current: string): string | null => {
    const flow: Record<string, string> = {
      pending: "approved",
      approved: "shipped",
      shipped: "received",
    };
    return flow[current] || null;
  };

  const getNextStatusLabel = (current: string): string => {
    const labels: Record<string, string> = {
      pending: "批准",
      approved: "标记已发货",
      shipped: "确认收货",
    };
    return labels[current] || "";
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
      case "pending": return { label: t("admin.purchasePage.statusPending"), icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "approved": return { label: t("admin.purchasePage.statusApproved"), icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "shipped": return { label: t("admin.purchasePage.statusShipped"), icon: Truck, color: "text-primary", bg: "bg-primary/10" };
      case "received": return { label: t("admin.purchasePage.statusReceived"), icon: Package, color: "text-green-500", bg: "bg-green-500/10" };
      default: return { label: t("admin.purchasePage.statusUnknown"), icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const filteredOrders = orders.filter(order =>
    searchQuery === "" ||
    order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.supplier_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-purchase-title">{t("admin.purchasePage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.purchasePage.subtitle")}</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground" onClick={() => { poForm.reset({ supplierId: "", expectedDate: "", notes: "", items: [{ itemName: "", quantity: 1, unitPrice: 0 }] }); setShowPoModal(true); }} data-testid="button-new-po">
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
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`po-${order.order_number}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                              <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm">{order.order_number}</span>
                                <Badge variant="outline">{statusConfig.label}</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{order.supplier_name}</span>
                                <span>{formatDate(order.created_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-primary">RM {(order.total_amount / 100).toLocaleString()}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              onClick={() => handleViewDetails(order)}
                              data-testid={`button-view-${order.order_number}`}
                            >
                              <Eye className="w-4 h-4" />
                              {t("admin.purchasePage.viewDetails")}
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
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    {t("admin.purchasePage.supplierList")}
                  </CardTitle>
                  <Button variant="outline" className="gap-2" onClick={() => { supplierForm.reset(); setShowSupplierModal(true); }} data-testid="button-add-supplier">
                    <Plus className="w-4 h-4" />
                    {t("admin.purchasePage.addSupplier")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                              {supplier.contact_person || "-"} · {supplier.phone || "-"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline">{supplier.total_orders ?? 0} {t("admin.purchasePage.orders")}</Badge>
                          <Button variant="outline" size="sm" data-testid={`button-edit-${supplier.id}`}>
                            {t("admin.purchasePage.edit")}
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
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              新增供应商
            </DialogTitle>
            <DialogDescription>添加新的供应商信息</DialogDescription>
          </DialogHeader>
          <Form {...supplierForm}>
            <form onSubmit={supplierForm.handleSubmit((data) => createSupplierMutation.mutate(data))} className="space-y-4 py-4">
              <FormField control={supplierForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>名称 *</FormLabel>
                  <FormControl><Input {...field} placeholder="供应商名称" data-testid="input-supplier-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={supplierForm.control} name="contactPerson" render={({ field }) => (
                  <FormItem>
                    <FormLabel>联系人</FormLabel>
                    <FormControl><Input {...field} placeholder="联系人姓名" data-testid="input-supplier-contact" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={supplierForm.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>电话</FormLabel>
                    <FormControl><Input {...field} placeholder="电话号码" data-testid="input-supplier-phone" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={supplierForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="邮箱地址" data-testid="input-supplier-email" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={supplierForm.control} name="address" render={({ field }) => (
                <FormItem>
                  <FormLabel>地址</FormLabel>
                  <FormControl><Input {...field} placeholder="供应商地址" data-testid="input-supplier-address" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={supplierForm.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>分类</FormLabel>
                  <FormControl><Input {...field} placeholder="分类（可选）" data-testid="input-supplier-category" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={supplierForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl><Textarea {...field} placeholder="备注（可选）" data-testid="input-supplier-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSupplierModal(false)}>取消</Button>
                <Button type="submit" disabled={createSupplierMutation.isPending} data-testid="button-confirm-supplier">
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
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              新增采购单
            </DialogTitle>
            <DialogDescription>创建新的采购订单</DialogDescription>
          </DialogHeader>
          <Form {...poForm}>
            <form onSubmit={poForm.handleSubmit((data) => createPoMutation.mutate(data))} className="space-y-4 py-4">
              <FormField control={poForm.control} name="supplierId" render={({ field }) => (
                <FormItem>
                  <FormLabel>供应商 *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-po-supplier">
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
                  <FormLabel>物品清单 *</FormLabel>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPoItem({ itemName: "", quantity: 1, unitPrice: 0 })}>
                    <Plus className="w-4 h-4 mr-1" /> 添加物品
                  </Button>
                </div>
                <div className="space-y-3">
                  {poItems.map((item, index) => (
                    <div key={item.id} className="flex items-end gap-2 p-3 border rounded-lg">
                      <FormField control={poForm.control} name={`items.${index}.itemName`} render={({ field }) => (
                        <FormItem className="flex-1">
                          {index === 0 && <FormLabel>物品名</FormLabel>}
                          <FormControl><Input {...field} placeholder="物品名称" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={poForm.control} name={`items.${index}.quantity`} render={({ field }) => (
                        <FormItem className="w-24">
                          {index === 0 && <FormLabel>数量</FormLabel>}
                          <FormControl><Input {...field} type="number" min={1} placeholder="1" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={poForm.control} name={`items.${index}.unitPrice`} render={({ field }) => (
                        <FormItem className="w-28">
                          {index === 0 && <FormLabel>单价(RM)</FormLabel>}
                          <FormControl><Input {...field} type="number" step="0.01" placeholder="0.00" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      {poItems.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePoItem(index)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-right mt-2 font-bold text-primary">
                  合计: RM {poTotal.toFixed(2)}
                </div>
              </div>

              <FormField control={poForm.control} name="expectedDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>预计到货日</FormLabel>
                  <FormControl><Input {...field} type="date" data-testid="input-po-expected-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={poForm.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl><Textarea {...field} placeholder="备注（可选）" data-testid="input-po-notes" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPoModal(false)}>取消</Button>
                <Button type="submit" disabled={createPoMutation.isPending} data-testid="button-confirm-po">
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
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-primary" />
              采购单详情
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Status & Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">供应商</p>
                  <p className="font-medium">{selectedOrder.supplier_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  <Badge className={getStatusConfig(selectedOrder.status).bg}>
                    {getStatusConfig(selectedOrder.status).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">创建日期</p>
                  <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">预计到货</p>
                  <p className="font-medium">{selectedOrder.expected_date ? formatDate(selectedOrder.expected_date) : "-"}</p>
                </div>
                {selectedOrder.received_date && (
                  <div>
                    <p className="text-sm text-muted-foreground">实际收货</p>
                    <p className="font-medium">{formatDate(selectedOrder.received_date)}</p>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">物品清单</p>
                <div className="border rounded-lg divide-y">
                  {Array.isArray(selectedOrder.items) && (selectedOrder.items as Array<{ name: string; quantity: number; unit_price: number; total: number }>).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          数量: {item.quantity} × RM {(item.unit_price / 100).toFixed(2)}
                        </p>
                      </div>
                      <p className="font-bold">RM {(item.total / 100).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                  <span className="font-medium">总计</span>
                  <span className="text-xl font-bold text-primary">
                    RM {(selectedOrder.total_amount / 100).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">备注</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Actions */}
              {getNextStatus(selectedOrder.status) && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    关闭
                  </Button>
                  <Button
                    onClick={() => {
                      const nextStatus = getNextStatus(selectedOrder.status);
                      if (nextStatus) {
                        const receivedDate = nextStatus === "received" ? new Date().toISOString() : undefined;
                        updatePoStatusMutation.mutate({
                          id: selectedOrder.id,
                          status: nextStatus,
                          receivedDate,
                        });
                        // Update local state immediately for UI feedback
                        setSelectedOrder({ ...selectedOrder, status: nextStatus, received_date: receivedDate || selectedOrder.received_date });
                      }
                    }}
                    disabled={updatePoStatusMutation.isPending}
                    data-testid="button-update-po-status"
                  >
                    {updatePoStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {getNextStatusLabel(selectedOrder.status)}
                  </Button>
                </div>
              )}

              {selectedOrder.status === "received" && (
                <div className="flex justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    关闭
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
