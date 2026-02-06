import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Meta ad accounts with access tokens
    const { data: adAccounts, error: accountError } = await supabase
      .from("meta_ad_accounts")
      .select("*")
      .not("access_token", "is", null);

    if (accountError) throw accountError;
    if (!adAccounts || adAccounts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No ad accounts configured", synced: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSynced = 0;

    for (const account of adAccounts) {
      try {
        // Call Meta Marketing API for insights
        const metaRes = await fetch(
          `https://graph.facebook.com/v18.0/act_${account.account_id}/insights?` +
          `fields=campaign_name,impressions,clicks,spend,conversions,ctr,cpc,cpm,reach&` +
          `date_preset=last_30d&level=campaign&limit=50&` +
          `access_token=${account.access_token}`
        );

        if (!metaRes.ok) {
          console.error(`Meta API error for account ${account.account_id}: ${metaRes.statusText}`);
          continue;
        }

        const metaData = await metaRes.json();

        if (metaData.data) {
          for (const insight of metaData.data) {
            const { error: upsertError } = await supabase
              .from("marketing_performance")
              .upsert({
                platform: "meta",
                campaign_name: insight.campaign_name,
                impressions: parseInt(insight.impressions || "0"),
                clicks: parseInt(insight.clicks || "0"),
                spend: Math.round(parseFloat(insight.spend || "0") * 100),
                conversions: parseInt(insight.conversions?.[0]?.value || "0"),
                ctr: parseFloat(insight.ctr || "0"),
                cpc: Math.round(parseFloat(insight.cpc || "0") * 100),
                reach: parseInt(insight.reach || "0"),
                date_start: insight.date_start,
                date_stop: insight.date_stop,
                account_id: account.account_id,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: "platform,campaign_name,date_start",
              });

            if (!upsertError) totalSynced++;
          }
        }
      } catch (e) {
        console.error(`Error syncing account ${account.account_id}:`, e);
      }
    }

    return new Response(
      JSON.stringify({ message: "Sync complete", synced: totalSynced }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
