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
    const { product_id, topic, occasion, platform, tone, language, generate_image } = await req.json();

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

    // Get product context if product_id provided
    let productContext = "";
    let productName = "";
    if (product_id) {
      const { data: product } = await supabase
        .from("products")
        .select("name, description, price, category")
        .eq("id", product_id)
        .single();

      if (product) {
        productName = product.name;
        productContext = `Product: ${product.name}\nDescription: ${product.description || ""}\nPrice: RM ${(product.price / 100).toFixed(2)}\nCategory: ${product.category || ""}`;
      }

      const { data: memories } = await supabase
        .from("product_memory")
        .select("content, category")
        .eq("product_id", product_id)
        .limit(5);

      if (memories && memories.length > 0) {
        productContext += "\n\nProduct Knowledge:\n" + memories.map((m: any) => `- ${m.content}`).join("\n");
      }
    }

    // Build system prompt
    const langMap: Record<string, string> = {
      zh: "Chinese (Simplified)",
      en: "English",
      ms: "Bahasa Melayu",
    };
    const targetLang = langMap[language] || "Chinese (Simplified)";

    const occasionMap: Record<string, string> = {
      normal: "",
      chinese_new_year: "Chinese New Year / Spring Festival",
      hari_raya: "Hari Raya Aidilfitri",
      christmas: "Christmas",
      valentines: "Valentine's Day",
      mothers_day: "Mother's Day",
      mid_autumn: "Mid-Autumn Festival",
      product_launch: "Product Launch",
      flash_sale: "Flash Sale / Limited Time Offer",
    };

    const systemPrompt = `You are a professional social media content creator for LOVE YOUNG (养乐), a Malaysian health & wellness brand specializing in bird's nest collagen products.

Write content in ${targetLang}.
Platform: ${platform}
Tone: ${tone}
${occasionMap[occasion] ? `Occasion: ${occasionMap[occasion]}` : ""}
${productContext ? `\n${productContext}` : ""}

Generate:
1. An engaging title
2. Full post body with emojis appropriate for the platform
3. 5-8 relevant hashtags
4. 2-3 suggested image prompts for visual content (each prompt should be a detailed DALL-E prompt in English for generating a marketing image)

Return JSON: {"title": "...", "body": "...", "hashtags": ["..."], "suggested_image_prompts": ["..."]}`;

    const userPrompt = topic || "Create an engaging marketing post for the product.";

    // Call OpenAI Chat
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      throw new Error(`OpenAI API error: ${errText}`);
    }

    const openaiData = await openaiRes.json();
    const content = JSON.parse(openaiData.choices[0].message.content);

    // Generate image with DALL-E if requested
    let generated_image_url = null;
    if (generate_image && content.suggested_image_prompts?.length > 0) {
      try {
        const imagePrompt = content.suggested_image_prompts[0];
        const dalleRes = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: imagePrompt,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          }),
        });

        if (dalleRes.ok) {
          const dalleData = await dalleRes.json();
          const tempImageUrl = dalleData.data?.[0]?.url;

          if (tempImageUrl) {
            // Download image and upload to Supabase Storage
            const imageRes = await fetch(tempImageUrl);
            const imageBlob = await imageRes.blob();
            const fileName = `ai-generated/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

            const { error: uploadError } = await supabase.storage
              .from("marketing-content")
              .upload(fileName, imageBlob, {
                contentType: "image/png",
                upsert: false,
              });

            if (!uploadError) {
              const { data: publicUrl } = supabase.storage
                .from("marketing-content")
                .getPublicUrl(fileName);
              generated_image_url = publicUrl.publicUrl;
            }
          }
        }
      } catch (imgErr) {
        // Image generation failed, continue without image
        console.error("Image generation error:", imgErr);
      }
    }

    return new Response(JSON.stringify({ ...content, generated_image_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
