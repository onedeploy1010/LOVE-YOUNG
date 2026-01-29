import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Partner tier configuration
const PARTNER_TIERS = {
  phase1: {
    name: "启航配套 Starter Package",
    price: 100000, // RM 1000 in cents
    lyPoints: 2000,
    rwaTokens: 2,
  },
  phase2: {
    name: "成长配套 Growth Package",
    price: 130000, // RM 1300 in cents
    lyPoints: 2600,
    rwaTokens: 3,
  },
  phase3: {
    name: "卓越配套 Elite Package",
    price: 150000, // RM 1500 in cents
    lyPoints: 3000,
    rwaTokens: 4,
  },
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { memberId, tier, packageName, referralCode, successUrl, cancelUrl } = await req.json();

    if (!memberId || !tier) {
      throw new Error("Missing required fields: memberId and tier");
    }

    const tierConfig = PARTNER_TIERS[tier as keyof typeof PARTNER_TIERS];
    if (!tierConfig) {
      throw new Error("Invalid tier selected");
    }

    // Create Stripe Checkout Session for partner package
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "fpx", "grabpay"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "myr",
            product_data: {
              name: `LOVEYOUNG ${tierConfig.name}`,
              description: `联合经营人配套 - ${tierConfig.lyPoints} LY积分 + ${tierConfig.rwaTokens} RWA令牌`,
              images: ["https://loveyoung.my/images/partner-package.jpg"],
            },
            unit_amount: tierConfig.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "partner_join",
        memberId: memberId,
        tier: tier,
        lyPoints: String(tierConfig.lyPoints),
        rwaTokens: String(tierConfig.rwaTokens),
        referralCode: referralCode || "",
      },
      success_url: successUrl || `${req.headers.get("origin")}/member/partner?payment=success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/partner/join?payment=cancelled`,
    });

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Partner checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
