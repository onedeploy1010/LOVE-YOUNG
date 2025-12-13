import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductCard } from "@/components/ProductCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { ChristmasPromoPopup } from "@/components/ChristmasPromoPopup";
import { ShoppingBag, Truck, MessageCircle, Leaf, Clock, Award, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import type { Product, Testimonial } from "@shared/schema";

import heroImage from "@assets/generated_images/premium_bird's_nest_hero_image.png";
import processImage from "@assets/generated_images/bird's_nest_preparation_process.png";
import dessertImage from "@assets/generated_images/prepared_bird's_nest_dessert.png";

const WHATSAPP_PHONE = "60124017174";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我对LOVEYOUNG燕窝花胶产品感兴趣，想了解更多信息。")}`;
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const benefits = [
  {
    icon: Leaf,
    title: "100% 天然原料",
    description: "严格甄选优质原产地燕窝与花胶，无添加剂，纯天然滋补",
  },
  {
    icon: Clock,
    title: "每日鲜炖",
    description: "坚持当日炖煮，保证新鲜口感，营养不流失",
  },
  {
    icon: Truck,
    title: "冷链配送",
    description: "全程冷链物流，确保产品新鲜安全送达您手中",
  },
  {
    icon: Award,
    title: "品质保证",
    description: "严格品控流程，每一份产品都经过层层把关",
  },
];

const orderSteps = [
  {
    icon: MessageCircle,
    title: "WhatsApp咨询",
    description: "添加我们的WhatsApp商务号，了解产品详情和优惠信息",
  },
  {
    icon: ShoppingBag,
    title: "Meta店铺下单",
    description: "在我们的Facebook/Instagram店铺选购心仪产品",
  },
  {
    icon: Truck,
    title: "冷链送达",
    description: "专业冷链配送，新鲜产品直达您家门口",
  },
];

export default function LandingPage() {
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  const handleViewProduct = (product: Product) => {
    window.open(WHATSAPP_LINK, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

      <section
        className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center overflow-hidden"
        data-testid="section-hero"
      >
        <div className="absolute inset-0">
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={heroImage}
            alt="LOVEYOUNG燕窝花胶"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 md:py-32 text-center md:text-left">
          <motion.div 
            className="max-w-2xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 text-sm text-white/90 glass px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-secondary" />
              <span>Premium Wellness</span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
              data-testid="text-hero-title"
            >
              LOVEYOUNG
              <br />
              <span className="gradient-text">燕窝花胶鲜炖</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-lg md:text-xl text-white/85 mb-8 leading-relaxed"
              data-testid="text-hero-subtitle"
            >
              精选优质燕窝与花胶，坚持传统工艺，每日鲜炖，冷链配送
              <br className="hidden md:block" />
              为您带来纯正天然的滋补养生体验
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mb-8"
            >
              <Button
                size="lg"
                className="w-full sm:w-auto gap-2 text-base px-8 animate-pulse-glow"
                onClick={() => {
                  const el = document.querySelector("#products");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                data-testid="button-hero-browse"
              >
                <ShoppingBag className="w-5 h-5" />
                浏览产品
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 text-base px-8 glass border-white/20 text-white"
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                data-testid="button-hero-whatsapp"
              >
                <SiWhatsapp className="w-5 h-5" />
                WhatsApp咨询
              </Button>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6"
            >
              {["100% 天然", "每日鲜炖", "冷链配送"].map((tag, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                  className="inline-flex items-center gap-2 text-sm text-white/80 glass px-4 py-2 rounded-full"
                >
                  <span className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </div>

        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ 
            opacity: { delay: 1.5, duration: 0.5 },
            y: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      <section
        id="products"
        className="py-16 md:py-24 lg:py-32 bg-background"
        data-testid="section-products"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-block text-sm font-medium text-secondary mb-3 tracking-wider uppercase"
            >
              Our Products
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-4"
              data-testid="text-products-title"
            >
              精选产品系列
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
            >
              每一份产品都经过严格筛选，只为给您带来最优质的滋补体验
            </motion.p>
          </motion.div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  variants={scaleIn}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="card-hover-lift"
                >
                  <ProductCard
                    product={product}
                    onViewDetails={handleViewProduct}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div 
            className="text-center mt-10 md:mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              className="gap-2"
              onClick={() => window.open(META_SHOP_LINK, "_blank")}
              data-testid="button-view-all-products"
            >
              查看全部产品
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      <section
        id="benefits"
        className="py-16 md:py-24 lg:py-32 bg-card relative overflow-hidden"
        data-testid="section-benefits"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div 
              className="order-2 lg:order-1"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
            >
              <motion.span 
                variants={fadeInUp}
                className="inline-block text-sm font-medium text-secondary mb-3 tracking-wider uppercase"
              >
                Why Choose Us
              </motion.span>
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-6"
                data-testid="text-benefits-title"
              >
                为什么选择 LOVEYOUNG
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed"
              >
                我们坚持传统工艺与现代品控相结合，从原料采购到成品配送，每一个环节都精益求精，只为给您带来最纯正的滋补体验。
              </motion.p>

              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                variants={staggerContainer}
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-start gap-4 group"
                    data-testid={`benefit-item-${index}`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-secondary/10 group-hover:from-primary/30 group-hover:to-secondary/20 transition-all duration-300">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {benefit.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div 
              className="order-1 lg:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] shadow-2xl">
                <img
                  src={processImage}
                  alt="LOVEYOUNG传统制作工艺"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section
        id="how-to-order"
        className="py-16 md:py-24 lg:py-32 bg-background"
        data-testid="section-how-to-order"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-block text-sm font-medium text-secondary mb-3 tracking-wider uppercase"
            >
              How to Order
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-4"
              data-testid="text-order-title"
            >
              如何订购
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
            >
              简单三步，新鲜燕窝花胶送到家
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {orderSteps.map((step, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                transition={{ duration: 0.5 }}
              >
                <Card
                  className="p-6 md:p-8 text-center relative overflow-visible card-hover-lift"
                  data-testid={`order-step-${index}`}
                >
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-lg">
                    {index + 1}
                  </div>
                  <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/10">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={() => window.open(META_SHOP_LINK, "_blank")}
              data-testid="button-order-meta"
            >
              <ShoppingBag className="w-5 h-5" />
              前往Meta店铺
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-order-whatsapp"
            >
              <SiWhatsapp className="w-5 h-5" />
              WhatsApp咨询
            </Button>
          </motion.div>
        </div>
      </section>

      <section
        id="testimonials"
        className="py-16 md:py-24 lg:py-32 bg-card relative overflow-hidden"
        data-testid="section-testimonials"
      >
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp}
              className="inline-block text-sm font-medium text-secondary mb-3 tracking-wider uppercase"
            >
              Testimonials
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground mb-4"
              data-testid="text-testimonials-title"
            >
              客户真实评价
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
            >
              听听我们的客户怎么说
            </motion.p>
          </motion.div>

          {testimonialsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.id}
                  variants={scaleIn}
                  transition={{ duration: 0.5 }}
                  className="card-hover-lift"
                >
                  <TestimonialCard
                    name={testimonial.name}
                    content={testimonial.content}
                    productType={testimonial.productType}
                    avatar={testimonial.avatar || undefined}
                    index={index}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section
        className="relative py-16 md:py-24 lg:py-32 overflow-hidden"
        data-testid="section-cta"
      >
        <div className="absolute inset-0">
          <motion.img
            initial={{ scale: 1.1 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
            src={dessertImage}
            alt="燕窝甜品"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        </div>

        <motion.div 
          className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <motion.span 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 text-sm text-white/90 glass px-4 py-2 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-secondary" />
            <span>Start Your Wellness Journey</span>
          </motion.span>

          <motion.h2
            variants={fadeInUp}
            className="font-serif text-2xl md:text-3xl lg:text-4xl font-semibold text-white mb-6"
            data-testid="text-cta-title"
          >
            立即订购新鲜燕窝
          </motion.h2>
          <motion.p 
            variants={fadeInUp}
            className="text-white/85 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            新鲜滋补，品质生活从此开始
            <br />
            通过WhatsApp或Meta店铺订购，享受专属优惠
          </motion.p>

          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto gap-2 text-base px-8"
              onClick={() => window.open(META_SHOP_LINK, "_blank")}
              data-testid="button-cta-meta"
            >
              <ShoppingBag className="w-5 h-5" />
              前往Meta店铺
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto gap-2 text-base px-8 glass border-white/20 text-white"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-cta-whatsapp"
            >
              <SiWhatsapp className="w-5 h-5" />
              WhatsApp联系
            </Button>
          </motion.div>

          <motion.div 
            variants={fadeIn}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/70 text-sm"
          >
            <span>营业时间: 周一至周日 9:00-21:00</span>
            <span className="hidden sm:inline">|</span>
            <span className="text-xs glass px-3 py-1 rounded-full">
              自动回复24小时内响应
            </span>
          </motion.div>
        </motion.div>
      </section>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
      <WhatsAppButton whatsappLink={WHATSAPP_LINK} />
      <ChristmasPromoPopup whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
