import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Heart, Leaf, Users, Star, Shield, Globe, Rocket, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

const WHATSAPP_PHONE = "60124017174";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我想了解 LOVEYOUNG 品牌。")}`;
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const FOUNDERS = [
  {
    name: "林雅琳",
    title: "联合创始人 · CEO",
    image: "/pics/founder_1.jpg",
    story: "从职场精英到创业者，雅琳深知现代女性对健康与事业平衡的渴望。她将十年品牌运营经验注入LOVEYOUNG，致力于打造让女性由内而外发光的滋补品牌。"
  },
  {
    name: "陈美玲",
    title: "联合创始人 · 产品总监",
    image: "/pics/founder_2.jpg",
    story: "美玲拥有食品科学硕士学位，曾在燕窝产业深耕15年。她坚持'科学配方，天然成分'的理念，亲自把关每一款产品的研发与品控。"
  },
  {
    name: "张慧敏",
    title: "联合创始人 · 运营总监",
    image: "/pics/founder_3.jpg",
    story: "慧敏是社群运营专家，擅长连接人与人之间的温暖纽带。她相信，LOVEYOUNG不仅是卖产品，更是在建立一个互相支持、共同成长的女性社区。"
  }
];

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
  { year: "2020", event: "品牌创立于吉隆坡，专注高端燕窝鲜炖事业", type: "past" },
  { year: "2022", event: "建立马来西亚自有燕屋基地，实现原料自主可控", type: "past" },
  { year: "2024", event: "创新升级产品线，推出全新口味系列，深受市场好评", type: "past" },
  { year: "2025", event: "品牌正式更名为 LOVEYOUNG 养乐，开启全新品牌时代", type: "present" },
  { year: "2026", event: "启动\"逆风启航\"计划，推出RWA联合经营人体系", type: "present" },
  { year: "2027", event: "计划进军新加坡、香港市场，建立区域分销网络", type: "future" },
  { year: "2028", event: "目标推出益生菌、胶原蛋白等新品类，完善健康生态", type: "future" },
  { year: "2030", event: "愿景成为东南亚领先的女性健康滋补品牌", type: "future" }
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
              <Badge className="bg-secondary/20 text-secondary mb-4">Since 2020</Badge>
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

      <section className="py-20 bg-card" data-testid="section-founders">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-founders-title">
              三位创始人的故事
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              三位志同道合的女性，因为对健康与美丽的共同追求，携手创建了LOVEYOUNG
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FOUNDERS.map((founder, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.15 }}
              >
                <Card className="h-full overflow-hidden" data-testid={`card-founder-${index}`}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img 
                      src={founder.image}
                      alt={founder.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{founder.name}</h3>
                      <p className="text-sm text-secondary font-medium">{founder.title}</p>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {founder.story}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
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
                  <p className="text-3xl font-bold text-secondary">5</p>
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
              品牌历程与未来蓝图
            </h2>
            <p className="text-muted-foreground">从创立到腾飞，我们的故事才刚刚开始</p>
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
                    <Card className={`inline-block p-4 ${
                      milestone.type === "future" ? "border-dashed border-secondary/50 bg-secondary/5" : ""
                    }`}>
                      <CardContent className="p-0 flex items-start gap-3">
                        {milestone.type === "future" && (
                          <Rocket className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        )}
                        {milestone.type === "present" && (
                          <Sparkles className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          {milestone.type === "future" && (
                            <Badge variant="outline" className="text-xs mb-2 text-secondary border-secondary/50">未来规划</Badge>
                          )}
                          {milestone.type === "present" && (
                            <Badge className="text-xs mb-2 bg-secondary text-secondary-foreground">进行中</Badge>
                          )}
                          <p className="text-muted-foreground">{milestone.event}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-lg z-10 ${
                    milestone.type === "future" 
                      ? "bg-secondary/20 text-secondary border-2 border-dashed border-secondary" 
                      : milestone.type === "present"
                        ? "bg-secondary text-secondary-foreground ring-4 ring-secondary/30"
                        : "bg-primary text-primary-foreground"
                  }`}>
                    {milestone.year}
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-partner-stories">
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
                alt="经营人故事"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-partner-stories"
              />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <Badge className="bg-secondary/20 text-secondary">Coming Soon</Badge>
              <h2 className="text-3xl md:text-4xl font-serif text-primary" data-testid="text-partner-stories-title">
                联合经营人故事
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                每一位LOVEYOUNG联合经营人都有属于自己的精彩故事。她们来自不同的背景——有的是全职妈妈，有的是职场白领，有的是资深创业者。但她们都有一个共同点：选择了LOVEYOUNG，选择了逆风启航。
              </p>
              <p className="text-muted-foreground leading-relaxed">
                我们正在筹备经营人故事博客专栏，将陆续分享这些美丽女性的创业历程、成长心得和成功经验。敬请期待！
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/partner">
                  <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-become-partner">
                    <Users className="w-4 h-4" />
                    成为经营人
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
