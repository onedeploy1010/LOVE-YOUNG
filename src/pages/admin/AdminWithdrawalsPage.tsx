import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { approveWithdrawal, completeWithdrawal, rejectWithdrawal } from "@/lib/partner";
import { useTranslation } from "@/lib/i18n";
import {
  Wallet, Clock, CheckCircle, XCircle, Loader2,
  ArrowDownRight, DollarSign, AlertTriangle, Ban
} from "lucide-react";

interface WithdrawalRow {
  id: string;
  partner_id: string;
  amount: number;
  bank_name: string | null;
  account_number: string | null;
  account_name: string | null;
  status: string;
  processed_by: string | null;
  processed_at: string | null;
  notes: string | null;
  created_at: string;
  partners?: {
    user_id: string;
    members?: {
      name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
  } | null;
}

export default function AdminWithdrawalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRow | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*, partners(user_id, members(name, email, phone))")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) {
        console.error("Error fetching withdrawals:", error);
        return [];
      }

      return (data || []) as WithdrawalRow[];
    },
  });

  const pending = requests.filter(r => r.status === "pending");
  const accepted = requests.filter(r => r.status === "accepted");
  const completed = requests.filter(r => r.status === "completed");
  const rejected = requests.filter(r => r.status === "rejected");

  const stats = {
    pendingCount: pending.length,
    pendingAmount: pending.reduce((s, r) => s + r.amount, 0),
    acceptedCount: accepted.length,
    acceptedAmount: accepted.reduce((s, r) => s + r.amount, 0),
    completedCount: completed.length,
    completedAmount: completed.reduce((s, r) => s + r.amount, 0),
    rejectedCount: rejected.length,
  };

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const result = await approveWithdrawal(requestId, user?.id || "");
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      toast({ title: t("admin.withdrawals.approveSuccess") });
      setDetailsOpen(false);
    },
    onError: (e: Error) => {
      toast({ title: t("admin.withdrawals.approveFailed"), description: e.message, variant: "destructive" });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const result = await completeWithdrawal(requestId);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      toast({ title: t("admin.withdrawals.completeSuccess") });
      setDetailsOpen(false);
    },
    onError: (e: Error) => {
      toast({ title: t("admin.withdrawals.completeFailed"), description: e.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }: { requestId: string; reason: string }) => {
      const result = await rejectWithdrawal(requestId, user?.id || "", reason);
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      toast({ title: t("admin.withdrawals.rejectSuccess") });
      setRejectOpen(false);
      setDetailsOpen(false);
      setRejectReason("");
    },
    onError: (e: Error) => {
      toast({ title: t("admin.withdrawals.rejectFailed"), description: e.message, variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />待处理</Badge>;
      case "accepted":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30"><CheckCircle className="w-3 h-3 mr-1" />已接收</Badge>;
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />已处理</Badge>;
      case "rejected":
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />已拒绝</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getPartnerName = (r: WithdrawalRow) => {
    return r.partners?.members?.name || r.account_name || "-";
  };

  const filteredRequests = activeTab === "all"
    ? requests
    : requests.filter(r => r.status === activeTab);

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
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-primary">{t("admin.withdrawals.title")}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">{t("admin.withdrawals.subtitle")}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Card className="border-yellow-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-500 shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("admin.withdrawals.pendingRequests")}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pendingCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">RM {(stats.pendingAmount / 100).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">已接收</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">{stats.acceptedCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">RM {(stats.acceptedAmount / 100).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("admin.withdrawals.completedRequests")}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.completedCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">RM {(stats.completedAmount / 100).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/20">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate">{t("admin.withdrawals.rejectedRequests")}</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-red-500">{stats.rejectedCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal Requests */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              {t("admin.withdrawals.requestsList")}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="pending" className="text-[10px] sm:text-xs">待处理</TabsTrigger>
                <TabsTrigger value="accepted" className="text-[10px] sm:text-xs">已接收</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] sm:text-xs">已处理</TabsTrigger>
                <TabsTrigger value="rejected" className="text-[10px] sm:text-xs">已拒绝</TabsTrigger>
                <TabsTrigger value="all" className="text-[10px] sm:text-xs">全部</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                {filteredRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">{t("admin.withdrawals.noRequests")}</p>
                  </div>
                ) : (
                  <div className="space-y-2 sm:space-y-3">
                    {filteredRequests.map((req) => (
                      <div
                        key={req.id}
                        className="border rounded-lg p-3 sm:p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => { setSelectedRequest(req); setDetailsOpen(true); }}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm sm:text-base truncate">{getPartnerName(req)}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground">{formatDate(req.created_at)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-sm sm:text-base text-primary">RM {(req.amount / 100).toFixed(2)}</p>
                            {getStatusBadge(req.status)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
                          <span>{req.bank_name || "-"}</span>
                          <span>·</span>
                          <span>****{req.account_number?.slice(-4) || "----"}</span>
                          <span>·</span>
                          <span>{req.account_name || "-"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">{t("admin.withdrawals.requestDetail")}</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                {/* Amount */}
                <div className="text-center py-4 bg-primary/5 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">{t("admin.withdrawals.withdrawAmount")}</p>
                  <p className="text-3xl font-bold text-primary">RM {(selectedRequest.amount / 100).toFixed(2)}</p>
                  <div className="mt-2">{getStatusBadge(selectedRequest.status)}</div>
                </div>

                {/* Partner Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{t("admin.withdrawals.partnerInfo")}</h4>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.withdrawals.name")}</span>
                      <span className="font-medium">{getPartnerName(selectedRequest)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.withdrawals.email")}</span>
                      <span className="font-medium">{selectedRequest.partners?.members?.email || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.withdrawals.phone")}</span>
                      <span className="font-medium">{selectedRequest.partners?.members?.phone || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Bank Info */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{t("admin.withdrawals.bankInfo")}</h4>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.withdrawals.bankName")}</span>
                      <span className="font-medium">{selectedRequest.bank_name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.withdrawals.accountNumber")}</span>
                      <span className="font-medium font-mono">{selectedRequest.account_number || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.withdrawals.accountName")}</span>
                      <span className="font-medium">{selectedRequest.account_name || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">{t("admin.withdrawals.timeline")}</h4>
                  <div className="bg-muted/30 rounded-lg p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("admin.withdrawals.submittedAt")}</span>
                      <span>{formatDate(selectedRequest.created_at)}</span>
                    </div>
                    {selectedRequest.processed_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("admin.withdrawals.processedAt")}</span>
                        <span>{formatDate(selectedRequest.processed_at)}</span>
                      </div>
                    )}
                    {selectedRequest.notes && (
                      <div className="mt-2 p-2 bg-red-500/10 rounded text-red-600 text-xs">
                        <span className="font-medium">{t("admin.withdrawals.rejectReasonLabel")}:</span> {selectedRequest.notes}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {selectedRequest.status === "pending" && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => { setRejectOpen(true); }}
                      >
                        <Ban className="w-4 h-4 mr-1.5" />
                        拒绝
                      </Button>
                      <Button
                        size="sm"
                        className="w-full sm:w-auto"
                        onClick={() => approveMutation.mutate(selectedRequest.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                        接收
                      </Button>
                    </>
                  )}
                  {selectedRequest.status === "accepted" && (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto bg-green-500 hover:bg-green-600"
                      onClick={() => completeMutation.mutate(selectedRequest.id)}
                      disabled={completeMutation.isPending}
                    >
                      {completeMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1.5" />}
                      已处理
                    </Button>
                  )}
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {t("admin.withdrawals.rejectTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("admin.withdrawals.rejectDesc")}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder={t("admin.withdrawals.rejectPlaceholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>
                {t("admin.withdrawals.cancel")}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!rejectReason.trim() || rejectMutation.isPending}
                onClick={() => {
                  if (selectedRequest) {
                    rejectMutation.mutate({ requestId: selectedRequest.id, reason: rejectReason.trim() });
                  }
                }}
              >
                {rejectMutation.isPending ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <XCircle className="w-4 h-4 mr-1.5" />}
                {t("admin.withdrawals.confirmReject")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
