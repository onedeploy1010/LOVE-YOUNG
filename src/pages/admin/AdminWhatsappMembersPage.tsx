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
  ShoppingCart,
  ExternalLink,
} from "lucide-react";

interface WhatsappMember {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: string;
  points_balance: number | null;
  preferred_flavor: string | null;
  preferred_package: string | null;
  referral_code: string | null;
  referrer_id: string | null;
  whatsapp_phone: string | null;
  registration_source: string | null;
  whatsapp_conversation_id: string | null;
  created_at: string | null;
}

export default function AdminWhatsappMembersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WhatsappMember | null>(null);

  // Manual registration form state
  const [formPhone, setFormPhone] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");

  // Fetch members from main members table filtered by WhatsApp source
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["admin-whatsapp-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .or("registration_source.eq.whatsapp,whatsapp_phone.not.is.null")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching whatsapp members:", error);
        return [];
      }

      return (data || []) as WhatsappMember[];
    },
  });

  // Fetch order counts per member phone
  const { data: orderCounts = {} } = useQuery({
    queryKey: ["admin-whatsapp-members-orders"],
    queryFn: async () => {
      const phones = members.map((m) => m.phone).filter(Boolean);
      if (phones.length === 0) return {};
      const { data, error } = await supabase
        .from("orders")
        .select("customer_phone")
        .in("customer_phone", phones);
      if (error) return {};
      const counts: Record<string, number> = {};
      (data || []).forEach((o: { customer_phone: string }) => {
        counts[o.customer_phone] = (counts[o.customer_phone] || 0) + 1;
      });
      return counts;
    },
    enabled: members.length > 0,
  });

  // Fetch partner status per member
  const { data: partnerMap = {} } = useQuery({
    queryKey: ["admin-whatsapp-members-partners"],
    queryFn: async () => {
      const memberIds = members.map((m) => m.id);
      if (memberIds.length === 0) return {};
      const { data, error } = await supabase
        .from("partners")
        .select("member_id, status, tier")
        .in("member_id", memberIds);
      if (error) return {};
      const map: Record<string, { status: string; tier: string }> = {};
      (data || []).forEach((p: { member_id: string; status: string; tier: string }) => {
        map[p.member_id] = { status: p.status, tier: p.tier };
      });
      return map;
    },
    enabled: members.length > 0,
  });

  // Create member mutation
  const createMemberMutation = useMutation({
    mutationFn: async (data: {
      phone: string;
      name: string;
      email: string;
    }) => {
      const { error } = await supabase.from("members").insert({
        phone: data.phone,
        name: data.name || data.phone,
        email: data.email || null,
        role: "member",
        registration_source: "whatsapp",
        whatsapp_phone: data.phone,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-members"] });
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

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("members")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-whatsapp-members"] });
      setShowDetailDialog(false);
      setSelectedMember(null);
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
    createMemberMutation.mutate({
      phone: formPhone.trim(),
      name: formName.trim(),
      email: formEmail.trim(),
    });
  };

  const handleViewDetail = (member: WhatsappMember) => {
    setSelectedMember(member);
    setShowDetailDialog(true);
  };

  const handleDelete = (id: string) => {
    deleteMemberMutation.mutate(id);
  };

  // Filter logic
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      searchQuery === "" ||
      m.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "all") return matchesSearch;
    if (activeTab === "partner") return matchesSearch && !!partnerMap[m.id];
    if (activeTab === "with_orders") return matchesSearch && (orderCounts[m.phone] || 0) > 0;
    if (activeTab === "new") return matchesSearch && !partnerMap[m.id] && (orderCounts[m.phone] || 0) === 0;
    return matchesSearch;
  });

  // Stats
  const totalCount = members.length;
  const withOrdersCount = members.filter((m) => (orderCounts[m.phone] || 0) > 0).length;
  const partnerCount = members.filter((m) => !!partnerMap[m.id]).length;
  const conversionRate = totalCount > 0 ? ((withOrdersCount / totalCount) * 100).toFixed(1) : "0.0";

  const getRoleBadge = (member: WhatsappMember) => {
    const partner = partnerMap[member.id];
    if (partner) {
      return (
        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/20">
          Partner ({partner.tier})
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
        {t("admin.whatsappMembersPage.statusCompleted")}
      </Badge>
    );
  };

  const getSourceBadge = (source: string | null) => {
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
        return <Badge variant="outline">{source || "WhatsApp"}</Badge>;
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
    { value: "with_orders", label: t("admin.whatsappMembersPage.withOrders") || "With Orders" },
    { value: "partner", label: t("admin.whatsappMembersPage.partners") || "Partners" },
    { value: "new", label: t("admin.whatsappMembersPage.newMembers") || "New" },
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
                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-green-500">{withOrdersCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappMembersPage.withOrders") || "With Orders"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-purple-500">{partnerCount}</p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {t("admin.whatsappMembersPage.partners") || "Partners"}
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

            {/* Member List */}
            {filteredMembers.length === 0 ? (
              <div className="text-center py-12">
                <UserPlus className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {t("admin.whatsappMembersPage.noRegistrations")}
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3"
                  >
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="font-medium text-sm sm:text-base truncate">
                            {member.name}
                          </span>
                          {getSourceBadge(member.registration_source)}
                          {getRoleBadge(member)}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {member.phone}
                          </span>
                          {member.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3" />
                              {member.email}
                            </span>
                          )}
                          {(orderCounts[member.phone] || 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <ShoppingCart className="w-3 h-3" />
                              {orderCounts[member.phone]} orders
                            </span>
                          )}
                          <span className="shrink-0">{formatDate(member.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 pl-12 sm:pl-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 h-8"
                        onClick={() => handleViewDetail(member)}
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
                        onClick={() => handleDelete(member.id)}
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

          {selectedMember && (
            <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {t("admin.whatsappMembersPage.name")}
                  </p>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {selectedMember.name}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {t("admin.whatsappMembersPage.phone")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {selectedMember.phone}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {t("admin.whatsappMembersPage.email")}
                  </p>
                  <p className="font-medium text-sm sm:text-base truncate">
                    {selectedMember.email || "-"}
                  </p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.status")}
                  </p>
                  {getRoleBadge(selectedMember)}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.source")}
                  </p>
                  {getSourceBadge(selectedMember.registration_source)}
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.createdAt")}
                  </p>
                  <p className="font-medium text-sm sm:text-base">
                    {formatDateTime(selectedMember.created_at)}
                  </p>
                </div>
              </div>

              {/* Order count info */}
              {(orderCounts[selectedMember.phone] || 0) > 0 && (
                <div className="p-3 sm:p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-blue-500 shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {orderCounts[selectedMember.phone]} {t("admin.whatsappMembersPage.totalOrders") || "Total Orders"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Partner info */}
              {partnerMap[selectedMember.id] && (
                <div className="p-3 sm:p-4 border rounded-lg bg-purple-500/5 border-purple-500/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-500 shrink-0" />
                      <div>
                        <p className="font-medium text-sm sm:text-base">
                          {t("admin.whatsappMembersPage.memberLinked")}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Tier: {partnerMap[selectedMember.id].tier} | Status: {partnerMap[selectedMember.id].status}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* WhatsApp conversation link */}
              {selectedMember.whatsapp_conversation_id && (
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {t("admin.whatsappMembersPage.conversationId")}
                  </p>
                  <p className="font-mono text-xs sm:text-sm bg-muted p-2.5 sm:p-3 rounded-lg break-all">
                    {selectedMember.whatsapp_conversation_id}
                  </p>
                </div>
              )}

              {/* View Full Profile link */}
              <Button variant="outline" className="w-full gap-2" asChild>
                <a href="/admin/members">
                  <ExternalLink className="w-4 h-4" />
                  {t("admin.whatsappMembersPage.viewMemberProfile")}
                </a>
              </Button>
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
              disabled={createMemberMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMemberMutation.isPending && (
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
