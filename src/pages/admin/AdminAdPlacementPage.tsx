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
  Target, Search, Plus, Edit, Trash2,
  CheckCircle, XCircle, Clock, Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface AdPlacementPlan {
  id: string;
  name: string;
  description: string | null;
  platform: string;
  status: string;
  total_budget: number;
  daily_budget: number;
  start_date: string | null;
  end_date: string | null;
  target_audience: string | null;
  kpi_targets: string | null;
  approval_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PlanFormData {
  name: string;
  description: string;
  platform: string;
  total_budget: string;
  daily_budget: string;
  start_date: string;
  end_date: string;
  kpi_targets: string;
  notes: string;
}

const emptyForm: PlanFormData = {
  name: "",
  description: "",
  platform: "facebook",
  total_budget: "",
  daily_budget: "",
  start_date: "",
  end_date: "",
  kpi_targets: "",
  notes: "",
};

export default function AdminAdPlacementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdPlacementPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<AdPlacementPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(emptyForm);
  const [approvalNotes, setApprovalNotes] = useState("");

  // Fetch plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-ad-placement-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_placement_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching ad placement plans:", error);
        return [];
      }

      return (data || []) as AdPlacementPlan[];
    },
  });

  // Create plan
  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const { error } = await supabase.from("ad_placement_plans").insert({
        name: data.name,
        description: data.description || null,
        platform: data.platform,
        total_budget: parseFloat(data.total_budget) || 0,
        daily_budget: parseFloat(data.daily_budget) || 0,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        kpi_targets: data.kpi_targets || null,
        approval_notes: data.notes || null,
        status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] });
      setShowPlanDialog(false);
      setFormData(emptyForm);
      setEditingPlan(null);
      toast({ title: t("admin.adPlacementPage.planCreated") });
    },
    onError: (error) => {
      toast({ title: t("admin.adPlacementPage.createFailed"), description: String(error), variant: "destructive" });
    },
  });

  // Update plan
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlanFormData }) => {
      const { error } = await supabase
        .from("ad_placement_plans")
        .update({
          name: data.name,
          description: data.description || null,
          platform: data.platform,
          total_budget: parseFloat(data.total_budget) || 0,
          daily_budget: parseFloat(data.daily_budget) || 0,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          kpi_targets: data.kpi_targets || null,
          approval_notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] });
      setShowPlanDialog(false);
      setFormData(emptyForm);
      setEditingPlan(null);
      toast({ title: t("admin.adPlacementPage.planUpdated") });
    },
    onError: (error) => {
      toast({ title: t("admin.adPlacementPage.updateFailed"), description: String(error), variant: "destructive" });
    },
  });

  // Delete plan
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ad_placement_plans")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] });
      setShowDeleteDialog(false);
      setDeletingPlan(null);
      toast({ title: t("admin.adPlacementPage.planDeleted") });
    },
    onError: (error) => {
      toast({ title: t("admin.adPlacementPage.deleteFailed"), description: String(error), variant: "destructive" });
    },
  });

  // Submit for approval
  const submitForApprovalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ad_placement_plans")
        .update({ status: "pending_approval", updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] });
      toast({ title: t("admin.adPlacementPage.submittedForApproval") });
    },
    onError: (error) => {
      toast({ title: t("admin.adPlacementPage.submitFailed"), description: String(error), variant: "destructive" });
    },
  });

  // Approve plan
  const approvePlanMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("ad_placement_plans")
        .update({
          status: "approved",
          approval_notes: notes || null,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] });
      setApprovalNotes("");
      toast({ title: t("admin.adPlacementPage.planApproved") });
    },
    onError: (error) => {
      toast({ title: t("admin.adPlacementPage.approveFailed"), description: String(error), variant: "destructive" });
    },
  });

  // Reject plan
  const rejectPlanMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("ad_placement_plans")
        .update({
          status: "draft",
          approval_notes: notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-ad-placement-plans"] });
      setApprovalNotes("");
      toast({ title: t("admin.adPlacementPage.planRejected") });
    },
    onError: (error) => {
      toast({ title: t("admin.adPlacementPage.rejectFailed"), description: String(error), variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(emptyForm);
    setShowPlanDialog(true);
  };

  const handleOpenEdit = (plan: AdPlacementPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || "",
      platform: plan.platform,
      total_budget: String(plan.total_budget),
      daily_budget: String(plan.daily_budget),
      start_date: plan.start_date || "",
      end_date: plan.end_date || "",
      kpi_targets: plan.kpi_targets || "",
      notes: plan.approval_notes || "",
    });
    setShowPlanDialog(true);
  };

  const handleOpenDelete = (plan: AdPlacementPlan) => {
    setDeletingPlan(plan);
    setShowDeleteDialog(true);
  };

  const handleSubmitForm = () => {
    if (!formData.name.trim()) {
      toast({ title: t("admin.adPlacementPage.nameRequired"), variant: "destructive" });
      return;
    }
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createPlanMutation.mutate(formData);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "draft":
        return { label: t("admin.adPlacementPage.statusDraft"), color: "text-gray-500", bg: "bg-gray-500/10", icon: Clock };
      case "pending_approval":
        return { label: t("admin.adPlacementPage.statusPending"), color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Clock };
      case "approved":
        return { label: t("admin.adPlacementPage.statusApproved"), color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle };
      case "active":
        return { label: t("admin.adPlacementPage.statusActive"), color: "text-blue-500", bg: "bg-blue-500/10", icon: Target };
      case "completed":
        return { label: t("admin.adPlacementPage.statusCompleted"), color: "text-gray-500", bg: "bg-gray-500/10", icon: CheckCircle };
      default:
        return { label: status, color: "text-muted-foreground", bg: "bg-muted", icon: Clock };
    }
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case "facebook": return "Facebook";
      case "instagram": return "Instagram";
      case "both": return "Facebook + Instagram";
      case "xiaohongshu": return t("admin.adPlacementPage.platformXiaohongshu");
      case "google": return "Google";
      case "tiktok": return "TikTok";
      default: return platform;
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

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      searchQuery === "" ||
      plan.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.platform.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && plan.status === "pending_approval") ||
      (activeTab !== "pending" && plan.status === activeTab);
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: plans.length,
    pending: plans.filter((p) => p.status === "pending_approval").length,
    active: plans.filter((p) => p.status === "active").length,
    totalBudget: plans.reduce((sum, p) => sum + (p.total_budget || 0), 0),
  };

  const isMutating =
    createPlanMutation.isPending ||
    updatePlanMutation.isPending;

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
            <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-ad-placement-title">
              {t("admin.adPlacementPage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("admin.adPlacementPage.subtitle")}</p>
          </div>
          <Button
            className="gap-2 bg-secondary text-secondary-foreground w-full sm:w-auto"
            onClick={handleOpenCreate}
            data-testid="button-new-plan"
          >
            <Plus className="w-4 h-4" />
            {t("admin.adPlacementPage.newPlan")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.adPlacementPage.totalPlans")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-yellow-500">{stats.pending}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.adPlacementPage.pendingApproval")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-blue-500">{stats.active}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.adPlacementPage.activePlans")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500 truncate">
                  RM {stats.totalBudget.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.adPlacementPage.totalBudget")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.adPlacementPage.planList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.adPlacementPage.searchPlaceholder")}
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
              <TabsList className="grid w-full grid-cols-6 h-auto p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-all">
                  {t("admin.adPlacementPage.tabAll")}
                </TabsTrigger>
                <TabsTrigger value="draft" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-draft">
                  <span className="hidden sm:inline">{t("admin.adPlacementPage.statusDraft")}</span>
                  <span className="sm:hidden">{t("admin.adPlacementPage.tabDraftShort", "Draft")}</span>
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-pending">
                  <span className="hidden sm:inline">{t("admin.adPlacementPage.statusPending")}</span>
                  <span className="sm:hidden">{t("admin.adPlacementPage.tabPendingShort", "Pending")}</span>
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-approved">
                  <span className="hidden sm:inline">{t("admin.adPlacementPage.statusApproved")}</span>
                  <span className="sm:hidden">{t("admin.adPlacementPage.tabApprovedShort", "Approved")}</span>
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-active">
                  <span className="hidden sm:inline">{t("admin.adPlacementPage.statusActive")}</span>
                  <span className="sm:hidden">{t("admin.adPlacementPage.tabActiveShort", "Active")}</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-completed">
                  <span className="hidden sm:inline">{t("admin.adPlacementPage.statusCompleted")}</span>
                  <span className="sm:hidden">{t("admin.adPlacementPage.tabCompletedShort", "Done")}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-3 sm:mt-4">
                {filteredPlans.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.adPlacementPage.noPlans")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredPlans.map((plan) => {
                      const statusConfig = getStatusConfig(plan.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div
                          key={plan.id}
                          className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`plan-${plan.id}`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${statusConfig.bg}`}>
                                <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfig.color}`} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span className="font-medium text-sm sm:text-base truncate">{plan.name}</span>
                                  <Badge variant="secondary" className="text-xs">{getPlatformLabel(plan.platform)}</Badge>
                                  <Badge variant="outline" className={`text-xs ${statusConfig.color}`}>
                                    {statusConfig.label}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground mt-1 flex-wrap">
                                  <span>{t("admin.adPlacementPage.budget")}: RM {plan.total_budget.toLocaleString()}</span>
                                  <span>{t("admin.adPlacementPage.dailyBudgetLabel")}: RM {plan.daily_budget.toLocaleString()}</span>
                                  {plan.start_date && plan.end_date && (
                                    <span className="shrink-0">
                                      {formatDate(plan.start_date)} ~ {formatDate(plan.end_date)}
                                    </span>
                                  )}
                                </div>
                                {plan.approval_notes && (
                                  <p className="text-xs text-muted-foreground mt-1 bg-muted px-2 py-1 rounded">
                                    {t("admin.adPlacementPage.approvalNotes")}: {plan.approval_notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 pl-12 sm:pl-0 shrink-0">
                              {plan.status === "draft" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 h-8 text-xs"
                                  onClick={() => submitForApprovalMutation.mutate(plan.id)}
                                  disabled={submitForApprovalMutation.isPending}
                                  data-testid={`button-submit-${plan.id}`}
                                >
                                  {submitForApprovalMutation.isPending ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-3.5 h-3.5" />
                                  )}
                                  <span className="hidden sm:inline">{t("admin.adPlacementPage.submitForApproval")}</span>
                                  <span className="sm:hidden">{t("admin.adPlacementPage.submitShort", "Submit")}</span>
                                </Button>
                              )}
                              {plan.status === "pending_approval" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 h-8 text-xs text-green-600 hover:text-green-700"
                                    onClick={() => approvePlanMutation.mutate({ id: plan.id, notes: approvalNotes })}
                                    disabled={approvePlanMutation.isPending}
                                    data-testid={`button-approve-${plan.id}`}
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{t("admin.adPlacementPage.approve")}</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1 h-8 text-xs text-red-600 hover:text-red-700"
                                    onClick={() => rejectPlanMutation.mutate({ id: plan.id, notes: approvalNotes })}
                                    disabled={rejectPlanMutation.isPending}
                                    data-testid={`button-reject-${plan.id}`}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">{t("admin.adPlacementPage.reject")}</span>
                                  </Button>
                                </>
                              )}
                              {(plan.status === "draft" || plan.status === "pending_approval") && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1 h-8"
                                  onClick={() => handleOpenEdit(plan)}
                                  data-testid={`button-edit-${plan.id}`}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8 text-destructive hover:text-destructive"
                                onClick={() => handleOpenDelete(plan)}
                                data-testid={`button-delete-${plan.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create / Edit Plan Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {editingPlan
                ? t("admin.adPlacementPage.editPlan")
                : t("admin.adPlacementPage.createPlan")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingPlan
                ? t("admin.adPlacementPage.editPlanDescription")
                : t("admin.adPlacementPage.createPlanDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.adPlacementPage.planName")} *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("admin.adPlacementPage.planNamePlaceholder")}
                className="h-9 sm:h-10"
                data-testid="input-plan-name"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.adPlacementPage.description")}</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("admin.adPlacementPage.descriptionPlaceholder")}
                className="min-h-[80px]"
                data-testid="input-plan-description"
              />
            </div>

            {/* Platform */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.adPlacementPage.platform")} *</label>
              <Select
                value={formData.platform}
                onValueChange={(value) => setFormData({ ...formData, platform: value })}
              >
                <SelectTrigger className="h-9 sm:h-10" data-testid="select-platform">
                  <SelectValue placeholder={t("admin.adPlacementPage.selectPlatform")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="both">Facebook + Instagram</SelectItem>
                  <SelectItem value="xiaohongshu">{t("admin.adPlacementPage.platformXiaohongshu")}</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Budgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.adPlacementPage.totalBudget")} (RM)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.total_budget}
                  onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                  placeholder="0.00"
                  className="h-9 sm:h-10"
                  data-testid="input-total-budget"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.adPlacementPage.dailyBudget")} (RM)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.daily_budget}
                  onChange={(e) => setFormData({ ...formData, daily_budget: e.target.value })}
                  placeholder="0.00"
                  className="h-9 sm:h-10"
                  data-testid="input-daily-budget"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.adPlacementPage.startDate")}</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-9 sm:h-10"
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.adPlacementPage.endDate")}</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="h-9 sm:h-10"
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {/* KPI Targets */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.adPlacementPage.kpiTargets")}</label>
              <Textarea
                value={formData.kpi_targets}
                onChange={(e) => setFormData({ ...formData, kpi_targets: e.target.value })}
                placeholder={t("admin.adPlacementPage.kpiTargetsPlaceholder")}
                className="min-h-[80px] font-mono text-sm"
                data-testid="input-kpi-targets"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.adPlacementPage.notes")}</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t("admin.adPlacementPage.notesPlaceholder")}
                className="min-h-[80px]"
                data-testid="input-plan-notes"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPlanDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.adPlacementPage.cancel")}
            </Button>
            <Button
              onClick={handleSubmitForm}
              disabled={isMutating}
              className="w-full sm:w-auto"
              data-testid="button-confirm-plan"
            >
              {isMutating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPlan
                ? t("admin.adPlacementPage.save")
                : t("admin.adPlacementPage.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              {t("admin.adPlacementPage.confirmDelete")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.adPlacementPage.confirmDeleteDescription", "Are you sure you want to delete this plan? This action cannot be undone.")}
            </DialogDescription>
          </DialogHeader>
          {deletingPlan && (
            <div className="py-2 sm:py-4">
              <p className="text-sm font-medium">{deletingPlan.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getPlatformLabel(deletingPlan.platform)} - RM {deletingPlan.total_budget.toLocaleString()}
              </p>
            </div>
          )}
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.adPlacementPage.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingPlan && deletePlanMutation.mutate(deletingPlan.id)}
              disabled={deletePlanMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-confirm-delete"
            >
              {deletePlanMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.adPlacementPage.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
