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
    const { text, table, record_id } = await req.json();

    if (!text || !table || !record_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text, table, record_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate table name to prevent injection
    const allowedTables = ["product_memory", "customer_memory", "partner_memory", "ai_knowledge_base", "ai_training_data"];
    if (!allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({ error: `Invalid table: ${table}. Allowed: ${allowedTables.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key from system_config
    const { data: configData } = await supabase
      .from("system_config")
      .select("config_value")
      .eq("category", "openai")
      .eq("config_key", "api_key")
      .single();

    const openaiKey = configData?.config_value;
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call OpenAI Embeddings API
    const embeddingRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1536,
      }),
    });

    if (!embeddingRes.ok) {
      const errText = await embeddingRes.text();
      throw new Error(`OpenAI Embeddings API error: ${errText}`);
    }

    const embeddingData = await embeddingRes.json();
    const embedding = embeddingData.data[0].embedding;

    // Convert embedding array to PostgreSQL vector format string
    const embeddingStr = `[${embedding.join(",")}]`;

    // Update the record with the embedding using raw SQL
    const { error: updateError } = await supabase.rpc("update_embedding", {
      p_table: table,
      p_id: record_id,
      p_embedding: embeddingStr,
    });

    if (updateError) {
      // Fallback: try direct update with string cast
      const { error: fallbackError } = await supabase
        .from(table)
        .update({ embedding: embeddingStr })
        .eq("id", record_id);

      if (fallbackError) throw fallbackError;
    }

    return new Response(
      JSON.stringify({ success: true, dimensions: embedding.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
