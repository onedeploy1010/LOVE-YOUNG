import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
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
  Users, Search, CheckCircle, XCircle, Clock, Eye,
  TrendingUp, Loader2, UserPlus, Filter, Ban, Play
} from "lucide-react";

interface Partner {
  id: string;
  referral_code: string;
  tier: string;
  status: string;
  ly_balance: number;
  rwa_tokens: number;
  cash_wallet_balance: number;
  total_sales: number;
  total_commission: number;
  created_at: string;
  member_name?: string;
  member_email?: string;
  member_phone?: string;
}

interface PartnerReferral {
  id: string;
  member_name: string;
  tier: string;
  status: string;
}

interface PartnerOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function AdminPartnersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Query: direct referrals for selected partner
  const { data: referrals = [] } = useQuery<PartnerReferral[]>({
    queryKey: ["partner-referrals", selectedPartner?.id],
    enabled: !!selectedPartner,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, tier, status, members(name)")
        .eq("referrer_id", selectedPartner!.id);
      if (error) { console.error(error); return []; }
      return (data || []).map((p: any) => ({
        id: p.id,
        member_name: p.members?.name || "Partner",
        tier: p.tier,
        status: p.status,
      }));
    },
  });

  // Query: network orders for selected partner
  const { data: networkOrders = [] } = useQuery<PartnerOrder[]>({
    queryKey: ["partner-orders", selectedPartner?.referral_code],
    enabled: !!selectedPartner?.referral_code,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, total_amount, status, created_at")
        .eq("source", selectedPartner!.referral_code)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) { console.error(error); return []; }
      return (data || []) as PartnerOrder[];
    },
  });

  // Mutation: update tier
  const updateTierMutation = useMutation({
    mutationFn: async ({ partnerId, tier }: { partnerId: string; tier: string }) => {
      const { error } = await supabase.from("partners").update({ tier }).eq("id", partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast({ title: "等级已更新" });
      if (selectedPartner) setSelectedPartner({ ...selectedPartner, tier: updateTierMutation.variables?.tier || selectedPartner.tier });
    },
    onError: (error: Error) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  // Mutation: toggle status
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ partnerId, status }: { partnerId: string; status: string }) => {
      const { error } = await supabase.from("partners").update({ status }).eq("id", partnerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast({ title: "状态已更新" });
      if (selectedPartner) {
        const newStatus = selectedPartner.status === "active" ? "suspended" : "active";
        setSelectedPartner({ ...selectedPartner, status: newStatus });
      }
    },
    onError: (error: Error) => {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    },
  });

  const handleViewPartnerDetails = (partner: Partner) => {
    setSelectedPartner(partner);
    setShowDetailsModal(true);
  };

  const { data: partners = [], isLoading } = useQuery({
    queryKey: ["admin-partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select(`
          *,
          members (
            name,
            email,
            phone
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching partners:", error);
        return [];
      }

      return (data || []).map((p): Partner => ({
        id: p.id,
        referral_code: p.referral_code,
        tier: p.tier,
        status: p.status,
        ly_balance: p.ly_balance || 0,
        rwa_tokens: p.rwa_tokens || 0,
        cash_wallet_balance: p.cash_wallet_balance || 0,
        total_sales: p.total_sales || 0,
        total_commission: p.total_commission || 0,
        created_at: p.created_at,
        member_name: p.members?.name,
        member_email: p.members?.email,
        member_phone: p.members?.phone,
      }));
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      const { error } = await supabase
        .from("partners")
        .update({ status: "active" })
        .eq("id", partnerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-partners"] });
      toast({ title: t("admin.partnersPage.activateSuccess"), description: t("admin.partnersPage.activateSuccessDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("admin.partnersPage.activateFailed"), description: error.message, variant: "destructive" });
    }
  });

  const filteredPartners = partners.filter(p => {
    const matchesSearch = searchQuery === "" ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.referral_code && p.referral_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.member_name && p.member_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.member_email && p.member_email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === "all" || p.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: partners.length,
    active: partners.filter(p => p.status === "active").length,
    pending: partners.filter(p => p.status === "pending").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-partners-title">{t("admin.partnersPage.title")}</h1>
          <p className="text-muted-foreground">{t("admin.partnersPage.subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t("admin.partnersPage.totalPartners")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.active}</p>
                <p className="text-sm text-muted-foreground">{t("admin.partnersPage.activated")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">{t("admin.partnersPage.pendingReview")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary" />
                {t("admin.partnersPage.partnerList")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.partnersPage.searchPlaceholder")}
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">{t("admin.partnersPage.tabAll")} ({stats.total})</TabsTrigger>
                <TabsTrigger value="pending" data-testid="tab-pending">{t("admin.partnersPage.tabPending")} ({stats.pending})</TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active">{t("admin.partnersPage.tabActive")} ({stats.active})</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : filteredPartners.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.partnersPage.noPartners")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPartners.map((partner) => (
                      <div
                        key={partner.id}
                        className="p-3 md:p-4 border rounded-lg"
                        data-testid={`partner-${partner.id}`}
                      >
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                              <span className="font-medium">{partner.member_name || "Partner"}</span>
                              <span className="font-mono text-xs sm:text-sm text-muted-foreground">{partner.referral_code}</span>
                              <Badge variant={partner.status === "active" ? "default" : "outline"}>
                                {partner.status === "active" ? t("admin.partnersPage.activated") : t("admin.partnersPage.pendingReview")}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm text-muted-foreground mt-1">
                              <span>LY: {partner.ly_balance}</span>
                              <span>RWA: {partner.rwa_tokens}</span>
                              <span className="hidden sm:inline">{t("admin.partnersPage.package")}: Phase {partner.tier === "phase1" ? 1 : partner.tier === "phase2" ? 2 : 3}</span>
                              <span>销售额: RM {(partner.total_sales / 100).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {partner.status === "pending" && (
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => activateMutation.mutate(partner.id)}
                                disabled={activateMutation.isPending}
                                data-testid={`button-activate-${partner.id}`}
                              >
                                {activateMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                <span className="hidden sm:inline">{t("admin.partnersPage.activate")}</span>
                              </Button>
                            )}
                            <Button variant="outline" size="sm" className="gap-1" onClick={() => handleViewPartnerDetails(partner)} data-testid={`button-view-${partner.id}`}>
                              <Eye className="w-4 h-4" />
                              <span className="hidden sm:inline">{t("admin.partnersPage.viewDetails")}</span>
                            </Button>
                          </div>
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

      {/* Partner Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              经营人详情
            </DialogTitle>
          </DialogHeader>
          {selectedPartner && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">基本信息</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">姓名:</span>
                    <span className="ml-2 font-medium">{selectedPartner.member_name || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">邮箱:</span>
                    <span className="ml-2 font-medium">{selectedPartner.member_email || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">手机:</span>
                    <span className="ml-2 font-medium">{selectedPartner.member_phone || "-"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">推荐码:</span>
                    <span className="ml-2 font-mono font-medium">{selectedPartner.referral_code}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground">注册日期:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedPartner.created_at).toLocaleDateString("zh-CN")}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Financial Overview */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">财务概览</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">LY积分</p>
                    <p className="text-lg font-bold">{selectedPartner.ly_balance}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">现金钱包</p>
                    <p className="text-lg font-bold">RM {(selectedPartner.cash_wallet_balance / 100).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">RWA令牌</p>
                    <p className="text-lg font-bold">{selectedPartner.rwa_tokens}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">总销售额</p>
                    <p className="text-lg font-bold text-primary">RM {(selectedPartner.total_sales / 100).toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground text-xs">总返佣</p>
                    <p className="text-lg font-bold text-green-500">RM {(selectedPartner.total_commission / 100).toFixed(2)}</p>
                  </div>
                </div>
              </Card>

              {/* Tier & Status */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">等级与状态</h4>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">等级:</span>
                    <Select
                      value={selectedPartner.tier}
                      onValueChange={(value) => {
                        updateTierMutation.mutate({ partnerId: selectedPartner.id, tier: value });
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="phase1">Phase 1</SelectItem>
                        <SelectItem value="phase2">Phase 2</SelectItem>
                        <SelectItem value="phase3">Phase 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">状态:</span>
                    <Badge variant={selectedPartner.status === "active" ? "default" : "destructive"}>
                      {selectedPartner.status === "active" ? "激活" : selectedPartner.status === "suspended" ? "暂停" : selectedPartner.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newStatus = selectedPartner.status === "active" ? "suspended" : "active";
                        toggleStatusMutation.mutate({ partnerId: selectedPartner.id, status: newStatus });
                      }}
                      disabled={toggleStatusMutation.isPending}
                    >
                      {selectedPartner.status === "active" ? (
                        <><Ban className="w-4 h-4 mr-1" /> 暂停</>
                      ) : (
                        <><Play className="w-4 h-4 mr-1" /> 激活</>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Direct Referrals */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">直接推荐 ({referrals.length})</h4>
                {referrals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无直接推荐</p>
                ) : (
                  <div className="space-y-2">
                    {referrals.map((r) => (
                      <div key={r.id} className="flex items-center justify-between text-sm p-2 border rounded">
                        <span className="font-medium">{r.member_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">Phase {r.tier === "phase1" ? 1 : r.tier === "phase2" ? 2 : 3}</Badge>
                          <Badge variant={r.status === "active" ? "default" : "outline"}>
                            {r.status === "active" ? "激活" : "待审核"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Network Orders */}
              <Card className="p-4">
                <h4 className="font-semibold mb-3">网络订单 (最近10单)</h4>
                {networkOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">暂无网络订单</p>
                ) : (
                  <div className="space-y-2">
                    {networkOrders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-sm p-2 border rounded">
                        <span className="font-mono">#{o.order_number}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary">RM {(o.total_amount / 100).toFixed(2)}</span>
                          <Badge variant="outline">{o.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
