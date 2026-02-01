import { useEffect, useState, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2, ShoppingBag } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { getCheckoutContext, clearCheckoutContext } from "@/lib/checkoutContext";
import { createOrGetMember, saveMemberAddress } from "@/lib/members";
import { createOrderBill } from "@/lib/bills";
import { getBillByOrderId } from "@/lib/bills";
import { deductInventoryForOrder } from "@/lib/inventory";
import { addSalesToBonusPool, processNetworkOrderRwa } from "@/lib/partner";
import { queryClient } from "@/lib/queryClient";

export default function CheckoutSuccessPage() {
  const { t } = useTranslation();
  const search = useSearch();
  const [, navigate] = useLocation();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  const params = new URLSearchParams(search);
  const orderNumber = params.get("order") || "";

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    processCheckout();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function processCheckout() {
    try {
      const ctx = getCheckoutContext();

      // No context — user may have refreshed or context expired.
      // The Stripe webhook still marks the order as paid, so just show success.
      if (!ctx || ctx.orderNumber !== orderNumber) {
        setProcessing(false);
        return;
      }

      // Idempotency: skip if bill already created
      const { bill: existingBill } = await getBillByOrderId(ctx.orderId);
      if (existingBill) {
        clearCheckoutContext();
        setProcessing(false);
        return;
      }

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();

      let memberId: string | null = null;

      if (user) {
        // Create or get member record
        const { member, created } = await createOrGetMember(user.id, {
          name: ctx.deliveryInfo.customerName,
          phone: ctx.deliveryInfo.phone,
          email: user.email,
        });

        if (member) {
          memberId = member.id;

          // Link referrer if new member
          if (created && ctx.referrerId) {
            await supabase
              .from("members")
              .update({ referrer_id: ctx.referrerId })
              .eq("id", member.id);
          }

          // Save address (skip if already saved at order creation — selectedAddressId is set)
          if (!ctx.selectedAddressId) {
            await saveMemberAddress(member.id, {
              recipientName: ctx.deliveryInfo.customerName,
              phone: ctx.deliveryInfo.phone,
              addressLine1: ctx.deliveryInfo.address,
              city: ctx.deliveryInfo.city,
              state: ctx.deliveryInfo.state,
              postcode: ctx.deliveryInfo.postcode,
              isDefault: true,
            });
          }

          // Link member to order
          await supabase
            .from("orders")
            .update({ member_id: member.id })
            .eq("id", ctx.orderId);

          queryClient.invalidateQueries({ queryKey: ["member-profile"] });
          queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
        }
      }

      // Create bill
      await createOrderBill(
        ctx.orderId,
        ctx.orderNumber,
        ctx.currentPrice * 100,
        memberId,
      );

      // Deduct inventory for gift box orders with selections
      if (ctx.selections && ctx.selections.length > 0) {
        await deductInventoryForOrder(
          ctx.orderId,
          ctx.selections.map(s => ({ flavor: s.key, quantity: s.quantity })),
        );
      }

      // Bonus pool
      await addSalesToBonusPool(ctx.orderId, ctx.currentPrice * 100);

      // RWA rewards
      if (memberId) {
        await processNetworkOrderRwa(ctx.orderId, memberId);
      }

      clearCheckoutContext();
    } catch (err) {
      console.error("Checkout success processing error:", err);
      setError(err instanceof Error ? err.message : "Processing error");
    } finally {
      setProcessing(false);
    }
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">{t("checkout.processing")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {t("checkout.successTitle")}
          </h1>
          <p className="text-muted-foreground">
            {t("checkout.successDesc")}
          </p>
        </div>

        {orderNumber && (
          <Card className="p-5">
            <p className="text-sm text-muted-foreground mb-2">
              {t("member.orders.orderNumber") || "Order Number"}
            </p>
            <p className="text-2xl font-bold text-primary">{orderNumber}</p>
          </Card>
        )}

        {error && (
          <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {error}
            </p>
          </Card>
        )}

        <div className="space-y-3">
          <Button
            className="w-full gap-2"
            onClick={() => navigate("/member/orders")}
          >
            {t("checkout.viewOrder")}
          </Button>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => navigate("/products")}
          >
            <ShoppingBag className="w-4 h-4" />
            {t("checkout.continueShopping")}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate("/")}
          >
            {t("checkout.backToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
