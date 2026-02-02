import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Check, CheckCircle, Loader2, User, MapPin, CreditCard, Gift } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { supabase, supabaseAnonKey } from "@/lib/supabase";
import { createOrder, updateOrderStatus } from "@/lib/orders";
import { createOrGetMember, saveMemberAddress } from "@/lib/members";
import { createOrderBill } from "@/lib/bills";
import { addSalesToBonusPool, processNetworkOrderRwa } from "@/lib/partner";
import { saveCheckoutContext } from "@/lib/checkoutContext";
import type { Member, MemberAddress } from "@shared/types";

interface ProductCheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: {
    id: string;
    name: string;
    price: number;
    originalPrice: number;
    image: string;
  } | null;
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

export function ProductCheckoutModal({ open, onOpenChange, product }: ProductCheckoutModalProps) {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"delivery" | "confirm" | "payment" | "success">("delivery");
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
      return data as MemberAddress[];
    },
    enabled: isAuthenticated && !!member,
  });

  const currentPrice = product?.price ?? 0;

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (!product) throw new Error("No product selected");
      console.info("[checkout] Creating order for product:", product.name, { userId: user?.id, price: currentPrice });

      const itemsJson = JSON.stringify([{
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: currentPrice,
      }]);

      const { order, error } = await createOrder({
        userId: user?.id || null,
        memberId: member?.id || null,
        customerName: deliveryInfo.customerName,
        customerPhone: deliveryInfo.phone,
        customerEmail: user?.email || null,
        status: "pending_payment",
        totalAmount: currentPrice * 100,
        items: itemsJson,
        packageType: product.id,
        shippingAddress: deliveryInfo.address,
        shippingCity: deliveryInfo.city,
        shippingState: deliveryInfo.state,
        shippingPostcode: deliveryInfo.postcode,
        preferredDeliveryDate: deliveryInfo.deliveryDate || null,
        trackingNumber: null,
        notes: null,
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
      console.info("[checkout] Order created:", { id: order.id, orderNumber: order.orderNumber });
      return order;
    },
    onError: (error) => {
      console.error("[checkout] Order mutation error:", error);
      setPaymentError(error instanceof Error ? error.message : "Failed to create order");
    },
    onSuccess: (order) => {
      setOrderNumber(order.orderNumber);
      setOrderId(order.id);
      setStep("payment");
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

  const handleSubmitOrder = () => {
    createOrderMutation.mutate();
  };

  const handleStripePayment = async () => {
    console.info("[checkout] handleStripePayment called", { orderId, orderNumber, product: product?.name });
    if (!orderId || !orderNumber || !product) {
      console.error("[checkout] Missing orderId, orderNumber, or product, aborting payment");
      setPaymentError("Order not found. Please try again.");
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
      console.info("[checkout] Invoking create-checkout edge function...");
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: { Authorization: `Bearer ${supabaseAnonKey}` },
        body: {
          orderId,
          orderNumber,
          amount: currentPrice * 100,
          customerEmail: user?.email || null,
          customerName: deliveryInfo.customerName,
          productName: product.name,
          productDescription: `Order #${orderNumber}`,
          productImage: product.image.startsWith("http")
            ? product.image
            : `${window.location.origin}${product.image}`,
          successUrl: `${window.location.origin}/checkout/success?order=${orderNumber}`,
          cancelUrl: `${window.location.origin}/products?payment=cancelled`,
        },
      });

      if (error) {
        console.error("Stripe edge function error:", error);
        throw new Error(error.message || "Failed to create checkout session");
      }

      if (!data?.url) {
        console.error("Stripe edge function returned no URL:", data);
        throw new Error(data?.error || "No checkout URL returned from payment service");
      }

      saveCheckoutContext({
        orderId,
        orderNumber,
        deliveryInfo,
        currentPrice,
        saveNewAddress,
        selectedAddressId,
        referrerId,
      });

      window.location.href = data.url;
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentError(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

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

  const handlePaymentSuccess = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    let resolvedMemberId: string | null = member?.id || null;

    if (currentUser) {
      const { member: newMember, created } = await createOrGetMember(
        currentUser.id,
        {
          name: deliveryInfo.customerName,
          phone: deliveryInfo.phone,
          email: currentUser.email,
        }
      );

      if (newMember) {
        resolvedMemberId = newMember.id;
      }

      if (newMember && created && referrerId) {
        await supabase
          .from("members")
          .update({ referrer_id: referrerId })
          .eq("id", newMember.id);
      }

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

      if (newMember && orderId) {
        await supabase
          .from("orders")
          .update({ member_id: newMember.id })
          .eq("id", orderId);
      }

      queryClient.invalidateQueries({ queryKey: ["member-profile"] });
      queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
    }

    if (orderId && orderNumber) {
      await createOrderBill(
        orderId,
        orderNumber,
        currentPrice * 100,
        resolvedMemberId,
      );
    }

    // Add sales to bonus pool
    if (orderId) {
      await addSalesToBonusPool(orderId, currentPrice * 100);
    }

    // Process network RWA rewards
    if (orderId && resolvedMemberId) {
      await processNetworkOrderRwa(orderId, resolvedMemberId);
    }
  };

  const handleMarkAsPaid = async () => {
    if (!orderId) return;
    setIsProcessingPayment(true);
    try {
      await updateOrderStatus(orderId, "pending");
      await handlePaymentSuccess();
      setStep("success");
    } catch {
      setPaymentError("Failed to process payment");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const resetOrder = () => {
    setStep("delivery");
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
      case "delivery": return t("order.deliveryInfo");
      case "confirm": return t("order.confirmOrder");
      case "payment": return t("order.payment") || "Payment";
      case "success": return t("order.orderConfirmed");
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "delivery": return t("order.deliveryInfoDesc");
      case "confirm": return t("order.confirmOrderDesc");
      case "payment": return t("order.paymentDesc") || "Complete your payment to confirm the order";
      case "success": return t("order.orderConfirmedDesc");
    }
  };

  if (!product) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-hidden">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold">
            {getStepTitle()}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {getStepDescription()}
          </SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pb-8">
          {step === "delivery" && (
            <div className="space-y-4">
              {/* Product summary */}
              <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                <div className="flex items-center gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-bold text-primary">RM {product.price}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          RM {product.originalPrice}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>

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
                      <Button onClick={handleLogin}>
                        <User className="w-4 h-4 mr-2" />
                        {t("order.loginOrRegister")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setUseGuestCheckout(true)}
                      >
                        {t("order.continueAsGuest")}
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {/* Saved addresses */}
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
                    >
                      {t("order.backToSavedAddresses")}
                    </Button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pc-customerName" className="text-sm">{t("order.customerName")} *</Label>
                      <Input
                        id="pc-customerName"
                        value={deliveryInfo.customerName}
                        onChange={(e) => handleDeliveryInfoChange("customerName", e.target.value)}
                        placeholder={t("order.customerName")}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pc-phone" className="text-sm">{t("order.phone")} *</Label>
                      <Input
                        id="pc-phone"
                        type="tel"
                        value={deliveryInfo.phone}
                        onChange={(e) => handleDeliveryInfoChange("phone", e.target.value)}
                        placeholder="012-3456789"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pc-address" className="text-sm">{t("order.address")} *</Label>
                    <Input
                      id="pc-address"
                      value={deliveryInfo.address}
                      onChange={(e) => handleDeliveryInfoChange("address", e.target.value)}
                      placeholder={t("order.address")}
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="pc-postcode" className="text-sm">{t("order.postcode")} *</Label>
                      <Input
                        id="pc-postcode"
                        value={deliveryInfo.postcode}
                        onChange={(e) => handleDeliveryInfoChange("postcode", e.target.value)}
                        placeholder="12345"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="pc-city" className="text-sm">{t("order.city")} *</Label>
                      <Input
                        id="pc-city"
                        value={deliveryInfo.city}
                        onChange={(e) => handleDeliveryInfoChange("city", e.target.value)}
                        placeholder={t("order.city")}
                      />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="pc-state" className="text-sm">{t("order.state")} *</Label>
                      <Select
                        value={deliveryInfo.state}
                        onValueChange={(value) => handleDeliveryInfoChange("state", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("order.selectState")} />
                        </SelectTrigger>
                        <SelectContent>
                          {malaysiaStates.map((state) => (
                            <SelectItem key={state} value={state}>
                              {t(`states.${state}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pc-deliveryDate" className="text-sm text-muted-foreground">{t("order.deliveryDate")}</Label>
                    <Input
                      id="pc-deliveryDate"
                      type="date"
                      value={deliveryInfo.deliveryDate}
                      onChange={(e) => handleDeliveryInfoChange("deliveryDate", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  {/* Referral Code */}
                  <div className="space-y-1.5">
                    <Label htmlFor="pc-referralCode" className="text-sm text-muted-foreground flex items-center gap-2">
                      <Gift className="w-4 h-4" />
                      {t("order.referralCode") || "Referral Code (Optional)"}
                    </Label>
                    <Input
                      id="pc-referralCode"
                      value={referralCode}
                      onChange={(e) => {
                        setReferralCode(e.target.value.toUpperCase());
                        validateReferralCode(e.target.value);
                      }}
                      placeholder="ABC123"
                      maxLength={8}
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
                        id="pc-saveAddress"
                        checked={saveNewAddress}
                        onCheckedChange={(checked) => setSaveNewAddress(checked === true)}
                      />
                      <Label htmlFor="pc-saveAddress" className="text-sm cursor-pointer">
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
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">x 1</p>
                  </div>
                  <div className="text-right">
                    {product.originalPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through mr-2">
                        RM {product.originalPrice}
                      </span>
                    )}
                    <span className="font-bold text-primary">RM {currentPrice}</span>
                  </div>
                </div>
                <div className="border-t border-border pt-3 flex justify-between font-semibold">
                  <span>{language === "zh" ? "总计" : "Total"}</span>
                  <span className="text-primary">RM {currentPrice}</span>
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
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {language === "zh" ? "处理中..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      {language === "zh" ? "在线支付 (Stripe)" : "Pay Online (Stripe)"}
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {language === "zh"
                    ? "在线支付支持信用卡、FPX、GrabPay"
                    : "Online payment supports Credit Card, FPX, GrabPay"}
                </p>
                <p className="text-xs text-center">
                  <a
                    href={`https://wa.me/60178228658?text=${encodeURIComponent(`Need help with order #${orderNumber}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground underline hover:text-foreground"
                  >
                    {language === "zh" ? "需要帮助？" : "Need help?"}
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
                <p className="text-2xl font-bold text-primary">
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
              {step === "confirm" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("delivery")}
                >
                  {t("order.back")}
                </Button>
              )}
              {step === "delivery" && (
                <Button
                  className="flex-1"
                  disabled={!isDeliveryValid()}
                  onClick={() => setStep("confirm")}
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
