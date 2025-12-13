import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ProductCard } from "@/components/ProductCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { ChristmasPromoPopup } from "@/components/ChristmasPromoPopup";
import { FlavorModal } from "@/components/FlavorModal";
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
  Play,
  Package,
  Info
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import type { Product, Testimonial } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";

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
  const { t } = useLanguage();
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
    <div className="countdown-badge-mega inline-flex items-center gap-2.5 text-white font-medium shadow-lg" data-testid="badge-freshness-timer">
      <Timer className="w-4 h-4" />
      <span className="countdown-label">{t("hero.nextBatch")}</span>
      <span className="countdown-number">{hours}h {minutes}m {seconds}s</span>
    </div>
  );
}

function FlavorTicker() {
  const { t } = useLanguage();
  const flavorTags = [
    t("flavors.original"), t("flavors.redDate"), t("flavors.snowPear"), t("flavors.peachGum"),
    t("flavors.coconut"), t("flavors.mango"), t("flavors.fishMawOriginal"), t("flavors.fishMawRedDate")
  ];
  
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
  const { t } = useLanguage();
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  const handleViewProduct = (product: Product) => {
    window.open(WHATSAPP_LINK, "_blank");
  };

  const [flavorModalOpen, setFlavorModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const innovationPillars = [
    {
      icon: Beaker,
      title: t("innovation.science"),
      subtitle: t("innovation.scienceSub"),
      description: t("innovation.scienceDesc"),
      stat: "98%",
      statLabel: t("innovation.scienceStat")
    },
    {
      icon: Snowflake,
      title: t("innovation.coldChain"),
      subtitle: t("innovation.coldChainSub"),
      description: t("innovation.coldChainDesc"),
      stat: "4°C",
      statLabel: t("innovation.coldChainStat")
    },
    {
      icon: Timer,
      title: t("innovation.freshDaily"),
      subtitle: t("innovation.freshDailySub"),
      description: t("innovation.freshDailyDesc"),
      stat: "24h",
      statLabel: t("innovation.freshDailyStat")
    },
    {
      icon: Zap,
      title: t("innovation.fullPortion"),
      subtitle: t("innovation.fullPortionSub"),
      description: t("innovation.fullPortionDesc"),
      stat: "120g",
      statLabel: t("innovation.fullPortionStat")
    }
  ];

  const orderSteps = [
    {
      icon: MessageCircle,
      title: t("order.step1"),
      description: t("order.step1Desc"),
      color: "from-emerald-400 to-teal-500"
    },
    {
      icon: ShoppingBag,
      title: t("order.step2"),
      description: t("order.step2Desc"),
      color: "from-amber-400 to-orange-500"
    },
    {
      icon: Truck,
      title: t("order.step3"),
      description: t("order.step3Desc"),
      color: "from-cyan-400 to-blue-500"
    }
  ];

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
                className="hero-title-mega mb-6"
                data-testid="text-hero-title"
              >
                <span className="block">{t("hero.fresh")}</span>
                <span className="block hero-title-gradient hero-title-neon">{t("hero.noCompromise")}</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                transition={{ duration: 0.7 }}
                className="hero-subtitle-mobile text-white/95 mb-3 font-bold"
                data-testid="text-hero-subtitle"
              >
                {t("hero.subtitle")}
              </motion.p>

              <motion.p
                variants={fadeInUp}
                className="hero-desc-mobile text-white/80 mb-6 leading-relaxed max-w-lg"
              >
                {t("hero.description")}
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
                  {t("hero.orderNow")}
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
                  {t("hero.exploreFlavors")}
                </Button>
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
                      {t("hero.bestseller")}
                    </Badge>
                    <h3 className="text-2xl font-bold text-white mb-2" data-testid="text-hero-product-title">{t("hero.giftBox")}</h3>
                    <p className="text-white/70" data-testid="text-hero-product-description">{t("hero.giftBoxDesc")}</p>
                  </div>
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between text-white/80">
                      <span>{t("hero.original")}</span>
                      <span className="font-medium text-white">RM226</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span>{t("hero.redDate")}</span>
                      <span className="font-medium text-white">RM226</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <span>{t("hero.fishMaw")}</span>
                      <span className="font-medium text-white">RM226</span>
                    </div>
                  </div>
                  <div className="border-t border-white/20 pt-4 mb-4">
                    <div className="flex items-end justify-between">
                      <span className="text-white/70">{t("hero.giftPrice")}</span>
                      <div data-testid="text-hero-product-price">
                        <span className="text-3xl font-black text-white">RM226</span>
                        <span className="text-white/50 text-sm">{t("hero.perBox")}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    className="w-full gap-2 electric-gradient border-0 text-white font-bold"
                    onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                    data-testid="button-hero-card-order"
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    {t("hero.whatsappOrder")}
                  </Button>
                </Card>
              </div>
            </motion.div>
          </div>
        </div>

      </section>

      <FlavorTicker />

      <section className="py-16 md:py-24 stats-section-creative relative overflow-hidden" data-testid="section-stats">
        <div className="stats-bg-pattern" />
        <div className="stats-floating-orb stats-orb-1" />
        <div className="stats-floating-orb stats-orb-2" />
        <div className="stats-floating-orb stats-orb-3" />
        
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={fadeInUp}
          >
            <h2 className="stats-title-mega" data-testid="text-stats-title">
              {t("stats.whyTrust")}
            </h2>
            <div className="stats-title-underline" />
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={scaleIn} className="stats-card-creative group">
              <div className="stats-card-glow stats-glow-rose" />
              <div className="stats-icon-creative bg-gradient-to-br from-rose-500 to-pink-600">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div className="stats-number-creative">
                <AnimatedCounter value={2000} suffix="+" />
              </div>
              <div className="stats-label-creative">{t("stats.customersLabel")}</div>
              <div className="stats-sublabel-creative">{t("stats.customersSub")}</div>
            </motion.div>

            <motion.div variants={scaleIn} className="stats-card-creative group">
              <div className="stats-card-glow stats-glow-violet" />
              <div className="stats-icon-creative bg-gradient-to-br from-violet-500 to-purple-600">
                <Beaker className="w-7 h-7 text-white" />
              </div>
              <div className="stats-number-creative">
                <AnimatedCounter value={8} suffix="" />
              </div>
              <div className="stats-label-creative">{t("stats.flavorsLabel")}</div>
              <div className="stats-sublabel-creative">{t("stats.flavorsSub")}</div>
            </motion.div>

            <motion.div variants={scaleIn} className="stats-card-creative group">
              <div className="stats-card-glow stats-glow-cyan" />
              <div className="stats-icon-creative bg-gradient-to-br from-cyan-500 to-teal-600">
                <Snowflake className="w-7 h-7 text-white" />
              </div>
              <div className="stats-number-creative">
                <AnimatedCounter value={24} suffix="h" />
              </div>
              <div className="stats-label-creative">{t("stats.freshLabel")}</div>
              <div className="stats-sublabel-creative">{t("stats.freshSub")}</div>
            </motion.div>

            <motion.div variants={scaleIn} className="stats-card-creative group">
              <div className="stats-card-glow stats-glow-amber" />
              <div className="stats-icon-creative bg-gradient-to-br from-amber-500 to-orange-600">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <div className="stats-number-creative">
                <AnimatedCounter value={98} suffix="%" />
              </div>
              <div className="stats-label-creative">{t("stats.ratingLabel")}</div>
              <div className="stats-sublabel-creative">{t("stats.ratingSub")}</div>
            </motion.div>
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
                  {t("products.discovery")}
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight"
                data-testid="text-products-title"
              >
                {t("products.explore")}<span className="gradient-text">{t("products.flavors")}</span>
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
                {t("products.viewAll")}
                <ChevronRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
          >
            <motion.div variants={scaleIn}>
              <Card className="p-6 relative h-full" data-testid="card-package-one">
                <Badge className="absolute top-4 right-4 bg-primary/10 text-primary border-primary/20" data-testid="badge-popular">
                  {t("packages.popular")}
                </Badge>
                <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/20 to-orange-500/10">
                  <Package className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-package-one-title">
                  {t("packages.oneBox")}
                </h3>
                <p className="text-muted-foreground mb-1" data-testid="text-package-one-desc">
                  {t("packages.oneBoxDesc")}
                </p>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-package-one-info">
                  {t("packages.oneBoxInfo")}
                </p>
                <div className="mb-6">
                  <span className="text-3xl font-black gradient-text" data-testid="text-package-one-price">
                    {t("packages.oneBoxPrice")}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">{t("packages.perJar")}</span>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setFlavorModalOpen(true)}
                    data-testid="button-package-one-flavor"
                  >
                    <Info className="w-4 h-4" />
                    {t("packages.chooseFlavor")}
                  </Button>
                  <Button
                    className="w-full gap-2 electric-gradient border-0 text-white font-bold"
                    onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                    data-testid="button-package-one-order"
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    {t("packages.preOrder")}
                  </Button>
                </div>
              </Card>
            </motion.div>

            <motion.div variants={scaleIn}>
              <Card className="p-6 relative h-full border-primary/30" data-testid="card-package-two">
                <Badge className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" data-testid="badge-best-value">
                  {t("packages.bestValue")}
                </Badge>
                <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/10">
                  <Package className="w-7 h-7 text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2" data-testid="text-package-two-title">
                  {t("packages.twoBox")}
                </h3>
                <p className="text-muted-foreground mb-1" data-testid="text-package-two-desc">
                  {t("packages.twoBoxDesc")}
                </p>
                <p className="text-sm text-muted-foreground mb-4" data-testid="text-package-two-info">
                  {t("packages.twoBoxInfo")}
                </p>
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-3xl font-black gradient-text" data-testid="text-package-two-price">
                    {t("packages.twoBoxPrice")}
                  </span>
                  <Badge variant="secondary" className="text-xs" data-testid="badge-save">
                    {t("packages.twoBoxSave")}
                  </Badge>
                </div>
                <div className="flex flex-col gap-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => setFlavorModalOpen(true)}
                    data-testid="button-package-two-flavor"
                  >
                    <Info className="w-4 h-4" />
                    {t("packages.chooseFlavor")}
                  </Button>
                  <Button
                    className="w-full gap-2 electric-gradient border-0 text-white font-bold"
                    onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                    data-testid="button-package-two-order"
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    {t("packages.preOrder")}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
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
                {t("innovation.whyDifferent")}
              </span>
              <div className="w-8 h-1 bg-gradient-to-r from-teal-500 to-amber-400 rounded-full" />
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground mb-4"
              data-testid="text-innovation-title"
            >
              {t("innovation.title")}<span className="gradient-text">{t("innovation.subtitle")}</span>
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              {t("innovation.description")}
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
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`innovation-delay-${index + 1}`}
              >
                <div
                  className="innovation-card-dynamic h-full relative z-10"
                  data-testid={`innovation-pillar-${index}`}
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 innovation-icon-float innovation-icon-glow">
                    <pillar.icon className="w-8 h-8 text-emerald-500" />
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
                    <div className="innovation-stat">{pillar.stat}</div>
                    <div className="text-xs text-muted-foreground font-medium">{pillar.statLabel}</div>
                  </div>
                </div>
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
              {t("order.title")}<span className="gradient-text">{t("order.subtitle")}</span>
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
              {t("order.whatsappOrder")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => window.open(META_SHOP_LINK, "_blank")}
              data-testid="button-order-meta"
            >
              <ShoppingBag className="w-5 h-5" />
              {t("order.metaShop")}
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
                  {t("testimonials.realReviews")}
                </span>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground"
                data-testid="text-testimonials-title"
              >
                {t("testimonials.title")}<span className="gradient-text">{t("testimonials.subtitle")}</span>
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
                <span className="text-muted-foreground text-sm"> / 5 {t("testimonials.rating")}</span>
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
                            {t("testimonials.repeatCustomer")}
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
              {t("cta.title")}<br />
              <span className="neon-text">{t("cta.subtitle")}</span>
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-white/80 text-lg mb-8 leading-relaxed"
            >
              {t("cta.description")}
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
                {t("cta.whatsappOrder")}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base glass border-white/30 text-white"
                onClick={() => window.open(META_SHOP_LINK, "_blank")}
                data-testid="button-cta-meta"
              >
                <ShoppingBag className="w-5 h-5" />
                {t("cta.metaShop")}
              </Button>
            </motion.div>

            <motion.div 
              variants={fadeInUp}
              className="mt-8 flex items-center gap-6 text-white/60 text-sm"
            >
              <span>{t("cta.hours")}</span>
              <span className="glass px-3 py-1 rounded-full text-xs">
                {t("cta.reply")}
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
      <WhatsAppButton whatsappLink={WHATSAPP_LINK} />
      <ChristmasPromoPopup whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
      <FlavorModal open={flavorModalOpen} onOpenChange={setFlavorModalOpen} />
    </div>
  );
}
