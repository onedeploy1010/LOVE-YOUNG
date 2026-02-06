import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Megaphone, Search, Plus, DollarSign, Eye, BarChart3,
  Clock, CheckCircle, Pause, FileEdit, Loader2, Trash2,
  Calendar, Target, TrendingUp, Instagram, Facebook, Layers,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Campaign {
  id: string;
  ad_account_id: string | null;
  name: string;
  platform: string;
  objective: string;
  status: string;
  budget_type: string;
  budget_amount: number;
  spent_amount: number;
  start_date: string | null;
  end_date: string | null;
  target_audience: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignFormData {
  name: string;
  platform: string;
  objective: string;
  budget_type: string;
  budget_amount: string;
  start_date: string;
  end_date: string;
  notes: string;
}

const defaultFormData: CampaignFormData = {
  name: "",
  platform: "facebook",
  objective: "awareness",
  budget_type: "daily",
  budget_amount: "",
  start_date: "",
  end_date: "",
  notes: "",
};

export default function AdminMetaAdsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>(defaultFormData);

  // Fetch campaigns
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-marketing-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_campaigns")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching campaigns:", error);
        return [];
      }

      return (data || []) as Campaign[];
    },
  });

  // Create campaign
  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData) => {
      const { error } = await supabase.from("marketing_campaigns").insert({
        name: data.name,
        platform: data.platform,
        objective: data.objective,
        status: "draft",
        budget_type: data.budget_type,
        budget_amount: Math.round(parseFloat(data.budget_amount) * 100),
        spent_amount: 0,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
      setShowCampaignModal(false);
      setFormData(defaultFormData);
      toast({ title: t("admin.metaAdsPage.campaignCreated") });
    },
    onError: (error) => {
      toast({ title: t("admin.metaAdsPage.createFailed"), description: String(error), variant: "destructive" });
    },
  });

  // Update campaign
  const updateCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData & { id: string }) => {
      const { id, ...rest } = data;
      const { error } = await supabase
        .from("marketing_campaigns")
        .update({
          name: rest.name,
          platform: rest.platform,
          objective: rest.objective,
          budget_type: rest.budget_type,
          budget_amount: Math.round(parseFloat(rest.budget_amount) * 100),
          start_date: rest.start_date || null,
          end_date: rest.end_date || null,
          notes: rest.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
      setShowCampaignModal(false);
      setEditingCampaign(null);
      setFormData(defaultFormData);
      toast({ title: t("admin.metaAdsPage.campaignUpdated") });
    },
    onError: (error) => {
      toast({ title: t("admin.metaAdsPage.updateFailed"), description: String(error), variant: "destructive" });
    },
  });

  // Delete campaign
  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketing_campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
      setShowDeleteModal(false);
      setSelectedCampaign(null);
      toast({ title: t("admin.metaAdsPage.campaignDeleted") });
    },
    onError: (error) => {
      toast({ title: t("admin.metaAdsPage.deleteFailed"), description: String(error), variant: "destructive" });
    },
  });

  // Update campaign status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("marketing_campaigns")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
      toast({ title: t("admin.metaAdsPage.statusUpdated") });
    },
    onError: (error) => {
      toast({ title: t("admin.metaAdsPage.updateFailed"), description: String(error), variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingCampaign(null);
    setFormData(defaultFormData);
    setShowCampaignModal(true);
  };

  const handleOpenEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      platform: campaign.platform,
      objective: campaign.objective,
      budget_type: campaign.budget_type,
      budget_amount: (campaign.budget_amount / 100).toString(),
      start_date: campaign.start_date || "",
      end_date: campaign.end_date || "",
      notes: campaign.notes || "",
    });
    setShowCampaignModal(true);
  };

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetailsModal(true);
  };

  const handleConfirmDelete = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDeleteModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({ title: t("admin.metaAdsPage.nameRequired"), variant: "destructive" });
      return;
    }
    if (!formData.budget_amount || parseFloat(formData.budget_amount) <= 0) {
      toast({ title: t("admin.metaAdsPage.budgetRequired"), variant: "destructive" });
      return;
    }

    if (editingCampaign) {
      updateCampaignMutation.mutate({ ...formData, id: editingCampaign.id });
    } else {
      createCampaignMutation.mutate(formData);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "active":
        return { label: t("admin.metaAdsPage.statusActive"), icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" };
      case "paused":
        return { label: t("admin.metaAdsPage.statusPaused"), icon: Pause, color: "text-yellow-500", bg: "bg-yellow-500/10" };
      case "draft":
        return { label: t("admin.metaAdsPage.statusDraft"), icon: FileEdit, color: "text-blue-500", bg: "bg-blue-500/10" };
      case "completed":
        return { label: t("admin.metaAdsPage.statusCompleted"), icon: CheckCircle, color: "text-muted-foreground", bg: "bg-muted" };
      default:
        return { label: t("admin.metaAdsPage.statusUnknown"), icon: Clock, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const getPlatformConfig = (platform: string) => {
    switch (platform) {
      case "facebook":
        return { label: "Facebook", icon: Facebook, color: "text-blue-600", bg: "bg-blue-600/10" };
      case "instagram":
        return { label: "Instagram", icon: Instagram, color: "text-pink-500", bg: "bg-pink-500/10" };
      case "both":
        return { label: "Facebook + Instagram", icon: Layers, color: "text-purple-500", bg: "bg-purple-500/10" };
      default:
        return { label: platform, icon: Megaphone, color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const getObjectiveLabel = (objective: string) => {
    switch (objective) {
      case "awareness": return t("admin.metaAdsPage.objectiveAwareness");
      case "traffic": return t("admin.metaAdsPage.objectiveTraffic");
      case "engagement": return t("admin.metaAdsPage.objectiveEngagement");
      case "leads": return t("admin.metaAdsPage.objectiveLeads");
      case "sales": return t("admin.metaAdsPage.objectiveSales");
      case "app_promotion": return t("admin.metaAdsPage.objectiveAppPromotion");
      default: return objective;
    }
  };

  const getBudgetTypeLabel = (budgetType: string) => {
    switch (budgetType) {
      case "daily": return t("admin.metaAdsPage.budgetDaily");
      case "lifetime": return t("admin.metaAdsPage.budgetLifetime");
      default: return budgetType;
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      searchQuery === "" ||
      campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || campaign.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter((c) => c.status === "active").length,
    totalSpend: campaigns.reduce((sum, c) => sum + c.spent_amount, 0),
    totalBudget: campaigns.reduce((sum, c) => sum + c.budget_amount, 0),
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-meta-ads-title">
              {t("admin.metaAdsPage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("admin.metaAdsPage.subtitle")}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("meta-sync-performance");
                  if (error) throw error;
                  toast({ title: t("admin.metaAdsPage.syncSuccess") || "Performance data synced" });
                  queryClient.invalidateQueries({ queryKey: ["admin-marketing-campaigns"] });
                } catch {
                  toast({ title: t("admin.metaAdsPage.syncFailed") || "Sync failed", variant: "destructive" });
                }
              }}
            >
              <TrendingUp className="w-4 h-4" />
              {t("admin.metaAdsPage.syncPerformance") || "Sync Performance"}
            </Button>
            <Button
              className="gap-2 bg-secondary text-secondary-foreground flex-1 sm:flex-none"
              onClick={handleOpenCreate}
              data-testid="button-new-campaign"
            >
              <Plus className="w-4 h-4" />
              {t("admin.metaAdsPage.newCampaign")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.metaAdsPage.totalCampaigns")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500">{stats.active}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.metaAdsPage.activeCampaigns")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-yellow-500 truncate">
                  RM {(stats.totalSpend / 100).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.metaAdsPage.totalSpend")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-blue-500 truncate">
                  RM {(stats.totalBudget / 100).toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.metaAdsPage.totalBudget")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign List */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.metaAdsPage.campaignList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.metaAdsPage.searchPlaceholder")}
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
              <TabsList className="grid w-full grid-cols-5 h-auto p-1">
                <TabsTrigger value="all" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-all">
                  {t("admin.metaAdsPage.tabAll")}
                </TabsTrigger>
                <TabsTrigger value="active" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-active">
                  <span className="hidden sm:inline">{t("admin.metaAdsPage.statusActive")}</span>
                  <span className="sm:hidden">{t("admin.metaAdsPage.statusActive")}</span>
                </TabsTrigger>
                <TabsTrigger value="paused" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-paused">
                  <span className="hidden sm:inline">{t("admin.metaAdsPage.statusPaused")}</span>
                  <span className="sm:hidden">{t("admin.metaAdsPage.statusPaused")}</span>
                </TabsTrigger>
                <TabsTrigger value="draft" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-draft">
                  <span className="hidden sm:inline">{t("admin.metaAdsPage.statusDraft")}</span>
                  <span className="sm:hidden">{t("admin.metaAdsPage.statusDraft")}</span>
                </TabsTrigger>
                <TabsTrigger value="completed" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-completed">
                  <span className="hidden sm:inline">{t("admin.metaAdsPage.statusCompleted")}</span>
                  <span className="sm:hidden">{t("admin.metaAdsPage.statusCompleted")}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-3 sm:mt-4">
                {filteredCampaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.metaAdsPage.noCampaigns")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredCampaigns.map((campaign) => {
                      const statusConfig = getStatusConfig(campaign.status);
                      const StatusIcon = statusConfig.icon;
                      const platformConfig = getPlatformConfig(campaign.platform);
                      const PlatformIcon = platformConfig.icon;
                      return (
                        <div
                          key={campaign.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                          data-testid={`campaign-${campaign.id}`}
                        >
                          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${statusConfig.bg}`}>
                              <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusConfig.color}`} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                <span className="font-medium text-sm sm:text-base truncate">{campaign.name}</span>
                                <Badge variant="outline" className="text-xs">{statusConfig.label}</Badge>
                                <Badge className={`${platformConfig.bg} ${platformConfig.color} text-xs`}>
                                  <PlatformIcon className="w-3 h-3 mr-1" />
                                  {platformConfig.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {getObjectiveLabel(campaign.objective)}
                                </span>
                                <span className="shrink-0">
                                  {getBudgetTypeLabel(campaign.budget_type)}: RM {(campaign.budget_amount / 100).toLocaleString()}
                                </span>
                                <span className="shrink-0 hidden sm:inline">
                                  {formatDate(campaign.start_date)} ~ {formatDate(campaign.end_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 pl-12 sm:pl-0">
                            <div className="text-right">
                              <span className="font-bold text-primary text-sm sm:text-base">
                                RM {(campaign.spent_amount / 100).toLocaleString()}
                              </span>
                              <p className="text-xs text-muted-foreground">{t("admin.metaAdsPage.spent")}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8"
                                onClick={() => handleViewDetails(campaign)}
                                data-testid={`button-view-${campaign.id}`}
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">{t("admin.metaAdsPage.details")}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8"
                                onClick={() => handleOpenEdit(campaign)}
                                data-testid={`button-edit-${campaign.id}`}
                              >
                                <FileEdit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8"
                                onClick={() => handleConfirmDelete(campaign)}
                                data-testid={`button-delete-${campaign.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
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

      {/* Create / Edit Campaign Dialog */}
      <Dialog open={showCampaignModal} onOpenChange={setShowCampaignModal}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {editingCampaign
                ? t("admin.metaAdsPage.editCampaign")
                : t("admin.metaAdsPage.newCampaign")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingCampaign
                ? t("admin.metaAdsPage.editCampaignDesc")
                : t("admin.metaAdsPage.newCampaignDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            {/* Campaign Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.metaAdsPage.campaignName")} *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t("admin.metaAdsPage.campaignNamePlaceholder")}
                className="h-9 sm:h-10"
                data-testid="input-campaign-name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Platform */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.metaAdsPage.platform")}</label>
                <Select value={formData.platform} onValueChange={(val) => setFormData({ ...formData, platform: val })}>
                  <SelectTrigger className="h-9 sm:h-10" data-testid="select-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="both">Facebook + Instagram</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Objective */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.metaAdsPage.objective")}</label>
                <Select value={formData.objective} onValueChange={(val) => setFormData({ ...formData, objective: val })}>
                  <SelectTrigger className="h-9 sm:h-10" data-testid="select-objective">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">{t("admin.metaAdsPage.objectiveAwareness")}</SelectItem>
                    <SelectItem value="traffic">{t("admin.metaAdsPage.objectiveTraffic")}</SelectItem>
                    <SelectItem value="engagement">{t("admin.metaAdsPage.objectiveEngagement")}</SelectItem>
                    <SelectItem value="leads">{t("admin.metaAdsPage.objectiveLeads")}</SelectItem>
                    <SelectItem value="sales">{t("admin.metaAdsPage.objectiveSales")}</SelectItem>
                    <SelectItem value="app_promotion">{t("admin.metaAdsPage.objectiveAppPromotion")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Budget Type */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.metaAdsPage.budgetType")}</label>
                <Select value={formData.budget_type} onValueChange={(val) => setFormData({ ...formData, budget_type: val })}>
                  <SelectTrigger className="h-9 sm:h-10" data-testid="select-budget-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">{t("admin.metaAdsPage.budgetDaily")}</SelectItem>
                    <SelectItem value="lifetime">{t("admin.metaAdsPage.budgetLifetime")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Budget Amount */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.metaAdsPage.budgetAmount")} (RM) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.budget_amount}
                  onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                  placeholder="0.00"
                  className="h-9 sm:h-10"
                  data-testid="input-budget-amount"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.metaAdsPage.startDate")}</label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="h-9 sm:h-10"
                  data-testid="input-start-date"
                />
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.metaAdsPage.endDate")}</label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  className="h-9 sm:h-10"
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.metaAdsPage.notes")}</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t("admin.metaAdsPage.notesPlaceholder")}
                className="min-h-[80px]"
                data-testid="input-campaign-notes"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCampaignModal(false)} className="w-full sm:w-auto">
              {t("admin.metaAdsPage.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCampaignMutation.isPending || updateCampaignMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-confirm-campaign"
            >
              {(createCampaignMutation.isPending || updateCampaignMutation.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingCampaign
                ? t("admin.metaAdsPage.save")
                : t("admin.metaAdsPage.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Details Dialog */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="w-[95vw] max-w-[700px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <span className="truncate">{t("admin.metaAdsPage.campaignDetails")} - {selectedCampaign?.name}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedCampaign && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.metaAdsPage.status")}</p>
                  <Badge className={`${getStatusConfig(selectedCampaign.status).bg} text-xs`}>
                    {getStatusConfig(selectedCampaign.status).label}
                  </Badge>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.metaAdsPage.platform")}</p>
                  <Badge className={`${getPlatformConfig(selectedCampaign.platform).bg} ${getPlatformConfig(selectedCampaign.platform).color} text-xs`}>
                    {getPlatformConfig(selectedCampaign.platform).label}
                  </Badge>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("admin.metaAdsPage.objective")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">{getObjectiveLabel(selectedCampaign.objective)}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("admin.metaAdsPage.budget")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    RM {(selectedCampaign.budget_amount / 100).toLocaleString()} ({getBudgetTypeLabel(selectedCampaign.budget_type)})
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("admin.metaAdsPage.spent")}
                  </p>
                  <p className="font-bold text-primary text-sm sm:text-base">
                    RM {(selectedCampaign.spent_amount / 100).toLocaleString()}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t("admin.metaAdsPage.dateRange")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {formatDate(selectedCampaign.start_date)} ~ {formatDate(selectedCampaign.end_date)}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.metaAdsPage.createdAt")}</p>
                  <p className="font-medium text-sm sm:text-base">{formatDateTime(selectedCampaign.created_at)}</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.metaAdsPage.updatedAt")}</p>
                  <p className="font-medium text-sm sm:text-base">{formatDateTime(selectedCampaign.updated_at)}</p>
                </div>
              </div>

              {/* Budget Progress */}
              <div className="p-3 sm:p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t("admin.metaAdsPage.budgetUsage")}</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedCampaign.budget_amount > 0
                      ? Math.min(100, Math.round((selectedCampaign.spent_amount / selectedCampaign.budget_amount) * 100))
                      : 0}%
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{
                      width: `${selectedCampaign.budget_amount > 0
                        ? Math.min(100, (selectedCampaign.spent_amount / selectedCampaign.budget_amount) * 100)
                        : 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>RM {(selectedCampaign.spent_amount / 100).toLocaleString()} {t("admin.metaAdsPage.spent")}</span>
                  <span>RM {(selectedCampaign.budget_amount / 100).toLocaleString()} {t("admin.metaAdsPage.budget")}</span>
                </div>
              </div>

              {/* Ad Account */}
              {selectedCampaign.ad_account_id && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.metaAdsPage.adAccountId")}</p>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{selectedCampaign.ad_account_id}</p>
                </div>
              )}

              {/* Notes */}
              {selectedCampaign.notes && (
                <>
                  <Separator />
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.metaAdsPage.notes")}</p>
                    <p className="text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg">{selectedCampaign.notes}</p>
                  </div>
                </>
              )}

              {/* Ad Sets Tree */}
              <Separator />
              <div className="p-3 sm:p-4 border rounded-lg bg-primary/5">
                <h4 className="font-medium flex items-center gap-2 mb-3 text-sm sm:text-base">
                  <Layers className="w-4 h-4 text-primary" />
                  {t("admin.metaAdsPage.adSets")}
                </h4>
                <div className="text-xs sm:text-sm text-muted-foreground text-center py-6">
                  {t("admin.metaAdsPage.noAdSets")}
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2 justify-end pt-2 sm:pt-4">
                {selectedCampaign.status === "draft" && (
                  <Button
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedCampaign.id, status: "active" });
                      setSelectedCampaign({ ...selectedCampaign, status: "active" });
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("admin.metaAdsPage.activate")}
                  </Button>
                )}
                {selectedCampaign.status === "active" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedCampaign.id, status: "paused" });
                      setSelectedCampaign({ ...selectedCampaign, status: "paused" });
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Pause className="w-4 h-4 mr-2" />
                    {t("admin.metaAdsPage.pause")}
                  </Button>
                )}
                {selectedCampaign.status === "paused" && (
                  <Button
                    onClick={() => {
                      updateStatusMutation.mutate({ id: selectedCampaign.id, status: "active" });
                      setSelectedCampaign({ ...selectedCampaign, status: "active" });
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("admin.metaAdsPage.resume")}
                  </Button>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-3 sm:mt-4">
            <Button variant="outline" onClick={() => setShowDetailsModal(false)} className="w-full sm:w-auto">
              {t("admin.metaAdsPage.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="w-[95vw] max-w-[400px] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              {t("admin.metaAdsPage.deleteCampaign")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.metaAdsPage.deleteConfirm")}
            </DialogDescription>
          </DialogHeader>

          {selectedCampaign && (
            <div className="py-2 sm:py-4">
              <p className="text-sm">
                {t("admin.metaAdsPage.deleteWarning")}{" "}
                <span className="font-bold">{selectedCampaign.name}</span>
              </p>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)} className="w-full sm:w-auto">
              {t("admin.metaAdsPage.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedCampaign && deleteCampaignMutation.mutate(selectedCampaign.id)}
              disabled={deleteCampaignMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-confirm-delete"
            >
              {deleteCampaignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.metaAdsPage.confirmDelete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
