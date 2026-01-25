import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  CheckCircle,
  Zap,
  Globe,
  UserPlus,
  ArrowRight,
  Star,
  Shield,
  Clock,
  MessageCircle,
  Target,
  HelpCircle,
  Mail,
  Building2,
  Lock,
  LineChart,
  ShieldCheck,
  TrendingUp,
  Gem
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Member, Partner } from "@shared/schema";

const WHATSAPP_PHONE = "60124017174";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我想了解联合经营人计划。")}`;
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
    lyPoints: 2600,
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
    lyPoints: 3000,
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

const REVENUE_MODEL = [
  {
    icon: Zap,
    title: "即时销售返利",
    description: "自购产品享受经营人专属折扣，分享销售获得高额现金返还。"
  },
  {
    icon: LineChart,
    title: "10天周期分红",
    description: "每10天结算一次奖金池，根据RWA令牌持有量按比例分配。"
  },
  {
    icon: ShieldCheck,
    title: "资产增值预期",
    description: "持续经营积累RWA令牌，享受品牌长期成长的溢价收益。"
  }
];

const FAQ_ITEMS = [
  {
    question: "什么是联合经营人？和传统代理有什么区别？",
    answer: "联合经营人是品牌的共建伙伴，而非传统的层级代理。我们不设压货要求，所有收益都来自真实的终端产品销售。您分享的每一盒产品都直接从工厂发货，确保品质和新鲜度。"
  },
  {
    question: "LY能量值是什么？如何使用？",
    answer: "LY能量值是您在平台上的积分资产。每次推荐网体内的销售都会获得LY能量值补充。这些能量值用于解锁现金分红，确保您的收益可持续增长。"
  },
  {
    question: "RWA奖金池分红如何运作？",
    answer: "每10天为一个分红周期。平台将该周期内30%的销售额放入奖金池，根据每位经营人持有的RWA令牌数量按比例分配。令牌越多，分红越高。"
  },
  {
    question: "需要囤货吗？",
    answer: "完全不需要！这是我们与传统代理模式的最大区别。所有产品都由工厂直接发货给终端客户，您只需专注于分享和推广。"
  },
  {
    question: "提现有什么要求？",
    answer: "现金钱包余额达到RM100即可申请提现。我们支持马来西亚本地银行转账，通常在3个工作日内到账。"
  }
];

export default function PartnerPage() {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");
  const [calculatorBoxes, setCalculatorBoxes] = useState(10);

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
        title: "申请已提交",
        description: "请完成支付后，您的经营人资格将被激活。",
      });
      setSelectedTier(null);
    },
    onError: (error: Error) => {
      toast({
        title: "申请失败",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoin = (tierId: string) => {
    if (!user) {
      window.location.href = "/api/login";
      return;
    }
    setSelectedTier(tierId);
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
                让实物资产<br />
                在数字时代<span className="text-secondary font-bold">共创价值</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed" data-testid="text-partner-subtitle">
                Love Young RWA（Real World Assets）联合经营人计划，将品牌旗下的高端滋补品供应链实物资产进行数字化锚定，让每位会员都能深度参与品牌经营，共享成长红利。
              </p>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="bg-primary text-primary-foreground"
                  onClick={() => document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" })}
                  data-testid="button-apply-now"
                >
                  立即申请加入
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                  data-testid="button-download-whitepaper"
                >
                  咨询计划详情
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-card" data-testid="section-core-concepts">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {CORE_CONCEPTS.map((concept, index) => (
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

      <section id="tiers" className="py-20" data-testid="section-partner-tiers">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-tiers-title">
              经营人级别及权益
            </h2>
            <p className="text-muted-foreground">根据您的布局需求，选择最适合的共创方案</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {PARTNER_TIERS.map((tier, index) => (
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
                      : "border"
                  }`}
                  data-testid={`card-tier-${tier.id}`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-0 left-0 right-0">
                      <Badge className="w-full rounded-none bg-secondary text-secondary-foreground justify-center py-1">
                        最受欢迎
                      </Badge>
                    </div>
                  )}

                  <CardHeader className={`text-center ${tier.highlight ? "pt-10" : ""} ${tier.highlight ? "bg-secondary/5" : "bg-muted/30"}`}>
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                      tier.highlight ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
                    }`}>
                      <tier.icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-serif">{tier.name}</CardTitle>
                    <Badge variant="outline" className="mx-auto mt-2">{tier.subtitle}</Badge>
                  </CardHeader>

                  <CardContent className="flex-1 p-6">
                    <div className="text-center mb-6">
                      <div className="text-sm text-muted-foreground uppercase tracking-widest">投资门槛</div>
                      <div className="text-3xl font-bold text-foreground mt-1">RM {tier.price.toLocaleString()}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs text-muted-foreground">分红权重</p>
                        <p className="text-xl font-bold text-primary">{tier.dividendWeight}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">获得 LY 能量值</p>
                        <p className="text-xl font-bold text-secondary">{tier.lyPoints.toLocaleString()}</p>
                      </div>
                    </div>

                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <div className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center">
                            <CheckCircle className="w-3 h-3 text-secondary" />
                          </div>
                          <span className="text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-6 pt-0">
                    <Button
                      className={`w-full ${tier.highlight ? "bg-secondary text-secondary-foreground" : ""}`}
                      variant={tier.highlight ? "default" : "outline"}
                      onClick={() => handleJoin(tier.id)}
                      data-testid={`button-join-${tier.id}`}
                    >
                      立即咨询详情
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground overflow-hidden relative" data-testid="section-revenue-model">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-serif mb-8" data-testid="text-revenue-title">多元化收益模型</h2>
              <div className="space-y-8">
                {REVENUE_MODEL.map((item, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border border-secondary flex items-center justify-center text-secondary">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-2">{item.title}</h4>
                      <p className="opacity-70">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="p-6 md:p-8 bg-primary-foreground/10 backdrop-blur-xl border-primary-foreground/20">
              <h3 className="text-2xl font-serif text-secondary mb-6" data-testid="text-calculator-title">收益试算</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <Label className="text-primary-foreground/70">每月销售盒数</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={calculatorBoxes}
                    onChange={(e) => setCalculatorBoxes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-center text-xl"
                    data-testid="input-calculator-boxes"
                  />
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between pb-3 border-b border-primary-foreground/10">
                  <span className="opacity-70">产品单价</span>
                  <span className="font-bold">RM 199</span>
                </div>
                <div className="flex justify-between pb-3 border-b border-primary-foreground/10">
                  <span className="opacity-70">返现规则</span>
                  <span className="text-secondary font-bold">50% / 30% / 20%</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="opacity-70">预估月度返现</span>
                  <span className="text-secondary font-bold text-2xl" data-testid="text-calculated-earnings">
                    RM {calculateEarnings(calculatorBoxes).toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                className="w-full mt-6 bg-secondary text-secondary-foreground"
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                data-testid="button-consult-manager"
              >
                咨询康养管家
              </Button>
              <p className="text-center mt-4 text-xs opacity-50">
                * 以上数据仅为预测，不构成收益承诺
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20" data-testid="section-faq">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-primary mb-4" data-testid="text-faq-title">
              常见问题
            </h2>
            <p className="text-muted-foreground">解答您的疑虑</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
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

      <section className="py-20 bg-card" data-testid="section-cta">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-serif text-primary mb-6" data-testid="text-cta-title">
            开启您的优雅商业新篇章
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            加入 Love Young 联合经营人计划，不仅是资产的配置，更是圈层的进阶。下一场品牌私享沙龙，期待您的身影。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground"
              onClick={() => document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="button-final-cta"
            >
              立即成为联合经营人
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
              WhatsApp 咨询
            </Button>
          </div>
        </div>
      </section>

      {selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="modal-join">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-foreground mb-4">
              申请成为联合经营人
            </h3>
            <p className="text-muted-foreground mb-6">
              您选择了 {PARTNER_TIERS.find(t => t.id === selectedTier)?.name}
              (RM {PARTNER_TIERS.find(t => t.id === selectedTier)?.price.toLocaleString()})
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="referralCode">推荐人邀请码（可选）</Label>
                <Input
                  id="referralCode"
                  placeholder="输入推荐人8位邀请码"
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
                取消
              </Button>
              <Button
                className="flex-1 bg-secondary text-secondary-foreground"
                onClick={handleSubmitJoin}
                disabled={joinPartnerMutation.isPending}
                data-testid="button-confirm-join"
              >
                {joinPartnerMutation.isPending ? "提交中..." : "提交申请"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
