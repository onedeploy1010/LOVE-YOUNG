import { 
  users, products, testimonials, contactMessages, orders,
  members, memberAddresses, memberPointsLedger,
  partners, lyPointsLedger, cashWalletLedger, bonusPoolCycles,
  productionBatches, productionSteps, productionMaterials, inventory, inventoryLedger,
  type User, type UpsertUser,
  type Product, type InsertProduct, 
  type Testimonial, type InsertTestimonial, 
  type ContactMessage, type InsertContactMessage,
  type Order, type InsertOrder,
  type Member, type InsertMember,
  type MemberAddress, type InsertMemberAddress,
  type PointsLedger, type InsertPointsLedger,
  type Partner, type InsertPartner,
  type LyPointsLedger, type InsertLyPointsLedger,
  type CashWalletLedger, type InsertCashWalletLedger,
  type BonusPoolCycle, type InsertBonusPoolCycle,
  type ProductionBatch, type InsertProductionBatch,
  type ProductionStep, type InsertProductionStep,
  type ProductionMaterial, type InsertProductionMaterial,
  type Inventory, type InsertInventory
} from "@shared/schema";
import { db } from "./db";
import { eq, or, desc, sql, count } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderByNumber(orderNumber: string): Promise<Order | undefined>;
  getOrderByPhone(phone: string): Promise<Order[]>;
  findOrder(query: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  
  getMember(id: string): Promise<Member | undefined>;
  getMemberByUserId(userId: string): Promise<Member | undefined>;
  getMemberByPhone(phone: string): Promise<Member | undefined>;
  createMember(member: InsertMember): Promise<Member>;
  updateMember(id: string, member: Partial<InsertMember>): Promise<Member | undefined>;
  
  getMemberAddresses(memberId: string): Promise<MemberAddress[]>;
  getMemberAddress(id: string): Promise<MemberAddress | undefined>;
  createMemberAddress(address: InsertMemberAddress): Promise<MemberAddress>;
  updateMemberAddress(id: string, address: Partial<InsertMemberAddress>): Promise<MemberAddress | undefined>;
  deleteMemberAddress(id: string): Promise<boolean>;
  setDefaultAddress(memberId: string, addressId: string): Promise<void>;
  
  getMemberPoints(memberId: string): Promise<PointsLedger[]>;
  addPoints(entry: InsertPointsLedger): Promise<PointsLedger>;
  getMemberOrderHistory(memberId: string): Promise<Order[]>;
  getMemberOrderCount(memberId: string): Promise<number>;
  
  // Partner methods
  getPartnerByMemberId(memberId: string): Promise<Partner | undefined>;
  getPartnerByReferralCode(code: string): Promise<Partner | undefined>;
  createPartner(partner: InsertPartner): Promise<Partner>;
  updatePartner(id: string, partner: Partial<InsertPartner>): Promise<Partner | undefined>;
  activatePartner(id: string): Promise<Partner | undefined>;
  getAllPartners(): Promise<Partner[]>;
  
  // LY Points methods
  getLyPointsLedger(partnerId: string): Promise<LyPointsLedger[]>;
  addLyPoints(entry: InsertLyPointsLedger): Promise<LyPointsLedger>;
  
  // Cash wallet methods
  getCashWalletLedger(partnerId: string): Promise<CashWalletLedger[]>;
  addCashWalletEntry(entry: InsertCashWalletLedger): Promise<CashWalletLedger>;
  
  // Bonus pool methods
  getCurrentBonusPoolCycle(): Promise<BonusPoolCycle | undefined>;
  createBonusPoolCycle(cycle: InsertBonusPoolCycle): Promise<BonusPoolCycle>;
  
  // Stats methods
  getPartnerReferralStats(partnerId: string): Promise<{ directReferrals: number; totalNetwork: number; monthlyEarnings: number }>;
  getAdminDashboardStats(): Promise<{ activePartners: number; monthlyOrders: number; monthlySales: number; poolBalance: number }>;
  
  // Production line methods
  getProductionBatches(): Promise<ProductionBatch[]>;
  getProductionBatch(id: string): Promise<ProductionBatch | undefined>;
  createProductionBatch(batch: InsertProductionBatch): Promise<ProductionBatch>;
  updateProductionBatch(id: string, batch: Partial<InsertProductionBatch>): Promise<ProductionBatch | undefined>;
  
  getProductionSteps(batchId: string): Promise<ProductionStep[]>;
  createProductionStep(step: InsertProductionStep): Promise<ProductionStep>;
  updateProductionStep(id: string, step: Partial<InsertProductionStep>): Promise<ProductionStep | undefined>;
  
  getProductionMaterials(batchId: string): Promise<ProductionMaterial[]>;
  createProductionMaterial(material: InsertProductionMaterial): Promise<ProductionMaterial>;
  updateProductionMaterial(id: string, material: Partial<InsertProductionMaterial>): Promise<ProductionMaterial | undefined>;
  
  // Inventory methods
  getInventoryItems(): Promise<Inventory[]>;
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deductInventory(inventoryId: string, quantity: number, referenceType: string, referenceId: string, notes?: string): Promise<void>;
  
  seedDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.featured, true));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db.insert(products).values(insertProduct).returning();
    return product;
  }

  async updateProduct(id: string, updateData: Partial<InsertProduct>): Promise<Product | undefined> {
    const [product] = await db.update(products).set(updateData).where(eq(products.id, id)).returning();
    return product || undefined;
  }

  async getTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials);
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db.insert(testimonials).values(insertTestimonial).returning();
    return testimonial;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const [message] = await db.insert(contactMessages).values(insertMessage).returning();
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return await db.select().from(contactMessages);
  }

  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders);
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order || undefined;
  }

  async getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    return order || undefined;
  }

  async getOrderByPhone(phone: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerPhone, phone));
  }

  async findOrder(query: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(
      or(eq(orders.orderNumber, query), eq(orders.customerPhone, query))
    );
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const [order] = await db.insert(orders).values(insertOrder).returning();
    return order;
  }

  async updateOrder(id: string, updateData: Partial<InsertOrder>): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    }).where(eq(orders.id, id)).returning();
    return order || undefined;
  }

  async getMember(id: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.id, id));
    return member || undefined;
  }

  async getMemberByUserId(userId: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.userId, userId));
    return member || undefined;
  }

  async getMemberByPhone(phone: string): Promise<Member | undefined> {
    const [member] = await db.select().from(members).where(eq(members.phone, phone));
    return member || undefined;
  }

  async createMember(insertMember: InsertMember): Promise<Member> {
    const [member] = await db.insert(members).values(insertMember).returning();
    return member;
  }

  async updateMember(id: string, updateData: Partial<InsertMember>): Promise<Member | undefined> {
    const [member] = await db.update(members).set(updateData).where(eq(members.id, id)).returning();
    return member || undefined;
  }

  async getMemberAddresses(memberId: string): Promise<MemberAddress[]> {
    return await db.select().from(memberAddresses).where(eq(memberAddresses.memberId, memberId));
  }

  async getMemberAddress(id: string): Promise<MemberAddress | undefined> {
    const [address] = await db.select().from(memberAddresses).where(eq(memberAddresses.id, id));
    return address || undefined;
  }

  async createMemberAddress(insertAddress: InsertMemberAddress): Promise<MemberAddress> {
    const [address] = await db.insert(memberAddresses).values(insertAddress).returning();
    return address;
  }

  async updateMemberAddress(id: string, updateData: Partial<InsertMemberAddress>): Promise<MemberAddress | undefined> {
    const [address] = await db.update(memberAddresses).set(updateData).where(eq(memberAddresses.id, id)).returning();
    return address || undefined;
  }

  async deleteMemberAddress(id: string): Promise<boolean> {
    const result = await db.delete(memberAddresses).where(eq(memberAddresses.id, id)).returning();
    return result.length > 0;
  }

  async setDefaultAddress(memberId: string, addressId: string): Promise<void> {
    await db.update(memberAddresses).set({ isDefault: false }).where(eq(memberAddresses.memberId, memberId));
    await db.update(memberAddresses).set({ isDefault: true }).where(eq(memberAddresses.id, addressId));
  }

  async getMemberPoints(memberId: string): Promise<PointsLedger[]> {
    return await db.select().from(memberPointsLedger)
      .where(eq(memberPointsLedger.memberId, memberId))
      .orderBy(desc(memberPointsLedger.createdAt));
  }

  async addPoints(entry: InsertPointsLedger): Promise<PointsLedger> {
    const [pointsEntry] = await db.insert(memberPointsLedger).values(entry).returning();
    
    const member = await this.getMember(entry.memberId);
    if (member) {
      const newBalance = (member.pointsBalance || 0) + entry.points;
      await this.updateMember(entry.memberId, { pointsBalance: newBalance });
    }
    
    return pointsEntry;
  }

  async getMemberOrderHistory(memberId: string): Promise<Order[]> {
    return await db.select().from(orders)
      .where(eq(orders.memberId, memberId))
      .orderBy(desc(orders.createdAt));
  }

  async getMemberOrderCount(memberId: string): Promise<number> {
    const result = await db.select({ count: count() }).from(orders)
      .where(eq(orders.memberId, memberId));
    return result[0]?.count || 0;
  }

  // Partner methods
  async getPartnerByMemberId(memberId: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.memberId, memberId));
    return partner || undefined;
  }

  async getPartnerByReferralCode(code: string): Promise<Partner | undefined> {
    const [partner] = await db.select().from(partners).where(eq(partners.referralCode, code.toUpperCase()));
    return partner || undefined;
  }

  async createPartner(partnerData: InsertPartner): Promise<Partner> {
    const [partner] = await db.insert(partners).values(partnerData).returning();
    return partner;
  }

  async updatePartner(id: string, updateData: Partial<InsertPartner>): Promise<Partner | undefined> {
    const [partner] = await db.update(partners).set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    }).where(eq(partners.id, id)).returning();
    return partner || undefined;
  }

  async activatePartner(id: string): Promise<Partner | undefined> {
    return this.updatePartner(id, { status: "active", paymentDate: new Date().toISOString() });
  }

  async getAllPartners(): Promise<Partner[]> {
    return await db.select().from(partners).orderBy(desc(partners.createdAt));
  }

  // LY Points methods
  async getLyPointsLedger(partnerId: string): Promise<LyPointsLedger[]> {
    return await db.select().from(lyPointsLedger)
      .where(eq(lyPointsLedger.partnerId, partnerId))
      .orderBy(desc(lyPointsLedger.createdAt));
  }

  async addLyPoints(entry: InsertLyPointsLedger): Promise<LyPointsLedger> {
    const [record] = await db.insert(lyPointsLedger).values(entry).returning();
    
    // Update partner's LY balance
    const partner = await db.select().from(partners).where(eq(partners.id, entry.partnerId));
    if (partner.length > 0) {
      const newBalance = (partner[0].lyBalance || 0) + entry.points;
      await db.update(partners).set({ lyBalance: newBalance }).where(eq(partners.id, entry.partnerId));
    }
    
    return record;
  }

  // Cash wallet methods
  async getCashWalletLedger(partnerId: string): Promise<CashWalletLedger[]> {
    return await db.select().from(cashWalletLedger)
      .where(eq(cashWalletLedger.partnerId, partnerId))
      .orderBy(desc(cashWalletLedger.createdAt));
  }

  async addCashWalletEntry(entry: InsertCashWalletLedger): Promise<CashWalletLedger> {
    const [record] = await db.insert(cashWalletLedger).values(entry).returning();
    
    // Update partner's cash balance
    const partner = await db.select().from(partners).where(eq(partners.id, entry.partnerId));
    if (partner.length > 0) {
      const newBalance = (partner[0].cashWalletBalance || 0) + entry.amount;
      await db.update(partners).set({ cashWalletBalance: newBalance }).where(eq(partners.id, entry.partnerId));
    }
    
    return record;
  }

  // Bonus pool methods
  async getCurrentBonusPoolCycle(): Promise<BonusPoolCycle | undefined> {
    const [cycle] = await db.select().from(bonusPoolCycles)
      .where(eq(bonusPoolCycles.status, "active"))
      .orderBy(desc(bonusPoolCycles.cycleNumber))
      .limit(1);
    return cycle || undefined;
  }

  async createBonusPoolCycle(cycleData: InsertBonusPoolCycle): Promise<BonusPoolCycle> {
    const [cycle] = await db.insert(bonusPoolCycles).values(cycleData).returning();
    return cycle;
  }

  // Stats methods
  async getPartnerReferralStats(partnerId: string): Promise<{ directReferrals: number; totalNetwork: number; monthlyEarnings: number }> {
    // Get direct referrals (partners who have this partner as their referrer)
    const directReferrals = await db.select().from(partners).where(eq(partners.referrerId, partnerId));
    
    // For now, total network is same as direct (can implement multi-level later)
    const totalNetwork = directReferrals.length;
    
    // Monthly earnings from LY points ledger
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyLedger = await db.select().from(lyPointsLedger)
      .where(eq(lyPointsLedger.partnerId, partnerId));
    const monthlyEarnings = monthlyLedger
      .filter(entry => entry.createdAt && entry.createdAt >= startOfMonth)
      .reduce((sum, entry) => sum + (entry.points > 0 ? entry.points : 0), 0);
    
    return {
      directReferrals: directReferrals.length,
      totalNetwork,
      monthlyEarnings,
    };
  }

  async getAdminDashboardStats(): Promise<{ activePartners: number; monthlyOrders: number; monthlySales: number; poolBalance: number }> {
    // Active partners
    const activePartnersList = await db.select().from(partners).where(eq(partners.status, "active"));
    
    // Monthly orders and sales
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const allOrders = await db.select().from(orders);
    const monthlyOrders = allOrders.filter(o => o.createdAt && o.createdAt >= startOfMonth);
    const monthlySales = monthlyOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    
    // Current pool balance
    const currentCycle = await this.getCurrentBonusPoolCycle();
    const poolBalance = currentCycle?.poolAmount || 0;
    
    return {
      activePartners: activePartnersList.length,
      monthlyOrders: monthlyOrders.length,
      monthlySales,
      poolBalance,
    };
  }

  async seedDefaultData(): Promise<void> {
    const existingProducts = await this.getProducts();
    if (existingProducts.length === 0) {
      const defaultProducts: InsertProduct[] = [
        {
          name: "原味红枣燕窝",
          nameEn: "Original Red Date Bird's Nest",
          description: "经典原味红枣燕窝，提供有奶和无奶两种选择。6罐1盒 RM226，12罐2盒 RM431。",
          price: 226,
          priceUnit: "盒(6罐)",
          image: "/attached_assets/generated_images/dried_bird's_nest_product.png",
          category: "bird-nest",
          featured: true,
        },
        {
          name: "可可燕麦燕窝",
          nameEn: "Cocoa Oat Bird's Nest",
          description: "香浓可可搭配燕麦与燕窝，营养美味。6罐1盒 RM226，12罐2盒 RM431。",
          price: 226,
          priceUnit: "盒(6罐)",
          image: "/attached_assets/generated_images/premium_fish_maw_product.png",
          category: "bird-nest",
          featured: true,
        },
        {
          name: "抹茶燕麦燕窝",
          nameEn: "Matcha Oat Bird's Nest",
          description: "日式抹茶风味燕麦燕窝，清新健康。6罐1盒 RM226，12罐2盒 RM431。",
          price: 226,
          priceUnit: "盒(6罐)",
          image: "/attached_assets/generated_images/prepared_bird's_nest_dessert.png",
          category: "bird-nest",
          featured: true,
        },
        {
          name: "紫米燕麦燕窝",
          nameEn: "Purple Rice Oat Bird's Nest",
          description: "紫米燕麦与燕窝的完美结合，营养丰富。6罐1盒 RM226，12罐2盒 RM431。",
          price: 226,
          priceUnit: "盒(6罐)",
          image: "/attached_assets/generated_images/dried_bird's_nest_product.png",
          category: "bird-nest",
          featured: false,
        },
        {
          name: "桃胶桂圆燕窝",
          nameEn: "Peach Gum Longan Bird's Nest",
          description: "桃胶搭配桂圆与燕窝，有奶和无奶两种选择。6罐1盒 RM226，12罐2盒 RM431。",
          price: 226,
          priceUnit: "盒(6罐)",
          image: "/attached_assets/generated_images/premium_fish_maw_product.png",
          category: "bird-nest",
          featured: false,
        },
        {
          name: "枣杞燕窝",
          nameEn: "Red Date Goji Bird's Nest",
          description: "红枣枸杞燕窝，经典滋补组合，有奶和无奶选择。6罐1盒 RM226，12罐2盒 RM431。",
          price: 226,
          priceUnit: "盒(6罐)",
          image: "/attached_assets/generated_images/prepared_bird's_nest_dessert.png",
          category: "bird-nest",
          featured: false,
        },
        {
          name: "桃胶燕窝",
          nameEn: "Peach Gum Bird's Nest",
          description: "桃胶与燕窝的养颜搭配，有奶和无奶选择。6罐1盒 RM226，12罐2盒 RM431。",
          price: 226,
          priceUnit: "盒(6罐)",
          image: "/attached_assets/generated_images/dried_bird's_nest_product.png",
          category: "bird-nest",
          featured: false,
        },
        {
          name: "木瓜燕窝",
          nameEn: "Papaya Bird's Nest",
          description: "木瓜与燕窝的经典搭配，含奶款式。6罐1盒 RM226，12罐2盒 RM431。",
          price: 226,
          priceUnit: "盒(6罐)",
          image: "/attached_assets/generated_images/premium_fish_maw_product.png",
          category: "bird-nest",
          featured: false,
        },
      ];

      for (const product of defaultProducts) {
        await this.createProduct(product);
      }
    }

    const existingTestimonials = await this.getTestimonials();
    if (existingTestimonials.length === 0) {
      const defaultTestimonials: InsertTestimonial[] = [
        {
          name: "林小姐",
          content: "第一次尝试LOVEYOUNG的鲜炖燕窝，品质真的很好！口感细腻，甜度刚好，而且包装精美，送礼自用都很合适。",
          productType: "即食冰糖燕窝",
        },
        {
          name: "张太太",
          content: "一直在找好品质的花胶，朋友推荐了LOVEYOUNG。试了之后果然没失望，花胶很厚实，炖得软糯入味。",
          productType: "鲜炖花胶",
        },
        {
          name: "王女士",
          content: "怀孕期间一直在吃他们家的燕窝，品质稳定，每次都很新鲜。通过Meta店铺下单很方便，配送也准时。",
          productType: "燕窝甜品套餐",
        },
      ];

      for (const testimonial of defaultTestimonials) {
        await this.createTestimonial(testimonial);
      }
    }

    const existingOrders = await this.getOrders();
    if (existingOrders.length === 0) {
      const sampleOrders: InsertOrder[] = [
        {
          orderNumber: "LY20241201001",
          customerName: "林小姐",
          customerPhone: "60123456789",
          status: "delivered",
          totalAmount: 336,
          items: JSON.stringify([
            { name: "即食冰糖燕窝", quantity: 2, price: 168 }
          ]),
          shippingAddress: "吉隆坡市中心某地址",
          trackingNumber: "MY123456789",
          source: "meta",
        },
        {
          orderNumber: "LY20241205002",
          customerName: "张先生",
          customerPhone: "60198765432",
          status: "shipped",
          totalAmount: 486,
          items: JSON.stringify([
            { name: "鲜炖花胶", quantity: 1, price: 198 },
            { name: "燕窝甜品套餐", quantity: 1, price: 288 }
          ]),
          shippingAddress: "槟城乔治市某地址",
          trackingNumber: "MY987654321",
          source: "whatsapp",
        },
      ];

      for (const order of sampleOrders) {
        await this.createOrder(order);
      }
    }
  }

  // Production line methods
  async getProductionBatches(): Promise<ProductionBatch[]> {
    return await db.select().from(productionBatches).orderBy(desc(productionBatches.createdAt));
  }

  async getProductionBatch(id: string): Promise<ProductionBatch | undefined> {
    const [batch] = await db.select().from(productionBatches).where(eq(productionBatches.id, id));
    return batch || undefined;
  }

  async createProductionBatch(batch: InsertProductionBatch): Promise<ProductionBatch> {
    const [newBatch] = await db.insert(productionBatches).values(batch).returning();
    return newBatch;
  }

  async updateProductionBatch(id: string, batch: Partial<InsertProductionBatch>): Promise<ProductionBatch | undefined> {
    const [updated] = await db
      .update(productionBatches)
      .set({ ...batch, updatedAt: sql`now()` })
      .where(eq(productionBatches.id, id))
      .returning();
    return updated || undefined;
  }

  async getProductionSteps(batchId: string): Promise<ProductionStep[]> {
    return await db
      .select()
      .from(productionSteps)
      .where(eq(productionSteps.batchId, batchId))
      .orderBy(productionSteps.stepOrder);
  }

  async createProductionStep(step: InsertProductionStep): Promise<ProductionStep> {
    const [newStep] = await db.insert(productionSteps).values(step).returning();
    return newStep;
  }

  async updateProductionStep(id: string, step: Partial<InsertProductionStep>): Promise<ProductionStep | undefined> {
    const [updated] = await db
      .update(productionSteps)
      .set(step)
      .where(eq(productionSteps.id, id))
      .returning();
    return updated || undefined;
  }

  async getProductionMaterials(batchId: string): Promise<ProductionMaterial[]> {
    return await db
      .select()
      .from(productionMaterials)
      .where(eq(productionMaterials.batchId, batchId));
  }

  async createProductionMaterial(material: InsertProductionMaterial): Promise<ProductionMaterial> {
    const [newMaterial] = await db.insert(productionMaterials).values(material).returning();
    return newMaterial;
  }

  async updateProductionMaterial(id: string, material: Partial<InsertProductionMaterial>): Promise<ProductionMaterial | undefined> {
    const [updated] = await db
      .update(productionMaterials)
      .set(material)
      .where(eq(productionMaterials.id, id))
      .returning();
    return updated || undefined;
  }

  // Inventory methods
  async getInventoryItems(): Promise<Inventory[]> {
    return await db.select().from(inventory).orderBy(inventory.name);
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    const [item] = await db.select().from(inventory).where(eq(inventory.id, id));
    return item || undefined;
  }

  async createInventoryItem(item: InsertInventory): Promise<Inventory> {
    const [newItem] = await db.insert(inventory).values(item).returning();
    return newItem;
  }

  async updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const [updated] = await db
      .update(inventory)
      .set({ ...item, updatedAt: sql`now()` })
      .where(eq(inventory.id, id))
      .returning();
    return updated || undefined;
  }

  async deductInventory(inventoryId: string, quantity: number, referenceType: string, referenceId: string, notes?: string): Promise<void> {
    // Get current inventory
    const item = await this.getInventoryItem(inventoryId);
    if (!item) throw new Error("Inventory item not found");

    // Deduct quantity
    await db
      .update(inventory)
      .set({ 
        quantity: (item.quantity || 0) - quantity,
        updatedAt: sql`now()`
      })
      .where(eq(inventory.id, inventoryId));

    // Create ledger entry
    await db.insert(inventoryLedger).values({
      inventoryId,
      type: "out",
      quantity: -quantity,
      referenceType,
      referenceId,
      notes
    });
  }
}

export const storage = new DatabaseStorage();
