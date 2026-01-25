import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Gift, 
  CheckCircle,
  BarChart3,
  Zap,
  Globe,
  UserPlus,
  ArrowRight,
  Star,
  Shield,
  Clock,
  MessageCircle,
  Heart,
  Sparkles,
  Target,
  Award,
  Calculator,
  HelpCircle,
  Phone,
  Mail,
  MapPin
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
    name: "启航配套",
    subtitle: "Phase 1",
    price: 1000,
    lyPoints: 2000,
    description: "适合初次创业者，低门槛开启事业",
    features: [
      "首5盒销售50%返现",
      "6-10盒销售30%返现",
      "超出20%返现",
      "首盒产品赠送",
      "个人高端写真拍摄",
      "10层推荐积分补充"
    ],
    highlight: false
  },
  {
    id: "phase2",
    name: "进阶配套",
    subtitle: "Phase 2",
    price: 1300,
    lyPoints: 2600,
    description: "最受欢迎，平衡投入与回报",
    features: [
      "1.2x 分红权重加成",
      "首5盒销售50%返现",
      "6-10盒销售30%返现",
      "燕窝工厂VIP参观权",
      "微电影拍摄参与机会",
      "10层推荐积分补充"
    ],
    highlight: true
  },
  {
    id: "phase3",
    name: "领航配套",
    subtitle: "Phase 3",
    price: 1500,
    lyPoints: 3000,
    description: "最大权益，适合资深创业者",
    features: [
      "1.5x 分红权重加成",
      "顶级奖金池分配",
      "国际品牌发布会席位",
      "联名款产品收益分润",
      "专属商业合作空间",
      "10层推荐积分补充"
    ],
    highlight: false
  }
];

const SUCCESS_STORIES = [
  {
    name: "陈小姐",
    location: "吉隆坡",
    tier: "Phase 2",
    months: 6,
    earnings: "RM 12,000+",
    quote: "从一名全职妈妈到成功的联合经营人，Love Young让我找到了事业与家庭的平衡点。",
    avatar: "C"
  },
  {
    name: "林小姐",
    location: "槟城",
    tier: "Phase 1",
    months: 3,
    earnings: "RM 5,500+",
    quote: "简单分享好产品，三个月就回本了。感谢这个透明公平的平台。",
    avatar: "L"
  },
  {
    name: "王小姐",
    location: "新山",
    tier: "Phase 3",
    months: 8,
    earnings: "RM 28,000+",
    quote: "RWA分红机制让我每10天都有额外收入，真正实现了被动收入。",
    avatar: "W"
  }
];

const JOIN_STEPS = [
  {
    step: 1,
    title: "选择配套",
    description: "根据您的预算和目标，选择适合的配套等级",
    icon: Target
  },
  {
    step: 2,
    title: "提交申请",
    description: "填写基本信息，提交加入申请",
    icon: UserPlus
  },
  {
    step: 3,
    title: "完成支付",
    description: "通过安全渠道完成配套费用支付",
    icon: Wallet
  },
  {
    step: 4,
    title: "激活账户",
    description: "获得专属推荐码，开始您的经营之旅",
    icon: Zap
  }
];

const FAQ_ITEMS = [
  {
    question: "什么是联合经营人？和传统代理有什么区别？",
    answer: "联合经营人是品牌的共建伙伴，而非传统的层级代理。我们不设压货要求，所有收益都来自真实的终端产品销售。您分享的每一盒产品都直接从工厂发货，确保品质和新鲜度。"
  },
  {
    question: "加入后多久可以回本？",
    answer: "这取决于您的努力程度。以Phase 1配套为例，您只需完成约10盒销售（每盒约RM199）即可回本。我们的经营人平均在2-3个月内实现回本。"
  },
  {
    question: "LY能量值是什么？如何使用？",
    answer: "LY能量值是您在平台上的积分资产。每次推荐网体内的销售都会获得LY能量值补充。这些能量值可用于解锁现金分红，确保您的收益可持续增长。"
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
    question: "如何邀请朋友加入？",
    answer: "激活账户后，您将获得专属8位推荐码。朋友在注册时输入您的推荐码，即可成为您的直推成员。您将从其销售中获得相应的LY能量值奖励。"
  },
  {
    question: "提现有什么要求？",
    answer: "现金钱包余额达到RM100即可申请提现。我们支持马来西亚本地银行转账，通常在3个工作日内到账。"
  },
  {
    question: "可以退出吗？",
    answer: "可以。如果您在30天内决定退出，可申请全额退款（需扣除已发放产品成本）。我们尊重每位经营人的选择。"
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

      <section className="relative py-20 md:py-28 bg-gradient-to-b from-primary/5 to-background" data-testid="section-partner-intro">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <Badge className="mb-6 bg-secondary/20 text-secondary border-secondary/30" data-testid="badge-partner-program">
              联合经营人招募计划
            </Badge>
            
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6" data-testid="text-partner-title">
              不是代理，是<span className="text-secondary">品牌共建人</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-partner-subtitle">
              Love Young 拒绝传统代理模式。零囤货、零压力，每一分收益都来自真实的产品销售。
              加入我们，用分享创造价值。
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 bg-secondary text-secondary-foreground"
                onClick={() => document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="button-view-tiers"
              >
                查看配套详情
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => document.getElementById("faq")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="button-view-faq"
              >
                <HelpCircle className="w-5 h-5" />
                常见问题
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 bg-card border-y" data-testid="section-partner-stats">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-secondary" data-testid="stat-partners">500+</div>
              <div className="text-sm text-muted-foreground">活跃经营人</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-secondary" data-testid="stat-sales">RM 2M+</div>
              <div className="text-sm text-muted-foreground">累计销售额</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-secondary" data-testid="stat-cashback">RM 800K+</div>
              <div className="text-sm text-muted-foreground">已发放返现</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-secondary" data-testid="stat-avg-roi">2.5个月</div>
              <div className="text-sm text-muted-foreground">平均回本周期</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20" data-testid="section-join-steps">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-steps-title">
              四步开启您的事业
            </h2>
            <p className="text-muted-foreground">简单流程，快速启动</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {JOIN_STEPS.map((step, index) => (
              <motion.div
                key={step.step}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 text-center h-full hover-elevate" data-testid={`card-step-${step.step}`}>
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <div className="text-xs font-bold text-secondary mb-2">步骤 {step.step}</div>
                  <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="tiers" className="py-16 md:py-20 bg-card" data-testid="section-partner-tiers">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-tiers-title">
              选择您的配套
            </h2>
            <p className="text-muted-foreground">三种配套，满足不同需求</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PARTNER_TIERS.map((tier) => (
              <Card 
                key={tier.id}
                className={`relative overflow-hidden ${
                  tier.highlight 
                    ? "border-2 border-secondary shadow-lg scale-105 z-10" 
                    : ""
                }`}
                data-testid={`card-tier-${tier.id}`}
              >
                {tier.highlight && (
                  <div className="absolute top-0 left-0 right-0 bg-secondary text-secondary-foreground text-center py-1 text-sm font-bold">
                    最受欢迎
                  </div>
                )}
                <CardHeader className={tier.highlight ? "pt-10" : ""}>
                  <div className="text-center">
                    <CardTitle className="text-xl mb-1">{tier.name}</CardTitle>
                    <Badge variant="outline" className="mb-3">{tier.subtitle}</Badge>
                    <div className="text-3xl font-bold text-secondary">RM {tier.price.toLocaleString()}</div>
                    <p className="text-sm text-muted-foreground mt-2">{tier.description}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-secondary/10 rounded-lg p-3 mb-4 text-center">
                    <div className="text-sm text-muted-foreground">获得 LY 能量值</div>
                    <div className="text-2xl font-bold text-secondary">{tier.lyPoints.toLocaleString()}</div>
                  </div>

                  <ul className="space-y-3 mb-6">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-secondary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${tier.highlight ? "bg-secondary text-secondary-foreground" : ""}`}
                    variant={tier.highlight ? "default" : "outline"}
                    onClick={() => handleJoin(tier.id)}
                    data-testid={`button-join-${tier.id}`}
                  >
                    立即加入
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20" data-testid="section-calculator">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-calculator-title">
              收益计算器
            </h2>
            <p className="text-muted-foreground">预估您的月度返现收入</p>
          </div>

          <Card className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Label className="text-base font-medium mb-4 block">每月销售盒数</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={calculatorBoxes}
                    onChange={(e) => setCalculatorBoxes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="text-center text-2xl font-bold h-14"
                    data-testid="input-calculator-boxes"
                  />
                  <span className="text-muted-foreground">盒</span>
                </div>
                <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-secondary"></span> 前5盒: 50% 返现</p>
                  <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-secondary/70"></span> 6-10盒: 30% 返现</p>
                  <p className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-secondary/40"></span> 超出: 20% 返现</p>
                </div>
              </div>

              <div className="bg-secondary/10 rounded-xl p-6 flex flex-col justify-center">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground mb-2">预估月度返现</div>
                  <div className="text-4xl md:text-5xl font-bold text-secondary" data-testid="text-calculated-earnings">
                    RM {calculateEarnings(calculatorBoxes).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    基于每盒 RM 199 计算
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-primary text-primary-foreground" data-testid="section-success-stories">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-4" data-testid="text-stories-title">
              她们的故事
            </h2>
            <p className="opacity-80">来自真实经营人的分享</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUCCESS_STORIES.map((story, index) => (
              <Card key={index} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground p-6" data-testid={`card-story-${index}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-lg">
                    {story.avatar}
                  </div>
                  <div>
                    <div className="font-bold">{story.name}</div>
                    <div className="text-sm opacity-70">{story.location} · {story.tier}</div>
                  </div>
                </div>
                <p className="text-sm opacity-90 mb-4 italic">"{story.quote}"</p>
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">加入 {story.months} 个月</span>
                  <span className="font-bold text-secondary">{story.earnings}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-16 md:py-20" data-testid="section-faq">
        <div className="max-w-3xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-faq-title">
              常见问题
            </h2>
            <p className="text-muted-foreground">解答您的疑虑</p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-item-${index}`}>
                <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-card" data-testid="section-contact">
        <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-contact-title">
              还有疑问？联系我们
            </h2>
            <p className="text-muted-foreground">我们的团队随时为您解答</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center hover-elevate cursor-pointer" onClick={() => window.open(WHATSAPP_LINK, "_blank")} data-testid="card-contact-whatsapp">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-bold mb-2">WhatsApp 咨询</h3>
              <p className="text-sm text-muted-foreground">在线客服即时回复</p>
            </Card>

            <Card className="p-6 text-center" data-testid="card-contact-email">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold mb-2">邮件咨询</h3>
              <p className="text-sm text-muted-foreground">partner@loveyoung.my</p>
            </Card>

            <Card className="p-6 text-center" data-testid="card-contact-hours">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold mb-2">服务时间</h3>
              <p className="text-sm text-muted-foreground">每日 9:00 - 21:00</p>
            </Card>
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              className="gap-2 bg-secondary text-secondary-foreground"
              onClick={() => document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" })}
              data-testid="button-final-cta"
            >
              立即成为联合经营人
              <ArrowRight className="w-5 h-5" />
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
