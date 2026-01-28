import { supabase } from "./supabase";
import type { Inventory } from "@shared/types";

// Flavor to SKU mapping (12 flavors for 2026发财礼盒)
export const FLAVOR_SKU_MAP: Record<string, string> = {
  // 12 Bird's Nest flavors
  original: "BN-ORIG-75",       // 原味燕窝
  redDate: "BN-RDAT-75",        // 红枣燕窝
  snowPear: "BN-SPEA-75",       // 雪梨燕窝
  peachGum: "BN-PGUM-75",       // 桃胶燕窝
  coconut: "BN-COCO-75",        // 椰子燕窝
  mango: "BN-MANG-75",          // 芒果燕窝
  cocoaOat: "BN-COAT-75",       // 可可燕麦燕窝
  matchaOat: "BN-MOAT-75",      // 抹茶燕麦燕窝
  purpleRiceOat: "BN-POAT-75",  // 紫米燕麦燕窝
  peachGumLongan: "BN-PGLN-75", // 桃胶桂圆燕窝
  dateGoji: "BN-DGOJ-75",       // 枣杞燕窝
  papaya: "BN-PAPY-75",         // 木瓜燕窝
};

// Gift box product SKU
export const GIFT_BOX_SKU = "GIFTBOX-2026-FORTUNE";

// 2026发财礼盒 Pricing
export const GIFT_BOX_PRICING = {
  originalPrice: 48800,  // RM 488 in cents
  memberPrice: 36800,    // RM 368 in cents
  bottlesPerBox: 6,
};

// Order item with product reference
export interface OrderItemWithProduct {
  flavor: string;
  flavorName: string;
  quantity: number;
  category: string;
  sku: string;
  productId?: string;
  inventoryId?: string;
}

// Get inventory by SKU
export async function getInventoryBySku(
  sku: string
): Promise<{ inventory: Inventory | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("sku", sku)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching inventory:", error);
    return { inventory: null, error: new Error(error.message) };
  }

  return { inventory: data ? mapInventoryFromDb(data) : null, error: null };
}

// Check stock availability for order items
export async function checkStockAvailability(
  items: Array<{ flavor: string; quantity: number }>
): Promise<{
  available: boolean;
  unavailableItems: Array<{ flavor: string; requested: number; available: number }>;
  error: Error | null;
}> {
  const unavailableItems: Array<{ flavor: string; requested: number; available: number }> = [];

  for (const item of items) {
    const sku = FLAVOR_SKU_MAP[item.flavor];
    if (!sku) continue;

    const { inventory } = await getInventoryBySku(sku);
    const availableQty = inventory?.quantity || 0;

    if (availableQty < item.quantity) {
      unavailableItems.push({
        flavor: item.flavor,
        requested: item.quantity,
        available: availableQty,
      });
    }
  }

  return {
    available: unavailableItems.length === 0,
    unavailableItems,
    error: null,
  };
}

// Deduct inventory for order (call after successful payment)
export async function deductInventoryForOrder(
  orderId: string,
  items: Array<{ flavor: string; quantity: number }>
): Promise<{ success: boolean; error: Error | null }> {
  const ledgerEntries: Array<{
    inventory_id: string;
    order_id: string;
    quantity_change: number;
    type: string;
    notes: string;
    created_at: string;
  }> = [];

  for (const item of items) {
    const sku = FLAVOR_SKU_MAP[item.flavor];
    if (!sku) continue;

    // Get current inventory
    const { data: inventory, error: fetchError } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("sku", sku)
      .single();

    if (fetchError || !inventory) {
      console.warn(`Inventory not found for SKU: ${sku}`);
      continue;
    }

    // Update inventory quantity
    const newQuantity = Math.max(0, (inventory.quantity || 0) - item.quantity);
    const { error: updateError } = await supabase
      .from("inventory")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventory.id);

    if (updateError) {
      console.error("Error updating inventory:", updateError);
      return { success: false, error: new Error(updateError.message) };
    }

    // Prepare ledger entry
    ledgerEntries.push({
      inventory_id: inventory.id,
      order_id: orderId,
      quantity_change: -item.quantity,
      type: "sale",
      notes: `Order deduction for ${item.flavor}`,
      created_at: new Date().toISOString(),
    });
  }

  // Insert inventory ledger entries (if table exists)
  if (ledgerEntries.length > 0) {
    const { error: ledgerError } = await supabase
      .from("inventory_ledger")
      .insert(ledgerEntries);

    if (ledgerError) {
      // Ledger table might not exist, just log warning
      console.warn("Could not insert inventory ledger entries:", ledgerError.message);
    }
  }

  return { success: true, error: null };
}

// Restore inventory for cancelled order
export async function restoreInventoryForOrder(
  orderId: string,
  items: Array<{ flavor: string; quantity: number }>
): Promise<{ success: boolean; error: Error | null }> {
  for (const item of items) {
    const sku = FLAVOR_SKU_MAP[item.flavor];
    if (!sku) continue;

    const { data: inventory, error: fetchError } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("sku", sku)
      .single();

    if (fetchError || !inventory) {
      continue;
    }

    // Restore inventory quantity
    const newQuantity = (inventory.quantity || 0) + item.quantity;
    const { error: updateError } = await supabase
      .from("inventory")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inventory.id);

    if (updateError) {
      console.error("Error restoring inventory:", updateError);
      return { success: false, error: new Error(updateError.message) };
    }
  }

  return { success: true, error: null };
}

// Enrich order items with SKU and product references
export function enrichOrderItems(
  items: Array<{ flavor: string; flavorName: string; quantity: number; category: string }>
): OrderItemWithProduct[] {
  return items.map((item) => ({
    ...item,
    sku: FLAVOR_SKU_MAP[item.flavor] || "",
  }));
}

// Map database row to Inventory type
function mapInventoryFromDb(row: Record<string, unknown>): Inventory {
  return {
    id: row.id as string,
    productId: row.product_id as string | null,
    sku: row.sku as string,
    name: row.name as string,
    category: row.category as string,
    quantity: row.quantity as number | null,
    unit: row.unit as string,
    minStock: row.min_stock as number | null,
    costPrice: row.cost_price as number | null,
    location: row.location as string | null,
    batchNumber: row.batch_number as string | null,
    expiryDate: row.expiry_date as string | null,
    createdAt: row.created_at as string | null,
    updatedAt: row.updated_at as string | null,
  };
}
