import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MemberLayout } from "@/components/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  Users, Share2, Copy, Link, QrCode, Network,
  Star, Crown, Shield, Loader2, CheckCircle, UserPlus,
  ChevronRight, ArrowLeft
} from "lucide-react";

interface ReferralMember {
  id: string;
  name: string;
  email: string;
  role: string;
  referral_code: string;
  created_at: string;
  points_balance: number;
}

interface ReferralStats {
  direct_referrals: number;
  total_network: number;
  partners_in_network: number;
  level1_count: number;
  level2_count: number;
  level3_count: number;
}

// Breadcrumb node for drill-down navigation
interface BreadcrumbNode {
  id: string;
  name: string;
}

async function fetchDirectReferrals(parentId: string, roleFilter?: string) {
  let query = supabase
    .from("members")
    .select("id, name, email, role, referral_code, created_at, points_balance")
    .eq("referrer_id", parentId)
    .order("created_at", { ascending: false });
  if (roleFilter && roleFilter !== "all") {
    query = query.eq("role", roleFilter);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map((m: any): ReferralMember => ({
    id: m.id,
    name: m.name || "未命名",
    email: m.email || "",
    role: m.role || "member",
    referral_code: m.referral_code || "",
    created_at: m.created_at,
    points_balance: m.points_balance || 0,
  }));
}

const getRoleBadge = (role: string) => {
  switch (role) {
    case "member": return { label: "会员", icon: Star, variant: "secondary" as const };
    case "partner": return { label: "合伙人", icon: Crown, variant: "default" as const };
    case "admin": return { label: "管理员", icon: Shield, variant: "destructive" as const };
    default: return { label: "用户", icon: Users, variant: "outline" as const };
  }
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export default function MemberReferralsPage() {
  const { t } = useTranslation();
  const { user, member, loading } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [roleFilter, setRoleFilter] = useState("all");
  // Drill-down navigation: breadcrumb trail of parent nodes
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbNode[]>([]);

  // The current parent ID to show children for
  const currentParentId = breadcrumb.length > 0
    ? breadcrumb[breadcrumb.length - 1].id
    : member?.id;

  const referralCode = member?.referralCode || "";
  const referralLink = referralCode
    ? `${window.location.origin}/auth/login?ref=${referralCode}`
    : "";

  // Navigate into a member's children
  const drillDown = (memberId: string, memberName: string) => {
    setBreadcrumb((prev) => [...prev, { id: memberId, name: memberName }]);
  };

  // Navigate back to a specific breadcrumb level
  const navigateTo = (index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index));
  };

  // Fetch referral stats
  const { data: stats } = useQuery<ReferralStats>({
    queryKey: ["member-referral-stats", member?.id],
    queryFn: async () => {
      if (!member?.id) return null;

      const { data, error } = await supabase
        .rpc("get_referral_stats", { p_member_id: member.id });

      if (error) {
        console.log("Stats function not available:", error.message);
        const { data: downline } = await supabase
          .from("members")
          .select("id, role, referrer_id")
          .eq("referrer_id", member.id);

        return {
          direct_referrals: downline?.length || 0,
          total_network: downline?.length || 0,
          partners_in_network: downline?.filter(d => d.role === "partner").length || 0,
          level1_count: downline?.length || 0,
          level2_count: 0,
          level3_count: 0,
        };
      }

      return data?.[0] || {
        direct_referrals: 0,
        total_network: 0,
        partners_in_network: 0,
        level1_count: 0,
        level2_count: 0,
        level3_count: 0,
      };
    },
    enabled: !!member?.id,
  });

  // Fetch children for current parent
  const { data: currentMembers = [], isLoading } = useQuery<ReferralMember[]>({
    queryKey: ["referral-children", currentParentId, roleFilter],
    queryFn: () => fetchDirectReferrals(currentParentId!, roleFilter),
    enabled: !!currentParentId,
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({ title: `${label}已复制到剪贴板` });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ title: "复制失败", variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">请先登录</p>
        </div>
      </MemberLayout>
    );
  }

  // Show spinner while auth is still loading
  if (loading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-referrals-title">
            我的推荐
          </h1>
          <p className="text-muted-foreground">分享您的推荐码，邀请好友加入</p>
        </div>

        {/* Referral Code & Link Card */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              我的推荐码
            </CardTitle>
            <CardDescription>分享给好友，双方都有奖励</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {referralCode ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">推荐码</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-mono font-bold text-primary tracking-wider">
                        {referralCode}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(referralCode, "推荐码")}
                        data-testid="button-copy-code"
                      >
                        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center border">
                    <QrCode className="w-12 h-12 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">推荐链接</p>
                  <div className="flex items-center gap-2">
                    <Input
                      value={referralLink}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-referral-link"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(referralLink, "推荐链接")}
                      data-testid="button-copy-link"
                    >
                      <Link className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1 bg-green-500 hover:bg-green-600"
                    onClick={() => {
                      const text = `加入LOVEYOUNG，使用我的推荐码 ${referralCode} 注册享优惠！${referralLink}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    分享到 WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => copyToClipboard(referralLink, "推荐链接")}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    复制链接
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">暂无推荐码</p>
                <p className="text-sm text-muted-foreground mt-1">
                  完成首次购物后即可获得推荐码
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-primary mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold">{stats?.direct_referrals || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">直接推荐</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Network className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-secondary mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold">{stats?.total_network || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">团队总人数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-primary mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold text-primary">{stats?.partners_in_network || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">合伙人</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-blue-500 mb-1 sm:mb-2" />
              <p className="text-lg sm:text-2xl font-bold">{(stats?.level2_count || 0) + (stats?.level3_count || 0)}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">间接推荐</p>
            </CardContent>
          </Card>
        </div>

        {/* Downline List (Drill-down Navigation) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              我的团队
            </CardTitle>
            <CardDescription>
              {breadcrumb.length === 0 ? "点击成员查看其下线" : `当前查看第 ${breadcrumb.length + 1} 层 · 点击成员继续深入`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter dropdown + breadcrumb bar */}
            <div className="flex items-center justify-between gap-3 mb-4">
              {/* Breadcrumb navigation */}
              <div className="flex items-center gap-1 flex-wrap min-w-0">
                <button
                  onClick={() => navigateTo(0)}
                  className={`flex items-center gap-1 text-sm shrink-0 ${breadcrumb.length > 0 ? "text-primary hover:underline" : "font-medium text-foreground"}`}
                >
                  {breadcrumb.length > 0 && <ArrowLeft className="w-3.5 h-3.5" />}
                  我的下线
                </button>
                {breadcrumb.map((node, index) => (
                  <span key={node.id} className="flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {index === breadcrumb.length - 1 ? (
                      <span className="text-sm font-medium truncate">{node.name}</span>
                    ) : (
                      <button
                        onClick={() => navigateTo(index + 1)}
                        className="text-sm text-primary hover:underline truncate"
                      >
                        {node.name}
                      </button>
                    )}
                  </span>
                ))}
              </div>

              {/* Role filter dropdown */}
              <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setBreadcrumb([]); }}>
                <SelectTrigger className="w-[120px] shrink-0" data-testid="select-role-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="partner">合伙人</SelectItem>
                  <SelectItem value="member">会员</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Member list */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : currentMembers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  {breadcrumb.length > 0 ? "该成员暂无下线" : "暂无推荐会员"}
                </p>
                {breadcrumb.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    分享您的推荐码，邀请好友加入
                  </p>
                )}
                {breadcrumb.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigateTo(breadcrumb.length - 1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    返回上一层
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {currentMembers.map((m) => {
                  const roleConfig = getRoleBadge(m.role);
                  const RoleIcon = roleConfig.icon;
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 sm:p-4 border rounded-lg cursor-pointer hover:bg-muted/50 active:bg-muted/70 transition-colors gap-2"
                      data-testid={`downline-${m.id}`}
                      onClick={() => drillDown(m.id, m.name)}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <RoleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="font-medium text-sm sm:text-base truncate">{m.name}</span>
                            <Badge variant={roleConfig.variant} className="text-[10px] sm:text-xs px-1.5 sm:px-2">
                              {roleConfig.label}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground truncate">{m.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        <div className="text-right">
                          <p className="font-mono text-xs sm:text-sm text-muted-foreground">
                            {m.referral_code}
                          </p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {formatDate(m.created_at)}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Referral Rules */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">推荐规则</h3>
            <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
              <li>推荐好友注册并完成首单，您将获得积分奖励</li>
              <li>被推荐人使用您的推荐码注册，也会获得新用户优惠</li>
              <li>推荐关系一经建立，永久有效</li>
              <li>升级为合伙人后，可享受更多推荐奖励</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
