import { 
  users, products, testimonials, contactMessages,
  type User, type InsertUser, 
  type Product, type InsertProduct, 
  type Testimonial, type InsertTestimonial, 
  type ContactMessage, type InsertContactMessage 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getFeaturedProducts(): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  
  getTestimonials(): Promise<Testimonial[]>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  
  seedDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
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

  async seedDefaultData(): Promise<void> {
    const existingProducts = await this.getProducts();
    if (existingProducts.length === 0) {
      const defaultProducts: InsertProduct[] = [
        {
          name: "即食冰糖燕窝",
          nameEn: "Ready-to-eat Bird's Nest",
          description: "精选优质燕盏，传统冰糖炖煮，开盖即食，方便快捷，保留燕窝天然营养与口感。",
          price: 168,
          priceUnit: "瓶",
          image: "/attached_assets/generated_images/dried_bird's_nest_product.png",
          category: "bird-nest",
          featured: true,
        },
        {
          name: "鲜炖花胶",
          nameEn: "Fresh Stewed Fish Maw",
          description: "精选深海花胶，每日新鲜炖煮，富含胶原蛋白，口感软糯，滋补养颜佳品。",
          price: 198,
          priceUnit: "份",
          image: "/attached_assets/generated_images/premium_fish_maw_product.png",
          category: "fish-maw",
          featured: true,
        },
        {
          name: "燕窝甜品套餐",
          nameEn: "Bird's Nest Dessert Set",
          description: "燕窝搭配红枣、枸杞、莲子等滋补食材，精心调配，美味与养生兼得。",
          price: 288,
          priceUnit: "套",
          image: "/attached_assets/generated_images/prepared_bird's_nest_dessert.png",
          category: "dessert",
          featured: true,
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
  }
}

export const storage = new DatabaseStorage();
