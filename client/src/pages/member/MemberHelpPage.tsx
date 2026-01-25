import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MemberLayout } from "@/components/MemberLayout";
import { SiWhatsapp } from "react-icons/si";
import {
  Search, HelpCircle, ShoppingBag, Truck, CreditCard,
  RefreshCw, Gift, Users, MessageCircle, Phone, Mail, Clock
} from "lucide-react";

const faqCategories = [
  { id: "order", label: "订单相关", icon: ShoppingBag },
  { id: "shipping", label: "配送物流", icon: Truck },
  { id: "payment", label: "支付问题", icon: CreditCard },
  { id: "refund", label: "退换货", icon: RefreshCw },
  { id: "points", label: "积分会员", icon: Gift },
  { id: "partner", label: "经营人", icon: Users },
];

const faqs = [
  { id: 1, category: "order", question: "如何查看我的订单状态？", answer: "您可以在会员中心的\"订单记录\"页面查看所有订单的状态。每笔订单都会显示当前的处理进度，包括待付款、已付款、发货中、已送达等状态。" },
  { id: 2, category: "order", question: "如何取消订单？", answer: "若订单尚未发货，您可以通过WhatsApp联系客服申请取消订单。已发货的订单无法取消，但您可以在收到货物后申请退换货。" },
  { id: 3, category: "shipping", question: "配送范围是哪里？", answer: "目前我们支持马来西亚全境配送，Klang Valley地区通常2-3个工作日送达，其他地区3-5个工作日。" },
  { id: 4, category: "shipping", question: "是否支持冷链配送？", answer: "是的，所有鲜炖燕窝和花胶产品均采用专业冷链配送，确保产品在运输过程中保持新鲜品质。" },
  { id: 5, category: "payment", question: "支持哪些支付方式？", answer: "我们支持银行转账、Touch n Go eWallet、FPX网银支付等多种支付方式，通过Meta Shop下单还支持信用卡支付。" },
  { id: 6, category: "refund", question: "退换货政策是什么？", answer: "收到商品后7天内可申请退换货，商品需保持原包装完好。由于产品特性，已拆封的食品类商品不支持退换，如有质量问题除外。" },
  { id: 7, category: "points", question: "积分如何获得和使用？", answer: "每消费RM1可获得1积分，积分可用于抵扣订单金额，100积分=RM1。积分有效期为获得后12个月。" },
  { id: 8, category: "partner", question: "如何成为联合经营人？", answer: "您可以在首页点击\"成为经营人\"了解详情，选择适合的套餐购买后即可成为经营人，享受推荐佣金和RWA分红等权益。" },
  { id: 9, category: "partner", question: "LY积分和普通积分有什么区别？", answer: "LY积分是经营人专属积分，通过推荐新客户、团队业绩等方式获得，可用于购买产品或升级套餐。普通积分是所有会员消费获得的积分。" },
];

export default function MemberHelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = searchQuery === "" || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-help-title">帮助中心</h1>
          <p className="text-muted-foreground">常见问题解答和客服支持</p>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="搜索问题..."
                className="pl-10 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {faqCategories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <Button
                key={cat.id}
                variant={isActive ? "secondary" : "outline"}
                className={`h-auto py-3 flex-col gap-2 ${isActive ? "bg-secondary/20 border-secondary" : ""}`}
                onClick={() => setSelectedCategory(isActive ? null : cat.id)}
                data-testid={`button-category-${cat.id}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{cat.label}</span>
              </Button>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              常见问题
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">未找到相关问题</p>
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs.map((faq) => (
                  <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                    <AccordionTrigger className="text-left" data-testid={`faq-${faq.id}`}>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              联系客服
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="https://wa.me/60123456789" target="_blank" rel="noopener noreferrer">
                <Card className="p-4 hover-elevate cursor-pointer h-full">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <SiWhatsapp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">在线咨询</p>
                    </div>
                  </div>
                </Card>
              </a>
              
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">电话客服</p>
                    <p className="text-sm text-muted-foreground">+60 12-345 6789</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">邮件支持</p>
                    <p className="text-sm text-muted-foreground">support@loveyoung.my</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-4 p-4 bg-muted/30 rounded-lg flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                客服服务时间：周一至周六 9:00-18:00（公共假期除外）
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
