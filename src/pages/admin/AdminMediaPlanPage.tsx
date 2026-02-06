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
  Calendar, Search, Plus, Edit, Trash2,
  List, LayoutGrid, Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface MediaPlan {
  id: string;
  title: string;
  description: string | null;
  platform: string;
  content_type: string;
  status: string;
  scheduled_date: string | null;
  scheduled_time: string | null;
  assigned_to: string | null;
  content_url: string | null;
  media_urls: string[] | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface PlanFormData {
  title: string;
  description: string;
  platform: string;
  content_type: string;
  scheduled_date: string;
  scheduled_time: string;
  assigned_to: string;
  content_url: string;
  notes: string;
}

const PLATFORMS = ["facebook", "instagram", "xiaohongshu", "tiktok", "youtube", "website"] as const;
const CONTENT_TYPES = ["post", "story", "reel", "video", "article", "live"] as const;
const STATUSES = ["planned", "in_progress", "ready", "published"] as const;

const emptyForm: PlanFormData = {
  title: "",
  description: "",
  platform: "",
  content_type: "",
  scheduled_date: "",
  scheduled_time: "",
  assigned_to: "",
  content_url: "",
  notes: "",
};

export default function AdminMediaPlanPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MediaPlan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<MediaPlan | null>(null);
  const [formData, setFormData] = useState<PlanFormData>(emptyForm);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  // Fetch media plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["admin-media-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_publishing_plan")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (error) {
        console.error("Error fetching media plans:", error);
        return [];
      }

      return (data || []) as MediaPlan[];
    },
  });

  // Create mutation
  const createPlanMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const { error } = await supabase.from("media_publishing_plan").insert({
        title: data.title,
        description: data.description || null,
        platform: data.platform,
        content_type: data.content_type,
        status: "planned",
        scheduled_date: data.scheduled_date || null,
        scheduled_time: data.scheduled_time || null,
        assigned_to: data.assigned_to || null,
        content_url: data.content_url || null,
        notes: data.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-plans"] });
      setShowPlanModal(false);
      setFormData(emptyForm);
      toast({ title: t("admin.mediaPlanPage.createSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.mediaPlanPage.createError"), description: String(error), variant: "destructive" });
    },
  });

  // Update mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlanFormData }) => {
      const { error } = await supabase
        .from("media_publishing_plan")
        .update({
          title: data.title,
          description: data.description || null,
          platform: data.platform,
          content_type: data.content_type,
          scheduled_date: data.scheduled_date || null,
          scheduled_time: data.scheduled_time || null,
          assigned_to: data.assigned_to || null,
          content_url: data.content_url || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-plans"] });
      setShowPlanModal(false);
      setEditingPlan(null);
      setFormData(emptyForm);
      toast({ title: t("admin.mediaPlanPage.updateSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.mediaPlanPage.updateError"), description: String(error), variant: "destructive" });
    },
  });

  // Delete mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("media_publishing_plan")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-media-plans"] });
      setShowDeleteModal(false);
      setDeletingPlan(null);
      toast({ title: t("admin.mediaPlanPage.deleteSuccess") });
    },
    onError: (error) => {
      toast({ title: t("admin.mediaPlanPage.deleteError"), description: String(error), variant: "destructive" });
    },
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData(emptyForm);
    setShowPlanModal(true);
  };

  const handleOpenEdit = (plan: MediaPlan) => {
    setEditingPlan(plan);
    setFormData({
      title: plan.title,
      description: plan.description || "",
      platform: plan.platform,
      content_type: plan.content_type,
      scheduled_date: plan.scheduled_date || "",
      scheduled_time: plan.scheduled_time || "",
      assigned_to: plan.assigned_to || "",
      content_url: plan.content_url || "",
      notes: plan.notes || "",
    });
    setShowPlanModal(true);
  };

  const handleOpenDelete = (plan: MediaPlan) => {
    setDeletingPlan(plan);
    setShowDeleteModal(true);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.platform || !formData.content_type) {
      toast({ title: t("admin.mediaPlanPage.validationError"), variant: "destructive" });
      return;
    }
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data: formData });
    } else {
      createPlanMutation.mutate(formData);
    }
  };

  const getPlatformConfig = (platform: string) => {
    switch (platform) {
      case "facebook": return { label: "Facebook", color: "bg-blue-500/10 text-blue-600" };
      case "instagram": return { label: "Instagram", color: "bg-pink-500/10 text-pink-600" };
      case "xiaohongshu": return { label: t("admin.mediaPlanPage.platformXiaohongshu"), color: "bg-red-500/10 text-red-600" };
      case "tiktok": return { label: "TikTok", color: "bg-slate-800/10 text-slate-700" };
      case "youtube": return { label: "YouTube", color: "bg-red-600/10 text-red-700" };
      case "website": return { label: t("admin.mediaPlanPage.platformWebsite"), color: "bg-green-500/10 text-green-600" };
      default: return { label: platform, color: "bg-muted text-muted-foreground" };
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "post": return t("admin.mediaPlanPage.typePost");
      case "story": return t("admin.mediaPlanPage.typeStory");
      case "reel": return t("admin.mediaPlanPage.typeReel");
      case "video": return t("admin.mediaPlanPage.typeVideo");
      case "article": return t("admin.mediaPlanPage.typeArticle");
      case "live": return t("admin.mediaPlanPage.typeLive");
      default: return type;
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "planned": return { label: t("admin.mediaPlanPage.statusPlanned"), color: "bg-yellow-500/10 text-yellow-600" };
      case "in_progress": return { label: t("admin.mediaPlanPage.statusInProgress"), color: "bg-blue-500/10 text-blue-600" };
      case "ready": return { label: t("admin.mediaPlanPage.statusReady"), color: "bg-purple-500/10 text-purple-600" };
      case "published": return { label: t("admin.mediaPlanPage.statusPublished"), color: "bg-green-500/10 text-green-600" };
      default: return { label: status, color: "bg-muted text-muted-foreground" };
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      searchQuery === "" ||
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plan.assigned_to && plan.assigned_to.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab =
      activeTab === "all" || plan.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: plans.length,
    planned: plans.filter((p) => p.status === "planned").length,
    in_progress: plans.filter((p) => p.status === "in_progress").length,
    published: plans.filter((p) => p.status === "published").length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Calendar helpers
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();

  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay();

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  const getPlansForDay = (day: number) => {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return plans.filter((p) => p.scheduled_date === dateStr);
  };

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  };

  const weekDays = [
    t("admin.mediaPlanPage.sun"),
    t("admin.mediaPlanPage.mon"),
    t("admin.mediaPlanPage.tue"),
    t("admin.mediaPlanPage.wed"),
    t("admin.mediaPlanPage.thu"),
    t("admin.mediaPlanPage.fri"),
    t("admin.mediaPlanPage.sat"),
  ];

  const isMutating = createPlanMutation.isPending || updatePlanMutation.isPending;

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
            <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-media-plan-title">
              {t("admin.mediaPlanPage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">{t("admin.mediaPlanPage.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                className="rounded-none h-9"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "ghost"}
                size="sm"
                className="rounded-none h-9"
                onClick={() => setViewMode("calendar")}
                data-testid="button-view-calendar"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
            <Button
              className="gap-2 bg-secondary text-secondary-foreground"
              onClick={handleOpenCreate}
              data-testid="button-new-plan"
            >
              <Plus className="w-4 h-4" />
              {t("admin.mediaPlanPage.newPlan")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.mediaPlanPage.totalPlans")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-yellow-500">{stats.planned}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.mediaPlanPage.statusPlanned")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-blue-500">{stats.in_progress}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.mediaPlanPage.statusInProgress")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500">{stats.published}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{t("admin.mediaPlanPage.statusPublished")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List View */}
        {viewMode === "list" && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t("admin.mediaPlanPage.planList")}
                </CardTitle>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.mediaPlanPage.searchPlaceholder")}
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
                    {t("admin.mediaPlanPage.tabAll")}
                  </TabsTrigger>
                  <TabsTrigger value="planned" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-planned">
                    <span className="hidden sm:inline">{t("admin.mediaPlanPage.statusPlanned")}</span>
                    <span className="sm:hidden">{t("admin.mediaPlanPage.statusPlannedShort")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="in_progress" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-in-progress">
                    <span className="hidden sm:inline">{t("admin.mediaPlanPage.statusInProgress")}</span>
                    <span className="sm:hidden">{t("admin.mediaPlanPage.statusInProgressShort")}</span>
                  </TabsTrigger>
                  <TabsTrigger value="ready" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-ready">
                    {t("admin.mediaPlanPage.statusReady")}
                  </TabsTrigger>
                  <TabsTrigger value="published" className="text-xs sm:text-sm py-1.5 sm:py-2" data-testid="tab-published">
                    <span className="hidden sm:inline">{t("admin.mediaPlanPage.statusPublished")}</span>
                    <span className="sm:hidden">{t("admin.mediaPlanPage.statusPublishedShort")}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="mt-3 sm:mt-4">
                  {filteredPlans.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground">{t("admin.mediaPlanPage.noPlans")}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {filteredPlans.map((plan) => {
                        const platformConfig = getPlatformConfig(plan.platform);
                        const statusConfig = getStatusConfig(plan.status);
                        return (
                          <div
                            key={plan.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                            data-testid={`plan-${plan.id}`}
                          >
                            <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 ${platformConfig.color}`}>
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span className="font-medium text-sm sm:text-base truncate">{plan.title}</span>
                                  <Badge className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</Badge>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mt-1">
                                  <Badge variant="outline" className={`text-xs ${platformConfig.color}`}>
                                    {platformConfig.label}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {getContentTypeLabel(plan.content_type)}
                                  </Badge>
                                  {plan.scheduled_date && (
                                    <span className="text-xs text-muted-foreground">
                                      {formatDate(plan.scheduled_date)}
                                      {plan.scheduled_time ? ` ${plan.scheduled_time}` : ""}
                                    </span>
                                  )}
                                </div>
                                {plan.assigned_to && (
                                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                    {t("admin.mediaPlanPage.assignedTo")}: {plan.assigned_to}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 pl-12 sm:pl-0 shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8"
                                onClick={() => handleOpenEdit(plan)}
                                data-testid={`button-edit-${plan.id}`}
                              >
                                <Edit className="w-4 h-4" />
                                <span className="hidden sm:inline">{t("admin.mediaPlanPage.edit")}</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8 text-destructive hover:text-destructive"
                                onClick={() => handleOpenDelete(plan)}
                                data-testid={`button-delete-${plan.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
        )}

        {/* Calendar View */}
        {viewMode === "calendar" && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={handlePrevMonth} data-testid="button-prev-month">
                  &larr;
                </Button>
                <CardTitle className="text-base sm:text-lg">
                  {calendarDate.toLocaleDateString("zh-CN", { year: "numeric", month: "long" })}
                </CardTitle>
                <Button variant="outline" size="sm" onClick={handleNextMonth} data-testid="button-next-month">
                  &rarr;
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 pt-0 sm:pt-0">
              {/* Week header */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {weekDays.map((day) => (
                  <div key={day} className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px border rounded-lg overflow-hidden bg-border">
                {calendarDays.map((day, idx) => {
                  const dayPlans = day ? getPlansForDay(day) : [];
                  const today = new Date();
                  const isToday =
                    day === today.getDate() &&
                    calendarMonth === today.getMonth() &&
                    calendarYear === today.getFullYear();
                  return (
                    <div
                      key={idx}
                      className={`bg-background min-h-[60px] sm:min-h-[90px] p-1 sm:p-2 ${
                        day ? "" : "bg-muted/30"
                      }`}
                    >
                      {day && (
                        <>
                          <div
                            className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                              isToday
                                ? "bg-primary text-primary-foreground w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center"
                                : "text-muted-foreground"
                            }`}
                          >
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {dayPlans.slice(0, 3).map((plan) => {
                              const platformConfig = getPlatformConfig(plan.platform);
                              return (
                                <div
                                  key={plan.id}
                                  className={`text-[10px] sm:text-xs px-1 py-0.5 rounded truncate cursor-pointer ${platformConfig.color}`}
                                  title={`${plan.title} (${platformConfig.label})`}
                                  onClick={() => handleOpenEdit(plan)}
                                >
                                  <span className="hidden sm:inline">{plan.title}</span>
                                  <span className="sm:hidden">{platformConfig.label.slice(0, 2)}</span>
                                </div>
                              );
                            })}
                            {dayPlans.length > 3 && (
                              <div className="text-[10px] sm:text-xs text-muted-foreground pl-1">
                                +{dayPlans.length - 3}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create / Edit Plan Dialog */}
      <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              {editingPlan ? <Edit className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
              {editingPlan ? t("admin.mediaPlanPage.editPlan") : t("admin.mediaPlanPage.newPlan")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingPlan ? t("admin.mediaPlanPage.editPlanDesc") : t("admin.mediaPlanPage.newPlanDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldTitle")} *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t("admin.mediaPlanPage.fieldTitlePlaceholder")}
                className="h-9 sm:h-10"
                data-testid="input-plan-title"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldDescription")}</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t("admin.mediaPlanPage.fieldDescriptionPlaceholder")}
                className="min-h-[80px]"
                data-testid="input-plan-description"
              />
            </div>

            {/* Platform + Content Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldPlatform")} *</label>
                <Select value={formData.platform} onValueChange={(val) => setFormData({ ...formData, platform: val })}>
                  <SelectTrigger className="h-9 sm:h-10" data-testid="select-plan-platform">
                    <SelectValue placeholder={t("admin.mediaPlanPage.fieldPlatformPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {getPlatformConfig(p).label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldContentType")} *</label>
                <Select value={formData.content_type} onValueChange={(val) => setFormData({ ...formData, content_type: val })}>
                  <SelectTrigger className="h-9 sm:h-10" data-testid="select-plan-content-type">
                    <SelectValue placeholder={t("admin.mediaPlanPage.fieldContentTypePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_TYPES.map((ct) => (
                      <SelectItem key={ct} value={ct}>
                        {getContentTypeLabel(ct)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scheduled Date + Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldScheduledDate")}</label>
                <Input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="h-9 sm:h-10"
                  data-testid="input-plan-date"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldScheduledTime")}</label>
                <Input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  className="h-9 sm:h-10"
                  data-testid="input-plan-time"
                />
              </div>
            </div>

            {/* Assigned To */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldAssignedTo")}</label>
              <Input
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                placeholder={t("admin.mediaPlanPage.fieldAssignedToPlaceholder")}
                className="h-9 sm:h-10"
                data-testid="input-plan-assigned"
              />
            </div>

            {/* Content URL */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldContentUrl")}</label>
              <Input
                value={formData.content_url}
                onChange={(e) => setFormData({ ...formData, content_url: e.target.value })}
                placeholder={t("admin.mediaPlanPage.fieldContentUrlPlaceholder")}
                className="h-9 sm:h-10"
                data-testid="input-plan-url"
              />
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">{t("admin.mediaPlanPage.fieldNotes")}</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t("admin.mediaPlanPage.fieldNotesPlaceholder")}
                className="min-h-[80px]"
                data-testid="input-plan-notes"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPlanModal(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.mediaPlanPage.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isMutating}
              className="w-full sm:w-auto"
              data-testid="button-confirm-plan"
            >
              {isMutating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingPlan ? t("admin.mediaPlanPage.save") : t("admin.mediaPlanPage.create")}
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
              {t("admin.mediaPlanPage.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.mediaPlanPage.deleteConfirmDesc", "").replace("{{title}}", deletingPlan?.title || "")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.mediaPlanPage.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingPlan && deletePlanMutation.mutate(deletingPlan.id)}
              disabled={deletePlanMutation.isPending}
              className="w-full sm:w-auto"
              data-testid="button-confirm-delete"
            >
              {deletePlanMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("admin.mediaPlanPage.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
