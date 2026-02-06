import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
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
  GitBranch,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Loader2,
  Play,
  Pause,
  CheckCircle,
  Clock,
  Zap,
  Users,
} from "lucide-react";

// --- Interfaces ---

interface WhatsappFlow {
  id: string;
  name: string;
  description: string | null;
  flow_type: string;
  status: string;
  trigger_type: string;
  trigger_value: string | null;
  steps: unknown;
  target_audience: unknown;
  conversion_count: number;
  total_triggered: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FlowExecution {
  id: string;
  flow_id: string;
  customer_phone: string;
  current_step: number;
  status: string;
  started_at: string;
  completed_at: string | null;
}

export default function AdminWhatsappFlowsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Create/Edit dialog
  const [showFlowDialog, setShowFlowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState<WhatsappFlow | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formFlowType, setFormFlowType] = useState("acquisition");
  const [formTriggerType, setFormTriggerType] = useState("keyword");
  const [formTriggerValue, setFormTriggerValue] = useState("");
  const [formSteps, setFormSteps] = useState("");
  const [formTargetAudience, setFormTargetAudience] = useState("");

  // Detail dialog
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<WhatsappFlow | null>(null);

  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingFlow, setDeletingFlow] = useState<WhatsappFlow | null>(null);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Fetch flows
  const { data: flows = [], isLoading: loadingFlows } = useQuery({
    queryKey: ["admin-whatsapp-flows"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_flows")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching whatsapp flows:", error);
        return [];
      }

      return (data || []) as WhatsappFlow[];
    },
  });

  // Fetch all executions for stats
  const { data: executions = [], isLoading: loadingExecutions } = useQuery({
    queryKey: ["admin-whatsapp-flow-executions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_flow_executions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching flow executions:", error);
        return [];
      }

      return (data || []) as FlowExecution[];
    },
  });

  // Fetch executions for the selected flow detail
  const { data: selectedFlowExecutions = [] } = useQuery({
    queryKey: ["admin-whatsapp-flow-executions", selectedFlow?.id],
    enabled: !!selectedFlow,
    queryFn: async () => {
      if (!selectedFlow) return [];
      const { data, error } = await supabase
        .from("whatsapp_flow_executions")
        .select("*")
        .eq("flow_id", selectedFlow.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching flow executions:", error);
        return [];
      }

      return (data || []) as FlowExecution[];
    },
  });

  // ============================================================
  // MUTATIONS
  // ============================================================

  // Create flow
  const createFlowMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description: string | null;
      flow_type: string;
      trigger_type: string;
      trigger_value: string | null;
      steps: unknown;
      target_audience: unknown;
      status: string;
    }) => {
      const { error } = await supabase.from("whatsapp_flows").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-flows"] });
      setShowFlowDialog(false);
      resetForm();
      toast({ title: t("admin.whatsappFlowsPage.flowCreated") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappFlowsPage.createFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Update flow
  const updateFlowMutation = useMutation({
    mutationFn: async (
      updateData: Partial<WhatsappFlow> & { id: string }
    ) => {
      const { id, ...data } = updateData;
      const { error } = await supabase
        .from("whatsapp_flows")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-flows"] });
      setShowFlowDialog(false);
      resetForm();
      toast({ title: t("admin.whatsappFlowsPage.flowUpdated") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappFlowsPage.updateFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Delete flow
  const deleteFlowMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whatsapp_flows")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-flows"] });
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-flow-executions"] });
      setShowDeleteDialog(false);
      setDeletingFlow(null);
      toast({ title: t("admin.whatsappFlowsPage.flowDeleted") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappFlowsPage.deleteFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (flow: WhatsappFlow) => {
      const newStatus = flow.status === "active" ? "paused" : "active";
      const { error } = await supabase
        .from("whatsapp_flows")
        .update({
          status: newStatus,
          is_active: newStatus === "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", flow.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-flows"] });
      toast({ title: t("admin.whatsappFlowsPage.statusToggled") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappFlowsPage.toggleFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // ============================================================
  // HELPERS
  // ============================================================

  const resetForm = () => {
    setEditingFlow(null);
    setFormName("");
    setFormDescription("");
    setFormFlowType("acquisition");
    setFormTriggerType("keyword");
    setFormTriggerValue("");
    setFormSteps("");
    setFormTargetAudience("");
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowFlowDialog(true);
  };

  const handleOpenEdit = (flow: WhatsappFlow) => {
    setEditingFlow(flow);
    setFormName(flow.name);
    setFormDescription(flow.description || "");
    setFormFlowType(flow.flow_type);
    setFormTriggerType(flow.trigger_type);
    setFormTriggerValue(flow.trigger_value || "");
    setFormSteps(flow.steps ? JSON.stringify(flow.steps, null, 2) : "");
    setFormTargetAudience(
      flow.target_audience ? JSON.stringify(flow.target_audience, null, 2) : ""
    );
    setShowFlowDialog(true);
  };

  const handleViewDetails = (flow: WhatsappFlow) => {
    setSelectedFlow(flow);
    setShowDetailDialog(true);
  };

  const handleOpenDelete = (flow: WhatsappFlow) => {
    setDeletingFlow(flow);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deletingFlow) {
      deleteFlowMutation.mutate(deletingFlow.id);
    }
  };

  const handleSubmitFlow = () => {
    if (!formName.trim()) {
      toast({
        title: t("admin.whatsappFlowsPage.nameRequired"),
        variant: "destructive",
      });
      return;
    }

    let parsedSteps: unknown = [];
    if (formSteps.trim()) {
      try {
        parsedSteps = JSON.parse(formSteps);
      } catch {
        toast({
          title: t("admin.whatsappFlowsPage.invalidStepsJson"),
          variant: "destructive",
        });
        return;
      }
    }

    let parsedAudience: unknown = {};
    if (formTargetAudience.trim()) {
      try {
        parsedAudience = JSON.parse(formTargetAudience);
      } catch {
        toast({
          title: t("admin.whatsappFlowsPage.invalidAudienceJson"),
          variant: "destructive",
        });
        return;
      }
    }

    if (editingFlow) {
      updateFlowMutation.mutate({
        id: editingFlow.id,
        name: formName,
        description: formDescription || null,
        flow_type: formFlowType,
        trigger_type: formTriggerType,
        trigger_value: formTriggerValue || null,
        steps: parsedSteps,
        target_audience: parsedAudience,
      });
    } else {
      createFlowMutation.mutate({
        name: formName,
        description: formDescription || null,
        flow_type: formFlowType,
        trigger_type: formTriggerType,
        trigger_value: formTriggerValue || null,
        steps: parsedSteps,
        target_audience: parsedAudience,
        status: "draft",
      });
    }
  };

  // Filter flows
  const filteredFlows = flows.filter((flow) => {
    const matchesSearch =
      searchQuery === "" ||
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (flow.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || flow.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Stats
  const totalFlows = flows.length;
  const activeFlows = flows.filter((f) => f.status === "active").length;
  const totalExecutions = executions.length;
  const completedExecutions = executions.filter(
    (e) => e.status === "completed" || e.status === "converted"
  ).length;
  const conversionRate =
    totalExecutions > 0
      ? ((completedExecutions / totalExecutions) * 100).toFixed(1)
      : "0.0";

  const getFlowTypeBadge = (flowType: string) => {
    const colors: Record<string, string> = {
      acquisition: "bg-green-500/10 text-green-600 border-green-500/20",
      onboarding: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      reengagement: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      support: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      promotion: "bg-pink-500/10 text-pink-600 border-pink-500/20",
      survey: "bg-orange-500/10 text-orange-600 border-orange-500/20",
    };
    return (
      <Badge className={`text-xs ${colors[flowType] || "bg-muted text-muted-foreground"}`}>
        {t(`admin.whatsappFlowsPage.flowType_${flowType}`) || flowType}
      </Badge>
    );
  };

  const getTriggerTypeBadge = (triggerType: string) => {
    return (
      <Badge variant="outline" className="text-xs">
        {t(`admin.whatsappFlowsPage.triggerType_${triggerType}`) || triggerType}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
            <Play className="w-3 h-3" />
            {t("admin.whatsappFlowsPage.statusActive")}
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 gap-1">
            <Pause className="w-3 h-3" />
            {t("admin.whatsappFlowsPage.statusPaused")}
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
            <CheckCircle className="w-3 h-3" />
            {t("admin.whatsappFlowsPage.statusCompleted")}
          </Badge>
        );
      case "archived":
        return (
          <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 gap-1">
            {t("admin.whatsappFlowsPage.statusArchived")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-muted text-muted-foreground gap-1">
            <Clock className="w-3 h-3" />
            {t("admin.whatsappFlowsPage.statusDraft")}
          </Badge>
        );
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

  const showTriggerValueField =
    formTriggerType === "keyword" || formTriggerType === "link" || formTriggerType === "qr_code";

  const isLoading = loadingFlows || loadingExecutions;

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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary">
              {t("admin.whatsappFlowsPage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.whatsappFlowsPage.subtitle")}
            </p>
          </div>
          <Button
            className="gap-2 bg-secondary text-secondary-foreground w-full sm:w-auto"
            onClick={handleOpenCreate}
          >
            <Plus className="w-4 h-4" />
            {t("admin.whatsappFlowsPage.newFlow")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <GitBranch className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{totalFlows}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappFlowsPage.totalFlows")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500">
                  {activeFlows}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappFlowsPage.activeFlows")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-blue-500">
                  {totalExecutions}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappFlowsPage.totalTriggered")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-purple-500">
                  {conversionRate}%
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappFlowsPage.conversionRate")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search + Tabs + Flow List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.whatsappFlowsPage.flowList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.whatsappFlowsPage.searchPlaceholder")}
                  className="pl-9 h-9 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                <TabsTrigger
                  value="all"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  {t("admin.whatsappFlowsPage.tabAll")}
                </TabsTrigger>
                <TabsTrigger
                  value="active"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  {t("admin.whatsappFlowsPage.statusActive")}
                </TabsTrigger>
                <TabsTrigger
                  value="draft"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  {t("admin.whatsappFlowsPage.statusDraft")}
                </TabsTrigger>
                <TabsTrigger
                  value="paused"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  {t("admin.whatsappFlowsPage.statusPaused")}
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="text-xs sm:text-sm py-1.5 sm:py-2"
                >
                  <span className="hidden sm:inline">
                    {t("admin.whatsappFlowsPage.statusCompleted")}
                  </span>
                  <span className="sm:hidden">
                    {t("admin.whatsappFlowsPage.tabCompletedShort")}
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-3 sm:mt-4">
                {filteredFlows.length === 0 ? (
                  <div className="text-center py-12">
                    <GitBranch className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {t("admin.whatsappFlowsPage.noFlows")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredFlows.map((flow) => (
                      <div
                        key={flow.id}
                        className="flex flex-col p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                      >
                        {/* Top row: name + badges */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <GitBranch className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-medium text-sm sm:text-base truncate">
                                  {flow.name}
                                </span>
                                {getFlowTypeBadge(flow.flow_type)}
                                {getTriggerTypeBadge(flow.trigger_type)}
                                {getStatusBadge(flow.status)}
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap mt-0.5">
                                {flow.trigger_value && (
                                  <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3" />
                                    {flow.trigger_value}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(flow.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 pl-12 sm:pl-0 text-xs sm:text-sm text-muted-foreground">
                            <span className="font-medium">
                              {flow.total_triggered} {t("admin.whatsappFlowsPage.triggered")}
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        {flow.description && (
                          <div className="pl-12 sm:pl-14">
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                              {flow.description}
                            </p>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-12 sm:pl-14">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                            onClick={() => handleViewDetails(flow)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t("admin.whatsappFlowsPage.viewDetails")}
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                            onClick={() => handleOpenEdit(flow)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t("admin.whatsappFlowsPage.edit")}
                            </span>
                          </Button>
                          {(flow.status === "active" || flow.status === "paused" || flow.status === "draft") && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 h-8 text-xs"
                              onClick={() => toggleStatusMutation.mutate(flow)}
                              disabled={toggleStatusMutation.isPending}
                            >
                              {flow.status === "active" ? (
                                <>
                                  <Pause className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">
                                    {t("admin.whatsappFlowsPage.pause")}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">
                                    {t("admin.whatsappFlowsPage.activate")}
                                  </span>
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs text-destructive hover:text-destructive"
                            onClick={() => handleOpenDelete(flow)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t("admin.whatsappFlowsPage.delete")}
                            </span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* Create/Edit Flow Dialog */}
      {/* ============================================================ */}
      <Dialog open={showFlowDialog} onOpenChange={setShowFlowDialog}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {editingFlow ? (
                <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              ) : (
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              )}
              {editingFlow
                ? t("admin.whatsappFlowsPage.editFlow")
                : t("admin.whatsappFlowsPage.createFlow")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingFlow
                ? t("admin.whatsappFlowsPage.editFlowDesc")
                : t("admin.whatsappFlowsPage.createFlowDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            {/* Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappFlowsPage.flowName")} *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("admin.whatsappFlowsPage.flowNamePlaceholder")}
                className="h-9 sm:h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappFlowsPage.description")}
              </label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t("admin.whatsappFlowsPage.descriptionPlaceholder")}
                className="min-h-[80px]"
              />
            </div>

            {/* Flow Type + Trigger Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappFlowsPage.flowType")}
                </label>
                <Select value={formFlowType} onValueChange={setFormFlowType}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="acquisition">
                      {t("admin.whatsappFlowsPage.flowType_acquisition")}
                    </SelectItem>
                    <SelectItem value="onboarding">
                      {t("admin.whatsappFlowsPage.flowType_onboarding")}
                    </SelectItem>
                    <SelectItem value="reengagement">
                      {t("admin.whatsappFlowsPage.flowType_reengagement")}
                    </SelectItem>
                    <SelectItem value="support">
                      {t("admin.whatsappFlowsPage.flowType_support")}
                    </SelectItem>
                    <SelectItem value="promotion">
                      {t("admin.whatsappFlowsPage.flowType_promotion")}
                    </SelectItem>
                    <SelectItem value="survey">
                      {t("admin.whatsappFlowsPage.flowType_survey")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappFlowsPage.triggerType")}
                </label>
                <Select value={formTriggerType} onValueChange={setFormTriggerType}>
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">
                      {t("admin.whatsappFlowsPage.triggerType_keyword")}
                    </SelectItem>
                    <SelectItem value="qr_code">
                      {t("admin.whatsappFlowsPage.triggerType_qr_code")}
                    </SelectItem>
                    <SelectItem value="link">
                      {t("admin.whatsappFlowsPage.triggerType_link")}
                    </SelectItem>
                    <SelectItem value="ad_click">
                      {t("admin.whatsappFlowsPage.triggerType_ad_click")}
                    </SelectItem>
                    <SelectItem value="manual">
                      {t("admin.whatsappFlowsPage.triggerType_manual")}
                    </SelectItem>
                    <SelectItem value="scheduled">
                      {t("admin.whatsappFlowsPage.triggerType_scheduled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Trigger Value (conditional) */}
            {showTriggerValueField && (
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappFlowsPage.triggerValue")}
                </label>
                <Input
                  value={formTriggerValue}
                  onChange={(e) => setFormTriggerValue(e.target.value)}
                  placeholder={t("admin.whatsappFlowsPage.triggerValuePlaceholder")}
                  className="h-9 sm:h-10"
                />
              </div>
            )}

            {/* Steps JSON */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappFlowsPage.steps")}
              </label>
              <Textarea
                value={formSteps}
                onChange={(e) => setFormSteps(e.target.value)}
                placeholder={`[
  {
    "step": 1,
    "type": "message",
    "content": "Welcome! How can we help you today?",
    "options": ["Product Info", "Place Order", "Support"]
  },
  {
    "step": 2,
    "type": "action",
    "action": "route_to_agent"
  }
]`}
                className="min-h-[120px] font-mono text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.whatsappFlowsPage.stepsHint")}
              </p>
            </div>

            {/* Target Audience JSON */}
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappFlowsPage.targetAudience")}
              </label>
              <Textarea
                value={formTargetAudience}
                onChange={(e) => setFormTargetAudience(e.target.value)}
                placeholder={`{
  "segments": ["new_customers", "returning"],
  "languages": ["zh", "en", "ms"]
}`}
                className="min-h-[80px] font-mono text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.whatsappFlowsPage.targetAudienceHint")}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFlowDialog(false);
                resetForm();
              }}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappFlowsPage.cancel")}
            </Button>
            <Button
              onClick={handleSubmitFlow}
              disabled={
                createFlowMutation.isPending ||
                updateFlowMutation.isPending ||
                !formName.trim()
              }
              className="w-full sm:w-auto"
            >
              {(createFlowMutation.isPending || updateFlowMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingFlow
                ? t("admin.whatsappFlowsPage.save")
                : t("admin.whatsappFlowsPage.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Flow Detail Dialog */}
      {/* ============================================================ */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] max-w-[650px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.whatsappFlowsPage.flowDetails")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedFlow?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedFlow && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappFlowsPage.flowName")}
                  </p>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {selectedFlow.name}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappFlowsPage.status")}
                  </p>
                  {getStatusBadge(selectedFlow.status)}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappFlowsPage.flowType")}
                  </p>
                  {getFlowTypeBadge(selectedFlow.flow_type)}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappFlowsPage.triggerType")}
                  </p>
                  {getTriggerTypeBadge(selectedFlow.trigger_type)}
                </div>
                {selectedFlow.trigger_value && (
                  <div className="space-y-0.5 sm:space-y-1 col-span-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t("admin.whatsappFlowsPage.triggerValue")}
                    </p>
                    <p className="font-medium text-sm sm:text-base">
                      {selectedFlow.trigger_value}
                    </p>
                  </div>
                )}
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappFlowsPage.createdAt")}
                  </p>
                  <p className="text-sm">{formatDateTime(selectedFlow.created_at)}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappFlowsPage.updatedAt")}
                  </p>
                  <p className="text-sm">{formatDateTime(selectedFlow.updated_at)}</p>
                </div>
              </div>

              {/* Description */}
              {selectedFlow.description && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappFlowsPage.description")}
                  </p>
                  <p className="text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg">
                    {selectedFlow.description}
                  </p>
                </div>
              )}

              {/* Steps JSON */}
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.whatsappFlowsPage.steps")}
                </p>
                <pre className="text-xs bg-muted p-2.5 sm:p-3 rounded-lg overflow-x-auto max-h-48">
                  {selectedFlow.steps
                    ? JSON.stringify(selectedFlow.steps, null, 2)
                    : "[]"}
                </pre>
              </div>

              {/* Target Audience JSON */}
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {t("admin.whatsappFlowsPage.targetAudience")}
                </p>
                <pre className="text-xs bg-muted p-2.5 sm:p-3 rounded-lg overflow-x-auto max-h-32">
                  {selectedFlow.target_audience
                    ? JSON.stringify(selectedFlow.target_audience, null, 2)
                    : "{}"}
                </pre>
              </div>

              {/* Execution Stats */}
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                  {t("admin.whatsappFlowsPage.executionStats")}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="p-2.5 sm:p-3 border rounded-lg text-center">
                    <p className="text-lg sm:text-xl font-bold">
                      {selectedFlowExecutions.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.whatsappFlowsPage.totalExecutions")}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 border rounded-lg text-center">
                    <p className="text-lg sm:text-xl font-bold text-yellow-500">
                      {selectedFlowExecutions.filter((e) => e.status === "in_progress").length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.whatsappFlowsPage.inProgress")}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 border rounded-lg text-center">
                    <p className="text-lg sm:text-xl font-bold text-green-500">
                      {selectedFlowExecutions.filter((e) => e.status === "completed").length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.whatsappFlowsPage.completed")}
                    </p>
                  </div>
                  <div className="p-2.5 sm:p-3 border rounded-lg text-center">
                    <p className="text-lg sm:text-xl font-bold text-blue-500">
                      {selectedFlowExecutions.filter((e) => e.status === "converted").length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("admin.whatsappFlowsPage.converted")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-3 sm:mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappFlowsPage.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* Delete Confirmation Dialog */}
      {/* ============================================================ */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              {t("admin.whatsappFlowsPage.confirmDeleteTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.whatsappFlowsPage.confirmDeleteDesc")}
            </DialogDescription>
          </DialogHeader>

          {deletingFlow && (
            <div className="py-2 sm:py-4">
              <div className="p-3 border rounded-lg space-y-1.5">
                <p className="font-medium text-sm">{deletingFlow.name}</p>
                {deletingFlow.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {deletingFlow.description}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  {getFlowTypeBadge(deletingFlow.flow_type)}
                  {getStatusBadge(deletingFlow.status)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingFlow(null);
              }}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappFlowsPage.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteFlowMutation.isPending}
              className="w-full sm:w-auto"
            >
              {deleteFlowMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("admin.whatsappFlowsPage.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
