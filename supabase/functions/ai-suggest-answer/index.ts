import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const languageInstructions: Record<string, string> = {
  zh: "请用中文回答。",
  en: "Please respond in English.",
  ms: "Sila jawab dalam Bahasa Melayu.",
};

const negativeKeywords = [
  // Chinese
  "不好", "差", "失望", "投诉", "退款", "不满", "问题", "糟糕", "烂", "骗",
  // English
  "bad", "terrible", "disappoint", "complain", "refund", "unhappy", "poor", "worst", "awful",
  // Malay
  "buruk", "teruk", "kecewa", "aduan", "bayaran balik",
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      question,
      language = "zh",
      conversation_history = [],
      conversation_id,
      member_id,
    } = await req.json();

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

    // Query knowledge base - search in content and title
    const knowledgeRes = await supabase
      .from("ai_knowledge_base")
      .select("title, content, category")
      .eq("is_active", true)
      .or(`content.ilike.${likePattern},title.ilike.${likePattern}`)
      .limit(5);

    // Also try searching training data for direct Q&A matches
    const trainingRes = await supabase
      .from("ai_training_data")
      .select("question, answer")
      .eq("is_verified", true)
      .or(`question.ilike.${likePattern},answer.ilike.${likePattern}`)
      .limit(3);

    // Query memory tables (may not exist, handle gracefully)
    let productRes = { data: null, error: null };
    let partnerRes = { data: null, error: null };

    try {
      productRes = await supabase
        .from("product_memory")
        .select("title, content")
        .eq("is_active", true)
        .ilike("content", likePattern)
        .limit(3);
    } catch {
      // Table may not exist, ignore
    }

    try {
      partnerRes = await supabase
        .from("partner_memory")
        .select("title, content")
        .eq("is_active", true)
        .ilike("content", likePattern)
        .limit(3);
    } catch {
      // Table may not exist, ignore
    }

    // Build context from search results
    const contextParts: string[] = [];

    if (knowledgeRes.data?.length) {
      contextParts.push("Knowledge Base:\n" + knowledgeRes.data.map(
        (k: { title: string; content: string }) => `- ${k.title}: ${k.content}`
      ).join("\n"));
    }

    if (trainingRes.data?.length) {
      contextParts.push("Related Q&A:\n" + trainingRes.data.map(
        (q: { question: string; answer: string }) => `Q: ${q.question}\nA: ${q.answer}`
      ).join("\n\n"));
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

    // Check for negative sentiment → fetch product recommendations
    const questionLower = question.toLowerCase();
    const hasNegativeSentiment = negativeKeywords.some(kw => questionLower.includes(kw));
    let recommendedProducts: Array<{ id: string; name: string; price: number; image_url: string | null }> = [];

    if (hasNegativeSentiment) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, image_url")
        .eq("is_active", true)
        .limit(3);
      if (products?.length) {
        recommendedProducts = products;
        contextParts.push(
          "Recommended Products (suggest these to the customer):\n" +
          products.map((p: { name: string; price: number }) =>
            `- ${p.name}: RM ${(p.price / 100).toFixed(2)}`
          ).join("\n")
        );
      }
    }

    const context = contextParts.length > 0
      ? contextParts.join("\n\n")
      : "No relevant context found in the knowledge base.";

    // Get bot config for web_chat system prompt
    const { data: botConfig } = await supabase
      .from("ai_bot_config")
      .select("system_prompt, max_tokens, temperature")
      .eq("id", "web_chat")
      .single();

    const defaultPrompt = `You are a friendly customer service AI for LOVE YOUNG (燕之爱), a Malaysian premium bird's nest brand.

CONVERSATION STYLE:
- Keep responses SHORT (3-4 sentences max)
- Be conversational, like chatting with a friend
- Use emojis appropriately to add warmth
- After explaining something, ask "明白了吗？" or "需要我再解释吗？"
- If customer doesn't understand, explain in a simpler way
- Guide customer to next action (view products at /products, join partner program, etc.)

KNOWLEDGE:
- Answer based on the provided context
- For product questions, recommend specific products and mention /products to purchase
- For partner program questions, explain simply and guide to /partner/join
- If unsure, offer to connect with human support via WhatsApp: +60 17-822 8658`;

    const systemPrompt = botConfig?.system_prompt || defaultPrompt;

    const langInstruction = languageInstructions[language] || languageInstructions.zh;

    // Build messages array with conversation history
    const messages = [
      {
        role: "system",
        content: `${systemPrompt}\n\n${langInstruction}`,
      },
    ];

    // Add conversation history for context continuity
    for (const msg of conversation_history.slice(-10)) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add current question with context
    messages.push({
      role: "user",
      content: `Context:\n${context}\n\nQuestion: ${question}\n\nPlease provide a helpful answer:`,
    });

    // Call OpenAI to generate answer
    const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: botConfig?.temperature ?? 0.7,
        max_tokens: botConfig?.max_tokens ?? 500,
      }),
    });

    if (!chatRes.ok) {
      const errText = await chatRes.text();
      throw new Error(`OpenAI API error: ${errText}`);
    }

    const chatData = await chatRes.json();
    const answer = chatData.choices[0]?.message?.content || "";

    // Persist conversation and messages if conversation_id or member_id provided
    let activeConversationId = conversation_id;

    if (member_id && !activeConversationId) {
      // Create new conversation
      const { data: conv } = await supabase
        .from("ai_conversations")
        .insert({
          bot_id: "web_chat",
          member_id,
          language,
          channel: "web",
          status: "active",
        })
        .select("id")
        .single();
      activeConversationId = conv?.id;
    }

    if (activeConversationId) {
      // Save user message and assistant reply
      await supabase.from("ai_messages").insert([
        { conversation_id: activeConversationId, role: "user", content: question },
        { conversation_id: activeConversationId, role: "assistant", content: answer },
      ]);

      // Update message count
      try {
        await supabase.rpc("increment_message_count", { conv_id: activeConversationId });
      } catch {
        // Fallback: manual update if RPC doesn't exist
        await supabase
          .from("ai_conversations")
          .update({ message_count: conversation_history.length + 2 })
          .eq("id", activeConversationId);
      }
    }

    // Save to ai_training_data for learning
    try {
      await supabase.from("ai_training_data").insert({
        question,
        answer,
        category: "general",
        source: "customer_asked",
        confidence_score: contextParts.length > 0 ? 0.8 : 0.4,
        metadata: { language, member_id, conversation_id: activeConversationId },
      });
    } catch {
      // Non-critical, don't fail the request
    }

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        context_sources: contextParts.length,
        conversation_id: activeConversationId,
        recommended_products: recommendedProducts.length > 0 ? recommendedProducts : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI suggest answer error:", error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        answer: "抱歉，我遇到了一些技术问题。请稍后再试，或者通过 WhatsApp 联系我们：+60 17-822 8658 😊"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
