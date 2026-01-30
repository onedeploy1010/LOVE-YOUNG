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
import { useTranslation } from "@/lib/i18n";

const getFaqs = (t: (key: string) => string) => [
  { id: 1, category: "order", question: t("member.help.faqItems.order1.q"), answer: t("member.help.faqItems.order1.a") },
  { id: 2, category: "order", question: t("member.help.faqItems.order2.q"), answer: t("member.help.faqItems.order2.a") },
  { id: 3, category: "shipping", question: t("member.help.faqItems.shipping1.q"), answer: t("member.help.faqItems.shipping1.a") },
  { id: 4, category: "shipping", question: t("member.help.faqItems.shipping2.q"), answer: t("member.help.faqItems.shipping2.a") },
  { id: 5, category: "payment", question: t("member.help.faqItems.payment1.q"), answer: t("member.help.faqItems.payment1.a") },
  { id: 6, category: "payment", question: t("member.help.faqItems.payment2.q"), answer: t("member.help.faqItems.payment2.a") },
  { id: 7, category: "refund", question: t("member.help.faqItems.refund1.q"), answer: t("member.help.faqItems.refund1.a") },
  { id: 8, category: "refund", question: t("member.help.faqItems.refund2.q"), answer: t("member.help.faqItems.refund2.a") },
  { id: 9, category: "points", question: t("member.help.faqItems.points1.q"), answer: t("member.help.faqItems.points1.a") },
  { id: 10, category: "points", question: t("member.help.faqItems.points2.q"), answer: t("member.help.faqItems.points2.a") },
  { id: 11, category: "partner", question: t("member.help.faqItems.partner1.q"), answer: t("member.help.faqItems.partner1.a") },
  { id: 12, category: "partner", question: t("member.help.faqItems.partner2.q"), answer: t("member.help.faqItems.partner2.a") },
];

export default function MemberHelpPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const faqs = getFaqs(t);
  const faqCategories = [
    { id: "order", label: t("member.help.categories.order"), icon: ShoppingBag },
    { id: "shipping", label: t("member.help.categories.shipping"), icon: Truck },
    { id: "payment", label: t("member.help.categories.payment"), icon: CreditCard },
    { id: "refund", label: t("member.help.categories.refund"), icon: RefreshCw },
    { id: "points", label: t("member.help.categories.points"), icon: Gift },
    { id: "partner", label: t("member.help.categories.partner"), icon: Users },
  ];

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
          <h1 className="text-2xl font-serif text-primary" data-testid="text-help-title">{t("member.help.title")}</h1>
          <p className="text-muted-foreground">{t("member.help.subtitle")}</p>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder={t("member.help.searchPlaceholder")}
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
              {t("member.help.faq")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredFaqs.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{t("member.help.noResults")}</p>
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
              {t("member.help.contactUs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="https://wa.me/60178228658" target="_blank" rel="noopener noreferrer">
                <Card className="p-4 hover-elevate cursor-pointer h-full">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                      <SiWhatsapp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{t("member.help.whatsapp")}</p>
                      <p className="text-sm text-muted-foreground">{t("member.help.onlineConsult")}</p>
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
                    <p className="font-medium">{t("member.help.phoneSupport")}</p>
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
                    <p className="font-medium">{t("member.help.emailSupport")}</p>
                    <p className="text-sm text-muted-foreground">support@loveyoung.my</p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="mt-4 p-4 bg-muted/30 rounded-lg flex items-center gap-3">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("member.help.serviceHours")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
