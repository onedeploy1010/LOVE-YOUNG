import { supabase } from "./supabase";

export type NotificationType = "order" | "earning" | "promo" | "system";

export interface Notification {
  id: string;
  userId: string | null;
  memberId: string | null;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

// Create a notification
export async function createNotification(
  notification: Omit<Notification, "id" | "createdAt" | "read">
): Promise<{ notification: Notification | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: notification.userId,
      member_id: notification.memberId,
      type: notification.type,
      title: notification.title,
      content: notification.content,
      read: false,
      data: notification.data,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    return { notification: null, error: new Error(error.message) };
  }

  return { notification: mapNotificationFromDb(data), error: null };
}

// Create order status notification
export async function notifyOrderStatusChange(
  orderId: string,
  orderNumber: string,
  memberId: string | null,
  newStatus: string
): Promise<{ success: boolean; error: Error | null }> {
  const statusMessages: Record<string, { title: string; content: string }> = {
    pending: {
      title: "Order Confirmed",
      content: `Your order #${orderNumber} has been confirmed and is being processed.`,
    },
    confirmed: {
      title: "Order Confirmed",
      content: `Your order #${orderNumber} has been confirmed.`,
    },
    processing: {
      title: "Order Processing",
      content: `Your order #${orderNumber} is being prepared.`,
    },
    shipped: {
      title: "Order Shipped",
      content: `Your order #${orderNumber} has been shipped and is on its way!`,
    },
    delivered: {
      title: "Order Delivered",
      content: `Your order #${orderNumber} has been delivered. Enjoy!`,
    },
    cancelled: {
      title: "Order Cancelled",
      content: `Your order #${orderNumber} has been cancelled.`,
    },
  };

  const message = statusMessages[newStatus];
  if (!message || !memberId) {
    return { success: true, error: null }; // No notification needed
  }

  const { error } = await createNotification({
    userId: null,
    memberId: memberId,
    type: "order",
    title: message.title,
    content: message.content,
    data: {
      orderId,
      orderNumber,
      status: newStatus,
    },
  });

  return { success: !error, error };
}

// Get notifications for a member
export async function getMemberNotifications(
  memberId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<{ notifications: Notification[]; error: Error | null }> {
  let query = supabase
    .from("notifications")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false });

  if (options?.unreadOnly) {
    query = query.eq("read", false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], error: new Error(error.message) };
  }

  return { notifications: (data || []).map(mapNotificationFromDb), error: null };
}

// Get unread notification count
export async function getUnreadNotificationCount(
  memberId: string
): Promise<{ count: number; error: Error | null }> {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("member_id", memberId)
    .eq("read", false);

  if (error) {
    console.error("Error counting notifications:", error);
    return { count: 0, error: new Error(error.message) };
  }

  return { count: count || 0, error: null };
}

// Mark notification as read
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);

  if (error) {
    console.error("Error marking notification as read:", error);
    return { success: false, error: new Error(error.message) };
  }

  return { success: true, error: null };
}

// Mark all notifications as read for a member
export async function markAllNotificationsAsRead(
  memberId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("member_id", memberId)
    .eq("read", false);

  if (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false, error: new Error(error.message) };
  }

  return { success: true, error: null };
}

// Delete a notification
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error: Error | null }> {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Error deleting notification:", error);
    return { success: false, error: new Error(error.message) };
  }

  return { success: true, error: null };
}

// Map database row to Notification type
function mapNotificationFromDb(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    userId: row.user_id as string | null,
    memberId: row.member_id as string | null,
    type: row.type as NotificationType,
    title: row.title as string,
    content: row.content as string,
    read: row.read as boolean,
    data: row.data as Record<string, unknown> | null,
    createdAt: row.created_at as string,
  };
}
