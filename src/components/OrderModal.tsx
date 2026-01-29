import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Plus, Minus, Check, CheckCircle, Loader2, User, MapPin, CreditCard, Gift } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { createOrder, updateOrderStatus } from "@/lib/orders";
import { createOrGetMember, saveMemberAddress } from "@/lib/members";
import { createOrderBill } from "@/lib/bills";
import { enrichOrderItems, deductInventoryForOrder } from "@/lib/inventory";
import { addSalesToBonusPool, processNetworkOrderRwa } from "@/lib/partner";
import { getStripe } from "@/lib/stripe";
import type { Member, MemberAddress } from "@shared/types";

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappLink: string;
  metaShopLink: string;
}

interface FlavorSelection {
  key: string;
  nameCn: string;
  nameEn: string;
  quantity: number;
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

// 12种口味 for 2026发财礼盒
const allFlavors = [
  { key: "original", nameCn: "原味燕窝", nameEn: "Original" },
  { key: "redDate", nameCn: "红枣燕窝", nameEn: "Red Date" },
  { key: "snowPear", nameCn: "雪梨燕窝", nameEn: "Snow Pear" },
  { key: "peachGum", nameCn: "桃胶燕窝", nameEn: "Peach Gum" },
  { key: "coconut", nameCn: "椰子燕窝", nameEn: "Coconut" },
  { key: "mango", nameCn: "芒果燕窝", nameEn: "Mango" },
  { key: "cocoaOat", nameCn: "可可燕麦燕窝", nameEn: "Cocoa Oat" },
  { key: "matchaOat", nameCn: "抹茶燕麦燕窝", nameEn: "Matcha Oat" },
  { key: "purpleRiceOat", nameCn: "紫米燕麦燕窝", nameEn: "Purple Rice Oat" },
  { key: "peachGumLongan", nameCn: "桃胶桂圆燕窝", nameEn: "Peach Gum Longan" },
  { key: "dateGoji", nameCn: "枣杞燕窝", nameEn: "Date Goji" },
  { key: "papaya", nameCn: "木瓜燕窝", nameEn: "Papaya" },
];

// 2026发财礼盒 - Single product with member discount
const giftBoxProduct = {
  key: "fortuneBox2026" as const,
  nameCn: "2026发财礼盒",
  nameEn: "2026 Fortune Gift Box",
  jars: 6, // 6 bottles per box, choose from 12 flavors
  originalPrice: 488,  // RM 488
  memberPrice: 368,    // RM 368 (member discount)
};

const malaysiaStates = [
  "johor", "kedah", "kelantan", "melaka", "negeriSembilan", "pahang",
  "penang", "perak", "perlis", "sabah", "sarawak", "selangor",
  "terengganu", "kualaLumpur", "labuan", "putrajaya"
];

export function OrderModal({ open, onOpenChange, whatsappLink, metaShopLink }: OrderModalProps) {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"flavors" | "delivery" | "confirm" | "payment" | "success">("flavors");
  const [selections, setSelections] = useState<FlavorSelection[]>([]);
  const isMember = isAuthenticated; // Members get discount price
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [useGuestCheckout, setUseGuestCheckout] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [referralCode, setReferralCode] = useState<string>("");
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    customerName: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postcode: "",
    deliveryDate: "",
  });

  // Fetch member profile and addresses if authenticated
  const { data: member } = useQuery<Member | null>({
    queryKey: ["member-profile"],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("members")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) return null;
      return data as Member;
    },
    enabled: isAuthenticated,
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
      return data as MemberAddress[];
    },
    enabled: isAuthenticated && !!member,
  });

  const currentPrice = isMember ? giftBoxProduct.memberPrice : giftBoxProduct.originalPrice;
  const totalSelected = selections.reduce((sum, s) => sum + s.quantity, 0);
  const maxJars = giftBoxProduct.jars;
  const remainingJars = maxJars - totalSelected;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // Enrich items with SKU for inventory tracking
      const orderItems = enrichOrderItems(selections.map(s => ({
        flavor: s.key,
        flavorName: language === "zh" ? s.nameCn : s.nameEn,
        quantity: s.quantity,
        category: "bird-nest",
      })));

      const itemsJson = JSON.stringify(orderItems);

      const { order, error } = await createOrder({
        memberId: member?.id || null,
        customerName: deliveryInfo.customerName,
        customerPhone: deliveryInfo.phone,
        customerEmail: user?.email || null,
        status: "pending_payment",
        totalAmount: currentPrice * 100, // Store in cents
        items: itemsJson,
        packageType: giftBoxProduct.key,
        shippingAddress: deliveryInfo.address,
        shippingCity: deliveryInfo.city,
        shippingState: deliveryInfo.state,
        shippingPostcode: deliveryInfo.postcode,
        preferredDeliveryDate: deliveryInfo.deliveryDate || null,
        trackingNumber: null,
        notes: isMember ? "Member discount applied" : null,
        source: "website",
        erpnextId: null,
        metaOrderId: null,
        pointsEarned: null,
        pointsRedeemed: null,
      });

      if (error || !order) {
        throw error || new Error("Failed to create order");
      }

      return order;
    },
    onSuccess: (order) => {
      setOrderNumber(order.orderNumber);
      setOrderId(order.id);
      setStep("payment");
    },
  });

  const handleFlavorChange = (flavor: typeof allFlavors[0], delta: number) => {
    setSelections(prev => {
      const existing = prev.find(s => s.key === flavor.key);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) {
          return prev.filter(s => s.key !== flavor.key);
        }
        return prev.map(s => s.key === flavor.key ? { ...s, quantity: newQty } : s);
      } else if (delta > 0) {
        return [...prev, { key: flavor.key, nameCn: flavor.nameCn, nameEn: flavor.nameEn, quantity: 1 }];
      }
      return prev;
    });
  };

  const getFlavorQuantity = (key: string) => {
    return selections.find(s => s.key === key)?.quantity || 0;
  };

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

  // Handle Stripe Payment - Create checkout session and redirect
  const handleStripePayment = async () => {
    if (!orderId || !orderNumber) return;

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      // Call Supabase Edge Function to create Stripe Checkout session
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            orderId,
            orderNumber,
            amount: currentPrice * 100, // Convert to cents (sen)
            customerEmail: user?.email || null,
            customerName: deliveryInfo.customerName,
            successUrl: `${window.location.origin}/order-tracking?order=${orderNumber}&status=success`,
            cancelUrl: `${window.location.origin}/?payment=cancelled`,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError(err instanceof Error ? err.message : "Payment failed. Please try again.");
      setIsProcessingPayment(false);
    }
  };

  // Validate referral code
  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferrerId(null);
      return;
    }

    const { data, error } = await supabase
      .from("members")
      .select("id")
      .eq("referral_code", code.toUpperCase())
      .single();

    if (data && !error) {
      setReferrerId(data.id);
    } else {
      setReferrerId(null);
    }
  };

  // Handle payment success - upgrade to member, save address
  const handlePaymentSuccess = async () => {
    // Get current user
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (currentUser) {
      // Create or get member record
      const { member: newMember, created } = await createOrGetMember(
        currentUser.id,
        {
          name: deliveryInfo.customerName,
          phone: deliveryInfo.phone,
          email: currentUser.email,
        }
      );

      // If member was created and has a referrer, update the referrer relationship
      if (newMember && created && referrerId) {
        await supabase
          .from("members")
          .update({ referrer_id: referrerId })
          .eq("id", newMember.id);
      }

      // Save address if checkbox is checked or if user is authenticated
      if (newMember && (saveNewAddress || !selectedAddressId)) {
        await saveMemberAddress(newMember.id, {
          recipientName: deliveryInfo.customerName,
          phone: deliveryInfo.phone,
          addressLine1: deliveryInfo.address,
          city: deliveryInfo.city,
          state: deliveryInfo.state,
          postcode: deliveryInfo.postcode,
          isDefault: true,
        });
      }

      // Update order with member ID if not already set
      if (newMember && orderId) {
        await supabase
          .from("orders")
          .update({ member_id: newMember.id })
          .eq("id", orderId);
      }

      // Invalidate queries to refresh member data
      queryClient.invalidateQueries({ queryKey: ["member-profile"] });
      queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
    }

    // Create bill for the order
    if (orderId && orderNumber) {
      await createOrderBill(
        orderId,
        orderNumber,
        currentPrice * 100, // Amount in cents
        member?.id || null
      );
    }

    // Deduct inventory for the order
    if (orderId && selections.length > 0) {
      const itemsForInventory = selections.map(s => ({
        flavor: s.key,
        quantity: s.quantity,
      }));
      await deductInventoryForOrder(orderId, itemsForInventory);
    }

    // Add sales to bonus pool (30% of order amount)
    if (orderId) {
      await addSalesToBonusPool(orderId, currentPrice * 100);
    }

    // Process network RWA rewards (if buyer is in a partner's network)
    if (orderId && member?.id) {
      await processNetworkOrderRwa(orderId, member.id);
    }
  };

  // Mark order as paid (demo only - in production use Stripe webhooks)
  const handleMarkAsPaid = async () => {
    if (!orderId) return;

    setIsProcessingPayment(true);
    try {
      // Update order status
      await updateOrderStatus(orderId, "pending");

      // Handle member upgrade and address saving
      await handlePaymentSuccess();

      setStep("success");
    } catch (err) {
      setPaymentError("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetOrder = () => {
    setStep("flavors");
    setSelections([]);
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
    setReferralCode("");
    setReferrerId(null);
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
      case "flavors": return language === "zh" ? "选择口味" : "Select Flavors";
      case "delivery": return t("order.deliveryInfo");
      case "confirm": return t("order.confirmOrder");
      case "payment": return t("order.payment") || "Payment";
      case "success": return t("order.orderConfirmed");
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "flavors": return (
        <span className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span>{language === "zh" ? `${giftBoxProduct.nameCn} - 选择6种口味（可重复）` : `${giftBoxProduct.nameEn} - Choose 6 flavors (can repeat)`}</span>
          <Badge variant="secondary" data-testid="badge-remaining-jars">
            {t("order.remaining")}: {remainingJars}/{maxJars}
          </Badge>
        </span>
      );
      case "delivery": return t("order.deliveryInfoDesc");
      case "confirm": return t("order.confirmOrderDesc");
      case "payment": return t("order.paymentDesc") || "Complete your payment to confirm the order";
      case "success": return t("order.orderConfirmedDesc");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-hidden" data-testid="modal-order">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold" data-testid="text-order-modal-title">
            {getStepTitle()}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {getStepDescription()}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pb-8">
          {step === "package" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <Card
                  key={pkg.key}
                  className={`p-5 cursor-pointer transition-all hover-elevate ${
                    selectedPackage === pkg.key ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedPackage(pkg.key)}
                  data-testid={`card-package-${pkg.key}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg text-foreground">
                          {t(`packages.${pkg.key}`)}
                        </h4>
                        {pkg.key === "twoBox" && (
                          <Badge variant="default" className="text-xs">
                            {t("packages.bestValue")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t(pkg.descKey)}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {t(pkg.priceKey)}
                      </p>
                    </div>
                    {selectedPackage === pkg.key && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {step === "flavors" && (
            <div className="space-y-4">
              {/* Price display */}
              <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {language === "zh" ? giftBoxProduct.nameCn : giftBoxProduct.nameEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "zh" ? "6瓶装，12种口味任选" : "6 bottles, choose from 12 flavors"}
                    </p>
                  </div>
                  <div className="text-right">
                    {isMember ? (
                      <>
                        <p className="text-sm text-muted-foreground line-through">RM {giftBoxProduct.originalPrice}</p>
                        <p className="text-xl font-bold text-primary">RM {giftBoxProduct.memberPrice}</p>
                        <Badge variant="default" className="text-xs">{language === "zh" ? "会员价" : "Member Price"}</Badge>
                      </>
                    ) : (
                      <>
                        <p className="text-xl font-bold text-foreground">RM {giftBoxProduct.originalPrice}</p>
                        <p className="text-xs text-muted-foreground">{language === "zh" ? "登录享会员价 RM368" : "Login for member price RM368"}</p>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* 12 Flavors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allFlavors.map((flavor) => {
                  const qty = getFlavorQuantity(flavor.key);
                  return (
                    <Card key={flavor.key} className="p-4" data-testid={`card-order-flavor-${flavor.key}`}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">
                            {language === "zh" ? flavor.nameCn : flavor.nameEn}
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleFlavorChange(flavor, -1)}
                            disabled={qty === 0}
                            data-testid={`button-minus-${flavor.key}`}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-semibold" data-testid={`text-qty-${flavor.key}`}>
                            {qty}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleFlavorChange(flavor, 1)}
                            disabled={remainingJars === 0}
                            data-testid={`button-plus-${flavor.key}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
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

                  {/* Referral Code Input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="referralCode" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      {t("order.referralCode") || "Referral Code (Optional)"}
                    </Label>
                    <Input
                      id="referralCode"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                        validateReferralCode(e.target.value);
                      }}
                      placeholder="ABC123"
                      maxLength={8}
                      data-testid="input-referral-code"
                    />
                    {referralCode && (
                      <p className={`text-xs ${referrerId ? "text-green-600" : "text-muted-foreground"}`}>
                        {referrerId
                          ? (t("order.referralCodeValid") || "Valid referral code")
                          : (t("order.referralCodeInvalid") || "Enter a valid referral code")}
                      </p>
                    )}
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
                    <span className="text-muted-foreground">{language === "zh" ? "产品" : "Product"}:</span>
                    <span className="font-medium">{language === "zh" ? giftBoxProduct.nameCn : giftBoxProduct.nameEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.priceLabel")}:</span>
                    <div className="text-right">
                      {isMember && (
                        <span className="text-muted-foreground line-through mr-2">RM {giftBoxProduct.originalPrice}</span>
                      )}
                      <span className="font-medium text-primary">RM {currentPrice}</span>
                    </div>
                  </div>
                  {isMember && (
                    <div className="flex justify-between text-green-600">
                      <span>{language === "zh" ? "会员优惠" : "Member Discount"}:</span>
                      <span>-RM {giftBoxProduct.originalPrice - giftBoxProduct.memberPrice}</span>
                    </div>
                  )}
                </div>
                <div className="border-t border-border mt-4 pt-4">
                  <p className="text-sm text-muted-foreground mb-2">{t("order.flavorSelection")}:</p>
                  <div className="flex flex-wrap gap-2">
                    {selections.map((s) => (
                      <Badge key={s.key} variant="secondary" data-testid={`badge-selection-${s.key}`}>
                        {language === "zh" ? s.nameCn : s.nameEn} x {s.quantity}
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
                    <p className="text-sm text-muted-foreground mb-1">Order Number</p>
                    <p className="text-xl font-bold text-primary">{orderNumber}</p>
                  </div>

                  <div className="border-t border-border pt-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-3xl font-bold">RM {currentPrice}</p>
                    {isMember && (
                      <p className="text-sm text-green-600">
                        {language === "zh" ? "会员优惠已应用" : "Member discount applied"}
                      </p>
                    )}
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
                  className="w-full gap-3"
                  size="lg"
                  onClick={handleStripePayment}
                  disabled={isProcessingPayment}
                  data-testid="button-pay-stripe"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {language === "zh" ? "跳转支付中..." : "Redirecting to payment..."}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {language === "zh" ? "前往支付" : "Proceed to Payment"}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {language === "zh"
                    ? "安全支付由 Stripe 提供。支持信用卡、FPX、GrabPay。"
                    : "Secure payment powered by Stripe. Supports Credit Card, FPX, GrabPay."}
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
              {step !== "flavors" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (step === "confirm") setStep("delivery");
                    else if (step === "delivery") setStep("flavors");
                  }}
                  data-testid="button-back"
                >
                  {t("order.back")}
                </Button>
              )}
              {step === "flavors" && (
                <Button
                  className="flex-1"
                  disabled={totalSelected !== maxJars}
                  onClick={() => setStep("delivery")}
                  data-testid="button-next-flavors"
                >
                  {t("order.next")}
                  {totalSelected !== maxJars && (
                    <span className="ml-2 text-xs opacity-75">
                      ({remainingJars} {language === "zh" ? "瓶待选" : "more needed"})
                    </span>
                  )}
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
