import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, Star, Leaf, Award, Truck, Gift, ArrowRight } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { motion } from "framer-motion";

const WHATSAPP_PHONE = "60124017174";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我想订购 LOVEYOUNG 产品。")}`;
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const PRODUCT_CATEGORIES = [
  { id: "all", label: "全部产品" },
  { id: "birdnest", label: "燕窝系列" },
  { id: "fishmaw", label: "花胶系列" },
  { id: "giftbox", label: "礼盒套装" }
];

const PRODUCTS = [
  {
    id: "bn-classic-6",
    name: "经典原味燕窝",
    subtitle: "6罐装礼盒",
    category: "birdnest",
    price: 199,
    originalPrice: 259,
    unit: "盒",
    image: "/pics/love_young_gift_box_design_20260106043236_1.png",
    features: ["印尼金丝燕盏", "无添加糖", "即食便携"],
    isHot: true,
    isNew: false
  },
  {
    id: "bn-premium-6",
    name: "冰糖官燕",
    subtitle: "6罐装尊享版",
    category: "birdnest",
    price: 299,
    originalPrice: 399,
    unit: "盒",
    image: "/pics/love_young_luxury_gift_box_detailed_20260106045736_1.png",
    features: ["特级燕盏", "冰糖慢炖", "浓稠口感"],
    isHot: false,
    isNew: true
  },
  {
    id: "fm-collagen-6",
    name: "花胶胶原羹",
    subtitle: "6罐装",
    category: "fishmaw",
    price: 249,
    originalPrice: 329,
    unit: "盒",
    image: "/pics/love_young_wellness_lifestyle_20260106043539_1.png",
    features: ["深海花胶", "胶原满满", "养颜美容"],
    isHot: true,
    isNew: false
  },
  {
    id: "fm-milk-6",
    name: "牛奶花胶羹",
    subtitle: "6罐装",
    category: "fishmaw",
    price: 269,
    originalPrice: 349,
    unit: "盒",
    image: "/pics/love_young_event_experience_20260106043435_1.png",
    features: ["新西兰牛奶", "香浓顺滑", "营养加倍"],
    isHot: false,
    isNew: true
  },
  {
    id: "gift-luxury",
    name: "逆风启航尊享礼盒",
    subtitle: "燕窝+花胶组合",
    category: "giftbox",
    price: 599,
    originalPrice: 799,
    unit: "套",
    image: "/pics/love_young_event_invitation_20260106043314_1.png",
    features: ["精选燕窝3罐", "精选花胶3罐", "高端礼盒包装"],
    isHot: true,
    isNew: false
  },
  {
    id: "gift-wellness",
    name: "养生臻选礼盒",
    subtitle: "全系列体验装",
    category: "giftbox",
    price: 399,
    originalPrice: 499,
    unit: "套",
    image: "/pics/love_young_community_building_20260106043405_1.png",
    features: ["4种口味各1罐", "精美礼袋", "送礼首选"],
    isHot: false,
    isNew: false
  }
];

const PRODUCT_BENEFITS = [
  {
    icon: Leaf,
    title: "100% 天然",
    description: "严选优质原料，无添加剂"
  },
  {
    icon: Award,
    title: "品质保证",
    description: "每批产品均通过质检"
  },
  {
    icon: Truck,
    title: "冷链配送",
    description: "全程冷链，新鲜到家"
  },
  {
    icon: Gift,
    title: "精美包装",
    description: "送礼自用两相宜"
  }
];

export default function ProductsPage() {
  const handleOrderProduct = (productName: string) => {
    const message = encodeURIComponent(`您好，我想订购 ${productName}。`);
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
                臻选滋补 · 养乐优品
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                每一份产品都源自我们对品质的极致追求。从印尼金丝燕盏到深海花胶，我们只选用最优质的原料，为您呈现最纯粹的滋养。
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => window.open(META_SHOP_LINK, "_blank")}
                  data-testid="button-shop-now"
                >
                  <ShoppingBag className="w-5 h-5" />
                  立即选购
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                  data-testid="button-products-whatsapp"
                >
                  <SiWhatsapp className="w-5 h-5" />
                  WhatsApp 咨询
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
                  <p className="font-medium text-foreground text-sm">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
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
                    {category.label}
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
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                            <div className="absolute top-3 left-3 flex gap-2">
                              {product.isHot && (
                                <Badge className="bg-destructive text-destructive-foreground">热卖</Badge>
                              )}
                              {product.isNew && (
                                <Badge className="bg-secondary text-secondary-foreground">新品</Badge>
                              )}
                            </div>
                            {product.originalPrice > product.price && (
                              <Badge 
                                variant="secondary" 
                                className="absolute top-3 right-3"
                              >
                                省 RM {product.originalPrice - product.price}
                              </Badge>
                            )}
                          </div>
                          <CardHeader className="pb-2">
                            <h3 className="font-bold text-lg text-foreground">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.subtitle}</p>
                          </CardHeader>
                          <CardContent className="flex-1 pb-4">
                            <div className="flex flex-wrap gap-2 mb-4">
                              {product.features.map((feature, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold text-primary">
                                RM {product.price}
                              </span>
                              <span className="text-sm text-muted-foreground">/{product.unit}</span>
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
                              onClick={() => handleOrderProduct(product.name)}
                              data-testid={`button-order-${product.id}`}
                            >
                              <SiWhatsapp className="w-4 h-4" />
                              立即订购
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
                品质溯源 · 匠心制作
              </h2>
              <p className="opacity-80 leading-relaxed">
                我们的燕窝源自印尼顶级燕屋，每一盏都经过严格挑选。花胶则来自深海野生鱼类，富含天然胶原蛋白。
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="w-3 h-3 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold">原料溯源</p>
                    <p className="text-sm opacity-70">每批原料均可追溯产地，确保来源安全可靠</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="w-3 h-3 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold">传统工艺</p>
                    <p className="text-sm opacity-70">采用传统慢炖工艺，保留最完整的营养成分</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Star className="w-3 h-3 text-secondary-foreground" />
                  </div>
                  <div>
                    <p className="font-bold">严格质检</p>
                    <p className="text-sm opacity-70">每批产品均通过微生物、重金属等多项检测</p>
                  </div>
                </li>
              </ul>
            </div>
            <div>
              <img 
                src="/pics/love_young_success_metrics_20260106043449_1.png"
                alt="品质保证"
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
            开启您的滋补之旅
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            无论是自用养生还是馈赠亲友，LOVEYOUNG 都是您的优雅之选。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              size="lg" 
              className="gap-2 bg-secondary text-secondary-foreground"
              onClick={() => window.open(META_SHOP_LINK, "_blank")}
              data-testid="button-final-shop"
            >
              <ShoppingBag className="w-5 h-5" />
              前往商城选购
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-final-consult"
            >
              <SiWhatsapp className="w-5 h-5" />
              咨询康养管家
            </Button>
          </div>
        </div>
      </section>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
