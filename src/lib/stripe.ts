import { loadStripe, Stripe } from "@stripe/stripe-js";

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise: Promise<Stripe | null> | null = null;

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

// Product prices in MYR (cents)
export const PRODUCT_PRICES = {
  oneBox: {
    amount: 15800, // RM 158.00
    currency: "myr",
    name: "Love Young Bird's Nest - 1 Box (6 Jars)",
  },
  twoBox: {
    amount: 29800, // RM 298.00
    currency: "myr",
    name: "Love Young Bird's Nest - 2 Boxes (12 Jars)",
  },
} as const;

export type PackageKey = keyof typeof PRODUCT_PRICES;
