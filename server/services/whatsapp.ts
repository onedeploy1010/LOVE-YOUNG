import { storage } from "../storage";

interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
}

export function isTextMessage(message: WhatsAppMessage): boolean {
  return message.type === "text" && !!message.text?.body;
}

interface AutoReplyContext {
  customerPhone: string;
  messageText: string;
}

const PRODUCT_KEYWORDS = {
  birdNest: ["燕窝", "bird nest", "bird's nest", "燕盏", "即食燕窝"],
  fishMaw: ["花胶", "fish maw", "鱼胶", "鲜炖花胶"],
  price: ["价格", "多少钱", "price", "how much", "几钱"],
  order: ["订单", "order", "下单", "购买", "buy", "怎么买"],
  tracking: ["物流", "快递", "tracking", "delivery", "寄到", "到货", "查询"],
  contact: ["联系", "contact", "客服", "咨询", "人工"],
};

function detectIntent(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const intents: string[] = [];

  for (const [intent, keywords] of Object.entries(PRODUCT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword.toLowerCase())) {
        intents.push(intent);
        break;
      }
    }
  }

  if (intents.length === 0) {
    intents.push("greeting");
  }

  return intents;
}

async function generateReply(context: AutoReplyContext): Promise<string> {
  const intents = detectIntent(context.messageText);
  const products = await storage.getProducts();
  
  const birdNestProducts = products.filter(p => p.category === "bird-nest");
  const fishMawProducts = products.filter(p => p.category === "fish-maw");

  const existingOrders = await storage.getOrderByPhone(context.customerPhone);
  const sortedOrders = existingOrders.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
  const hasOrders = sortedOrders.length > 0;
  const latestOrder = sortedOrders[0];

  let reply = "";

  if (intents.includes("tracking") && hasOrders && latestOrder) {
    const statusMap: Record<string, string> = {
      pending: "待处理",
      confirmed: "已确认",
      processing: "处理中",
      shipped: "已发货",
      delivered: "已送达",
      cancelled: "已取消",
    };
    
    reply = `亲爱的顾客，您的订单查询结果：\n\n`;
    reply += `订单编号：${latestOrder.orderNumber}\n`;
    reply += `状态：${statusMap[latestOrder.status] || latestOrder.status}\n`;
    
    if (latestOrder.trackingNumber) {
      reply += `快递单号：${latestOrder.trackingNumber}\n`;
    }
    
    reply += `\n如需更多帮助，请回复"客服"联系人工服务。`;
    return reply;
  }

  if (intents.includes("birdNest")) {
    reply = `感谢您对我们燕窝产品的关注！\n\n`;
    reply += `我们的燕窝产品：\n`;
    for (const product of birdNestProducts) {
      reply += `- ${product.name}：RM${product.price}/${product.priceUnit}\n`;
    }
  }

  if (intents.includes("fishMaw")) {
    if (reply) reply += "\n";
    else reply = `感谢您对我们花胶产品的关注！\n\n`;
    
    reply += `我们的花胶产品：\n`;
    for (const product of fishMawProducts) {
      reply += `- ${product.name}：RM${product.price}/${product.priceUnit}\n`;
    }
  }

  if (intents.includes("price") && !intents.includes("birdNest") && !intents.includes("fishMaw")) {
    reply = `感谢您的询问！我们的产品价格如下：\n\n`;
    for (const product of products) {
      reply += `- ${product.name}：RM${product.price}/${product.priceUnit}\n`;
    }
  }

  if (intents.includes("order")) {
    if (reply) reply += "\n";
    reply += `下单方式：\n`;
    reply += `1. 通过我们的Meta Shop店铺直接购买\n`;
    reply += `2. 回复"客服"联系人工服务下单\n`;
    reply += `\n我们支持全马配送，满RM200免运费！`;
  }

  if (intents.includes("tracking") && !hasOrders) {
    reply = `抱歉，我们没有找到与您手机号相关的订单记录。\n\n`;
    reply += `请提供您的订单编号，或回复"客服"联系人工服务查询。`;
  }

  if (intents.includes("contact")) {
    reply = `感谢您的联系！\n\n`;
    reply += `我们的客服会尽快与您联系。\n`;
    reply += `营业时间：周一至周六 9:00-18:00\n\n`;
    reply += `您也可以访问我们的网站了解更多产品信息。`;
  }

  if (intents.includes("greeting") && !reply) {
    reply = `您好！欢迎来到LOVEYOUNG！\n\n`;
    reply += `我们专注于优质燕窝和花胶产品，为您提供天然滋补养生食品。\n\n`;
    reply += `您可以：\n`;
    reply += `- 回复"燕窝"查看燕窝产品\n`;
    reply += `- 回复"花胶"查看花胶产品\n`;
    reply += `- 回复"价格"查看所有产品价格\n`;
    reply += `- 回复"订单"了解下单方式\n`;
    reply += `- 回复"物流"查询订单状态\n`;
    reply += `- 回复"客服"联系人工服务\n`;
  }

  return reply || generateDefaultReply();
}

function generateDefaultReply(): string {
  return `感谢您的消息！\n\n我们的客服团队会尽快回复您。\n\n如需即时协助，请回复以下关键词：\n- "燕窝" - 查看燕窝产品\n- "花胶" - 查看花胶产品\n- "订单" - 了解下单方式\n- "客服" - 联系人工服务`;
}

export async function processWhatsAppMessage(message: WhatsAppMessage): Promise<string | null> {
  if (message.type !== "text" || !message.text?.body) {
    return null;
  }

  const context: AutoReplyContext = {
    customerPhone: message.from,
    messageText: message.text.body,
  };

  const reply = await generateReply(context);
  return reply;
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    console.warn("WhatsApp credentials not configured, skipping message send");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: to,
          type: "text",
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("WhatsApp send error:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

export function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}
