import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameEn: text("name_en"),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  priceUnit: text("price_unit").default("份"),
  image: text("image").notNull(),
  category: text("category").notNull(),
  featured: boolean("featured").default(false),
  erpnextItemCode: text("erpnext_item_code"),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  message: text("message"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  content: text("content").notNull(),
  productType: text("product_type").notNull(),
  avatar: text("avatar"),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
});

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  memberId: varchar("member_id"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  status: text("status").notNull().default("pending"),
  totalAmount: integer("total_amount").notNull(),
  items: text("items").notNull(),
  packageType: text("package_type"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingState: text("shipping_state"),
  shippingPostcode: text("shipping_postcode"),
  preferredDeliveryDate: text("preferred_delivery_date"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  source: text("source").default("website"),
  erpnextId: text("erpnext_id"),
  metaOrderId: text("meta_order_id"),
  pointsEarned: integer("points_earned").default(0),
  pointsRedeemed: integer("points_redeemed").default(0),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export const orderStatusEnum = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = typeof orderStatusEnum[number];

// Sessions table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Members table - extended user profile with points
export const members = pgTable("members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  role: text("role").notNull().default("member"), // member, partner, admin
  pointsBalance: integer("points_balance").default(0),
  preferredFlavor: text("preferred_flavor"),
  preferredPackage: text("preferred_package"),
  referralCode: text("referral_code").unique(), // 推荐码
  referrerId: varchar("referrer_id"), // 推荐人会员ID
  createdAt: text("created_at").default(sql`now()`),
});

export const insertMemberSchema = createInsertSchema(members).omit({
  id: true,
  createdAt: true,
});

export type InsertMember = z.infer<typeof insertMemberSchema>;
export type Member = typeof members.$inferSelect;

// Malaysian states enum
export const malaysianStates = [
  "johor", "kedah", "kelantan", "melaka", "negeri_sembilan", 
  "pahang", "penang", "perak", "perlis", "sabah", "sarawak", 
  "selangor", "terengganu", "kuala_lumpur", "labuan", "putrajaya"
] as const;
export type MalaysianState = typeof malaysianStates[number];

// Member addresses table - Malaysian format
export const memberAddresses = pgTable("member_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  label: text("label").default("home"),
  recipientName: text("recipient_name").notNull(),
  phone: text("phone").notNull(),
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postcode: text("postcode").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertMemberAddressSchema = createInsertSchema(memberAddresses).omit({
  id: true,
  createdAt: true,
});

export type InsertMemberAddress = z.infer<typeof insertMemberAddressSchema>;
export type MemberAddress = typeof memberAddresses.$inferSelect;

// Points ledger - earn/redeem history
export const memberPointsLedger = pgTable("member_points_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  orderId: varchar("order_id").references(() => orders.id),
  type: text("type").notNull(),
  points: integer("points").notNull(),
  description: text("description"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertPointsLedgerSchema = createInsertSchema(memberPointsLedger).omit({
  id: true,
  createdAt: true,
});

export type InsertPointsLedger = z.infer<typeof insertPointsLedgerSchema>;
export type PointsLedger = typeof memberPointsLedger.$inferSelect;

export const pointsTypeEnum = ["earn", "redeem", "expire", "bonus"] as const;
export type PointsType = typeof pointsTypeEnum[number];

// ============ 联合经营人系统 (Business Partner System) ============

// 经营人配套等级
export const partnerTierEnum = ["phase1", "phase2", "phase3"] as const;
export type PartnerTier = typeof partnerTierEnum[number];

// 经营人状态
export const partnerStatusEnum = ["pending", "active", "suspended", "expired"] as const;
export type PartnerStatus = typeof partnerStatusEnum[number];

// 用户角色
export const userRoleEnum = ["member", "partner", "admin"] as const;
export type UserRole = typeof userRoleEnum[number];

// 联合经营人表
export const partners = pgTable("partners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: varchar("member_id").notNull().references(() => members.id),
  tier: text("tier").notNull().default("phase1"), // phase1, phase2, phase3
  status: text("status").notNull().default("pending"), // pending, active, suspended
  referrerId: varchar("referrer_id").references(() => partners.id), // 推荐人
  lyBalance: integer("ly_balance").default(0), // LY积分余额
  cashWalletBalance: integer("cash_wallet_balance").default(0), // 现金钱包余额（分）
  rwaTokens: integer("rwa_tokens").default(0), // 当前周期RWA令牌
  totalSales: integer("total_sales").default(0), // 总销售额（分）
  totalCashback: integer("total_cashback").default(0), // 总返现金额（分）
  paymentAmount: integer("payment_amount"), // 支付金额
  paymentDate: text("payment_date"),
  paymentReference: text("payment_reference"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partners.$inferSelect;

// LY积分流水表
export const lyPointsLedger = pgTable("ly_points_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  type: text("type").notNull(), // earn_referral, earn_sale, spend_cashback, bonus
  points: integer("points").notNull(), // 正数为获得，负数为消耗
  referenceId: varchar("reference_id"), // 关联的订单ID或其他
  referenceType: text("reference_type"), // order, cashback, bonus
  tier: integer("tier"), // 如果是推荐奖励，第几层
  description: text("description"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertLyPointsLedgerSchema = createInsertSchema(lyPointsLedger).omit({
  id: true,
  createdAt: true,
});

export type InsertLyPointsLedger = z.infer<typeof insertLyPointsLedgerSchema>;
export type LyPointsLedger = typeof lyPointsLedger.$inferSelect;

// RWA奖金池周期表
export const bonusPoolCycles = pgTable("bonus_pool_cycles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cycleNumber: integer("cycle_number").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalSales: integer("total_sales").default(0), // 周期总销售额
  poolAmount: integer("pool_amount").default(0), // 奖金池金额（销售额30%）
  totalTokens: integer("total_tokens").default(0), // 周期总令牌数
  status: text("status").notNull().default("active"), // active, calculating, distributed
  distributedAt: text("distributed_at"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertBonusPoolCycleSchema = createInsertSchema(bonusPoolCycles).omit({
  id: true,
  createdAt: true,
});

export type InsertBonusPoolCycle = z.infer<typeof insertBonusPoolCycleSchema>;
export type BonusPoolCycle = typeof bonusPoolCycles.$inferSelect;

// RWA令牌记录表
export const rwaTokenLedger = pgTable("rwa_token_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  cycleId: varchar("cycle_id").notNull().references(() => bonusPoolCycles.id),
  tokens: integer("tokens").notNull(), // 获得的令牌数
  source: text("source").notNull(), // base (基础1个), sale (销售获得)
  orderId: varchar("order_id").references(() => orders.id),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertRwaTokenLedgerSchema = createInsertSchema(rwaTokenLedger).omit({
  id: true,
  createdAt: true,
});

export type InsertRwaTokenLedger = z.infer<typeof insertRwaTokenLedgerSchema>;
export type RwaTokenLedger = typeof rwaTokenLedger.$inferSelect;

// 现金钱包流水表
export const cashWalletLedger = pgTable("cash_wallet_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  type: text("type").notNull(), // cashback, pool_dividend, withdrawal
  amount: integer("amount").notNull(), // 正数为收入，负数为支出（分）
  referenceId: varchar("reference_id"),
  referenceType: text("reference_type"),
  status: text("status").notNull().default("completed"), // pending, completed, rejected
  description: text("description"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertCashWalletLedgerSchema = createInsertSchema(cashWalletLedger).omit({
  id: true,
  createdAt: true,
});

export type InsertCashWalletLedger = z.infer<typeof insertCashWalletLedgerSchema>;
export type CashWalletLedger = typeof cashWalletLedger.$inferSelect;

// 提现申请表
export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  amount: integer("amount").notNull(), // 提现金额（分）
  bankName: text("bank_name"),
  accountNumber: text("account_number"),
  accountName: text("account_name"),
  status: text("status").notNull().default("pending"), // pending, approved, completed, rejected
  processedBy: varchar("processed_by"),
  processedAt: text("processed_at"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertWithdrawalRequestSchema = createInsertSchema(withdrawalRequests).omit({
  id: true,
  createdAt: true,
});

export type InsertWithdrawalRequest = z.infer<typeof insertWithdrawalRequestSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

// 月度返现记录表（追踪每月前5盒50%，5-10盒30%，超出20%）
export const monthlyCashbackTracking = pgTable("monthly_cashback_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: varchar("partner_id").notNull().references(() => partners.id),
  yearMonth: text("year_month").notNull(), // 格式: 2024-01
  boxCount: integer("box_count").default(0), // 当月已返现盒数
  totalCashback: integer("total_cashback").default(0), // 当月总返现金额
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

// ============ ERP系统表 ============

// 库存表
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // raw_material, packaging, finished_goods
  quantity: integer("quantity").default(0),
  unit: text("unit").notNull(), // kg, pcs, box
  minStock: integer("min_stock").default(0), // 最低库存预警
  costPrice: integer("cost_price"), // 成本价（分）
  location: text("location"), // 仓库位置
  batchNumber: text("batch_number"),
  expiryDate: text("expiry_date"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// 库存流水表
export const inventoryLedger = pgTable("inventory_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inventoryId: varchar("inventory_id").notNull().references(() => inventory.id),
  type: text("type").notNull(), // in, out, adjust
  quantity: integer("quantity").notNull(),
  referenceType: text("reference_type"), // purchase, production, order, adjust
  referenceId: varchar("reference_id"),
  notes: text("notes"),
  operatorId: varchar("operator_id"),
  createdAt: text("created_at").default(sql`now()`),
});

// 采购订单表
export const purchaseOrders = pgTable("purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  supplierId: varchar("supplier_id"),
  supplierName: text("supplier_name").notNull(),
  items: jsonb("items").notNull(), // [{sku, name, quantity, unitPrice}]
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, received, cancelled
  expectedDate: text("expected_date"),
  receivedDate: text("received_date"),
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPurchaseOrder = z.infer<typeof insertPurchaseOrderSchema>;
export type PurchaseOrder = typeof purchaseOrders.$inferSelect;

// 生产批次表
export const productionBatches = pgTable("production_batches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  batchNumber: text("batch_number").notNull().unique(),
  productId: varchar("product_id").references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(), // 生产数量
  status: text("status").notNull().default("planned"), // planned, preparing, cooking, cooling, packaging, completed
  plannedDate: text("planned_date"),
  startedAt: text("started_at"),
  completedAt: text("completed_at"),
  ingredients: jsonb("ingredients"), // 原料清单
  notes: text("notes"),
  createdBy: varchar("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertProductionBatchSchema = createInsertSchema(productionBatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProductionBatch = z.infer<typeof insertProductionBatchSchema>;
export type ProductionBatch = typeof productionBatches.$inferSelect;

// 卫生检查表
export const hygieneInspections = pgTable("hygiene_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionDate: text("inspection_date").notNull(),
  area: text("area").notNull(), // kitchen, storage, packaging, delivery
  inspectorName: text("inspector_name").notNull(),
  checkItems: jsonb("check_items").notNull(), // [{item, passed, notes}]
  overallResult: text("overall_result").notNull(), // pass, fail, needs_improvement
  photos: jsonb("photos"), // 照片URL列表
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertHygieneInspectionSchema = createInsertSchema(hygieneInspections).omit({
  id: true,
  createdAt: true,
});

export type InsertHygieneInspection = z.infer<typeof insertHygieneInspectionSchema>;
export type HygieneInspection = typeof hygieneInspections.$inferSelect;

// 冷链物流表
export const coldChainShipments = pgTable("cold_chain_shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id),
  trackingNumber: text("tracking_number").notNull(),
  carrier: text("carrier").notNull(), // 快递公司
  status: text("status").notNull().default("pending"), // pending, picked_up, in_transit, delivered
  pickupTime: text("pickup_time"),
  deliveredTime: text("delivered_time"),
  temperatureLog: jsonb("temperature_log"), // [{time, temp}] 温度记录
  recipientName: text("recipient_name"),
  recipientPhone: text("recipient_phone"),
  recipientAddress: text("recipient_address"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertColdChainShipmentSchema = createInsertSchema(coldChainShipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertColdChainShipment = z.infer<typeof insertColdChainShipmentSchema>;
export type ColdChainShipment = typeof coldChainShipments.$inferSelect;

// 成本记录表
export const costRecords = pgTable("cost_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(), // material, labor, shipping, packaging, other
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // 金额（分）
  referenceType: text("reference_type"), // purchase, production, order
  referenceId: varchar("reference_id"),
  recordDate: text("record_date").notNull(),
  createdBy: varchar("created_by"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertCostRecordSchema = createInsertSchema(costRecords).omit({
  id: true,
  createdAt: true,
});

export type InsertCostRecord = z.infer<typeof insertCostRecordSchema>;
export type CostRecord = typeof costRecords.$inferSelect;

// 账单表
export const bills = pgTable("bills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  billNumber: text("bill_number").notNull().unique(),
  type: text("type").notNull(), // income, expense
  category: text("category").notNull(), // sales, purchase, salary, rent, utility, other
  amount: integer("amount").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  paidDate: text("paid_date"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  referenceType: text("reference_type"),
  referenceId: varchar("reference_id"),
  createdBy: varchar("created_by"),
  createdAt: text("created_at").default(sql`now()`),
  updatedAt: text("updated_at").default(sql`now()`),
});

export const insertBillSchema = createInsertSchema(bills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBill = z.infer<typeof insertBillSchema>;
export type Bill = typeof bills.$inferSelect;

// 供应商表
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  category: text("category"), // raw_material, packaging, logistics
  notes: text("notes"),
  createdAt: text("created_at").default(sql`now()`),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  createdAt: true,
});

export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;
