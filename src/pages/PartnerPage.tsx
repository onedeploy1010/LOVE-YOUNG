import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/lib/i18n";
import { 
  CheckCircle,
  Zap,
  Globe,
  ArrowRight,
  Star,
  MessageCircle,
  Building2,
  Lock,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Gem,
  Coins,
  Users,
  ArrowDown,
  Wallet,
  Calculator,
  PieChart,
  BarChart3,
  AlertTriangle,
  Info,
  Gift,
  Repeat,
  ArrowUpRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Member, Partner } from "@shared/types";

const WHATSAPP_PHONE = "60124017174";
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const PARTNER_TIERS = [
  {
    id: "phase1",
    name: "启航经营人",
    subtitle: "Phase 1",
    price: 1000,
    lyPoints: 2000,
    dividendWeight: "1.0x",
    icon: Star,
    features: [
      "首5盒销售50%返现",
      "6-10盒销售30%返现",
      "超出部分20%返现",
      "首盒产品赠送",
      "个人形象拍摄",
      "10层推荐积分补充"
    ],
    highlight: false
  },
  {
    id: "phase2",
    name: "创始经营人",
    subtitle: "Phase 2",
    price: 1300,
    lyPoints: 2860,
    dividendWeight: "1.2x",
    icon: ShieldCheck,
    features: [
      "1.2x 分红权重加成",
      "首5盒销售50%返现",
      "6-10盒销售30%返现",
      "燕窝工厂VIP参观",
      "品牌微电影参与",
      "10层推荐积分补充"
    ],
    highlight: true
  },
  {
    id: "phase3",
    name: "战略经营人",
    subtitle: "Phase 3",
    price: 1500,
    lyPoints: 3750,
    dividendWeight: "1.5x",
    icon: Gem,
    features: [
      "1.5x 分红权重加成",
      "顶级奖金池优先分配",
      "国际品牌发布会席位",
      "联名款产品分润",
      "专属商业合作空间",
      "10层推荐积分补充"
    ],
    highlight: false
  }
];

const CORE_CONCEPTS = [
  {
    icon: Building2,
    title: "底层资产透明",
    description: "每一份数字化经营权都锚定真实的燕窝原料、高端滋补品库存等实物资产。"
  },
  {
    icon: Lock,
    title: "收益确权保障",
    description: "基于LY能量值系统进行收益确权，数据透明，结算高效。"
  },
  {
    icon: Globe,
    title: "全球化流转",
    description: "打破地域限制，参与全球高端康养产业链的布局与分红。"
  }
];

const LY_NETWORK_LEVELS = [
  { level: 1, percentage: 20, description: "直推" },
  { level: 2, percentage: 15, description: "二级" },
  { level: 3, percentage: 10, description: "三级" },
  { level: 4, percentage: 10, description: "四级" },
  { level: 5, percentage: 10, description: "五级" },
  { level: 6, percentage: 5, description: "六级" },
  { level: 7, percentage: 5, description: "七级" },
  { level: 8, percentage: 5, description: "八级" },
  { level: 9, percentage: 5, description: "九级" },
  { level: 10, percentage: 5, description: "十级" }
];

const FAQ_ITEMS = [
  {
    question: "什么是联合经营人？和传统代理有什么区别？",
    answer: "联合经营人是品牌的共建伙伴，而非传统的层级代理。我们不设压货要求，所有收益都来自真实的终端产品销售。您分享的每一盒产品都直接从工厂发货，确保品质和新鲜度。"
  },
  {
    question: "投入RM1000真的能获得RM2000以上收益吗？",
    answer: "是的！投入RM1000成为启航经营人，您将获得2000 LY能量值。这意味着您最低可以提取RM2000的收益（1:1扣除LY）。但收益远不止2倍——通过您的10层推荐网体，每次有人销售，您都会按比例补充LY能量值，源源不断地解锁更多收益！"
  },
  {
    question: "返现分红和RWA奖金池分红有什么区别？",
    answer: "返现分红是您直接销售或3代推荐网体销售产生的即时返现（50%/30%/20%）。RWA奖金池分红是每10天一次的周期性分红，平台将30%销售额放入奖金池，按您持有的RWA令牌比例分配。两种分红提现时都需要扣除等额LY能量值。"
  },
  {
    question: "LY能量值是什么？如何补充？",
    answer: "LY能量值是您的收益保障金。每次您的10层推荐网体内有销售，您都会按层级比例获得LY能量值补充（第1层8%，第2层5%...）。只要您的网体持续活跃，LY能量值就源源不断，收益自然绵绵不绝！"
  },
  {
    question: "为什么提现需要扣除LY能量值？",
    answer: "LY能量值机制确保收益的可持续性。这个设计鼓励经营人建立稳定的销售网络，通过持续行动来解锁更多收益，而不是一次性套现。只要保持行动，您的收益将远超初始投入！"
  },
  {
    question: "需要囤货吗？",
    answer: "完全不需要！所有产品都由工厂直接发货给终端客户，您只需专注于分享和推广。零库存、零风险！"
  }
];

function NetworkDiagram({ t }: { t: (key: string) => string }) {
  const [animatedLevel, setAnimatedLevel] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimatedLevel(prev => (prev + 1) % 4);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative py-8">
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <motion.div 
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-bold text-sm sm:text-lg shadow-lg"
          animate={{ scale: animatedLevel === 0 ? [1, 1.1, 1] : 1 }}
          transition={{ duration: 0.5 }}
        >
          {t("partner.network.you")}
        </motion.div>
        
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-8 bg-secondary/50" />
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-center max-w-xs sm:max-w-none">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold shadow-md ${
                animatedLevel === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}
              animate={{ 
                scale: animatedLevel === 1 ? [1, 1.15, 1] : 1,
                backgroundColor: animatedLevel === 1 ? ["hsl(var(--muted))", "hsl(var(--primary))", "hsl(var(--primary))"] : undefined
              }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {t("partner.network.gen1")}
            </motion.div>
          ))}
        </div>
        
        <div className="text-center">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            {t("partner.dividends.cashback50")}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 mt-2 flex-wrap justify-center max-w-xs sm:max-w-md">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <motion.div
              key={i}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs font-bold shadow ${
                animatedLevel === 2 ? "bg-secondary/80 text-secondary-foreground" : "bg-muted/80 text-muted-foreground"
              }`}
              animate={{ 
                scale: animatedLevel === 2 ? [1, 1.2, 1] : 1 
              }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
            >
              {t("partner.network.gen2")}
            </motion.div>
          ))}
        </div>
        
        <Badge variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
          {t("partner.dividends.cashback30")}
        </Badge>
        
        <div className="flex items-center gap-2 sm:gap-4 mt-2 flex-wrap justify-center max-w-xs sm:max-w-md">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <motion.div
              key={i}
              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-medium ${
                animatedLevel === 3 ? "bg-muted-foreground/20 text-foreground" : "bg-muted/50 text-muted-foreground"
              }`}
              animate={{ 
                scale: animatedLevel === 3 ? [1, 1.15, 1] : 1 
              }}
              transition={{ duration: 0.5, delay: i * 0.03 }}
            >
              {t("partner.network.gen3")}
            </motion.div>
          ))}
        </div>
        
        <Badge variant="outline" className="bg-muted text-muted-foreground">
          {t("partner.dividends.cashback20")}
        </Badge>
      </div>
      
      {animatedLevel > 0 && (
        <motion.div
          className="hidden sm:flex absolute top-1/2 right-4 items-center gap-2"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
        >
          <Coins className="w-5 h-5 text-secondary animate-pulse" />
          <span className="text-sm font-bold text-secondary">{t("partner.network.plusCashback")}</span>
        </motion.div>
      )}
    </div>
  );
}

export default function PartnerPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [calculatorBoxes, setCalculatorBoxes] = useState(10);
  
  const [rwaSimulator, setRwaSimulator] = useState({
    mySales: 20,
    totalPoolSales: 500,
    totalPartners: 50,
    avgSalesPerPartner: 10
  });

  const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(t("partner.whatsappMessage"))}`;

  const PARTNER_TIERS_TRANSLATED = useMemo(() => [
    {
      id: "phase1",
      name: t("partner.tierNames.phase1"),
      subtitle: "Phase 1",
      price: 1000,
      lyPoints: 2000,
      dividendWeight: "1.0x",
      icon: Star,
      features: [
        t("partner.tierFeatures.cashback50First5"),
        t("partner.tierFeatures.cashback30Next5"),
        t("partner.tierFeatures.cashback20Rest"),
        t("partner.tierFeatures.freeFirstBox"),
        t("partner.tierFeatures.photoShoot"),
        t("partner.tierFeatures.tenLevelBonus")
      ],
      highlight: true,
      disabled: false,
      badge: t("landing.hotSelling") + " · " + t("landing.only50Slots")
    },
    {
      id: "phase2",
      name: t("partner.tierNames.phase2"),
      subtitle: "Phase 2",
      price: 1300,
      lyPoints: 2860,
      dividendWeight: "1.2x",
      icon: ShieldCheck,
      features: [
        t("partner.tierFeatures.weight12x"),
        t("partner.tierFeatures.cashback50First5"),
        t("partner.tierFeatures.cashback30Next5"),
        t("partner.tierFeatures.factoryVip"),
        t("partner.tierFeatures.microFilm"),
        t("partner.tierFeatures.tenLevelBonus")
      ],
      highlight: false,
      disabled: true,
      badge: t("landing.comingSoon")
    },
    {
      id: "phase3",
      name: t("partner.tierNames.phase3"),
      subtitle: "Phase 3",
      price: 1500,
      lyPoints: 3750,
      dividendWeight: "1.5x",
      icon: Gem,
      features: [
        t("partner.tierFeatures.weight15x"),
        t("partner.tierFeatures.topPoolPriority"),
        t("partner.tierFeatures.intlLaunch"),
        t("partner.tierFeatures.cobranding"),
        t("partner.tierFeatures.exclusiveBiz"),
        t("partner.tierFeatures.tenLevelBonus")
      ],
      highlight: false,
      disabled: true,
      badge: t("landing.comingSoon")
    }
  ], [t]);

  const CORE_CONCEPTS_TRANSLATED = useMemo(() => [
    {
      icon: Building2,
      title: t("partner.concepts.assetTransparency"),
      description: t("partner.concepts.assetTransparencyDesc")
    },
    {
      icon: Lock,
      title: t("partner.concepts.earningsGuarantee"),
      description: t("partner.concepts.earningsGuaranteeDesc")
    },
    {
      icon: Globe,
      title: t("partner.concepts.globalFlow"),
      description: t("partner.concepts.globalFlowDesc")
    }
  ], [t]);

  const LY_NETWORK_LEVELS_TRANSLATED = useMemo(() => [
    { level: 1, percentage: 20, description: t("partner.ly.level1") },
    { level: 2, percentage: 15, description: t("partner.ly.level2") },
    { level: 3, percentage: 10, description: t("partner.ly.level3") },
    { level: 4, percentage: 10, description: t("partner.ly.level4") },
    { level: 5, percentage: 10, description: t("partner.ly.level5") },
    { level: 6, percentage: 5, description: t("partner.ly.level6") },
    { level: 7, percentage: 5, description: t("partner.ly.level7") },
    { level: 8, percentage: 5, description: t("partner.ly.level8") },
    { level: 9, percentage: 5, description: t("partner.ly.level9") },
    { level: 10, percentage: 5, description: t("partner.ly.level10") }
  ], [t]);

  const FAQ_ITEMS_TRANSLATED = useMemo(() => [
    {
      question: t("partner.faqs.q1"),
      answer: t("partner.faqs.a1")
    },
    {
      question: t("partner.faqs.q2"),
      answer: t("partner.faqs.a2")
    },
    {
      question: t("partner.faqs.q3"),
      answer: t("partner.faqs.a3")
    },
    {
      question: t("partner.faqs.q4"),
      answer: t("partner.faqs.a4")
    },
    {
      question: t("partner.faqs.q5"),
      answer: t("partner.faqs.a5")
    },
    {
      question: t("partner.faqs.q6"),
      answer: t("partner.faqs.a6")
    }
  ], [t]);

  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const { data: member } = useQuery<Member>({
    queryKey: ["/api/member/profile"],
    enabled: !!user,
  });

  const { data: partner } = useQuery<Partner>({
    queryKey: ["/api/partner/profile"],
    enabled: !!member,
  });

  const joinPartnerMutation = useMutation({
    mutationFn: async (data: { tier: string; referralCode?: string }) => {
      return apiRequest("POST", "/api/partner/join", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/profile"] });
      toast({
        title: t("partner.page.applicationSubmitted"),
        description: t("partner.page.applicationSubmittedDesc"),
      });
      setSelectedTier(null);
    },
    onError: (error: Error) => {
      toast({
        title: t("partner.page.applicationFailed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoin = (tierId: string) => {
    navigate("/partner/join");
  };

  const handleSubmitJoin = () => {
    if (!selectedTier) return;
    joinPartnerMutation.mutate({
      tier: selectedTier,
      referralCode: referralCode || undefined,
    });
  };

  const calculateEarnings = (boxes: number) => {
    const pricePerBox = 199;
    let cashback = 0;
    if (boxes <= 5) {
      cashback = boxes * pricePerBox * 0.5;
    } else if (boxes <= 10) {
      cashback = 5 * pricePerBox * 0.5 + (boxes - 5) * pricePerBox * 0.3;
    } else {
      cashback = 5 * pricePerBox * 0.5 + 5 * pricePerBox * 0.3 + (boxes - 10) * pricePerBox * 0.2;
    }
    return Math.round(cashback);
  };

  const rwaCalculation = useMemo(() => {
    const pricePerBox = 199;
    const bonusPoolRate = 0.30;
    
    const totalSalesAmount = rwaSimulator.totalPoolSales * pricePerBox;
    const bonusPool = totalSalesAmount * bonusPoolRate;
    
    const myTokens = 1 + rwaSimulator.mySales;
    const avgTokensPerPartner = 1 + rwaSimulator.avgSalesPerPartner;
    const totalTokens = rwaSimulator.totalPartners * avgTokensPerPartner;
    
    const myShare = myTokens / totalTokens;
    const myDividend = bonusPool * myShare;
    
    return {
      totalSalesAmount,
      bonusPool,
      myTokens,
      totalTokens,
      myShare,
      myDividend
    };
  }, [rwaSimulator]);

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

      <section className="pt-32 pb-24 relative overflow-hidden" data-testid="section-partner-hero">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-secondary/5 -skew-x-12 transform translate-x-1/4 -z-10" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-primary mb-6 leading-tight" data-testid="text-partner-title">
                {t("partner.page.heroTitle1")}<br />
                {t("partner.page.heroTitle2")}<span className="text-secondary font-bold">{t("partner.page.heroTitle3")}</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="text-partner-subtitle">
                {t("partner.page.heroSubtitle")}<strong>{t("partner.page.heroSubtitleBold")}</strong>
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground"
                  onClick={() => document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-apply-now"
                >
                  {t("partner.page.applyNow")}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                  data-testid="button-download-whitepaper"
                >
                  {t("partner.page.consultDetails")}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-secondary/10" data-testid="section-income-promise">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="p-6"
            >
              <p className="text-5xl font-bold text-primary mb-2">RM 1,000</p>
              <p className="text-muted-foreground">{t("partner.page.minInvestment")}</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.1 }}
              className="p-6"
            >
              <p className="text-5xl font-bold text-secondary mb-2">2,000 LY</p>
              <p className="text-muted-foreground">{t("partner.page.lyPointsObtained")}</p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              transition={{ delay: 0.2 }}
              className="p-6"
            >
              <p className="text-5xl font-bold text-primary mb-2">
                <span className="text-secondary">∞</span>
              </p>
              <p className="text-muted-foreground">{t("partner.page.unlimitedEarnings")}</p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-core-concepts">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {CORE_CONCEPTS_TRANSLATED.map((concept, index) => (
              <motion.div
                key={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
                className="space-y-4"
              >
                <div className="w-14 h-14 bg-secondary/10 rounded-2xl flex items-center justify-center">
                  <concept.icon className="text-secondary w-7 h-7" />
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-primary">{concept.title}</h3>
                <p className="text-muted-foreground">{concept.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20" data-testid="section-two-dividends">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-dividends-title">
              {t("partner.dividends.title")}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t("partner.dividends.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="h-full border-2 border-primary/20 overflow-hidden">
                <CardHeader className="bg-primary/5 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
                      <Gift className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <Badge className="bg-primary text-primary-foreground mb-1">{t("partner.dividends.method1")}</Badge>
                      <CardTitle className="text-2xl font-serif">{t("partner.dividends.cashbackTitle")}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-6">
                    {t("partner.dividends.cashbackDesc")}
                  </p>
                  
                  <NetworkDiagram t={t} />

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <span className="font-medium">{t("partner.dividends.gen1")}</span>
                      <Badge className="bg-primary text-primary-foreground">{t("partner.dividends.cashback50")}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                      <span className="font-medium">{t("partner.dividends.gen2")}</span>
                      <Badge className="bg-secondary text-secondary-foreground">{t("partner.dividends.cashback30")}</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="font-medium">{t("partner.dividends.gen3")}</span>
                      <Badge variant="outline">{t("partner.dividends.cashback20")}</Badge>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-secondary/10 rounded-xl border border-secondary/20">
                    <p className="text-sm">
                      {t("partner.dividends.cashbackExample")}
                    </p>
                  </div>
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
              <Card className="h-full border-2 border-secondary/20 overflow-hidden">
                <CardHeader className="bg-secondary/5 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center">
                      <PieChart className="w-7 h-7 text-secondary-foreground" />
                    </div>
                    <div>
                      <Badge className="bg-secondary text-secondary-foreground mb-1">{t("partner.dividends.method2")}</Badge>
                      <CardTitle className="text-2xl font-serif">{t("partner.dividends.rwaTitle")}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground mb-6">
                    {t("partner.dividends.rwaDesc")}
                  </p>

                  <div className="relative py-6">
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <BarChart3 className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-primary">30%</p>
                        <p className="text-xs text-muted-foreground">{t("partner.dividends.salesIntoPool")}</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-2">
                          <Coins className="w-8 h-8 text-secondary" />
                        </div>
                        <p className="text-2xl font-bold text-secondary">RWA</p>
                        <p className="text-xs text-muted-foreground">{t("partner.dividends.distributeByToken")}</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <Wallet className="w-8 h-8 text-primary" />
                        </div>
                        <p className="text-2xl font-bold text-primary">{t("partner.dividends.yourDividend")}</p>
                        <p className="text-xs text-muted-foreground">{t("partner.dividends.yourDividend")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                      <span className="text-sm">{t("partner.dividends.autoToken")}</span>
                      <span className="font-bold text-secondary">1 RWA</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/5 rounded-lg">
                      <span className="text-sm">{t("partner.dividends.tokenPerSale")}</span>
                      <span className="font-bold text-secondary">+1 RWA</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                      <span className="text-sm">{t("partner.dividends.cycleReset")}</span>
                      <span className="font-bold text-primary">{t("partner.dividends.tokenReset")}</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-primary/10 rounded-xl border border-primary/20">
                    <p className="text-sm">
                      {t("partner.dividends.rwaExample")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground" data-testid="section-ly-mechanism">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif mb-4" data-testid="text-ly-title">
              {t("partner.ly.title")}
            </h2>
            <p className="opacity-80 max-w-2xl mx-auto">
              {t("partner.ly.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="p-6 bg-primary-foreground/10 border-primary-foreground/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{t("partner.ly.networkTitle")}</h3>
                    <p className="text-sm opacity-70">{t("partner.ly.networkSubtitle")}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {LY_NETWORK_LEVELS_TRANSLATED.map((level) => (
                    <div key={level.level} className="flex items-center gap-3" data-testid={`ly-level-${level.level}`}>
                      <div className="w-7 h-7 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-bold text-secondary">
                        {level.level}
                      </div>
                      <div className="flex-1">
                        <div className="h-5 bg-primary-foreground/10 rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-secondary rounded-full flex items-center justify-end pr-2"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${level.percentage * 5}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: level.level * 0.05 }}
                          >
                            <span className="text-xs font-bold text-secondary-foreground">{level.percentage}%</span>
                          </motion.div>
                        </div>
                      </div>
                      <span className="text-xs opacity-70 w-10">{level.description}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-secondary/20 rounded-xl">
                  <p className="text-sm">
                    {t("partner.ly.totalReplenish")} <span className="text-secondary font-bold">100%</span> {t("partner.ly.ofSales")}
                  </p>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <Card className="p-6 bg-primary-foreground/10 border-primary-foreground/20">
                <div className="flex items-center gap-3 mb-4">
                  <Repeat className="w-8 h-8 text-secondary" />
                  <h3 className="text-xl font-bold">{t("partner.ly.cycleTitle")}</h3>
                </div>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-secondary/20 rounded-lg font-medium">{t("partner.ly.salesGenerate")}</div>
                    <ArrowRight className="w-5 h-5" />
                    <div className="px-4 py-2 bg-secondary/20 rounded-lg font-medium">{t("partner.ly.enterWallet")}</div>
                  </div>
                  <ArrowDown className="w-5 h-5" />
                  <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-secondary rounded-lg font-medium text-secondary-foreground">{t("partner.ly.withdrawDeduct")}</div>
                    <ArrowRight className="w-5 h-5" />
                    <div className="px-4 py-2 bg-secondary rounded-lg font-medium text-secondary-foreground">{t("partner.ly.networkReplenish")}</div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-secondary" />
                  <p className="text-sm opacity-80 text-center">
                    {t("partner.ly.keepActive")}<br />
                    <span className="text-secondary font-bold text-lg">{t("partner.ly.neverDry")}</span>
                  </p>
                </div>
              </Card>

              <Card className="p-6 bg-secondary/20 border-secondary/30">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold mb-2">{t("partner.ly.whyMoreTitle")}</h4>
                    <p className="text-sm opacity-80">
                      {t("partner.ly.whyMoreDesc")}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-destructive/10 border-destructive/30">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-foreground mb-2">{t("partner.ly.importantNote")}</h4>
                    <p className="text-sm text-foreground/80">
                      {t("partner.ly.importantNoteDesc")}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="tiers" className="py-20" data-testid="section-partner-tiers">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-tiers-title">
              {t("partner.tierSection.title")}
            </h2>
            <p className="text-muted-foreground">{t("partner.tierSection.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {PARTNER_TIERS_TRANSLATED.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
                className={tier.highlight ? "md:scale-105 md:z-10" : ""}
              >
                <Card 
                  className={`h-full flex flex-col relative overflow-hidden ${
                    tier.highlight 
                      ? "border-2 border-secondary shadow-lg" 
                      : tier.disabled
                        ? "border border-muted-foreground/20 opacity-60"
                        : "border"
                  }`}
                  data-testid={`card-tier-${tier.id}`}
                >
                  {tier.badge && (
                    <div className="absolute -top-0 left-0 right-0">
                      <Badge className={`w-full rounded-none justify-center py-1 ${
                        tier.highlight 
                          ? "bg-secondary text-secondary-foreground animate-pulse" 
                          : "bg-muted-foreground/50 text-muted-foreground"
                      }`}>
                        {tier.badge}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={`text-center pt-10 ${
                    tier.highlight ? "bg-secondary/5" : tier.disabled ? "bg-muted/20" : "bg-muted/30"
                  }`}>
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      tier.highlight 
                        ? "bg-secondary text-secondary-foreground" 
                        : tier.disabled
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground"
                    }`}>
                      <tier.icon className="w-8 h-8" />
                    </div>
                    <CardTitle className={`text-2xl font-serif ${tier.disabled ? "text-muted-foreground" : ""}`}>
                      {tier.name}
                    </CardTitle>
                    <Badge variant="outline" className={`mx-auto mt-2 ${tier.disabled ? "opacity-50" : ""}`}>
                      {tier.subtitle}
                    </Badge>
                  </CardHeader>

                  <CardContent className="flex-1 p-6">
                    <div className="text-center mb-6">
                      <div className="text-sm text-muted-foreground uppercase tracking-widest">{t("partner.tierSection.invest")}</div>
                      <div className={`text-3xl font-bold mt-1 ${tier.disabled ? "text-muted-foreground" : "text-foreground"}`}>
                        RM {tier.price.toLocaleString()}
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl text-center mb-6 ${
                      tier.disabled 
                        ? "bg-muted/30 border border-muted-foreground/20" 
                        : "bg-secondary/10 border border-secondary/20"
                    }`}>
                      <p className="text-xs text-muted-foreground">{t("partner.tierSection.getLyPoints")}</p>
                      <p className={`text-3xl font-bold ${tier.disabled ? "text-muted-foreground" : "text-secondary"}`}>
                        {tier.lyPoints.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t("partner.tierSection.minWithdraw")}{tier.lyPoints.toLocaleString()}</p>
                    </div>

                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <div className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                            tier.disabled ? "bg-muted-foreground/20" : "bg-secondary/20"
                          }`}>
                            <CheckCircle className={`w-3 h-3 ${tier.disabled ? "text-muted-foreground/50" : "text-secondary"}`} />
                          </div>
                          <span className={tier.disabled ? "text-muted-foreground/60" : "text-muted-foreground"}>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    <Button
                      className={`w-full ${tier.highlight ? "bg-secondary text-secondary-foreground" : ""}`}
                      variant={tier.highlight ? "default" : tier.disabled ? "secondary" : "outline"}
                      onClick={() => !tier.disabled && handleJoin(tier.id)}
                      disabled={tier.disabled}
                      data-testid={`button-join-${tier.id}`}
                    >
                      {tier.disabled ? t("landing.waitingToOpen") : t("partner.tierSection.consultNow")}
                      {!tier.disabled && <ArrowRight className="ml-2 w-4 h-4" />}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-rwa-simulator">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-simulator-title">
              {t("partner.simulator.title")}
            </h2>
            <p className="text-muted-foreground">{t("partner.simulator.subtitle")}</p>
          </div>

          <Card className="p-6 md:p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">
                    {t("partner.simulator.mySales")}: <span className="text-secondary font-bold">{rwaSimulator.mySales} {t("partner.simulator.boxes")}</span>
                  </Label>
                  <Slider
                    value={[rwaSimulator.mySales]}
                    onValueChange={([value]) => setRwaSimulator(prev => ({ ...prev, mySales: value }))}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                    data-testid="slider-my-sales"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">
                    {t("partner.simulator.totalPlatformSales")}: <span className="text-secondary font-bold">{rwaSimulator.totalPoolSales} {t("partner.simulator.boxes")}</span>
                  </Label>
                  <Slider
                    value={[rwaSimulator.totalPoolSales]}
                    onValueChange={([value]) => setRwaSimulator(prev => ({ ...prev, totalPoolSales: value }))}
                    min={100}
                    max={2000}
                    step={10}
                    className="w-full"
                    data-testid="slider-total-sales"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">
                    {t("partner.simulator.activePartners")}: <span className="text-secondary font-bold">{rwaSimulator.totalPartners} {t("partner.simulator.people")}</span>
                  </Label>
                  <Slider
                    value={[rwaSimulator.totalPartners]}
                    onValueChange={([value]) => setRwaSimulator(prev => ({ ...prev, totalPartners: value }))}
                    min={10}
                    max={200}
                    step={5}
                    className="w-full"
                    data-testid="slider-total-partners"
                  />
                </div>
                <div>
                  <Label className="mb-2 block">
                    {t("partner.simulator.avgSalesPerPerson")}: <span className="text-secondary font-bold">{rwaSimulator.avgSalesPerPartner} {t("partner.simulator.boxes")}</span>
                  </Label>
                  <Slider
                    value={[rwaSimulator.avgSalesPerPartner]}
                    onValueChange={([value]) => setRwaSimulator(prev => ({ ...prev, avgSalesPerPartner: value }))}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                    data-testid="slider-avg-sales"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">{t("partner.simulator.cycleTotalSales")}</span>
                    <span className="font-bold">RM {rwaCalculation.totalSalesAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("partner.simulator.bonusPool30")}</span>
                    <span className="font-bold text-secondary">RM {rwaCalculation.bonusPool.toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">{t("partner.simulator.myRwaTokens")}</span>
                    <span className="font-bold">{rwaCalculation.myTokens} {t("partner.simulator.units")}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">{t("partner.simulator.totalPlatformTokens")}</span>
                    <span className="font-bold">{rwaCalculation.totalTokens.toLocaleString()} {t("partner.simulator.units")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">{t("partner.simulator.myRatio")}</span>
                    <span className="font-bold text-secondary">{(rwaCalculation.myShare * 100).toFixed(2)}%</span>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-secondary/10 border border-secondary/30">
                  <p className="text-sm text-muted-foreground mb-2">{t("partner.simulator.estimatedCycleDividend")}</p>
                  <p className="text-4xl font-bold text-secondary" data-testid="text-rwa-dividend">
                    RM {rwaCalculation.myDividend.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">{t("partner.simulator.withdrawNeedsLy")}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-20 bg-muted/30" data-testid="section-ecosystem">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <img 
                src="/attached_assets/love_young_ecosystem_20260106043624_1_1769380035812.png"
                alt={t("partner.ecosystem.imgAlt")}
                className="rounded-2xl shadow-xl w-full"
                data-testid="img-ecosystem"
              />
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl font-serif text-primary" data-testid="text-ecosystem-title">
                {t("partner.ecosystem.title")}
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                {t("partner.ecosystem.desc1")}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                {t("partner.ecosystem.desc2")}
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 rounded-xl bg-background border">
                  <p className="text-2xl font-bold text-secondary">5+</p>
                  <p className="text-sm text-muted-foreground">{t("partner.ecosystem.modules")}</p>
                </div>
                <div className="p-4 rounded-xl bg-background border">
                  <p className="text-2xl font-bold text-secondary">360°</p>
                  <p className="text-sm text-muted-foreground">{t("partner.ecosystem.fullSupport")}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20" data-testid="section-faq">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-faq-title">
              {t("partner.faqs.title")}
            </h2>
            <p className="text-muted-foreground">{t("partner.faqs.subtitle")}</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS_TRANSLATED.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
                <AccordionTrigger className="text-left" data-testid={`faq-trigger-${index}`}>
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-20 bg-secondary/10" data-testid="section-cta">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-primary mb-6" data-testid="text-cta-title">
            {t("partner.cta.title")}
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("partner.cta.subtitle")}<strong>{t("partner.cta.subtitleBold")}</strong>
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground"
              onClick={() => document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="button-final-cta"
            >
              {t("partner.cta.becomePartner")}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => window.open(WHATSAPP_LINK, "_blank")}
              data-testid="button-contact-whatsapp"
            >
              <MessageCircle className="w-5 h-5" />
              {t("partner.cta.whatsappConsult")}
            </Button>
          </div>
        </div>
      </section>

      {selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="modal-join">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              {t("partner.modal.title")}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t("partner.modal.selectedTier")} {PARTNER_TIERS_TRANSLATED.find(tier => tier.id === selectedTier)?.name}
              (RM {PARTNER_TIERS_TRANSLATED.find(tier => tier.id === selectedTier)?.price.toLocaleString()})
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="referralCode">{t("partner.modal.referralCodeOptional")}</Label>
                <Input
                  id="referralCode"
                  placeholder={t("partner.modal.referralCodePlaceholder")}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  data-testid="input-referral-code"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedTier(null)}
                data-testid="button-cancel-join"
              >
                {t("partner.modal.cancel")}
              </Button>
              <Button
                className="flex-1 bg-secondary text-secondary-foreground"
                onClick={handleSubmitJoin}
                disabled={joinPartnerMutation.isPending}
                data-testid="button-confirm-join"
              >
                {joinPartnerMutation.isPending ? "..." : t("partner.modal.confirmAndPay")}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
