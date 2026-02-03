import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, Search, Star, Crown, Shield, Eye, Mail, Phone,
  Loader2, UserPlus, Network, RefreshCw, Trash2, Download,
  ArrowUpDown, MoreVertical
} from "lucide-react";

interface Member {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  points_balance: number;
  referral_code: string;
  referrer_id: string | null;
  created_at: string;
  orders_count?: number;
  referrer_name?: string;
  downline_count?: number;
  is_registered_only?: boolean; // true = user without member record
}

export default function AdminMembersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "name" | "points">("date_desc");
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fetch members from Supabase with users table join
  const { data: members = [], isLoading, refetch } = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => {
      // First get all members
      const { data: membersData, error: membersError } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });

      if (membersError) {
        console.error("Error fetching members:", membersError);
        return [];
      }

      // Get all users (including those without member records)
      const { data: usersData } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, phone, role, created_at");

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      // Track which user_ids already have a member record
      const memberUserIds = new Set(membersData?.map(m => m.user_id) || []);

      // Get orders count per member
      const { data: ordersData } = await supabase
        .from("orders")
        .select("member_id")
        .not("member_id", "is", null);

      const ordersCountMap = new Map<string, number>();
      ordersData?.forEach(o => {
        const count = ordersCountMap.get(o.member_id) || 0;
        ordersCountMap.set(o.member_id, count + 1);
      });

      // Get referrer names
      const memberMap = new Map(membersData?.map(m => [m.id, m.name]) || []);

      // Count downlines for each member
      const downlineCountMap = new Map<string, number>();
      membersData?.forEach(m => {
        if (m.referrer_id) {
          const count = downlineCountMap.get(m.referrer_id) || 0;
          downlineCountMap.set(m.referrer_id, count + 1);
        }
      });

      // Map existing members
      const membersList: Member[] = (membersData || []).map((m): Member => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name || "未命名",
        email: m.email || "",
        phone: m.phone || "",
        role: usersMap.get(m.user_id)?.role || m.role || "member",
        points_balance: m.points_balance || 0,
        referral_code: m.referral_code || "",
        referrer_id: m.referrer_id,
        created_at: m.created_at,
        orders_count: ordersCountMap.get(m.id) || 0,
        referrer_name: m.referrer_id ? memberMap.get(m.referrer_id) : undefined,
        downline_count: downlineCountMap.get(m.id) || 0,
        is_registered_only: false,
      }));

      // Add registered-only users (no member record)
      const registeredOnly: Member[] = (usersData || [])
        .filter(u => !memberUserIds.has(u.id))
        .map((u): Member => ({
          id: u.id, // use user id as id
          user_id: u.id,
          name: [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || "未命名",
          email: u.email || "",
          phone: u.phone || "",
          role: "user",
          points_balance: 0,
          referral_code: "",
          referrer_id: null,
          created_at: u.created_at,
          orders_count: 0,
          referrer_name: undefined,
          downline_count: 0,
          is_registered_only: true,
        }));

      return [...membersList, ...registeredOnly];
    },
  });

  // Fetch member's downline network
  const { data: memberNetwork = [], isLoading: networkLoading } = useQuery({
    queryKey: ["member-network", selectedMember?.id],
    queryFn: async () => {
      if (!selectedMember?.id) return [];

      const { data, error } = await supabase
        .rpc("get_member_downline", { p_member_id: selectedMember.id, p_max_level: 10 });

      if (error) {
        console.error("Error fetching network:", error);
        // Fallback to manual query if function doesn't exist
        const { data: fallbackData } = await supabase
          .from("members")
          .select("*")
          .eq("referrer_id", selectedMember.id);
        return fallbackData || [];
      }

      return data || [];
    },
    enabled: !!selectedMember?.id && networkOpen,
  });

  // Generate a referral code for new members
  const generateReferralCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Update member role mutation — handles both existing members and registered-only users
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, userId, role, referralCode, isRegisteredOnly, name, email, phone }: {
      memberId: string;
      userId: string;
      role: string;
      referralCode: string | null;
      isRegisteredOnly?: boolean;
      name?: string;
      email?: string;
      phone?: string;
    }) => {
      let actualMemberId = memberId;
      let actualReferralCode = referralCode;

      // If registered-only user, create a member record first
      if (isRegisteredOnly) {
        actualReferralCode = generateReferralCode();

        const { data: newMember, error: createError } = await supabase
          .from("members")
          .insert({
            user_id: userId,
            name: name || email || "未命名",
            email: email || "",
            phone: phone || "",
            role,
            points_balance: 0,
            referral_code: actualReferralCode,
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (createError) throw createError;
        actualMemberId = newMember.id;
      } else {
        // Update existing members table
        const { error: memberError } = await supabase
          .from("members")
          .update({ role })
          .eq("id", memberId);

        if (memberError) throw memberError;
      }

      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({ role })
        .eq("id", userId);

      if (userError) throw userError;

      // If upgrading to partner or admin, ensure partner record exists
      if (role === "partner" || role === "admin") {
        const { data: existingPartner } = await supabase
          .from("partners")
          .select("id")
          .eq("member_id", actualMemberId)
          .maybeSingle();

        if (!existingPartner) {
          const { error: partnerError } = await supabase
            .from("partners")
            .insert({
              member_id: actualMemberId,
              user_id: userId,
              referral_code: actualReferralCode || null,
              tier: "phase1",
              status: "active",
              ly_balance: 0,
              cash_wallet_balance: 0,
              rwa_tokens: 0,
              total_sales: 0,
              total_cashback: 0,
            });

          if (partnerError) throw partnerError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      toast({ title: "角色已更新" });
    },
    onError: (error: Error) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "user": return { label: "已注册", icon: UserPlus, variant: "outline" as const };
      case "member": return { label: t("admin.membersPage.roleMember"), icon: Star, variant: "secondary" as const };
      case "partner": return { label: t("admin.membersPage.rolePartner"), icon: Crown, variant: "default" as const };
      case "admin": return { label: t("admin.membersPage.roleAdmin"), icon: Shield, variant: "destructive" as const };
      default: return { label: "已注册", icon: UserPlus, variant: "outline" as const };
    }
  };

  // Show all applicable roles based on hierarchy
  const getAllRoleBadges = (role: string) => {
    const badges: Array<{ label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" | "destructive" }> = [];
    if (role === "admin") badges.push({ label: t("admin.membersPage.roleAdmin"), icon: Shield, variant: "destructive" });
    if (role === "admin" || role === "partner") badges.push({ label: t("admin.membersPage.rolePartner"), icon: Crown, variant: "default" });
    if (role === "user") {
      badges.push({ label: "已注册", icon: UserPlus, variant: "outline" });
    } else {
      badges.push({ label: t("admin.membersPage.roleMember"), icon: Star, variant: "secondary" });
    }
    return badges;
  };

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (member: Member) => {
      if (!member.is_registered_only) {
        // Delete partner record if exists
        await supabase.from("partners").delete().eq("member_id", member.id);
        // Delete member record
        const { error } = await supabase.from("members").delete().eq("id", member.id);
        if (error) throw error;
      }
      // Delete user record (cascades from auth via FK)
      const { error: userError } = await supabase.from("users").delete().eq("id", member.user_id);
      if (userError) throw userError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-members"] });
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      setDetailsOpen(false);
      toast({ title: "已删除" });
    },
    onError: (error: Error) => {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    },
  });

  // Export filtered members as CSV
  const handleExport = () => {
    const headers = ["姓名", "邮箱", "电话", "角色", "推荐码", "积分", "订单数", "下级数", "注册时间"];
    const roleLabels: Record<string, string> = { user: "已注册", member: "会员", partner: "合伙人", admin: "管理员" };
    const rows = filteredMembers.map(m => [
      m.name,
      m.email,
      m.phone || "",
      roleLabels[m.role] || m.role,
      m.referral_code || "",
      String(m.points_balance),
      String(m.orders_count || 0),
      String(m.downline_count || 0),
      formatDate(m.created_at),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `会员列表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchQuery === "" ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.referral_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || member.role === activeTab;
    return matchesSearch && matchesTab;
  }).sort((a, b) => {
    switch (sortBy) {
      case "date_asc": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "name": return a.name.localeCompare(b.name, "zh");
      case "points": return (b.points_balance || 0) - (a.points_balance || 0);
      default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const stats = {
    total: members.length,
    registered: members.filter(m => m.role === "user").length,
    members: members.filter(m => m.role === "member").length,
    partners: members.filter(m => m.role === "partner").length,
    admins: members.filter(m => m.role === "admin").length,
  };

  const handleViewDetails = (member: Member) => {
    setSelectedMember(member);
    setDetailsOpen(true);
  };

  const handleViewNetwork = (member: Member) => {
    setSelectedMember(member);
    setNetworkOpen(true);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-serif text-primary" data-testid="text-members-title">{t("admin.membersPage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.membersPage.subtitle")}</p>
          </div>
          <Button variant="outline" size="sm" className="shrink-0" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline ml-1.5">刷新</span>
          </Button>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">{t("admin.membersPage.totalUsers")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-2xl font-bold text-blue-500">{stats.registered}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">已注册</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-2xl font-bold text-secondary">{stats.members}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">{t("admin.membersPage.regularMembers")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hidden sm:block">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-2xl font-bold text-primary">{stats.partners}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">{t("admin.membersPage.partners")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="hidden sm:block">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-center sm:items-center gap-1 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg sm:text-2xl font-bold text-red-500">{stats.admins}</p>
                <p className="text-[10px] sm:text-sm text-muted-foreground leading-tight">管理员</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0" />
                  {t("admin.membersPage.memberList")}
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                    <SelectTrigger className="h-8 w-8 sm:w-auto sm:h-9 p-0 sm:px-3 border-none shadow-none [&>svg:last-child]:hidden sm:[&>svg:last-child]:block">
                      <ArrowUpDown className="w-4 h-4 sm:hidden" />
                      <span className="hidden sm:inline"><SelectValue /></span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">最新注册</SelectItem>
                      <SelectItem value="date_asc">最早注册</SelectItem>
                      <SelectItem value="name">按姓名</SelectItem>
                      <SelectItem value="points">按积分</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3" onClick={handleExport}>
                    <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline ml-1.5">导出</span>
                  </Button>
                </div>
              </div>
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.membersPage.searchPlaceholder")}
                  className="pl-8 h-9 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto -mx-1 px-1 pb-1">
                <TabsList className="inline-flex w-auto min-w-max md:grid md:w-full md:grid-cols-5 h-auto">
                  <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5" data-testid="tab-all">
                    <span className="sm:hidden">全部</span>
                    <span className="hidden sm:inline">{t("admin.membersPage.tabAll")}</span>
                    <span className="ml-1 text-muted-foreground">({stats.total})</span>
                  </TabsTrigger>
                  <TabsTrigger value="user" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5" data-testid="tab-user">
                    已注册<span className="ml-1 text-muted-foreground">({stats.registered})</span>
                  </TabsTrigger>
                  <TabsTrigger value="member" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5" data-testid="tab-member">
                    <span className="sm:hidden">会员</span>
                    <span className="hidden sm:inline">{t("admin.membersPage.tabMember")}</span>
                    <span className="ml-1 text-muted-foreground">({stats.members})</span>
                  </TabsTrigger>
                  <TabsTrigger value="partner" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5" data-testid="tab-partner">
                    <span className="sm:hidden">合伙</span>
                    <span className="hidden sm:inline">{t("admin.membersPage.tabPartner")}</span>
                    <span className="ml-1 text-muted-foreground">({stats.partners})</span>
                  </TabsTrigger>
                  <TabsTrigger value="admin" className="text-xs sm:text-sm px-2 sm:px-3 py-1.5" data-testid="tab-admin">
                    <span className="sm:hidden">管理</span>
                    <span className="hidden sm:inline">{t("admin.membersPage.tabAdmin")}</span>
                    <span className="ml-1 text-muted-foreground">({stats.admins})</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.membersPage.noMembers")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredMembers.map((member) => {
                      const roleConfig = getRoleBadge(member.role);
                      const RoleIcon = roleConfig.icon;
                      const badges = getAllRoleBadges(member.role);
                      const isRegisteredOnly = member.is_registered_only;
                      return (
                        <div
                          key={member.id}
                          className={`p-2.5 sm:p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors ${isRegisteredOnly ? "border-dashed opacity-80" : ""}`}
                          data-testid={`member-${member.id}`}
                        >
                          <div className="flex items-start gap-2.5 sm:gap-3 md:gap-4">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isRegisteredOnly ? "bg-blue-500/10" : "bg-primary/10"}`}>
                              <RoleIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${isRegisteredOnly ? "text-blue-500" : "text-primary"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 min-w-0">
                                  <span className="font-medium text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{member.name}</span>
                                  {badges.map((b) => (
                                    <Badge key={b.label} variant={b.variant} className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0">{b.label}</Badge>
                                  ))}
                                </div>
                                {/* Action buttons — top-right on mobile */}
                                <div className="flex items-center gap-0.5 shrink-0 sm:hidden">
                                  {!isRegisteredOnly && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() => handleViewNetwork(member)}
                                      data-testid={`button-network-${member.id}`}
                                    >
                                      <Network className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-7 w-7">
                                        <MoreVertical className="w-3.5 h-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleViewDetails(member)}>
                                        <Eye className="w-4 h-4 mr-2" />查看详情
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-red-500 focus:text-red-500"
                                        onClick={() => { setDeleteTarget(member); setDeleteConfirmOpen(true); }}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />删除
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-0.5 text-xs sm:text-sm text-muted-foreground mt-0.5">
                                {member.referral_code && (
                                  <span className="font-mono">{member.referral_code}</span>
                                )}
                                <span className="flex items-center gap-1 truncate max-w-[160px] sm:max-w-none">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{member.email}</span>
                                </span>
                                {member.phone && (
                                  <span className="hidden md:flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {member.phone}
                                  </span>
                                )}
                              </div>
                              {member.referrer_name && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  推荐人: {member.referrer_name}
                                </p>
                              )}
                              {/* Stats shown inline on mobile — only for actual members */}
                              {!isRegisteredOnly && (
                                <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-1.5 md:hidden text-[11px] sm:text-xs text-muted-foreground">
                                  <span>{member.points_balance} {t("admin.membersPage.points")}</span>
                                  <span>{member.orders_count} 订单</span>
                                  <span>{member.downline_count} 下级</span>
                                </div>
                              )}
                              {isRegisteredOnly && (
                                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 sm:mt-1.5 md:hidden">
                                  注册于 {formatDate(member.created_at)}
                                </p>
                              )}
                            </div>
                            {/* Desktop action buttons */}
                            <div className="hidden sm:flex items-center gap-2 md:gap-4 flex-shrink-0">
                              {!isRegisteredOnly ? (
                                <>
                                  <div className="text-right hidden md:block">
                                    <p className="text-sm">{member.points_balance} {t("admin.membersPage.points")}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {member.orders_count} 订单 · {member.downline_count} 下级
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={() => handleViewNetwork(member)}
                                    data-testid={`button-network-${member.id}`}
                                  >
                                    <Network className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <div className="text-right hidden md:block">
                                  <p className="text-xs text-muted-foreground">
                                    注册于 {formatDate(member.created_at)}
                                  </p>
                                </div>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleViewDetails(member)}
                                data-testid={`button-view-${member.id}`}
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">{t("admin.membersPage.viewDetails")}</span>
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

      {/* Member Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg truncate">
              {selectedMember?.is_registered_only ? "用户详情" : "会员详情"} - {selectedMember?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {selectedMember.referral_code ? (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">推荐码</p>
                    <p className="font-mono font-bold text-base sm:text-lg text-primary">{selectedMember.referral_code}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">状态</p>
                    <Badge variant="outline" className="mt-1 text-xs">已注册 · 未成为会员</Badge>
                  </div>
                )}
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">角色</p>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(role) => updateRoleMutation.mutate({
                      memberId: selectedMember.id,
                      userId: selectedMember.user_id,
                      role,
                      referralCode: selectedMember.referral_code || null,
                      isRegisteredOnly: selectedMember.is_registered_only,
                      name: selectedMember.name,
                      email: selectedMember.email,
                      phone: selectedMember.phone,
                    })}
                    disabled={updateRoleMutation.isPending}
                  >
                    <SelectTrigger className="w-full h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedMember.is_registered_only && (
                        <SelectItem value="user">已注册（未激活）</SelectItem>
                      )}
                      <SelectItem value="member">普通会员</SelectItem>
                      <SelectItem value="partner">合伙人</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">邮箱</p>
                  <p className="text-sm break-all">{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">电话</p>
                  <p className="text-sm">{selectedMember.phone || "-"}</p>
                </div>
              </div>
              {!selectedMember.is_registered_only && (
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">积分</p>
                    <p className="font-bold">{selectedMember.points_balance}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">订单数</p>
                    <p className="font-bold">{selectedMember.orders_count}</p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">下级数</p>
                    <p className="font-bold">{selectedMember.downline_count}</p>
                  </div>
                </div>
              )}
              {selectedMember.referrer_name && (
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">推荐人</p>
                  <p className="text-sm">{selectedMember.referrer_name}</p>
                </div>
              )}
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground">注册时间</p>
                <p className="text-sm">{formatDate(selectedMember.created_at)}</p>
              </div>
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 w-full"
                  onClick={() => { setDeleteTarget(selectedMember); setDeleteConfirmOpen(true); }}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  删除此用户
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Network Dialog */}
      <Dialog open={networkOpen} onOpenChange={setNetworkOpen}>
        <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Network className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">{selectedMember?.name} 的推荐网络</span>
            </DialogTitle>
          </DialogHeader>
          {networkLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : memberNetwork.length === 0 ? (
            <div className="text-center py-12">
              <Network className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">暂无下级会员</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-4">
                共 {memberNetwork.length} 位下级会员
              </p>
              {memberNetwork.map((member: any) => {
                const roleConfig = getRoleBadge(member.role);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-2 p-2 sm:p-3 border rounded-lg"
                    style={{ marginLeft: `${Math.min((member.level - 1) * 12, 48)}px` }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0 px-1.5">
                        L{member.level}
                      </Badge>
                      <div className="min-w-0">
                        <span className="font-medium text-sm sm:text-base truncate block">{member.name}</span>
                        <Badge variant={roleConfig.variant} className="text-[10px] sm:text-xs mt-0.5">
                          {roleConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground font-mono shrink-0">
                      {member.referral_code}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 <span className="font-medium text-foreground">{deleteTarget?.name}</span>（{deleteTarget?.email}）吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMemberMutation.isPending}>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteMemberMutation.isPending}
              onClick={() => deleteTarget && deleteMemberMutation.mutate(deleteTarget)}
            >
              {deleteMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />}
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
