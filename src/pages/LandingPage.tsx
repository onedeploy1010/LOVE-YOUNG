import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FlavorModal } from "@/components/FlavorModal";
import { OrderModal } from "@/components/OrderModal";
import { BundleOrderModal } from "@/components/BundleOrderModal";
import { FortuneGiftBoxModal } from "@/components/FortuneGiftBoxModal";
import { ShakeButton, GoldCoinButton } from "@/components/ui/animated-buttons";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
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
  ShoppingBag,
  Flame,
  Sparkles,
  Star,
  Package,
  Loader2
} from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { motion } from "framer-motion";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";

const heroImage = "/pics/love_young_brand_identity_20260106043554_1.png";
const brandImage = "/pics/love_young_founders_story_20260106043351_1.png";

const WHATSAPP_PHONE = "60178228658";
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

interface HeroSettings {
  bundle_id: string | null;
  title: string;
  title_en: string;
  title_ms: string;
  subtitle: string;
  subtitle_en: string;
  subtitle_ms: string;
  button_text: string;
  button_text_en: string;
  button_text_ms: string;
  button_link: string;
  background_image: string;
}

interface BundleItem {
  flavor: string;
  quantity: number;
}

interface Bundle {
  id: string;
  name: string;
  name_en: string | null;
  name_ms: string | null;
  description: string | null;
  target_audience: string | null;
  target_audience_en: string | null;
  target_audience_ms: string | null;
  keywords: string | null;
  keywords_en: string | null;
  keywords_ms: string | null;
  price: number;
  original_price: number | null;
  image: string | null;
  items: BundleItem[];
  is_hot: boolean;
  is_new: boolean;
}

export default function LandingPage() {
  const { t, language } = useLanguage();
  const [flavorModalOpen, setFlavorModalOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [fortuneModalOpen, setFortuneModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);

  // Fetch hero settings
  const { data: heroSettings } = useQuery({
    queryKey: ["site-settings-hero"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("id", "hero")
        .single();
      if (error) return null;
      return data?.value as HeroSettings;
    },
  });

  // Fetch featured bundles
  const { data: featuredBundles = [], isLoading: loadingBundles } = useQuery({
    queryKey: ["featured-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(4);
      if (error) {
        console.error("Error fetching bundles:", error);
        return [];
      }
      return data as Bundle[];
    },
  });

  // Fetch CNY gift box bundle (first hot bundle or first featured bundle)
  const { data: cnyBundle } = useQuery({
    queryKey: ["cny-bundle"],
    queryFn: async () => {
      // Try to find a hot bundle first (likely CNY special)
      const { data: hotBundle } = await supabase
        .from("product_bundles")
        .select("*")
        .eq("is_active", true)
        .eq("is_hot", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .single();
      if (hotBundle) return hotBundle as Bundle;

      // Fallback to first featured bundle
      const { data: featuredBundle } = await supabase
        .from("product_bundles")
        .select("*")
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(1)
        .single();
      return featuredBundle as Bundle | null;
    },
  });

  // Handle CNY gift box order - opens the FortuneGiftBoxModal
  const handleCnyOrder = () => {
    setFortuneModalOpen(true);
  };

  const whatsappLink = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(t("landing.whatsappMessage"))}`;

  // Helper to get localized text
  const getLocalizedText = (zh: string | null | undefined, en: string | null | undefined, ms: string | null | undefined) => {
    if (language === "en") return en || zh || "";
    if (language === "ms") return ms || en || zh || "";
    return zh || "";
  };

  // Get hero text based on language
  const heroTitle = heroSettings ? getLocalizedText(heroSettings.title, heroSettings.title_en, heroSettings.title_ms) : t("landing.heroTitle");
  const heroSubtitle = heroSettings ? getLocalizedText(heroSettings.subtitle, heroSettings.subtitle_en, heroSettings.subtitle_ms) : t("landing.heroDesc");
  const heroButtonText = heroSettings ? getLocalizedText(heroSettings.button_text, heroSettings.button_text_en, heroSettings.button_text_ms) : t("landing.heroOrderBtn");
  const heroBgImage = heroSettings?.background_image || heroImage;

  const handleBundleOrder = (bundle: Bundle) => {
    setSelectedBundle(bundle);
    setBundleModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={whatsappLink} metaShopLink={META_SHOP_LINK} />

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-950 to-emerald-900" />
        <div className="absolute inset-0 opacity-20">
          <img
            src={heroBgImage}
            alt="Background"
            className="w-full h-full object-cover grayscale"
          />
        </div>

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
            <span className="block">{heroTitle}</span>
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
            <span className="block">{heroSubtitle}</span>
            <span className="block mt-1">{t("landing.heroDescSub")}</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 px-4"
          >
            {/* Gift box button - isolated container with fixed dimensions to prevent layout shift */}
            <div className="relative h-14 flex items-center justify-center min-w-[200px]">
              <ShakeButton>
                <Button
                  size="lg"
                  className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold rounded-full px-8 sm:px-10 py-3 text-base sm:text-lg shadow-xl hover:shadow-2xl transition-all duration-300 whitespace-nowrap"
                  onClick={handleCnyOrder}
                  data-testid="button-hero-order"
                >
                  {t("landing.cnyGiftBox")}
                </Button>
              </ShakeButton>
            </div>
            {/* Partner button - isolated container with fixed dimensions to prevent layout shift */}
            <div className="relative h-14 flex items-center justify-center min-w-[180px]">
              <GoldCoinButton>
                <Link href="/partner">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-white/70 text-white rounded-full px-6 sm:px-8 lg:px-10 text-base sm:text-lg bg-transparent whitespace-nowrap hover:bg-white/10"
                    data-testid="button-hero-partner"
                  >
                    {t("landing.heroPartnerBtn")}
                  </Button>
                </Link>
              </GoldCoinButton>
            </div>
          </motion.div>
        </div>

        {/* Floating particles for background animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 4 + Math.random() * 8,
                height: 4 + Math.random() * 8,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `radial-gradient(circle, rgba(255,215,0,${0.3 + Math.random() * 0.4}) 0%, transparent 70%)`,
              }}
              animate={{
                y: [0, -30 - Math.random() * 50, 0],
                x: [0, (Math.random() - 0.5) * 40, 0],
                opacity: [0.3, 0.7, 0.3],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-50"
        >
          <ChevronDown className="w-8 h-8 text-white" />
        </motion.div>
      </section>

      {/* Brand Philosophy Section */}
      <section id="brand" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
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

      {/* Products Section - 套装配套 */}
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

          {loadingBundles ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            </div>
          ) : featuredBundles.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto text-amber-400/50 mb-4" />
              <p className="text-amber-400/60">{t("landing.noProducts")}</p>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {featuredBundles.map((bundle) => {
                const bundleName = getLocalizedText(bundle.name, bundle.name_en, bundle.name_ms);
                const bundleTarget = getLocalizedText(bundle.target_audience, bundle.target_audience_en, bundle.target_audience_ms);
                const bundleKeywords = getLocalizedText(bundle.keywords, bundle.keywords_en, bundle.keywords_ms);

                return (
                  <motion.div key={bundle.id} variants={fadeInUp}>
                    <Card className="bg-white/5 border border-white/10 hover:border-amber-400/50 transition-all duration-500 group overflow-hidden h-full flex flex-col">
                      <div className="relative h-48 sm:h-56 overflow-hidden bg-emerald-800/50">
                        {bundle.image ? (
                          <img
                            src={bundle.image}
                            alt={bundleName}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-16 h-16 text-amber-400/30" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          {bundle.is_hot && (
                            <Badge className="bg-red-500 text-white text-[10px]">
                              <Flame className="w-3 h-3 mr-0.5" />
                              HOT
                            </Badge>
                          )}
                          {bundle.is_new && (
                            <Badge className="bg-green-500 text-white text-[10px]">
                              <Sparkles className="w-3 h-3 mr-0.5" />
                              NEW
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="p-4 sm:p-5 flex-1 flex flex-col">
                        <h3 className="font-serif text-lg sm:text-xl text-amber-400 mb-1">{bundleName}</h3>
                        <p className="text-[10px] sm:text-xs text-white/50 mb-1">{bundleTarget}</p>
                        <p className="text-[10px] sm:text-xs text-amber-400/70 mb-3">{bundleKeywords}</p>

                        {/* Items preview */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {bundle.items.slice(0, 3).map((item, i) => (
                            <Badge key={i} variant="outline" className="text-[9px] border-white/20 text-white/70 px-1.5 py-0">
                              {item.flavor} ×{item.quantity}
                            </Badge>
                          ))}
                          {bundle.items.length > 3 && (
                            <Badge variant="outline" className="text-[9px] border-white/20 text-white/70 px-1.5 py-0">
                              +{bundle.items.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="mt-auto flex justify-between items-center">
                          <div>
                            <span className="text-xl sm:text-2xl font-bold">RM {(bundle.price / 100).toFixed(0)}</span>
                            {bundle.original_price && bundle.original_price > bundle.price && (
                              <span className="text-xs text-white/40 line-through ml-2">RM {(bundle.original_price / 100).toFixed(0)}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            className="bg-secondary text-secondary-foreground rounded-full px-4 text-xs sm:text-sm"
                            onClick={() => handleBundleOrder(bundle)}
                          >
                            {t("landing.bookNow")}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* View All Button */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mt-10"
          >
            <Link href="/products">
              <Button
                variant="outline"
                size="lg"
                className="border-amber-400/50 text-amber-400 rounded-full px-8 hover:bg-amber-400/10"
              >
                {t("landing.viewAllBundles")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* RWA Partner Section */}
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
            {/* Phase 1 */}
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
                <GoldCoinButton className="w-full">
                  <Link href="/partner">
                    <Button className="w-full bg-secondary text-secondary-foreground rounded-full border-none" data-testid="button-phase1-join">
                      {t("landing.limitedApply")}
                    </Button>
                  </Link>
                </GoldCoinButton>
              </Card>
            </motion.div>

            {/* Phase 2 */}
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
                <Button className="w-full rounded-full" variant="secondary" disabled>
                  {t("landing.waitingToOpen")}
                </Button>
              </Card>
            </motion.div>

            {/* Phase 3 */}
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
                <Button className="w-full rounded-full" variant="secondary" disabled>
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
                  className="mt-10 bg-secondary text-secondary-foreground rounded-full gap-2"
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
                  <Badge className="bg-emerald-100 text-emerald-800">Phase 1</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 sm:p-4 rounded-xl">
                    <p className="text-xs text-emerald-600 uppercase">{t("landing.lyEnergy")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-900">2,000</p>
                    <p className="text-xs text-emerald-500">{t("landing.phase1Bonus")}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 rounded-xl">
                    <p className="text-xs text-amber-600 uppercase">{t("landing.totalEarnings")}</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-700">RM 0</p>
                    <p className="text-xs text-amber-500">{t("landing.startEarning")}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 rounded-xl">
                    <p className="text-xs text-purple-600 uppercase">RWA</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-700">1</p>
                    <p className="text-xs text-purple-500">{t("landing.perCycle")}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-700">{t("landing.currentPoolCycle")}</span>
                    <span className="text-xs text-gray-500">{t("landing.daysRemaining").replace("{days}", "6")}</span>
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
                onClick={() => {
                  const el = document.getElementById("products");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
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
      <FlavorModal open={flavorModalOpen} onOpenChange={setFlavorModalOpen} />
      <OrderModal open={orderModalOpen} onOpenChange={setOrderModalOpen} />
      <FortuneGiftBoxModal open={fortuneModalOpen} onOpenChange={setFortuneModalOpen} />
      {selectedBundle && (
        <BundleOrderModal
          open={bundleModalOpen}
          onOpenChange={setBundleModalOpen}
          bundle={selectedBundle}
        />
      )}
    </div>
  );
}
