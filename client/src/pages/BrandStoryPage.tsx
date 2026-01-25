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
    name: "Vivian",
    subtitle: "从一碗花胶燕窝开始的人",
    motto: "初心，是把「好东西」坚持做到最好",
    image: "/pics/founder_1.webp",
    story: "Vivian，是最早踏上这条路的人。从最初的朋友圈分享开始，她一步步把花胶燕窝带进更大的社区，走进月子中心、美容院，也走进无数女性的日常生活。",
    insight: "她不急着做规模，反而把最多的时间放在产品本身——反复测试口感、研究配方、调整甜度与浓稠度，只为找到既好喝、又对身体真正友善的平衡点。",
    belief: "品质，是品牌在逆风中最稳的船。",
    focus: "深耕产品"
  },
  {
    name: "Agnes",
    subtitle: "看过太多故事后，选择守护健康",
    motto: "她相信，真正的财富从来不是数字",
    image: "/pics/founder_2.webp",
    story: "Agnes，是保险行业里的女强人。多年职业生涯，让她见过太多人生的高峰与低谷——有人事业辉煌，却失去健康；有人财富充足，却忽略了自己和家人。",
    insight: "这些真实发生在客户身上的故事，让她逐渐明白：身心健康，才是一切保障的根本。她希望，把自己多年对「风险、守护、长期价值」的理解，转化为一种更贴近生活的陪伴。",
    belief: "让身边的人，在忙碌与压力中，依然能照顾好自己。",
    focus: "理解风险与守护"
  },
  {
    name: "Andrey",
    subtitle: "在聚光灯下，更懂得真正的保养",
    motto: "美，不该来自焦虑，而来自状态",
    image: "/pics/founder_3.webp",
    story: "Andrey，十几岁便成为职业车模，后来发展为KOL，深耕自媒体领域。她活跃在宴会、派对、时尚与社交场合，见过太多关于「美」的定义——快速的、表面的、被消费的。",
    insight: "但她越来越清楚地知道：真正让人保持青春与魅力的，不是外在的堆叠，而是心态稳定、饮食健康、身体轻盈。花胶燕窝，对她而言，不是「补品」，而是一种让身体回到平衡、让生活更从容的日常选择。",
    belief: "最好的保养，是不勉强自己。",
    focus: "站在潮流与女性生活方式前沿"
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
            <Badge className="bg-secondary/20 text-secondary mb-4">品牌人物志</Badge>
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-founders-title">
              逆风启航 · 创始人故事
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              三种人生路径，同一个方向——健康，不该只是当问题出现时的补救，而应该是生活中被温柔坚持的日常
            </p>
          </div>

          <div className="space-y-16">
            {FOUNDERS.map((founder, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
              >
                <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                  <div className={`${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="aspect-square max-w-md mx-auto overflow-hidden rounded-2xl shadow-xl bg-muted">
                      <img 
                        src={founder.image}
                        alt={founder.name}
                        className="w-full h-full object-cover"
                        data-testid={`img-founder-${index}`}
                      />
                    </div>
                  </div>
                  <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-1' : ''}`} data-testid={`card-founder-${index}`}>
                    <div>
                      <Badge className="bg-primary/10 text-primary mb-3">{founder.focus}</Badge>
                      <h3 className="text-2xl md:text-3xl font-serif text-primary mb-2">{founder.name}</h3>
                      <p className="text-lg text-secondary font-medium">{founder.subtitle}</p>
                    </div>
                    <blockquote className="border-l-4 border-secondary pl-4 py-2">
                      <p className="text-muted-foreground italic">{founder.motto}</p>
                    </blockquote>
                    <p className="text-muted-foreground leading-relaxed">{founder.story}</p>
                    <p className="text-muted-foreground leading-relaxed">{founder.insight}</p>
                    <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
                      <p className="text-primary font-medium text-center">"{founder.belief}"</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="mt-20 text-center"
          >
            <Card className="max-w-3xl mx-auto bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-8">
                <h3 className="text-xl md:text-2xl font-serif text-primary mb-4">三种人生路径 · 同一个方向</h3>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {FOUNDERS.map((founder, index) => (
                    <div key={index} className="text-center">
                      <p className="text-secondary font-medium">{founder.name}</p>
                      <p className="text-sm text-muted-foreground">{founder.focus}</p>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  她们在各自的人生阶段，都走过不顺、看过现实、经历过选择。最终，她们在同一个理念下汇合——这，就是「逆风启航」真正想传递的品牌精神。
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="py-20" data-testid="section-brand-story-visual">
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
                alt="创业初心"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-founders-story"
              />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif text-primary" data-testid="text-origin-title">
                创业初心
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                2020年，三位志同道合的女性在吉隆坡相遇。她们有着共同的经历——在忙碌的生活中忽视了自己的健康，直到身体发出警报才意识到滋补养生的重要性。
              </p>
              <p className="text-muted-foreground leading-relaxed">
                然而，市场上真正优质、无防腐剂的鲜炖花胶燕窝产品少之又少。这是最健康的滋补方式，却也非常费时去制作。都市女性常常忙于照顾家人和工作，根本无法为自己好好煮上那么一碗。
              </p>
              <p className="text-muted-foreground leading-relaxed">
                于是，她们决定亲自创建一个品牌，用最严格的标准、最真挚的初心，为每一位忙碌的女性提供最纯净、最便捷的滋养。
              </p>
              <p className="text-muted-foreground leading-relaxed font-medium text-foreground">
                这就是 LOVEYOUNG 的诞生——先爱自己，才能更好地爱世界。
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="section-production">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6 order-2 lg:order-1"
            >
              <h2 className="text-3xl md:text-4xl font-serif text-primary" data-testid="text-production-title">
                匠心品质
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                从燕窝与花胶原产地的亲自采购开始，到每一批原料的严谨筛选，我们只选择符合标准的优质食材进入生产流程。
              </p>
              <p className="text-muted-foreground leading-relaxed">
                所有产品均在 <span className="text-primary font-medium">LoveYoung 自有无菌生产基地</span> 完成炖煮与灌装，采用低温慢炖工艺，在确保卫生安全的前提下，最大程度保留食材本身的营养与口感层次。
              </p>
              <p className="text-muted-foreground leading-relaxed">
                每一瓶鲜炖产品都经过多重质量检测，并通过全程冷链配送，确保送达您手中的，始终是新鲜、安心、值得信赖的品质。
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-secondary">100%</p>
                  <p className="text-xs text-muted-foreground">原产地直采</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-secondary">0</p>
                  <p className="text-xs text-muted-foreground">添加剂防腐剂</p>
                </Card>
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="order-1 lg:order-2"
            >
              <img 
                src="/pics/craftsmanship_journey.webp"
                alt="匠心品质之旅：原产地采购、严谨筛选、无菌生产、冷链配送"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-production"
              />
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

      <section className="py-20 bg-card" data-testid="section-lifestyle">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4">
              优雅生活方式
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              LOVEYOUNG 倡导的不仅是产品，更是一种由内而外的优雅生活方式
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="overflow-hidden h-full">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <img 
                    src="/pics/love_young_wellness_lifestyle_20260106043539_1.png"
                    alt="健康生活"
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-2">健康养生</h3>
                  <p className="text-sm text-muted-foreground">每日一瓶鲜炖燕窝，开启元气满满的一天</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden h-full">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <img 
                    src="/pics/love_young_community_building_20260106043405_1.png"
                    alt="社群连接"
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-2">社群连接</h3>
                  <p className="text-sm text-muted-foreground">与志同道合的姐妹分享养生心得</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
            >
              <Card className="overflow-hidden h-full">
                <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                  <img 
                    src="/pics/love_young_event_experience_20260106043435_1.png"
                    alt="品牌活动"
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-2">品牌活动</h3>
                  <p className="text-sm text-muted-foreground">参与私享沙龙，体验优雅圈层</p>
                </CardContent>
              </Card>
            </motion.div>
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
              className="grid grid-cols-3 gap-4"
            >
              <div className="rounded-xl shadow-lg overflow-hidden bg-muted">
                <img 
                  src="/pics/partner_story_1.webp"
                  alt="经营人故事 - Lisa"
                  className="w-full h-auto object-contain"
                  data-testid="img-partner-stories-1"
                />
              </div>
              <div className="rounded-xl shadow-lg overflow-hidden bg-muted mt-6">
                <img 
                  src="/pics/partner_story_2.webp"
                  alt="经营人故事 - Sarah"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="rounded-xl shadow-lg overflow-hidden bg-muted">
                <img 
                  src="/pics/partner_story_3.webp"
                  alt="经营人故事 - Emma"
                  className="w-full h-auto object-contain"
                />
              </div>
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

      <section className="py-20" data-testid="section-future-vision">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif text-primary" data-testid="text-future-title">
                未来愿景
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                LOVEYOUNG 的目标不仅是成为东南亚领先的女性健康滋补品牌，更是要构建一个完整的女性健康生态系统。
              </p>
              <p className="text-muted-foreground leading-relaxed">
                从燕窝、花胶到益生菌、胶原蛋白，我们将不断丰富产品线，满足女性全方位的健康需求。同时，通过RWA联合经营人计划，让更多女性实现财富与健康的双重丰收。
              </p>
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-muted-foreground">2027年 进军新加坡、香港市场</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-muted-foreground">2028年 推出全新健康品类</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-muted-foreground">2030年 成为区域领先品牌</span>
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
                src="/pics/love_young_future_vision_20260106043643_1.png"
                alt="未来愿景"
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-future-vision"
              />
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
