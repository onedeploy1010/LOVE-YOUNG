import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  UserPlus,
  Search,
  Plus,
  Eye,
  Trash2,
  Phone,
  Mail,
  Users,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface WhatsappRegistration {
  id: string;
  customer_phone: string;
  customer_name: string | null;
  email: string | null;
  member_id: string | null;
  conversation_id: string | null;
  registration_source: string;
  status: string;
  metadata: unknown;
  created_at: string;
}

export default function AdminWhatsappMembersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<WhatsappRegistration | null>(null);

  // Manual registration form state
  const [formPhone, setFormPhone] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSource, setFormSource] = useState("manual");

  // Fetch registrations
  const { data: registrations = [], isLoading } = useQuery({
    queryKey: ["admin-whatsapp-registrations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching whatsapp registrations:", error);
        return [];
      }

      return (data || []) as WhatsappRegistration[];
    },
  });

  // Create registration mutation
  const createRegistrationMutation = useMutation({
    mutationFn: async (data: {
      customer_phone: string;
      customer_name: string;
      email: string;
      registration_source: string;
    }) => {
      const { error } = await supabase.from("whatsapp_registrations").insert({
        customer_phone: data.customer_phone,
        customer_name: data.customer_name || null,
        email: data.email || null,
        registration_source: data.registration_source,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-registrations"] });
      setShowAddDialog(false);
      resetForm();
      toast({ title: t("admin.whatsappMembersPage.createSuccess") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappMembersPage.createError"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  // Delete registration mutation
  const deleteRegistrationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whatsapp_registrations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-registrations"] });
      setShowDetailDialog(false);
      setSelectedRegistration(null);
      toast({ title: t("admin.whatsappMembersPage.deleteSuccess") });
    },
    onError: (error) => {
      toast({
        title: t("admin.whatsappMembersPage.deleteError"),
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormPhone("");
    setFormName("");
    setFormEmail("");
    setFormSource("manual");
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddDialog(true);
  };

  const handleSubmitAdd = () => {
    if (!formPhone.trim()) {
      toast({
        title: t("admin.whatsappMembersPage.phoneRequired"),
        variant: "destructive",
      });
      return;
    }
    createRegistrationMutation.mutate({
      customer_phone: formPhone.trim(),
      customer_name: formName.trim(),
      email: formEmail.trim(),
      registration_source: formSource,
    });
  };

  const handleViewDetail = (registration: WhatsappRegistration) => {
    setSelectedRegistration(registration);
    setShowDetailDialog(true);
  };

  const handleDelete = (id: string) => {
    deleteRegistrationMutation.mutate(id);
  };

  // Filter logic
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesSearch =
      searchQuery === "" ||
      reg.customer_phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.customer_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (reg.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || reg.status === activeTab;
    return matchesSearch && matchesTab;
  });

  // Stats
  const totalCount = registrations.length;
  const completedCount = registrations.filter((r) => r.status === "completed").length;
  const pendingCount = registrations.filter((r) => r.status === "pending").length;
  const conversionRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : "0.0";

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            {t("admin.whatsappMembersPage.statusPending")}
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            {t("admin.whatsappMembersPage.statusCompleted")}
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            {t("admin.whatsappMembersPage.statusFailed")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "whatsapp":
        return <Badge variant="secondary">WhatsApp</Badge>;
      case "manual":
        return <Badge variant="outline">{t("admin.whatsappMembersPage.sourceManual")}</Badge>;
      case "referral":
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20">
            {t("admin.whatsappMembersPage.sourceReferral")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{source}</Badge>;
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

  const tabs = [
    { value: "all", label: t("admin.whatsappMembersPage.tabAll") },
    { value: "pending", label: t("admin.whatsappMembersPage.statusPending") },
    { value: "completed", label: t("admin.whatsappMembersPage.statusCompleted") },
    { value: "failed", label: t("admin.whatsappMembersPage.statusFailed") },
  ];

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
              {t("admin.whatsappMembersPage.title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("admin.whatsappMembersPage.subtitle")}
            </p>
          </div>
          <Button
            className="gap-2 bg-secondary text-secondary-foreground w-full sm:w-auto"
            onClick={handleOpenAdd}
          >
            <Plus className="w-4 h-4" />
            {t("admin.whatsappMembersPage.addRegistration")}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{totalCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappMembersPage.totalRegistrations")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500">{completedCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappMembersPage.completedCount")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-yellow-500">{pendingCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappMembersPage.pendingCount")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{conversionRate}%</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappMembersPage.conversionRate")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 mb-4">
              <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {t("admin.whatsappMembersPage.registrationList")}
              </h2>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.whatsappMembersPage.searchPlaceholder")}
                  className="pl-9 h-9 sm:h-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Tab Buttons */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg mb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  className={`flex-1 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-3 rounded-md transition-colors ${
                    activeTab === tab.value
                      ? "bg-background text-foreground shadow-sm font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setActiveTab(tab.value)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Registration List */}
            {filteredRegistrations.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {t("admin.whatsappMembersPage.noRegistrations")}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredRegistrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-medium text-sm sm:text-base truncate">
                            {reg.customer_phone}
                          </span>
                          {getSourceBadge(reg.registration_source)}
                          {getStatusBadge(reg.status)}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                          {reg.customer_name && (
                            <span className="flex items-center gap-1 truncate">
                              <Users className="w-3 h-3" />
                              {reg.customer_name}
                            </span>
                          )}
                          {reg.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3" />
                              {reg.email}
                            </span>
                          )}
                          <span className="shrink-0">{formatDate(reg.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 pl-12 sm:pl-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-8"
                        onClick={() => handleViewDetail(reg)}
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {t("admin.whatsappMembersPage.viewDetail")}
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(reg.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.whatsappMembersPage.registrationDetail")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.whatsappMembersPage.registrationDetailDesc")}
            </DialogDescription>
          </DialogHeader>

          {selectedRegistration && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {t("admin.whatsappMembersPage.phone")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {selectedRegistration.customer_phone}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {t("admin.whatsappMembersPage.name")}
                  </p>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {selectedRegistration.customer_name || "-"}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {t("admin.whatsappMembersPage.email")}
                  </p>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {selectedRegistration.email || "-"}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.status")}
                  </p>
                  {getStatusBadge(selectedRegistration.status)}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.source")}
                  </p>
                  {getSourceBadge(selectedRegistration.registration_source)}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.createdAt")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {formatDateTime(selectedRegistration.created_at)}
                  </p>
                </div>
              </div>

              {selectedRegistration.conversation_id && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.conversationId")}
                  </p>
                  <p className="font-mono text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg break-all">
                    {selectedRegistration.conversation_id}
                  </p>
                </div>
              )}

              {selectedRegistration.member_id && (
                <div className="p-3 sm:p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">
                          {t("admin.whatsappMembersPage.memberLinked")}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground font-mono break-all">
                          {selectedRegistration.member_id}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="h-8 w-full sm:w-auto" asChild>
                      <a href={`/admin/members/${selectedRegistration.member_id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        {t("admin.whatsappMembersPage.viewMemberProfile")}
                      </a>
                    </Button>
                  </div>
                </div>
              )}

              {selectedRegistration.metadata && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.metadata")}
                  </p>
                  <pre className="text-xs bg-muted p-2.5 sm:p-3 rounded-lg overflow-x-auto">
                    {JSON.stringify(selectedRegistration.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-3 sm:mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDetailDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappMembersPage.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Registration Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.whatsappMembersPage.addRegistration")}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {t("admin.whatsappMembersPage.addRegistrationDesc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-2 sm:py-4">
            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                {t("admin.whatsappMembersPage.phone")} *
              </label>
              <Input
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder={t("admin.whatsappMembersPage.phonePlaceholder")}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {t("admin.whatsappMembersPage.name")}
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("admin.whatsappMembersPage.namePlaceholder")}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {t("admin.whatsappMembersPage.email")}
              </label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder={t("admin.whatsappMembersPage.emailPlaceholder")}
                className="h-9 sm:h-10"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <label className="text-sm font-medium">
                {t("admin.whatsappMembersPage.source")}
              </label>
              <Select value={formSource} onValueChange={setFormSource}>
                <SelectTrigger className="h-9 sm:h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="manual">
                    {t("admin.whatsappMembersPage.sourceManual")}
                  </SelectItem>
                  <SelectItem value="referral">
                    {t("admin.whatsappMembersPage.sourceReferral")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              className="w-full sm:w-auto"
            >
              {t("admin.whatsappMembersPage.cancel")}
            </Button>
            <Button
              onClick={handleSubmitAdd}
              disabled={createRegistrationMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createRegistrationMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {t("admin.whatsappMembersPage.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
