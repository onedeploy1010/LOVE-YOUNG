import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const whatsappToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { notification_id, target_admin_id } = body;

    if (!notification_id) {
      throw new Error("notification_id is required");
    }

    // Get the notification
    const { data: notification, error: notifError } = await supabase
      .from("admin_notifications")
      .select("*")
      .eq("id", notification_id)
      .single();

    if (notifError || !notification) {
      throw new Error("Notification not found");
    }

    // Find target admins with matching notification preferences
    let adminQuery = supabase
      .from("whatsapp_admins")
      .select("*")
      .eq("is_active", true);

    // Filter by preference based on notification type
    switch (notification.type) {
      case "withdrawal_request":
        adminQuery = adminQuery.eq("notify_withdrawals", true);
        break;
      case "new_order":
      case "order_status":
        adminQuery = adminQuery.eq("notify_orders", true);
        break;
      case "shipping_update":
        adminQuery = adminQuery.eq("notify_shipping", true);
        break;
      case "new_partner":
        adminQuery = adminQuery.eq("notify_partners", true);
        break;
    }

    // If specific admin targeted, filter further
    if (target_admin_id) {
      adminQuery = adminQuery.eq("id", target_admin_id);
    }

    const { data: admins } = await adminQuery;

    if (!admins || admins.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No matching admins found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const results = [];

    for (const admin of admins) {
      const phone = admin.phone_number?.replace(/[^0-9]/g, "");
      if (!phone) continue;

      // If WhatsApp Cloud API is configured, send via API
      if (whatsappToken && whatsappPhoneId) {
        try {
          const message = `📢 *${notification.title}*\n\n${notification.content}\n\n_${new Date(notification.created_at).toLocaleString("zh-CN")}_`;

          const response = await fetch(
            `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${whatsappToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: phone,
                type: "text",
                text: { body: message },
              }),
            }
          );

          const result = await response.json();
          results.push({ admin_id: admin.id, phone, success: response.ok, result });
        } catch (err) {
          results.push({ admin_id: admin.id, phone, success: false, error: err.message });
        }
      } else {
        // No WhatsApp API configured - just mark as sent (for demo/testing)
        results.push({ admin_id: admin.id, phone, success: true, message: "WhatsApp API not configured, marked as sent" });
      }
    }

    // Update notification as sent
    await supabase
      .from("admin_notifications")
      .update({ sent_to_whatsapp: true })
      .eq("id", notification_id);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
