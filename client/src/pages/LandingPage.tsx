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
import type { Product, Testimonial } from "@shared/schema";
import { useLanguage } from "@/lib/i18n";
import { Link } from "wouter";

const heroImage = "/pics/love_young_brand_identity_20260106043554_1.png";
const productImage1 = "/pics/love_young_luxury_gift_box_detailed_20260106045736_1.png";
const productImage2 = "/pics/love_young_gift_box_design_20260106043236_1.png";
const brandImage = "/pics/love_young_founders_story_20260106043351_1.png";
const productImage3 = "/pics/love_young_wellness_journey_20260106043338_1.png";

const WHATSAPP_PHONE = "60124017174";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我对LOVEYOUNG燕窝花胶产品感兴趣，想了解更多信息。")}`;
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

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products/featured"],
  });

  const { data: testimonials } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

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
            Against The Wind
          </motion.h2>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-8xl font-serif font-bold mb-6"
            data-testid="text-hero-title"
          >
            逆风启航 <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-100 to-amber-300 bg-clip-text text-transparent">
              重定义女性力量
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="max-w-2xl mx-auto text-lg lg:text-xl font-light mb-10 opacity-90"
            data-testid="text-hero-description"
          >
            从 Young Love (滋养他人) 到 Love Young (先爱自己)。<br />
            这不仅是一个品牌的逆转，更是每一位女性灵魂的觉醒。
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <Button 
              size="lg"
              className="bg-secondary text-secondary-foreground rounded-full px-12 text-lg"
              onClick={() => setOrderModalOpen(true)}
              data-testid="button-hero-order"
            >
              立即开启滋养
            </Button>
            <Link href="/partner">
              <Button 
                variant="outline"
                size="lg"
                className="border-white/70 text-white rounded-full px-12 text-lg bg-transparent"
                data-testid="button-hero-partner"
              >
                加入共建计划
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
                <p className="italic font-serif text-lg">"如果连自己都不认真对待，世界也不会。"</p>
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
                品牌初衷：<br />
                <span className="text-amber-500">逆转的勇气</span>
              </motion.h2>
              
              <motion.div variants={fadeInUp} className="space-y-6 text-muted-foreground leading-relaxed">
                <p>Love Young 由三位经历情感创伤后自愈自强的年轻女性创立。我们曾身处低谷，曾被要求不断付出，却忘了如何爱自己。</p>
                <p className="font-semibold text-foreground">"Young Love"是设计时的美丽意外，寓意"养乐"——滋养他人。但我们决定将它逆转，成为"Love Young"——先爱那个年轻、真实的自己。</p>
                <p>我们提供的不仅是 RM488 的鲜炖礼盒，而是一份关于"新鲜、特别、精致、珍贵"的自我承诺。</p>
              </motion.div>

              <motion.div variants={fadeInUp} className="mt-10 grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-500">
                    <Heart className="w-5 h-5" />
                  </div>
                  <span className="font-bold">自愈精神</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-500">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="font-bold">女性觉醒</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-500">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="font-bold">高定品质</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-400/20 rounded-lg text-amber-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="font-bold">共建社区</span>
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
              尊享鲜炖系列
            </h2>
            <div className="w-24 h-1 bg-amber-400 mx-auto mb-6" />
            <p className="text-amber-400/80 max-w-2xl mx-auto">
              6罐装奢宠礼盒，12种口味定制化批次鲜炖，冷链直达。
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
                    alt="旋转绽放礼盒" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <Badge className="absolute top-4 right-4 bg-amber-500 text-white">Premium</Badge>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-amber-400 mb-2">旋转绽放·圆形尊享礼盒</h3>
                  <p className="text-sm opacity-70 mb-4">创新多层旋转结构，朱红与墨绿的东方韵味。内含6罐高浓度鲜炖花胶燕窝。</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">RM 488</span>
                    <Button 
                      size="sm" 
                      className="bg-secondary text-secondary-foreground rounded-full px-6"
                      onClick={() => setOrderModalOpen(true)}
                      data-testid="button-product-1-order"
                    >
                      立即预定
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
                    alt="经典定制系列" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-amber-400 mb-2">逆风启航·经典定制系列</h3>
                  <p className="text-sm opacity-70 mb-4">定制化12种口味随心搭配。人参、红枣、枸杞等天然辅料，0添加更安心。</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">RM 388 <small className="text-xs opacity-50">起</small></span>
                    <Button 
                      variant="outline"
                      size="sm" 
                      className="border-secondary text-secondary rounded-full px-6"
                      onClick={() => setFlavorModalOpen(true)}
                      data-testid="button-product-2-flavors"
                    >
                      了解口味
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
                    alt="季节限定" 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-amber-400 font-bold tracking-widest uppercase border-2 border-amber-400 p-4">Coming Soon</span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-2xl text-amber-400 mb-2">季节限定·春樱花胶</h3>
                  <p className="text-sm opacity-70 mb-4">即将发布。针对亚洲女性换季需求研发，赋予肌肤春日般的新生光采。</p>
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">Coming Soon</span>
                    <Button 
                      size="sm" 
                      className="opacity-50 rounded-full px-6"
                      disabled
                    >
                      敬请期待
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
              RWA 联合经营人计划
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              打破传统代理模式。我们不招投资者，只寻找品牌共建人。
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
            <motion.div variants={fadeInUp}>
              <Card className="p-8 text-center hover:shadow-2xl transition-all bg-card/80 backdrop-blur border border-amber-400/20">
                <div className="w-16 h-16 bg-emerald-900 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserPlus className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">Phase 1: RM 1,000</h3>
                <p className="text-sm text-muted-foreground mb-6">获得 2,000 LY 能量值，首盒产品赠送，及品牌共建权益。</p>
                <ul className="text-left text-sm space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    50% 首5盒销售返现
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    30% 全球奖金池分红权
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    个人高端写真拍摄
                  </li>
                </ul>
                <Link href="/partner">
                  <Button className="w-full bg-secondary text-secondary-foreground rounded-full" data-testid="button-phase1-join">
                    立即加入
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Phase 2 - Featured */}
            <motion.div variants={fadeInUp} className="lg:scale-105 z-10">
              <Card className="p-8 text-center bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-2xl relative">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white">
                  HOT SELLING
                </Badge>
                <div className="w-16 h-16 bg-amber-400 text-emerald-900 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">Phase 2: RM 1,300</h3>
                <p className="text-sm opacity-80 mb-6">获得更高级别分红权重及社交名媛活动入场券。</p>
                <ul className="text-left text-sm space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    1.2x 分红权重
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    燕窝工厂VIP参观权
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-400" />
                    微电影拍摄参与机会
                  </li>
                </ul>
                <Link href="/partner">
                  <Button className="w-full bg-secondary text-secondary-foreground rounded-full border-none" data-testid="button-phase2-apply">
                    限额申请
                  </Button>
                </Link>
              </Card>
            </motion.div>

            {/* Phase 3 */}
            <motion.div variants={fadeInUp}>
              <Card className="p-8 text-center hover:shadow-2xl transition-all bg-card/80 backdrop-blur border border-amber-400/20">
                <div className="w-16 h-16 bg-emerald-900 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-4">Phase 3: RM 1,500</h3>
                <p className="text-sm text-muted-foreground mb-6">面向成熟企业家。提供品牌联名及深度商业合作空间。</p>
                <ul className="text-left text-sm space-y-3 mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    顶级奖金池分配
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    国际品牌发布会席位
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500" />
                    联名款产品收益分润
                  </li>
                </ul>
                <Link href="/partner">
                  <Button className="w-full bg-secondary text-secondary-foreground rounded-full" data-testid="button-phase3-contact">
                    咨询合作
                  </Button>
                </Link>
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
                <h3 className="text-2xl lg:text-3xl font-serif font-bold mb-6">透明的收益逻辑</h3>
                <p className="text-muted-foreground mb-8">
                  Love Young 拒绝"资金盘"。每一分收益都来自真实的终端产品销售。我们用 LY (Energy) 记录你的贡献。
                </p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                    <span className="font-bold">销售返现 (Cashback)</span>
                    <span className="text-amber-500 font-bold">50% / 30%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                    <span className="font-bold">全球奖金池 (Pool)</span>
                    <span className="text-amber-500 font-bold">销售额的 30%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                    <span className="font-bold">分红周期</span>
                    <span className="text-amber-500 font-bold">每 10 天结算</span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-900 rounded-2xl p-8 text-white">
                <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Network className="text-amber-400" />
                  10层积分补充系统
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 border border-white/10 rounded-lg">
                    <div className="text-xs opacity-50 uppercase">Tier 1 (直推)</div>
                    <div className="text-xl font-bold text-amber-400">20%</div>
                  </div>
                  <div className="p-3 border border-white/10 rounded-lg">
                    <div className="text-xs opacity-50 uppercase">Tier 2-4</div>
                    <div className="text-xl font-bold text-amber-400">10% ea</div>
                  </div>
                  <div className="p-3 border border-white/10 rounded-lg">
                    <div className="text-xs opacity-50 uppercase">Tier 5-10</div>
                    <div className="text-xl font-bold text-amber-400">5% ea</div>
                  </div>
                  <div className="p-3 border border-white/10 rounded-lg">
                    <div className="text-xs opacity-50 uppercase">Total Referral</div>
                    <div className="text-xl font-bold text-amber-400">80% LY</div>
                  </div>
                </div>
                <p className="mt-6 text-xs italic opacity-60">
                  * LY 能量值用于解锁现金分红，通过推荐网体销售可持续自动补充。
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
              <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-6">实时管理后台</h2>
              <p className="opacity-70 mb-10">
                可视化追踪你的能量值、RWA 权重及 10 层共建网络。每一个数字都见证了你的成长。
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-400">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">动态分红追踪</h4>
                    <p className="text-sm opacity-50">实时查看奖金池累积情况。</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-amber-400/20 rounded-xl flex items-center justify-center text-amber-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">能量值消耗预警</h4>
                    <p className="text-sm opacity-50">自动提醒 LY 补充，确保分红不间断。</p>
                  </div>
                </div>
              </div>

              <Link href="/partner">
                <Button 
                  size="lg"
                  className="mt-10 bg-secondary text-secondary-foreground rounded-full gap-2" data-testid="button-dashboard-learn-more"
                >
                  了解更多
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
                      <p className="font-bold text-emerald-900">Love Young Dashboard</p>
                      <p className="text-xs text-gray-500">经营人管理中心</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800">Phase 2</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl">
                    <p className="text-xs text-emerald-600 uppercase">LY 能量值</p>
                    <p className="text-2xl font-bold text-emerald-900">2,580</p>
                    <p className="text-xs text-emerald-500">+120 本周</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl">
                    <p className="text-xs text-amber-600 uppercase">累计收益</p>
                    <p className="text-2xl font-bold text-amber-700">RM 3,240</p>
                    <p className="text-xs text-amber-500">+RM 580 本月</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                    <p className="text-xs text-purple-600 uppercase">团队成员</p>
                    <p className="text-2xl font-bold text-purple-700">28</p>
                    <p className="text-xs text-purple-500">10层网络</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-gray-700">当前奖金池周期</span>
                    <span className="text-xs text-gray-500">剩余 6 天</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-amber-500 h-3 rounded-full" style={{ width: "40%" }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>已累积: RM 12,580</span>
                    <span>预计分红: RM 380</span>
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
              开启您的滋养之旅
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-lg opacity-80 max-w-2xl mx-auto mb-10"
            >
              无论是为自己，还是为爱的人，Love Young 都将为您带来最纯粹的滋养体验。
            </motion.p>
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row justify-center gap-4"
            >
              <Button 
                size="lg"
                className="bg-secondary text-secondary-foreground rounded-full px-12 gap-2"
                onClick={() => setOrderModalOpen(true)}
                data-testid="button-cta-order"
              >
                <ShoppingBag className="w-5 h-5" />
                立即订购
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-white/70 text-white rounded-full px-12 gap-2 bg-transparent"
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                data-testid="button-cta-whatsapp"
              >
                <SiWhatsapp className="w-5 h-5" />
                WhatsApp 咨询
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
      <WhatsAppButton whatsappLink={WHATSAPP_LINK} />
      <FlavorModal open={flavorModalOpen} onOpenChange={setFlavorModalOpen} />
      <OrderModal 
        open={orderModalOpen} 
        onOpenChange={setOrderModalOpen} 
        whatsappLink={WHATSAPP_LINK}
        metaShopLink={META_SHOP_LINK}
      />
    </div>
  );
}
