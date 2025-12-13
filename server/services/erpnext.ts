import { storage } from "../storage";
import type { Product, InsertProduct, Order, InsertOrder } from "@shared/schema";

interface ErpnextConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
}

interface ErpnextItem {
  name: string;
  item_name: string;
  description: string;
  standard_rate: number;
  stock_uom: string;
  image: string | null;
  item_group: string;
  custom_featured?: boolean;
  custom_name_cn?: string;
}

interface ErpnextSalesOrder {
  name: string;
  customer_name: string;
  contact_phone: string;
  contact_email?: string;
  status: string;
  grand_total: number;
  items: Array<{
    item_name: string;
    qty: number;
    rate: number;
  }>;
  shipping_address_name?: string;
  po_no?: string;
}

function getConfig(): ErpnextConfig | null {
  const url = process.env.ERPNEXT_URL;
  const apiKey = process.env.ERPNEXT_API_KEY;
  const apiSecret = process.env.ERPNEXT_API_SECRET;

  if (!url || !apiKey || !apiSecret) {
    return null;
  }

  return { url, apiKey, apiSecret };
}

function getHeaders(config: ErpnextConfig): HeadersInit {
  return {
    "Authorization": `token ${config.apiKey}:${config.apiSecret}`,
    "Content-Type": "application/json",
  };
}

function mapCategoryFromErpnext(itemGroup: string): string {
  const categoryMap: Record<string, string> = {
    "Bird's Nest": "bird-nest",
    "Fish Maw": "fish-maw",
    "Dessert": "dessert",
    "Gift Set": "gift-set",
  };
  return categoryMap[itemGroup] || "other";
}

function mapStatusFromErpnext(status: string): string {
  const statusMap: Record<string, string> = {
    "Draft": "pending",
    "To Deliver and Bill": "confirmed",
    "To Bill": "processing",
    "To Deliver": "shipped",
    "Completed": "delivered",
    "Cancelled": "cancelled",
  };
  return statusMap[status] || "pending";
}

function mapStatusToErpnext(status: string): string {
  const statusMap: Record<string, string> = {
    "pending": "Draft",
    "confirmed": "To Deliver and Bill",
    "processing": "To Bill",
    "shipped": "To Deliver",
    "delivered": "Completed",
    "cancelled": "Cancelled",
  };
  return statusMap[status] || "Draft";
}

export async function fetchProductsFromErpnext(): Promise<ErpnextItem[]> {
  const config = getConfig();
  if (!config) {
    throw new Error("ERPNext credentials not configured");
  }

  const response = await fetch(
    `${config.url}/api/resource/Item?filters=[["is_sales_item","=",1]]&fields=["name","item_name","description","standard_rate","stock_uom","image","item_group","custom_featured","custom_name_cn"]`,
    {
      method: "GET",
      headers: getHeaders(config),
    }
  );

  if (!response.ok) {
    throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

export async function syncProductsToDatabase(): Promise<{ created: number; updated: number }> {
  const erpnextItems = await fetchProductsFromErpnext();
  const existingProducts = await storage.getProducts();
  
  let created = 0;
  let updated = 0;

  for (const item of erpnextItems) {
    const existingProduct = existingProducts.find(
      p => p.erpnextItemCode === item.name || p.nameEn === item.item_name || p.name === item.custom_name_cn
    );

    const productData: InsertProduct = {
      name: item.custom_name_cn || item.item_name,
      nameEn: item.item_name,
      description: item.description || "",
      price: Math.round(item.standard_rate),
      priceUnit: item.stock_uom || "份",
      image: item.image || "/attached_assets/generated_images/dried_bird's_nest_product.png",
      category: mapCategoryFromErpnext(item.item_group),
      featured: item.custom_featured || false,
      erpnextItemCode: item.name,
    };

    if (existingProduct) {
      await storage.updateProduct(existingProduct.id, productData);
      updated++;
    } else {
      await storage.createProduct(productData);
      created++;
    }
  }

  return { created, updated };
}

export async function createOrderInErpnext(order: Order): Promise<string | null> {
  const config = getConfig();
  if (!config) {
    console.warn("ERPNext credentials not configured, skipping order sync");
    return null;
  }

  let items: Array<{ name: string; quantity: number; price: number; erpnextItemCode?: string }>;
  try {
    items = JSON.parse(order.items);
  } catch {
    items = [];
  }

  const products = await storage.getProducts();
  
  const mappedItems: Array<{ item_code: string; qty: number; rate: number }> = [];
  const missingItemCodes: string[] = [];
  
  for (const item of items) {
    const product = products.find(
      p => p.name === item.name || p.nameEn === item.name || p.erpnextItemCode === item.erpnextItemCode
    );
    
    const itemCode = item.erpnextItemCode || product?.erpnextItemCode;
    
    if (!itemCode) {
      missingItemCodes.push(item.name);
    } else {
      mappedItems.push({
        item_code: itemCode,
        qty: item.quantity,
        rate: item.price,
      });
    }
  }

  if (missingItemCodes.length > 0) {
    throw new Error(
      `Cannot sync order to ERPNext: Missing ERPNext item codes for: ${missingItemCodes.join(", ")}. ` +
      `Please sync products from ERPNext first using POST /api/sync/products.`
    );
  }

  const salesOrderData = {
    doctype: "Sales Order",
    customer: order.customerName,
    contact_phone: order.customerPhone,
    contact_email: order.customerEmail || "",
    po_no: order.orderNumber,
    delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    items: mappedItems,
  };

  const response = await fetch(`${config.url}/api/resource/Sales Order`, {
    method: "POST",
    headers: getHeaders(config),
    body: JSON.stringify(salesOrderData),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create ERPNext order: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.data?.name || null;
}

export async function fetchOrdersFromErpnext(): Promise<ErpnextSalesOrder[]> {
  const config = getConfig();
  if (!config) {
    throw new Error("ERPNext credentials not configured");
  }

  const response = await fetch(
    `${config.url}/api/resource/Sales Order?fields=["name","customer_name","contact_phone","contact_email","status","grand_total","items","shipping_address_name","po_no"]&limit_page_length=100`,
    {
      method: "GET",
      headers: getHeaders(config),
    }
  );

  if (!response.ok) {
    throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

export async function syncOrdersFromErpnext(): Promise<{ created: number; updated: number }> {
  const erpnextOrders = await fetchOrdersFromErpnext();
  const existingOrders = await storage.getOrders();
  
  let created = 0;
  let updated = 0;

  for (const erpOrder of erpnextOrders) {
    const existingOrder = existingOrders.find(
      o => o.erpnextId === erpOrder.name || o.orderNumber === erpOrder.po_no
    );

    const orderItems = (erpOrder.items || []).map(item => ({
      name: item.item_name,
      quantity: item.qty,
      price: item.rate,
    }));

    if (existingOrder) {
      await storage.updateOrder(existingOrder.id, {
        status: mapStatusFromErpnext(erpOrder.status),
        erpnextId: erpOrder.name,
      });
      updated++;
    } else {
      const orderNumber = erpOrder.po_no || `ERN${Date.now()}`;
      await storage.createOrder({
        orderNumber,
        customerName: erpOrder.customer_name,
        customerPhone: erpOrder.contact_phone || "",
        customerEmail: erpOrder.contact_email,
        status: mapStatusFromErpnext(erpOrder.status),
        totalAmount: Math.round(erpOrder.grand_total),
        items: JSON.stringify(orderItems),
        shippingAddress: erpOrder.shipping_address_name,
        source: "erpnext",
        erpnextId: erpOrder.name,
      });
      created++;
    }
  }

  return { created, updated };
}

export async function updateOrderStatusInErpnext(order: Order): Promise<boolean> {
  const config = getConfig();
  if (!config || !order.erpnextId) {
    return false;
  }

  const response = await fetch(`${config.url}/api/resource/Sales Order/${order.erpnextId}`, {
    method: "PUT",
    headers: getHeaders(config),
    body: JSON.stringify({
      status: mapStatusToErpnext(order.status),
    }),
  });

  return response.ok;
}

export function isErpnextConfigured(): boolean {
  return getConfig() !== null;
}
