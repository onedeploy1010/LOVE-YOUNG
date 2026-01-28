import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { FlavorModal } from "@/components/FlavorModal";
import { OrderModal } from "@/components/OrderModal";
import { 
  ChevronDown,
  Heart,
  Zap,
  ShieldCheck,
  Users,
  UserPlus,
  TrendingUp,
  Globe,
  CheckCircle,
  BarChart3,
  Network,
  ArrowRight,
  ShoppingBag
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useState } from "react";
import type { Product, Testimonial } from "@shared/types";
import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";

const heroImage = "/pics/love_young_brand_identity_20260106043554_1.png";
const productImage1 = "/pics/love_young_luxury_gift_box_detailed_20260106045736_1.png";
const productImage2 = "/pics/love_young_gift_box_design_20260106043236_1.png";
const brandImage = "/pics/love_young_founders_story_20260106043351_1.png";
const productImage3 = "/pics/love_young_wellness_journey_20260106043338_1.png";

const WHATSAPP_PHONE = "60124017174";
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

export default function LandingPage() {
  const { t } = useLanguage();
  const [flavorModalOpen, setFlavorModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  const whatsappLink = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(t("landing.whatsappMessage"))}`;

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: testimonials } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={whatsappLink} metaShopLink={META_SHOP_LINK} />

      {/* Hero Section - 逆风启航 */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900" />
        
        {/* Background Image Overlay */}
        <div className="absolute inset-0 opacity-20">
          <img 
            src={heroImage} 
            alt="Background" 
            className="w-full h-full object-cover grayscale"
          />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-6 text-center text-white pt-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-amber-400 font-serif italic text-2xl lg:text-3xl mb-4"
            data-testid="text-hero-subtitle"
          >
            {t("landing.heroTagline")}
          </motion.h2>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif font-bold mb-6 leading-tight"
            data-testid="text-hero-title"
          >
            <span className="block">{t("landing.heroTitle")}</span>
            <span className="block bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 bg-clip-text text-transparent">
              {t("landing.heroTitleSub")}
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl font-light mb-10 opacity-90 px-4"
            data-testid="text-hero-description"
          >
            <span className="block">{t("landing.heroDesc")}</span>
            <span className="block mt-1">{t("landing.heroDescSub")}</span>
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4"
          >
            <Button 
              size="lg"
              className="bg-secondary text-secondary-foreground rounded-full px-6 sm:px-8 lg:px-10 text-base sm:text-lg whitespace-nowrap"
              onClick={() => setOrderModalOpen(true)}
              data-testid="button-hero-order"
            >
              {t("landing.heroOrderBtn")}
            </Button>
            <Link href="/partner">
              <Button 
                variant="outline"
                size="lg"
                className="border-white/70 text-white rounded-full px-6 sm:px-8 lg:px-10 text-base sm:text-lg bg-transparent whitespace-nowrap"
                data-testid="button-hero-partner"
              >
                {t("landing.heroPartnerBtn")}
              </Button>
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-50"
        >
          <ChevronDown className="w-8 h-8 text-white" />
        </motion.div>
      </section>

      {/* Brand Philosophy Section - 品牌故事 */}
      <section id="brand" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Image Side */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="lg:w-1/2 relative"
            >
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-400/10 rounded-full blur-3xl" />
              <img 
                src={brandImage} 
                alt="Brand Philosophy" 
                className="rounded-2xl shadow-2xl border-4 border-amber-400/20 max-h-[500px] object-cover"
                data-testid="img-brand-philosophy"
              />
              <div className="absolute -bottom-6 -right-6 bg-emerald-900 text-white p-6 rounded-xl shadow-xl max-w-xs">
                <p className="italic font-serif text-lg">"{t("landing.brandQuote")}"</p>
              </div>
            </motion.div>

            {/* Text Side */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="lg:w-1/2"
            >
              <motion.h2 
                variants={fadeInUp}
                className="text-3xl lg:text-5xl font-serif font-bold mb-8"
                data-testid="text-brand-title"
              >
                {t("landing.brandTitle")}<br />
                <span className="text-amber-500">{t("landing.brandTitleSub")}</span>
              </motion.h2>
              
              <motion.div variants={fadeInUp} className="space-y-6 text-muted-foreground leading-relaxed">
                <p>{t("landing.brandP1")}</p>
                <p className="font-semibold text-foreground">{t("landing.brandP2")}</p>
                <p>{t("landing.brandP3")}</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-10 grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-500">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="font-bold">{t("landing.brandSelfHealing")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-500">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="font-bold">{t("landing.brandAwakening")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-bold">{t("landing.brandQuality")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="font-bold">{t("landing.brandCommunity")}</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Section - 尊享鲜炖系列 */}
      <section id="products" className="py-24 bg-emerald-900 text-white">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-5xl font-serif font-bold mb-4" data-testid="text-products-title">
              {t("landing.productsTitle")}
            </h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto mb-6" />
            <p className="text-amber-400/80 max-w-2xl mx-auto">
              {t("landing.productsSubtitle")}
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Product Card 1 */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-white/5 border border-white/10 hover:border-amber-400/50 transition-all duration-500 group overflow-hidden">
                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={productImage1} 
                    alt={t("landing.productCard1Name")} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <Badge className="absolute top-4 right-4 bg-amber-500 text-white">Premium</Badge>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-amber-400 mb-2">{t("landing.productCard1Name")}</h3>
                  <p className="text-sm opacity-70 mb-4">{t("landing.productCard1Desc")}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">RM 488</span>
                    <Button 
                      size="sm" 
                      className="bg-secondary text-secondary-foreground rounded-full px-6"
                      onClick={() => setOrderModalOpen(true)}
                      data-testid="button-product-1-order"
                    >
                      {t("landing.bookNow")}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Product Card 2 */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-white/5 border border-white/10 hover:border-amber-400/50 transition-all duration-500 group overflow-hidden">
                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={productImage2} 
                    alt={t("landing.productCard2Name")} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-amber-400 mb-2">{t("landing.productCard2Name")}</h3>
                  <p className="text-sm opacity-70 mb-4">{t("landing.productCard2Desc")}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">RM 388 <small className="text-xs opacity-50">{t("landing.productCard2PriceFrom")}</small></span>
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="border-secondary text-secondary rounded-full px-6"
                      onClick={() => setFlavorModalOpen(true)}
                      data-testid="button-product-2-flavors"
                    >
                      {t("landing.viewFlavors")}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Product Card 3 - Coming Soon */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-white/5 border border-white/10 hover:border-amber-400/50 transition-all duration-500 group overflow-hidden">
                <div className="relative h-72 overflow-hidden">
                  <img 
                    src={productImage3} 
                    alt={t("landing.productCard3Name")} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-amber-400 font-bold tracking-widest uppercase border-2 border-amber-400 p-4">{t("landing.comingSoon")}</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-amber-400 mb-2">{t("landing.productCard3Name")}</h3>
                  <p className="text-sm opacity-70 mb-4">{t("landing.productCard3Desc")}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">{t("landing.comingSoon")}</span>
                    <Button 
                      size="sm" 
                      className="opacity-50 rounded-full px-6"
                      disabled
                    >
                      {t("landing.comingSoon")}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* RWA Partner Section - 联合经营人计划 */}
      <section id="rwa" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-3xl lg:text-5xl font-serif font-bold mb-4" data-testid="text-rwa-title">
              {t("landing.partnerSectionTitle")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("landing.partnerSectionSubtitle")}
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20"
          >
            {/* Phase 1 - Featured / HOT SELLING */}
            <motion.div variants={fadeInUp} className="lg:scale-105 z-10">
              <Card className="p-8 text-center bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-2xl relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white animate-pulse">
                  {t("landing.hotSelling")} · {t("landing.only50Slots")}
                </Badge>
                <div className="w-16 h-16 bg-amber-400 text-emerald-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">{t("landing.phase1Title")}</h3>
                <p className="text-sm opacity-80 mb-6">{t("landing.phase1Desc")}</p>
                <ul className="text-left text-sm space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    {t("landing.phase1Feature1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    {t("landing.phase1Feature2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    {t("landing.phase1Feature3")}
                  </li>
                </ul>
                <Link href="/partner">
                  <Button className="w-full bg-secondary text-secondary-foreground rounded-full border-none" data-testid="button-phase1-join">
                    {t("landing.limitedApply")}
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Phase 2 - Coming Soon / Disabled */}
            <motion.div variants={fadeInUp}>
              <Card className="p-8 text-center bg-muted/50 backdrop-blur border border-muted-foreground/20 opacity-60 relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted-foreground/50 text-muted-foreground">
                  {t("landing.comingSoon")}
                </Badge>
                <div className="w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-muted-foreground">{t("landing.phase2Title")}</h3>
                <p className="text-sm text-muted-foreground/70 mb-6">{t("landing.phase2Desc")}</p>
                <ul className="text-left text-sm space-y-3 mb-8 text-muted-foreground/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground/50" />
                    {t("landing.phase2Feature1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground/50" />
                    {t("landing.phase2Feature2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground/50" />
                    {t("landing.phase2Feature3")}
                  </li>
                </ul>
                <Button className="w-full rounded-full" variant="secondary" disabled data-testid="button-phase2-apply">
                  {t("landing.waitingToOpen")}
                </Button>
              </Card>
            </motion.div>

            {/* Phase 3 - Coming Soon / Disabled */}
            <motion.div variants={fadeInUp}>
              <Card className="p-8 text-center bg-muted/50 backdrop-blur border border-muted-foreground/20 opacity-60 relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted-foreground/50 text-muted-foreground">
                  {t("landing.comingSoon")}
                </Badge>
                <div className="w-16 h-16 bg-muted text-muted-foreground rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4 text-muted-foreground">{t("landing.phase3Title")}</h3>
                <p className="text-sm text-muted-foreground/70 mb-6">{t("landing.phase3Desc")}</p>
                <ul className="text-left text-sm space-y-3 mb-8 text-muted-foreground/70">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground/50" />
                    {t("landing.phase3Feature1")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground/50" />
                    {t("landing.phase3Feature2")}
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-muted-foreground/50" />
                    {t("landing.phase3Feature3")}
                  </li>
                </ul>
                <Button className="w-full rounded-full" variant="secondary" disabled data-testid="button-phase3-contact">
                  {t("landing.waitingToOpen")}
                </Button>
              </Card>
            </motion.div>
          </motion.div>

          {/* Revenue Logic */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="bg-card rounded-3xl p-10 shadow-xl border border-amber-400/10"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl lg:text-3xl font-serif font-bold mb-6">{t("landing.revenueLogicTitle")}</h3>
                <p className="text-muted-foreground mb-8">
                  {t("landing.revenueLogicDesc")}
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                    <span className="font-bold">{t("landing.salesCashback")}</span>
                    <span className="text-amber-500 font-bold">50% / 30%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                    <span className="font-bold">{t("landing.globalPool")}</span>
                    <span className="text-amber-500 font-bold">{t("landing.salesPercentage")}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                    <span className="font-bold">{t("landing.dividendCycle")}</span>
                    <span className="text-amber-500 font-bold">{t("landing.every10Days")}</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-900 rounded-2xl p-8 text-white">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Network className="text-amber-400" />
                  {t("landing.lyNetworkTitle")}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-white/10 rounded-lg">
                    <div className="text-xs opacity-50 uppercase">{t("landing.tier1Direct")}</div>
                    <div className="text-xl font-bold text-amber-400">20%</div>
                  </div>
                  <div className="p-3 border border-white/10 rounded-lg">
                    <div className="text-xs opacity-50 uppercase">{t("landing.tier2")}</div>
                    <div className="text-xl font-bold text-amber-400">15%</div>
                  </div>
                  <div className="p-3 border border-white/10 rounded-lg">
                    <div className="text-xs opacity-50 uppercase">{t("landing.tier3to5")}</div>
                    <div className="text-xl font-bold text-amber-400">10% ea</div>
                  </div>
                  <div className="p-3 border border-white/10 rounded-lg">
                    <div className="text-xs opacity-50 uppercase">{t("landing.tier6to10")}</div>
                    <div className="text-xl font-bold text-amber-400">5% ea</div>
                  </div>
                </div>
                <div className="mt-4 p-3 border border-amber-400/30 rounded-lg bg-amber-400/10 text-center">
                  <div className="text-xs opacity-70 uppercase">{t("landing.totalReferral")}</div>
                  <div className="text-2xl font-bold text-amber-400">100% LY</div>
                </div>
                <p className="mt-4 text-xs italic opacity-60">
                  {t("landing.lyNetworkNote")}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Dashboard Preview Section */}
      <section id="dashboard" className="py-24 bg-emerald-950">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-12">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="lg:w-1/3 text-white"
            >
              <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-6">{t("landing.dashboardTitle")}</h2>
              <p className="opacity-70 mb-10">
                {t("landing.dashboardDesc")}
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-400">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">{t("landing.dividendCycle")}</h4>
                    <p className="text-sm opacity-50">{t("landing.every10Days")}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">{t("landing.lyEnergy")}</h4>
                    <p className="text-sm opacity-50">{t("landing.lyNetworkNote")}</p>
                  </div>
                </div>
              </div>

              <Link href="/partner">
                <Button 
                  size="lg"
                  className="mt-10 bg-secondary text-secondary-foreground rounded-full gap-2" data-testid="button-dashboard-learn-more"
                >
                  {t("landing.dashboardCta")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="lg:w-2/3"
            >
              <Card className="bg-white rounded-3xl p-8 shadow-2xl overflow-hidden border-t-8 border-amber-400">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-900 text-white rounded-full flex items-center justify-center font-bold">
                      LY
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900">{t("landing.dashboardBrandName")}</p>
                      <p className="text-xs text-gray-500">{t("landing.dashboardSubtitle")}</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">Phase 2</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 sm:p-4 rounded-xl">
                    <p className="text-xs text-emerald-600 uppercase">{t("landing.lyEnergy")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-900">2,580</p>
                    <p className="text-xs text-emerald-500">+120 {t("landing.thisWeek")}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 rounded-xl">
                    <p className="text-xs text-amber-600 uppercase">{t("landing.totalEarnings")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-700">RM 3,240</p>
                    <p className="text-xs text-amber-500">+RM 580 {t("landing.thisMonth")}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl">
                    <p className="text-xs text-purple-600 uppercase">{t("landing.teamMembers")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-700">28</p>
                    <p className="text-xs text-purple-500">{t("landing.networkLevels")}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-700">{t("landing.currentPoolCycle")}</span>
                    <span className="text-xs text-gray-500">{t("landing.daysRemaining", { days: 6 })}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-amber-500 h-3 rounded-full" style={{ width: "40%" }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{t("landing.accumulated")}: RM 12,580</span>
                    <span>{t("landing.estimatedDividend")}: RM 380</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl lg:text-5xl font-serif font-bold mb-6"
            >
              {t("landing.ctaTitle")}
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg opacity-80 max-w-2xl mx-auto mb-10"
            >
              {t("landing.ctaDesc")}
            </motion.p>
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4"
            >
              <Button 
                size="lg"
                className="bg-secondary text-secondary-foreground rounded-full px-6 sm:px-8 gap-2 whitespace-nowrap"
                onClick={() => setOrderModalOpen(true)}
                data-testid="button-cta-order"
              >
                <ShoppingBag className="w-5 h-5" />
                {t("landing.orderNow")}
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-white/70 text-white rounded-full px-6 sm:px-8 gap-2 bg-transparent whitespace-nowrap"
                onClick={() => window.open(whatsappLink, "_blank")}
                data-testid="button-cta-whatsapp"
              >
                <SiWhatsapp className="w-5 h-5" />
                {t("header.whatsapp")}
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer whatsappLink={whatsappLink} metaShopLink={META_SHOP_LINK} />
      <WhatsAppButton whatsappLink={whatsappLink} />
      <FlavorModal open={flavorModalOpen} onOpenChange={setFlavorModalOpen} />
      <OrderModal 
        open={orderModalOpen} 
        onOpenChange={setOrderModalOpen} 
        whatsappLink={whatsappLink}
        metaShopLink={META_SHOP_LINK}
      />
    </div>
  );
}
