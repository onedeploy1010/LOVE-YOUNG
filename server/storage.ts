import { type User, type InsertUser, type Product, type InsertProduct, type Testimonial, type InsertTestimonial, type ContactMessage, type InsertContactMessage } from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private products: Map<string, Product>;
  private testimonials: Map<string, Testimonial>;
  private contactMessages: Map<string, ContactMessage>;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.testimonials = new Map();
    this.contactMessages = new Map();
    
    this.initializeProducts();
    this.initializeTestimonials();
  }

  private initializeProducts() {
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

    defaultProducts.forEach((p) => {
      const id = randomUUID();
      this.products.set(id, { ...p, id });
    });
  }

  private initializeTestimonials() {
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

    defaultTestimonials.forEach((t) => {
      const id = randomUUID();
      this.testimonials.set(id, { ...t, id });
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getFeaturedProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter((p) => p.featured);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const id = randomUUID();
    const testimonial: Testimonial = { ...insertTestimonial, id };
    this.testimonials.set(id, testimonial);
    return testimonial;
  }

  async createContactMessage(insertMessage: InsertContactMessage): Promise<ContactMessage> {
    const id = randomUUID();
    const message: ContactMessage = { 
      ...insertMessage, 
      id,
      createdAt: new Date().toISOString(),
    };
    this.contactMessages.set(id, message);
    return message;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return Array.from(this.contactMessages.values());
  }
}

export const storage = new MemStorage();
