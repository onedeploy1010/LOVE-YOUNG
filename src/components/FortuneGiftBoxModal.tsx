import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingBag, Check, CheckCircle, Loader2, User, MapPin, CreditCard, Gift, Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { supabase, supabaseAnonKey } from "@/lib/supabase";
import { createOrder } from "@/lib/orders";
import { createOrGetMember, saveMemberAddress } from "@/lib/members";
import { saveCheckoutContext } from "@/lib/checkoutContext";
import type { Member, MemberAddress } from "@shared/types";

interface FortuneGiftBoxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

// Two gift box styles
const giftBoxStyles = [
  {
    id: "laicai",
    nameCn: "来财款",
    nameEn: "Prosperity Style",
    image: "/pics/fortune-box-laicai.jpg", // Placeholder - can be updated in admin
    description: "金色来财设计，象征财源广进",
  },
  {
    id: "yaoqian",
    nameCn: "摇钱款",
    nameEn: "Fortune Tree Style",
    image: "/pics/fortune-box-yaoqian.jpg", // Placeholder - can be updated in admin
    description: "摇钱树设计，象征财运亨通",
  },
];

const giftBoxProduct = {
  nameCn: "2026发财礼盒",
  nameEn: "2026 Fortune Gift Box",
  jars: 6,
  originalPrice: 488,
  memberPrice: 368,
};

const malaysiaStates = [
  "johor", "kedah", "kelantan", "melaka", "negeriSembilan", "pahang",
  "penang", "perak", "perlis", "sabah", "sarawak", "selangor",
  "terengganu", "kualaLumpur", "labuan", "putrajaya"
];

export function FortuneGiftBoxModal({ open, onOpenChange }: FortuneGiftBoxModalProps) {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"style" | "delivery" | "confirm" | "payment" | "success">("style");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [flavorNotes, setFlavorNotes] = useState<string>("");
  const isMember = isAuthenticated;
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

  const currentPrice = isMember ? giftBoxProduct.memberPrice : giftBoxProduct.originalPrice;
  const selectedStyleData = giftBoxStyles.find(s => s.id === selectedStyle);

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
        .eq("member_id", member.id)
        .order("is_default", { ascending: false });
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
      console.info("[checkout] Creating fortune gift box order...", { style: selectedStyle, price: currentPrice });

      const itemsJson = JSON.stringify([{
        productId: "giftbox-2026-fortune",
        productName: `${giftBoxProduct.nameCn} - ${selectedStyleData?.nameCn}`,
        style: selectedStyle,
        styleName: selectedStyleData?.nameCn,
        quantity: 1,
        jars: giftBoxProduct.jars,
        unitPrice: currentPrice,
        flavorNotes: flavorNotes || null,
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
        packageType: `fortune-giftbox-${selectedStyle}`,
        shippingAddress: deliveryInfo.address,
        shippingCity: deliveryInfo.city,
        shippingState: deliveryInfo.state,
        shippingPostcode: deliveryInfo.postcode,
        preferredDeliveryDate: deliveryInfo.deliveryDate || null,
        trackingNumber: null,
        notes: flavorNotes ? `口味偏好: ${flavorNotes}` : (isMember ? "Member discount applied" : null),
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
    onSuccess: async (order) => {
      setOrderNumber(order.orderNumber);
      setOrderId(order.id);
      setStep("payment");

      // Save address for authenticated users
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
            await supabase.from("orders").update({ member_id: resolvedMember.id }).eq("id", order.id);
            queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
            queryClient.invalidateQueries({ queryKey: ["member-profile"] });
          }
        } catch (err) {
          console.error("Error saving address:", err);
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

  const handleSubmitOrder = () => {
    createOrderMutation.mutate();
  };

  const handleStripePayment = async () => {
    if (!orderId || !orderNumber) {
      setPaymentError("Order not found. Please try again.");
      return;
    }

    setIsProcessingPayment(true);
    setPaymentError(null);

    try {
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
          amount: currentPrice * 100,
          customerEmail: user?.email || null,
          customerName: deliveryInfo.customerName,
          productName: `${giftBoxProduct.nameCn} - ${selectedStyleData?.nameCn}`,
          successUrl: `${window.location.origin}/checkout/success?order=${orderNumber}`,
          cancelUrl: `${window.location.origin}/?payment=cancelled`,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Edge function returned ${res.status}`);
      if (!data?.url) throw new Error(data?.error || "No checkout URL returned");

      saveCheckoutContext({
        orderId,
        orderNumber,
        deliveryInfo,
        currentPrice,
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
    setStep("style");
    setSelectedStyle(null);
    setFlavorNotes("");
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
    if (!newOpen) resetOrder();
    onOpenChange(newOpen);
  };

  const getStepTitle = () => {
    switch (step) {
      case "style": return language === "zh" ? "选择款式" : "Choose Style";
      case "delivery": return t("order.deliveryInfo");
      case "confirm": return t("order.confirmOrder");
      case "payment": return t("order.payment") || "Payment";
      case "success": return t("order.orderConfirmed");
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "style": return language === "zh" ? "2026发财礼盒 - 两款精美包装任选" : "2026 Fortune Gift Box - Choose your style";
      case "delivery": return t("order.deliveryInfoDesc");
      case "confirm": return t("order.confirmOrderDesc");
      case "payment": return t("order.paymentDesc") || "Complete your payment";
      case "success": return t("order.orderConfirmedDesc");
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-hidden" data-testid="modal-fortune-giftbox">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold">{getStepTitle()}</SheetTitle>
          <SheetDescription className="text-muted-foreground">{getStepDescription()}</SheetDescription>
        </SheetHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)] pb-8">
          {step === "style" && (
            <div className="space-y-4">
              {/* Price display */}
              <Card className="p-4 bg-gradient-to-r from-amber-50 to-red-50 dark:from-amber-950/20 dark:to-red-950/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      <Gift className="w-5 h-5 text-red-500" />
                      {language === "zh" ? giftBoxProduct.nameCn : giftBoxProduct.nameEn}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {language === "zh" ? `${giftBoxProduct.jars}瓶即食燕窝，口味随机搭配` : `${giftBoxProduct.jars} bottles, random flavor mix`}
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
                        <p className="text-xs text-muted-foreground">{language === "zh" ? "登录享会员价 RM368" : "Login for RM368"}</p>
                      </>
                    )}
                  </div>
                </div>
              </Card>

              {/* Style selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  {language === "zh" ? "选择礼盒款式" : "Select Gift Box Style"}
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {giftBoxStyles.map((style) => (
                    <Card
                      key={style.id}
                      className={`cursor-pointer transition-all overflow-hidden ${
                        selectedStyle === style.id ? "ring-2 ring-primary" : "hover:shadow-md"
                      }`}
                      onClick={() => setSelectedStyle(style.id)}
                    >
                      <div className="aspect-square bg-muted relative">
                        <img
                          src={style.image}
                          alt={style.nameCn}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/pics/product-placeholder.jpg";
                          }}
                        />
                        {selectedStyle === style.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 text-center">
                        <p className="font-medium">{language === "zh" ? style.nameCn : style.nameEn}</p>
                        <p className="text-xs text-muted-foreground">{style.description}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Flavor preference notes */}
              <div className="space-y-2">
                <Label htmlFor="flavorNotes" className="text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  {language === "zh" ? "口味偏好备注（可选）" : "Flavor Preferences (Optional)"}
                </Label>
                <Textarea
                  id="flavorNotes"
                  value={flavorNotes}
                  onChange={(e) => setFlavorNotes(e.target.value)}
                  placeholder={language === "zh"
                    ? "例如：偏好甜一点的口味、不要可可味等，我们会尽量安排"
                    : "e.g., prefer sweeter flavors, no cocoa, etc. We'll try to accommodate"}
                  className="resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {language === "zh"
                    ? "* 口味随机搭配，我们会根据您的偏好尽量安排"
                    : "* Flavors are randomly mixed, we'll try to match your preferences"}
                </p>
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
                      <Button onClick={handleLogin}>
                        <User className="w-4 h-4 mr-2" />
                        {t("order.loginOrRegister")}
                      </Button>
                      <Button variant="outline" onClick={() => setUseGuestCheckout(true)}>
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
                      className={`p-4 cursor-pointer transition-all ${
                        selectedAddressId === addr.id ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => handleSelectSavedAddress(addr)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium">{addr.recipientName}</p>
                            <p className="text-muted-foreground">{addr.phone}</p>
                            <p className="text-muted-foreground">{addr.addressLine1}</p>
                            <p className="text-muted-foreground">{addr.postcode} {addr.city}, {t(`states.${addr.state}`)}</p>
                          </div>
                        </div>
                        {selectedAddressId === addr.id && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => { setSelectedAddressId(null); setUseGuestCheckout(true); }}>
                    {t("order.useNewAddress")}
                  </Button>
                </div>
              )}

              {/* Manual address form */}
              {(useGuestCheckout || (isAuthenticated && !showAddressSelection)) && (
                <>
                  {isAuthenticated && savedAddresses.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setUseGuestCheckout(false)} className="mb-2">
                      {t("order.backToSavedAddresses")}
                    </Button>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="customerName" className="text-sm">{t("order.customerName")} *</Label>
                      <Input id="customerName" value={deliveryInfo.customerName} onChange={(e) => handleDeliveryInfoChange("customerName", e.target.value)} placeholder={t("order.customerName")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm">{t("order.phone")} *</Label>
                      <Input id="phone" type="tel" value={deliveryInfo.phone} onChange={(e) => handleDeliveryInfoChange("phone", e.target.value)} placeholder="012-3456789" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="text-sm">{t("order.address")} *</Label>
                    <Input id="address" value={deliveryInfo.address} onChange={(e) => handleDeliveryInfoChange("address", e.target.value)} placeholder={t("order.address")} />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="postcode" className="text-sm">{t("order.postcode")} *</Label>
                      <Input id="postcode" value={deliveryInfo.postcode} onChange={(e) => handleDeliveryInfoChange("postcode", e.target.value)} placeholder="12345" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-sm">{t("order.city")} *</Label>
                      <Input id="city" value={deliveryInfo.city} onChange={(e) => handleDeliveryInfoChange("city", e.target.value)} placeholder={t("order.city")} />
                    </div>
                    <div className="space-y-1.5 col-span-2 sm:col-span-1">
                      <Label htmlFor="state" className="text-sm">{t("order.state")} *</Label>
                      <Select value={deliveryInfo.state} onValueChange={(value) => handleDeliveryInfoChange("state", value)}>
                        <SelectTrigger><SelectValue placeholder={t("order.selectState")} /></SelectTrigger>
                        <SelectContent>
                          {malaysiaStates.map((state) => (
                            <SelectItem key={state} value={state}>{t(`states.${state}`)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="deliveryDate" className="text-sm text-muted-foreground">{t("order.deliveryDate")}</Label>
                    <Input id="deliveryDate" type="date" value={deliveryInfo.deliveryDate} onChange={(e) => handleDeliveryInfoChange("deliveryDate", e.target.value)} min={new Date().toISOString().split('T')[0]} />
                  </div>

                  {isAuthenticated && !selectedAddressId && (
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox id="saveAddress" checked={saveNewAddress} onCheckedChange={(checked) => setSaveNewAddress(checked === true)} />
                      <Label htmlFor="saveAddress" className="text-sm cursor-pointer">{t("order.saveAddressToProfile")}</Label>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <Card className="p-5">
                <h4 className="font-semibold text-foreground mb-3">{t("order.orderSummary")}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "zh" ? "产品" : "Product"}:</span>
                    <span className="font-medium">{language === "zh" ? giftBoxProduct.nameCn : giftBoxProduct.nameEn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "zh" ? "款式" : "Style"}:</span>
                    <span className="font-medium">{selectedStyleData?.nameCn}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === "zh" ? "数量" : "Quantity"}:</span>
                    <span className="font-medium">{giftBoxProduct.jars} {language === "zh" ? "瓶" : "bottles"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.priceLabel")}:</span>
                    <div className="text-right">
                      {isMember && <span className="text-muted-foreground line-through mr-2">RM {giftBoxProduct.originalPrice}</span>}
                      <span className="font-medium text-primary">RM {currentPrice}</span>
                    </div>
                  </div>
                  {flavorNotes && (
                    <div className="border-t pt-2 mt-2">
                      <span className="text-muted-foreground">{language === "zh" ? "口味偏好" : "Flavor Notes"}:</span>
                      <p className="text-sm mt-1">{flavorNotes}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <h4 className="font-semibold text-foreground mb-3">{t("order.deliveryInfo")}</h4>
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
                </div>
              </Card>

              {paymentError && (
                <Card className="p-4 bg-destructive/10 border-destructive">
                  <p className="text-sm text-destructive">{paymentError}</p>
                </Card>
              )}

              <Button className="w-full gap-3" size="lg" onClick={handleSubmitOrder} disabled={createOrderMutation.isPending}>
                {createOrderMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />{t("order.orderSubmitting")}</>
                ) : (
                  <><ShoppingBag className="w-5 h-5" />{t("order.proceedToPayment") || "Proceed to Payment"}</>
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
                <Button className="w-full gap-3 bg-[#635BFF] hover:bg-[#5851DB]" size="lg" onClick={handleStripePayment} disabled={isProcessingPayment}>
                  {isProcessingPayment ? (
                    <><Loader2 className="w-5 h-5 animate-spin" />{t("order.processing")}</>
                  ) : (
                    <><CreditCard className="w-5 h-5" />{t("order.payOnline")}</>
                  )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">{t("order.paymentMethods")}</p>
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
                <h3 className="text-xl font-bold text-foreground mb-2">{t("order.orderSuccess")}</h3>
                <p className="text-muted-foreground mb-4">{t("order.orderConfirmedDesc")}</p>
              </div>
              <Card className="p-5">
                <p className="text-sm text-muted-foreground mb-2">{t("order.yourOrderNumber")}:</p>
                <p className="text-2xl font-bold text-primary">{orderNumber}</p>
              </Card>
              <Button className="w-full" variant="outline" onClick={() => { resetOrder(); onOpenChange(false); }}>
                {t("order.continueOrdering")}
              </Button>
            </div>
          )}
        </div>

        {step !== "success" && step !== "payment" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <div className="flex gap-3">
              {step !== "style" && (
                <Button variant="outline" className="flex-1" onClick={() => {
                  if (step === "confirm") setStep("delivery");
                  else if (step === "delivery") setStep("style");
                }}>
                  {t("order.back")}
                </Button>
              )}
              {step === "style" && (
                <Button className="flex-1" disabled={!selectedStyle} onClick={() => setStep("delivery")}>
                  {t("order.next")}
                </Button>
              )}
              {step === "delivery" && (
                <Button className="flex-1" disabled={!isDeliveryValid()} onClick={() => setStep("confirm")}>
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
