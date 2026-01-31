const STORAGE_KEY = "ly_checkout_context";
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CheckoutContext {
  orderId: string;
  orderNumber: string;
  deliveryInfo: {
    customerName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    postcode: string;
    deliveryDate: string;
  };
  selections?: Array<{ key: string; quantity: number }>;
  currentPrice: number; // RM, not cents
  saveNewAddress: boolean;
  selectedAddressId: string | null;
  referrerId: string | null;
  timestamp: number;
}

export function saveCheckoutContext(ctx: Omit<CheckoutContext, "timestamp">) {
  try {
    const data: CheckoutContext = { ...ctx, timestamp: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage may be unavailable in some browsers
  }
}

export function getCheckoutContext(): CheckoutContext | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const ctx: CheckoutContext = JSON.parse(raw);
    if (Date.now() - ctx.timestamp > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return ctx;
  } catch {
    return null;
  }
}

export function clearCheckoutContext() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}
