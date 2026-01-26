import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Heart, Leaf, Users, Star, Shield, Globe, Rocket, Target, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/lib/i18n";

const WHATSAPP_PHONE = "60124017174";
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const BRAND_VALUE_ICONS = [Heart, Leaf, Shield, Globe];

export default function BrandStoryPage() {
  const { t } = useLanguage();
  
  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(t("brand.whatsappMessage"))}`;

  const FOUNDERS = [
    {
      name: "Vivian",
      subtitle: t("brand.founders.vivian.subtitle"),
      motto: t("brand.founders.vivian.motto"),
      image: "/pics/founder_1.webp",
      story: t("brand.founders.vivian.story"),
      insight: t("brand.founders.vivian.insight"),
      belief: t("brand.founders.vivian.belief"),
      focus: t("brand.founders.vivian.focus")
    },
    {
      name: "Agnes",
      subtitle: t("brand.founders.agnes.subtitle"),
      motto: t("brand.founders.agnes.motto"),
      image: "/pics/founder_2.webp",
      story: t("brand.founders.agnes.story"),
      insight: t("brand.founders.agnes.insight"),
      belief: t("brand.founders.agnes.belief"),
      focus: t("brand.founders.agnes.focus")
    },
    {
      name: "Andrey",
      subtitle: t("brand.founders.andrey.subtitle"),
      motto: t("brand.founders.andrey.motto"),
      image: "/pics/founder_3.webp",
      story: t("brand.founders.andrey.story"),
      insight: t("brand.founders.andrey.insight"),
      belief: t("brand.founders.andrey.belief"),
      focus: t("brand.founders.andrey.focus")
    }
  ];

  const BRAND_VALUES = [
    {
      icon: Heart,
      title: t("brand.values.love.title"),
      description: t("brand.values.love.description")
    },
    {
      icon: Leaf,
      title: t("brand.values.natural.title"),
      description: t("brand.values.natural.description")
    },
    {
      icon: Shield,
      title: t("brand.values.quality.title"),
      description: t("brand.values.quality.description")
    },
    {
      icon: Globe,
      title: t("brand.values.global.title"),
      description: t("brand.values.global.description")
    }
  ];

  const MILESTONES = [
    { year: "2020", event: t("brand.milestones.2020"), type: "past" },
    { year: "2022", event: t("brand.milestones.2022"), type: "past" },
    { year: "2024", event: t("brand.milestones.2024"), type: "past" },
    { year: "2025", event: t("brand.milestones.2025"), type: "present" },
    { year: "2026", event: t("brand.milestones.2026"), type: "present" },
    { year: "2027", event: t("brand.milestones.2027"), type: "future" },
    { year: "2028", event: t("brand.milestones.2028"), type: "future" },
    { year: "2030", event: t("brand.milestones.2030"), type: "future" }
  ];

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
                {t("brand.hero.title")}<br />
                <span className="text-secondary">{t("brand.hero.titleSub")}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
                {t("brand.hero.description")}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-founders">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-secondary/20 text-secondary mb-4">{t("brand.foundersSection.badge")}</Badge>
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-founders-title">
              {t("brand.foundersSection.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("brand.foundersSection.subtitle")}
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
                <h3 className="text-xl md:text-2xl font-serif text-primary mb-4">{t("brand.foundersSection.summaryTitle")}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  {FOUNDERS.map((founder, index) => (
                    <div key={index} className="text-center py-2 sm:py-0">
                      <p className="text-secondary font-medium text-lg sm:text-base">{founder.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{founder.focus}</p>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {t("brand.foundersSection.summaryText")}
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
                alt={t("brand.origin.title")}
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
                {t("brand.origin.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.origin.p1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.origin.p2")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.origin.p3")}
              </p>
              <p className="text-muted-foreground leading-relaxed font-medium text-foreground">
                {t("brand.origin.p4")}
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
                {t("brand.production.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.production.p1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.production.p2")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.production.p3")}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-secondary">100%</p>
                  <p className="text-xs text-muted-foreground">{t("brand.production.stat1")}</p>
                </Card>
                <Card className="p-4 text-center">
                  <p className="text-2xl font-bold text-secondary">0</p>
                  <p className="text-xs text-muted-foreground">{t("brand.production.stat2")}</p>
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
                alt={t("brand.production.title")}
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
              {t("brand.brandValues")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("brand.valuesSection.subtitle")}
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
              {t("brand.lifestyle.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("brand.lifestyle.subtitle")}
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
                    alt={t("brand.lifestyle.wellness.title")}
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-2">{t("brand.lifestyle.wellness.title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("brand.lifestyle.wellness.description")}</p>
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
                    alt={t("brand.lifestyle.community.title")}
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-2">{t("brand.lifestyle.community.title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("brand.lifestyle.community.description")}</p>
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
                    alt={t("brand.lifestyle.events.title")}
                    className="w-full h-full object-contain"
                  />
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-foreground mb-2">{t("brand.lifestyle.events.title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("brand.lifestyle.events.description")}</p>
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
                {t("brand.philosophy.title")}
              </h2>
              <p className="opacity-80 leading-relaxed">
                {t("brand.philosophy.p1")}
              </p>
              <p className="opacity-80 leading-relaxed">
                {t("brand.philosophy.p2")}
              </p>
              <div className="grid grid-cols-3 gap-6 pt-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary">50,000+</p>
                  <p className="text-sm opacity-70">{t("brand.philosophy.stat1")}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary">5</p>
                  <p className="text-sm opacity-70">{t("brand.philosophy.stat2")}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-secondary">100%</p>
                  <p className="text-sm opacity-70">{t("brand.philosophy.stat3")}</p>
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
                alt={t("brand.philosophy.title")}
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
              {t("brand.milestonesSection.title")}
            </h2>
            <p className="text-muted-foreground">{t("brand.milestonesSection.subtitle")}</p>
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
                            <Badge variant="outline" className="text-xs mb-2 text-secondary border-secondary/50">{t("brand.milestonesSection.futurePlan")}</Badge>
                          )}
                          {milestone.type === "present" && (
                            <Badge className="text-xs mb-2 bg-secondary text-secondary-foreground">{t("brand.milestonesSection.inProgress")}</Badge>
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
                  alt={t("brand.partnerStories.alt1")}
                  className="w-full h-auto object-contain"
                  data-testid="img-partner-stories-1"
                />
              </div>
              <div className="rounded-xl shadow-lg overflow-hidden bg-muted mt-6">
                <img 
                  src="/pics/partner_story_2.webp"
                  alt={t("brand.partnerStories.alt2")}
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="rounded-xl shadow-lg overflow-hidden bg-muted">
                <img 
                  src="/pics/partner_story_3.webp"
                  alt={t("brand.partnerStories.alt3")}
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
                {t("brand.partnerStories.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.partnerStories.p1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.partnerStories.p2")}
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Link href="/partner">
                  <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-become-partner">
                    <Users className="w-4 h-4" />
                    {t("brand.partnerStories.becomePartner")}
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                  data-testid="button-contact-brand"
                >
                  {t("brand.partnerStories.learnMore")}
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
                {t("brand.futureVision.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.futureVision.p1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("brand.futureVision.p2")}
              </p>
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-muted-foreground">{t("brand.futureVision.goal1")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-muted-foreground">{t("brand.futureVision.goal2")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-muted-foreground">{t("brand.futureVision.goal3")}</span>
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
                alt={t("brand.futureVision.title")}
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-future-vision"
              />
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="section-community-wellness">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-community-title">
              {t("brand.communityWellness.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("brand.communityWellness.subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="overflow-hidden h-full">
                <img 
                  src="/attached_assets/love_young_community_impact_20260106043528_1_1769380081881.png"
                  alt={t("brand.communityWellness.impact.title")}
                  className="w-full h-64 object-cover"
                  data-testid="img-community-impact"
                />
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-primary mb-2">{t("brand.communityWellness.impact.title")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("brand.communityWellness.impact.description")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="overflow-hidden h-full">
                <img 
                  src="/attached_assets/love_young_wellness_lifestyle_20260106043539_1_1769380081885.png"
                  alt={t("brand.communityWellness.wellnessLife.title")}
                  className="w-full h-64 object-cover"
                  data-testid="img-wellness-lifestyle"
                />
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-primary mb-2">{t("brand.communityWellness.wellnessLife.title")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("brand.communityWellness.wellnessLife.description")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="overflow-hidden h-full">
                <img 
                  src="/attached_assets/love_young_event_experience_20260106043435_1_1769380063105.png"
                  alt={t("brand.communityWellness.brandEvents.title")}
                  className="w-full h-64 object-cover"
                  data-testid="img-event-experience"
                />
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-primary mb-2">{t("brand.communityWellness.brandEvents.title")}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t("brand.communityWellness.brandEvents.description")}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-brand-cta">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-primary mb-6" data-testid="text-cta-title">
            {t("brand.cta.title")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("brand.cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/products">
              <Button size="lg" className="bg-secondary text-secondary-foreground gap-2" data-testid="button-view-products">
                {t("brand.cta.viewProducts")}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-brand-whatsapp"
            >
              {t("brand.cta.whatsapp")}
            </Button>
          </div>
        </div>
      </section>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
