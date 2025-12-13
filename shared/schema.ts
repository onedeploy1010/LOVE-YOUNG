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
  pointsBalance: integer("points_balance").default(0),
  preferredFlavor: text("preferred_flavor"),
  preferredPackage: text("preferred_package"),
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
