import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Users, 
  TrendingUp, 
  Wallet, 
  Gift, 
  ChevronRight,
  CheckCircle,
  Network,
  BarChart3,
  Zap,
  Globe,
  UserPlus,
  ArrowRight,
  Star,
  Shield,
  Clock,
  DollarSign
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
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const PARTNER_TIERS = [
  {
    id: "phase1",
    name: "Phase 1",
    price: 1000,
    lyPoints: 2000,
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
    name: "Phase 2",
    price: 1300,
    lyPoints: 2600,
    features: [
      "1.2x 分红权重",
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
    name: "Phase 3",
    price: 1500,
    lyPoints: 3000,
    features: [
      "1.5x 分红权重",
      "顶级奖金池分配",
      "国际品牌发布会席位",
      "联名款产品收益分润",
      "专属商业合作空间",
      "10层推荐积分补充"
    ],
    highlight: false
  }
];

const REFERRAL_TIERS = [
  { tier: 1, label: "直推", percentage: 20 },
  { tier: 2, label: "Tier 2", percentage: 10 },
  { tier: 3, label: "Tier 3", percentage: 10 },
  { tier: 4, label: "Tier 4", percentage: 10 },
  { tier: 5, label: "Tier 5", percentage: 5 },
  { tier: 6, label: "Tier 6", percentage: 5 },
  { tier: 7, label: "Tier 7", percentage: 5 },
  { tier: 8, label: "Tier 8", percentage: 5 },
  { tier: 9, label: "Tier 9", percentage: 5 },
  { tier: 10, label: "Tier 10", percentage: 5 }
];

export default function PartnerPage() {
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState("");

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

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

      <section className="relative min-h-[70vh] flex items-center overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950" data-testid="section-partner-hero">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.3),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.2),transparent_50%)]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 w-full">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-base px-4 py-1" data-testid="badge-partner-hero">
                RWA 联合经营人计划
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight"
              data-testid="text-partner-hero-title"
            >
              逆风启航 <br />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent">
                重定义女性力量
              </span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-xl text-white/80 mb-10 max-w-2xl mx-auto"
              data-testid="text-partner-hero-description"
            >
              打破传统代理模式。我们不招投资者，只寻找品牌共建人。
              每一分收益都来自真实的终端产品销售。
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-emerald-900 font-bold border-0"
                onClick={() => document.getElementById("tiers")?.scrollIntoView({ behavior: "smooth" })}
                data-testid="button-partner-join"
              >
                立即加入共建计划
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 border-white/30 text-white"
                onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                data-testid="button-partner-consult"
              >
                咨询详情
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section id="tiers" className="py-16 md:py-24 bg-card" data-testid="section-partner-tiers">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-5xl font-black text-foreground mb-4" data-testid="text-tiers-title">
              选择您的配套等级
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              三个等级配套，满足不同阶段的创业需求。每个配套都享有完整的分红权益。
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {PARTNER_TIERS.map((tier) => (
              <motion.div key={tier.id} variants={fadeInUp}>
                <Card 
                  className={`p-8 relative h-full ${
                    tier.highlight 
                      ? "border-2 border-amber-500 bg-gradient-to-br from-emerald-900 to-emerald-950 text-white scale-105 shadow-2xl" 
                      : "bg-white/80 backdrop-blur"
                  }`}
                  data-testid={`card-tier-${tier.id}`}
                >
                  {tier.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-emerald-900 border-0" data-testid="badge-hot-selling">
                      HOT SELLING
                    </Badge>
                  )}

                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    tier.highlight 
                      ? "bg-amber-500 text-emerald-900" 
                      : "bg-emerald-900 text-amber-500"
                  }`}>
                    {tier.id === "phase1" && <UserPlus className="w-8 h-8" />}
                    {tier.id === "phase2" && <TrendingUp className="w-8 h-8" />}
                    {tier.id === "phase3" && <Globe className="w-8 h-8" />}
                  </div>

                  <h3 className={`text-xl font-bold mb-2 text-center ${tier.highlight ? "text-white" : "text-foreground"}`}>
                    {tier.name}
                  </h3>
                  <div className={`text-3xl font-black mb-2 text-center ${tier.highlight ? "text-amber-400" : "text-amber-600"}`}>
                    RM {tier.price.toLocaleString()}
                  </div>
                  <p className={`text-sm text-center mb-6 ${tier.highlight ? "text-white/70" : "text-muted-foreground"}`}>
                    获得 {tier.lyPoints.toLocaleString()} LY 能量值
                  </p>

                  <ul className="space-y-3 mb-8">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 flex-shrink-0 ${tier.highlight ? "text-amber-400" : "text-amber-600"}`} />
                        <span className={`text-sm ${tier.highlight ? "text-white/90" : "text-foreground"}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      tier.highlight 
                        ? "bg-amber-500 text-emerald-900 font-bold border-0" 
                        : "bg-emerald-900 text-white font-bold"
                    }`}
                    onClick={() => handleJoin(tier.id)}
                    data-testid={`button-join-${tier.id}`}
                  >
                    {tier.highlight ? "限额申请" : "立即加入"}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-gradient-to-br from-emerald-900 to-emerald-950" data-testid="section-referral-system">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6" data-testid="text-referral-title">
                10层积分补充系统
              </h2>
              <p className="text-white/70 mb-8">
                Love Young 拒绝"资金盘"。每一分收益都来自真实的终端产品销售。
                我们用 LY (能量值) 记录你的贡献。
              </p>

              <div className="grid grid-cols-2 gap-4">
                {REFERRAL_TIERS.slice(0, 4).map((item) => (
                  <div key={item.tier} className="p-4 border border-white/10 rounded-lg bg-white/5">
                    <div className="text-xs text-white/50 uppercase mb-1">{item.label}</div>
                    <div className="text-2xl font-bold text-amber-400">{item.percentage}%</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4">
                {REFERRAL_TIERS.slice(4).map((item) => (
                  <div key={item.tier} className="p-3 border border-white/10 rounded-lg bg-white/5 text-center">
                    <div className="text-xs text-white/50 uppercase">{item.label}</div>
                    <div className="text-lg font-bold text-amber-400">{item.percentage}%</div>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs italic text-white/50">
                * 总推荐奖励 = 80% LY能量值。LY能量值用于解锁现金分红，通过推荐网体销售可持续自动补充。
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <Card className="p-8 bg-white rounded-3xl shadow-2xl border-0">
                <h3 className="text-2xl font-bold text-emerald-900 mb-6">透明的收益逻辑</h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Wallet className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-foreground">销售返现 (Cashback)</span>
                    </div>
                    <span className="text-amber-600 font-bold">50% / 30% / 20%</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-foreground">全球奖金池 (Pool)</span>
                    </div>
                    <span className="text-amber-600 font-bold">销售额的 30%</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-foreground">分红周期</span>
                    </div>
                    <span className="text-amber-600 font-bold">每 10 天结算</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-amber-600" />
                      <span className="font-bold text-foreground">RWA 令牌</span>
                    </div>
                    <span className="text-amber-600 font-bold">每周期1枚 + 销售奖励</span>
                  </div>
                </div>

                <div className="mt-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900 mb-1">安全透明</h4>
                      <p className="text-sm text-emerald-700">
                        所有收益来自真实产品销售，资金流向透明可追溯。
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 bg-card" data-testid="section-cashback-rules">
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4" data-testid="text-cashback-title">
              月度返现规则
            </h2>
            <p className="text-muted-foreground">
              三代网体内购买产品，根据月度销量阶梯返现
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 text-center border-2 border-amber-500/30" data-testid="card-cashback-1">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">首 5 盒</h3>
              <div className="text-4xl font-black text-amber-600 mb-2">50%</div>
              <p className="text-muted-foreground text-sm">每月前5盒销售享受最高返现比例</p>
            </Card>

            <Card className="p-6 text-center border-2 border-emerald-500/30" data-testid="card-cashback-2">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">第 6-10 盒</h3>
              <div className="text-4xl font-black text-emerald-600 mb-2">30%</div>
              <p className="text-muted-foreground text-sm">达成首5盒后继续享受高返现</p>
            </Card>

            <Card className="p-6 text-center border-2 border-cyan-500/30" data-testid="card-cashback-3">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">超出部分</h3>
              <div className="text-4xl font-black text-cyan-600 mb-2">20%</div>
              <p className="text-muted-foreground text-sm">无上限，持续享受返现收益</p>
            </Card>
          </div>
        </div>
      </section>

      {selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="modal-join">
          <Card className="w-full max-w-md p-6 bg-white">
            <h3 className="text-xl font-bold text-foreground mb-4">
              申请成为联合经营人
            </h3>
            <p className="text-muted-foreground mb-6">
              您选择了 {PARTNER_TIERS.find(t => t.id === selectedTier)?.name} 配套
              (RM {PARTNER_TIERS.find(t => t.id === selectedTier)?.price.toLocaleString()})
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="referralCode">推荐人邀请码（可选）</Label>
                <Input
                  id="referralCode"
                  placeholder="输入推荐人邀请码"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
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
                className="flex-1 bg-emerald-900 text-white"
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
