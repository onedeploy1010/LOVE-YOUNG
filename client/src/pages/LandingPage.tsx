import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductCard } from "@/components/ProductCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { ChristmasPromoPopup } from "@/components/ChristmasPromoPopup";
import { 
  ShoppingBag, 
  Truck, 
  MessageCircle, 
  ChevronRight, 
  Loader2, 
  Zap, 
  Beaker, 
  Snowflake, 
  Timer,
  TrendingUp,
  Heart,
  Star,
  ArrowRight,
  Play
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import type { Product, Testimonial } from "@shared/schema";

import heroImage from "@assets/generated_images/premium_bird's_nest_hero_image.png";
import processImage from "@assets/generated_images/bird's_nest_preparation_process.png";
import dessertImage from "@assets/generated_images/prepared_bird's_nest_dessert.png";

const WHATSAPP_PHONE = "60124017174";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我对LOVEYOUNG燕窝花胶产品感兴趣，想了解更多信息。")}`;
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0 }
};

const slideInRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0 }
};

const innovationPillars = [
  {
    icon: Beaker,
    title: "科学配比",
    subtitle: "Lab-Tested",
    description: "每份含量经过精确计算，营养成分最优配比",
    stat: "98%",
    statLabel: "营养保留率"
  },
  {
    icon: Snowflake,
    title: "冷链锁鲜",
    subtitle: "Cold Chain",
    description: "从炖煮到送达全程4°C冷链，锁住新鲜",
    stat: "4°C",
    statLabel: "全程恒温"
  },
  {
    icon: Timer,
    title: "当日鲜炖",
    subtitle: "Fresh Daily",
    description: "坚持每日现炖，绝不隔夜，新鲜看得见",
    stat: "24h",
    statLabel: "炖煮周期"
  },
  {
    icon: Zap,
    title: "足量实在",
    subtitle: "Full Portion",
    description: "拒绝缩水，每罐都是满满的真材实料",
    stat: "120g",
    statLabel: "净含量"
  }
];

const orderSteps = [
  {
    icon: MessageCircle,
    title: "WhatsApp咨询",
    description: "一键联系，专属顾问在线解答",
    color: "from-emerald-400 to-teal-500"
  },
  {
    icon: ShoppingBag,
    title: "选择口味",
    description: "8款经典口味任你挑选",
    color: "from-amber-400 to-orange-500"
  },
  {
    icon: Truck,
    title: "冷链配送",
    description: "专业冷链，新鲜到家",
    color: "from-cyan-400 to-blue-500"
  }
];

const flavorTags = [
  "原味燕窝", "红枣枸杞", "冰糖雪梨", "桃胶银耳", 
  "椰汁燕窝", "芒果燕窝", "花胶原味", "花胶红枣"
];

function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const animation = animate(count, value, { duration: 2, ease: "easeOut" });
    const unsubscribe = rounded.on("change", (v) => setDisplayValue(v));
    return () => {
      animation.stop();
      unsubscribe();
    };
  }, [value, count, rounded]);

  return <span className="stat-number">{displayValue}{suffix}</span>;
}

function FreshnessTimer() {
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const getNextBatch = () => {
      const now = new Date();
      const nextBatch = new Date();
      nextBatch.setHours(6, 0, 0, 0);
      if (now.getHours() >= 6) {
        nextBatch.setDate(nextBatch.getDate() + 1);
      }
      return nextBatch;
    };

    const updateTimer = () => {
      const nowTime = new Date();
      const nextBatch = getNextBatch();
      const diff = Math.max(0, nextBatch.getTime() - nowTime.getTime());
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setHours(h);
      setMinutes(m);
      setSeconds(s);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fresh-badge px-4 py-2 rounded-full inline-flex items-center gap-3 text-white font-medium" data-testid="badge-freshness-timer">
      <Timer className="w-5 h-5" />
      <span className="text-sm">下一批鲜炖</span>
      <span className="font-bold text-lg tabular-nums">{hours}h {minutes}m {seconds}s</span>
    </div>
  );
}

function FlavorTicker() {
  return (
    <div className="overflow-hidden py-4 bg-gradient-to-r from-transparent via-card to-transparent">
      <div className="flavor-ticker flex gap-6 whitespace-nowrap">
        {[...flavorTags, ...flavorTags].map((flavor, index) => (
          <span 
            key={index} 
            className="tag-pill px-4 py-2 rounded-full text-sm font-medium text-foreground"
          >
            {flavor}
          </span>
        ))}
      </div>
    </div>
  );
}

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

  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

      <section
        className="relative min-h-screen flex items-center overflow-hidden"
        data-testid="section-hero"
      >
        <div className="absolute inset-0">
          <motion.img
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            src={heroImage}
            alt="LOVEYOUNG燕窝花胶"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <FreshnessTimer />
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                transition={{ duration: 0.7 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight"
                data-testid="text-hero-title"
              >
                <span className="block">新鲜</span>
                <span className="block neon-text">不将就</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.7 }}
                className="text-xl md:text-2xl text-white/90 mb-4 font-medium"
                data-testid="text-hero-subtitle"
              >
                LOVEYOUNG 燕窝花胶 · 每日鲜炖
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="text-base md:text-lg text-white/70 mb-8 leading-relaxed max-w-lg"
              >
                拒绝防腐剂，拒绝隔夜货。我们坚持当日炖煮、冷链直达，
                只为给你最新鲜的滋补体验。
              </motion.p>

              <motion.div 
                variants={fadeInUp}
                className="flex flex-col sm:flex-row items-start gap-4 mb-8"
              >
                <Button
                  size="lg"
                  className="gap-2 text-base electric-gradient border-0 text-white font-bold"
                  onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                  data-testid="button-hero-order"
                >
                  立即订购
                  <ArrowRight className="w-5 h-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 text-base glass border-white/30 text-white"
                  onClick={() => {
                    const el = document.querySelector("#products");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  data-testid="button-hero-browse"
                >
                  <Play className="w-4 h-4" />
                  探索口味
                </Button>
              </motion.div>

              <motion.div 
                variants={fadeInUp}
                className="flex items-center gap-6 flex-wrap"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-400 border-2 border-white/20 flex items-center justify-center text-xs font-bold text-white"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span className="text-white/80 text-sm">
                    <span className="font-bold text-white">2,000+</span> 回头客
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                  <span className="text-white/80 text-sm ml-1">4.9/5</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 60, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="hidden lg:block"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-amber-500/20 rounded-3xl blur-2xl" />
                <Card className="relative p-6 bg-white/10 backdrop-blur-xl border-white/20" data-testid="card-hero-product">
                  <div className="text-center mb-6">
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 mb-3" data-testid="badge-hero-bestseller">
                      本月热卖
                    </Badge>
                    <h3 className="text-2xl font-bold text-white mb-2" data-testid="text-hero-product-title">燕窝花胶礼盒</h3>
                    <p className="text-white/70" data-testid="text-hero-product-description">6罐装 · 每罐120g</p>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-white/80">
                      <span>原味燕窝 x2</span>
                      <span className="font-medium text-white">RM226</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span>红枣枸杞 x2</span>
                      <span className="font-medium text-white">RM226</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span>花胶原味 x2</span>
                      <span className="font-medium text-white">RM226</span>
                    </div>
                  </div>
                  <div className="border-t border-white/20 pt-4 mb-4">
                    <div className="flex items-end justify-between">
                      <span className="text-white/70">礼盒价</span>
                      <div data-testid="text-hero-product-price">
                        <span className="text-3xl font-black text-white">RM226</span>
                        <span className="text-white/50 text-sm">/盒</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full gap-2 electric-gradient border-0 text-white font-bold"
                    onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                    data-testid="button-hero-card-order"
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    WhatsApp下单
                  </Button>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ 
            opacity: { delay: 2, duration: 0.5 },
            y: { repeat: Infinity, duration: 2, ease: "easeInOut" }
          }}
        >
          <div className="w-6 h-10 border-2 border-white/40 rounded-full flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-white/60 rounded-full" />
          </div>
        </motion.div>
      </section>

      <FlavorTicker />

      <section className="py-16 md:py-24 bg-background relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {[
              { value: 2000, suffix: "+", label: "满意客户" },
              { value: 8, suffix: "款", label: "口味选择" },
              { value: 24, suffix: "h", label: "新鲜周期" },
              { value: 98, suffix: "%", label: "好评率" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="text-center p-6"
              >
                <div className="text-4xl md:text-5xl font-black mb-2">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-muted-foreground font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section
        id="products"
        className="py-16 md:py-24 lg:py-32 bg-card"
        data-testid="section-products"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <div>
              <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
                <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" />
                <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                  Flavor Discovery
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight"
                data-testid="text-products-title"
              >
                探索<span className="gradient-text">8款口味</span>
              </motion.h2>
            </div>
            <motion.div variants={fadeInUp}>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => window.open(META_SHOP_LINK, "_blank")}
                data-testid="button-view-all-products"
              >
                查看全部
                <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>

          {productsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div 
              ref={scrollRef}
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
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="flavor-card"
                >
                  <ProductCard
                    product={product}
                    onViewDetails={handleViewProduct}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <section
        id="innovation"
        className="py-16 md:py-24 lg:py-32 bg-background relative overflow-hidden"
        data-testid="section-innovation"
      >
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" />
              <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                Why Different
              </span>
              <div className="w-8 h-1 bg-gradient-to-r from-teal-500 to-amber-400 rounded-full" />
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-4"
              data-testid="text-innovation-title"
            >
              创新<span className="gradient-text">不止于此</span>
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              我们重新定义鲜炖燕窝，用科技守护新鲜，用匠心成就品质
            </motion.p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            {innovationPillars.map((pillar, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <Card
                  className="innovation-card p-6 h-full relative z-10 bg-card"
                  data-testid={`innovation-pillar-${index}`}
                >
                  <div className="w-14 h-14 mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10">
                    <pillar.icon className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="mb-4">
                    <h3 className="font-bold text-xl text-foreground mb-1">
                      {pillar.title}
                    </h3>
                    <span className="text-xs font-medium text-muted-foreground tracking-wider uppercase">
                      {pillar.subtitle}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {pillar.description}
                  </p>
                  <div className="mt-auto pt-4 border-t border-border">
                    <div className="text-3xl font-black gradient-text">{pillar.stat}</div>
                    <div className="text-xs text-muted-foreground font-medium">{pillar.statLabel}</div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section
        id="how-to-order"
        className="py-16 md:py-24 bg-card relative"
        data-testid="section-how-to-order"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-black text-foreground mb-4"
              data-testid="text-order-title"
            >
              三步下单，<span className="gradient-text">新鲜到家</span>
            </motion.h2>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
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
                className="relative"
              >
                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} shadow-lg`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-foreground text-background font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {step.description}
                  </p>
                </div>
                {index < orderSteps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[calc(50%+50px)] w-[calc(100%-100px)] h-0.5 bg-gradient-to-r from-border to-border/50" />
                )}
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              className="gap-2 electric-gradient border-0 text-white font-bold"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-order-whatsapp"
            >
              <SiWhatsapp className="w-5 h-5" />
              WhatsApp下单
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => window.open(META_SHOP_LINK, "_blank")}
              data-testid="button-order-meta"
            >
              <ShoppingBag className="w-5 h-5" />
              Meta店铺购买
            </Button>
          </motion.div>
        </div>
      </section>

      <section
        id="testimonials"
        className="py-16 md:py-24 lg:py-32 bg-background relative overflow-hidden"
        data-testid="section-testimonials"
      >
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <div>
              <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-rose-500" />
                <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">
                  Real Reviews
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
                data-testid="text-testimonials-title"
              >
                客户<span className="gradient-text">真心话</span>
              </motion.h2>
            </div>
            <motion.div variants={fadeInUp} className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <div>
                <span className="font-bold text-foreground">4.9</span>
                <span className="text-muted-foreground text-sm"> / 5 评分</span>
              </div>
            </motion.div>
          </motion.div>

          {testimonialsLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                >
                  <Card className="p-6 h-full relative" data-testid={`card-testimonial-${testimonial.id}`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground">{testimonial.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {testimonial.productType}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            回购客户
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center gap-1 mt-4">
                      {[1,2,3,4,5].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </Card>
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
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
        </div>

        <motion.div 
          className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
        >
          <div className="max-w-2xl">
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 leading-tight"
              data-testid="text-cta-title"
            >
              开启你的<br />
              <span className="neon-text">新鲜之旅</span>
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-white/80 text-lg mb-8 leading-relaxed"
            >
              现在下单，享受专属新客优惠。每日限量鲜炖，先到先得！
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Button
                size="lg"
                className="gap-2 text-base electric-gradient border-0 text-white font-bold"
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                data-testid="button-cta-whatsapp"
              >
                <SiWhatsapp className="w-5 h-5" />
                WhatsApp立即下单
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base glass border-white/30 text-white"
                onClick={() => window.open(META_SHOP_LINK, "_blank")}
                data-testid="button-cta-meta"
              >
                <ShoppingBag className="w-5 h-5" />
                前往Meta店铺
              </Button>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="mt-8 flex items-center gap-6 text-white/60 text-sm"
            >
              <span>营业时间: 9:00-21:00</span>
              <span className="glass px-3 py-1 rounded-full text-xs">
                24h内回复
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
      <WhatsAppButton whatsappLink={WHATSAPP_LINK} />
      <ChristmasPromoPopup whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
