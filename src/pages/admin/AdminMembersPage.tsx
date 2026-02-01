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
  Users, Search, Star, Crown, Shield, Eye, Mail, Phone,
  Loader2, UserPlus, Network, RefreshCw
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

      // Get users for role info
      const { data: usersData } = await supabase
        .from("users")
        .select("id, role");

      const usersMap = new Map(usersData?.map(u => [u.id, u.role]) || []);

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

      return (membersData || []).map((m): Member => ({
        id: m.id,
        user_id: m.user_id,
        name: m.name || "未命名",
        email: m.email || "",
        phone: m.phone || "",
        role: usersMap.get(m.user_id) || m.role || "member",
        points_balance: m.points_balance || 0,
        referral_code: m.referral_code || "",
        referrer_id: m.referrer_id,
        created_at: m.created_at,
        orders_count: ordersCountMap.get(m.id) || 0,
        referrer_name: m.referrer_id ? memberMap.get(m.referrer_id) : undefined,
        downline_count: downlineCountMap.get(m.id) || 0,
      }));
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

  // Update member role mutation — also ensures partner record exists for partner/admin roles
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, userId, role, referralCode }: { memberId: string; userId: string; role: string; referralCode: string | null }) => {
      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({ role })
        .eq("id", userId);

      if (userError) throw userError;

      // Update members table
      const { error: memberError } = await supabase
        .from("members")
        .update({ role })
        .eq("id", memberId);

      if (memberError) throw memberError;

      // If upgrading to partner or admin, ensure partner record exists
      if (role === "partner" || role === "admin") {
        const { data: existingPartner } = await supabase
          .from("partners")
          .select("id")
          .eq("member_id", memberId)
          .maybeSingle();

        if (!existingPartner) {
          const { error: partnerError } = await supabase
            .from("partners")
            .insert({
              member_id: memberId,
              user_id: userId,
              referral_code: referralCode || null,
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
      case "member": return { label: t("admin.membersPage.roleMember"), icon: Star, variant: "secondary" as const };
      case "partner": return { label: t("admin.membersPage.rolePartner"), icon: Crown, variant: "default" as const };
      case "admin": return { label: t("admin.membersPage.roleAdmin"), icon: Shield, variant: "destructive" as const };
      default: return { label: t("admin.membersPage.roleUser"), icon: Users, variant: "outline" as const };
    }
  };

  // Show all applicable roles based on hierarchy
  const getAllRoleBadges = (role: string) => {
    const badges: Array<{ label: string; icon: React.ElementType; variant: "default" | "secondary" | "outline" | "destructive" }> = [];
    if (role === "admin") badges.push({ label: t("admin.membersPage.roleAdmin"), icon: Shield, variant: "destructive" });
    if (role === "admin" || role === "partner") badges.push({ label: t("admin.membersPage.rolePartner"), icon: Crown, variant: "default" });
    badges.push({ label: t("admin.membersPage.roleMember"), icon: Star, variant: "secondary" });
    return badges;
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = searchQuery === "" ||
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.referral_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || member.role === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: members.length,
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-members-title">{t("admin.membersPage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.membersPage.subtitle")}</p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            刷新
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t("admin.membersPage.totalUsers")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-secondary">{stats.members}</p>
                <p className="text-sm text-muted-foreground">{t("admin.membersPage.regularMembers")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{stats.partners}</p>
                <p className="text-sm text-muted-foreground">{t("admin.membersPage.partners")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.admins}</p>
                <p className="text-sm text-muted-foreground">管理员</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {t("admin.membersPage.memberList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.membersPage.searchPlaceholder")}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="overflow-x-auto -mx-1 px-1">
                <TabsList className="inline-flex w-auto min-w-full md:grid md:w-full md:grid-cols-4">
                  <TabsTrigger value="all" className="flex-1 md:flex-none" data-testid="tab-all">{t("admin.membersPage.tabAll")} ({stats.total})</TabsTrigger>
                  <TabsTrigger value="member" className="flex-1 md:flex-none" data-testid="tab-member">{t("admin.membersPage.tabMember")} ({stats.members})</TabsTrigger>
                  <TabsTrigger value="partner" className="flex-1 md:flex-none" data-testid="tab-partner">{t("admin.membersPage.tabPartner")} ({stats.partners})</TabsTrigger>
                  <TabsTrigger value="admin" className="flex-1 md:flex-none" data-testid="tab-admin">{t("admin.membersPage.tabAdmin")} ({stats.admins})</TabsTrigger>
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
                  <div className="space-y-3">
                    {filteredMembers.map((member) => {
                      const roleConfig = getRoleBadge(member.role);
                      const RoleIcon = roleConfig.icon;
                      const badges = getAllRoleBadges(member.role);
                      return (
                        <div
                          key={member.id}
                          className="p-3 md:p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`member-${member.id}`}
                        >
                          <div className="flex items-start gap-3 md:gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                              <RoleIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-medium">{member.name}</span>
                                {badges.map((b) => (
                                  <Badge key={b.label} variant={b.variant} className="text-xs">{b.label}</Badge>
                                ))}
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground mt-0.5">
                                <span className="font-mono text-xs">{member.referral_code}</span>
                                <span className="hidden sm:flex items-center gap-1 truncate">
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
                                <p className="text-xs text-muted-foreground mt-1">
                                  推荐人: {member.referrer_name}
                                </p>
                              )}
                              {/* Stats shown inline on mobile */}
                              <div className="flex items-center gap-3 mt-1.5 md:hidden text-xs text-muted-foreground">
                                <span>{member.points_balance} {t("admin.membersPage.points")}</span>
                                <span>{member.orders_count} 订单</span>
                                <span>{member.downline_count} 下级</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>会员详情 - {selectedMember?.name}</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">推荐码</p>
                  <p className="font-mono font-bold text-lg text-primary">{selectedMember.referral_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">角色</p>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(role) => updateRoleMutation.mutate({
                      memberId: selectedMember.id,
                      userId: selectedMember.user_id,
                      role,
                      referralCode: selectedMember.referral_code,
                    })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">普通会员</SelectItem>
                      <SelectItem value="partner">合伙人</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p>{selectedMember.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">电话</p>
                  <p>{selectedMember.phone || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">积分</p>
                  <p className="font-bold">{selectedMember.points_balance}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">订单数</p>
                  <p className="font-bold">{selectedMember.orders_count}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">下级数</p>
                  <p className="font-bold">{selectedMember.downline_count}</p>
                </div>
              </div>
              {selectedMember.referrer_name && (
                <div>
                  <p className="text-sm text-muted-foreground">推荐人</p>
                  <p>{selectedMember.referrer_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">注册时间</p>
                <p>{formatDate(selectedMember.created_at)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Member Network Dialog */}
      <Dialog open={networkOpen} onOpenChange={setNetworkOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              {selectedMember?.name} 的推荐网络
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
                    className="flex items-center justify-between p-3 border rounded-lg"
                    style={{ marginLeft: `${(member.level - 1) * 20}px` }}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs">
                        L{member.level}
                      </Badge>
                      <div>
                        <span className="font-medium">{member.name}</span>
                        <Badge variant={roleConfig.variant} className="ml-2 text-xs">
                          {roleConfig.label}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground font-mono">
                      {member.referral_code}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
