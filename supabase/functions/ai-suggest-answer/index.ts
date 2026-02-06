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
    const { question } = await req.json();

    if (!question) {
      return new Response(
        JSON.stringify({ error: "Missing required field: question" }),
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

    // Search for relevant context from knowledge base and memory tables
    const searchTerms = question.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
    const likePattern = searchTerms.length > 0 ? `%${searchTerms[0]}%` : `%${question}%`;

    const [knowledgeRes, productRes, partnerRes] = await Promise.all([
      supabase
        .from("ai_knowledge_base")
        .select("title, content")
        .eq("is_active", true)
        .ilike("content", likePattern)
        .limit(5),
      supabase
        .from("product_memory")
        .select("title, content")
        .eq("is_active", true)
        .ilike("content", likePattern)
        .limit(3),
      supabase
        .from("partner_memory")
        .select("title, content")
        .eq("is_active", true)
        .ilike("content", likePattern)
        .limit(3),
    ]);

    // Build context from search results
    const contextParts: string[] = [];

    if (knowledgeRes.data?.length) {
      contextParts.push("Knowledge Base:\n" + knowledgeRes.data.map(
        (k: { title: string; content: string }) => `- ${k.title}: ${k.content}`
      ).join("\n"));
    }

    if (productRes.data?.length) {
      contextParts.push("Product Information:\n" + productRes.data.map(
        (p: { title: string; content: string }) => `- ${p.title}: ${p.content}`
      ).join("\n"));
    }

    if (partnerRes.data?.length) {
      contextParts.push("Partner Information:\n" + partnerRes.data.map(
        (p: { title: string; content: string }) => `- ${p.title}: ${p.content}`
      ).join("\n"));
    }

    const context = contextParts.length > 0
      ? contextParts.join("\n\n")
      : "No relevant context found in the knowledge base.";

    // Call OpenAI to generate answer
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a helpful customer service AI for LOVE YOUNG, a Malaysian beauty and wellness brand. Answer questions based on the provided context. If the context doesn't contain enough information, provide a general helpful answer. Keep answers concise and professional. Respond in the same language as the question.`,
          },
          {
            role: "user",
            content: `Context:\n${context}\n\nQuestion: ${question}\n\nPlease provide a helpful answer:`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      throw new Error(`OpenAI API error: ${errText}`);
    }

    const chatData = await chatRes.json();
    const answer = chatData.choices[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ success: true, answer, context_sources: contextParts.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
