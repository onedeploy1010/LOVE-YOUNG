import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, Search, CheckCircle, XCircle, Clock, Eye,
  TrendingUp, Loader2, UserPlus, Filter
} from "lucide-react";
import type { Partner } from "@shared/types";

export default function AdminPartnersPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const activateMutation = useMutation({
    mutationFn: async (partnerId: string) => {
      return apiRequest("POST", `/api/admin/partners/${partnerId}/activate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      toast({ title: t("admin.partnersPage.activateSuccess"), description: t("admin.partnersPage.activateSuccessDesc") });
    },
    onError: (error: Error) => {
      toast({ title: t("admin.partnersPage.activateFailed"), description: error.message, variant: "destructive" });
    }
  });

  const filteredPartners = partners?.filter(p => {
    const matchesSearch = searchQuery === "" || 
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.referralCode && p.referralCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTab = activeTab === "all" || p.status === activeTab;
    return matchesSearch && matchesTab;
  }) || [];

  const stats = {
    total: partners?.length || 0,
    active: partners?.filter(p => p.status === "active").length || 0,
    pending: partners?.filter(p => p.status === "pending").length || 0,
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
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`partner-${partner.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{partner.referralCode}</span>
                              <Badge variant={partner.status === "active" ? "default" : "outline"}>
                                {partner.status === "active" ? t("admin.partnersPage.activated") : t("admin.partnersPage.pendingReview")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>LY: {partner.lyBalance}</span>
                              <span>RWA: {partner.rwaTokens}</span>
                              <span>{t("admin.partnersPage.package")}: Phase {partner.tier === "phase1" ? 1 : partner.tier === "phase2" ? 2 : 3}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                              {t("admin.partnersPage.activate")}
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="gap-1" data-testid={`button-view-${partner.id}`}>
                            <Eye className="w-4 h-4" />
                            {t("admin.partnersPage.viewDetails")}
                          </Button>
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
    </AdminLayout>
  );
}
