import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import {
  Factory, Search, Plus, PlayCircle, CheckCircle, Clock,
  AlertTriangle, Thermometer, Package, ClipboardCheck, Beaker, Loader2,
  Trash2, FileText, ArrowDownToLine
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

// ── Interfaces (matching DB column names) ───────────────

interface ProductionBatch {
  id: string;
  batch_number: string;
  product_id: string | null;
  product_name: string;
  planned_qty: number;
  actual_qty: number | null;
  status: string;
  current_step: number;
  total_steps: number;
  planned_date: string;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
}

interface ProductionMaterial {
  id: string;
  batch_id: string;
  material_name: string;
  inventory_item_id: string | null;
  planned_qty: number;
  actual_qty: number | null;
  wastage: number;
  unit: string;
  created_at: string;
}

interface SimpleProduct {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  unit: string;
}

interface BomEntry {
  id: string;
  product_id: string;
  inventory_item_id: string;
  quantity: number;
  unit: string;
  notes: string | null;
  inventory_items: { name: string; stock: number; unit: string } | null;
}

// ── Constants ───────────────────────────────────────────

const STATUS_FLOW = ["planned", "material_prep", "cleaning", "cooking", "cold_storage", "inspection", "completed"];

function generateBatchNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, "0");
  return `BATCH-${y}${m}${d}-${rand}`;
}

// ── Component ───────────────────────────────────────────

export default function AdminProductionPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("batches");

  // New Batch dialog
  const [showNewBatchDialog, setShowNewBatchDialog] = useState(false);
  const [nbProduct, setNbProduct] = useState("");
  const [nbQty, setNbQty] = useState("");
  const [nbDate, setNbDate] = useState("");
  const [nbNotes, setNbNotes] = useState("");

  // BOM tab
  const [bomProduct, setBomProduct] = useState("");
  const [showBomDialog, setShowBomDialog] = useState(false);
  const [bomItemId, setBomItemId] = useState("");
  const [bomQty, setBomQty] = useState("");
  const [bomUnit, setBomUnit] = useState("g");

  // ── Queries ─────────────────────────────────────────

  const { data: batches = [], isLoading: loadingBatches } = useQuery({
    queryKey: ["admin-production-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_batches")
        .select("*")
        .order("planned_date", { ascending: false });
      if (error) { console.error("Error fetching batches:", error); return []; }
      return (data || []) as ProductionBatch[];
    },
  });

  const { data: materials = [], isLoading: loadingMaterials } = useQuery({
    queryKey: ["admin-production-materials", selectedBatch],
    queryFn: async () => {
      let query = supabase.from("production_materials").select("*");
      if (selectedBatch) query = query.eq("batch_id", selectedBatch);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
      if (error) { console.error("Error fetching materials:", error); return []; }
      return (data || []) as ProductionMaterial[];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").order("name");
      return (data || []) as SimpleProduct[];
    },
  });

  const { data: inventoryItems = [] } = useQuery({
    queryKey: ["inventory-items-list"],
    queryFn: async () => {
      const { data } = await supabase.from("inventory_items").select("id, name, sku, stock, unit").order("name");
      return (data || []) as InventoryItem[];
    },
  });

  const { data: bomEntries = [] } = useQuery({
    queryKey: ["product-bom", bomProduct],
    enabled: !!bomProduct,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("product_bom")
          .select("*, inventory_items(name, stock, unit)")
          .eq("product_id", bomProduct);
        if (error) throw error;
        return (data || []) as BomEntry[];
      } catch {
        return [];
      }
    },
  });

  // ── Mutations ───────────────────────────────────────

  const createBatchMutation = useMutation({
    mutationFn: async () => {
      const product = products.find(p => p.id === nbProduct);
      if (!product) throw new Error("请选择产品");
      const qty = parseInt(nbQty);
      if (isNaN(qty) || qty < 1) throw new Error("计划数量至少为1");
      if (!nbDate) throw new Error("请选择计划日期");

      const batchNumber = generateBatchNumber();

      const { data: batch, error } = await supabase
        .from("production_batches")
        .insert({
          batch_number: batchNumber,
          product_id: nbProduct,
          product_name: product.name,
          planned_qty: qty,
          status: "planned",
          current_step: 0,
          total_steps: 5,
          planned_date: nbDate,
          notes: nbNotes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-generate production_materials from BOM
      try {
        const { data: bomData } = await supabase
          .from("product_bom")
          .select("*, inventory_items(name)")
          .eq("product_id", nbProduct);

        if (bomData && bomData.length > 0) {
          const mats = bomData.map((b: BomEntry & { inventory_items: { name: string } | null }) => ({
            batch_id: batch.id,
            material_name: b.inventory_items?.name || "Unknown",
            inventory_item_id: b.inventory_item_id,
            planned_qty: b.quantity * qty,
            unit: b.unit,
          }));
          await supabase.from("production_materials").insert(mats);
        }
      } catch {
        // product_bom table might not exist yet
      }

      return batch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-production-batches"] });
      setShowNewBatchDialog(false);
      setNbProduct(""); setNbQty(""); setNbDate(""); setNbNotes("");
      toast({ title: t("admin.operationSuccess") });
    },
    onError: (err: Error) => {
      toast({ title: t("admin.operationFailed"), description: err.message, variant: "destructive" });
    },
  });

  const advanceStatusMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const batch = batches.find(b => b.id === batchId);
      if (!batch) throw new Error("Batch not found");

      const idx = STATUS_FLOW.indexOf(batch.status);
      if (idx < 0 || idx >= STATUS_FLOW.length - 1) throw new Error("Cannot advance");

      const next = STATUS_FLOW[idx + 1];
      const updates: Record<string, unknown> = {
        status: next,
        current_step: idx + 1,
        updated_at: new Date().toISOString(),
      };

      if (next === "material_prep" && !batch.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (next === "completed") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("production_batches")
        .update(updates)
        .eq("id", batchId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-production-batches"] });
      toast({ title: t("admin.operationSuccess") });
    },
    onError: (err: Error) => {
      toast({ title: t("admin.operationFailed"), description: err.message, variant: "destructive" });
    },
  });

  const extractMaterialsMutation = useMutation({
    mutationFn: async (batchId: string) => {
      const batch = batches.find(b => b.id === batchId);

      const { data: mats, error: mErr } = await supabase
        .from("production_materials")
        .select("*")
        .eq("batch_id", batchId);

      if (mErr || !mats) throw new Error("无法获取原料列表");

      const linked = (mats as ProductionMaterial[]).filter(m => m.inventory_item_id);
      if (linked.length === 0) throw new Error("该批次没有关联库存的原料");

      // Check stock availability first
      for (const mat of linked) {
        const { data: item } = await supabase
          .from("inventory_items")
          .select("stock, name")
          .eq("id", mat.inventory_item_id!)
          .single();

        if (!item || item.stock < Math.round(mat.planned_qty)) {
          throw new Error(
            `${item?.name || mat.material_name} 库存不足 (需要 ${mat.planned_qty} ${mat.unit}, 现有 ${item?.stock ?? 0})`
          );
        }
      }

      // Deduct inventory
      for (const mat of linked) {
        const { data: item } = await supabase
          .from("inventory_items")
          .select("stock")
          .eq("id", mat.inventory_item_id!)
          .single();

        if (!item) continue;

        const deduct = Math.round(mat.planned_qty);

        await supabase
          .from("inventory_items")
          .update({ stock: Math.max(0, item.stock - deduct), updated_at: new Date().toISOString() })
          .eq("id", mat.inventory_item_id!);

        await supabase.from("inventory_ledger").insert({
          item_id: mat.inventory_item_id,
          type: "out",
          quantity: deduct,
          movement_type: "production",
          note: `生产批次 ${batch?.batch_number || batchId}`,
        });

        await supabase
          .from("production_materials")
          .update({ actual_qty: mat.planned_qty })
          .eq("id", mat.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-production-batches"] });
      queryClient.invalidateQueries({ queryKey: ["admin-production-materials"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-items-list"] });
      toast({ title: t("admin.operationSuccess"), description: t("admin.productionPage.materialsExtracted") });
    },
    onError: (err: Error) => {
      toast({ title: t("admin.operationFailed"), description: err.message, variant: "destructive" });
    },
  });

  const addBomMutation = useMutation({
    mutationFn: async () => {
      if (!bomProduct) throw new Error("请选择产品");
      if (!bomItemId) throw new Error("请选择原材料");
      const qty = parseFloat(bomQty);
      if (isNaN(qty) || qty <= 0) throw new Error("数量必须大于0");

      const { error } = await supabase.from("product_bom").insert({
        product_id: bomProduct,
        inventory_item_id: bomItemId,
        quantity: qty,
        unit: bomUnit,
      });

      if (error) {
        if (error.code === "23505") throw new Error("该原材料已在配方中");
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-bom", bomProduct] });
      setShowBomDialog(false);
      setBomItemId(""); setBomQty(""); setBomUnit("g");
      toast({ title: t("admin.operationSuccess") });
    },
    onError: (err: Error) => {
      toast({ title: t("admin.operationFailed"), description: err.message, variant: "destructive" });
    },
  });

  const deleteBomMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_bom").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-bom", bomProduct] });
      toast({ title: t("admin.operationSuccess") });
    },
  });

  // ── Helpers ─────────────────────────────────────────

  const stepLabels = [
    t("admin.productionPage.stepMaterialPrep"),
    t("admin.productionPage.stepCleaning"),
    t("admin.productionPage.stepCooking"),
    t("admin.productionPage.stepColdStorage"),
    t("admin.productionPage.stepInspection"),
  ];
  const totalSteps = stepLabels.length;

  const statusStepMap: Record<string, number> = {
    planned: 0, material_prep: 1, cleaning: 2, cooking: 3,
    cold_storage: 4, inspection: 5, completed: 5, cancelled: 0,
  };
  const getCurrentStep = (status: string) => statusStepMap[status] ?? 0;

  const filteredBatches = batches.filter(batch =>
    searchQuery === "" ||
    batch.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: batches.length,
    inProgress: batches.filter(b => !["planned", "completed", "cancelled"].includes(b.status)).length,
    completed: batches.filter(b => b.status === "completed").length,
    planned: batches.filter(b => b.status === "planned").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planned": return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{t("admin.productionPage.statusPlanned")}</Badge>;
      case "material_prep": return <Badge className="bg-blue-500"><Package className="w-3 h-3 mr-1" />{t("admin.productionPage.statusMaterialPrep")}</Badge>;
      case "cleaning": return <Badge className="bg-cyan-500"><Beaker className="w-3 h-3 mr-1" />{t("admin.productionPage.statusCleaning")}</Badge>;
      case "cooking": return <Badge className="bg-orange-500"><Thermometer className="w-3 h-3 mr-1" />{t("admin.productionPage.statusCooking")}</Badge>;
      case "cold_storage": return <Badge className="bg-indigo-500"><Thermometer className="w-3 h-3 mr-1" />{t("admin.productionPage.statusColdStorage")}</Badge>;
      case "inspection": return <Badge className="bg-purple-500"><ClipboardCheck className="w-3 h-3 mr-1" />{t("admin.productionPage.statusInspection")}</Badge>;
      case "completed": return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />{t("admin.productionPage.statusCompleted")}</Badge>;
      case "cancelled": return <Badge className="bg-red-500"><AlertTriangle className="w-3 h-3 mr-1" />{t("admin.productionPage.statusCancelled")}</Badge>;
      default: return <Badge variant="outline">{t("admin.productionPage.statusUnknown")}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  const isLoading = loadingBatches || loadingMaterials;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // ── Render ──────────────────────────────────────────

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-serif" data-testid="text-production-title">
              {t("admin.productionPage.title")}
            </h1>
            <p className="text-muted-foreground">{t("admin.productionPage.subtitle")}</p>
          </div>
          <Button
            className="gap-2 bg-secondary text-secondary-foreground self-start sm:self-auto"
            onClick={() => setShowNewBatchDialog(true)}
            data-testid="button-new-batch"
          >
            <Plus className="w-4 h-4" />
            {t("admin.productionPage.newBatch")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Factory className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t("admin.productionPage.totalBatches")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <PlayCircle className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
                <p className="text-sm text-muted-foreground">{t("admin.productionPage.inProgress")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">{t("admin.productionPage.completed")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.planned}</p>
                <p className="text-sm text-muted-foreground">{t("admin.productionPage.planned")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="batches" data-testid="tab-batches">{t("admin.productionPage.batchList")}</TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">{t("admin.productionPage.materialUsage")}</TabsTrigger>
            <TabsTrigger value="bom" data-testid="tab-bom">{t("admin.productionPage.bomTab")}</TabsTrigger>
          </TabsList>

          {/* ── Batches Tab ── */}
          <TabsContent value="batches" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <CardTitle className="text-lg">{t("admin.productionPage.batchList")}</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t("admin.productionPage.searchPlaceholder")}
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-batch"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredBatches.length === 0 ? (
                  <div className="text-center py-12">
                    <Factory className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.productionPage.noBatches")}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredBatches.map((batch) => (
                      <div
                        key={batch.id}
                        className="border rounded-lg p-4 hover-elevate cursor-pointer"
                        onClick={() => setSelectedBatch(batch.id === selectedBatch ? null : batch.id)}
                        data-testid={`batch-${batch.id}`}
                      >
                        <div className="flex items-start sm:items-center justify-between mb-3 gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <Factory className="w-5 h-5 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{batch.batch_number}</p>
                              <p className="text-sm text-muted-foreground truncate">{batch.product_name}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 flex-shrink-0">
                            {getStatusBadge(batch.status)}
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              {t("admin.productionPage.qty")}: {batch.actual_qty ?? batch.planned_qty}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("admin.productionPage.progress")}</span>
                            <span>{getCurrentStep(batch.status)}/{totalSteps} {t("admin.productionPage.steps")}</span>
                          </div>
                          <Progress value={(getCurrentStep(batch.status) / totalSteps) * 100} className="h-2" />
                          <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground gap-1">
                            {stepLabels.map((label, idx) => (
                              <span
                                key={idx}
                                className={`text-center truncate ${idx < getCurrentStep(batch.status) ? "text-primary font-medium" : ""}`}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {selectedBatch === batch.id && (
                          <div className="mt-4 pt-4 border-t space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">{t("admin.productionPage.plannedDate")}</p>
                                <p className="font-medium">{formatDate(batch.planned_date)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t("admin.productionPage.startTime")}</p>
                                <p className="font-medium">{formatDateTime(batch.started_at)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t("admin.productionPage.plannedQty")}</p>
                                <p className="font-medium">{batch.planned_qty}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">{t("admin.productionPage.actualQty")}</p>
                                <p className="font-medium">{batch.actual_qty ?? "-"}</p>
                              </div>
                            </div>

                            {/* Batch materials */}
                            {materials.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">{t("admin.productionPage.materialReq")}</p>
                                <div className="bg-muted/50 rounded p-3 space-y-1.5">
                                  {materials.map(m => (
                                    <div key={m.id} className="flex justify-between text-sm">
                                      <span>{m.material_name}</span>
                                      <span className={m.actual_qty != null ? "text-green-600 font-medium" : ""}>
                                        {m.actual_qty != null ? `\u2713 ${m.actual_qty}` : m.planned_qty} {m.unit}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-wrap gap-2">
                              {batch.status !== "completed" && batch.status !== "cancelled" && (
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={(e) => { e.stopPropagation(); advanceStatusMutation.mutate(batch.id); }}
                                  disabled={advanceStatusMutation.isPending}
                                  data-testid={`button-next-step-${batch.id}`}
                                >
                                  {advanceStatusMutation.isPending
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <PlayCircle className="w-4 h-4" />}
                                  {t("admin.productionPage.nextStep")}
                                </Button>
                              )}

                              {batch.status === "material_prep" && materials.some(m => m.inventory_item_id && m.actual_qty == null) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={(e) => { e.stopPropagation(); extractMaterialsMutation.mutate(batch.id); }}
                                  disabled={extractMaterialsMutation.isPending}
                                >
                                  {extractMaterialsMutation.isPending
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : <ArrowDownToLine className="w-4 h-4" />}
                                  {t("admin.productionPage.extractMaterials")}
                                </Button>
                              )}

                              {batch.status === "completed" && (
                                <Button size="sm" variant="outline" data-testid={`button-view-report-${batch.id}`}>
                                  <ClipboardCheck className="w-4 h-4 mr-1" />
                                  {t("admin.productionPage.viewReport")}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Materials Tab ── */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("admin.productionPage.materialUsage")}</CardTitle>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.productionPage.noMaterials")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">{t("admin.productionPage.materialName")}</th>
                          <th className="pb-3 font-medium">{t("admin.productionPage.plannedUsage")}</th>
                          <th className="pb-3 font-medium">{t("admin.productionPage.actualUsage")}</th>
                          <th className="pb-3 font-medium">{t("admin.productionPage.wastage")}</th>
                          <th className="pb-3 font-medium">{t("admin.productionPage.wastageRate")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {materials.map((material) => (
                          <tr key={material.id} className="border-b last:border-0">
                            <td className="py-3 font-medium">{material.material_name}</td>
                            <td className="py-3">{material.planned_qty} {material.unit}</td>
                            <td className="py-3">{material.actual_qty ?? "-"} {material.unit}</td>
                            <td className="py-3">
                              <span className={material.wastage > 0 ? "text-orange-500" : "text-green-500"}>
                                {material.wastage} {material.unit}
                              </span>
                            </td>
                            <td className="py-3">
                              <Badge variant={material.planned_qty > 0 && material.wastage / material.planned_qty > 0.05 ? "destructive" : "outline"}>
                                {material.planned_qty > 0 ? ((material.wastage / material.planned_qty) * 100).toFixed(1) : "0.0"}%
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── BOM Tab ── */}
          <TabsContent value="bom" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle className="text-lg">{t("admin.productionPage.bomTab")}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={bomProduct} onValueChange={setBomProduct}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder={t("admin.productionPage.selectProduct")} />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {bomProduct && (
                      <Button size="sm" onClick={() => setShowBomDialog(true)} className="gap-1">
                        <Plus className="w-4 h-4" />
                        {t("admin.productionPage.addBomEntry")}
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!bomProduct ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.productionPage.noProductSelected")}</p>
                  </div>
                ) : bomEntries.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.productionPage.noBom")}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-muted-foreground">
                          <th className="pb-3 font-medium">{t("admin.productionPage.materialName")}</th>
                          <th className="pb-3 font-medium">{t("admin.productionPage.quantityPerUnit")}</th>
                          <th className="pb-3 font-medium">{t("admin.productionPage.unit")}</th>
                          <th className="pb-3 font-medium">{t("admin.productionPage.currentStock")}</th>
                          <th className="pb-3 font-medium w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bomEntries.map(entry => (
                          <tr key={entry.id} className="border-b last:border-0">
                            <td className="py-3 font-medium">{entry.inventory_items?.name || "-"}</td>
                            <td className="py-3">{entry.quantity}</td>
                            <td className="py-3">{entry.unit}</td>
                            <td className="py-3">
                              <span className={(entry.inventory_items?.stock ?? 0) <= 0 ? "text-red-500" : ""}>
                                {entry.inventory_items?.stock ?? "-"} {entry.inventory_items?.unit || ""}
                              </span>
                            </td>
                            <td className="py-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-500 hover:text-red-600 h-8 w-8 p-0"
                                onClick={() => deleteBomMutation.mutate(entry.id)}
                                disabled={deleteBomMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ── New Batch Dialog ── */}
      <Dialog open={showNewBatchDialog} onOpenChange={setShowNewBatchDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.productionPage.createBatch")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("admin.productionPage.product")}</p>
              <Select value={nbProduct} onValueChange={setNbProduct}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.productionPage.selectProduct")} />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("admin.productionPage.plannedQty")}</p>
              <Input
                type="number"
                min={1}
                placeholder="100"
                value={nbQty}
                onChange={e => setNbQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("admin.productionPage.plannedDate")}</p>
              <Input type="date" value={nbDate} onChange={e => setNbDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("admin.productionPage.notesLabel")}</p>
              <Textarea
                placeholder={t("admin.productionPage.notesPlaceholder")}
                value={nbNotes}
                onChange={e => setNbNotes(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              className="w-full"
              onClick={() => createBatchMutation.mutate()}
              disabled={createBatchMutation.isPending || !nbProduct || !nbQty || !nbDate}
            >
              {createBatchMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.productionPage.createBatch")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Add BOM Entry Dialog ── */}
      <Dialog open={showBomDialog} onOpenChange={setShowBomDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("admin.productionPage.addBomEntry")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("admin.productionPage.selectMaterial")}</p>
              <Select value={bomItemId} onValueChange={setBomItemId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("admin.productionPage.selectMaterial")} />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - {t("admin.productionPage.currentStock")}: {item.stock} {item.unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("admin.productionPage.quantityPerUnit")}</p>
              <Input
                type="number"
                step="0.01"
                min={0.01}
                placeholder="50"
                value={bomQty}
                onChange={e => setBomQty(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t("admin.productionPage.unit")}</p>
              <Select value={bomUnit} onValueChange={setBomUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">g (克)</SelectItem>
                  <SelectItem value="kg">kg (公斤)</SelectItem>
                  <SelectItem value="ml">ml (毫升)</SelectItem>
                  <SelectItem value="L">L (升)</SelectItem>
                  <SelectItem value="个">个</SelectItem>
                  <SelectItem value="片">片</SelectItem>
                  <SelectItem value="包">包</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={() => addBomMutation.mutate()}
              disabled={addBomMutation.isPending || !bomItemId || !bomQty}
            >
              {addBomMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.productionPage.addBomEntry")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
