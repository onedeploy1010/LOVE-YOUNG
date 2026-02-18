import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "@/lib/i18n";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/AdminLayout";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquarePlus, Send, Loader2, CheckCircle,
  Plus, History, ShoppingCart, Users, ArrowLeft,
  UserPlus, Paperclip, X, XCircle, Zap,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image_url?: string;
}

interface Deduction {
  type: string;
  amount_cents: number;
  description: string;
}

interface ParsedActions {
  member_registrations?: Array<{
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    referral_code?: string;
    notes?: string;
  }>;
  partner_joins?: Array<{
    customer_name: string;
    customer_phone: string;
    tier: "phase1" | "phase2" | "phase3";
    referral_code?: string;
    payment_amount_cents: number;
    actual_paid_cents?: number;
    deductions?: Deduction[];
    payment_reference?: string;
    notes?: string;
  }>;
  product_orders?: Array<{
    customer_name: string;
    customer_phone: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price_cents: number;
    }>;
    total_amount_cents: number;
    actual_paid_cents?: number;
    deductions?: Deduction[];
    box_count: number;
    referral_code?: string;
    payment_reference?: string;
    skip_cashback?: boolean;
    notes?: string;
  }>;
}

interface ExecutionLogEntry {
  action: string;
  success: boolean;
  details: string;
}

interface Session {
  id: string;
  status: string;
  messages: ChatMessage[];
  parsed_actions: ParsedActions | null;
  total_orders_created: number;
  total_partners_created: number;
  total_members_created: number;
  total_amount_cents: number;
  created_at: string;
  updated_at: string;
}

const TIER_LABELS: Record<string, string> = {
  phase1: "Phase 1 启航经营人",
  phase2: "Phase 2 成长经营人",
  phase3: "Phase 3 卓越经营人",
};

const ACTION_LABELS: Record<string, string> = {
  create_order: "创建订单",
  update_order_status: "更新订单状态",
  create_bill: "创建账单",
  update_bill: "更新账单",
  create_member: "注册会员",
  update_member: "更新会员",
  set_referrer: "设置推荐人",
  create_partner: "创建经营人",
  adjust_wallet: "调整钱包",
  adjust_ly_points: "调整LY积分",
  process_order_cashback: "处理返现",
  add_to_bonus_pool: "奖金池",
};

export default function AdminOrderSupplementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parsedActions, setParsedActions] = useState<ParsedActions | null>(null);
  const [executionLog, setExecutionLog] = useState<ExecutionLogEntry[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, executionLog]);

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["order-supplement-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_supplement_sessions")
        .select("status, total_orders_created, total_partners_created, total_members_created, total_amount_cents");
      const sessions = data || [];
      return {
        totalSessions: sessions.length,
        totalOrders: sessions.reduce((sum, s) => sum + (s.total_orders_created || 0), 0),
        totalPartners: sessions.reduce((sum, s) => sum + (s.total_partners_created || 0), 0),
        totalMembers: sessions.reduce((sum, s) => sum + (s.total_members_created || 0), 0),
        totalAmount: sessions.reduce((sum, s) => sum + (s.total_amount_cents || 0), 0),
      };
    },
  });

  // History
  const { data: sessionHistory = [] } = useQuery<Session[]>({
    queryKey: ["order-supplement-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_supplement_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data || []) as Session[];
    },
  });

  // Compress image before upload (max 1200px, 0.7 quality)
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const maxSize = 1200;
        let { width, height } = img;
        if (width > maxSize || height > maxSize) {
          const ratio = Math.min(maxSize / width, maxSize / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
          "image/jpeg",
          0.7
        );
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload image to storage (with compression)
  const uploadImageToStorage = async (file: File): Promise<string> => {
    const compressed = await compressImage(file);
    const path = `receipts/supplement-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from("purchase-docs")
      .upload(path, compressed, { contentType: "image/jpeg" });
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage
      .from("purchase-docs")
      .getPublicUrl(path);
    return publicUrl;
  };

  // Send message
  const sendMessage = useMutation({
    mutationFn: async ({ msg, imageUrl }: { msg: string; imageUrl?: string }) => {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const token = authSession?.access_token;
      if (!token) throw new Error("Not authenticated");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vpzmhglfwomgrashheol.supabase.co";
      const res = await fetch(
        `${supabaseUrl}/functions/v1/admin-order-supplement`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            session_id: activeSessionId,
            message: msg,
            image_url: imageUrl || undefined,
          }),
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (!activeSessionId && data.session_id) {
        setActiveSessionId(data.session_id);
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      if (data.parsed_actions) setParsedActions(data.parsed_actions);
      // Handle execution log from AI direct writes
      if (data.execution_log && data.execution_log.length > 0) {
        setExecutionLog((prev) => [...prev, ...data.execution_log]);
        // Refresh stats when actions are executed
        queryClient.invalidateQueries({ queryKey: ["order-supplement-stats"] });
        queryClient.invalidateQueries({ queryKey: ["order-supplement-history"] });
      }
    },
    onError: (error) => {
      toast({ title: t("admin.orderSupplementPage.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSend = useCallback(async () => {
    const msg = inputValue.trim();
    if ((!msg && !pendingImage) || sendMessage.isPending || uploadingImage) return;

    let imageUrl: string | undefined;

    if (pendingImage) {
      setUploadingImage(true);
      try {
        imageUrl = await uploadImageToStorage(pendingImage.file);
      } catch (err) {
        toast({ title: t("admin.orderSupplementPage.uploadFailed"), description: (err as Error).message, variant: "destructive" });
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    const displayMsg = msg || t("admin.orderSupplementPage.sentImage");
    setMessages((prev) => [...prev, { role: "user", content: displayMsg, image_url: imageUrl }]);
    setInputValue("");
    setPendingImage(null);

    const finalMsg = msg || "请分析这张转账截图，提取付款信息。";
    sendMessage.mutate({ msg: finalMsg, imageUrl });
  }, [inputValue, pendingImage, sendMessage, uploadingImage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: t("admin.orderSupplementPage.imageOnly"), variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: t("admin.orderSupplementPage.imageTooLarge"), variant: "destructive" });
      return;
    }
    const preview = URL.createObjectURL(file);
    setPendingImage({ file, preview });
    e.target.value = "";
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setParsedActions(null);
    setExecutionLog([]);
    setShowHistory(false);
    setInputValue("");
    setPendingImage(null);
    inputRef.current?.focus();
  };

  const handleLoadSession = (s: Session) => {
    setActiveSessionId(s.id);
    setMessages(s.messages || []);
    setParsedActions(s.parsed_actions);
    setExecutionLog([]);
    setShowHistory(false);
  };

  // Count total preview actions
  const totalActions =
    (parsedActions?.member_registrations?.length || 0) +
    (parsedActions?.partner_joins?.length || 0) +
    (parsedActions?.product_orders?.length || 0);

  return (
    <AdminLayout>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

      <div className="-mx-4 -my-4 sm:mx-0 sm:my-0 flex flex-col h-[calc(100dvh-5.25rem)] sm:h-[calc(100vh-4rem)] max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex-none px-2.5 sm:px-4 pt-2 sm:pt-4 pb-1.5 sm:pb-2">
          <div className="flex items-center justify-between mb-1.5 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              {showHistory && (
                <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" onClick={() => setShowHistory(false)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <MessageSquarePlus className="w-4 h-4 sm:w-6 sm:h-6 text-primary shrink-0" />
              <h1 className="text-sm sm:text-xl font-bold truncate">{t("admin.orderSupplementPage.title")}</h1>
            </div>
            <div className="flex gap-1 sm:gap-2 shrink-0">
              <Button variant="outline" size="sm" className="h-7 sm:h-8 px-1.5 sm:px-3 text-[11px] sm:text-sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">{t("admin.orderSupplementPage.history")}</span>
              </Button>
              <Button size="sm" className="h-7 sm:h-8 px-1.5 sm:px-3 text-[11px] sm:text-sm" onClick={handleNewSession}>
                <Plus className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">{t("admin.orderSupplementPage.newSession")}</span>
              </Button>
            </div>
          </div>

          {/* Stats - horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-2 -mx-2.5 px-2.5 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible scrollbar-none">
            {[
              { label: t("admin.orderSupplementPage.statSessions"), value: stats?.totalSessions || 0 },
              { label: t("admin.orderSupplementPage.statOrders"), value: stats?.totalOrders || 0 },
              { label: t("admin.orderSupplementPage.statPartners"), value: stats?.totalPartners || 0 },
              { label: t("admin.orderSupplementPage.statMembers"), value: stats?.totalMembers || 0 },
              { label: t("admin.orderSupplementPage.statAmount"), value: `RM ${((stats?.totalAmount || 0) / 100).toFixed(0)}` },
            ].map((stat, i) => (
              <Card key={i} className="shrink-0 w-[100px] sm:w-auto">
                <CardContent className="p-1.5 sm:p-3">
                  <div className="text-[9px] sm:text-xs text-muted-foreground truncate">{stat.label}</div>
                  <div className="text-xs sm:text-lg font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Main content */}
        {showHistory ? (
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-4">
            <div className="space-y-2">
              {sessionHistory.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {t("admin.orderSupplementPage.noHistory")}
                </div>
              ) : (
                sessionHistory.map((s) => (
                  <Card key={s.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleLoadSession(s)}>
                    <CardContent className="p-2.5 sm:p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Badge variant={s.status === "confirmed" ? "default" : s.status === "cancelled" ? "destructive" : "secondary"} className="text-[10px] shrink-0">
                            {s.status === "confirmed" ? t("admin.orderSupplementPage.confirmed")
                              : s.status === "cancelled" ? t("admin.orderSupplementPage.cancelled")
                              : t("admin.orderSupplementPage.inProgress")}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {new Date(s.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs shrink-0">
                          {s.total_partners_created > 0 && (
                            <span className="flex items-center gap-0.5"><Users className="w-3 h-3" /> {s.total_partners_created}</span>
                          )}
                          {s.total_orders_created > 0 && (
                            <span className="flex items-center gap-0.5"><ShoppingCart className="w-3 h-3" /> {s.total_orders_created}</span>
                          )}
                          {s.total_amount_cents > 0 && (
                            <span className="font-medium">RM {(s.total_amount_cents / 100).toFixed(0)}</span>
                          )}
                        </div>
                      </div>
                      {s.messages?.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {(s.messages[0] as ChatMessage).content}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Chat area */}
            <div className="flex-1 overflow-y-auto px-2.5 sm:px-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-2">
                  <MessageSquarePlus className="w-8 h-8 sm:w-12 sm:h-12 mb-2 sm:mb-3 opacity-30" />
                  <p className="text-xs sm:text-lg font-medium mb-0.5 sm:mb-1">{t("admin.orderSupplementPage.welcomeTitle")}</p>
                  <p className="text-[11px] sm:text-sm max-w-sm">{t("admin.orderSupplementPage.welcomeDesc")}</p>
                  <div className="mt-3 sm:mt-6 space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-left w-full max-w-sm">
                    <p className="font-medium text-[11px] sm:text-sm">{t("admin.orderSupplementPage.exampleTitle")}</p>
                    <div className="bg-muted/50 rounded-lg p-2 sm:p-3 space-y-0.5 sm:space-y-1 text-[10px] sm:text-xs">
                      <p>"收到李明转账RM1000，Phase 1加入，手机0123456789"</p>
                      <p>"查一下 0123456789 的会员信息和订单"</p>
                      <p>"帮王芳创建一个2盒燕窝的订单，手机0187654321"</p>
                      <p className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {t("admin.orderSupplementPage.sendImageTip")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 py-2 sm:py-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-[12px] sm:text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}>
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="receipt"
                            className="rounded-lg mb-1.5 max-w-full max-h-40 sm:max-h-64 object-contain cursor-pointer"
                            onClick={() => window.open(msg.image_url, "_blank")}
                          />
                        )}
                        <div className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</div>
                      </div>
                    </div>
                  ))}

                  {(sendMessage.isPending || uploadingImage) && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-2xl rounded-bl-md px-3 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Execution Log - shows AI-executed actions */}
            {executionLog.length > 0 && (
              <div className="flex-none px-2.5 sm:px-4 py-1.5 sm:py-2 border-t bg-muted/20 max-h-[20vh] sm:max-h-[30vh] overflow-y-auto">
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary" />
                  <span className="text-[11px] sm:text-xs font-medium">{t("admin.orderSupplementPage.executionLog")}</span>
                  <Badge variant="secondary" className="text-[9px] sm:text-[10px] ml-auto">
                    {executionLog.filter(e => e.success).length}/{executionLog.length}
                  </Badge>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  {executionLog.map((entry, i) => (
                    <div key={i} className={`flex items-start gap-1 sm:gap-1.5 text-[10px] sm:text-xs rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 ${
                      entry.success ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"
                    }`}>
                      {entry.success ? (
                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <span className={`font-medium ${entry.success ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                          {ACTION_LABELS[entry.action] || entry.action}
                        </span>
                        <span className="text-muted-foreground ml-1 break-words">{entry.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Parsed Actions Preview (optional - for visual context) */}
            {parsedActions && totalActions > 0 && executionLog.length === 0 && (
              <div className="flex-none px-2.5 sm:px-4 py-1.5 sm:py-2 border-t bg-muted/30 max-h-[20vh] sm:max-h-[30vh] overflow-y-auto">
                <div className="space-y-1.5">
                  {parsedActions.member_registrations?.map((reg, i) => (
                    <div key={`reg-${i}`} className="flex items-center gap-1.5 text-xs sm:text-sm bg-background rounded-lg p-2">
                      <UserPlus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{reg.customer_name}</span>
                        <span className="text-muted-foreground ml-1">{reg.customer_phone}</span>
                      </div>
                    </div>
                  ))}

                  {parsedActions.partner_joins?.map((join, i) => {
                    const hasDeductions = join.deductions && join.deductions.length > 0;
                    return (
                      <div key={`partner-${i}`} className="bg-background rounded-lg p-2">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                          <Users className="w-3.5 h-3.5 text-green-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium">{join.customer_name}</span>
                            <span className="text-muted-foreground ml-1 text-xs">{join.customer_phone}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">
                            {TIER_LABELS[join.tier]?.split(" ").slice(0, 2).join(" ")}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            RM {(join.payment_amount_cents / 100).toFixed(0)}
                          </Badge>
                        </div>
                        {hasDeductions && (
                          <div className="ml-5 mt-1 space-y-0.5">
                            {join.actual_paid_cents != null && join.actual_paid_cents !== join.payment_amount_cents && (
                              <div className="text-[10px] text-blue-600 font-medium">
                                {t("admin.orderSupplementPage.actualPaid")}: RM {(join.actual_paid_cents / 100).toFixed(2)}
                              </div>
                            )}
                            {join.deductions!.map((d, di) => (
                              <div key={di} className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <span className="text-amber-500">-</span>
                                <span>{d.description}: RM {(d.amount_cents / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {parsedActions.product_orders?.map((order, i) => {
                    const hasDeductions = order.deductions && order.deductions.length > 0;
                    return (
                      <div key={`order-${i}`} className="bg-background rounded-lg p-2">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                          <ShoppingCart className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-medium">{order.customer_name}</span>
                            <span className="text-muted-foreground ml-1 text-xs">{order.customer_phone}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] shrink-0">{order.box_count}{t("admin.orderSupplementPage.boxes")}</Badge>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            RM {(order.total_amount_cents / 100).toFixed(0)}
                          </Badge>
                        </div>
                        {hasDeductions && (
                          <div className="ml-5 mt-1 space-y-0.5">
                            {order.actual_paid_cents != null && order.actual_paid_cents !== order.total_amount_cents && (
                              <div className="text-[10px] text-blue-600 font-medium">
                                {t("admin.orderSupplementPage.actualPaid")}: RM {(order.actual_paid_cents / 100).toFixed(2)}
                              </div>
                            )}
                            {order.deductions!.map((d, di) => (
                              <div key={di} className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <span className="text-amber-500">-</span>
                                <span>{d.description}: RM {(d.amount_cents / 100).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Image preview bar */}
            {pendingImage && (
              <div className="flex-none px-2.5 sm:px-4 pt-1.5 sm:pt-2 border-t bg-muted/20">
                <div className="relative inline-block">
                  <img src={pendingImage.preview} alt="preview" className="h-14 sm:h-20 rounded-lg object-cover" />
                  <button
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                    onClick={() => { URL.revokeObjectURL(pendingImage.preview); setPendingImage(null); }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input bar - with safe area for iOS */}
            <div className="flex-none px-2 sm:px-4 py-1.5 sm:py-3 border-t bg-background" style={{ paddingBottom: 'max(0.375rem, env(safe-area-inset-bottom))' }}>
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  variant="ghost" size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 shrink-0 text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendMessage.isPending || uploadingImage}
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("admin.orderSupplementPage.inputPlaceholder")}
                  disabled={sendMessage.isPending || uploadingImage}
                  className="flex-1 h-8 sm:h-10 text-[13px] sm:text-sm rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && !pendingImage) || sendMessage.isPending || uploadingImage}
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0"
                >
                  {(sendMessage.isPending || uploadingImage) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
