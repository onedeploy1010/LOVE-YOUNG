import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PartnerLayout } from "@/components/PartnerLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "@/lib/i18n";
import {
  Users, UserPlus, Search, ChevronRight, Crown,
  TrendingUp, Star, Filter, Loader2
} from "lucide-react";
import { useState } from "react";

interface ReferralNode {
  partnerId: string;
  memberId: string;
  name: string;
  tier: string;
  status: string;
  level: number;
  joinDate: string;
  lyBalance: number;
}

const levelColors: Record<number, string> = {
  1: "bg-secondary text-secondary-foreground",
  2: "bg-primary text-primary-foreground",
  3: "bg-blue-500 text-white",
};

export default function PartnerReferralsPage() {
  const { t } = useTranslation();
  const { partner } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | null>(null);

  // Fetch referral tree
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["partner-referrals", partner?.id],
    queryFn: async () => {
      if (!partner?.id) return [];

      const result: ReferralNode[] = [];

      // Recursive function to fetch referrals up to 10 levels
      const fetchLevel = async (parentIds: string[], currentLevel: number) => {
        if (currentLevel > 10 || parentIds.length === 0) return;

        const { data: children } = await supabase
          .from("partners")
          .select(`
            id,
            tier,
            status,
            ly_balance,
            created_at,
            member_id,
            members!inner(id, name)
          `)
          .in("referrer_id", parentIds);

        if (!children || children.length === 0) return;

        const nextParentIds: string[] = [];
        for (const child of children) {
          const memberData = child.members as unknown as { id: string; name: string };
          result.push({
            partnerId: child.id,
            memberId: child.member_id,
            name: memberData?.name || "Unknown",
            tier: child.tier,
            status: child.status,
            level: currentLevel,
            joinDate: child.created_at?.split("T")[0] || "",
            lyBalance: child.ly_balance || 0,
          });
          nextParentIds.push(child.id);
        }

        await fetchLevel(nextParentIds, currentLevel + 1);
      };

      await fetchLevel([partner.id], 1);
      return result;
    },
    enabled: !!partner?.id,
  });

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === null || r.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const stats = {
    total: referrals.length,
    active: referrals.filter(r => r.status === "active").length,
    level1: referrals.filter(r => r.level === 1).length,
    level2: referrals.filter(r => r.level === 2).length,
    level3: referrals.filter(r => r.level === 3).length,
    totalLyEarned: referrals.reduce((sum, r) => sum + r.lyBalance, 0),
  };

  const getTierLabel = (tier: string) => {
    const tierMap: Record<string, string> = {
      "phase1": "Phase 1",
      "phase2": "Phase 2",
      "phase3": "Phase 3",
    };
    return tierMap[tier] || tier;
  };

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-referrals-title">{t("partner.referrals.title")}</h1>
          <p className="text-muted-foreground">{t("partner.referrals.subtitle")}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">{t("partner.referrals.totalReferrals")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">{t("partner.referrals.activeMembers")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.level1}</p>
                  <p className="text-xs text-muted-foreground">{t("partner.referrals.directReferrals")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Star className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalLyEarned.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{t("partner.referrals.teamTotalLy")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>{t("partner.referrals.teamList")}</CardTitle>
                <CardDescription>{t("partner.referrals.teamListDesc")}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("partner.referrals.searchPlaceholder")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-[200px]"
                    data-testid="input-search-referrals"
                  />
                </div>
                <Button variant="outline" size="icon" data-testid="button-filter">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4 flex-wrap">
              <Button
                variant={levelFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setLevelFilter(null)}
                data-testid="button-filter-all"
              >
                {t("partner.referrals.allFilter")}
              </Button>
              <Button
                variant={levelFilter === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setLevelFilter(1)}
                data-testid="button-filter-level-1"
              >
                {t("partner.referrals.level").replace("{n}", "1")} ({stats.level1})
              </Button>
              <Button
                variant={levelFilter === 2 ? "default" : "outline"}
                size="sm"
                onClick={() => setLevelFilter(2)}
                data-testid="button-filter-level-2"
              >
                {t("partner.referrals.level").replace("{n}", "2")} ({stats.level2})
              </Button>
              <Button
                variant={levelFilter === 3 ? "default" : "outline"}
                size="sm"
                onClick={() => setLevelFilter(3)}
                data-testid="button-filter-level-3"
              >
                {t("partner.referrals.level").replace("{n}", "3")} ({stats.level3})
              </Button>
            </div>

            <div className="space-y-3">
              {filteredReferrals.map((referral) => (
                <div
                  key={referral.partnerId}
                  className="flex items-center justify-between p-4 rounded-lg border hover-elevate cursor-pointer"
                  data-testid={`card-referral-${referral.partnerId}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {referral.name.slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{referral.name}</p>
                        <Badge className={levelColors[referral.level] || "bg-gray-500"} variant="secondary">
                          {t("partner.referrals.level").replace("{n}", String(referral.level))}
                        </Badge>
                        {referral.status === "pending" && (
                          <Badge variant="outline" className="text-orange-500 border-orange-500">{t("partner.referrals.pendingActivation")}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t("partner.referrals.joinTime")}: {referral.joinDate} · {getTierLabel(referral.tier)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-secondary">{referral.lyBalance.toLocaleString()} LY</p>
                      <p className="text-xs text-muted-foreground">{t("partner.referrals.lyBalanceLabel")}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>

            {filteredReferrals.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{referrals.length === 0 ? t("partner.referrals.noMembers") : t("partner.referrals.noMatchingMembers")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{t("partner.referrals.inviteTitle")}</h3>
                  <p className="text-muted-foreground">{t("partner.referrals.inviteDesc")}</p>
                </div>
              </div>
              <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90" data-testid="button-invite">
                <UserPlus className="w-4 h-4 mr-2" />
                {t("partner.referrals.inviteNow")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
}
