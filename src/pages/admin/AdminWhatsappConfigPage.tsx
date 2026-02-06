import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Settings,
  Send,
  Plus,
  Edit,
  Trash2,
  Phone,
  Globe,
  Mail,
  Clock,
  Bell,
  Loader2,
  Users,
} from "lucide-react";

// --- Interfaces ---

interface WhatsappConfig {
  id: string;
  business_phone_id: string | null;
  whatsapp_business_account_id: string | null;
  access_token: string | null;
  webhook_verify_token: string | null;
  webhook_url: string | null;
  business_name: string | null;
  business_description: string | null;
  business_address: string | null;
  business_email: string | null;
  business_website: string | null;
  admin_phone_numbers: string[] | null;
  notification_enabled: boolean;
  auto_reply_enabled: boolean;
  auto_reply_message: string | null;
  working_hours: { start: string; end: string } | null;
  created_at: string;
  updated_at: string;
}

interface WhatsappTemplate {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  header_type: string | null;
  header_content: string | null;
  body_text: string;
  footer_text: string | null;
  buttons: unknown | null;
  meta_template_id: string | null;
  variables: string[] | null;
  created_at: string;
  updated_at: string;
}

interface WhatsappMessage {
  id: string;
  sender_type: string;
  content: string;
  push_type: string | null;
  push_target: string | null;
  created_at: string;
}

// --- Default config shape ---

const defaultConfig: Omit<WhatsappConfig, "created_at" | "updated_at"> = {
  id: "default",
  business_phone_id: "",
  whatsapp_business_account_id: "",
  access_token: "",
  webhook_verify_token: "",
  webhook_url: "",
  business_name: "",
  business_description: "",
  business_address: "",
  business_email: "",
  business_website: "",
  admin_phone_numbers: [],
  notification_enabled: false,
  auto_reply_enabled: false,
  auto_reply_message: "",
  working_hours: { start: "09:00", end: "18:00" },
};

export default function AdminWhatsappConfigPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState<"api" | "profile" | "templates" | "push">("api");

  // --- API Config state ---
  const [configForm, setConfigForm] = useState<Omit<WhatsappConfig, "created_at" | "updated_at">>(defaultConfig);

  // --- Template dialog state ---
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsappTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    language: "zh_CN",
    category: "UTILITY",
    body_text: "",
    footer_text: "",
    variables: "",
  });

  // --- Push form state ---
  const [pushType, setPushType] = useState("order_notification");
  const [pushTarget, setPushTarget] = useState("all");
  const [pushContent, setPushContent] = useState("");
  const [sendingPush, setSendingPush] = useState(false);

  // ============================================================
  // DATA FETCHING
  // ============================================================

  // Fetch WhatsApp config
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["whatsapp-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_config")
        .select("*")
        .eq("id", "default")
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching whatsapp config:", error);
        return null;
      }

      if (data) {
        const cfg = data as WhatsappConfig;
        setConfigForm({
          id: cfg.id,
          business_phone_id: cfg.business_phone_id || "",
          whatsapp_business_account_id: cfg.whatsapp_business_account_id || "",
          access_token: cfg.access_token || "",
          webhook_verify_token: cfg.webhook_verify_token || "",
          webhook_url: cfg.webhook_url || "",
          business_name: cfg.business_name || "",
          business_description: cfg.business_description || "",
          business_address: cfg.business_address || "",
          business_email: cfg.business_email || "",
          business_website: cfg.business_website || "",
          admin_phone_numbers: cfg.admin_phone_numbers || [],
          notification_enabled: cfg.notification_enabled ?? false,
          auto_reply_enabled: cfg.auto_reply_enabled ?? false,
          auto_reply_message: cfg.auto_reply_message || "",
          working_hours: cfg.working_hours || { start: "09:00", end: "18:00" },
        });
        return cfg;
      }

      return null;
    },
  });

  // Fetch templates
  const { data: templates = [], isLoading: loadingTemplates } = useQuery({
    queryKey: ["whatsapp-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_templates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching whatsapp templates:", error);
        return [];
      }

      return (data || []) as WhatsappTemplate[];
    },
  });

  // Fetch push history
  const { data: pushHistory = [], isLoading: loadingPushHistory } = useQuery({
    queryKey: ["whatsapp-push-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("sender_type", "admin")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching push history:", error);
        return [];
      }

      return (data || []) as WhatsappMessage[];
    },
  });

  // ============================================================
  // MUTATIONS
  // ============================================================

  // Save config (upsert)
  const saveConfigMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        id: "default",
        business_phone_id: configForm.business_phone_id || null,
        whatsapp_business_account_id: configForm.whatsapp_business_account_id || null,
        access_token: configForm.access_token || null,
        webhook_verify_token: configForm.webhook_verify_token || null,
        webhook_url: configForm.webhook_url || null,
        business_name: configForm.business_name || null,
        business_description: configForm.business_description || null,
        business_address: configForm.business_address || null,
        business_email: configForm.business_email || null,
        business_website: configForm.business_website || null,
        admin_phone_numbers: configForm.admin_phone_numbers,
        notification_enabled: configForm.notification_enabled,
        auto_reply_enabled: configForm.auto_reply_enabled,
        auto_reply_message: configForm.auto_reply_message || null,
        working_hours: configForm.working_hours,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("whatsapp_config")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-config"] });
      toast({ title: t("admin.whatsappConfigPage.configSaved") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappConfigPage.configSaveFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Create / update template
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      const variablesArray = templateForm.variables
        ? templateForm.variables.split(",").map((v) => v.trim()).filter(Boolean)
        : null;

      const payload = {
        name: templateForm.name,
        language: templateForm.language,
        category: templateForm.category,
        body_text: templateForm.body_text,
        footer_text: templateForm.footer_text || null,
        variables: variablesArray,
        status: "draft",
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from("whatsapp_templates")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("whatsapp_templates")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      setShowTemplateDialog(false);
      setEditingTemplate(null);
      resetTemplateForm();
      toast({
        title: editingTemplate
          ? t("admin.whatsappConfigPage.templateUpdated")
          : t("admin.whatsappConfigPage.templateCreated"),
      });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappConfigPage.templateSaveFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Delete template
  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whatsapp_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-templates"] });
      toast({ title: t("admin.whatsappConfigPage.templateDeleted") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappConfigPage.templateDeleteFailed"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Send push notification
  const sendPushMutation = useMutation({
    mutationFn: async () => {
      setSendingPush(true);
      const { error } = await supabase.from("whatsapp_messages").insert({
        sender_type: "admin",
        content: pushContent,
        push_type: pushType,
        push_target: pushTarget,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-push-history"] });
      setPushContent("");
      toast({ title: t("admin.whatsappConfigPage.pushSent") });
      setSendingPush(false);
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappConfigPage.pushFailed"),
        description: String(error),
        variant: "destructive",
      });
      setSendingPush(false);
    },
  });

  // ============================================================
  // HELPERS
  // ============================================================

  const resetTemplateForm = () => {
    setTemplateForm({
      name: "",
      language: "zh_CN",
      category: "UTILITY",
      body_text: "",
      footer_text: "",
      variables: "",
    });
  };

  const openNewTemplate = () => {
    setEditingTemplate(null);
    resetTemplateForm();
    setShowTemplateDialog(true);
  };

  const openEditTemplate = (tpl: WhatsappTemplate) => {
    setEditingTemplate(tpl);
    setTemplateForm({
      name: tpl.name,
      language: tpl.language,
      category: tpl.category,
      body_text: tpl.body_text,
      footer_text: tpl.footer_text || "",
      variables: tpl.variables ? tpl.variables.join(", ") : "",
    });
    setShowTemplateDialog(true);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "MARKETING":
        return "bg-purple-500/10 text-purple-600";
      case "UTILITY":
        return "bg-blue-500/10 text-blue-600";
      case "AUTHENTICATION":
        return "bg-orange-500/10 text-orange-600";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500/10 text-green-600";
      case "pending":
        return "bg-yellow-500/10 text-yellow-600";
      case "rejected":
        return "bg-red-500/10 text-red-600";
      case "draft":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPushTypeLabel = (type: string) => {
    switch (type) {
      case "order_notification":
        return t("admin.whatsappConfigPage.pushTypeOrder");
      case "customer_message":
        return t("admin.whatsappConfigPage.pushTypeCustomer");
      case "system_notification":
        return t("admin.whatsappConfigPage.pushTypeSystem");
      case "marketing_push":
        return t("admin.whatsappConfigPage.pushTypeMarketing");
      default:
        return type;
    }
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

  const adminPhoneString = (configForm.admin_phone_numbers || []).join(", ");

  const isLoading = loadingConfig || loadingTemplates || loadingPushHistory;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  // ============================================================
  // TAB DEFINITIONS
  // ============================================================

  const tabs = [
    { key: "api" as const, label: t("admin.whatsappConfigPage.apiConfig"), icon: Settings },
    { key: "profile" as const, label: t("admin.whatsappConfigPage.businessProfile"), icon: Globe },
    { key: "templates" as const, label: t("admin.whatsappConfigPage.messageTemplates"), icon: MessageSquare },
    { key: "push" as const, label: t("admin.whatsappConfigPage.adminPush"), icon: Bell },
    { key: "admins" as const, label: t("admin.whatsappConfigPage.adminManagement") || "Admin Management", icon: Users },
  ];

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-primary">
            {t("admin.whatsappConfigPage.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("admin.whatsappConfigPage.subtitle")}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "outline"}
                size="sm"
                className="gap-1.5 text-xs sm:text-sm"
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">
                  {tab.key === "api" && t("admin.whatsappConfigPage.apiConfig")}
                  {tab.key === "profile" && t("admin.whatsappConfigPage.businessProfile")}
                  {tab.key === "templates" && t("admin.whatsappConfigPage.messageTemplates")}
                  {tab.key === "push" && t("admin.whatsappConfigPage.adminPush")}
                </span>
              </Button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: API Configuration */}
        {/* ============================================================ */}
        {activeTab === "api" && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.whatsappConfigPage.apiConfig")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappConfigPage.businessPhoneId")}
                </label>
                <Input
                  value={configForm.business_phone_id || ""}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, business_phone_id: e.target.value })
                  }
                  placeholder="e.g. 1234567890"
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappConfigPage.whatsappBusinessAccountId")}
                </label>
                <Input
                  value={configForm.whatsapp_business_account_id || ""}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      whatsapp_business_account_id: e.target.value,
                    })
                  }
                  placeholder="e.g. 9876543210"
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappConfigPage.accessToken")}
                </label>
                <Input
                  type="password"
                  value={configForm.access_token || ""}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, access_token: e.target.value })
                  }
                  placeholder="EAAx..."
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappConfigPage.webhookVerifyToken")}
                </label>
                <Input
                  value={configForm.webhook_verify_token || ""}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, webhook_verify_token: e.target.value })
                  }
                  placeholder="your_verify_token"
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappConfigPage.webhookUrl")}
                </label>
                <Input
                  value={configForm.webhook_url || ""}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, webhook_url: e.target.value })
                  }
                  placeholder="https://your-domain.com/api/whatsapp/webhook"
                  className="h-9 sm:h-10"
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => saveConfigMutation.mutate()}
                  disabled={saveConfigMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {saveConfigMutation.isPending && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {t("admin.whatsappConfigPage.saveConfig")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================================ */}
        {/* TAB 2: Business Profile */}
        {/* ============================================================ */}
        {activeTab === "profile" && (
          <div className="space-y-4">
            {/* Business Info */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t("admin.whatsappConfigPage.businessInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">
                    {t("admin.whatsappConfigPage.businessName")}
                  </label>
                  <Input
                    value={configForm.business_name || ""}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, business_name: e.target.value })
                    }
                    className="h-9 sm:h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">
                    {t("admin.whatsappConfigPage.businessDescription")}
                  </label>
                  <Textarea
                    value={configForm.business_description || ""}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, business_description: e.target.value })
                    }
                    className="min-h-[80px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {t("admin.whatsappConfigPage.businessEmail")}
                    </label>
                    <Input
                      type="email"
                      value={configForm.business_email || ""}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, business_email: e.target.value })
                      }
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium flex items-center gap-1">
                      <Globe className="w-3.5 h-3.5" />
                      {t("admin.whatsappConfigPage.businessWebsite")}
                    </label>
                    <Input
                      value={configForm.business_website || ""}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, business_website: e.target.value })
                      }
                      className="h-9 sm:h-10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">
                    {t("admin.whatsappConfigPage.businessAddress")}
                  </label>
                  <Input
                    value={configForm.business_address || ""}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, business_address: e.target.value })
                    }
                    className="h-9 sm:h-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Admin Phones & Notification Settings */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t("admin.whatsappConfigPage.adminPhones")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">
                    {t("admin.whatsappConfigPage.adminPhoneNumbers")}
                  </label>
                  <Input
                    value={adminPhoneString}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        admin_phone_numbers: e.target.value
                          .split(",")
                          .map((p) => p.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="e.g. +60123456789, +60198765432"
                    className="h-9 sm:h-10"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("admin.whatsappConfigPage.adminPhoneHint")}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {t("admin.whatsappConfigPage.notificationEnabled")}
                    </span>
                  </div>
                  <Switch
                    checked={configForm.notification_enabled}
                    onCheckedChange={(checked) =>
                      setConfigForm({ ...configForm, notification_enabled: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {t("admin.whatsappConfigPage.autoReplyEnabled")}
                    </span>
                  </div>
                  <Switch
                    checked={configForm.auto_reply_enabled}
                    onCheckedChange={(checked) =>
                      setConfigForm({ ...configForm, auto_reply_enabled: checked })
                    }
                  />
                </div>

                {configForm.auto_reply_enabled && (
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">
                      {t("admin.whatsappConfigPage.autoReplyMessage")}
                    </label>
                    <Textarea
                      value={configForm.auto_reply_message || ""}
                      onChange={(e) =>
                        setConfigForm({ ...configForm, auto_reply_message: e.target.value })
                      }
                      placeholder={t("admin.whatsappConfigPage.autoReplyPlaceholder")}
                      className="min-h-[80px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t("admin.whatsappConfigPage.workingHours")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">
                      {t("admin.whatsappConfigPage.workingHoursStart")}
                    </label>
                    <Input
                      type="time"
                      value={configForm.working_hours?.start || "09:00"}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          working_hours: {
                            start: e.target.value,
                            end: configForm.working_hours?.end || "18:00",
                          },
                        })
                      }
                      className="h-9 sm:h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">
                      {t("admin.whatsappConfigPage.workingHoursEnd")}
                    </label>
                    <Input
                      type="time"
                      value={configForm.working_hours?.end || "18:00"}
                      onChange={(e) =>
                        setConfigForm({
                          ...configForm,
                          working_hours: {
                            start: configForm.working_hours?.start || "09:00",
                            end: e.target.value,
                          },
                        })
                      }
                      className="h-9 sm:h-10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Profile Button */}
            <div className="flex justify-end">
              <Button
                onClick={() => saveConfigMutation.mutate()}
                disabled={saveConfigMutation.isPending}
                className="w-full sm:w-auto"
              >
                {saveConfigMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {t("admin.whatsappConfigPage.saveConfig")}
              </Button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: Message Templates */}
        {/* ============================================================ */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-base sm:text-lg font-medium flex items-center gap-2">
                <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.whatsappConfigPage.messageTemplates")} ({templates.length})
              </h2>
              <Button
                className="gap-2 bg-secondary text-secondary-foreground w-full sm:w-auto"
                onClick={openNewTemplate}
              >
                <Plus className="w-4 h-4" />
                {t("admin.whatsappConfigPage.newTemplate")}
              </Button>
            </div>

            {templates.length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {t("admin.whatsappConfigPage.noTemplates")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {templates.map((tpl) => (
                  <Card key={tpl.id}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm sm:text-base">{tpl.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {tpl.language}
                            </Badge>
                            <Badge className={`text-xs ${getCategoryColor(tpl.category)}`}>
                              {tpl.category}
                            </Badge>
                            <Badge className={`text-xs ${getStatusColor(tpl.status)}`}>
                              {tpl.status}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {tpl.body_text}
                          </p>
                          {tpl.variables && tpl.variables.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-muted-foreground">
                                {t("admin.whatsappConfigPage.variables")}:
                              </span>
                              {tpl.variables.map((v, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {v}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => openEditTemplate(tpl)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t("admin.whatsappConfigPage.edit")}
                            </span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-destructive hover:text-destructive"
                            onClick={() => deleteTemplateMutation.mutate(tpl.id)}
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">
                              {t("admin.whatsappConfigPage.delete")}
                            </span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: Admin Push */}
        {/* ============================================================ */}
        {activeTab === "push" && (
          <div className="space-y-4">
            {/* Send Push */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t("admin.whatsappConfigPage.sendPush")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">
                      {t("admin.whatsappConfigPage.pushType")}
                    </label>
                    <Select value={pushType} onValueChange={setPushType}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="order_notification">
                          {t("admin.whatsappConfigPage.pushTypeOrder")}
                        </SelectItem>
                        <SelectItem value="customer_message">
                          {t("admin.whatsappConfigPage.pushTypeCustomer")}
                        </SelectItem>
                        <SelectItem value="system_notification">
                          {t("admin.whatsappConfigPage.pushTypeSystem")}
                        </SelectItem>
                        <SelectItem value="marketing_push">
                          {t("admin.whatsappConfigPage.pushTypeMarketing")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-medium">
                      {t("admin.whatsappConfigPage.pushTarget")}
                    </label>
                    <Select value={pushTarget} onValueChange={setPushTarget}>
                      <SelectTrigger className="h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          {t("admin.whatsappConfigPage.pushTargetAll")}
                        </SelectItem>
                        {(configForm.admin_phone_numbers || []).map((phone) => (
                          <SelectItem key={phone} value={phone}>
                            {phone}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-medium">
                    {t("admin.whatsappConfigPage.pushContent")}
                  </label>
                  <Textarea
                    value={pushContent}
                    onChange={(e) => setPushContent(e.target.value)}
                    placeholder={t("admin.whatsappConfigPage.pushContentPlaceholder")}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => sendPushMutation.mutate()}
                    disabled={sendingPush || !pushContent.trim()}
                    className="w-full sm:w-auto gap-2"
                  >
                    {sendingPush ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {t("admin.whatsappConfigPage.sendButton")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Push History */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {t("admin.whatsappConfigPage.pushHistory")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
                {pushHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <Send className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      {t("admin.whatsappConfigPage.noPushHistory")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {pushHistory.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg gap-2"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {msg.push_type && (
                              <Badge variant="outline" className="text-xs">
                                {getPushTypeLabel(msg.push_type)}
                              </Badge>
                            )}
                            {msg.push_target && (
                              <Badge variant="secondary" className="text-xs">
                                {msg.push_target === "all"
                                  ? t("admin.whatsappConfigPage.pushTargetAll")
                                  : msg.push_target}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                            {msg.content}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDateTime(msg.created_at)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: Admin Management */}
        {/* ============================================================ */}
        {activeTab === "admins" && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{t("admin.whatsappConfigPage.adminManagement") || "Admin Management"}</h3>
                  <p className="text-sm text-muted-foreground">{t("admin.whatsappConfigPage.adminManagementDesc") || "Manage WhatsApp admin accounts and conversation assignments"}</p>
                </div>
                <Button onClick={() => window.location.href = "/admin/whatsapp/admins"} className="gap-2">
                  <Users className="w-4 h-4" />
                  {t("admin.whatsappConfigPage.goToAdminManagement") || "Manage Admins"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ============================================================ */}
      {/* Template Dialog */}
      {/* ============================================================ */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {editingTemplate
                ? t("admin.whatsappConfigPage.editTemplate")
                : t("admin.whatsappConfigPage.newTemplate")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {editingTemplate
                ? t("admin.whatsappConfigPage.editTemplateDesc")
                : t("admin.whatsappConfigPage.newTemplateDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappConfigPage.templateName")} *
              </label>
              <Input
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, name: e.target.value })
                }
                placeholder={t("admin.whatsappConfigPage.templateNamePlaceholder")}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappConfigPage.templateLanguage")}
                </label>
                <Select
                  value={templateForm.language}
                  onValueChange={(val) =>
                    setTemplateForm({ ...templateForm, language: val })
                  }
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh_CN">zh_CN</SelectItem>
                    <SelectItem value="en">en</SelectItem>
                    <SelectItem value="ms">ms</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs sm:text-sm font-medium">
                  {t("admin.whatsappConfigPage.templateCategory")}
                </label>
                <Select
                  value={templateForm.category}
                  onValueChange={(val) =>
                    setTemplateForm({ ...templateForm, category: val })
                  }
                >
                  <SelectTrigger className="h-9 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MARKETING">MARKETING</SelectItem>
                    <SelectItem value="UTILITY">UTILITY</SelectItem>
                    <SelectItem value="AUTHENTICATION">AUTHENTICATION</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappConfigPage.templateBody")} *
              </label>
              <Textarea
                value={templateForm.body_text}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, body_text: e.target.value })
                }
                placeholder={t("admin.whatsappConfigPage.templateBodyPlaceholder")}
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappConfigPage.templateFooter")}
              </label>
              <Input
                value={templateForm.footer_text}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, footer_text: e.target.value })
                }
                placeholder={t("admin.whatsappConfigPage.templateFooterPlaceholder")}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-medium">
                {t("admin.whatsappConfigPage.templateVariables")}
              </label>
              <Input
                value={templateForm.variables}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, variables: e.target.value })
                }
                placeholder="e.g. customer_name, order_id, amount"
                className="h-9 sm:h-10"
              />
              <p className="text-xs text-muted-foreground">
                {t("admin.whatsappConfigPage.templateVariablesHint")}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowTemplateDialog(false);
                setEditingTemplate(null);
                resetTemplateForm();
              }}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappConfigPage.cancel")}
            </Button>
            <Button
              onClick={() => saveTemplateMutation.mutate()}
              disabled={
                saveTemplateMutation.isPending ||
                !templateForm.name.trim() ||
                !templateForm.body_text.trim()
              }
              className="w-full sm:w-auto"
            >
              {saveTemplateMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingTemplate
                ? t("admin.whatsappConfigPage.updateTemplate")
                : t("admin.whatsappConfigPage.createTemplate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
