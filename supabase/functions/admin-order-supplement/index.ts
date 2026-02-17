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
1. 经营人加入配套（原价/应付）：
   - Phase 1 启航经营人: RM1,000 (100000 cents)
   - Phase 2 成长经营人: RM1,300 (130000 cents)
   - Phase 3 卓越经营人: RM1,500 (150000 cents)

2. 产品价格：
   - 燕窝/Bird's Nest: RM368/盒 (36800 cents)

3. 奖励体系（客户可能自己扣除的金额来源）：
   - 推荐奖金/Referral Bonus：直推10%、间推5%（例如推荐Phase1可获RM100）
   - 现金钱包余额/Cash Wallet：经营人钱包里的返现余额
   - 订单返现/Order Cashback：产品订单的50%或30%返现
   - 同级奖金/Same-level Bonus：下级返现的10%
   - 其他折扣/优惠

4. 支付来源：银行转账 (bank_transfer)

【重要：金额分析智能推理】
当转账金额与标准价格不一致时，你必须主动分析原因：

例子1：转账RM900，但Phase1是RM1000
→ 推理：可能扣除了RM100推荐奖金
→ 询问管理员："转账RM900比Phase1原价RM1000少了RM100，是否客户用了推荐奖金/现金钱包抵扣？请确认抵扣明细。"

例子2：转账RM600，买了2盒燕窝（应付RM736）
→ 推理：少了RM136，可能用了返现抵扣
→ 询问确认

例子3：转账RM1800，可能是Phase1 RM1000 + 2盒燕窝RM736 = RM1736，多出RM64需要确认
→ 或者是Phase2 RM1300 + 1盒RM368 + 扣除了什么

你的分析步骤：
1. 先算出最可能的组合（配套+产品）
2. 如果金额完全匹配，直接记录
3. 如果有差额，列出可能的抵扣原因（推荐奖金、现金钱包、返现等），主动询问管理员确认
4. 确认后记录：原价(order_amount)、实际转账(actual_paid)、抵扣明细(deductions)

【你的工作流程】
1. 接收管理员描述的支付信息（文字或转账截图）
2. 分析金额，判断是"经营人加入"还是"产品订单"还是两者都有
3. **如果金额与标准价格有差异，主动推理并询问确认抵扣明细**
4. 主动思考并补充信息：
   - 根据金额自动推断类型
   - 如果提到推荐人/推荐码，记录下来
   - 计算总金额和数量
5. **重要：主动检查会员注册状态** - 每当提到一个客户时，先调用check_member_exists检查。如果客户尚未注册，询问：
   - 是否需要帮她注册？
   - 如果需要，请提供 email 地址
   - 推荐人是谁？（推荐码或推荐人手机号）
6. **金额差异分析** - 当转账金额与标准价格不一致时，调用query_member_data查询该会员的钱包余额、奖金记录等，智能分析抵扣来源
7. 当所有信息确认后，调用 confirm_actions 工具
8. **知识积累** - 分析过程中发现重要的数据模式、异常、或业务规律时，调用save_to_memory保存到知识库

【注意事项】
- 手机号格式：马来西亚号码，如 0123456789 或 +60123456789
- 如果信息不完整，主动询问缺少的字段
- 每次管理员提供新信息，更新 parsed_actions
- 金额记录：payment_amount_cents = 原价（系统按原价计算奖励），actual_paid_cents = 实际转账金额
- 抵扣明细记录在 deductions 数组中，每项包含类型和金额
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
                payment_amount_cents: { type: "number", description: "Original full price in cents (e.g. Phase1=100000)" },
                actual_paid_cents: { type: "number", description: "Actual bank transfer amount in cents (may be less than full price if deductions applied)" },
                deductions: {
                  type: "array",
                  description: "Breakdown of deductions/offsets applied by customer",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Type: referral_bonus, cash_wallet, cashback, same_level_bonus, discount, other" },
                      amount_cents: { type: "number", description: "Deduction amount in cents" },
                      description: { type: "string", description: "Human-readable description" },
                    },
                    required: ["type", "amount_cents", "description"],
                  },
                },
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
                total_amount_cents: { type: "number", description: "Original full price in cents (quantity * unit_price)" },
                actual_paid_cents: { type: "number", description: "Actual bank transfer amount in cents" },
                deductions: {
                  type: "array",
                  description: "Breakdown of deductions/offsets applied",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Type: referral_bonus, cash_wallet, cashback, same_level_bonus, discount, other" },
                      amount_cents: { type: "number", description: "Deduction amount in cents" },
                      description: { type: "string", description: "Human-readable description" },
                    },
                    required: ["type", "amount_cents", "description"],
                  },
                },
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
  {
    type: "function" as const,
    function: {
      name: "query_member_data",
      description:
        "Query detailed financial data for a member: wallet balance, partner tier, recent bonuses, orders, LY points. Use this to analyze payment discrepancies by checking what bonuses/wallet balance a member has.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Member phone number to look up" },
          include_orders: { type: "boolean", description: "Include recent orders (default true)" },
          include_wallet_history: { type: "boolean", description: "Include wallet transaction history (default true)" },
        },
        required: ["phone"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "save_to_memory",
      description:
        "Save important data relationships, patterns, or insights you discover during analysis to a persistent knowledge base. This helps you understand the backend better in future sessions. Save things like: data anomalies found, common deduction patterns, member behavior patterns, data relationships that are important.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["data_pattern", "member_insight", "pricing_rule", "deduction_pattern", "data_fix", "business_rule"],
            description: "Category of the knowledge being saved",
          },
          title: { type: "string", description: "Short title for this knowledge entry" },
          content: { type: "string", description: "Detailed description of the insight or pattern" },
          importance: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "How important this knowledge is for future reference",
          },
        },
        required: ["category", "title", "content"],
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

    // Load AI knowledge memory
    let memoryContext = "";
    try {
      const { data: memoryData } = await supabase
        .from("system_config")
        .select("config_value")
        .eq("category", "ai_knowledge")
        .eq("config_key", "memory_entries")
        .maybeSingle();

      if (memoryData?.config_value) {
        const entries = typeof memoryData.config_value === "string"
          ? JSON.parse(memoryData.config_value)
          : memoryData.config_value;
        if (entries.length > 0) {
          // Sort by importance, show high importance first
          const sorted = [...entries].sort((a: { importance: string }, b: { importance: string }) => {
            const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
            return (order[a.importance] ?? 1) - (order[b.importance] ?? 1);
          });
          const memoryLines = sorted.map((e: { category: string; title: string; content: string; importance: string }) =>
            `[${e.importance?.toUpperCase()}][${e.category}] ${e.title}: ${e.content}`
          );
          memoryContext = `\n\n【知识库 - 历史分析记忆】\n以下是你之前分析中保存的重要发现和模式，请参考：\n${memoryLines.join("\n")}`;
        }
      }
    } catch { /* ignore memory load errors */ }

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
    const fullSystemPrompt = SYSTEM_PROMPT + memoryContext;
    const openaiMessages: Array<Record<string, unknown>> = [
      { role: "system", content: fullSystemPrompt },
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
          max_tokens: 2000,
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
                .select("id, tier, status, cash_wallet_balance, ly_balance, rwa_tokens")
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
                cash_wallet_balance: partner?.cash_wallet_balance || 0,
                ly_balance: partner?.ly_balance || 0,
              });
            } else {
              toolResult = JSON.stringify({
                exists: false,
                message: "该手机号未注册为会员。需要先注册会员才能处理订单或经营人加入。请询问管理员是否需要注册，如需注册请提供email和推荐人信息。",
              });
            }
          } else if (fnName === "query_member_data") {
            // Deep member data query for payment analysis
            const phone = fnArgs.phone.replace(/\s+/g, "").replace(/^(\+?60)/, "0");
            const phoneVariants = [phone];
            if (phone.startsWith("0")) {
              phoneVariants.push("+6" + phone);
              phoneVariants.push("6" + phone);
            }

            const { data: member } = await supabase
              .from("members")
              .select("id, name, phone, email, role, referral_code, referrer_id, points_balance")
              .or(phoneVariants.map((p) => `phone.eq.${p}`).join(","))
              .limit(1)
              .maybeSingle();

            if (!member) {
              toolResult = JSON.stringify({ exists: false, message: "会员不存在" });
            } else {
              const result: Record<string, unknown> = {
                member: {
                  id: member.id, name: member.name, phone: member.phone,
                  email: member.email, role: member.role,
                  referral_code: member.referral_code,
                  has_referrer: !!member.referrer_id,
                  points_balance: member.points_balance,
                },
              };

              // Get partner data
              const { data: partner } = await supabase
                .from("partners")
                .select("id, tier, status, cash_wallet_balance, ly_balance, rwa_tokens, total_sales, total_cashback, total_boxes_processed, payment_amount, payment_date, created_at")
                .eq("member_id", member.id)
                .maybeSingle();

              if (partner) {
                result.partner = {
                  tier: partner.tier,
                  status: partner.status,
                  cash_wallet_balance_cents: partner.cash_wallet_balance,
                  cash_wallet_balance_rm: `RM ${((partner.cash_wallet_balance || 0) / 100).toFixed(2)}`,
                  ly_balance: partner.ly_balance,
                  rwa_tokens: partner.rwa_tokens,
                  total_sales_cents: partner.total_sales,
                  total_cashback_cents: partner.total_cashback,
                  total_boxes: partner.total_boxes_processed,
                  joined_amount_cents: partner.payment_amount,
                  joined_date: partner.payment_date || partner.created_at,
                };

                // Get referrer info
                if (member.referrer_id) {
                  const { data: referrer } = await supabase
                    .from("members")
                    .select("name, phone, referral_code")
                    .eq("id", member.referrer_id)
                    .maybeSingle();
                  if (referrer) {
                    result.referrer = { name: referrer.name, phone: referrer.phone, referral_code: referrer.referral_code };
                  }
                }

                // Get wallet transaction history (recent 10)
                if (fnArgs.include_wallet_history !== false) {
                  const { data: walletHistory } = await supabase
                    .from("cash_wallet_ledger")
                    .select("type, amount, description, reference_type, status, created_at")
                    .eq("partner_id", partner.id)
                    .order("created_at", { ascending: false })
                    .limit(10);
                  result.recent_wallet_transactions = (walletHistory || []).map((t: Record<string, unknown>) => ({
                    type: t.type,
                    amount_cents: t.amount,
                    amount_rm: `RM ${(Math.abs(Number(t.amount) || 0) / 100).toFixed(2)}`,
                    description: t.description,
                    reference_type: t.reference_type,
                    status: t.status,
                    date: t.created_at,
                  }));
                }
              }

              // Get recent orders
              if (fnArgs.include_orders !== false) {
                const { data: orders } = await supabase
                  .from("orders")
                  .select("id, order_number, status, total_amount, items, source, source_channel, notes, created_at")
                  .eq("member_id", member.id)
                  .order("created_at", { ascending: false })
                  .limit(10);
                result.recent_orders = (orders || []).map((o: Record<string, unknown>) => ({
                  order_number: o.order_number,
                  status: o.status,
                  total_amount_cents: o.total_amount,
                  total_amount_rm: `RM ${((Number(o.total_amount) || 0) / 100).toFixed(2)}`,
                  source: o.source,
                  notes: o.notes,
                  date: o.created_at,
                }));
              }

              // Get downline count (people this member referred)
              const { count: downlineCount } = await supabase
                .from("members")
                .select("id", { count: "exact", head: true })
                .eq("referrer_id", member.id);
              result.downline_count = downlineCount || 0;

              toolResult = JSON.stringify(result);
            }
          } else if (fnName === "save_to_memory") {
            // Save AI insights to persistent knowledge base
            const { data: existing } = await supabase
              .from("system_config")
              .select("config_value")
              .eq("category", "ai_knowledge")
              .eq("config_key", "memory_entries")
              .maybeSingle();

            const entries = existing?.config_value
              ? (typeof existing.config_value === "string" ? JSON.parse(existing.config_value) : existing.config_value)
              : [];

            entries.push({
              id: crypto.randomUUID(),
              category: fnArgs.category,
              title: fnArgs.title,
              content: fnArgs.content,
              importance: fnArgs.importance || "medium",
              created_at: new Date().toISOString(),
              session_id: session.id,
            });

            // Keep last 50 entries
            const trimmedEntries = entries.slice(-50);

            await supabase.from("system_config").upsert({
              category: "ai_knowledge",
              config_key: "memory_entries",
              config_value: JSON.stringify(trimmedEntries),
            }, { onConflict: "category,config_key" });

            toolResult = JSON.stringify({ success: true, message: `已保存到知识库: ${fnArgs.title}`, total_entries: trimmedEntries.length });
          }

          allToolMessages.push({
            role: "tool",
            content: toolResult,
            tool_call_id: toolCall.id,
          });
        }

        // Continue the loop with updated messages
        currentMessages = [
          { role: "system", content: fullSystemPrompt },
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
        { role: "system", content: fullSystemPrompt },
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
          max_tokens: 2000,
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
