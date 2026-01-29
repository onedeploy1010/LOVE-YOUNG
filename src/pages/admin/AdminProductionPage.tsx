import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import {
  Factory, Search, Plus, PlayCircle, CheckCircle, Clock,
  AlertTriangle, Thermometer, Package, ClipboardCheck, Beaker, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

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
  planned_qty: number;
  actual_qty: number | null;
  wastage: number;
  unit: string;
  created_at: string;
}

export default function AdminProductionPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("batches");

  // Fetch production batches
  const { data: batches = [], isLoading: loadingBatches } = useQuery({
    queryKey: ["admin-production-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("production_batches")
        .select("*")
        .order("planned_date", { ascending: false });

      if (error) {
        console.error("Error fetching batches:", error);
        return [];
      }

      return (data || []) as ProductionBatch[];
    },
  });

  // Fetch production materials
  const { data: materials = [], isLoading: loadingMaterials } = useQuery({
    queryKey: ["admin-production-materials", selectedBatch],
    queryFn: async () => {
      let query = supabase.from("production_materials").select("*");

      if (selectedBatch) {
        query = query.eq("batch_id", selectedBatch);
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50);

      if (error) {
        console.error("Error fetching materials:", error);
        return [];
      }

      return (data || []) as ProductionMaterial[];
    },
  });

  const stepLabels = [
    t("admin.productionPage.stepMaterialPrep"),
    t("admin.productionPage.stepCleaning"),
    t("admin.productionPage.stepCooking"),
    t("admin.productionPage.stepColdStorage"),
    t("admin.productionPage.stepInspection")
  ];

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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif" data-testid="text-production-title">
              {t("admin.productionPage.title")}
            </h1>
            <p className="text-muted-foreground">{t("admin.productionPage.subtitle")}</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-new-batch">
            <Plus className="w-4 h-4" />
            {t("admin.productionPage.newBatch")}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="batches" data-testid="tab-batches">{t("admin.productionPage.batchList")}</TabsTrigger>
            <TabsTrigger value="materials" data-testid="tab-materials">{t("admin.productionPage.materialUsage")}</TabsTrigger>
          </TabsList>

          <TabsContent value="batches" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg">{t("admin.productionPage.batchList")}</CardTitle>
                  <div className="relative w-64">
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
                    <p className="text-muted-foreground">暂无生产批次</p>
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
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Factory className="w-5 h-5 text-primary" />
                            <div>
                              <p className="font-medium">{batch.batch_number}</p>
                              <p className="text-sm text-muted-foreground">{batch.product_name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(batch.status)}
                            <span className="text-sm text-muted-foreground">
                              {t("admin.productionPage.qty")}: {batch.actual_qty ?? batch.planned_qty}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{t("admin.productionPage.progress")}</span>
                            <span>{batch.current_step}/{batch.total_steps} {t("admin.productionPage.steps")}</span>
                          </div>
                          <Progress value={(batch.current_step / batch.total_steps) * 100} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            {stepLabels.map((label, idx) => (
                              <span
                                key={idx}
                                className={idx < batch.current_step ? "text-primary font-medium" : ""}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>

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
                            <div className="flex gap-2">
                              {batch.status !== "completed" && batch.status !== "cancelled" && (
                                <>
                                  <Button size="sm" className="gap-1" data-testid={`button-next-step-${batch.id}`}>
                                    <PlayCircle className="w-4 h-4" />
                                    {t("admin.productionPage.nextStep")}
                                  </Button>
                                  <Button size="sm" variant="outline" data-testid={`button-view-details-${batch.id}`}>
                                    {t("admin.productionPage.viewDetails")}
                                  </Button>
                                </>
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

          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("admin.productionPage.materialUsage")}</CardTitle>
              </CardHeader>
              <CardContent>
                {materials.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无材料使用记录</p>
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
                              <Badge variant={material.wastage / material.planned_qty > 0.05 ? "destructive" : "outline"}>
                                {((material.wastage / material.planned_qty) * 100).toFixed(1)}%
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
