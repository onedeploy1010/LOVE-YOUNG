import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.10.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    const { orderId, orderNumber, amount, customerEmail, customerName, successUrl, cancelUrl } = await req.json();

    if (!orderId || !amount) {
      throw new Error("Missing required fields: orderId and amount");
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "fpx", "grabpay"],
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: [
        {
          price_data: {
            currency: "myr",
            product_data: {
              name: "2026发财礼盒 Fortune Gift Box",
              description: `Order #${orderNumber}`,
              images: ["https://loveyoung.my/images/fortune-box.jpg"],
            },
            unit_amount: amount, // Amount in cents (sen)
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: orderId,
        orderNumber: orderNumber,
        customerName: customerName || "",
      },
      success_url: successUrl || `${req.headers.get("origin")}/order-tracking?order=${orderNumber}&status=success`,
      cancel_url: cancelUrl || `${req.headers.get("origin")}/?payment=cancelled`,
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
    console.error("Stripe checkout error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
