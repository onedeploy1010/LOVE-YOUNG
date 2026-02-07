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
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
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

    // Detect question intent for targeted search
    const questionLower = question.toLowerCase();
    const isProductQuestion = /产品|燕窝|价格|多少钱|买|购买|口味|product|price|buy|bird.?nest/i.test(question);
    const isPartnerQuestion = /经营人|合伙|加盟|赚钱|收益|LY|RWA|返现|partner|join|earn|commission/i.test(question);
    const isBrandQuestion = /品牌|公司|LOVE|YOUNG|燕之爱|brand|company|about/i.test(question);

    // Determine category to search
    let categoryFilter = null;
    if (isProductQuestion) categoryFilter = "product";
    else if (isPartnerQuestion) categoryFilter = "partner";
    else if (isBrandQuestion) categoryFilter = "general";

    // Build search patterns from question keywords
    const searchTerms = question
      .replace(/[?？！!。，,]/g, "")
      .split(/\s+/)
      .filter((w: string) => w.length > 1);

    // Query knowledge base with category filter if applicable
    let knowledgeQuery = supabase
      .from("ai_knowledge_base")
      .select("title, content, category")
      .eq("is_active", true);

    if (categoryFilter) {
      knowledgeQuery = knowledgeQuery.eq("category", categoryFilter);
    }

    const knowledgeRes = await knowledgeQuery.limit(5);

    // If no results with category filter, try without filter
    let fallbackKnowledge = { data: null };
    if (!knowledgeRes.data?.length && categoryFilter) {
      fallbackKnowledge = await supabase
        .from("ai_knowledge_base")
        .select("title, content, category")
        .eq("is_active", true)
        .limit(3);
    }

    // Search training data Q&A with keyword matching
    let trainingRes = { data: null };
    if (searchTerms.length > 0) {
      const searchPattern = `%${searchTerms[0]}%`;
      trainingRes = await supabase
        .from("ai_training_data")
        .select("question, answer")
        .eq("is_verified", true)
        .ilike("question", searchPattern)
        .limit(3);
    }

    // If product question, fetch featured products first (发财礼盒)
    let productsData: Array<{ id: string; name: string; price: number; description: string | null; image: string | null }> = [];
    if (isProductQuestion) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, description, image")
        .order("featured", { ascending: false })
        .limit(2);
      if (products) productsData = products;
    }

    // Build context from search results
    const contextParts: string[] = [];

    // Add knowledge base content (truncated to keep responses concise)
    const allKnowledge = [
      ...(knowledgeRes.data || []),
      ...(fallbackKnowledge.data || [])
    ];
    if (allKnowledge.length) {
      // Only use first 200 chars of each knowledge entry
      const summaries = allKnowledge.slice(0, 2).map(
        (k: { title: string; content: string }) => `${k.title}: ${k.content.slice(0, 150)}...`
      );
      contextParts.push("参考信息:\n" + summaries.join("\n"));
    }

    // Add training Q&A (only first matching one)
    if (trainingRes.data?.length) {
      const first = trainingRes.data[0];
      contextParts.push(`参考回答: ${first.answer.slice(0, 100)}`);
    }

    // Add actual product data if this is a product question (simplified)
    if (productsData.length) {
      contextParts.push("热门产品: " + productsData.map(
        (p: { name: string; price: number }) => `${p.name} RM${(p.price / 100).toFixed(0)}`
      ).join("、") + "。更多产品在 /products");
    }

    // Query memory tables (may not exist, handle gracefully)
    let productRes = { data: null, error: null };
    let partnerRes = { data: null, error: null };

    if (!isProductQuestion) {
      try {
        productRes = await supabase
          .from("product_memory")
          .select("title, content")
          .eq("is_active", true)
          .limit(3);
      } catch {
        // Table may not exist
      }
    }

    if (!isPartnerQuestion) {
      try {
        partnerRes = await supabase
          .from("partner_memory")
          .select("title, content")
          .eq("is_active", true)
          .limit(3);
      } catch {
        // Table may not exist
      }
    }

    if (productRes.data?.length) {
      contextParts.push("Product Memory:\n" + productRes.data.map(
        (p: { title: string; content: string }) => `- ${p.title}: ${p.content}`
      ).join("\n"));
    }

    if (partnerRes.data?.length) {
      contextParts.push("Partner Memory:\n" + partnerRes.data.map(
        (p: { title: string; content: string }) => `- ${p.title}: ${p.content}`
      ).join("\n"));
    }

    // Check for negative sentiment → fetch product recommendations
    const hasNegativeSentiment = negativeKeywords.some(kw => questionLower.includes(kw));
    let recommendedProducts: Array<{ id: string; name: string; price: number; image_url: string | null }> = [];

    // Return products for product questions or negative sentiment
    if (isProductQuestion && productsData.length) {
      // Use already fetched products data for product questions
      recommendedProducts = productsData.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image,
      }));
    } else if (hasNegativeSentiment) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, price, image")
        .limit(3);
      if (products?.length) {
        recommendedProducts = products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          image_url: p.image,
        }));
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

    const defaultPrompt = `你是 LOVE YOUNG（养乐）的客服，像朋友聊天一样回答。

【严格限制】回复不能超过50字！一次只说一个重点！

回答模式：
- 产品问题 → "我们主打即食燕窝，RM199起😊 要我推荐适合你的吗？"
- 经营人问题 → "成为经营人可以赚返佣哦！想了解怎么加入吗？"
- 价格问题 → 直接说价格 + "去 /products 下单吧！"

规则：
- 不要列清单，不要用markdown格式
- 每次只回答一个点
- 结尾问一句引导下一轮对话
- 不确定就说联系WhatsApp: +60 17-822 8658`;

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
      content: `${context}\n\n用户问: ${question}\n\n【重要：用2-3句话简短回答，不要列清单】`,
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
        max_tokens: botConfig?.max_tokens ?? 150,
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
