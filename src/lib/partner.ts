import { supabase } from "./supabase";
import type { Partner, LyPointsLedger, RwaTokenLedger, CashWalletLedger, BonusPoolCycle } from "@shared/types";

// Partner tier configuration
export const PARTNER_TIERS = {
  phase1: {
    name: "Phase 1 - 启航经营人",
    price: 100000, // RM 1000 in cents
    initialLyPoints: 2000,
    initialRwaTokens: 2,
    cashbackRate: { first5: 0.5, next5: 0.3, beyond: 0.2 },
    weight: 1.0,
  },
  phase2: {
    name: "Phase 2 - 成长经营人",
    price: 130000, // RM 1300 in cents
    initialLyPoints: 2600,
    initialRwaTokens: 3,
    cashbackRate: { first5: 0.5, next5: 0.3, beyond: 0.2 },
    weight: 1.2,
  },
  phase3: {
    name: "Phase 3 - 卓越经营人",
    price: 150000, // RM 1500 in cents
    initialLyPoints: 3000,
    initialRwaTokens: 4,
    cashbackRate: { first5: 0.5, next5: 0.3, beyond: 0.2 },
    weight: 1.5,
  },
} as const;

// Referral bonus rates (for partner upgrades)
export const REFERRAL_BONUS = {
  directRate: 0.10,   // 直推10%
  indirectRate: 0.05, // 间推5%
};

// Bonus pool configuration
export const BONUS_POOL_CONFIG = {
  salesContributionRate: 0.30, // 30% of sales goes to pool
  cycleDays: 10, // 10 days per cycle
  minPartnersForRwa: 10, // Every 10 partners = 1 RWA
};

// Order cashback configuration (3-generation rewards for partners)
export const ORDER_CASHBACK_CONFIG = {
  maxGenerations: 3, // 三代返现
  maxCashbackPerCycle: 10, // Maximum 10 cashback events per 30-day cycle
  cycleDays: 30, // 30 days per cycle reset
  tiers: {
    tier1: { minBoxes: 0, maxBoxes: 2, rate: 0.20 },   // 20% for boxes 1-2
    tier2: { minBoxes: 2, maxBoxes: 5, rate: 0.30 },   // 30% for boxes 3-5
    tier3: { minBoxes: 5, maxBoxes: 10, rate: 0.50 },  // 50% for boxes 6-10
  },
};

// Generate referral code
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ============ Partner Management ============

// Create a new partner (after payment)
export async function createPartner(
  memberId: string,
  tier: keyof typeof PARTNER_TIERS,
  referralCode?: string | null,
  paymentReference?: string
): Promise<{ partner: Partner | null; error: Error | null }> {
  const tierConfig = PARTNER_TIERS[tier];

  // Find referrer if referral code provided
  let referrerId: string | null = null;
  if (referralCode) {
    const { data: referrer } = await supabase
      .from("partners")
      .select("id")
      .eq("referral_code", referralCode.toUpperCase())
      .eq("status", "active")
      .single();

    if (referrer) {
      referrerId = referrer.id;
    }
  }

  // Create partner record
  const { data: partner, error } = await supabase
    .from("partners")
    .insert({
      member_id: memberId,
      referral_code: generateReferralCode(),
      tier: tier,
      status: "active",
      referrer_id: referrerId,
      ly_balance: tierConfig.initialLyPoints,
      cash_wallet_balance: 0,
      rwa_tokens: tierConfig.initialRwaTokens,
      total_sales: 0,
      total_cashback: 0,
      payment_amount: tierConfig.price,
      payment_date: new Date().toISOString(),
      payment_reference: paymentReference || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating partner:", error);
    return { partner: null, error: new Error(error.message) };
  }

  const partnerObj = mapPartnerFromDb(partner);

  // Record initial LY points
  await addLyPoints(partnerObj.id, tierConfig.initialLyPoints, "bonus", null, null, `Initial ${tier} package bonus`);

  // Record initial RWA tokens
  await addRwaTokens(partnerObj.id, tierConfig.initialRwaTokens, "package", null);

  // Process referral bonuses if has referrer
  if (referrerId) {
    await processPartnerReferralBonus(referrerId, partnerObj.id, tierConfig.price);
  }

  // Update member role to partner
  await supabase
    .from("members")
    .update({ role: "partner", updated_at: new Date().toISOString() })
    .eq("id", memberId);

  return { partner: partnerObj, error: null };
}

// Get partner by member ID
export async function getPartnerByMemberId(
  memberId: string
): Promise<{ partner: Partner | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("member_id", memberId)
    .single();

  if (error && error.code !== "PGRST116") {
    return { partner: null, error: new Error(error.message) };
  }

  return { partner: data ? mapPartnerFromDb(data) : null, error: null };
}

// ============ LY Points System ============

// Add LY points
export async function addLyPoints(
  partnerId: string,
  points: number,
  type: string,
  referenceId: string | null,
  tier: number | null,
  description: string
): Promise<{ success: boolean; error: Error | null }> {
  // Insert ledger entry
  const { error: ledgerError } = await supabase
    .from("ly_points_ledger")
    .insert({
      partner_id: partnerId,
      type: type,
      points: points,
      reference_id: referenceId,
      reference_type: type,
      tier: tier,
      description: description,
      created_at: new Date().toISOString(),
    });

  if (ledgerError) {
    console.error("Error adding LY points ledger:", ledgerError);
    return { success: false, error: new Error(ledgerError.message) };
  }

  // Update partner balance
  const { error: updateError } = await supabase.rpc("increment_ly_balance", {
    partner_id: partnerId,
    amount: points,
  });

  // Fallback if RPC doesn't exist
  if (updateError) {
    const { data: partner } = await supabase
      .from("partners")
      .select("ly_balance")
      .eq("id", partnerId)
      .single();

    await supabase
      .from("partners")
      .update({
        ly_balance: (partner?.ly_balance || 0) + points,
        updated_at: new Date().toISOString(),
      })
      .eq("id", partnerId);
  }

  return { success: true, error: null };
}

// Deduct LY points
export async function deductLyPoints(
  partnerId: string,
  points: number,
  type: string,
  referenceId: string | null,
  description: string
): Promise<{ success: boolean; error: Error | null }> {
  // Check balance
  const { data: partner } = await supabase
    .from("partners")
    .select("ly_balance")
    .eq("id", partnerId)
    .single();

  if (!partner || (partner.ly_balance || 0) < points) {
    return { success: false, error: new Error("Insufficient LY points") };
  }

  // Insert ledger entry (negative)
  await supabase.from("ly_points_ledger").insert({
    partner_id: partnerId,
    type: type,
    points: -points,
    reference_id: referenceId,
    reference_type: type,
    description: description,
    created_at: new Date().toISOString(),
  });

  // Update balance
  await supabase
    .from("partners")
    .update({
      ly_balance: (partner.ly_balance || 0) - points,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerId);

  return { success: true, error: null };
}

// ============ RWA Token System ============

// Add RWA tokens
export async function addRwaTokens(
  partnerId: string,
  tokens: number,
  source: string,
  orderId: string | null
): Promise<{ success: boolean; error: Error | null }> {
  // Get current cycle
  const { cycle } = await getCurrentBonusPoolCycle();

  // Insert ledger entry
  await supabase.from("rwa_token_ledger").insert({
    partner_id: partnerId,
    cycle_id: cycle?.id || null,
    tokens: tokens,
    source: source,
    order_id: orderId,
    created_at: new Date().toISOString(),
  });

  // Update partner tokens
  const { data: partner } = await supabase
    .from("partners")
    .select("rwa_tokens")
    .eq("id", partnerId)
    .single();

  await supabase
    .from("partners")
    .update({
      rwa_tokens: (partner?.rwa_tokens || 0) + tokens,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerId);

  return { success: true, error: null };
}

// Check if partner qualifies for group RWA (every 10 partners)
export async function checkGroupRwaEligibility(): Promise<void> {
  const { count } = await supabase
    .from("partners")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const totalPartners = count || 0;
  const rwaToAward = Math.floor(totalPartners / BONUS_POOL_CONFIG.minPartnersForRwa);

  // This would be tracked in a separate table to avoid double-awarding
  // For now, just log
  console.log(`Total partners: ${totalPartners}, RWA milestones: ${rwaToAward}`);
}

// ============ Order Cashback System (3-Generation) ============

// Get current 30-day cycle key (YYYY-MM format)
function getCurrentCashbackCycle(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

// Get partner's box count for current cycle
export async function getPartnerBoxCount(partnerId: string): Promise<number> {
  const yearMonth = getCurrentCashbackCycle();

  const { data } = await supabase
    .from("monthly_cashback_tracking")
    .select("box_count")
    .eq("partner_id", partnerId)
    .eq("year_month", yearMonth)
    .single();

  return data?.box_count || 0;
}

// Get partner's cashback rate based on current box count
export function getPartnerCashbackRate(currentBoxCount: number): number {
  const { tiers } = ORDER_CASHBACK_CONFIG;

  if (currentBoxCount < tiers.tier1.maxBoxes) {
    return tiers.tier1.rate; // 20%
  } else if (currentBoxCount < tiers.tier2.maxBoxes) {
    return tiers.tier2.rate; // 30%
  } else if (currentBoxCount < tiers.tier3.maxBoxes) {
    return tiers.tier3.rate; // 50%
  }
  return 0; // Max 10 boxes reached
}

// Find upline partners (up to 3 generations)
export async function findUplinePartners(
  memberId: string,
  maxGenerations: number = 3
): Promise<Array<{
  partnerId: string;
  memberId: string;
  generation: number;
  boxCount: number;
  cashbackRate: number;
}>> {
  const uplinePartners: Array<{
    partnerId: string;
    memberId: string;
    generation: number;
    boxCount: number;
    cashbackRate: number;
  }> = [];

  let currentMemberId = memberId;
  let generation = 0;

  while (generation < maxGenerations) {
    // Get referrer of current member
    const { data: member } = await supabase
      .from("members")
      .select("referrer_id")
      .eq("id", currentMemberId)
      .single();

    if (!member?.referrer_id) {
      break;
    }

    generation++;

    // Check if referrer is a partner
    const { data: partner } = await supabase
      .from("partners")
      .select("id, member_id")
      .eq("member_id", member.referrer_id)
      .eq("status", "active")
      .single();

    if (partner) {
      const boxCount = await getPartnerBoxCount(partner.id);
      const cashbackRate = getPartnerCashbackRate(boxCount);

      uplinePartners.push({
        partnerId: partner.id,
        memberId: partner.member_id,
        generation,
        boxCount,
        cashbackRate,
      });
    }

    currentMemberId = member.referrer_id;
  }

  return uplinePartners;
}

// Process order cashback rewards (called when order is delivered)
export async function processOrderCashback(
  orderId: string,
  orderAmount: number,
  boxCount: number,
  buyerMemberId: string
): Promise<{
  success: boolean;
  rewards: Array<{ partnerId: string; generation: number; rate: number; amount: number }>;
  error: Error | null;
}> {
  const rewards: Array<{ partnerId: string; generation: number; rate: number; amount: number }> = [];

  // Find upline partners (up to 3 generations)
  const uplinePartners = await findUplinePartners(buyerMemberId, ORDER_CASHBACK_CONFIG.maxGenerations);

  if (uplinePartners.length === 0) {
    return { success: true, rewards: [], error: null };
  }

  const yearMonth = getCurrentCashbackCycle();
  let prevRate = 0;

  for (const upline of uplinePartners) {
    // Check if partner has reached max 10 cashback events
    if (upline.boxCount >= ORDER_CASHBACK_CONFIG.maxCashbackPerCycle) {
      continue;
    }

    // Check if partner has LY points
    const { data: partner } = await supabase
      .from("partners")
      .select("ly_balance")
      .eq("id", upline.partnerId)
      .single();

    if (!partner || (partner.ly_balance || 0) <= 0) {
      // No LY points - reward is invalid, skip
      continue;
    }

    let cashbackAmount = 0;

    // Calculate cashback amount
    if (upline.generation === 1) {
      // First generation gets full rate
      cashbackAmount = Math.floor(orderAmount * upline.cashbackRate);
    } else {
      // Higher generations get differential (roll-up from lower tier)
      if (upline.cashbackRate > prevRate) {
        cashbackAmount = Math.floor(orderAmount * (upline.cashbackRate - prevRate));
      }
    }

    if (cashbackAmount <= 0) {
      prevRate = upline.cashbackRate;
      continue;
    }

    // Deduct 1 LY point
    await deductLyPoints(upline.partnerId, 1, "cashback", orderId, "Cashback reward processing fee");

    // Add to cash wallet
    await addToCashWallet(
      upline.partnerId,
      cashbackAmount,
      "order_cashback",
      orderId,
      `Order cashback (Gen ${upline.generation}, Rate: ${upline.cashbackRate * 100}%)`
    );

    // Update monthly tracking
    await updateMonthlyCashbackTracking(upline.partnerId, yearMonth, boxCount, cashbackAmount);

    rewards.push({
      partnerId: upline.partnerId,
      generation: upline.generation,
      rate: upline.cashbackRate,
      amount: cashbackAmount,
    });

    prevRate = upline.cashbackRate;
  }

  return { success: true, rewards, error: null };
}

// Update monthly cashback tracking
async function updateMonthlyCashbackTracking(
  partnerId: string,
  yearMonth: string,
  boxCount: number,
  cashbackAmount: number
): Promise<void> {
  // Check if record exists
  const { data: existing } = await supabase
    .from("monthly_cashback_tracking")
    .select("id, box_count, total_cashback")
    .eq("partner_id", partnerId)
    .eq("year_month", yearMonth)
    .single();

  if (existing) {
    // Update existing record
    await supabase
      .from("monthly_cashback_tracking")
      .update({
        box_count: (existing.box_count || 0) + boxCount,
        total_cashback: (existing.total_cashback || 0) + cashbackAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    // Create new record
    await supabase.from("monthly_cashback_tracking").insert({
      partner_id: partnerId,
      year_month: yearMonth,
      box_count: boxCount,
      total_cashback: cashbackAmount,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

// Reset monthly cashback tracking (call at start of each month via cron)
export async function resetMonthlyCashbackTracking(): Promise<{ count: number; error: Error | null }> {
  const currentCycle = getCurrentCashbackCycle();

  const { error, count } = await supabase
    .from("monthly_cashback_tracking")
    .delete()
    .neq("year_month", currentCycle);

  if (error) {
    return { count: 0, error: new Error(error.message) };
  }

  return { count: count || 0, error: null };
}

// ============ Referral Network System ============

// Process partner referral bonus (when someone upgrades to partner)
async function processPartnerReferralBonus(
  referrerId: string,
  newPartnerId: string,
  paymentAmount: number
): Promise<void> {
  // Direct referral bonus (10%)
  const directBonus = Math.floor(paymentAmount * REFERRAL_BONUS.directRate);
  await addToCashWallet(referrerId, directBonus, "referral_bonus", newPartnerId, `Direct referral bonus`);

  // Find indirect referrer (referrer's referrer)
  const { data: directReferrer } = await supabase
    .from("partners")
    .select("referrer_id")
    .eq("id", referrerId)
    .single();

  if (directReferrer?.referrer_id) {
    // Indirect referral bonus (5%)
    const indirectBonus = Math.floor(paymentAmount * REFERRAL_BONUS.indirectRate);
    await addToCashWallet(directReferrer.referrer_id, indirectBonus, "referral_bonus", newPartnerId, `Indirect referral bonus`);
  }
}

// Get referral tree (up to 10 levels deep)
export async function getReferralTree(
  partnerId: string,
  maxDepth: number = 10
): Promise<{ tree: Array<{ partnerId: string; level: number; name: string; tier: string; status: string }>; error: Error | null }> {
  const tree: Array<{ partnerId: string; level: number; name: string; tier: string; status: string }> = [];

  async function fetchLevel(parentIds: string[], currentLevel: number): Promise<void> {
    if (currentLevel > maxDepth || parentIds.length === 0) return;

    const { data: children } = await supabase
      .from("partners")
      .select(`
        id,
        tier,
        status,
        members!inner(name)
      `)
      .in("referrer_id", parentIds)
      .eq("status", "active");

    if (!children || children.length === 0) return;

    const nextParentIds: string[] = [];
    for (const child of children) {
      tree.push({
        partnerId: child.id,
        level: currentLevel,
        name: (child.members as any)?.name || "Unknown",
        tier: child.tier,
        status: child.status,
      });
      nextParentIds.push(child.id);
    }

    await fetchLevel(nextParentIds, currentLevel + 1);
  }

  await fetchLevel([partnerId], 1);

  return { tree, error: null };
}

// Check for order RWA rewards in referral network
export async function processNetworkOrderRwa(
  orderId: string,
  buyerMemberId: string
): Promise<void> {
  // Find if buyer is a member under any partner's network
  const { data: buyerMember } = await supabase
    .from("members")
    .select("referrer_id")
    .eq("id", buyerMemberId)
    .single();

  if (!buyerMember?.referrer_id) return;

  // Check if referrer is a partner
  const { data: referrerPartner } = await supabase
    .from("partners")
    .select("id, referrer_id")
    .eq("member_id", buyerMember.referrer_id)
    .eq("status", "active")
    .single();

  if (referrerPartner) {
    // Award 1 RWA to the referring partner
    await addRwaTokens(referrerPartner.id, 1, "network_order", orderId);
  } else {
    // Buyer's referrer is not a partner, check up the chain
    // Find the nearest partner in the upline
    let currentReferrerId = buyerMember.referrer_id;
    let depth = 0;
    const maxDepth = 10;

    while (currentReferrerId && depth < maxDepth) {
      const { data: member } = await supabase
        .from("members")
        .select("id, referrer_id")
        .eq("id", currentReferrerId)
        .single();

      if (!member) break;

      // Check if this member is a partner
      const { data: partner } = await supabase
        .from("partners")
        .select("id")
        .eq("member_id", member.id)
        .eq("status", "active")
        .single();

      if (partner) {
        // Award RWA to this partner
        await addRwaTokens(partner.id, 1, "network_order", orderId);
        break;
      }

      currentReferrerId = member.referrer_id;
      depth++;
    }
  }
}

// ============ Cash Wallet System ============

// Add to cash wallet
export async function addToCashWallet(
  partnerId: string,
  amount: number,
  type: string,
  referenceId: string | null,
  description: string
): Promise<{ success: boolean; error: Error | null }> {
  // Insert ledger entry
  await supabase.from("cash_wallet_ledger").insert({
    partner_id: partnerId,
    type: "income",
    amount: amount,
    reference_id: referenceId,
    reference_type: type,
    status: "completed",
    description: description,
    created_at: new Date().toISOString(),
  });

  // Update partner balance
  const { data: partner } = await supabase
    .from("partners")
    .select("cash_wallet_balance")
    .eq("id", partnerId)
    .single();

  await supabase
    .from("partners")
    .update({
      cash_wallet_balance: (partner?.cash_wallet_balance || 0) + amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerId);

  return { success: true, error: null };
}

// ============ Bonus Pool System ============

// Get or create current bonus pool cycle
export async function getCurrentBonusPoolCycle(): Promise<{ cycle: BonusPoolCycle | null; error: Error | null }> {
  const today = new Date();

  // Find active cycle
  const { data: activeCycle } = await supabase
    .from("bonus_pool_cycles")
    .select("*")
    .eq("status", "active")
    .lte("start_date", today.toISOString())
    .gte("end_date", today.toISOString())
    .single();

  if (activeCycle) {
    return { cycle: mapBonusPoolCycleFromDb(activeCycle), error: null };
  }

  // Create new cycle if none exists
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + BONUS_POOL_CONFIG.cycleDays);

  const { data: lastCycle } = await supabase
    .from("bonus_pool_cycles")
    .select("cycle_number")
    .order("cycle_number", { ascending: false })
    .limit(1)
    .single();

  const newCycleNumber = (lastCycle?.cycle_number || 0) + 1;

  const { data: newCycle, error } = await supabase
    .from("bonus_pool_cycles")
    .insert({
      cycle_number: newCycleNumber,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total_sales: 0,
      pool_amount: 0,
      total_tokens: 0,
      status: "active",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { cycle: null, error: new Error(error.message) };
  }

  return { cycle: mapBonusPoolCycleFromDb(newCycle), error: null };
}

// Add sales to bonus pool (called when order is paid)
export async function addSalesToBonusPool(
  orderId: string,
  saleAmount: number
): Promise<{ success: boolean; error: Error | null }> {
  const { cycle, error } = await getCurrentBonusPoolCycle();
  if (error || !cycle) {
    return { success: false, error: error || new Error("No active cycle") };
  }

  const poolContribution = Math.floor(saleAmount * BONUS_POOL_CONFIG.salesContributionRate);

  await supabase
    .from("bonus_pool_cycles")
    .update({
      total_sales: (cycle.totalSales || 0) + saleAmount,
      pool_amount: (cycle.poolAmount || 0) + poolContribution,
    })
    .eq("id", cycle.id);

  return { success: true, error: null };
}

// Distribute bonus pool (called at end of cycle)
export async function distributeBonusPool(
  cycleId: string
): Promise<{ success: boolean; distributed: number; error: Error | null }> {
  // Get cycle
  const { data: cycle } = await supabase
    .from("bonus_pool_cycles")
    .select("*")
    .eq("id", cycleId)
    .single();

  if (!cycle || cycle.status !== "active") {
    return { success: false, distributed: 0, error: new Error("Invalid cycle") };
  }

  // Get total RWA tokens across all active partners
  const { data: partners } = await supabase
    .from("partners")
    .select("id, rwa_tokens, ly_balance")
    .eq("status", "active")
    .gt("rwa_tokens", 0);

  if (!partners || partners.length === 0) {
    return { success: false, distributed: 0, error: new Error("No eligible partners") };
  }

  const totalTokens = partners.reduce((sum, p) => sum + (p.rwa_tokens || 0), 0);
  const poolAmount = cycle.pool_amount || 0;
  let totalDistributed = 0;

  // Distribute to each partner based on their token share
  for (const partner of partners) {
    const partnerTokens = partner.rwa_tokens || 0;
    const partnerLy = partner.ly_balance || 0;

    // Calculate share: (partner tokens / total tokens) * pool amount
    const share = Math.floor((partnerTokens / totalTokens) * poolAmount);

    if (share > 0) {
      // Check if partner has enough LY points (requirement for receiving dividends)
      const lyRequired = Math.floor(share / 100); // 1 LY per RM 1 dividend

      if (partnerLy >= lyRequired) {
        // Deduct LY points
        await deductLyPoints(partner.id, lyRequired, "dividend_fee", cycleId, `Cycle ${cycle.cycle_number} dividend LY deduction`);

        // Add to cash wallet
        await addToCashWallet(partner.id, share, "rwa_dividend", cycleId, `Cycle ${cycle.cycle_number} RWA dividend`);
        totalDistributed += share;
      }
    }
  }

  // Reset RWA tokens to 1 for all partners (as per requirement)
  await supabase
    .from("partners")
    .update({ rwa_tokens: 1, updated_at: new Date().toISOString() })
    .eq("status", "active");

  // Mark cycle as completed
  await supabase
    .from("bonus_pool_cycles")
    .update({
      status: "completed",
      total_tokens: totalTokens,
      distributed_at: new Date().toISOString(),
    })
    .eq("id", cycleId);

  return { success: true, distributed: totalDistributed, error: null };
}

// ============ Withdrawal System ============

// Create withdrawal request
export async function createWithdrawalRequest(
  partnerId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string
): Promise<{ requestId: string | null; error: Error | null }> {
  // Check balance
  const { data: partner } = await supabase
    .from("partners")
    .select("cash_wallet_balance, ly_balance")
    .eq("id", partnerId)
    .single();

  if (!partner) {
    return { requestId: null, error: new Error("Partner not found") };
  }

  if ((partner.cash_wallet_balance || 0) < amount) {
    return { requestId: null, error: new Error("Insufficient balance") };
  }

  // Check LY points (1 LY per RM 1 withdrawn)
  const lyRequired = Math.floor(amount / 100); // amount is in cents
  if ((partner.ly_balance || 0) < lyRequired) {
    return { requestId: null, error: new Error(`Insufficient LY points. Need ${lyRequired} LY to withdraw.`) };
  }

  // Create request
  const { data: request, error } = await supabase
    .from("withdrawal_requests")
    .insert({
      partner_id: partnerId,
      amount: amount,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      status: "pending",
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return { requestId: null, error: new Error(error.message) };
  }

  // Deduct from wallet (hold)
  await supabase
    .from("partners")
    .update({
      cash_wallet_balance: (partner.cash_wallet_balance || 0) - amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", partnerId);

  // Deduct LY points
  await deductLyPoints(partnerId, lyRequired, "withdrawal", request.id, `Withdrawal request LY fee`);

  // Record in ledger
  await supabase.from("cash_wallet_ledger").insert({
    partner_id: partnerId,
    type: "withdraw",
    amount: -amount,
    reference_id: request.id,
    reference_type: "withdrawal",
    status: "pending",
    description: `Withdrawal to ${bankName} ****${accountNumber.slice(-4)}`,
    created_at: new Date().toISOString(),
  });

  return { requestId: request.id, error: null };
}

// Approve withdrawal (admin)
export async function approveWithdrawal(
  requestId: string,
  adminUserId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from("withdrawal_requests")
    .update({
      status: "processing",
      processed_by: adminUserId,
      processed_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: new Error(error.message) };
  }

  // Update ledger status
  await supabase
    .from("cash_wallet_ledger")
    .update({ status: "processing" })
    .eq("reference_id", requestId);

  return { success: true, error: null };
}

// Complete withdrawal (after bank transfer T+3)
export async function completeWithdrawal(
  requestId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from("withdrawal_requests")
    .update({ status: "completed" })
    .eq("id", requestId)
    .eq("status", "processing");

  if (error) {
    return { success: false, error: new Error(error.message) };
  }

  // Update ledger status
  await supabase
    .from("cash_wallet_ledger")
    .update({ status: "completed" })
    .eq("reference_id", requestId);

  return { success: true, error: null };
}

// Reject withdrawal (refund to wallet)
export async function rejectWithdrawal(
  requestId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error: Error | null }> {
  // Get request details
  const { data: request } = await supabase
    .from("withdrawal_requests")
    .select("partner_id, amount")
    .eq("id", requestId)
    .single();

  if (!request) {
    return { success: false, error: new Error("Request not found") };
  }

  // Refund to wallet
  const { data: partner } = await supabase
    .from("partners")
    .select("cash_wallet_balance")
    .eq("id", request.partner_id)
    .single();

  await supabase
    .from("partners")
    .update({
      cash_wallet_balance: (partner?.cash_wallet_balance || 0) + request.amount,
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.partner_id);

  // Update request
  await supabase
    .from("withdrawal_requests")
    .update({
      status: "rejected",
      processed_by: adminUserId,
      processed_at: new Date().toISOString(),
      notes: reason,
    })
    .eq("id", requestId);

  // Update ledger
  await supabase
    .from("cash_wallet_ledger")
    .update({ status: "failed" })
    .eq("reference_id", requestId);

  // Note: LY points are NOT refunded as per business rule

  return { success: true, error: null };
}

// ============ Mappers ============

function mapPartnerFromDb(row: Record<string, unknown>): Partner {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    referralCode: row.referral_code as string | null,
    tier: row.tier as string,
    status: row.status as string,
    referrerId: row.referrer_id as string | null,
    lyBalance: row.ly_balance as number | null,
    cashWalletBalance: row.cash_wallet_balance as number | null,
    rwaTokens: row.rwa_tokens as number | null,
    totalSales: row.total_sales as number | null,
    totalCashback: row.total_cashback as number | null,
    paymentAmount: row.payment_amount as number | null,
    paymentDate: row.payment_date as string | null,
    paymentReference: row.payment_reference as string | null,
    createdAt: row.created_at as string | null,
    updatedAt: row.updated_at as string | null,
  };
}

function mapBonusPoolCycleFromDb(row: Record<string, unknown>): BonusPoolCycle {
  return {
    id: row.id as string,
    cycleNumber: row.cycle_number as number,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    totalSales: row.total_sales as number | null,
    poolAmount: row.pool_amount as number | null,
    totalTokens: row.total_tokens as number | null,
    status: row.status as string,
    distributedAt: row.distributed_at as string | null,
    createdAt: row.created_at as string | null,
  };
}
