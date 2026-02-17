import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `你是 LOVE YOUNG 订单补录助手。管理员会告诉你线下银行转账的支付信息，你需要帮助整理成结构化的数据记录。

【业务规则】
1. 经营人加入配套：
   - Phase 1 启航经营人: RM1,000 (100000 cents)
   - Phase 2 成长经营人: RM1,300 (130000 cents)
   - Phase 3 卓越经营人: RM1,500 (150000 cents)

2. 产品价格：
   - 燕窝/Bird's Nest: RM368/盒 (36800 cents)

3. 支付来源：银行转账 (bank_transfer)

【你的工作流程】
1. 接收管理员描述的支付信息
2. 判断是"经营人加入"还是"产品订单"还是两者都有
3. 主动思考并补充信息：
   - 根据金额自动推断类型（RM1000=Phase1, RM1300=Phase2, RM1500=Phase3, RM368=1盒燕窝, RM736=2盒等）
   - 如果提到推荐人/推荐码，记录下来
   - 计算总金额和数量
4. **重要：主动检查会员注册状态** - 每当提到一个客户时，提醒管理员该客户是否需要注册为会员。如果客户尚未注册，询问：
   - 是否需要帮她注册？
   - 如果需要，请提供 email 地址
   - 推荐人是谁？（推荐码或推荐人手机号）
5. 当所有信息确认后，调用 confirm_actions 工具

【注意事项】
- 手机号格式：马来西亚号码，如 0123456789 或 +60123456789
- 如果信息不完整，主动询问缺少的字段
- 每次管理员提供新信息，更新 parsed_actions
- 用中文回复，简洁友好`;

// Tool definitions for OpenAI function calling
const tools = [
  {
    type: "function" as const,
    function: {
      name: "update_parsed_actions",
      description:
        "Update the structured data parsed from the conversation. Call this whenever new payment info is provided or updated.",
      parameters: {
        type: "object",
        properties: {
          member_registrations: {
            type: "array",
            description: "New members to register before processing orders/partner joins",
            items: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "Customer full name" },
                customer_phone: { type: "string", description: "Phone number" },
                customer_email: { type: "string", description: "Email for registration" },
                referral_code: { type: "string", description: "Referrer's referral code or phone number" },
                notes: { type: "string" },
              },
              required: ["customer_name", "customer_phone"],
            },
          },
          partner_joins: {
            type: "array",
            description: "Partner join records from bank transfer payments",
            items: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "Customer full name" },
                customer_phone: { type: "string", description: "Phone number" },
                tier: {
                  type: "string",
                  enum: ["phase1", "phase2", "phase3"],
                  description: "Partner tier based on payment amount",
                },
                referral_code: { type: "string", description: "Referrer's referral code" },
                payment_amount_cents: { type: "number", description: "Payment amount in cents" },
                payment_reference: { type: "string", description: "Bank transfer reference or receipt info" },
                notes: { type: "string" },
              },
              required: ["customer_name", "customer_phone", "tier", "payment_amount_cents"],
            },
          },
          product_orders: {
            type: "array",
            description: "Product order records from bank transfer payments",
            items: {
              type: "object",
              properties: {
                customer_name: { type: "string", description: "Customer full name" },
                customer_phone: { type: "string", description: "Phone number" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      product_name: { type: "string" },
                      quantity: { type: "number" },
                      unit_price_cents: { type: "number" },
                    },
                    required: ["product_name", "quantity", "unit_price_cents"],
                  },
                },
                total_amount_cents: { type: "number" },
                box_count: { type: "number", description: "Total number of boxes" },
                referral_code: { type: "string" },
                payment_reference: { type: "string" },
                skip_cashback: { type: "boolean", description: "Whether to skip cashback calculation" },
                notes: { type: "string" },
              },
              required: ["customer_name", "customer_phone", "items", "total_amount_cents", "box_count"],
            },
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "confirm_actions",
      description:
        "Signal that all information has been collected and is ready for admin confirmation. Call this when the admin agrees to proceed.",
      parameters: {
        type: "object",
        properties: {
          summary: {
            type: "string",
            description: "Human-readable summary of all actions to be taken",
          },
        },
        required: ["summary"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "check_member_exists",
      description:
        "Check if a customer is already registered as a member by phone number. Always call this when a new customer is mentioned.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Customer phone number to check" },
        },
        required: ["phone"],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { session_id, message, image_url } = await req.json();

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

    // Get or create session
    let session;
    if (session_id) {
      const { data } = await supabase
        .from("order_supplement_sessions")
        .select("*")
        .eq("id", session_id)
        .single();
      session = data;
    }

    // Get auth user from authorization header
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!session) {
      const { data: newSession } = await supabase
        .from("order_supplement_sessions")
        .insert({
          admin_user_id: user.id,
          status: "in_progress",
          messages: [],
        })
        .select()
        .single();
      session = newSession;
    }

    if (!session) {
      return new Response(
        JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build messages for OpenAI
    const existingMessages = (session.messages || []) as Array<{
      role: string;
      content: string;
      tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
      tool_call_id?: string;
    }>;

    // Add new user message
    const updatedMessages = [...existingMessages];
    if (message) {
      // Store text-only version for session persistence
      updatedMessages.push({ role: "user", content: message });
    }

    // Build OpenAI messages - use multimodal content for image messages
    const openaiMessages: Array<Record<string, unknown>> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    // Add all previous messages as text
    for (const msg of existingMessages) {
      openaiMessages.push(msg);
    }

    // Add current message with optional image (GPT-4o vision)
    if (message) {
      if (image_url) {
        openaiMessages.push({
          role: "user",
          content: [
            { type: "text", text: message },
            { type: "image_url", image_url: { url: image_url, detail: "high" } },
          ],
        });
      } else {
        openaiMessages.push({ role: "user", content: message });
      }
    }

    // Call OpenAI with tool calling - loop to handle multiple tool calls
    let assistantMessage = null;
    let parsedActions = session.parsed_actions || null;
    let readyToConfirm = false;
    let confirmSummary = "";
    const allToolMessages: typeof updatedMessages = [];

    let currentMessages = openaiMessages;
    let loopCount = 0;
    const maxLoops = 5; // Prevent infinite loops

    while (loopCount < maxLoops) {
      loopCount++;

      const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: currentMessages,
          tools,
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!chatRes.ok) {
        const errText = await chatRes.text();
        throw new Error(`OpenAI API error: ${errText}`);
      }

      const chatData = await chatRes.json();
      const choice = chatData.choices[0];
      const responseMessage = choice.message;

      // If the model wants to call tools
      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls to conversation
        allToolMessages.push({
          role: "assistant",
          content: responseMessage.content || "",
          tool_calls: responseMessage.tool_calls,
        });

        // Process each tool call
        for (const toolCall of responseMessage.tool_calls) {
          const fnName = toolCall.function.name;
          const fnArgs = JSON.parse(toolCall.function.arguments);

          let toolResult = "";

          if (fnName === "update_parsed_actions") {
            parsedActions = fnArgs;
            toolResult = JSON.stringify({ success: true, message: "Actions updated" });
          } else if (fnName === "confirm_actions") {
            readyToConfirm = true;
            confirmSummary = fnArgs.summary;
            toolResult = JSON.stringify({
              success: true,
              status: "ready_to_confirm",
              summary: fnArgs.summary,
            });
          } else if (fnName === "check_member_exists") {
            // Actually check the database
            const phone = fnArgs.phone.replace(/\s+/g, "").replace(/^(\+?60)/, "0");
            const phoneVariants = [phone];
            if (phone.startsWith("0")) {
              phoneVariants.push("+6" + phone);
              phoneVariants.push("6" + phone);
            }

            const { data: member } = await supabase
              .from("members")
              .select("id, name, phone, email, role, referral_code, referrer_id")
              .or(phoneVariants.map((p) => `phone.eq.${p}`).join(","))
              .limit(1)
              .maybeSingle();

            if (member) {
              // Check if already a partner
              const { data: partner } = await supabase
                .from("partners")
                .select("id, tier, status")
                .eq("member_id", member.id)
                .eq("status", "active")
                .maybeSingle();

              toolResult = JSON.stringify({
                exists: true,
                member_id: member.id,
                name: member.name,
                phone: member.phone,
                email: member.email,
                role: member.role,
                referral_code: member.referral_code,
                has_referrer: !!member.referrer_id,
                is_partner: !!partner,
                partner_tier: partner?.tier || null,
              });
            } else {
              toolResult = JSON.stringify({
                exists: false,
                message: "该手机号未注册为会员。需要先注册会员才能处理订单或经营人加入。请询问管理员是否需要注册，如需注册请提供email和推荐人信息。",
              });
            }
          }

          allToolMessages.push({
            role: "tool",
            content: toolResult,
            tool_call_id: toolCall.id,
          });
        }

        // Continue the loop with updated messages
        currentMessages = [
          { role: "system", content: SYSTEM_PROMPT },
          ...updatedMessages,
          ...allToolMessages,
        ];

        // If ready to confirm, we still want the final text response
        if (readyToConfirm && !responseMessage.content) {
          continue;
        }

        // If there's no text content yet, continue to get final response
        if (!responseMessage.content) {
          continue;
        }

        assistantMessage = responseMessage.content;
        break;
      } else {
        // No tool calls - just a text response
        assistantMessage = responseMessage.content || "";
        break;
      }
    }

    // If we exited the loop without a text response, make one more call
    if (!assistantMessage) {
      const finalMessages = [
        { role: "system", content: SYSTEM_PROMPT },
        ...updatedMessages,
        ...allToolMessages,
      ];

      const finalRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: finalMessages,
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (finalRes.ok) {
        const finalData = await finalRes.json();
        assistantMessage = finalData.choices[0]?.message?.content || "操作已处理。";
      } else {
        assistantMessage = readyToConfirm
          ? confirmSummary
          : "抱歉，处理时遇到问题，请重试。";
      }
    }

    // Save messages to session (only user + assistant text, not tool calls)
    const savedMessages = [
      ...updatedMessages,
      { role: "assistant", content: assistantMessage },
    ];

    await supabase
      .from("order_supplement_sessions")
      .update({
        messages: savedMessages,
        parsed_actions: parsedActions,
        updated_at: new Date().toISOString(),
      })
      .eq("id", session.id);

    return new Response(
      JSON.stringify({
        success: true,
        session_id: session.id,
        message: assistantMessage,
        parsed_actions: parsedActions,
        ready_to_confirm: readyToConfirm,
        confirm_summary: confirmSummary || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Order supplement error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
