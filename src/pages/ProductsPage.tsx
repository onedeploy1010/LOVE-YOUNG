import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Star, Leaf, Award, Truck, Gift, ArrowRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

const WHATSAPP_PHONE = "60178228658";
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const PRODUCT_CATEGORIES = [
  { id: "all", labelKey: "productsPage.categories.all" },
  { id: "birdnest", labelKey: "productsPage.categories.birdNest" },
  { id: "fishmaw", labelKey: "productsPage.categories.fishMaw" },
  { id: "giftbox", labelKey: "productsPage.categories.giftBox" }
];

const PRODUCTS = [
  {
    id: "bn-classic-6",
    nameKey: "productsPage.items.bnClassic.name",
    subtitleKey: "productsPage.items.bnClassic.subtitle",
    category: "birdnest",
    price: 199,
    originalPrice: 259,
    unitKey: "productsPage.units.box",
    image: "/pics/love_young_gift_box_design_20260106043236_1.png",
    featureKeys: ["productsPage.items.bnClassic.feature1", "productsPage.items.bnClassic.feature2", "productsPage.items.bnClassic.feature3"],
    isHot: true,
    isNew: false
  },
  {
    id: "bn-premium-6",
    nameKey: "productsPage.items.bnPremium.name",
    subtitleKey: "productsPage.items.bnPremium.subtitle",
    category: "birdnest",
    price: 299,
    originalPrice: 399,
    unitKey: "productsPage.units.box",
    image: "/pics/love_young_luxury_gift_box_detailed_20260106045736_1.png",
    featureKeys: ["productsPage.items.bnPremium.feature1", "productsPage.items.bnPremium.feature2", "productsPage.items.bnPremium.feature3"],
    isHot: false,
    isNew: true
  },
  {
    id: "fm-collagen-6",
    nameKey: "productsPage.items.fmCollagen.name",
    subtitleKey: "productsPage.items.fmCollagen.subtitle",
    category: "fishmaw",
    price: 249,
    originalPrice: 329,
    unitKey: "productsPage.units.box",
    image: "/pics/love_young_wellness_lifestyle_20260106043539_1.png",
    featureKeys: ["productsPage.items.fmCollagen.feature1", "productsPage.items.fmCollagen.feature2", "productsPage.items.fmCollagen.feature3"],
    isHot: true,
    isNew: false
  },
  {
    id: "fm-milk-6",
    nameKey: "productsPage.items.fmMilk.name",
    subtitleKey: "productsPage.items.fmMilk.subtitle",
    category: "fishmaw",
    price: 269,
    originalPrice: 349,
    unitKey: "productsPage.units.box",
    image: "/pics/love_young_event_experience_20260106043435_1.png",
    featureKeys: ["productsPage.items.fmMilk.feature1", "productsPage.items.fmMilk.feature2", "productsPage.items.fmMilk.feature3"],
    isHot: false,
    isNew: true
  },
  {
    id: "gift-luxury",
    nameKey: "productsPage.items.giftLuxury.name",
    subtitleKey: "productsPage.items.giftLuxury.subtitle",
    category: "giftbox",
    price: 599,
    originalPrice: 799,
    unitKey: "productsPage.units.set",
    image: "/pics/love_young_event_invitation_20260106043314_1.png",
    featureKeys: ["productsPage.items.giftLuxury.feature1", "productsPage.items.giftLuxury.feature2", "productsPage.items.giftLuxury.feature3"],
    isHot: true,
    isNew: false
  },
  {
    id: "gift-wellness",
    nameKey: "productsPage.items.giftWellness.name",
    subtitleKey: "productsPage.items.giftWellness.subtitle",
    category: "giftbox",
    price: 399,
    originalPrice: 499,
    unitKey: "productsPage.units.set",
    image: "/pics/love_young_community_building_20260106043405_1.png",
    featureKeys: ["productsPage.items.giftWellness.feature1", "productsPage.items.giftWellness.feature2", "productsPage.items.giftWellness.feature3"],
    isHot: false,
    isNew: false
  }
];

const PRODUCT_BENEFITS = [
  {
    icon: Leaf,
    titleKey: "productsPage.benefits.natural.title",
    descriptionKey: "productsPage.benefits.natural.description"
  },
  {
    icon: Award,
    titleKey: "productsPage.benefits.quality.title",
    descriptionKey: "productsPage.benefits.quality.description"
  },
  {
    icon: Truck,
    titleKey: "productsPage.benefits.coldChain.title",
    descriptionKey: "productsPage.benefits.coldChain.description"
  },
  {
    icon: Gift,
    titleKey: "productsPage.benefits.packaging.title",
    descriptionKey: "productsPage.benefits.packaging.description"
  }
];

export default function ProductsPage() {
  const { t } = useLanguage();
  
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(t("productsPage.whatsappMessage"))}`;

  const handleOrderProduct = (productName: string) => {
    const message = encodeURIComponent(t("productsPage.orderMessage", `您好，我想订购 ${productName}。`).replace("{productName}", productName));
    window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

      <section className="pt-32 pb-16 relative overflow-hidden" data-testid="section-products-hero">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 -skew-x-12 transform translate-x-1/4 -z-10" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-serif text-primary mb-6" data-testid="text-products-title">
                {t("productsPage.hero.title")}
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {t("productsPage.hero.description")}
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => window.open(META_SHOP_LINK, "_blank")}
                  data-testid="button-shop-now"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {t("productsPage.hero.shopNow")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                  data-testid="button-products-whatsapp"
                >
                  <SiWhatsapp className="w-5 h-5" />
                  {t("productsPage.hero.whatsappConsult")}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-card border-y border-border" data-testid="section-benefits">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {PRODUCT_BENEFITS.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3" data-testid={`benefit-${index}`}>
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">{t(benefit.titleKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(benefit.descriptionKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16" data-testid="section-product-list">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <Tabs defaultValue="all" className="w-full">
            <div className="flex justify-center mb-10">
              <TabsList className="grid w-full max-w-lg grid-cols-4">
                {PRODUCT_CATEGORIES.map((category) => (
                  <TabsTrigger 
                    key={category.id} 
                    value={category.id}
                    data-testid={`tab-${category.id}`}
                  >
                    {t(category.labelKey)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {PRODUCT_CATEGORIES.map((category) => (
              <TabsContent key={category.id} value={category.id}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {PRODUCTS
                    .filter(p => category.id === "all" || p.category === category.id)
                    .map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="h-full flex flex-col overflow-hidden" data-testid={`card-product-${product.id}`}>
                          <div className="relative aspect-square overflow-hidden bg-muted">
                            <img 
                              src={product.image}
                              alt={t(product.nameKey)}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                              {product.isHot && (
                                <Badge className="bg-destructive text-destructive-foreground">{t("productsPage.badges.hot")}</Badge>
                              )}
                              {product.isNew && (
                                <Badge className="bg-secondary text-secondary-foreground">{t("productsPage.badges.new")}</Badge>
                              )}
                            </div>
                            {product.originalPrice > product.price && (
                              <Badge 
                                variant="secondary" 
                                className="absolute top-3 right-3"
                              >
                                {t("productsPage.badges.save")} RM {product.originalPrice - product.price}
                              </Badge>
                            )}
                          </div>
                          <CardHeader className="pb-2">
                            <h3 className="font-bold text-lg text-foreground">{t(product.nameKey)}</h3>
                            <p className="text-sm text-muted-foreground">{t(product.subtitleKey)}</p>
                          </CardHeader>
                          <CardContent className="flex-1 pb-4">
                            <div className="flex flex-wrap gap-2 mb-4">
                              {product.featureKeys.map((featureKey, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {t(featureKey)}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-primary">
                                RM {product.price}
                              </span>
                              <span className="text-sm text-muted-foreground">/{t(product.unitKey)}</span>
                              {product.originalPrice > product.price && (
                                <span className="text-sm text-muted-foreground line-through">
                                  RM {product.originalPrice}
                                </span>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="pt-0 gap-2">
                            <Button 
                              className="flex-1 gap-2"
                              onClick={() => handleOrderProduct(t(product.nameKey))}
                              data-testid={`button-order-${product.id}`}
                            >
                              <SiWhatsapp className="w-4 h-4" />
                              {t("products.orderNow")}
                            </Button>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => window.open(META_SHOP_LINK, "_blank")}
                              data-testid={`button-shop-${product.id}`}
                            >
                              <ShoppingBag className="w-4 h-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section className="py-16 bg-primary text-primary-foreground" data-testid="section-quality">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-serif" data-testid="text-quality-title">
                {t("productsPage.quality.title")}
              </h2>
              <p className="opacity-80 leading-relaxed">
                {t("productsPage.quality.description")}
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="w-3 h-3 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold">{t("productsPage.quality.traceability.title")}</p>
                    <p className="text-sm opacity-70">{t("productsPage.quality.traceability.description")}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="w-3 h-3 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold">{t("productsPage.quality.craftsmanship.title")}</p>
                    <p className="text-sm opacity-70">{t("productsPage.quality.craftsmanship.description")}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="w-3 h-3 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold">{t("productsPage.quality.inspection.title")}</p>
                    <p className="text-sm opacity-70">{t("productsPage.quality.inspection.description")}</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <img 
                src="/pics/love_young_success_metrics_20260106043449_1.png"
                alt={t("productsPage.quality.imageAlt")}
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-quality"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-16" data-testid="section-products-cta">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-primary mb-6" data-testid="text-products-cta-title">
            {t("productsPage.cta.title")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("productsPage.cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="gap-2 bg-secondary text-secondary-foreground"
              onClick={() => window.open(META_SHOP_LINK, "_blank")}
              data-testid="button-final-shop"
            >
              <ShoppingBag className="w-5 h-5" />
              {t("productsPage.cta.goToShop")}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-final-consult"
            >
              <SiWhatsapp className="w-5 h-5" />
              {t("productsPage.cta.consultWellness")}
            </Button>
          </div>
        </div>
      </section>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
