import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingBag, Plus, Minus, Check, CheckCircle, Loader2, User, MapPin } from "lucide-react";
import { SiWhatsapp, SiFacebook } from "react-icons/si";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { Member, MemberAddress } from "@shared/schema";

interface OrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  whatsappLink: string;
  metaShopLink: string;
}

interface FlavorSelection {
  key: string;
  nameKey: string;
  quantity: number;
  category: "birdNest" | "fishMaw";
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

const birdNestFlavors = [
  { key: "original", nameKey: "flavors.original" },
  { key: "redDate", nameKey: "flavors.redDate" },
  { key: "snowPear", nameKey: "flavors.snowPear" },
  { key: "peachGum", nameKey: "flavors.peachGum" },
  { key: "coconut", nameKey: "flavors.coconut" },
  { key: "mango", nameKey: "flavors.mango" },
];

const fishMawFlavors = [
  { key: "fishMawOriginal", nameKey: "flavors.fishMawOriginal" },
  { key: "fishMawRedDate", nameKey: "flavors.fishMawRedDate" },
];

const packages = [
  { key: "oneBox", jars: 6, priceKey: "packages.oneBoxPrice", descKey: "packages.oneBoxDesc", price: 158 },
  { key: "twoBox", jars: 12, priceKey: "packages.twoBoxPrice", descKey: "packages.twoBoxDesc", price: 298 },
];

const malaysiaStates = [
  "johor", "kedah", "kelantan", "melaka", "negeriSembilan", "pahang", 
  "penang", "perak", "perlis", "sabah", "sarawak", "selangor", 
  "terengganu", "kualaLumpur", "labuan", "putrajaya"
];

export function OrderModal({ open, onOpenChange, whatsappLink, metaShopLink }: OrderModalProps) {
  const { t } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState<"package" | "flavors" | "delivery" | "confirm" | "success">("package");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selections, setSelections] = useState<FlavorSelection[]>([]);
  const [activeCategory, setActiveCategory] = useState<"birdNest" | "fishMaw">("birdNest");
  const [orderNumber, setOrderNumber] = useState<string>("");
  const [useGuestCheckout, setUseGuestCheckout] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
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
  const { data: member } = useQuery<Member>({
    queryKey: ["/api/members/me"],
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: savedAddresses = [] } = useQuery<MemberAddress[]>({
    queryKey: ["/api/members/me/addresses"],
    enabled: isAuthenticated && !!member,
    retry: false,
  });

  const selectedPkg = packages.find(p => p.key === selectedPackage);
  const totalSelected = selections.reduce((sum, s) => sum + s.quantity, 0);
  const maxJars = selectedPkg?.jars || 0;
  const remainingJars = maxJars - totalSelected;

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await apiRequest("POST", "/api/orders", orderData);
      return response.json();
    },
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      setStep("success");
    },
  });

  const handleFlavorChange = (flavorKey: string, nameKey: string, category: "birdNest" | "fishMaw", delta: number) => {
    setSelections(prev => {
      const existing = prev.find(s => s.key === flavorKey);
      if (existing) {
        const newQty = Math.max(0, existing.quantity + delta);
        if (newQty === 0) {
          return prev.filter(s => s.key !== flavorKey);
        }
        return prev.map(s => s.key === flavorKey ? { ...s, quantity: newQty } : s);
      } else if (delta > 0) {
        return [...prev, { key: flavorKey, nameKey, quantity: 1, category }];
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
    const pkg = packages.find(p => p.key === selectedPackage);
    if (!pkg) return;

    const itemsJson = JSON.stringify(selections.map(s => ({
      flavor: s.key,
      flavorName: t(s.nameKey),
      quantity: s.quantity,
      category: s.category,
    })));

    const orderData = {
      orderNumber: "", // Will be generated by server
      customerName: deliveryInfo.customerName,
      customerPhone: deliveryInfo.phone,
      status: "pending",
      totalAmount: pkg.price,
      items: itemsJson,
      packageType: pkg.key,
      shippingAddress: deliveryInfo.address,
      shippingCity: deliveryInfo.city,
      shippingState: deliveryInfo.state,
      shippingPostcode: deliveryInfo.postcode,
      preferredDeliveryDate: deliveryInfo.deliveryDate || null,
      source: "website",
    };

    createOrderMutation.mutate(orderData);
  };

  const resetOrder = () => {
    setStep("package");
    setSelectedPackage(null);
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
    setUseGuestCheckout(false);
    setSelectedAddressId(null);
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
    window.location.href = "/api/login";
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
      case "package": return t("order.selectPackage");
      case "flavors": return t("order.selectFlavors");
      case "delivery": return t("order.deliveryInfo");
      case "confirm": return t("order.confirmOrder");
      case "success": return t("order.orderConfirmed");
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case "package": return t("order.selectPackageDesc");
      case "flavors": return (
        <span className="flex items-center gap-2">
          {t("order.selectFlavorsDesc")}
          <Badge variant="secondary" className="ml-2" data-testid="badge-remaining-jars">
            {t("order.remaining")}: {remainingJars}/{maxJars}
          </Badge>
        </span>
      );
      case "delivery": return t("order.deliveryInfoDesc");
      case "confirm": return t("order.confirmOrderDesc");
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
              <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as "birdNest" | "fishMaw")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="birdNest" data-testid="tab-bird-nest">
                    {t("order.birdNestFlavors")}
                  </TabsTrigger>
                  <TabsTrigger value="fishMaw" data-testid="tab-fish-maw">
                    {t("order.fishMawFlavors")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="birdNest" className="space-y-3">
                  {birdNestFlavors.map((flavor) => {
                    const qty = getFlavorQuantity(flavor.key);
                    return (
                      <Card key={flavor.key} className="p-4" data-testid={`card-order-flavor-${flavor.key}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {t(flavor.nameKey)}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleFlavorChange(flavor.key, flavor.nameKey, "birdNest", -1)}
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
                              onClick={() => handleFlavorChange(flavor.key, flavor.nameKey, "birdNest", 1)}
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
                </TabsContent>

                <TabsContent value="fishMaw" className="space-y-3">
                  {fishMawFlavors.map((flavor) => {
                    const qty = getFlavorQuantity(flavor.key);
                    return (
                      <Card key={flavor.key} className="p-4" data-testid={`card-order-flavor-${flavor.key}`}>
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {t(flavor.nameKey)}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => handleFlavorChange(flavor.key, flavor.nameKey, "fishMaw", -1)}
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
                              onClick={() => handleFlavorChange(flavor.key, flavor.nameKey, "fishMaw", 1)}
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
                </TabsContent>
              </Tabs>
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="customerName">{t("order.customerName")} *</Label>
                    <Input
                      id="customerName"
                      value={deliveryInfo.customerName}
                      onChange={(e) => handleDeliveryInfoChange("customerName", e.target.value)}
                      placeholder={t("order.customerName")}
                      data-testid="input-customer-name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("order.phone")} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={deliveryInfo.phone}
                      onChange={(e) => handleDeliveryInfoChange("phone", e.target.value)}
                      placeholder="012-3456789"
                      data-testid="input-phone"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">{t("order.address")} *</Label>
                    <Input
                      id="address"
                      value={deliveryInfo.address}
                      onChange={(e) => handleDeliveryInfoChange("address", e.target.value)}
                      placeholder={t("order.address")}
                      data-testid="input-address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("order.city")} *</Label>
                      <Input
                        id="city"
                        value={deliveryInfo.city}
                        onChange={(e) => handleDeliveryInfoChange("city", e.target.value)}
                        placeholder={t("order.city")}
                        data-testid="input-city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postcode">{t("order.postcode")} *</Label>
                      <Input
                        id="postcode"
                        value={deliveryInfo.postcode}
                        onChange={(e) => handleDeliveryInfoChange("postcode", e.target.value)}
                        placeholder="12345"
                        data-testid="input-postcode"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">{t("order.state")} *</Label>
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

                  <div className="space-y-2">
                    <Label htmlFor="deliveryDate">{t("order.deliveryDate")}</Label>
                    <Input
                      id="deliveryDate"
                      type="date"
                      value={deliveryInfo.deliveryDate}
                      onChange={(e) => handleDeliveryInfoChange("deliveryDate", e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      data-testid="input-delivery-date"
                    />
                  </div>
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
                    <span className="text-muted-foreground">{t("order.packageLabel")}:</span>
                    <span className="font-medium">{selectedPkg && t(`packages.${selectedPkg.key}`)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t("order.priceLabel")}:</span>
                    <span className="font-medium text-primary">{selectedPkg && t(selectedPkg.priceKey)}</span>
                  </div>
                </div>
                <div className="border-t border-border mt-4 pt-4">
                  <p className="text-sm text-muted-foreground mb-2">{t("order.flavorSelection")}:</p>
                  <div className="flex flex-wrap gap-2">
                    {selections.map((s) => (
                      <Badge key={s.key} variant="secondary" data-testid={`badge-selection-${s.key}`}>
                        {t(s.nameKey)} x {s.quantity}
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
                    {t("order.submitOrder")}
                  </>
                )}
              </Button>
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

        {step !== "success" && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <div className="flex gap-3">
              {step !== "package" && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    if (step === "confirm") setStep("delivery");
                    else if (step === "delivery") setStep("flavors");
                    else if (step === "flavors") setStep("package");
                  }}
                  data-testid="button-back"
                >
                  {t("order.back")}
                </Button>
              )}
              {step === "package" && (
                <Button
                  className="flex-1"
                  disabled={!selectedPackage}
                  onClick={() => setStep("flavors")}
                  data-testid="button-next-package"
                >
                  {t("order.next")}
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
                      ({remainingJars} {t("order.moreNeeded")})
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
