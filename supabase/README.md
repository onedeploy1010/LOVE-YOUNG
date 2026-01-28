# Supabase Database Setup

## Migrations

Run these SQL files in order in the Supabase SQL Editor:

### 1. `001_create_notifications_table.sql`
Creates the `notifications` table for order status updates.

### 2. `002_partner_cashback_functions.sql`
Creates all the functions and triggers for the Partner system.

## Functions

| Function | Description |
|----------|-------------|
| `get_partner_cashback_rate(partner_id, box_count)` | Returns cashback rate based on completed boxes |
| `get_current_cashback_cycle()` | Returns current YYYY-MM cycle |
| `get_partner_box_count(partner_id)` | Returns partner's box count for current cycle |
| `find_upline_partners(member_id, max_gen)` | Finds upline partners up to 3 generations |
| `process_order_cashback(order_id)` | Processes cashback rewards for delivered order |
| `distribute_bonus_pool(cycle_id)` | Distributes bonus pool to partners by RWA ratio |
| `reset_monthly_cashback_tracking()` | Resets monthly cashback count (cron job) |

## Triggers

| Trigger | Table | Event | Description |
|---------|-------|-------|-------------|
| `trg_order_delivered_cashback` | orders | AFTER UPDATE | Auto-process cashback when order delivered |
| `trg_order_status_notification` | orders | AFTER UPDATE | Create notification on status change |
| `trg_partner_referral_bonus` | partners | AFTER INSERT | Process direct (10%) and indirect (5%) referral bonus |
| `trg_order_bonus_pool` | orders | AFTER UPDATE | Add 30% of order to bonus pool |
| `trg_order_inventory_deduct` | orders | AFTER INSERT/UPDATE | Deduct inventory when order confirmed |
| `trg_order_inventory_restore` | orders | AFTER UPDATE | Restore inventory when order cancelled |
| `trg_order_rwa_reward` | orders | AFTER UPDATE | Award 1 RWA to nearest upline partner |

## Cashback Reward System (三代返现)

### Tiered Rates (based on boxes completed this month)
- **Boxes 1-2**: 20% cashback per box
- **Boxes 3-5**: 30% cashback per box
- **Boxes 6-10**: 50% cashback per box

### Rules
1. Partners receive cashback from their downline's purchases up to **3 generations**
2. If member hasn't upgraded to partner, rewards roll up to nearest upline partner
3. **Differential rewards**: Lower tier partner's difference rolls up to higher tier
   - Gen 2 partner at 20% → Gen 1 partner at 30% gets the 10% difference
   - Gen 2 partner at 30% → Gen 1 partner at 50% gets the 20% difference
4. **Max 10 cashback events** per 30-day cycle per partner
5. **LY points required**: 1 LY point is consumed per cashback event
6. Cashback count resets every 30 days

### Example
```
Order: RM 226 (1 box)
Buyer → Member A (not partner) → Partner B (2 boxes done, 20%) → Partner C (6 boxes done, 50%)

Partner B: RM 226 × 20% = RM 45.20 cashback
Partner C: RM 226 × (50% - 20%) = RM 67.80 differential cashback
```

## Partner Referral Bonus (经营人推荐)

When a member upgrades to Partner:
- **Direct referrer** (直推): 10% of payment
- **Indirect referrer** (间推): 5% of payment

Both require LY points to receive the bonus.

## RWA Token System

- Every 10 partners = 1 RWA (milestone bonus)
- Network order (10-layer recursive) = 1 RWA to nearest upline partner
- 10-day bonus pool cycles, distribute by RWA ratio
- RWA resets to 1 after each cycle distribution

## Bonus Pool (奖金池)

- 30% of all sales go to the bonus pool
- 10-day distribution cycles
- Distribution formula: `(partner_rwa / total_rwa) × pool_amount`
- Requires LY points to receive distribution
- After distribution, all partner RWA resets to 1

## Cron Jobs (Scheduled)

Add these as Supabase Edge Functions or external cron:

```sql
-- Monthly cashback reset (run on 1st of each month)
SELECT reset_monthly_cashback_tracking();

-- Bonus pool distribution (run every 10 days)
SELECT distribute_bonus_pool(cycle_id)
FROM bonus_pool_cycles
WHERE status = 'active'
AND end_date <= CURRENT_DATE;
```
