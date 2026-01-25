import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertOrderSchema, insertMemberSchema, insertMemberAddressSchema, insertPartnerSchema } from "@shared/schema";
import { z } from "zod";
import {
  syncProductsToDatabase,
  syncOrdersFromErpnext,
  createOrderInErpnext,
  isErpnextConfigured,
} from "./services/erpnext";
import {
  processWhatsAppMessage,
  sendWhatsAppMessage,
  isWhatsAppConfigured,
  isTextMessage,
} from "./services/whatsapp";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);

  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get user state - returns user's current role/state in the system
  // States: user (basic), member (has orders), partner (active partner), admin
  app.get("/api/auth/state", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user has a member profile
      const member = await storage.getMemberByUserId(userId);
      
      if (!member) {
        // Basic user - logged in but no member profile
        return res.json({
          state: "user",
          user,
          member: null,
          partner: null,
        });
      }

      // Check if admin
      if (member.role === "admin") {
        return res.json({
          state: "admin",
          user,
          member,
          partner: null,
        });
      }

      // Check if partner
      const partner = await storage.getPartnerByMemberId(member.id);
      if (partner && partner.status === "active") {
        return res.json({
          state: "partner",
          user,
          member,
          partner,
        });
      }

      // Check if has purchase history (member status)
      const orderCount = await storage.getMemberOrderCount(member.id);
      if (orderCount > 0) {
        return res.json({
          state: "member",
          user,
          member,
          partner: partner || null, // May be pending partner
        });
      }

      // Has member profile but no orders - still user state
      return res.json({
        state: "user",
        user,
        member,
        partner: partner || null,
      });

    } catch (error) {
      console.error("Error fetching user state:", error);
      res.status(500).json({ error: "Failed to fetch user state" });
    }
  });

  // Member profile endpoints
  app.get("/api/members/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }
      res.json(member);
    } catch (error) {
      console.error("Error fetching member:", error);
      res.status(500).json({ error: "Failed to fetch member profile" });
    }
  });

  app.post("/api/members/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const existingMember = await storage.getMemberByUserId(userId);
      if (existingMember) {
        return res.status(400).json({ error: "Member profile already exists" });
      }

      const result = insertMemberSchema.safeParse({ ...req.body, userId });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid member data", details: result.error.issues });
      }

      const member = await storage.createMember(result.data);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error creating member:", error);
      res.status(500).json({ error: "Failed to create member profile" });
    }
  });

  app.put("/api/members/me", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const updateSchema = insertMemberSchema.partial().omit({ userId: true });
      const result = updateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid member data", details: result.error.issues });
      }

      const updatedMember = await storage.updateMember(member.id, result.data);
      res.json(updatedMember);
    } catch (error) {
      console.error("Error updating member:", error);
      res.status(500).json({ error: "Failed to update member profile" });
    }
  });

  // Member addresses endpoints
  app.get("/api/members/me/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const addresses = await storage.getMemberAddresses(member.id);
      res.json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ error: "Failed to fetch addresses" });
    }
  });

  app.post("/api/members/me/addresses", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const result = insertMemberAddressSchema.safeParse({ ...req.body, memberId: member.id });
      if (!result.success) {
        return res.status(400).json({ error: "Invalid address data", details: result.error.issues });
      }

      const address = await storage.createMemberAddress(result.data);
      
      // If this is the first address, make it default
      const allAddresses = await storage.getMemberAddresses(member.id);
      if (allAddresses.length === 1) {
        await storage.setDefaultAddress(member.id, address.id);
      }
      
      res.status(201).json(address);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ error: "Failed to create address" });
    }
  });

  app.put("/api/members/me/addresses/:addressId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const address = await storage.getMemberAddress(req.params.addressId);
      if (!address || address.memberId !== member.id) {
        return res.status(404).json({ error: "Address not found" });
      }

      const updatedAddress = await storage.updateMemberAddress(req.params.addressId, req.body);
      res.json(updatedAddress);
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ error: "Failed to update address" });
    }
  });

  app.delete("/api/members/me/addresses/:addressId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const address = await storage.getMemberAddress(req.params.addressId);
      if (!address || address.memberId !== member.id) {
        return res.status(404).json({ error: "Address not found" });
      }

      await storage.deleteMemberAddress(req.params.addressId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ error: "Failed to delete address" });
    }
  });

  app.post("/api/members/me/addresses/:addressId/default", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const address = await storage.getMemberAddress(req.params.addressId);
      if (!address || address.memberId !== member.id) {
        return res.status(404).json({ error: "Address not found" });
      }

      await storage.setDefaultAddress(member.id, req.params.addressId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting default address:", error);
      res.status(500).json({ error: "Failed to set default address" });
    }
  });

  // Member points endpoints
  app.get("/api/members/me/points", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const pointsHistory = await storage.getMemberPoints(member.id);
      res.json({
        balance: member.pointsBalance || 0,
        history: pointsHistory,
      });
    } catch (error) {
      console.error("Error fetching points:", error);
      res.status(500).json({ error: "Failed to fetch points" });
    }
  });

  // Member order history
  app.get("/api/members/me/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const orders = await storage.getMemberOrderHistory(member.id);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch order history" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/featured", async (req, res) => {
    try {
      const products = await storage.getFeaturedProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const result = insertContactMessageSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid contact message data", details: result.error.issues });
      }
      
      const message = await storage.createContactMessage(result.data);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to submit contact message" });
    }
  });

  app.post("/api/whatsapp/webhook", async (req, res) => {
    const { entry } = req.body;
    
    if (!entry) {
      return res.status(400).json({ error: "Invalid webhook payload" });
    }

    try {
      for (const e of entry) {
        const changes = e.changes || [];
        for (const change of changes) {
          if (change.field === "messages") {
            const messages = change.value?.messages || [];
            for (const message of messages) {
              if (!isTextMessage(message)) {
                console.log("Skipping non-text WhatsApp message:", message.type);
                continue;
              }
              
              console.log("Received WhatsApp text message:", message);
              
              const reply = await processWhatsAppMessage(message);
              if (reply && isWhatsAppConfigured()) {
                await sendWhatsAppMessage(message.from, reply);
                console.log("Sent auto-reply to:", message.from);
              }
            }
          }
        }
      }
      
      res.status(200).json({ status: "received" });
    } catch (error) {
      console.error("WhatsApp webhook error:", error);
      res.status(500).json({ error: "Webhook processing failed" });
    }
  });

  app.get("/api/whatsapp/webhook", async (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "loveyoung_verify_token";

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp webhook verified");
      res.status(200).send(challenge);
    } else {
      res.status(403).json({ error: "Verification failed" });
    }
  });

  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.get("/api/orders/track", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const order = await storage.findOrder(query);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to track order" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const result = insertOrderSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid order data", details: result.error.issues });
      }
      
      // Generate order number: LY + YYYYMMDD + 3-digit sequence
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
      const existingOrders = await storage.getOrders();
      const todayOrders = existingOrders.filter(o => o.orderNumber?.startsWith(`LY${dateStr}`));
      const sequence = String(todayOrders.length + 1).padStart(3, '0');
      const orderNumber = `LY${dateStr}${sequence}`;
      
      const orderData = {
        ...result.data,
        orderNumber,
      };
      
      const order = await storage.createOrder(orderData);
      res.status(201).json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.patch("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.updateOrder(req.params.id, req.body);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.get("/api/sync/status", async (req, res) => {
    res.json({
      erpnext: {
        configured: isErpnextConfigured(),
        message: isErpnextConfigured() 
          ? "ERPNext is configured and ready" 
          : "ERPNext credentials not configured (ERPNEXT_URL, ERPNEXT_API_KEY, ERPNEXT_API_SECRET)",
      },
      whatsapp: {
        configured: isWhatsAppConfigured(),
        message: isWhatsAppConfigured()
          ? "WhatsApp Bot is configured and ready for auto-replies"
          : "WhatsApp credentials not configured (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID)",
      },
    });
  });

  app.post("/api/sync/products", async (req, res) => {
    try {
      if (!isErpnextConfigured()) {
        return res.status(400).json({ 
          error: "ERPNext not configured",
          message: "Please configure ERPNEXT_URL, ERPNEXT_API_KEY, and ERPNEXT_API_SECRET",
        });
      }

      const result = await syncProductsToDatabase();
      res.json({
        success: true,
        message: `Product sync completed: ${result.created} created, ${result.updated} updated`,
        ...result,
      });
    } catch (error) {
      console.error("Product sync error:", error);
      res.status(500).json({ 
        error: "Failed to sync products",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.post("/api/sync/orders", async (req, res) => {
    try {
      if (!isErpnextConfigured()) {
        return res.status(400).json({ 
          error: "ERPNext not configured",
          message: "Please configure ERPNEXT_URL, ERPNEXT_API_KEY, and ERPNEXT_API_SECRET",
        });
      }

      const result = await syncOrdersFromErpnext();
      res.json({
        success: true,
        message: `Order sync completed: ${result.created} created, ${result.updated} updated`,
        ...result,
      });
    } catch (error) {
      console.error("Order sync error:", error);
      res.status(500).json({ 
        error: "Failed to sync orders",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // ============ Partner (经营人) API Routes ============

  // Get partner profile
  app.get("/api/partner/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const partner = await storage.getPartnerByMemberId(member.id);
      if (!partner) {
        return res.status(404).json({ error: "Partner profile not found" });
      }
      res.json(partner);
    } catch (error) {
      console.error("Error fetching partner:", error);
      res.status(500).json({ error: "Failed to fetch partner profile" });
    }
  });

  // Join partner program - with Zod validation
  const joinPartnerSchema = z.object({
    tier: z.enum(["phase1", "phase2", "phase3"]),
    referralCode: z.string().optional(),
  });

  app.post("/api/partner/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(400).json({ error: "Please create a member profile first" });
      }

      const existingPartner = await storage.getPartnerByMemberId(member.id);
      if (existingPartner) {
        return res.status(400).json({ error: "Already a partner" });
      }

      // Validate request body with Zod
      const parseResult = joinPartnerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: "Invalid request data", details: parseResult.error.issues });
      }

      const { tier, referralCode } = parseResult.data;

      // Find referrer if referral code provided
      let referrerId = null;
      if (referralCode) {
        const referrer = await storage.getPartnerByReferralCode(referralCode);
        if (referrer) {
          referrerId = referrer.id;
        }
      }

      // Calculate LY points based on tier
      const lyPointsMap: Record<string, number> = {
        phase1: 2000,
        phase2: 2600,
        phase3: 3000,
      };

      const priceMap: Record<string, number> = {
        phase1: 100000, // RM 1000 in cents
        phase2: 130000,
        phase3: 150000,
      };

      // Generate unique 8-character referral code with collision check
      const generateReferralCode = async (): Promise<string> => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          code = "";
          for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          // Check if code already exists
          const existing = await storage.getPartnerByReferralCode(code);
          if (!existing) {
            return code;
          }
          attempts++;
        }
        // Fallback: use timestamp-based code
        return `LY${Date.now().toString(36).toUpperCase().slice(-6)}`;
      };

      const newReferralCode = await generateReferralCode();

      // Create partner with initial lyBalance = 0 (will add via ledger)
      const partner = await storage.createPartner({
        memberId: member.id,
        referralCode: newReferralCode,
        tier,
        status: "pending",
        referrerId,
        lyBalance: 0,
        cashWalletBalance: 0,
        rwaTokens: 0,
        totalSales: 0,
        totalCashback: 0,
        paymentAmount: priceMap[tier],
      });

      // Create LY points ledger entry for initial bonus (auditable)
      await storage.addLyPoints({
        partnerId: partner.id,
        points: lyPointsMap[tier],
        type: "bonus",
        description: `初始LY积分 - ${tier === "phase1" ? "第一阶段" : tier === "phase2" ? "第二阶段" : "第三阶段"}套餐`,
        referenceId: partner.id,
        referenceType: "partner_join",
      });

      // Update member role to partner (pending payment confirmation)
      await storage.updateMember(member.id, { role: "partner" });

      // Fetch updated partner with LY balance
      const updatedPartner = await storage.getPartnerByMemberId(member.id);
      res.status(201).json(updatedPartner || partner);
    } catch (error) {
      console.error("Error joining partner program:", error);
      res.status(500).json({ error: "Failed to join partner program" });
    }
  });

  // Get LY points ledger
  app.get("/api/partner/ly-ledger", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const partner = await storage.getPartnerByMemberId(member.id);
      if (!partner) {
        return res.status(404).json({ error: "Partner profile not found" });
      }

      const ledger = await storage.getLyPointsLedger(partner.id);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching LY ledger:", error);
      res.status(500).json({ error: "Failed to fetch LY ledger" });
    }
  });

  // Get cash wallet ledger
  app.get("/api/partner/cash-ledger", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const partner = await storage.getPartnerByMemberId(member.id);
      if (!partner) {
        return res.status(404).json({ error: "Partner profile not found" });
      }

      const ledger = await storage.getCashWalletLedger(partner.id);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching cash ledger:", error);
      res.status(500).json({ error: "Failed to fetch cash ledger" });
    }
  });

  // Get referral stats
  app.get("/api/partner/referral-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const partner = await storage.getPartnerByMemberId(member.id);
      if (!partner) {
        return res.status(404).json({ error: "Partner profile not found" });
      }

      const stats = await storage.getPartnerReferralStats(partner.id);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching referral stats:", error);
      res.status(500).json({ error: "Failed to fetch referral stats" });
    }
  });

  // Get current bonus pool cycle
  app.get("/api/partner/current-cycle", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member) {
        return res.status(404).json({ error: "Member profile not found" });
      }

      const partner = await storage.getPartnerByMemberId(member.id);
      if (!partner) {
        return res.status(404).json({ error: "Partner profile not found" });
      }

      const cycle = await storage.getCurrentBonusPoolCycle();
      if (!cycle) {
        return res.json(null);
      }

      const myTokens = partner.rwaTokens || 0;
      const endDate = new Date(cycle.endDate);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

      res.json({
        cycleNumber: cycle.cycleNumber,
        daysRemaining,
        poolAmount: cycle.poolAmount,
        myTokens,
        totalTokens: cycle.totalTokens,
      });
    } catch (error) {
      console.error("Error fetching current cycle:", error);
      res.status(500).json({ error: "Failed to fetch current cycle" });
    }
  });

  // ============ Admin API Routes ============

  // Get all partners (admin only)
  app.get("/api/admin/partners", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member || member.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const partners = await storage.getAllPartners();
      res.json(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      res.status(500).json({ error: "Failed to fetch partners" });
    }
  });

  // Activate partner (admin only)
  app.post("/api/admin/partners/:id/activate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member || member.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const partner = await storage.activatePartner(req.params.id);
      res.json(partner);
    } catch (error) {
      console.error("Error activating partner:", error);
      res.status(500).json({ error: "Failed to activate partner" });
    }
  });

  // Get dashboard stats (admin only)
  app.get("/api/admin/dashboard-stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const member = await storage.getMemberByUserId(userId);
      if (!member || member.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const stats = await storage.getAdminDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  return httpServer;
}
