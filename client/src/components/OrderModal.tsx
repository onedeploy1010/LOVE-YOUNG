import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, MessageCircle, Plus, Minus, Check, ExternalLink } from "lucide-react";
import { SiWhatsapp, SiFacebook } from "react-icons/si";
import { useLanguage } from "@/lib/i18n";
import { useState } from "react";

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
  { key: "oneBox", jars: 6, priceKey: "packages.oneBoxPrice", descKey: "packages.oneBoxDesc" },
  { key: "twoBox", jars: 12, priceKey: "packages.twoBoxPrice", descKey: "packages.twoBoxDesc" },
];

export function OrderModal({ open, onOpenChange, whatsappLink, metaShopLink }: OrderModalProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"package" | "flavors" | "confirm">("package");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selections, setSelections] = useState<FlavorSelection[]>([]);
  const [activeCategory, setActiveCategory] = useState<"birdNest" | "fishMaw">("birdNest");

  const selectedPkg = packages.find(p => p.key === selectedPackage);
  const totalSelected = selections.reduce((sum, s) => sum + s.quantity, 0);
  const maxJars = selectedPkg?.jars || 0;
  const remainingJars = maxJars - totalSelected;

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

  const generateOrderMessage = () => {
    const pkg = packages.find(p => p.key === selectedPackage);
    if (!pkg) return "";

    const lines = [
      t("order.greeting"),
      "",
      `${t("order.packageLabel")}: ${t(`packages.${pkg.key}`)} (${pkg.jars}${t("order.jarsUnit")})`,
      "",
      t("order.flavorSelection") + ":",
    ];

    selections.forEach(s => {
      lines.push(`- ${t(s.nameKey)} x ${s.quantity}`);
    });

    lines.push("");
    lines.push(t("order.confirmRequest"));

    return lines.join("\n");
  };

  const handleWhatsAppOrder = () => {
    const message = generateOrderMessage();
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/60124017174?text=${encodedMessage}`, "_blank");
    onOpenChange(false);
  };

  const handleMetaShopOrder = () => {
    window.open(metaShopLink, "_blank");
    onOpenChange(false);
  };

  const resetOrder = () => {
    setStep("package");
    setSelectedPackage(null);
    setSelections([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetOrder();
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl overflow-hidden" data-testid="modal-order">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-xl font-bold" data-testid="text-order-modal-title">
            {step === "package" && t("order.selectPackage")}
            {step === "flavors" && t("order.selectFlavors")}
            {step === "confirm" && t("order.confirmOrder")}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            {step === "package" && t("order.selectPackageDesc")}
            {step === "flavors" && (
              <span className="flex items-center gap-2">
                {t("order.selectFlavorsDesc")}
                <Badge variant="secondary" className="ml-2" data-testid="badge-remaining-jars">
                  {t("order.remaining")}: {remainingJars}/{maxJars}
                </Badge>
              </span>
            )}
            {step === "confirm" && t("order.confirmOrderDesc")}
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

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  {t("order.selectOrderMethod")}
                </p>
                <Button
                  className="w-full gap-3"
                  size="lg"
                  onClick={handleWhatsAppOrder}
                  data-testid="button-order-whatsapp"
                >
                  <SiWhatsapp className="w-5 h-5" />
                  {t("order.whatsappOrder")}
                </Button>
                <Button
                  className="w-full gap-3"
                  size="lg"
                  variant="outline"
                  onClick={handleMetaShopOrder}
                  data-testid="button-order-meta"
                >
                  <SiFacebook className="w-5 h-5" />
                  {t("order.metaShop")}
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="flex gap-3">
            {step !== "package" && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(step === "confirm" ? "flavors" : "package")}
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
                onClick={() => setStep("confirm")}
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
