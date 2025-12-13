import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertOrderSchema } from "@shared/schema";
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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
      
      const order = await storage.createOrder(result.data);
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

  return httpServer;
}
