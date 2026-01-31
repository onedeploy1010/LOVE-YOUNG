import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !stripeWebhookSecret) {
      throw new Error("Stripe configuration missing");
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the raw body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Received Stripe event:", event.type);

    // Generate referral code
    function generateReferralCode(): string {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      let code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        const paymentType = session.metadata?.type;

        // Handle partner join payment
        if (paymentType === "partner_join") {
          const memberId = session.metadata?.memberId;
          const tier = session.metadata?.tier;
          const lyPoints = parseInt(session.metadata?.lyPoints || "0");
          const rwaTokens = parseInt(session.metadata?.rwaTokens || "0");
          const referralCode = session.metadata?.referralCode;

          if (memberId && tier) {
            console.log(`Creating partner for member ${memberId}, tier: ${tier}`);

            // Find referrer partner via members.referral_code → partners.member_id
            let referrerId: string | null = null;
            if (referralCode) {
              const { data: referrerMember } = await supabase
                .from("members")
                .select("id")
                .eq("referral_code", referralCode.toUpperCase())
                .single();

              if (referrerMember) {
                const { data: referrerPartner } = await supabase
                  .from("partners")
                  .select("id")
                  .eq("member_id", referrerMember.id)
                  .eq("status", "active")
                  .single();

                if (referrerPartner) {
                  referrerId = referrerPartner.id;
                }
              }
            }

            // Create partner record
            const { data: partner, error: partnerError } = await supabase
              .from("partners")
              .insert({
                member_id: memberId,
                referral_code: generateReferralCode(),
                tier: tier,
                status: "active",
                referrer_id: referrerId,
                ly_balance: lyPoints,
                cash_wallet_balance: 0,
                rwa_tokens: rwaTokens,
                total_sales: 0,
                total_cashback: 0,
                payment_amount: session.amount_total,
                payment_date: new Date().toISOString(),
                payment_reference: session.payment_intent as string,
                stripe_session_id: session.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .select()
              .single();

            if (partnerError) {
              console.error("Error creating partner:", partnerError);
            } else {
              console.log(`Partner created: ${partner.id}`);

              // Update member role to partner
              await supabase
                .from("members")
                .update({ role: "partner", updated_at: new Date().toISOString() })
                .eq("id", memberId);

              // Also update users table role
              const { data: memberRecord } = await supabase
                .from("members")
                .select("user_id")
                .eq("id", memberId)
                .single();
              if (memberRecord?.user_id) {
                await supabase
                  .from("users")
                  .update({ role: "partner" })
                  .eq("id", memberRecord.user_id);
              }

              // Record LY points in ledger
              await supabase.from("ly_points_ledger").insert({
                partner_id: partner.id,
                type: "bonus",
                points: lyPoints,
                reference_type: "package",
                description: `Initial ${tier} package bonus`,
                created_at: new Date().toISOString(),
              }).catch(() => {});

              // Record RWA tokens in ledger
              await supabase.from("rwa_token_ledger").insert({
                partner_id: partner.id,
                tokens: rwaTokens,
                source: "package",
                created_at: new Date().toISOString(),
              }).catch(() => {});
            }
          }
          break;
        }

        // Handle regular order payment
        const orderId = session.metadata?.orderId;
        const orderNumber = session.metadata?.orderNumber;

        if (orderId) {
          // Update order status to confirmed/paid
          const { error: updateError } = await supabase
            .from("orders")
            .update({
              status: "confirmed",
              payment_status: "paid",
              payment_method: session.payment_method_types?.[0] || "card",
              payment_reference: session.payment_intent as string,
              stripe_session_id: session.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);

          if (updateError) {
            console.error("Error updating order:", updateError);
          } else {
            console.log(`Order ${orderNumber} marked as paid`);
          }

          // Record payment in payment_transactions table (if exists)
          await supabase.from("payment_transactions").insert({
            order_id: orderId,
            stripe_session_id: session.id,
            stripe_payment_intent: session.payment_intent as string,
            amount: session.amount_total,
            currency: session.currency,
            status: "succeeded",
            payment_method: session.payment_method_types?.[0] || "card",
            customer_email: session.customer_email,
            created_at: new Date().toISOString(),
          }).catch(() => {
            // Table might not exist, ignore
          });
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session expired:", session.id);

        const orderId = session.metadata?.orderId;
        if (orderId) {
          // Update order status to payment_expired
          await supabase
            .from("orders")
            .update({
              status: "pending",
              payment_status: "expired",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orderId);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent succeeded:", paymentIntent.id);

        // Find order by payment intent and update
        const { data: orders } = await supabase
          .from("orders")
          .select("id")
          .eq("payment_reference", paymentIntent.id)
          .limit(1);

        if (orders && orders.length > 0) {
          await supabase
            .from("orders")
            .update({
              status: "confirmed",
              payment_status: "paid",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orders[0].id);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("Payment intent failed:", paymentIntent.id);

        // Find and update order
        const { data: orders } = await supabase
          .from("orders")
          .select("id")
          .eq("payment_reference", paymentIntent.id)
          .limit(1);

        if (orders && orders.length > 0) {
          await supabase
            .from("orders")
            .update({
              status: "pending",
              payment_status: "failed",
              payment_error: paymentIntent.last_payment_error?.message || "Payment failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", orders[0].id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true, type: event.type }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
