import { supabase } from "./supabase";
import type { Order, InsertOrder } from "@shared/types";

// Generate order number
export function generateOrderNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LY${year}${month}${day}${random}`;
}

// Create a new order
export async function createOrder(
  orderData: Omit<InsertOrder, "orderNumber">
): Promise<{ order: Order | null; error: Error | null }> {
  const orderNumber = generateOrderNumber();
  const orderId = crypto.randomUUID();

  const now = new Date().toISOString();
  const insertPayload = {
    id: orderId,
    order_number: orderNumber,
    user_id: orderData.userId || null,
    member_id: orderData.memberId,
    customer_name: orderData.customerName,
    customer_phone: orderData.customerPhone,
    customer_email: orderData.customerEmail,
    status: "pending_payment",
    total_amount: orderData.totalAmount,
    items: orderData.items,
    package_type: orderData.packageType,
    shipping_address: orderData.shippingAddress,
    shipping_city: orderData.shippingCity,
    shipping_state: orderData.shippingState,
    shipping_postcode: orderData.shippingPostcode,
    preferred_delivery_date: orderData.preferredDeliveryDate,
    tracking_number: orderData.trackingNumber,
    notes: orderData.notes,
    source: orderData.source,
    erpnext_id: orderData.erpnextId,
    meta_order_id: orderData.metaOrderId,
    points_earned: orderData.pointsEarned,
    points_redeemed: orderData.pointsRedeemed,
    created_at: now,
    updated_at: now,
  };

  console.info("[orders] Inserting order...", { orderId, orderNumber, userId: insertPayload.user_id });
  const t0 = Date.now();

  // Use INSERT without .select() to avoid RLS SELECT issues causing hangs.
  // We already have the ID and order number generated client-side.
  const { error } = await supabase
    .from("orders")
    .insert(insertPayload);

  const elapsed = Date.now() - t0;
  console.info("[orders] Insert completed in", elapsed, "ms", { errorCode: error?.code, errorMsg: error?.message });

  if (error) {
    console.error("[orders] Error creating order:", error);
    return { order: null, error: new Error(error.message) };
  }

  // Return the order using client-generated values (no need to read back)
  return {
    order: {
      id: orderId,
      orderNumber,
      userId: orderData.userId || null,
      memberId: orderData.memberId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerEmail: orderData.customerEmail || null,
      status: "pending_payment",
      totalAmount: orderData.totalAmount,
      items: orderData.items,
      packageType: orderData.packageType || null,
      shippingAddress: orderData.shippingAddress || null,
      shippingCity: orderData.shippingCity || null,
      shippingState: orderData.shippingState || null,
      shippingPostcode: orderData.shippingPostcode || null,
      preferredDeliveryDate: orderData.preferredDeliveryDate || null,
      trackingNumber: null,
      notes: orderData.notes || null,
      source: orderData.source || null,
      erpnextId: null,
      metaOrderId: null,
      pointsEarned: null,
      pointsRedeemed: null,
      createdAt: now,
      updatedAt: now,
    },
    error: null,
  };
}

// Update order status
export async function updateOrderStatus(
  orderId: string,
  status: string,
  additionalData?: Partial<{
    stripePaymentIntentId: string;
    stripeSessionId: string;
  }>
): Promise<{ success: boolean; error: Error | null }> {
  const updateData: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (additionalData?.stripePaymentIntentId) {
    updateData.stripe_payment_intent_id = additionalData.stripePaymentIntentId;
  }
  if (additionalData?.stripeSessionId) {
    updateData.stripe_session_id = additionalData.stripeSessionId;
  }

  const { error } = await supabase
    .from("orders")
    .update(updateData)
    .eq("id", orderId);

  if (error) {
    console.error("Error updating order:", error);
    return { success: false, error: new Error(error.message) };
  }

  return { success: true, error: null };
}

// Get order by ID
export async function getOrderById(
  orderId: string
): Promise<{ order: Order | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return { order: null, error: new Error(error.message) };
  }

  return { order: mapOrderFromDb(data), error: null };
}

// Get order by order number
export async function getOrderByNumber(
  orderNumber: string
): Promise<{ order: Order | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .single();

  if (error) {
    console.error("Error fetching order:", error);
    return { order: null, error: new Error(error.message) };
  }

  return { order: mapOrderFromDb(data), error: null };
}

// Get all orders (for admin)
export async function getAllOrders(): Promise<{
  orders: Order[];
  error: Error | null;
}> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return { orders: [], error: new Error(error.message) };
  }

  return { orders: (data || []).map(mapOrderFromDb), error: null };
}

// Get orders by status
export async function getOrdersByStatus(
  status: string
): Promise<{ orders: Order[]; error: Error | null }> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
    return { orders: [], error: new Error(error.message) };
  }

  return { orders: (data || []).map(mapOrderFromDb), error: null };
}

// Map database row to Order type (snake_case to camelCase)
function mapOrderFromDb(row: Record<string, unknown>): Order {
  return {
    id: row.id as string,
    orderNumber: row.order_number as string,
    userId: row.user_id as string | null,
    memberId: row.member_id as string | null,
    customerName: row.customer_name as string,
    customerPhone: row.customer_phone as string,
    customerEmail: row.customer_email as string | null,
    status: row.status as string,
    totalAmount: row.total_amount as number,
    items: row.items as string,
    packageType: row.package_type as string | null,
    shippingAddress: row.shipping_address as string | null,
    shippingCity: row.shipping_city as string | null,
    shippingState: row.shipping_state as string | null,
    shippingPostcode: row.shipping_postcode as string | null,
    preferredDeliveryDate: row.preferred_delivery_date as string | null,
    trackingNumber: row.tracking_number as string | null,
    notes: row.notes as string | null,
    source: row.source as string | null,
    erpnextId: row.erpnext_id as string | null,
    metaOrderId: row.meta_order_id as string | null,
    pointsEarned: row.points_earned as number | null,
    pointsRedeemed: row.points_redeemed as number | null,
    createdAt: row.created_at as string | null,
    updatedAt: row.updated_at as string | null,
  };
}
