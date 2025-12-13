import { 
  users, products, testimonials, contactMessages, orders,
  members, memberAddresses, memberPointsLedger,
  type User, type UpsertUser,
  type Product, type InsertProduct, 
  type Testimonial, type InsertTestimonial, 
  type ContactMessage, type InsertContactMessage,
  type Order, type InsertOrder,
  type Member, type InsertMember,
  type MemberAddress, type InsertMemberAddress,
  type PointsLedger, type InsertPointsLedger
} from "@shared/schema";
import { db } from "./db";
import { eq, or, desc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
