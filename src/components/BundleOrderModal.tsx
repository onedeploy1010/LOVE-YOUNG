import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Check, CheckCircle, Loader2, User, MapPin, CreditCard, Gift, Package, Flame, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { supabase, supabaseAnonKey } from "@/lib/supabase";
import { createOrder, updateOrderStatus } from "@/lib/orders";
import { createOrGetMember, saveMemberAddress } from "@/lib/members";
import { createOrderBill } from "@/lib/bills";
import { enrichOrderItems, deductInventoryForOrder } from "@/lib/inventory";
import { addSalesToBonusPool, processNetworkOrderRwa } from "@/lib/partner";
import { saveCheckoutContext } from "@/lib/checkoutContext";
import type { Member, MemberAddress } from "@shared/types";

interface BundleItem {
  flavor: string;
  quantity: number;
}

interface Bundle {
  id: string;
  name: string;
  name_en: string | null;
  name_ms: string | null;
  description: string | null;
  target_audience: string | null;
  target_audience_en: string | null;
  target_audience_ms: string | null;
  keywords: string | null;
  keywords_en: string | null;
  keywords_ms: string | null;
  price: number;
  original_price: number | null;
  image: string | null;
  items: BundleItem[];
  is_hot: boolean;
  is_new: boolean;
}

interface BundleOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bundle: Bundle;
}

interface DeliveryInfo {
  customerName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  deliveryDate: string;
}

const malaysiaStates = [
  "johor", "kedah", "kelantan", "melaka", "negeriSembilan", "pahang",
  "penang", "perak", "perlis", "sabah", "sarawak", "selangor",
  "terengganu", "kualaLumpur", "labuan", "putrajaya"
];

// Flavor name translations
const flavorNames: Record<string, { zh: string; en: string }> = {
  original: { zh: "原味燕窝", en: "Original" },
  redDate: { zh: "红枣燕窝", en: "Red Date" },
  snowPear: { zh: "雪梨燕窝", en: "Snow Pear" },
  peachGum: { zh: "桃胶燕窝", en: "Peach Gum" },
  coconut: { zh: "椰子燕窝", en: "Coconut" },
  mango: { zh: "芒果燕窝", en: "Mango" },
  cocoaOat: { zh: "可可燕麦燕窝", en: "Cocoa Oat" },
  matchaOat: { zh: "抹茶燕麦燕窝", en: "Matcha Oat" },
  purpleRiceOat: { zh: "紫米燕麦燕窝", en: "Purple Rice Oat" },
  peachGumLongan: { zh: "桃胶桂圆燕窝", en: "Peach Gum Longan" },
  dateGoji: { zh: "枣杞燕窝", en: "Date Goji" },
  papaya: { zh: "木瓜燕窝", en: "Papaya" },
};

export function BundleOrderModal({ open, onOpenChange, bundle }: BundleOrderModalProps) {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"summary" | "delivery" | "confirm" | "payment" | "success">("summary");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [useGuestCheckout, setUseGuestCheckout] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    customerName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    deliveryDate: "",
  });

  // Get localized bundle name
  const getBundleName = () => {
    if (language === "en") return bundle.name_en || bundle.name;
    if (language === "ms") return bundle.name_ms || bundle.name_en || bundle.name;
    return bundle.name;
  };

  // Get flavor display name
  const getFlavorName = (key: string) => {
    const flavor = flavorNames[key];
    if (!flavor) return key;
    return language === "zh" ? flavor.zh : flavor.en;
  };

  // Price in RM (database stores in cents)
  const priceRM = bundle.price / 100;
  const originalPriceRM = bundle.original_price ? bundle.original_price / 100 : null;
  const totalItems = bundle.items.reduce((sum, item) => sum + item.quantity, 0);

  // Fetch member profile and addresses if authenticated
  const { data: member } = useQuery<Member | null>({
    queryKey: ["member-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error) return null;
      return data as Member;
    },
    enabled: isAuthenticated && !!user?.id,
  });

  const { data: savedAddresses = [] } = useQuery<MemberAddress[]>({
    queryKey: ["member-addresses", member?.id],
    queryFn: async () => {
      if (!member?.id) return [];
      const { data, error } = await supabase
        .from("member_addresses")
        .select("*")
        .eq("member_id", member.id);
      if (error) return [];
      return (data || []).map((row: Record<string, unknown>): MemberAddress => ({
        id: row.id as string,
        memberId: row.member_id as string,
        label: (row.label as string) || null,
        recipientName: (row.recipient_name as string) || "",
        phone: (row.phone as string) || "",
        addressLine1: (row.address_line_1 as string) || "",
        addressLine2: (row.address_line_2 as string) || null,
        city: (row.city as string) || "",
        state: (row.state as string) || "",
        postcode: (row.postcode as string) || "",
        isDefault: (row.is_default as boolean) || false,
        createdAt: (row.created_at as string) || null,
      }));
    },
    enabled: isAuthenticated && !!member,
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      console.info("[checkout] Creating bundle order...", { bundleId: bundle.id, price: bundle.price });

      // Enrich items with SKU for inventory tracking
      const orderItems = enrichOrderItems(bundle.items.map(item => ({
        flavor: item.flavor,
        flavorName: getFlavorName(item.flavor),
        quantity: item.quantity,
        category: "bird-nest",
      })));

      const itemsJson = JSON.stringify(orderItems);

      const { order, error } = await createOrder({
        userId: user?.id || null,
        memberId: member?.id || null,
        customerName: deliveryInfo.customerName,
        customerPhone: deliveryInfo.phone,
        customerEmail: user?.email || null,
        status: "pending_payment",
        totalAmount: bundle.price, // Already in cents
        items: itemsJson,
        packageType: bundle.id,
        shippingAddress: deliveryInfo.address,
        shippingCity: deliveryInfo.city,
        shippingState: deliveryInfo.state,
        shippingPostcode: deliveryInfo.postcode,
        preferredDeliveryDate: deliveryInfo.deliveryDate || null,
        trackingNumber: null,
        notes: `Bundle: ${bundle.name}`,
        source: "website",
        erpnextId: null,
        metaOrderId: null,
        pointsEarned: null,
        pointsRedeemed: null,
      });

      if (error || !order) {
        console.error("[checkout] createOrder failed:", error);
        throw error || new Error("Failed to create order");
      }

      console.info("[checkout] Bundle order created:", { id: order.id, orderNumber: order.orderNumber });
      return order;
    },
    onError: (error) => {
      console.error("[checkout] Order mutation error:", error);
      setPaymentError(error instanceof Error ? error.message : "Failed to create order");
    },
    onSuccess: async (order) => {
      setOrderNumber(order.orderNumber);
      setOrderId(order.id);
      setStep("payment");

      // Save address immediately for authenticated users who entered a new address
      if (isAuthenticated && user?.id && !selectedAddressId) {
        try {
          const { member: resolvedMember } = await createOrGetMember(user.id, {
            name: deliveryInfo.customerName,
            phone: deliveryInfo.phone,
            email: user.email,
          });
          if (resolvedMember) {
            const { address: savedAddr } = await saveMemberAddress(resolvedMember.id, {
              recipientName: deliveryInfo.customerName,
              phone: deliveryInfo.phone,
              addressLine1: deliveryInfo.address,
              city: deliveryInfo.city,
              state: deliveryInfo.state,
              postcode: deliveryInfo.postcode,
              isDefault: savedAddresses.length === 0,
            });
            if (savedAddr) setSelectedAddressId(savedAddr.id);

            // Update order with member ID
            await supabase.from("orders").update({ member_id: resolvedMember.id }).eq("id", order.id);

            queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
            queryClient.invalidateQueries({ queryKey: ["member-profile"] });
          }
        } catch (err) {
          console.error("Error saving address at order creation:", err);
        }
      }
    },
  });

  const handleDeliveryInfoChange = (field: keyof DeliveryInfo, value: string) => {
    setDeliveryInfo(prev => ({ ...prev, [field]: value }));
  };

  const isDeliveryValid = () => {
    return (
      deliveryInfo.customerName.trim() !== "" &&
      deliveryInfo.phone.trim() !== "" &&
      deliveryInfo.address.trim() !== "" &&
      deliveryInfo.city.trim() !== "" &&
      deliveryInfo.state !== "" &&
      deliveryInfo.postcode.trim() !== ""
    );
  };

  const handleSubmitOrder = async () => {
    createOrderMutation.mutate();
  };

  // Handle Stripe Payment
  const handleStripePayment = async () => {
    console.info("[checkout] handleStripePayment called", { orderId, orderNumber });
    if (!orderId || !orderNumber) {
      console.error("[checkout] Missing orderId or orderNumber, aborting payment");
      setPaymentError("Order not found. Please try again.");
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      console.info("[checkout] Calling create-checkout edge function...");
      const functionUrl = `https://vpzmhglfwomgrashheol.supabase.co/functions/v1/create-checkout`;
      const res = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "apikey": supabaseAnonKey,
        },
        body: JSON.stringify({
          orderId,
          orderNumber,
          amount: bundle.price,
          customerEmail: user?.email || null,
          customerName: deliveryInfo.customerName,
          productName: getBundleName(),
          successUrl: `${window.location.origin}/checkout/success?order=${orderNumber}`,
          cancelUrl: `${window.location.origin}/?payment=cancelled`,
        }),
      });

      const data = await res.json();
      console.info("[checkout] Edge function response:", { status: res.status, data });

      if (!res.ok) {
        throw new Error(data?.error || `Edge function returned ${res.status}`);
      }

      if (!data?.url) {
        console.error("Stripe edge function returned no URL:", data);
        throw new Error(data?.error || "No checkout URL returned from payment service");
      }

      saveCheckoutContext({
        orderId,
        orderNumber,
        deliveryInfo,
        selections: bundle.items.map(item => ({ key: item.flavor, quantity: item.quantity })),
        currentPrice: priceRM,
        saveNewAddress,
        selectedAddressId,
        referrerId: null,
      });

      window.location.href = data.url;
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetOrder = () => {
    setStep("summary");
    setDeliveryInfo({
      customerName: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      postcode: "",
      deliveryDate: "",
    });
    setOrderNumber("");
    setOrderId("");
    setUseGuestCheckout(false);
    setSelectedAddressId(null);
    setSaveNewAddress(false);
    setPaymentError(null);
  };

  const handleSelectSavedAddress = (address: MemberAddress) => {
    setSelectedAddressId(address.id);
    setDeliveryInfo({
      customerName: address.recipientName,
      phone: address.phone,
      address: address.addressLine1 + (address.addressLine2 ? `, ${address.addressLine2}` : ""),
      city: address.city,
      state: address.state,
      postcode: address.postcode,
      deliveryDate: deliveryInfo.deliveryDate,
    });
  };

  const handleLogin = () => {
    window.location.href = "/auth/login";
  };

  const showAddressSelection = isAuthenticated && member && savedAddresses.length > 0 && !useGuestCheckout;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetOrder();
    }
    onOpenChange(newOpen);
  };

  const getStepTitle = () => {
    switch (step) {
      case "summary": return language === "zh" ? "套装详情" : "Package Details";
      case "delivery": return t("order.deliveryInfo");
      case "confirm": return t("order.confirmOrder");
      case "payment": return t("order.payment") || "Payment";
      case "success": return t("order.orderConfirmed");
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "summary": return getBundleName();
      case "delivery": return t("order.deliveryInfoDesc");
      case "confirm": return t("order.confirmOrderDesc");
      case "payment": return t("order.paymentDesc") || "Complete your payment to confirm the order";
      case "success": return t("order.orderConfirmedDesc");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-hidden" data-testid="modal-bundle-order">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold" data-testid="text-bundle-modal-title">
            {getStepTitle()}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {getStepDescription()}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pb-8">
          {step === "summary" && (
            <div className="space-y-4">
              {/* Bundle info card */}
              <Card className="overflow-hidden">
                {bundle.image && (
                  <div className="h-40 overflow-hidden bg-muted">
                    <img
                      src={bundle.image}
                      alt={getBundleName()}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{getBundleName()}</h3>
                    <div className="flex gap-1.5">
                      {bundle.is_hot && (
                        <Badge className="bg-red-500 text-white text-[10px]">
                          <Flame className="w-3 h-3 mr-0.5" />
                          HOT
                        </Badge>
                      )}
                      {bundle.is_new && (
                        <Badge className="bg-green-500 text-white text-[10px]">
                          <Sparkles className="w-3 h-3 mr-0.5" />
                          NEW
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {language === "zh" ? `${totalItems}瓶装` : `${totalItems} bottles`}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">RM {priceRM.toFixed(0)}</span>
                    {originalPriceRM && originalPriceRM > priceRM && (
                      <span className="text-sm text-muted-foreground line-through">RM {originalPriceRM.toFixed(0)}</span>
                    )}
                  </div>
                </div>
              </Card>

              {/* Bundle items */}
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  {language === "zh" ? "套装内容" : "Package Contents"}
                </h4>
                <div className="space-y-2">
                  {bundle.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <span className="text-sm">{getFlavorName(item.flavor)}</span>
                      <Badge variant="secondary" className="text-xs">
                        x{item.quantity}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-border flex justify-between">
                  <span className="font-medium">{language === "zh" ? "总计" : "Total"}</span>
                  <span className="font-medium">{totalItems} {language === "zh" ? "瓶" : "bottles"}</span>
                </div>
              </Card>
            </div>
          )}

          {step === "delivery" && (
            <div className="space-y-4">
              {/* Login prompt for guests */}
              {!isAuthenticated && !useGuestCheckout && (
                <Card className="p-5">
                  <div className="text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">{t("order.loginForSavedAddress")}</h4>
                      <p className="text-sm text-muted-foreground">{t("order.loginBenefit")}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button onClick={handleLogin} data-testid="button-login-checkout">
                        <User className="w-4 h-4 mr-2" />
                        {t("order.loginOrRegister")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setUseGuestCheckout(true)}
                        data-testid="button-guest-checkout"
                      >
                        {t("order.continueAsGuest")}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Saved addresses for logged-in members */}
              {showAddressSelection && (
                <div className="space-y-3">
                  <Label>{t("order.selectSavedAddress")}</Label>
                  {savedAddresses.map((addr) => (
                    <Card
                      key={addr.id}
                      className={`p-4 cursor-pointer transition-all hover-elevate ${
                        selectedAddressId === addr.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleSelectSavedAddress(addr)}
                      data-testid={`card-saved-address-${addr.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-foreground">{addr.recipientName}</p>
                            <p className="text-muted-foreground">{addr.phone}</p>
                            <p className="text-muted-foreground">
                              {addr.addressLine1}
                              {addr.addressLine2 && `, ${addr.addressLine2}`}
                            </p>
                            <p className="text-muted-foreground">
                              {addr.postcode} {addr.city}, {t(`states.${addr.state}`)}
                            </p>
                          </div>
                        </div>
                        {selectedAddressId === addr.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedAddressId(null);
                      setUseGuestCheckout(true);
                    }}
                    data-testid="button-new-address"
                  >
                    {t("order.useNewAddress")}
                  </Button>
                </div>
              )}

              {/* Manual address form */}
              {(useGuestCheckout || (isAuthenticated && !showAddressSelection)) && (
                <>
                  {isAuthenticated && savedAddresses.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUseGuestCheckout(false)}
                      className="mb-2"
                      data-testid="button-back-to-saved"
                    >
                      {t("order.backToSavedAddresses")}
                    </Button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="customerName" className="text-sm">{t("order.customerName")} *</Label>
                      <Input
                        id="customerName"
                        value={deliveryInfo.customerName}
                        onChange={(e) => handleDeliveryInfoChange("customerName", e.target.value)}
                        placeholder={t("order.customerName")}
                        data-testid="input-customer-name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm">{t("order.phone")} *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={deliveryInfo.phone}
                        onChange={(e) => handleDeliveryInfoChange("phone", e.target.value)}
                        placeholder="012-3456789"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-sm">{t("order.address")} *</Label>
                    <Input
                      id="address"
                      value={deliveryInfo.address}
                      onChange={(e) => handleDeliveryInfoChange("address", e.target.value)}
                      placeholder={t("order.address")}
                      data-testid="input-address"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="postcode" className="text-sm">{t("order.postcode")} *</Label>
                      <Input
                        id="postcode"
                        value={deliveryInfo.postcode}
                        onChange={(e) => handleDeliveryInfoChange("postcode", e.target.value)}
                        placeholder="12345"
                        data-testid="input-postcode"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm">{t("order.city")} *</Label>
                      <Input
                        id="city"
                        value={deliveryInfo.city}
                        onChange={(e) => handleDeliveryInfoChange("city", e.target.value)}
                        placeholder={t("order.city")}
                        data-testid="input-city"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="state" className="text-sm">{t("order.state")} *</Label>
                      <Select
                        value={deliveryInfo.state}
                        onValueChange={(value) => handleDeliveryInfoChange("state", value)}
                      >
                        <SelectTrigger data-testid="select-state">
                          <SelectValue placeholder={t("order.selectState")} />
                        </SelectTrigger>
                        <SelectContent>
                          {malaysiaStates.map((state) => (
                            <SelectItem key={state} value={state} data-testid={`option-state-${state}`}>
                              {t(`states.${state}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="deliveryDate" className="text-sm text-muted-foreground">{t("order.deliveryDate")}</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={deliveryInfo.deliveryDate}
                      onChange={(e) => handleDeliveryInfoChange("deliveryDate", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="input-delivery-date"
                    />
                  </div>

                  {isAuthenticated && !selectedAddressId && (
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox
                        id="saveAddress"
                        checked={saveNewAddress}
                        onCheckedChange={(checked) => setSaveNewAddress(checked === true)}
                        data-testid="checkbox-save-address"
                      />
                      <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                        {t("order.saveAddressToProfile")}
                      </Label>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <Card className="p-5">
                <h4 className="font-semibold text-foreground mb-3">
                  {t("order.orderSummary")}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "zh" ? "套装" : "Package"}:</span>
                    <span className="font-medium">{getBundleName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "zh" ? "数量" : "Quantity"}:</span>
                    <span className="font-medium">{totalItems} {language === "zh" ? "瓶" : "bottles"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.priceLabel")}:</span>
                    <div className="text-right">
                      {originalPriceRM && originalPriceRM > priceRM && (
                        <span className="text-muted-foreground line-through mr-2">RM {originalPriceRM.toFixed(0)}</span>
                      )}
                      <span className="font-medium text-primary">RM {priceRM.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t border-border mt-4 pt-4">
                  <p className="text-sm text-muted-foreground mb-2">{language === "zh" ? "套装内容" : "Contents"}:</p>
                  <div className="flex flex-wrap gap-2">
                    {bundle.items.map((item, i) => (
                      <Badge key={i} variant="secondary" data-testid={`badge-item-${item.flavor}`}>
                        {getFlavorName(item.flavor)} x{item.quantity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="font-semibold text-foreground mb-3">
                  {t("order.deliveryInfo")}
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.customerName")}:</span>
                    <span className="font-medium">{deliveryInfo.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.phone")}:</span>
                    <span className="font-medium">{deliveryInfo.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.address")}:</span>
                    <span className="font-medium text-right max-w-[60%]">{deliveryInfo.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.city")}:</span>
                    <span className="font-medium">{deliveryInfo.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.state")}:</span>
                    <span className="font-medium">{t(`states.${deliveryInfo.state}`)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.postcode")}:</span>
                    <span className="font-medium">{deliveryInfo.postcode}</span>
                  </div>
                  {deliveryInfo.deliveryDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t("order.deliveryDate")}:</span>
                      <span className="font-medium">{deliveryInfo.deliveryDate}</span>
                    </div>
                  )}
                </div>
              </Card>

              {paymentError && (
                <Card className="p-4 bg-destructive/10 border-destructive">
                  <p className="text-sm text-destructive">{paymentError}</p>
                </Card>
              )}

              <Button
                className="w-full gap-3"
                size="lg"
                onClick={handleSubmitOrder}
                disabled={createOrderMutation.isPending}
                data-testid="button-submit-order"
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("order.orderSubmitting")}
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    {t("order.proceedToPayment") || "Proceed to Payment"}
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "payment" && (
            <div className="space-y-6">
              <Card className="p-5">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{t("order.yourOrderNumber")}</p>
                    <p className="text-xl font-bold text-primary">{orderNumber}</p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-1">{t("order.totalAmount")}</p>
                    <p className="text-3xl font-bold">RM {priceRM.toFixed(0)}</p>
                  </div>
                </div>
              </Card>

              {paymentError && (
                <Card className="p-4 bg-destructive/10 border-destructive">
                  <p className="text-sm text-destructive">{paymentError}</p>
                </Card>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full gap-3 bg-[#635BFF] hover:bg-[#5851DB]"
                  size="lg"
                  onClick={handleStripePayment}
                  disabled={isProcessingPayment}
                  data-testid="button-pay-stripe"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {t("order.processing")}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {t("order.payOnline")}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {t("order.paymentMethods")}
                </p>
                <p className="text-xs text-center">
                  <a
                    href={`https://wa.me/60178228658?text=${encodeURIComponent(`Need help with order #${orderNumber}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground underline hover:text-foreground"
                  >
                    {t("order.needHelp")}
                  </a>
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-6 text-center py-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  {t("order.orderSuccess")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t("order.orderConfirmedDesc")}
                </p>
              </div>

              <Card className="p-5">
                <p className="text-sm text-muted-foreground mb-2">
                  {t("order.yourOrderNumber")}:
                </p>
                <p className="text-2xl font-bold text-primary" data-testid="text-order-number">
                  {orderNumber}
                </p>
              </Card>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => {
                    resetOrder();
                    onOpenChange(false);
                  }}
                  data-testid="button-continue-ordering"
                >
                  {t("order.continueOrdering")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {step !== "success" && step !== "payment" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <div className="flex gap-3">
              {step !== "summary" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (step === "confirm") setStep("delivery");
                    else if (step === "delivery") setStep("summary");
                  }}
                  data-testid="button-back"
                >
                  {t("order.back")}
                </Button>
              )}
              {step === "summary" && (
                <Button
                  className="flex-1"
                  onClick={() => setStep("delivery")}
                  data-testid="button-next-summary"
                >
                  {t("order.next")}
                </Button>
              )}
              {step === "delivery" && (
                <Button
                  className="flex-1"
                  disabled={!isDeliveryValid()}
                  onClick={() => setStep("confirm")}
                  data-testid="button-next-delivery"
                >
                  {t("order.next")}
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
