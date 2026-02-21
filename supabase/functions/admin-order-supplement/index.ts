import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ============ Business Constants (mirrored from partner.ts) ============
const PARTNER_TIERS: Record<string, { name: string; price: number; initialLyPoints: number; initialRwaTokens: number }> = {
  phase1: { name: "Phase 1 - 启航经营人", price: 100000, initialLyPoints: 2000, initialRwaTokens: 1 },
  phase2: { name: "Phase 2 - 成长经营人", price: 130000, initialLyPoints: 2600, initialRwaTokens: 1 },
  phase3: { name: "Phase 3 - 卓越经营人", price: 150000, initialLyPoints: 3000, initialRwaTokens: 1 },
};
const REFERRAL_BONUS = { directRate: 0.10, indirectRate: 0.05 };
const ORDER_CASHBACK_CONFIG = { first5Rate: 0.50, afterRate: 0.30, sameLevelRate: 0.10, sameLevelMaxGen: 2 };
const LY_NETWORK_LEVELS = [20, 15, 10, 10, 10, 5, 5, 5, 5, 5];
const BONUS_POOL_CONFIG = { salesContributionRate: 0.30, cycleDays: 10 };

// ============ Helper functions ============
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateOrderNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LY${y}${m}${day}${rand}`;
}

function generateBillNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BILL-${datePart}-${rand}`;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").replace(/^(\+?60)/, "0");
}

function phoneVariants(phone: string): string[] {
  const p = normalizePhone(phone);
  const variants = [p];
  if (p.startsWith("0")) {
    variants.push("+6" + p);
    variants.push("6" + p);
  }
  return variants;
}

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// ============ DB Helper functions (replicated from partner.ts for edge fn) ============

async function addLyPoints(
  supabase: SupabaseClient, partnerId: string, points: number,
  type: string, referenceId: string | null, tier: number | null, description: string
) {
  await supabase.from("ly_points_ledger").insert({
    partner_id: partnerId, type, points, reference_id: referenceId,
    reference_type: type, tier, description, created_at: new Date().toISOString(),
  });
  // Increment balance
  const { error: rpcErr } = await supabase.rpc("increment_ly_balance", { partner_id: partnerId, amount: points });
  if (rpcErr) {
    const { data: partner } = await supabase.from("partners").select("ly_balance").eq("id", partnerId).single();
    await supabase.from("partners").update({
      ly_balance: (partner?.ly_balance || 0) + points, updated_at: new Date().toISOString(),
    }).eq("id", partnerId);
  }
}

async function deductLyPoints(
  supabase: SupabaseClient, partnerId: string, points: number,
  type: string, referenceId: string | null, description: string
): Promise<boolean> {
  const { data: partner } = await supabase.from("partners").select("ly_balance").eq("id", partnerId).single();
  if (!partner || (partner.ly_balance || 0) < points) return false;
  await supabase.from("ly_points_ledger").insert({
    partner_id: partnerId, type, points: -points, reference_id: referenceId,
    reference_type: type, description, created_at: new Date().toISOString(),
  });
  await supabase.from("partners").update({
    ly_balance: (partner.ly_balance || 0) - points, updated_at: new Date().toISOString(),
  }).eq("id", partnerId);
  return true;
}

async function addToCashWallet(
  supabase: SupabaseClient, partnerId: string, amount: number,
  type: string, referenceId: string | null, description: string
) {
  await supabase.from("cash_wallet_ledger").insert({
    partner_id: partnerId, type: "income", amount, reference_id: referenceId,
    reference_type: type, status: "completed", description, created_at: new Date().toISOString(),
  });
  const { data: partner } = await supabase.from("partners").select("cash_wallet_balance").eq("id", partnerId).single();
  await supabase.from("partners").update({
    cash_wallet_balance: (partner?.cash_wallet_balance || 0) + amount, updated_at: new Date().toISOString(),
  }).eq("id", partnerId);
}

async function addRwaTokens(supabase: SupabaseClient, partnerId: string, tokens: number, source: string, orderId: string | null) {
  // Get current cycle
  const { data: activeCycle } = await supabase.from("bonus_pool_cycles").select("id").eq("status", "active").limit(1).maybeSingle();
  await supabase.from("rwa_token_ledger").insert({
    partner_id: partnerId, cycle_id: activeCycle?.id || null, tokens, source, order_id: orderId,
    created_at: new Date().toISOString(),
  });
  const { data: partner } = await supabase.from("partners").select("rwa_tokens").eq("id", partnerId).single();
  await supabase.from("partners").update({
    rwa_tokens: (partner?.rwa_tokens || 0) + tokens, updated_at: new Date().toISOString(),
  }).eq("id", partnerId);
}

async function processPartnerReferralBonus(supabase: SupabaseClient, referrerId: string, newPartnerId: string, paymentAmount: number) {
  const directBonus = Math.floor(paymentAmount * REFERRAL_BONUS.directRate);
  await addToCashWallet(supabase, referrerId, directBonus, "referral_bonus", newPartnerId, "Direct referral bonus");
  const { data: directReferrer } = await supabase.from("partners").select("referrer_id").eq("id", referrerId).single();
  if (directReferrer?.referrer_id) {
    const indirectBonus = Math.floor(paymentAmount * REFERRAL_BONUS.indirectRate);
    await addToCashWallet(supabase, directReferrer.referrer_id, indirectBonus, "referral_bonus", newPartnerId, "Indirect referral bonus");
  }
}

async function findNearestUplinePartner(supabase: SupabaseClient, memberId: string) {
  let currentMemberId = memberId;
  for (let depth = 0; depth < 10; depth++) {
    const { data: member } = await supabase.from("members").select("referrer_id").eq("id", currentMemberId).single();
    if (!member?.referrer_id) break;
    const { data: partner } = await supabase.from("partners")
      .select("id, member_id, total_boxes_processed, packages_purchased, ly_balance")
      .eq("member_id", member.referrer_id).eq("status", "active").single();
    if (partner) {
      return {
        partnerId: partner.id, memberId: partner.member_id,
        totalBoxesProcessed: partner.total_boxes_processed || 0,
        packagesPurchased: partner.packages_purchased || 1,
        lyBalance: partner.ly_balance || 0,
      };
    }
    currentMemberId = member.referrer_id;
  }
  return null;
}

async function findPartnerReferrers(supabase: SupabaseClient, partnerId: string, maxGen: number) {
  const result: Array<{ partnerId: string; lyBalance: number }> = [];
  let currentPartnerId = partnerId;
  for (let gen = 0; gen < maxGen; gen++) {
    const { data: current } = await supabase.from("partners").select("referrer_id").eq("id", currentPartnerId).single();
    if (!current?.referrer_id) break;
    const { data: parent } = await supabase.from("partners").select("id, ly_balance").eq("id", current.referrer_id).eq("status", "active").single();
    if (!parent) break;
    result.push({ partnerId: parent.id, lyBalance: parent.ly_balance || 0 });
    currentPartnerId = parent.id;
  }
  return result;
}

function getPartnerCashbackRate(totalBoxesProcessed: number, packagesPurchased: number = 1): number {
  const fiftyPctLimit = packagesPurchased * 5;
  return totalBoxesProcessed < fiftyPctLimit ? ORDER_CASHBACK_CONFIG.first5Rate : ORDER_CASHBACK_CONFIG.afterRate;
}

async function replenishLyFromNetwork(supabase: SupabaseClient, orderId: string, orderAmount: number, buyerMemberId: string) {
  const orderAmountRm = orderAmount / 100;
  let currentMemberId = buyerMemberId;
  for (let layer = 0; layer < LY_NETWORK_LEVELS.length; layer++) {
    const { data: member } = await supabase.from("members").select("referrer_id").eq("id", currentMemberId).single();
    if (!member?.referrer_id) break;
    const { data: partner } = await supabase.from("partners").select("id").eq("member_id", member.referrer_id).eq("status", "active").single();
    if (partner) {
      const lyReplenish = Math.floor(orderAmountRm * LY_NETWORK_LEVELS[layer] / 100);
      if (lyReplenish > 0) {
        await addLyPoints(supabase, partner.id, lyReplenish, "replenish", orderId, layer + 1,
          `Network LY replenishment (Layer ${layer + 1}, ${LY_NETWORK_LEVELS[layer]}%)`);
      }
    }
    currentMemberId = member.referrer_id;
  }
}

async function lookupMemberByPhone(supabase: SupabaseClient, phone: string) {
  const variants = phoneVariants(phone);
  const { data: member } = await supabase.from("members")
    .select("id, name, phone, email, role, referral_code, referrer_id, points_balance")
    .or(variants.map((p: string) => `phone.eq.${p}`).join(","))
    .limit(1).maybeSingle();
  return member;
}

// ============ System Prompt ============
const SYSTEM_PROMPT = `你是 LOVE YOUNG 智能管理助手。你拥有完整的数据库读写权限，可以直接查询和修改数据。

【你的能力】
1. **数据查询**：查询会员、产品、订单、账单、推荐网络、奖金池等所有数据
2. **直接执行**：创建订单、账单、注册会员、调整余额等操作可以直接执行，无需等待确认
3. **需要确认的操作**：只有"创建经营人"（角色升级）需要管理员确认后才执行
4. **知识积累**：分析中发现重要模式时，保存到知识库

【可用工具】
- check_member_exists: 通过手机号、姓名或邮箱搜索会员
- query_member_data: 查询会员详细数据（钱包、订单、LY积分等），支持手机号/姓名/邮箱搜索
- query_products: 查询产品和套餐价格
- query_referral_network: 查询推荐网络（上线链+下线列表）
- search_orders: 搜索订单记录
- search_bills: 搜索账单记录
- query_bonus_data: 查询奖金池和RWA数据
- update_parsed_actions: 更新结构化数据预览卡片（仅用于前端展示）
- execute_db_write: 直接执行数据库写入操作
- save_to_memory: 保存重要发现到知识库

【execute_db_write 支持的操作】
- create_order: 创建订单（直接执行）
- update_order_status: 更新订单状态（直接执行）
- create_bill: 创建账单（直接执行）
- update_bill: 更新账单（直接执行）
- create_member: 注册新会员（直接执行）
- update_member: 更新会员信息（直接执行）
- set_referrer: 设置推荐人（直接执行）
- create_partner: 创建经营人 ⚠️ 需要确认！先预览，管理员回复"确认"后再执行
- adjust_wallet: 调整现金钱包余额（直接执行）
- adjust_ly_points: 调整LY积分（直接执行）
- process_order_cashback: 处理订单返现（直接执行）
- add_to_bonus_pool: 添加到奖金池（直接执行）

【核心原则 - 必须遵守】
⚠️ 当管理员提到一个人名时，你必须立即用 check_member_exists 的 name 参数搜索，不要要求手机号！
⚠️ 永远不要反复追问信息。先用已有线索（名字、邮箱、手机号中任何一个）去数据库搜索，找到后再操作。
⚠️ 只有在数据库完全搜索不到时，才询问更多信息。

【收到转账截图/单据的处理流程】
当管理员上传一张转账截图或收据时（这是手动银行转账，不是Stripe在线支付），你需要：
1. 先识别图片中的信息（金额、转账人、参考编号、日期等）
2. 然后**必须向管理员确认以下问题**，不要自己猜测：
   a. 这是什么类型？
      - 产品订单（买燕窝等产品）→ 需要创建订单 (create_order, source="bank_transfer")
      - 经营人配套（Phase1/2/3加入）→ 需要创建经营人 (create_partner)
      - 混合（同时有产品+配套）
      - 多个订单合并转账
   b. 这是谁的订单？（名字/手机号/邮箱）→ 立即搜索会员
   c. 是否需要先创建新会员账号？（如果还没注册）
   d. 如果是经营人配套，推荐人是谁？
   e. 转账金额与订单金额是否一致？有没有扣除（返现、LY抵扣、钱包余额等）？
3. **复杂场景处理**（管理员说明后才执行）：
   - **多个配套一笔转账**：一笔转账包含多个人的配套，需要逐个确认每个人的信息
   - **开两个账号互推**：A推荐B，两个人同时加入，需要先创建A再创建B，设置好推荐关系
   - **扣除返现后的金额**：实际转账金额 = 订单总价 - 返现奖励 - LY抵扣等，需要管理员说明每笔扣除明细
   - **钱包余额抵扣**：用现金钱包余额抵扣部分金额
4. 确认所有信息后，列出将要执行的**完整操作清单**（例如：创建会员→创建订单→创建经营人→处理推荐奖金），等管理员确认后再执行
5. 执行完毕后报告所有操作结果

注意：手动转账的订单用 source="bank_transfer"，不要只创建账单(bill)，要创建订单(order)记录！

【一般工作流程（非单据）】
1. 管理员提到任何人名/手机号/邮箱 → 立即调用 check_member_exists 搜索（用 name/phone/email 参数）
2. 找到会员后，根据需求调用 query_member_data 获取详细信息
3. 分析数据，判断需要执行什么操作
4. 对于一般操作，直接调用 execute_db_write 执行
5. 对于创建经营人，先告知管理员详细信息和预计产生的操作（LY积分、RWA代币、推荐奖金等），等管理员回复"确认"后再执行
6. 执行完成后，清晰告知管理员结果

【业务规则】
1. 经营人配套价格：Phase1 RM1,000 / Phase2 RM1,300 / Phase3 RM1,500
2. 产品：燕窝/Bird's Nest RM368/盒
3. 推荐奖金：直推10%、间推5%
4. 订单返现：前5盒50%，之后30%（需扣除等量LY积分）
5. 同级奖金：直接返现的10%，最多2代
6. LY网络补充：10层 [20%, 15%, 10%, 10%, 10%, 5%, 5%, 5%, 5%, 5%]
7. 金额单位：数据库存储为分(cents)，显示为 RM

【注意事项】
- 手机号格式：马来西亚号码，如 0123456789 或 +60123456789
- 所有金额以分为单位存储
- 用中文回复，简洁友好
- 执行操作后报告结果，包括成功/失败详情`;

// ============ Tool Definitions ============
const tools = [
  {
    type: "function" as const,
    function: {
      name: "update_parsed_actions",
      description: "Update the structured data preview cards shown to admin. Call this to display a visual summary of planned or completed actions.",
      parameters: {
        type: "object",
        properties: {
          member_registrations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                customer_name: { type: "string" }, customer_phone: { type: "string" },
                customer_email: { type: "string" }, referral_code: { type: "string" }, notes: { type: "string" },
              },
              required: ["customer_name", "customer_phone"],
            },
          },
          partner_joins: {
            type: "array",
            items: {
              type: "object",
              properties: {
                customer_name: { type: "string" }, customer_phone: { type: "string" },
                tier: { type: "string", enum: ["phase1", "phase2", "phase3"] },
                referral_code: { type: "string" },
                payment_amount_cents: { type: "number" }, actual_paid_cents: { type: "number" },
                deductions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" }, amount_cents: { type: "number" }, description: { type: "string" },
                    },
                    required: ["type", "amount_cents", "description"],
                  },
                },
                payment_reference: { type: "string" }, notes: { type: "string" },
              },
              required: ["customer_name", "customer_phone", "tier", "payment_amount_cents"],
            },
          },
          product_orders: {
            type: "array",
            items: {
              type: "object",
              properties: {
                customer_name: { type: "string" }, customer_phone: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      product_name: { type: "string" }, quantity: { type: "number" }, unit_price_cents: { type: "number" },
                    },
                    required: ["product_name", "quantity", "unit_price_cents"],
                  },
                },
                total_amount_cents: { type: "number" }, actual_paid_cents: { type: "number" },
                deductions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" }, amount_cents: { type: "number" }, description: { type: "string" },
                    },
                    required: ["type", "amount_cents", "description"],
                  },
                },
                box_count: { type: "number" }, referral_code: { type: "string" },
                payment_reference: { type: "string" }, skip_cashback: { type: "boolean" }, notes: { type: "string" },
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
      name: "check_member_exists",
      description: "Check if a customer is registered as a member. Search by phone, name, or email.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Customer phone number" },
          name: { type: "string", description: "Customer name (partial match)" },
          email: { type: "string", description: "Customer email (partial match)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_member_data",
      description: "Query detailed member data: wallet balance, partner info, recent orders, LY points, referrer. Search by phone, name, or email.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string" },
          name: { type: "string", description: "Member name (partial match)" },
          email: { type: "string", description: "Member email (partial match)" },
          member_id: { type: "string", description: "Member UUID directly" },
          include_orders: { type: "boolean" },
          include_wallet_history: { type: "boolean" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_products",
      description: "Query products table for product names, prices, categories. Also queries product_bundles for bundle pricing.",
      parameters: {
        type: "object",
        properties: {
          name_filter: { type: "string", description: "Optional partial name filter" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_referral_network",
      description: "Query a member's referral network: upline chain (up to 10 levels) and direct downline list. Shows name, phone, role, partner tier, balances for each person.",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string", description: "Member phone number" },
          member_id: { type: "string", description: "Or member UUID directly" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_orders",
      description: "Search orders with optional filters (phone, name, status, date range, source).",
      parameters: {
        type: "object",
        properties: {
          phone: { type: "string" }, name: { type: "string" },
          status: { type: "string" }, date_from: { type: "string" }, date_to: { type: "string" },
          source: { type: "string" }, limit: { type: "number" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "search_bills",
      description: "Search bills with optional filters (vendor, status, type, category, date range).",
      parameters: {
        type: "object",
        properties: {
          vendor: { type: "string" }, status: { type: "string" }, type: { type: "string" },
          category: { type: "string" }, date_from: { type: "string" }, date_to: { type: "string" },
          limit: { type: "number" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "query_bonus_data",
      description: "Query bonus pool data: active cycle, partner's RWA tokens, recent LY ledger entries, blocked cashback records.",
      parameters: {
        type: "object",
        properties: {
          partner_id: { type: "string" }, phone: { type: "string" },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "execute_db_write",
      description: `Execute a database write operation directly. Supported actions:
- create_order: Create an order record
- update_order_status: Update order status
- create_bill: Create a bill record
- update_bill: Update bill fields
- create_member: Register a new member
- update_member: Update member fields
- set_referrer: Set a member's referrer
- create_partner: Create partner (REQUIRES CONFIRMATION - set confirmed=true after admin confirms)
- adjust_wallet: Adjust partner cash wallet balance (+/-)
- adjust_ly_points: Adjust partner LY points (+/-)
- process_order_cashback: Run full cashback flow for an order
- add_to_bonus_pool: Add order amount to bonus pool`,
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: [
              "create_order", "update_order_status", "create_bill", "update_bill",
              "create_member", "update_member", "set_referrer", "create_partner",
              "adjust_wallet", "adjust_ly_points", "process_order_cashback", "add_to_bonus_pool",
            ],
          },
          params: {
            type: "object",
            description: "Action-specific parameters",
          },
          confirmed: {
            type: "boolean",
            description: "For create_partner: set to true after admin confirms",
          },
        },
        required: ["action", "params"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "save_to_memory",
      description: "Save important data patterns or insights to persistent knowledge base.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string", enum: ["data_pattern", "member_insight", "pricing_rule", "deduction_pattern", "data_fix", "business_rule"] },
          title: { type: "string" }, content: { type: "string" },
          importance: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["category", "title", "content"],
      },
    },
  },
];

// ============ Tool Handlers ============

async function handleCheckMemberExists(supabase: SupabaseClient, args: { phone?: string; name?: string; email?: string }) {
  // Search by phone, name, or email
  let members: any[] = [];
  if (args.phone) {
    const member = await lookupMemberByPhone(supabase, args.phone);
    if (member) members = [member];
  } else if (args.email) {
    const { data } = await supabase.from("members").select("*").ilike("email", `%${args.email}%`).limit(10);
    members = data || [];
  } else if (args.name) {
    const { data } = await supabase.from("members").select("*").ilike("name", `%${args.name}%`).limit(10);
    members = data || [];
  }

  if (members.length === 0) {
    return JSON.stringify({ exists: false, message: "未找到匹配的会员。" });
  }

  const results = [];
  for (const member of members) {
    const { data: partner } = await supabase.from("partners")
      .select("id, tier, status, cash_wallet_balance, ly_balance, rwa_tokens")
      .eq("member_id", member.id).eq("status", "active").maybeSingle();
    results.push({
      member_id: member.id, name: member.name, phone: member.phone,
      email: member.email, role: member.role, referral_code: member.referral_code,
      has_referrer: !!member.referrer_id, is_partner: !!partner,
      partner_tier: partner?.tier || null,
      cash_wallet_balance: partner?.cash_wallet_balance || 0,
      ly_balance: partner?.ly_balance || 0,
    });
  }
  return JSON.stringify({ exists: true, count: results.length, members: results.length === 1 ? results[0] : results });
}

async function handleQueryMemberData(supabase: SupabaseClient, args: { phone?: string; name?: string; email?: string; member_id?: string; include_orders?: boolean; include_wallet_history?: boolean }) {
  // deno-lint-ignore no-explicit-any
  let member: any = null;
  if (args.member_id) {
    const { data } = await supabase.from("members").select("*").eq("id", args.member_id).maybeSingle();
    member = data;
  } else if (args.phone) {
    member = await lookupMemberByPhone(supabase, args.phone);
  } else if (args.email) {
    const { data } = await supabase.from("members").select("*").ilike("email", `%${args.email}%`).maybeSingle();
    member = data;
  } else if (args.name) {
    const { data } = await supabase.from("members").select("*").ilike("name", `%${args.name}%`).limit(1).maybeSingle();
    member = data;
  }
  if (!member) return JSON.stringify({ exists: false, message: "会员不存在" });

  // deno-lint-ignore no-explicit-any
  const result: Record<string, any> = {
    member: {
      id: member.id, name: member.name, phone: member.phone, email: member.email,
      role: member.role, referral_code: member.referral_code,
      has_referrer: !!member.referrer_id, points_balance: member.points_balance,
    },
  };

  const { data: partner } = await supabase.from("partners")
    .select("id, tier, status, cash_wallet_balance, ly_balance, rwa_tokens, total_sales, total_cashback, total_boxes_processed, payment_amount, payment_date, created_at")
    .eq("member_id", member.id).maybeSingle();

  if (partner) {
    result.partner = {
      id: partner.id, tier: partner.tier, status: partner.status,
      cash_wallet_balance_cents: partner.cash_wallet_balance,
      cash_wallet_balance_rm: `RM ${((partner.cash_wallet_balance || 0) / 100).toFixed(2)}`,
      ly_balance: partner.ly_balance, rwa_tokens: partner.rwa_tokens,
      total_sales_cents: partner.total_sales, total_cashback_cents: partner.total_cashback,
      total_boxes: partner.total_boxes_processed,
      joined_amount_cents: partner.payment_amount,
      joined_date: partner.payment_date || partner.created_at,
    };
    if (member.referrer_id) {
      const { data: referrer } = await supabase.from("members").select("name, phone, referral_code").eq("id", member.referrer_id).maybeSingle();
      if (referrer) result.referrer = referrer;
    }
    if (args.include_wallet_history !== false) {
      const { data: walletHistory } = await supabase.from("cash_wallet_ledger")
        .select("type, amount, description, reference_type, status, created_at")
        .eq("partner_id", partner.id).order("created_at", { ascending: false }).limit(10);
      // deno-lint-ignore no-explicit-any
      result.recent_wallet_transactions = (walletHistory || []).map((t: any) => ({
        type: t.type, amount_cents: t.amount,
        amount_rm: `RM ${(Math.abs(Number(t.amount) || 0) / 100).toFixed(2)}`,
        description: t.description, reference_type: t.reference_type, status: t.status, date: t.created_at,
      }));
    }
  }

  if (args.include_orders !== false) {
    const { data: orders } = await supabase.from("orders")
      .select("id, order_number, status, total_amount, items, source, source_channel, notes, created_at")
      .eq("member_id", member.id).order("created_at", { ascending: false }).limit(10);
    // deno-lint-ignore no-explicit-any
    result.recent_orders = (orders || []).map((o: any) => ({
      id: o.id, order_number: o.order_number, status: o.status,
      total_amount_cents: o.total_amount, total_amount_rm: `RM ${((Number(o.total_amount) || 0) / 100).toFixed(2)}`,
      source: o.source, notes: o.notes, date: o.created_at,
    }));
  }

  const { count: downlineCount } = await supabase.from("members")
    .select("id", { count: "exact", head: true }).eq("referrer_id", member.id);
  result.downline_count = downlineCount || 0;

  return JSON.stringify(result);
}

async function handleQueryProducts(supabase: SupabaseClient, args: { name_filter?: string }) {
  let query = supabase.from("products").select("id, name, price, category, featured, status");
  if (args.name_filter) {
    query = query.ilike("name", `%${args.name_filter}%`);
  }
  const { data: products } = await query.order("name");

  const { data: bundles } = await supabase.from("product_bundles")
    .select("id, name, price, items, status").order("name");

  return JSON.stringify({
    products: (products || []).map((p: { id: string; name: string; price: number; category: string; featured: boolean; status: string }) => ({
      id: p.id, name: p.name, price_cents: p.price,
      price_rm: `RM ${((p.price || 0) / 100).toFixed(2)}`,
      category: p.category, featured: p.featured, status: p.status,
    })),
    bundles: (bundles || []).map((b: { id: string; name: string; price: number; items: unknown; status: string }) => ({
      id: b.id, name: b.name, price_cents: b.price,
      price_rm: `RM ${((b.price || 0) / 100).toFixed(2)}`,
      items: b.items, status: b.status,
    })),
    partner_tiers: Object.entries(PARTNER_TIERS).map(([key, t]) => ({
      tier: key, name: t.name, price_cents: t.price,
      price_rm: `RM ${(t.price / 100).toFixed(2)}`,
      initial_ly: t.initialLyPoints, initial_rwa: t.initialRwaTokens,
    })),
  });
}

async function handleQueryReferralNetwork(supabase: SupabaseClient, args: { phone?: string; member_id?: string }) {
  let memberId = args.member_id;
  if (!memberId && args.phone) {
    const member = await lookupMemberByPhone(supabase, args.phone);
    if (!member) return JSON.stringify({ error: "会员不存在" });
    memberId = member.id;
  }
  if (!memberId) return JSON.stringify({ error: "请提供手机号或会员ID" });

  // Walk upline chain (up to 10 levels)
  // deno-lint-ignore no-explicit-any
  const uplineChain: any[] = [];
  let currentId = memberId;
  for (let i = 0; i < 10; i++) {
    const { data: m } = await supabase.from("members")
      .select("referrer_id").eq("id", currentId).single();
    if (!m?.referrer_id) break;
    const { data: upMember } = await supabase.from("members")
      .select("id, name, phone, role, referral_code").eq("id", m.referrer_id).single();
    if (!upMember) break;
    const { data: upPartner } = await supabase.from("partners")
      .select("tier, cash_wallet_balance, ly_balance, status")
      .eq("member_id", upMember.id).eq("status", "active").maybeSingle();
    uplineChain.push({
      level: i + 1, member_id: upMember.id, name: upMember.name, phone: upMember.phone,
      role: upMember.role, referral_code: upMember.referral_code,
      is_partner: !!upPartner, partner_tier: upPartner?.tier,
      cash_wallet_rm: upPartner ? `RM ${((upPartner.cash_wallet_balance || 0) / 100).toFixed(2)}` : null,
      ly_balance: upPartner?.ly_balance,
    });
    currentId = upMember.id;
  }

  // Direct downline
  const { data: downlineMembers } = await supabase.from("members")
    .select("id, name, phone, role, referral_code").eq("referrer_id", memberId).order("created_at", { ascending: false }).limit(50);

  // deno-lint-ignore no-explicit-any
  const downline: any[] = [];
  for (const dm of (downlineMembers || [])) {
    const { data: dmPartner } = await supabase.from("partners")
      .select("tier, cash_wallet_balance, ly_balance, status")
      .eq("member_id", dm.id).eq("status", "active").maybeSingle();
    downline.push({
      member_id: dm.id, name: dm.name, phone: dm.phone, role: dm.role,
      referral_code: dm.referral_code, is_partner: !!dmPartner,
      partner_tier: dmPartner?.tier, ly_balance: dmPartner?.ly_balance,
    });
  }

  return JSON.stringify({ upline_chain: uplineChain, direct_downline: downline, downline_count: downline.length });
}

async function handleSearchOrders(supabase: SupabaseClient, args: { phone?: string; name?: string; status?: string; date_from?: string; date_to?: string; source?: string; limit?: number }) {
  let query = supabase.from("orders")
    .select("id, order_number, status, total_amount, items, source, source_channel, notes, customer_name, customer_phone, created_at")
    .order("created_at", { ascending: false }).limit(args.limit || 20);

  if (args.phone) {
    const variants = phoneVariants(args.phone);
    query = query.or(variants.map((p: string) => `customer_phone.eq.${p}`).join(","));
  }
  if (args.name) query = query.ilike("customer_name", `%${args.name}%`);
  if (args.status) query = query.eq("status", args.status);
  if (args.date_from) query = query.gte("created_at", args.date_from);
  if (args.date_to) query = query.lte("created_at", args.date_to);
  if (args.source) query = query.eq("source", args.source);

  const { data: orders } = await query;
  // deno-lint-ignore no-explicit-any
  return JSON.stringify((orders || []).map((o: any) => ({
    id: o.id, order_number: o.order_number, status: o.status,
    total_amount_cents: o.total_amount, total_amount_rm: `RM ${((Number(o.total_amount) || 0) / 100).toFixed(2)}`,
    items: o.items, source: o.source, source_channel: o.source_channel,
    customer_name: o.customer_name, customer_phone: o.customer_phone,
    notes: o.notes, date: o.created_at,
  })));
}

async function handleSearchBills(supabase: SupabaseClient, args: { vendor?: string; status?: string; type?: string; category?: string; date_from?: string; date_to?: string; limit?: number }) {
  let query = supabase.from("bills")
    .select("id, bill_number, vendor, amount, status, type, category, description, paid_date, due_date, notes, created_at")
    .order("created_at", { ascending: false }).limit(args.limit || 20);

  if (args.vendor) query = query.ilike("vendor", `%${args.vendor}%`);
  if (args.status) query = query.eq("status", args.status);
  if (args.type) query = query.eq("type", args.type);
  if (args.category) query = query.ilike("category", `%${args.category}%`);
  if (args.date_from) query = query.gte("created_at", args.date_from);
  if (args.date_to) query = query.lte("created_at", args.date_to);

  const { data: bills } = await query;
  // deno-lint-ignore no-explicit-any
  return JSON.stringify((bills || []).map((b: any) => ({
    id: b.id, bill_number: b.bill_number, vendor: b.vendor,
    amount_cents: b.amount, amount_rm: `RM ${((Number(b.amount) || 0) / 100).toFixed(2)}`,
    status: b.status, type: b.type, category: b.category,
    description: b.description, paid_date: b.paid_date, due_date: b.due_date,
    notes: b.notes, date: b.created_at,
  })));
}

async function handleQueryBonusData(supabase: SupabaseClient, args: { partner_id?: string; phone?: string }) {
  let partnerId = args.partner_id;
  if (!partnerId && args.phone) {
    const member = await lookupMemberByPhone(supabase, args.phone);
    if (member) {
      const { data: partner } = await supabase.from("partners").select("id").eq("member_id", member.id).eq("status", "active").maybeSingle();
      partnerId = partner?.id;
    }
  }

  // Active bonus pool cycle
  const { data: activeCycle } = await supabase.from("bonus_pool_cycles")
    .select("*").eq("status", "active").limit(1).maybeSingle();

  // deno-lint-ignore no-explicit-any
  const result: Record<string, any> = {
    active_cycle: activeCycle ? {
      id: activeCycle.id, cycle_number: activeCycle.cycle_number,
      total_sales_rm: `RM ${((activeCycle.total_sales || 0) / 100).toFixed(2)}`,
      pool_amount_rm: `RM ${((activeCycle.pool_amount || 0) / 100).toFixed(2)}`,
      total_tokens: activeCycle.total_tokens,
      start_date: activeCycle.start_date, end_date: activeCycle.end_date,
    } : null,
  };

  if (partnerId) {
    const { data: partner } = await supabase.from("partners")
      .select("rwa_tokens, ly_balance").eq("id", partnerId).single();
    result.partner_rwa_tokens = partner?.rwa_tokens || 0;
    result.partner_ly_balance = partner?.ly_balance || 0;

    // Total RWA tokens (for dividend estimation)
    const { data: allPartners } = await supabase.from("partners")
      .select("rwa_tokens").eq("status", "active").gt("rwa_tokens", 0);
    const totalTokens = (allPartners || []).reduce((s: number, p: { rwa_tokens: number }) => s + (p.rwa_tokens || 0), 0);
    if (activeCycle && totalTokens > 0 && partner?.rwa_tokens) {
      const estimatedDividend = Math.floor((partner.rwa_tokens / totalTokens) * (activeCycle.pool_amount || 0));
      result.estimated_dividend_rm = `RM ${(estimatedDividend / 100).toFixed(2)}`;
    }

    // Recent LY ledger
    const { data: lyLedger } = await supabase.from("ly_points_ledger")
      .select("type, points, description, tier, created_at")
      .eq("partner_id", partnerId).order("created_at", { ascending: false }).limit(10);
    result.recent_ly_ledger = lyLedger || [];

    // Blocked cashback records
    const { data: blocked } = await supabase.from("cashback_blocked_records")
      .select("blocked_amount, reason, ly_balance_at_time, ly_required, created_at")
      .eq("partner_id", partnerId).order("created_at", { ascending: false }).limit(5);
    result.blocked_cashback_records = blocked || [];
  }

  return JSON.stringify(result);
}

async function handleSaveToMemory(supabase: SupabaseClient, args: { category: string; title: string; content: string; importance?: string }, sessionId: string) {
  const { data: existing } = await supabase.from("system_config")
    .select("config_value").eq("category", "ai_knowledge").eq("config_key", "memory_entries").maybeSingle();

  const entries = existing?.config_value
    ? (typeof existing.config_value === "string" ? JSON.parse(existing.config_value) : existing.config_value)
    : [];

  entries.push({
    id: crypto.randomUUID(), category: args.category, title: args.title,
    content: args.content, importance: args.importance || "medium",
    created_at: new Date().toISOString(), session_id: sessionId,
  });

  const trimmed = entries.slice(-50);
  await supabase.from("system_config").upsert({
    category: "ai_knowledge", config_key: "memory_entries", config_value: JSON.stringify(trimmed),
  }, { onConflict: "category,config_key" });

  return JSON.stringify({ success: true, message: `已保存: ${args.title}`, total_entries: trimmed.length });
}

// ============ execute_db_write handler ============
// deno-lint-ignore no-explicit-any
async function handleExecuteDbWrite(supabase: SupabaseClient, args: any, sessionId: string) {
  // GPT sometimes puts params at top level instead of nested - handle both formats
  const action = args.action;
  const confirmed = args.confirmed;
  // deno-lint-ignore no-explicit-any
  const params: any = args.params || (() => {
    const { action: _a, confirmed: _c, ...rest } = args;
    return Object.keys(rest).length > 0 ? rest : {};
  })();
  // deno-lint-ignore no-explicit-any
  const log: { action: string; success: boolean; details: string; data?: any } = { action, success: false, details: "" };

  try {
    switch (action) {
      // ---- CREATE ORDER ----
      case "create_order": {
        const phone = normalizePhone(params.customer_phone || "");
        const member = await lookupMemberByPhone(supabase, phone);
        const orderNumber = generateOrderNumber();
        const orderId = crypto.randomUUID();
        const itemsJson = typeof params.items === "string" ? params.items : JSON.stringify(params.items || []);

        const { error } = await supabase.from("orders").insert({
          id: orderId, order_number: orderNumber,
          user_id: null, member_id: member?.id || null,
          customer_name: params.customer_name, customer_phone: phone,
          customer_email: params.customer_email || null,
          status: params.status || "confirmed",
          total_amount: params.total_amount_cents,
          items: itemsJson,
          package_type: params.package_type || null,
          notes: params.notes || null,
          source: params.source || "bank_transfer",
          source_channel: "admin_supplement",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        log.success = true;
        log.details = `订单 ${orderNumber} 已创建，金额 RM ${(params.total_amount_cents / 100).toFixed(2)}`;
        log.data = { order_id: orderId, order_number: orderNumber };
        break;
      }

      // ---- UPDATE ORDER STATUS ----
      case "update_order_status": {
        const filter = params.order_id
          ? supabase.from("orders").update({ status: params.new_status, updated_at: new Date().toISOString() }).eq("id", params.order_id)
          : supabase.from("orders").update({ status: params.new_status, updated_at: new Date().toISOString() }).eq("order_number", params.order_number);
        const { error } = await filter;
        if (error) throw new Error(error.message);
        log.success = true;
        log.details = `订单状态已更新为 ${params.new_status}`;
        break;
      }

      // ---- CREATE BILL ----
      case "create_bill": {
        const billNumber = generateBillNumber();
        const { error } = await supabase.from("bills").insert({
          bill_number: billNumber,
          vendor: params.vendor || "客户转账",
          amount: params.amount_cents,
          type: params.type || "income",
          category: params.category || "bank_transfer",
          description: params.description || null,
          status: params.status || "paid",
          due_date: params.due_date || null,
          paid_date: params.paid_date || new Date().toISOString().slice(0, 10),
          notes: params.notes || null,
          created_at: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        log.success = true;
        log.details = `账单 ${billNumber} 已创建，金额 RM ${(params.amount_cents / 100).toFixed(2)}`;
        log.data = { bill_number: billNumber };
        break;
      }

      // ---- UPDATE BILL ----
      case "update_bill": {
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (params.status !== undefined) updates.status = params.status;
        if (params.paid_date !== undefined) updates.paid_date = params.paid_date;
        if (params.notes !== undefined) updates.notes = params.notes;
        if (params.amount_cents !== undefined) updates.amount = params.amount_cents;
        const { error } = await supabase.from("bills").update(updates).eq("id", params.bill_id);
        if (error) throw new Error(error.message);
        log.success = true;
        log.details = `账单已更新`;
        break;
      }

      // ---- CREATE MEMBER ----
      case "create_member": {
        const phone = normalizePhone(params.phone || "");
        const existing = await lookupMemberByPhone(supabase, phone);
        if (existing) {
          log.success = true;
          log.details = `会员 ${existing.name} (${phone}) 已存在，无需重复注册`;
          log.data = { member_id: existing.id, already_exists: true };
          break;
        }
        let referrerId: string | null = null;
        if (params.referral_code) {
          const code = params.referral_code.toUpperCase();
          const { data: referrer } = await supabase.from("members").select("id").eq("referral_code", code).maybeSingle();
          if (referrer) { referrerId = referrer.id; }
          else {
            const refMember = await lookupMemberByPhone(supabase, params.referral_code);
            if (refMember) referrerId = refMember.id;
          }
        }
        const newCode = generateReferralCode();
        const memberId = crypto.randomUUID();
        const { error } = await supabase.from("members").insert({
          id: memberId, user_id: null, name: params.name, phone,
          email: params.email || null, role: "member", points_balance: 0,
          referral_code: newCode, referrer_id: referrerId,
          created_at: new Date().toISOString(),
        });
        if (error) throw new Error(error.message);
        log.success = true;
        log.details = `会员 ${params.name} (${phone}) 已注册，推荐码 ${newCode}`;
        log.data = { member_id: memberId, referral_code: newCode };
        break;
      }

      // ---- UPDATE MEMBER ----
      case "update_member": {
        let memberId = params.member_id;
        if (!memberId && params.phone) {
          const m = await lookupMemberByPhone(supabase, params.phone);
          memberId = m?.id;
        }
        if (!memberId) throw new Error("找不到会员");
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (params.name !== undefined) updates.name = params.name;
        if (params.email !== undefined) updates.email = params.email;
        if (params.new_phone !== undefined) updates.phone = normalizePhone(params.new_phone);
        const { error } = await supabase.from("members").update(updates).eq("id", memberId);
        if (error) throw new Error(error.message);
        log.success = true;
        log.details = `会员信息已更新`;
        break;
      }

      // ---- SET REFERRER ----
      case "set_referrer": {
        let memberId = params.member_id;
        if (!memberId && params.phone) {
          const m = await lookupMemberByPhone(supabase, params.phone);
          memberId = m?.id;
        }
        if (!memberId) throw new Error("找不到会员");

        let referrerId: string | null = null;
        if (params.referrer_code) {
          const { data: ref } = await supabase.from("members").select("id").eq("referral_code", params.referrer_code.toUpperCase()).maybeSingle();
          referrerId = ref?.id || null;
        }
        if (!referrerId && params.referrer_phone) {
          const refMember = await lookupMemberByPhone(supabase, params.referrer_phone);
          referrerId = refMember?.id || null;
        }
        if (!referrerId) throw new Error("找不到推荐人");

        const { error } = await supabase.from("members").update({ referrer_id: referrerId, updated_at: new Date().toISOString() }).eq("id", memberId);
        if (error) throw new Error(error.message);
        log.success = true;
        log.details = `推荐人已设置`;
        break;
      }

      // ---- CREATE PARTNER (requires confirmation) ----
      case "create_partner": {
        const phone = normalizePhone(params.phone || "");
        const member = await lookupMemberByPhone(supabase, phone);
        if (!member) throw new Error(`会员 ${phone} 不存在，请先注册`);

        const { data: existingPartner } = await supabase.from("partners")
          .select("id, tier").eq("member_id", member.id).eq("status", "active").maybeSingle();
        if (existingPartner) throw new Error(`${member.name} 已经是 ${existingPartner.tier} 经营人`);

        const tier = params.tier as string;
        const tierConfig = PARTNER_TIERS[tier];
        if (!tierConfig) throw new Error(`无效的配套: ${tier}`);

        // If not confirmed, return preview
        if (!confirmed) {
          // Calculate what will happen
          let referrerInfo = null;
          if (params.referral_code || member.referrer_id) {
            let refMemberId = member.referrer_id;
            if (params.referral_code && !refMemberId) {
              const { data: refByCode } = await supabase.from("members").select("id").eq("referral_code", params.referral_code.toUpperCase()).maybeSingle();
              refMemberId = refByCode?.id;
            }
            if (refMemberId) {
              const { data: refMember } = await supabase.from("members").select("name, phone").eq("id", refMemberId).single();
              const { data: refPartner } = await supabase.from("partners").select("id, referrer_id").eq("member_id", refMemberId).eq("status", "active").maybeSingle();
              if (refMember && refPartner) {
                const directBonus = Math.floor(tierConfig.price * REFERRAL_BONUS.directRate);
                referrerInfo = {
                  name: refMember.name, phone: refMember.phone,
                  direct_bonus_rm: `RM ${(directBonus / 100).toFixed(2)}`,
                };
                // Check for indirect referrer
                if (refPartner.referrer_id) {
                  const { data: indirectPartner } = await supabase.from("partners")
                    .select("member_id").eq("id", refPartner.referrer_id).eq("status", "active").maybeSingle();
                  if (indirectPartner) {
                    const { data: indirectMember } = await supabase.from("members").select("name").eq("id", indirectPartner.member_id).single();
                    const indirectBonus = Math.floor(tierConfig.price * REFERRAL_BONUS.indirectRate);
                    referrerInfo.indirect_referrer = indirectMember?.name;
                    referrerInfo.indirect_bonus_rm = `RM ${(indirectBonus / 100).toFixed(2)}`;
                  }
                }
              }
            }
          }

          log.success = true;
          log.details = "requires_confirmation";
          log.data = {
            requires_confirmation: true,
            preview: {
              member_name: member.name, phone: member.phone, tier, tier_name: tierConfig.name,
              price_rm: `RM ${(tierConfig.price / 100).toFixed(2)}`,
              initial_ly: tierConfig.initialLyPoints, initial_rwa: tierConfig.initialRwaTokens,
              referrer: referrerInfo,
            },
          };
          break;
        }

        // Confirmed - execute the full partner creation flow
        // Find referrer partner
        let referrerId: string | null = null;
        if (params.referral_code) {
          const { data: refMember } = await supabase.from("members").select("id").eq("referral_code", params.referral_code.toUpperCase()).maybeSingle();
          if (refMember) {
            const { data: refPartner } = await supabase.from("partners").select("id").eq("member_id", refMember.id).eq("status", "active").maybeSingle();
            if (refPartner) referrerId = refPartner.id;
          }
        }
        // If member has a referrer_id set, use that to find partner referrer
        if (!referrerId && member.referrer_id) {
          const { data: refPartner } = await supabase.from("partners").select("id").eq("member_id", member.referrer_id).eq("status", "active").maybeSingle();
          if (refPartner) referrerId = refPartner.id;
        }

        const partnerReferralCode = member.referral_code || generateReferralCode();
        const partnerId = crypto.randomUUID();

        const { error: createErr } = await supabase.from("partners").insert({
          id: partnerId, member_id: member.id, referral_code: partnerReferralCode,
          tier, status: "active", referrer_id: referrerId,
          ly_balance: tierConfig.initialLyPoints, cash_wallet_balance: 0,
          rwa_tokens: tierConfig.initialRwaTokens, total_sales: 0, total_cashback: 0,
          payment_amount: tierConfig.price,
          payment_date: new Date().toISOString(),
          payment_reference: params.payment_ref || "bank_transfer",
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
        if (createErr) throw new Error(createErr.message);

        // Record initial LY and RWA
        await addLyPoints(supabase, partnerId, tierConfig.initialLyPoints, "bonus", null, null, `Initial ${tier} package bonus`);
        await addRwaTokens(supabase, partnerId, tierConfig.initialRwaTokens, "package", null);

        // Process referral bonuses
        if (referrerId) {
          await processPartnerReferralBonus(supabase, referrerId, partnerId, tierConfig.price);
        }

        // Update member role
        await supabase.from("members").update({ role: "partner", updated_at: new Date().toISOString() }).eq("id", member.id);

        // Create order record for the partner package
        const orderNumber = generateOrderNumber();
        const packageOrderId = crypto.randomUUID();
        await supabase.from("orders").insert({
          id: packageOrderId, order_number: orderNumber,
          member_id: member.id, customer_name: member.name, customer_phone: member.phone,
          status: "confirmed", total_amount: tierConfig.price,
          items: JSON.stringify([{ product_name: tierConfig.name, quantity: 1, unit_price_cents: tierConfig.price }]),
          package_type: tier, source: "bank_transfer", source_channel: "admin_supplement",
          notes: `[经营人配套] ${tierConfig.name}`,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });

        log.success = true;
        log.details = `${member.name} 已成功升级为 ${tierConfig.name}！LY +${tierConfig.initialLyPoints}，RWA +${tierConfig.initialRwaTokens}${referrerId ? "，推荐奖金已发放" : ""}`;
        log.data = { partner_id: partnerId, order_number: orderNumber };
        break;
      }

      // ---- ADJUST WALLET ----
      case "adjust_wallet": {
        let partnerId = params.partner_id;
        if (!partnerId && params.phone) {
          const member = await lookupMemberByPhone(supabase, params.phone);
          if (member) {
            const { data: p } = await supabase.from("partners").select("id").eq("member_id", member.id).eq("status", "active").maybeSingle();
            partnerId = p?.id;
          }
        }
        if (!partnerId) throw new Error("找不到经营人");

        const amount = params.amount_cents; // can be positive or negative
        if (amount > 0) {
          await addToCashWallet(supabase, partnerId, amount, params.type || "adjustment", null, params.description || "Manual adjustment");
        } else {
          // Deduct from wallet
          const { data: partner } = await supabase.from("partners").select("cash_wallet_balance").eq("id", partnerId).single();
          const newBalance = (partner?.cash_wallet_balance || 0) + amount;
          if (newBalance < 0) throw new Error("余额不足");
          await supabase.from("cash_wallet_ledger").insert({
            partner_id: partnerId, type: "deduction", amount,
            reference_type: params.type || "adjustment", status: "completed",
            description: params.description || "Manual deduction",
            created_at: new Date().toISOString(),
          });
          await supabase.from("partners").update({ cash_wallet_balance: newBalance, updated_at: new Date().toISOString() }).eq("id", partnerId);
        }
        log.success = true;
        log.details = `钱包余额已调整 ${amount > 0 ? "+" : ""}RM ${(amount / 100).toFixed(2)}`;
        break;
      }

      // ---- ADJUST LY POINTS ----
      case "adjust_ly_points": {
        let partnerId = params.partner_id;
        if (!partnerId && params.phone) {
          const member = await lookupMemberByPhone(supabase, params.phone);
          if (member) {
            const { data: p } = await supabase.from("partners").select("id").eq("member_id", member.id).eq("status", "active").maybeSingle();
            partnerId = p?.id;
          }
        }
        if (!partnerId) throw new Error("找不到经营人");

        const points = params.points; // can be positive or negative
        if (points > 0) {
          await addLyPoints(supabase, partnerId, points, params.type || "adjustment", null, null, params.description || "Manual adjustment");
        } else {
          const ok = await deductLyPoints(supabase, partnerId, Math.abs(points), params.type || "adjustment", null, params.description || "Manual deduction");
          if (!ok) throw new Error("LY积分不足");
        }
        log.success = true;
        log.details = `LY积分已调整 ${points > 0 ? "+" : ""}${points}`;
        break;
      }

      // ---- PROCESS ORDER CASHBACK ----
      case "process_order_cashback": {
        const orderId = params.order_id;
        const totalAmountCents = params.total_amount_cents;
        const boxCount = params.box_count;
        const buyerMemberId = params.buyer_member_id;

        if (!orderId || !totalAmountCents || !boxCount || !buyerMemberId) {
          throw new Error("缺少参数: order_id, total_amount_cents, box_count, buyer_member_id");
        }

        const rewards: string[] = [];
        const directPartner = await findNearestUplinePartner(supabase, buyerMemberId);

        if (directPartner) {
          const rate = getPartnerCashbackRate(directPartner.totalBoxesProcessed, directPartner.packagesPurchased);
          const cashbackAmount = Math.floor(totalAmountCents * rate);
          const lyRequired = Math.ceil(cashbackAmount / 100);

          if (directPartner.lyBalance < lyRequired) {
            // Block
            await supabase.from("cashback_blocked_records").insert({
              partner_id: directPartner.partnerId, order_id: orderId,
              blocked_amount: cashbackAmount, reason: "insufficient_ly",
              ly_balance_at_time: directPartner.lyBalance, ly_required: lyRequired,
            });
            rewards.push(`直接返现 RM ${(cashbackAmount / 100).toFixed(2)} 被阻止（LY不足：需要${lyRequired}，当前${directPartner.lyBalance}）`);
          } else {
            await deductLyPoints(supabase, directPartner.partnerId, lyRequired, "cashback", orderId, `Cashback LY deduction`);
            await addToCashWallet(supabase, directPartner.partnerId, cashbackAmount, "order_cashback", orderId, `Order cashback (Direct, Rate: ${rate * 100}%)`);
            await supabase.from("partners").update({
              total_boxes_processed: directPartner.totalBoxesProcessed + boxCount,
              updated_at: new Date().toISOString(),
            }).eq("id", directPartner.partnerId);
            rewards.push(`直接返现 RM ${(cashbackAmount / 100).toFixed(2)} (${rate * 100}%)，LY -${lyRequired}`);

            // Same-level
            const sameLevelAmount = Math.floor(cashbackAmount * ORDER_CASHBACK_CONFIG.sameLevelRate);
            if (sameLevelAmount > 0) {
              const refs = await findPartnerReferrers(supabase, directPartner.partnerId, ORDER_CASHBACK_CONFIG.sameLevelMaxGen);
              for (let i = 0; i < refs.length; i++) {
                const ref = refs[i];
                const lyReq = Math.ceil(sameLevelAmount / 100);
                if (ref.lyBalance < lyReq) {
                  rewards.push(`同级奖金(Gen${i + 1}) RM ${(sameLevelAmount / 100).toFixed(2)} 被阻止（LY不足）`);
                } else {
                  await deductLyPoints(supabase, ref.partnerId, lyReq, "cashback", orderId, `Same-level LY deduction (Gen ${i + 1})`);
                  await addToCashWallet(supabase, ref.partnerId, sameLevelAmount, "order_cashback", orderId, `Same-level cashback (Gen ${i + 1})`);
                  rewards.push(`同级奖金(Gen${i + 1}) RM ${(sameLevelAmount / 100).toFixed(2)}，LY -${lyReq}`);
                }
              }
            }
          }
        } else {
          rewards.push("未找到上线经营人，无返现");
        }

        // LY Replenishment
        await replenishLyFromNetwork(supabase, orderId, totalAmountCents, buyerMemberId);
        rewards.push("LY网络补充已处理");

        log.success = true;
        log.details = rewards.join("；");
        break;
      }

      // ---- ADD TO BONUS POOL ----
      case "add_to_bonus_pool": {
        const { data: activeCycle } = await supabase.from("bonus_pool_cycles")
          .select("*").eq("status", "active").limit(1).maybeSingle();

        if (!activeCycle) {
          // Create a new cycle
          const { data: lastCycle } = await supabase.from("bonus_pool_cycles")
            .select("cycle_number").order("cycle_number", { ascending: false }).limit(1).maybeSingle();
          const newCycleNumber = (lastCycle?.cycle_number || 0) + 1;
          const start = new Date();
          const end = new Date(start);
          end.setDate(end.getDate() + BONUS_POOL_CONFIG.cycleDays);

          await supabase.from("bonus_pool_cycles").insert({
            cycle_number: newCycleNumber, start_date: start.toISOString(),
            end_date: end.toISOString(), total_sales: 0, pool_amount: 0,
            total_tokens: 0, status: "active", created_at: new Date().toISOString(),
          });
        }

        const poolContribution = Math.floor((params.amount_cents || 0) * BONUS_POOL_CONFIG.salesContributionRate);
        const { data: cycle } = await supabase.from("bonus_pool_cycles")
          .select("id, total_sales, pool_amount").eq("status", "active").limit(1).single();

        await supabase.from("bonus_pool_cycles").update({
          total_sales: (cycle.total_sales || 0) + (params.amount_cents || 0),
          pool_amount: (cycle.pool_amount || 0) + poolContribution,
        }).eq("id", cycle.id);

        log.success = true;
        log.details = `已添加到奖金池：销售额 RM ${((params.amount_cents || 0) / 100).toFixed(2)}，池贡献 RM ${(poolContribution / 100).toFixed(2)}`;
        break;
      }

      default:
        throw new Error(`未知操作: ${action}`);
    }
  } catch (err) {
    log.success = false;
    log.details = `${action} 失败: ${(err as Error).message}`;
  }

  // Save execution log to session
  try {
    const { data: session } = await supabase.from("order_supplement_sessions")
      .select("execution_results").eq("id", sessionId).single();
    const existingResults = session?.execution_results || [];
    existingResults.push(log);
    await supabase.from("order_supplement_sessions")
      .update({ execution_results: existingResults, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
  } catch { /* ignore logging errors */ }

  return JSON.stringify(log);
}

// ============ Main Handler ============
serve(async (req) => {
  console.log(`[AI] Request received: ${req.method} ${req.url}`);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { session_id, message, image_url } = await req.json();
    console.log(`[AI] Parsed request: session=${session_id || "new"}, msg=${(message || "").slice(0, 50)}, hasImage=${!!image_url}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key
    const { data: configData } = await supabase
      .from("system_config").select("config_value")
      .eq("category", "openai").eq("config_key", "api_key").single();
    const openaiKey = configData?.config_value;
    if (!openaiKey) {
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get or create session
    let session;
    if (session_id) {
      const { data } = await supabase.from("order_supplement_sessions").select("*").eq("id", session_id).single();
      session = data;
    }

    // Verify auth
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!session) {
      const { data: newSession } = await supabase.from("order_supplement_sessions")
        .insert({ admin_user_id: user.id, status: "in_progress", messages: [] })
        .select().single();
      session = newSession;
    }
    if (!session) {
      return new Response(JSON.stringify({ error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Load AI knowledge memory
    let memoryContext = "";
    try {
      const { data: memoryData } = await supabase.from("system_config")
        .select("config_value").eq("category", "ai_knowledge").eq("config_key", "memory_entries").maybeSingle();
      if (memoryData?.config_value) {
        const entries = typeof memoryData.config_value === "string"
          ? JSON.parse(memoryData.config_value) : memoryData.config_value;
        if (entries.length > 0) {
          const sorted = [...entries].sort((a: { importance: string }, b: { importance: string }) => {
            const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
            return (order[a.importance] ?? 1) - (order[b.importance] ?? 1);
          });
          const lines = sorted.map((e: { importance: string; category: string; title: string; content: string }) =>
            `[${e.importance?.toUpperCase()}][${e.category}] ${e.title}: ${e.content}`);
          memoryContext = `\n\n【知识库】\n${lines.join("\n")}`;
        }
      }
    } catch { /* ignore */ }

    // Build messages
    const existingMessages = (session.messages || []) as Array<{
      role: string; content: string;
      tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
      tool_call_id?: string;
    }>;

    const updatedMessages = [...existingMessages];
    if (message) {
      updatedMessages.push({ role: "user", content: message });
    }

    const fullSystemPrompt = SYSTEM_PROMPT + memoryContext;
    const openaiMessages: Array<Record<string, unknown>> = [
      { role: "system", content: fullSystemPrompt },
    ];

    for (const msg of existingMessages) {
      openaiMessages.push(msg);
    }

    if (message) {
      if (image_url) {
        openaiMessages.push({
          role: "user",
          content: [
            { type: "text", text: message },
            { type: "image_url", image_url: { url: image_url, detail: "low" } },
          ],
        });
      } else {
        openaiMessages.push({ role: "user", content: message });
      }
    }

    // ============ Streaming SSE Response ============
    let parsedActions = session.parsed_actions || null;
    const executionLog: Array<{ action: string; success: boolean; details: string }> = [];
    const allToolMessages: typeof updatedMessages = [];
    const model = image_url ? "gpt-4o" : "gpt-4o-mini";

    console.log(`[AI] Starting stream. model=${model}, history=${existingMessages.length} msgs`);

    // Helper: run tool calls (non-streaming phase)
    async function processToolCalls(toolCalls: Array<{ id: string; function: { name: string; arguments: string } }>) {
      for (const toolCall of toolCalls) {
        const fnName = toolCall.function.name;
        let fnArgs;
        try { fnArgs = JSON.parse(toolCall.function.arguments); } catch { fnArgs = {}; }
        let toolResult = "";
        try {
          if (fnName === "update_parsed_actions") {
            parsedActions = fnArgs;
            toolResult = JSON.stringify({ success: true });
          } else if (fnName === "check_member_exists") {
            toolResult = await handleCheckMemberExists(supabase, fnArgs);
          } else if (fnName === "query_member_data") {
            toolResult = await handleQueryMemberData(supabase, fnArgs);
          } else if (fnName === "query_products") {
            toolResult = await handleQueryProducts(supabase, fnArgs);
          } else if (fnName === "query_referral_network") {
            toolResult = await handleQueryReferralNetwork(supabase, fnArgs);
          } else if (fnName === "search_orders") {
            toolResult = await handleSearchOrders(supabase, fnArgs);
          } else if (fnName === "search_bills") {
            toolResult = await handleSearchBills(supabase, fnArgs);
          } else if (fnName === "query_bonus_data") {
            toolResult = await handleQueryBonusData(supabase, fnArgs);
          } else if (fnName === "execute_db_write") {
            toolResult = await handleExecuteDbWrite(supabase, fnArgs, session.id);
            try {
              const parsed = JSON.parse(toolResult);
              executionLog.push({ action: parsed.action, success: parsed.success, details: parsed.details });
            } catch { /* ignore */ }
          } else if (fnName === "save_to_memory") {
            toolResult = await handleSaveToMemory(supabase, fnArgs, session.id);
          } else {
            toolResult = JSON.stringify({ error: `Unknown tool: ${fnName}` });
          }
        } catch (toolErr) {
          console.error(`[AI] Tool ${fnName} error:`, toolErr);
          toolResult = JSON.stringify({ error: `Tool error: ${(toolErr as Error).message}` });
        }
        console.log(`[AI] Tool ${fnName}: result=${toolResult.slice(0, 100)}`);
        allToolMessages.push({ role: "tool", content: toolResult, tool_call_id: toolCall.id });
      }
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (event: string, data: unknown) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Send session_id immediately
          send("meta", { session_id: session.id });

          // Tool-calling loop (non-streaming)
          let currentMessages = openaiMessages;
          let loopCount = 0;
          const maxLoops = 3;
          let needsFinalStream = true;

          while (loopCount < maxLoops) {
            loopCount++;
            send("status", { step: "thinking", loop: loopCount });

            const chatRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ model, messages: currentMessages, tools, temperature: 0.3, max_tokens: 1500 }),
            });

            if (!chatRes.ok) {
              const errText = await chatRes.text();
              console.error(`[AI] OpenAI error: ${errText.slice(0, 300)}`);
              send("error", { message: `OpenAI error ${chatRes.status}` });
              break;
            }

            const chatData = await chatRes.json();
            const choice = chatData.choices?.[0];
            if (!choice) { send("error", { message: "No choices" }); break; }
            const msg = choice.message;

            if (msg.tool_calls && msg.tool_calls.length > 0) {
              // Show which tools are being called
              const toolNames = msg.tool_calls.map((tc: { function: { name: string } }) => tc.function.name);
              send("status", { step: "tools", tools: toolNames });

              allToolMessages.push({ role: "assistant", content: msg.content || "", tool_calls: msg.tool_calls });
              await processToolCalls(msg.tool_calls);

              // Send execution log updates in real-time
              if (executionLog.length > 0) {
                send("execution_log", executionLog);
              }
              if (parsedActions) {
                send("parsed_actions", parsedActions);
              }

              currentMessages = [
                { role: "system", content: fullSystemPrompt },
                ...updatedMessages,
                ...allToolMessages,
              ];

              if (msg.content) {
                // Model returned text alongside tool calls - use it directly
                send("token", { content: msg.content });
                needsFinalStream = false;
                // Save
                const savedMessages = [...updatedMessages, { role: "assistant", content: msg.content }];
                await supabase.from("order_supplement_sessions").update({
                  messages: savedMessages, parsed_actions: parsedActions,
                  updated_at: new Date().toISOString(),
                }).eq("id", session.id);
                break;
              }
              continue;
            } else if (msg.content) {
              // Direct text response (no tools) - send as tokens for instant display
              send("token", { content: msg.content });
              needsFinalStream = false;
              const savedMessages = [...updatedMessages, { role: "assistant", content: msg.content }];
              await supabase.from("order_supplement_sessions").update({
                messages: savedMessages, parsed_actions: parsedActions,
                updated_at: new Date().toISOString(),
              }).eq("id", session.id);
              break;
            }
          }

          // If loop exhausted, do a final streaming call
          if (needsFinalStream && allToolMessages.length > 0) {
            send("status", { step: "summarizing" });
            const streamRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: "gpt-4o-mini", stream: true,
                messages: [
                  { role: "system", content: fullSystemPrompt },
                  ...updatedMessages, ...allToolMessages,
                ],
                temperature: 0.3, max_tokens: 1500,
              }),
            });

            if (streamRes.ok && streamRes.body) {
              let fullText = "";
              const reader = streamRes.body.getReader();
              const decoder = new TextDecoder();
              let buf = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() || "";
                for (const line of lines) {
                  if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
                  try {
                    const chunk = JSON.parse(line.slice(6));
                    const delta = chunk.choices?.[0]?.delta?.content;
                    if (delta) {
                      fullText += delta;
                      send("token", { content: delta });
                    }
                  } catch { /* skip bad chunks */ }
                }
              }

              const savedMessages = [...updatedMessages, { role: "assistant", content: fullText || "操作已处理。" }];
              await supabase.from("order_supplement_sessions").update({
                messages: savedMessages, parsed_actions: parsedActions,
                updated_at: new Date().toISOString(),
              }).eq("id", session.id);
            } else {
              send("token", { content: "操作已处理，请查看执行日志。" });
              const savedMessages = [...updatedMessages, { role: "assistant", content: "操作已处理，请查看执行日志。" }];
              await supabase.from("order_supplement_sessions").update({
                messages: savedMessages, parsed_actions: parsedActions,
                updated_at: new Date().toISOString(),
              }).eq("id", session.id);
            }
          } else if (needsFinalStream) {
            send("token", { content: "抱歉，AI未能生成回复，请重试。" });
          }

          // Send final done event
          send("done", {
            execution_log: executionLog.length > 0 ? executionLog : null,
            parsed_actions: parsedActions,
          });

        } catch (err) {
          console.error("[AI] Stream error:", err);
          const send2 = (event: string, data: unknown) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
          };
          send2("error", { message: (err as Error).message });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Order supplement error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
