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
import { useAuthStore } from "@/stores/authStore";
import { createPartner } from "@/lib/partner";
import { createOrder, updateOrderStatus } from "@/lib/orders";
import { processOrderCashback, addSalesToBonusPool } from "@/lib/partner";
import {
  MessageSquarePlus, Send, Loader2, CheckCircle,
  Plus, History, ShoppingCart, Users, ArrowLeft,
  AlertCircle, UserPlus, Paperclip, X, Receipt,
} from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image_url?: string;
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
    box_count: number;
    referral_code?: string;
    payment_reference?: string;
    skip_cashback?: boolean;
    notes?: string;
  }>;
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

// Track uploaded receipt URLs keyed by action index
type ReceiptMap = Record<string, string>;

const TIER_LABELS: Record<string, string> = {
  phase1: "Phase 1 启航经营人",
  phase2: "Phase 2 成长经营人",
  phase3: "Phase 3 卓越经营人",
};

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateBillNumber(): string {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${datePart}-${rand}`;
}

export default function AdminOrderSupplementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [parsedActions, setParsedActions] = useState<ParsedActions | null>(null);
  const [readyToConfirm, setReadyToConfirm] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ file: File; preview: string } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [receiptMap, setReceiptMap] = useState<ReceiptMap>({});
  const [uploadingReceipt, setUploadingReceipt] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const receiptTargetKey = useRef<string>("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["order-supplement-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_supplement_sessions")
        .select("status, total_orders_created, total_partners_created, total_members_created, total_amount_cents");
      const sessions = data || [];
      const confirmed = sessions.filter((s) => s.status === "confirmed");
      return {
        totalSessions: sessions.length,
        totalOrders: confirmed.reduce((sum, s) => sum + (s.total_orders_created || 0), 0),
        totalPartners: confirmed.reduce((sum, s) => sum + (s.total_partners_created || 0), 0),
        totalMembers: confirmed.reduce((sum, s) => sum + (s.total_members_created || 0), 0),
        totalAmount: confirmed.reduce((sum, s) => sum + (s.total_amount_cents || 0), 0),
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

  // Upload image to storage and return public URL
  const uploadImageToStorage = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `receipts/supplement-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("purchase-docs")
      .upload(path, file);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage
      .from("purchase-docs")
      .getPublicUrl(path);
    return publicUrl;
  };

  // Send message (with optional image)
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
      if (data.ready_to_confirm) setReadyToConfirm(true);
    },
    onError: (error) => {
      toast({ title: t("admin.orderSupplementPage.error"), description: error.message, variant: "destructive" });
    },
  });

  const handleSend = useCallback(async () => {
    const msg = inputValue.trim();
    if ((!msg && !pendingImage) || sendMessage.isPending || uploadingImage) return;

    let imageUrl: string | undefined;

    // Upload pending image first
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

    // If image but no text, send a prompt for AI to analyze the image
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

  // Receipt upload for individual action items
  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const key = receiptTargetKey.current;
    if (!file || !key) return;
    e.target.value = "";

    setUploadingReceipt(key);
    try {
      const url = await uploadImageToStorage(file);
      setReceiptMap((prev) => ({ ...prev, [key]: url }));
      toast({ title: t("admin.orderSupplementPage.receiptUploaded") });
    } catch (err) {
      toast({ title: t("admin.orderSupplementPage.uploadFailed"), description: (err as Error).message, variant: "destructive" });
    } finally {
      setUploadingReceipt(null);
    }
  };

  const triggerReceiptUpload = (key: string) => {
    receiptTargetKey.current = key;
    receiptInputRef.current?.click();
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
    setParsedActions(null);
    setReadyToConfirm(false);
    setShowHistory(false);
    setInputValue("");
    setPendingImage(null);
    setReceiptMap({});
    inputRef.current?.focus();
  };

  const handleLoadSession = (s: Session) => {
    setActiveSessionId(s.id);
    setMessages(s.messages || []);
    setParsedActions(s.parsed_actions);
    setReadyToConfirm(s.status === "in_progress" && !!s.parsed_actions);
    setShowHistory(false);
    setReceiptMap({});
  };

  // Confirm & execute
  const handleConfirm = async () => {
    if (!parsedActions || !activeSessionId) return;
    setIsConfirming(true);

    try {
      let ordersCreated = 0;
      let partnersCreated = 0;
      let membersCreated = 0;
      let totalAmountCents = 0;
      const results: Array<{ action: string; success: boolean; details: string }> = [];

      // Get admin member for bill created_by
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const adminUserId = authSession?.user?.id || null;

      // Step 1: Register new members
      if (parsedActions.member_registrations?.length) {
        for (const reg of parsedActions.member_registrations) {
          try {
            const phone = reg.customer_phone.replace(/\s+/g, "");
            const { data: existing } = await supabase
              .from("members").select("id").eq("phone", phone).maybeSingle();

            if (existing) {
              results.push({ action: "member_register", success: true, details: `${reg.customer_name} already exists` });
              continue;
            }

            let referrerId: string | null = null;
            if (reg.referral_code) {
              const code = reg.referral_code.toUpperCase();
              const { data: referrer } = await supabase
                .from("members").select("id").eq("referral_code", code).maybeSingle();
              if (referrer) {
                referrerId = referrer.id;
              } else {
                const { data: refByPhone } = await supabase
                  .from("members").select("id").eq("phone", reg.referral_code).maybeSingle();
                if (refByPhone) referrerId = refByPhone.id;
              }
            }

            const newReferralCode = generateReferralCode();
            const { error } = await supabase.from("members").insert({
              user_id: null,
              name: reg.customer_name,
              phone, email: reg.customer_email || null,
              role: "member", points_balance: 0,
              referral_code: newReferralCode, referrer_id: referrerId,
              created_at: new Date().toISOString(),
            });
            if (error) throw error;
            membersCreated++;
            results.push({ action: "member_register", success: true, details: `${reg.customer_name} (${phone})` });
          } catch (err) {
            results.push({ action: "member_register", success: false, details: `${reg.customer_name}: ${(err as Error).message}` });
          }
        }
      }

      // Step 2: Partner joins
      if (parsedActions.partner_joins?.length) {
        for (let i = 0; i < parsedActions.partner_joins.length; i++) {
          const join = parsedActions.partner_joins[i];
          try {
            const phone = join.customer_phone.replace(/\s+/g, "");
            let { data: member } = await supabase
              .from("members").select("id, referrer_id, referral_code").eq("phone", phone).maybeSingle();

            if (!member) {
              const newReferralCode = generateReferralCode();
              const { data: newMember, error: createErr } = await supabase
                .from("members").insert({
                  name: join.customer_name, phone, role: "member",
                  points_balance: 0, referral_code: newReferralCode,
                  created_at: new Date().toISOString(),
                }).select("id, referrer_id, referral_code").single();
              if (createErr) throw createErr;
              member = newMember;
              membersCreated++;
            }

            if (join.referral_code && !member.referrer_id) {
              const { data: referrer } = await supabase
                .from("members").select("id").eq("referral_code", join.referral_code.toUpperCase()).maybeSingle();
              if (referrer) {
                await supabase.from("members").update({ referrer_id: referrer.id }).eq("id", member.id);
              }
            }

            const { error } = await createPartner(
              member.id, join.tier, join.referral_code || null,
              join.payment_reference || "bank_transfer"
            );
            if (error) throw error;

            // Create bill record with receipt
            const receiptKey = `partner-${i}`;
            const receiptUrl = receiptMap[receiptKey] || null;
            const billNumber = generateBillNumber();
            await supabase.from("bills").insert({
              bill_number: billNumber,
              type: "operation",
              category: "经营人加入",
              vendor: join.customer_name,
              amount: join.payment_amount_cents,
              description: `${TIER_LABELS[join.tier]} - ${join.customer_name} (${phone})`,
              status: "paid",
              paid_date: new Date().toISOString().slice(0, 10),
              due_date: new Date().toISOString().slice(0, 10),
              reference_type: "order_supplement",
              reference_id: activeSessionId,
              receipt_url: receiptUrl,
              created_by: adminUserId,
              notes: join.payment_reference || null,
            });

            partnersCreated++;
            totalAmountCents += join.payment_amount_cents;
            results.push({ action: "partner_join", success: true, details: `${join.customer_name} → ${TIER_LABELS[join.tier]}` });
          } catch (err) {
            results.push({ action: "partner_join", success: false, details: `${join.customer_name}: ${(err as Error).message}` });
          }
        }
      }

      // Step 3: Product orders
      if (parsedActions.product_orders?.length) {
        for (let i = 0; i < parsedActions.product_orders.length; i++) {
          const order = parsedActions.product_orders[i];
          try {
            const phone = order.customer_phone.replace(/\s+/g, "");
            let { data: member } = await supabase
              .from("members").select("id, referrer_id").eq("phone", phone).maybeSingle();

            if (!member) {
              const newReferralCode = generateReferralCode();
              const { data: newMember, error: createErr } = await supabase
                .from("members").insert({
                  name: order.customer_name, phone, role: "member",
                  points_balance: 0, referral_code: newReferralCode,
                  created_at: new Date().toISOString(),
                }).select("id, referrer_id").single();
              if (createErr) throw createErr;
              member = newMember;
              membersCreated++;
            }

            if (order.referral_code && !member.referrer_id) {
              const { data: referrer } = await supabase
                .from("members").select("id").eq("referral_code", order.referral_code.toUpperCase()).maybeSingle();
              if (referrer) {
                await supabase.from("members").update({ referrer_id: referrer.id }).eq("id", member.id);
              }
            }

            const itemsJson = JSON.stringify(order.items);
            const { order: createdOrder, error: orderErr } = await createOrder({
              userId: null, memberId: member.id,
              customerName: order.customer_name, customerPhone: phone,
              customerEmail: null, status: "confirmed",
              totalAmount: order.total_amount_cents, items: itemsJson,
              packageType: null, shippingAddress: null, shippingCity: null,
              shippingState: null, shippingPostcode: null,
              preferredDeliveryDate: null, trackingNumber: null,
              notes: `[订单补录] ${order.payment_reference || ""} ${order.notes || ""}`.trim(),
              source: "bank_transfer", erpnextId: null, metaOrderId: null,
              pointsEarned: null, pointsRedeemed: null,
              sourceChannel: "admin_supplement", orderNumber: "",
            });
            if (orderErr) throw orderErr;
            if (!createdOrder) throw new Error("Order creation returned null");

            await updateOrderStatus(createdOrder.id, "confirmed");

            if (!order.skip_cashback) {
              await processOrderCashback(createdOrder.id, order.total_amount_cents, order.box_count, member.id);
            }
            await addSalesToBonusPool(createdOrder.id, order.total_amount_cents);

            // Create bill record with receipt
            const receiptKey = `order-${i}`;
            const receiptUrl = receiptMap[receiptKey] || null;
            const billNumber = generateBillNumber();
            await supabase.from("bills").insert({
              bill_number: billNumber,
              type: "operation",
              category: "产品订单",
              vendor: order.customer_name,
              amount: order.total_amount_cents,
              description: `订单补录 ${createdOrder.orderNumber} - ${order.customer_name} × ${order.box_count}盒`,
              status: "paid",
              paid_date: new Date().toISOString().slice(0, 10),
              due_date: new Date().toISOString().slice(0, 10),
              reference_type: "order",
              reference_id: createdOrder.id,
              receipt_url: receiptUrl,
              created_by: adminUserId,
              notes: order.payment_reference || null,
            });

            ordersCreated++;
            totalAmountCents += order.total_amount_cents;
            results.push({ action: "product_order", success: true, details: `${order.customer_name} × ${order.box_count}盒 → RM ${(order.total_amount_cents / 100).toFixed(2)}` });
          } catch (err) {
            results.push({ action: "product_order", success: false, details: `${order.customer_name}: ${(err as Error).message}` });
          }
        }
      }

      // Update session
      await supabase.from("order_supplement_sessions").update({
        status: "confirmed", execution_results: results,
        total_orders_created: ordersCreated, total_partners_created: partnersCreated,
        total_members_created: membersCreated, total_amount_cents: totalAmountCents,
        updated_at: new Date().toISOString(),
      }).eq("id", activeSessionId);

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;
      const resultMsg = [
        `✅ ${t("admin.orderSupplementPage.executionComplete")}`,
        membersCreated > 0 ? `${t("admin.orderSupplementPage.membersCreated")}: ${membersCreated}` : null,
        partnersCreated > 0 ? `${t("admin.orderSupplementPage.partnersCreated")}: ${partnersCreated}` : null,
        ordersCreated > 0 ? `${t("admin.orderSupplementPage.ordersCreated")}: ${ordersCreated}` : null,
        `${t("admin.orderSupplementPage.totalAmount")}: RM ${(totalAmountCents / 100).toFixed(2)}`,
        failCount > 0 ? `⚠️ ${failCount} ${t("admin.orderSupplementPage.failed")}` : null,
      ].filter(Boolean).join("\n");

      setMessages((prev) => [...prev, { role: "assistant", content: resultMsg }]);
      setReadyToConfirm(false);
      setReceiptMap({});
      queryClient.invalidateQueries({ queryKey: ["order-supplement-stats"] });
      queryClient.invalidateQueries({ queryKey: ["order-supplement-history"] });
      toast({ title: t("admin.orderSupplementPage.confirmSuccess"), description: `${successCount} ${t("admin.orderSupplementPage.actionsCompleted")}` });
    } catch (err) {
      toast({ title: t("admin.orderSupplementPage.error"), description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsConfirming(false);
    }
  };

  // Count total actions
  const totalActions =
    (parsedActions?.member_registrations?.length || 0) +
    (parsedActions?.partner_joins?.length || 0) +
    (parsedActions?.product_orders?.length || 0);

  return (
    <AdminLayout>
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
      <input ref={receiptInputRef} type="file" accept="image/*" className="hidden" onChange={handleReceiptSelect} />

      <div className="flex flex-col h-[calc(100vh-4rem)] max-w-full overflow-hidden">
        {/* Header - compact on mobile */}
        <div className="flex-none px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {showHistory && (
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowHistory(false)}>
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <MessageSquarePlus className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              <h1 className="text-base sm:text-xl font-bold truncate">{t("admin.orderSupplementPage.title")}</h1>
            </div>
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm" onClick={() => setShowHistory(!showHistory)}>
                <History className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">{t("admin.orderSupplementPage.history")}</span>
              </Button>
              <Button size="sm" className="h-8 px-2 sm:px-3 text-xs sm:text-sm" onClick={handleNewSession}>
                <Plus className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">{t("admin.orderSupplementPage.newSession")}</span>
              </Button>
            </div>
          </div>

          {/* Stats - scrollable on mobile */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 sm:overflow-visible scrollbar-none">
            {[
              { label: t("admin.orderSupplementPage.statSessions"), value: stats?.totalSessions || 0 },
              { label: t("admin.orderSupplementPage.statOrders"), value: stats?.totalOrders || 0 },
              { label: t("admin.orderSupplementPage.statPartners"), value: stats?.totalPartners || 0 },
              { label: t("admin.orderSupplementPage.statMembers"), value: stats?.totalMembers || 0 },
              { label: t("admin.orderSupplementPage.statAmount"), value: `RM ${((stats?.totalAmount || 0) / 100).toFixed(0)}` },
            ].map((stat, i) => (
              <Card key={i} className="shrink-0 w-[120px] sm:w-auto">
                <CardContent className="p-2 sm:p-3">
                  <div className="text-[10px] sm:text-xs text-muted-foreground truncate">{stat.label}</div>
                  <div className="text-sm sm:text-lg font-bold">{stat.value}</div>
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
            <div className="flex-1 overflow-y-auto px-3 sm:px-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground px-4">
                  <MessageSquarePlus className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-30" />
                  <p className="text-sm sm:text-lg font-medium mb-1">{t("admin.orderSupplementPage.welcomeTitle")}</p>
                  <p className="text-xs sm:text-sm max-w-sm">{t("admin.orderSupplementPage.welcomeDesc")}</p>
                  <div className="mt-4 sm:mt-6 space-y-2 text-xs sm:text-sm text-left w-full max-w-sm">
                    <p className="font-medium">{t("admin.orderSupplementPage.exampleTitle")}</p>
                    <div className="bg-muted/50 rounded-lg p-2.5 sm:p-3 space-y-1 text-[11px] sm:text-xs">
                      <p>"收到李明转账RM1000，Phase 1加入，手机0123456789"</p>
                      <p>"王芳转账RM736，买了2盒燕窝，手机0187654321"</p>
                      <p className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> {t("admin.orderSupplementPage.sendImageTip")}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5 sm:space-y-3 py-3 sm:py-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3 py-2 text-[13px] sm:text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}>
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="receipt"
                            className="rounded-lg mb-1.5 max-w-full max-h-48 sm:max-h-64 object-contain cursor-pointer"
                            onClick={() => window.open(msg.image_url, "_blank")}
                          />
                        )}
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
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

            {/* Parsed Actions Preview */}
            {parsedActions && totalActions > 0 && (
              <div className="flex-none px-3 sm:px-4 py-2 border-t bg-muted/30 max-h-[40vh] overflow-y-auto">
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
                    const key = `partner-${i}`;
                    return (
                      <div key={key} className="bg-background rounded-lg p-2">
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
                        {/* Receipt upload */}
                        <div className="flex items-center gap-1.5 mt-1.5 ml-5">
                          {receiptMap[key] ? (
                            <div className="flex items-center gap-1 text-[10px] text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>{t("admin.orderSupplementPage.receiptAttached")}</span>
                              <img src={receiptMap[key]} className="w-8 h-8 rounded object-cover ml-1 cursor-pointer" onClick={() => window.open(receiptMap[key], "_blank")} />
                            </div>
                          ) : (
                            <Button
                              variant="ghost" size="sm"
                              className="h-6 px-2 text-[10px] text-muted-foreground"
                              onClick={() => triggerReceiptUpload(key)}
                              disabled={uploadingReceipt === key}
                            >
                              {uploadingReceipt === key ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Receipt className="w-3 h-3 mr-1" />}
                              {t("admin.orderSupplementPage.attachReceipt")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {parsedActions.product_orders?.map((order, i) => {
                    const key = `order-${i}`;
                    return (
                      <div key={key} className="bg-background rounded-lg p-2">
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
                        {/* Receipt upload */}
                        <div className="flex items-center gap-1.5 mt-1.5 ml-5">
                          {receiptMap[key] ? (
                            <div className="flex items-center gap-1 text-[10px] text-green-600">
                              <CheckCircle className="w-3 h-3" />
                              <span>{t("admin.orderSupplementPage.receiptAttached")}</span>
                              <img src={receiptMap[key]} className="w-8 h-8 rounded object-cover ml-1 cursor-pointer" onClick={() => window.open(receiptMap[key], "_blank")} />
                            </div>
                          ) : (
                            <Button
                              variant="ghost" size="sm"
                              className="h-6 px-2 text-[10px] text-muted-foreground"
                              onClick={() => triggerReceiptUpload(key)}
                              disabled={uploadingReceipt === key}
                            >
                              {uploadingReceipt === key ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Receipt className="w-3 h-3 mr-1" />}
                              {t("admin.orderSupplementPage.attachReceipt")}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {readyToConfirm && (
                    <div className="flex items-center gap-2 pt-1 pb-0.5">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-xs sm:text-sm font-medium text-amber-600 flex-1">
                        {t("admin.orderSupplementPage.readyToConfirm")}
                      </span>
                      <Button size="sm" onClick={handleConfirm} disabled={isConfirming} className="h-8 text-xs sm:text-sm shrink-0">
                        {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <CheckCircle className="w-3.5 h-3.5 mr-1" />}
                        {t("admin.orderSupplementPage.confirmExecute")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Image preview bar */}
            {pendingImage && (
              <div className="flex-none px-3 sm:px-4 pt-2 border-t bg-muted/20">
                <div className="relative inline-block">
                  <img src={pendingImage.preview} alt="preview" className="h-16 sm:h-20 rounded-lg object-cover" />
                  <button
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center"
                    onClick={() => { URL.revokeObjectURL(pendingImage.preview); setPendingImage(null); }}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Input bar - WhatsApp style */}
            <div className="flex-none px-2 sm:px-4 py-2 sm:py-3 border-t bg-background">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost" size="icon"
                  className="h-9 w-9 shrink-0 text-muted-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendMessage.isPending || uploadingImage}
                >
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("admin.orderSupplementPage.inputPlaceholder")}
                  disabled={sendMessage.isPending || uploadingImage}
                  className="flex-1 h-9 sm:h-10 text-sm rounded-full bg-muted/50 border-0 focus-visible:ring-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={(!inputValue.trim() && !pendingImage) || sendMessage.isPending || uploadingImage}
                  size="icon"
                  className="h-9 w-9 rounded-full shrink-0"
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
