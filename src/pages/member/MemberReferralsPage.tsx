import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemberLayout } from "@/components/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  Users, Share2, Copy, Link, QrCode, Network,
  Star, Crown, Shield, Loader2, CheckCircle, UserPlus,
  ChevronDown, ChevronRight
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

function ReferralTreeNode({
  member,
  level,
  roleFilter,
  expanded,
  onToggle,
}: {
  member: ReferralMember;
  level: number;
  roleFilter: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const isExpanded = expanded.has(member.id);

  const { data: children, isLoading } = useQuery<ReferralMember[]>({
    queryKey: ["referral-children", member.id, roleFilter],
    queryFn: () => fetchDirectReferrals(member.id, roleFilter),
    enabled: isExpanded,
  });

  const roleConfig = getRoleBadge(member.role);
  const RoleIcon = roleConfig.icon;

  return (
    <div>
      <div
        className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        style={{ marginLeft: `${(level - 1) * 24}px` }}
        data-testid={`downline-${member.id}`}
        onClick={() => onToggle(member.id)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <RoleIcon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                L{level}
              </Badge>
              <span className="font-medium">{member.name}</span>
              <Badge variant={roleConfig.variant} className="text-xs">
                {roleConfig.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-muted-foreground">
            {member.referral_code}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(member.created_at)}
          </p>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2 space-y-2">
          {isLoading ? (
            <div className="flex items-center py-3" style={{ marginLeft: `${level * 24}px` }}>
              <Loader2 className="w-4 h-4 animate-spin text-primary mr-2" />
              <span className="text-sm text-muted-foreground">加载中...</span>
            </div>
          ) : children && children.length > 0 ? (
            children.map((child) => (
              <ReferralTreeNode
                key={child.id}
                member={child}
                level={level + 1}
                roleFilter={roleFilter}
                expanded={expanded}
                onToggle={onToggle}
              />
            ))
          ) : (
            <div
              className="flex items-center py-2 text-sm text-muted-foreground"
              style={{ marginLeft: `${level * 24}px` }}
            >
              暂无下线成员
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MemberReferralsPage() {
  const { t } = useTranslation();
  const { user, member, loading } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const referralCode = member?.referralCode || "";
  const referralLink = referralCode
    ? `${window.location.origin}/auth/login?ref=${referralCode}`
    : "";

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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

  // Fetch L1 direct referrals only
  const { data: l1Members = [], isLoading } = useQuery<ReferralMember[]>({
    queryKey: ["referral-children", member?.id, activeTab],
    queryFn: () => fetchDirectReferrals(member!.id, activeTab),
    enabled: !!member?.id,
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <UserPlus className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold">{stats?.direct_referrals || 0}</p>
              <p className="text-sm text-muted-foreground">直接推荐</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Network className="w-8 h-8 mx-auto text-secondary mb-2" />
              <p className="text-2xl font-bold">{stats?.total_network || 0}</p>
              <p className="text-sm text-muted-foreground">团队总人数</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Crown className="w-8 h-8 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-primary">{stats?.partners_in_network || 0}</p>
              <p className="text-sm text-muted-foreground">合伙人</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{(stats?.level2_count || 0) + (stats?.level3_count || 0)}</p>
              <p className="text-sm text-muted-foreground">间接推荐</p>
            </CardContent>
          </Card>
        </div>

        {/* Downline Tree */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              我的团队
            </CardTitle>
            <CardDescription>查看您推荐的所有会员</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setExpanded(new Set()); }}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="all" data-testid="tab-all">
                  全部 ({stats?.total_network || 0})
                </TabsTrigger>
                <TabsTrigger value="partner" data-testid="tab-partner">
                  合伙人 ({stats?.partners_in_network || 0})
                </TabsTrigger>
                <TabsTrigger value="member" data-testid="tab-member">
                  会员 ({(stats?.total_network || 0) - (stats?.partners_in_network || 0)})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : l1Members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">暂无推荐会员</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      分享您的推荐码，邀请好友加入
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {l1Members.map((m) => (
                      <ReferralTreeNode
                        key={m.id}
                        member={m}
                        level={1}
                        roleFilter={activeTab}
                        expanded={expanded}
                        onToggle={toggleExpand}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
