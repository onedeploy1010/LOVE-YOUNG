import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { MemberLayout } from "@/components/MemberLayout";
import { useTranslation } from "@/lib/i18n";
import { SiFacebook, SiInstagram } from "react-icons/si";
import {
  CreditCard, Plus, Trash2, CheckCircle, Building2,
  Wallet, ShieldCheck, Info, ExternalLink
} from "lucide-react";

const mockPaymentMethods = [
  { id: 1, type: "bank", name: "Maybank", last4: "1234", isDefault: true },
  { id: 2, type: "ewallet", name: "Touch n Go", account: "012****789", isDefault: false },
];

export default function MemberPaymentPage() {
  const { t } = useTranslation();
  const [methods, setMethods] = useState(mockPaymentMethods);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const setDefault = (id: number) => {
    setMethods(methods.map(m => ({ ...m, isDefault: m.id === id })));
  };

  const deleteMethod = (id: number) => {
    setMethods(methods.filter(m => m.id !== id));
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-payment-title">{t("member.payment.title")}</h1>
          <p className="text-muted-foreground">{t("member.payment.subtitle")}</p>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold mb-1">{t("member.payment.securityTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("member.payment.securityDesc")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                {t("member.payment.boundMethods")}
              </CardTitle>
              <CardDescription>{t("member.payment.methodCount").replace("{count}", String(methods.length))}</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" data-testid="button-add-payment">
                  <Plus className="w-4 h-4" />
                  {t("member.payment.add")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("member.payment.addTitle")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <RadioGroup defaultValue="bank">
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="bank" id="bank" />
                      <Label htmlFor="bank" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Building2 className="w-5 h-5" />
                        {t("member.payment.bankAccount")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="ewallet" id="ewallet" />
                      <Label htmlFor="ewallet" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Wallet className="w-5 h-5" />
                        {t("member.payment.ewallet")}
                      </Label>
                    </div>
                  </RadioGroup>

                  <div className="space-y-2">
                    <Label htmlFor="bank-name">{t("member.payment.bankName")}</Label>
                    <Input id="bank-name" placeholder={t("member.payment.bankNamePlaceholder")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account">{t("member.payment.accountNumber")}</Label>
                    <Input id="account" placeholder={t("member.payment.accountNumberPlaceholder")} />
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("member.payment.cancel")}</Button>
                    <Button className="bg-secondary text-secondary-foreground" onClick={() => setIsDialogOpen(false)} data-testid="button-save-payment">
                      {t("member.payment.save")}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {methods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{t("member.payment.noMethods")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {methods.map((method) => (
                  <div 
                    key={method.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg ${method.isDefault ? "border-secondary bg-secondary/5" : ""}`}
                    data-testid={`payment-${method.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${method.type === "bank" ? "bg-primary/10" : "bg-secondary/10"}`}>
                        {method.type === "bank" ? (
                          <Building2 className="w-5 h-5 text-primary" />
                        ) : (
                          <Wallet className="w-5 h-5 text-secondary" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{method.name}</span>
                          {method.isDefault && (
                            <Badge className="bg-secondary text-secondary-foreground gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {t("member.payment.default")}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {method.type === "bank" ? `****${method.last4}` : method.account}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDefault(method.id)}
                          data-testid={`button-default-${method.id}`}
                        >
                          {t("member.payment.setDefault")}
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-red-500 hover:text-red-600"
                        onClick={() => deleteMethod(method.id)}
                        data-testid={`button-delete-${method.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-primary" />
              {t("member.payment.thirdParty")}
            </CardTitle>
            <CardDescription>{t("member.payment.thirdPartyDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="https://facebook.com/loveyoung.my/shop" target="_blank" rel="noopener noreferrer">
                <Card className="p-4 hover-elevate cursor-pointer h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <SiFacebook className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Facebook Shop</p>
                      <p className="text-sm text-muted-foreground">{t("member.payment.creditCardSupport")}</p>
                    </div>
                  </div>
                </Card>
              </a>

              <a href="https://instagram.com/loveyoung.my/shop" target="_blank" rel="noopener noreferrer">
                <Card className="p-4 hover-elevate cursor-pointer h-full">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                      <SiInstagram className="w-6 h-6 text-pink-500" />
                    </div>
                    <div>
                      <p className="font-medium">Instagram Shop</p>
                      <p className="text-sm text-muted-foreground">{t("member.payment.creditCardSupport")}</p>
                    </div>
                  </div>
                </Card>
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">{t("member.payment.supportedMethods")}</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>{t("member.payment.supportedList.bank")}</li>
                <li>{t("member.payment.supportedList.ewallet")}</li>
                <li>{t("member.payment.supportedList.card")}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </MemberLayout>
  );
}
