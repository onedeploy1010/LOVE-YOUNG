import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Heart, Leaf, Users, Star, Shield, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const WHATSAPP_PHONE = "60124017174";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我想了解 LOVEYOUNG 品牌。")}`;
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const BRAND_VALUES = [
  {
    icon: Heart,
    title: "以爱为本",
    description: "每一份产品都承载着对女性健康的深切关怀，从原料到配方，用心守护每一位顾客。"
  },
  {
    icon: Leaf,
    title: "天然纯粹",
    description: "严选全球优质产区的燕窝与花胶，拒绝添加剂，保留大自然最珍贵的馈赠。"
  },
  {
    icon: Shield,
    title: "品质保障",
    description: "全程冷链配送，独立包装，每批产品均通过严格质检，确保新鲜与安全。"
  },
  {
    icon: Globe,
    title: "全球视野",
    description: "整合东南亚顶级燕窝资源，引入国际化品质管理体系，打造世界级滋补品牌。"
  }
];

const MILESTONES = [
  { year: "2018", event: "品牌创立于吉隆坡，专注高端燕窝鲜炖" },
  { year: "2020", event: "建立马来西亚自有燕屋基地" },
  { year: "2022", event: "推出花胶系列，完善滋补产品线" },
  { year: "2024", event: "启动RWA联合经营人计划" },
  { year: "2025", event: "品牌升级，发布\"逆风启航\"系列" }
];

export default function BrandStoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

      <section className="pt-32 pb-20 relative overflow-hidden" data-testid="section-brand-hero">
        <div className="absolute inset-0 -z-10">
          <img 
            src="/pics/love_young_brand_identity_20260106043554_1.png" 
            alt="Brand Identity"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary mb-6" data-testid="text-brand-title">
                逆风启航<br />
                <span className="text-secondary">养乐优选</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                LOVEYOUNG 养乐鲜炖，源自马来西亚的高端滋补品牌。我们相信，每一位女性都值得被温柔以待，用最纯净的滋养，唤醒由内而外的优雅力量。
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-founder-story">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <img 
                src="/pics/love_young_founders_story_20260106043351_1.png"
                alt="创始人故事"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-founder-story"
              />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif text-primary" data-testid="text-founder-title">
                创始初心
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                品牌创始人林女士，曾是一位忙碌的职业女性。在经历了健康的低谷后，她深刻体会到滋补养生对女性的重要性。然而，市场上真正优质、便捷的燕窝产品少之又少。
              </p>
              <p className="text-muted-foreground leading-relaxed">
                2018年，带着"让每一位女性都能轻松享受高品质滋补"的愿景，LOVEYOUNG 在吉隆坡诞生。从一间小小的厨房开始，到如今拥有自有燕屋基地和现代化生产线，我们始终坚持初心。
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center">
                  <Star className="w-8 h-8 text-secondary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">林雅琳 创始人</p>
                  <p className="text-sm text-muted-foreground">LOVEYOUNG 养乐鲜炖</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-brand-values">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-values-title">
              品牌理念
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              我们相信，真正的美丽源自健康，真正的力量源自内心。LOVEYOUNG 不仅是一个品牌，更是一种生活态度。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BRAND_VALUES.map((value, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full text-center p-6" data-testid={`card-value-${index}`}>
                  <CardContent className="p-0 space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center mx-auto">
                      <value.icon className="w-7 h-7 text-secondary" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground" data-testid="section-brand-philosophy">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif" data-testid="text-philosophy-title">
                逆风启航 · 女性力量
              </h2>
              <p className="opacity-80 leading-relaxed">
                "逆风启航"不仅是我们的品牌精神，更是对每一位现代女性的致敬。在生活的风浪中，我们相信每一位女性都拥有乘风破浪的勇气。
              </p>
              <p className="opacity-80 leading-relaxed">
                LOVEYOUNG 致力于成为女性成长路上的坚实后盾。无论是职场精英、全职妈妈还是创业者，我们都希望用最优质的滋补产品，为您补充能量，让您在逆境中依然优雅前行。
              </p>
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary">50,000+</p>
                  <p className="text-sm opacity-70">忠实顾客</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary">6</p>
                  <p className="text-sm opacity-70">年品牌历程</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary">100%</p>
                  <p className="text-sm opacity-70">天然成分</p>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <img 
                src="/pics/love_young_wellness_journey_20260106043338_1.png"
                alt="女性力量"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-philosophy"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-milestones">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-milestones-title">
              品牌历程
            </h2>
            <p className="text-muted-foreground">从一间厨房到全球品牌，我们一直在前行</p>
          </div>
          <div className="relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2 hidden md:block" />
            <div className="space-y-8">
              {MILESTONES.map((milestone, index) => (
                <motion.div
                  key={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeInUp}
                  className={`flex flex-col md:flex-row items-center gap-4 md:gap-8 ${
                    index % 2 === 0 ? "md:flex-row-reverse" : ""
                  }`}
                  data-testid={`milestone-${index}`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "md:text-left" : "md:text-right"}`}>
                    <Card className="inline-block p-4">
                      <CardContent className="p-0">
                        <p className="text-muted-foreground">{milestone.event}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-lg z-10">
                    {milestone.year}
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-community">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <img 
                src="/pics/love_young_community_impact_20260106043528_1.png"
                alt="品牌社区"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-community"
              />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif text-primary" data-testid="text-community-title">
                共建美好社区
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                LOVEYOUNG 不只是一个产品品牌，更是一个温暖的女性社区。在这里，志同道合的姐妹们分享养生心得、交流生活智慧、互相支持鼓励。
              </p>
              <p className="text-muted-foreground leading-relaxed">
                通过我们的联合经营人计划，越来越多的女性不仅收获了健康，更找到了事业的第二曲线。她们在 LOVEYOUNG 实现了财富与优雅的双重丰收。
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/partner">
                  <Button className="gap-2" data-testid="button-join-community">
                    <Users className="w-4 h-4" />
                    加入我们
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                  data-testid="button-contact-brand"
                >
                  了解更多
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-brand-cta">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-primary mb-6" data-testid="text-cta-title">
            开启您的优雅养生之旅
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            每一份 LOVEYOUNG 产品，都是我们对品质的承诺，对健康的坚持，对美丽的追求。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="bg-secondary text-secondary-foreground gap-2" data-testid="button-view-products">
                浏览产品系列
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-brand-whatsapp"
            >
              WhatsApp 咨询
            </Button>
          </div>
        </div>
      </section>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
