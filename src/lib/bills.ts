import { supabase } from "./supabase";
import type { Bill } from "@shared/types";

// Generate bill number
export function generateBillNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV${year}${month}${day}${random}`;
}

// Create a bill for an order
export async function createOrderBill(
  orderId: string,
  orderNumber: string,
  amount: number,
  customerId?: string | null
): Promise<{ bill: Bill | null; error: Error | null }> {
  const billNumber = generateBillNumber();

  const { data, error } = await supabase
    .from("bills")
    .insert({
      bill_number: billNumber,
      type: "income",
      category: "sales",
      amount: amount,
      description: `Order ${orderNumber}`,
      status: "paid",
      paid_date: new Date().toISOString(),
      reference_type: "order",
      reference_id: orderId,
      created_by: customerId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating bill:", error);
    return { bill: null, error: new Error(error.message) };
  }

  return { bill: mapBillFromDb(data), error: null };
}

// Get bill by order ID
export async function getBillByOrderId(
  orderId: string
): Promise<{ bill: Bill | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("reference_type", "order")
    .eq("reference_id", orderId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching bill:", error);
    return { bill: null, error: new Error(error.message) };
  }

  return { bill: data ? mapBillFromDb(data) : null, error: null };
}

// Get all bills for a member
export async function getMemberBills(
  memberId: string
): Promise<{ bills: Bill[]; error: Error | null }> {
  // First get all order IDs for this member
  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .eq("member_id", memberId);

  if (ordersError) {
    console.error("Error fetching member orders:", ordersError);
    return { bills: [], error: new Error(ordersError.message) };
  }

  if (!orders || orders.length === 0) {
    return { bills: [], error: null };
  }

  const orderIds = orders.map((o) => o.id);

  const { data, error } = await supabase
    .from("bills")
    .select("*")
    .eq("reference_type", "order")
    .in("reference_id", orderIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bills:", error);
    return { bills: [], error: new Error(error.message) };
  }

  return { bills: (data || []).map(mapBillFromDb), error: null };
}

// Map database row to Bill type
function mapBillFromDb(row: Record<string, unknown>): Bill {
  return {
    id: row.id as string,
    billNumber: row.bill_number as string,
    type: row.type as string,
    category: row.category as string,
    amount: row.amount as number,
    description: row.description as string | null,
    dueDate: row.due_date as string | null,
    paidDate: row.paid_date as string | null,
    status: row.status as string,
    referenceType: row.reference_type as string | null,
    referenceId: row.reference_id as string | null,
    createdBy: row.created_by as string | null,
    createdAt: row.created_at as string | null,
    updatedAt: row.updated_at as string | null,
  };
}
