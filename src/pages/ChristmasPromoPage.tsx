import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gift, Sparkles, Heart, Star, Check } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

import christmasGiftImage from "@assets/generated_images/christmas_luxury_gift_box.png";

const WHATSAPP_PHONE = "60178228658";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我想预订圣诞限定礼盒，请问还有库存吗？")}`;

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

export default function ChristmasPromoPage() {
  const [, setLocation] = useLocation();

  const giftFeatures = [
    { icon: Gift, text: "限量圣诞礼盒包装", sub: "精美红金设计" },
    { icon: Sparkles, text: "定制圣诞金勺", sub: "独家赠品" },
    { icon: Heart, text: "8瓶精选燕窝", sub: "120g大份量" },
    { icon: Star, text: "节日专属卡片", sub: "手写祝福" }
  ];

  const packageOptions = [
    {
      name: "单盒装",
      price: "RM226",
      originalPrice: "RM268",
      desc: "8瓶装 · 赠圣诞金勺1支",
      badge: "限量50套"
    },
    {
      name: "双盒装",
      price: "RM428",
      originalPrice: "RM536",
      desc: "16瓶装 · 赠圣诞金勺2支",
      badge: "超值优惠",
      highlight: true
    }
  ];

  return (
    <div className="min-h-screen bg-background christmas-promo-page">
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-900/95 via-red-800/95 to-red-900/95 backdrop-blur-md border-b border-red-700/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/90"
              onClick={() => setLocation("/")}
              data-testid="button-back-home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <a
              href="/"
              className="christmas-logo-text"
              data-testid="link-christmas-logo"
            >
              <span className="christmas-logo-main">LOVEYOUNG</span>
              <span className="christmas-logo-sub">圣诞限定</span>
            </a>
            
            <Button
              size="sm"
              className="gap-2 bg-white/20 text-white border-white/30"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-christmas-whatsapp"
            >
              <SiWhatsapp className="w-4 h-4" />
              <span className="hidden sm:inline">立即预订</span>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden christmas-hero">
        <div className="absolute inset-0">
          <img
            src={christmasGiftImage}
            alt="圣诞限定礼盒"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-red-950/90 via-red-900/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-red-950/80 via-transparent to-red-950/40" />
          <div className="christmas-snowfall" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16 w-full">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-2xl"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <Badge className="christmas-badge gap-2" data-testid="badge-christmas-limited">
                <Sparkles className="w-3.5 h-3.5" />
                2024 圣诞限定
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="christmas-hero-title mb-4"
              data-testid="text-christmas-title"
            >
              <span className="block text-white/90">给女人</span>
              <span className="block christmas-title-gold">最好的圣诞礼物</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-white/85 mb-6 leading-relaxed"
              data-testid="text-christmas-subtitle"
            >
              这个圣诞，用一份滋养身心的礼物，
              <br className="hidden sm:block" />
              告诉她：你值得被宠爱。
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap gap-3 mb-8"
            >
              {giftFeatures.map((feature, index) => (
                <div
                  key={index}
                  className="christmas-feature-tag"
                  data-testid={`tag-feature-${index}`}
                >
                  <feature.icon className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="text-white font-medium text-sm">{feature.text}</div>
                    <div className="text-white/60 text-xs">{feature.sub}</div>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="gap-2 christmas-cta-button text-base font-bold"
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                data-testid="button-christmas-order"
              >
                <Gift className="w-5 h-5" />
                立即预订礼盒
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base glass border-white/30 text-white"
                onClick={() => {
                  const el = document.querySelector("#packages");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
                data-testid="button-christmas-view-packages"
              >
                查看套餐详情
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="packages" className="py-16 md:py-24 bg-gradient-to-b from-red-950 to-background">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-12"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-black text-white mb-4"
              data-testid="text-packages-title"
            >
              圣诞<span className="christmas-title-gold">限定礼盒</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-white/70">
              限量发售，售完即止
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-6"
          >
            {packageOptions.map((pkg, index) => (
              <motion.div key={index} variants={scaleIn}>
                <Card
                  className={`p-6 relative christmas-package-card ${pkg.highlight ? 'christmas-package-highlight' : ''}`}
                  data-testid={`card-package-${index}`}
                >
                  <Badge
                    className={`absolute top-4 right-4 ${pkg.highlight ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}
                  >
                    {pkg.badge}
                  </Badge>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                  <p className="text-white/70 mb-4">{pkg.desc}</p>
                  
                  <div className="mb-6">
                    <span className="text-3xl font-black christmas-title-gold">{pkg.price}</span>
                    <span className="text-white/50 line-through ml-2">{pkg.originalPrice}</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {["新鲜炖煮燕窝", "限量圣诞包装", "定制圣诞金勺", "节日祝福卡片"].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-white/80 text-sm">
                        <Check className="w-4 h-4 text-emerald-400" />
                        {item}
                      </div>
                    ))}
                  </div>

                  <Button
                    className={`w-full gap-2 font-bold ${pkg.highlight ? 'christmas-cta-button' : 'bg-white/10 text-white'}`}
                    onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                    data-testid={`button-order-package-${index}`}
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    WhatsApp 预订
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              为什么选择LOVEYOUNG圣诞礼盒？
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              我们精心准备每一份礼盒，让收到礼物的她，感受到满满的心意与温暖。
              新鲜炖煮，0添加，真材实料，是送给女人最贴心的圣诞惊喜。
            </p>
            <Button
              size="lg"
              className="gap-2 christmas-cta-button font-bold"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-final-order"
            >
              <Gift className="w-5 h-5" />
              立即预订圣诞礼盒
            </Button>
          </motion.div>
        </div>
      </section>

      <footer className="py-8 bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground"
            onClick={() => setLocation("/")}
            data-testid="button-footer-back"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Button>
        </div>
      </footer>
    </div>
  );
}
