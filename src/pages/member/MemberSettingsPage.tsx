import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MemberLayout } from "@/components/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  User, Camera, Phone, Mail, Lock, Shield,
  Bell, Globe, Moon, Save, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function MemberSettingsPage() {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const { user, member } = useAuth();

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-settings-title">{t("member.settings.title")}</h1>
          <p className="text-muted-foreground">{t("member.settings.subtitle")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t("member.settings.personalInfo")}
            </CardTitle>
            <CardDescription>{t("member.settings.personalInfoDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-2 border-secondary">
                <AvatarImage src={user?.user_metadata?.avatar_url || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                  {user?.user_metadata?.first_name?.charAt(0) || member?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" className="gap-2">
                <Camera className="w-4 h-4" />
                {t("member.settings.changeAvatar")}
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("member.settings.name")}</Label>
                <Input id="name" defaultValue={member?.name || user?.user_metadata?.first_name || ""} data-testid="input-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("member.settings.phone")}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" className="pl-10" defaultValue={member?.phone || ""} data-testid="input-phone" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">{t("member.settings.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" className="pl-10" defaultValue={user?.email || ""} disabled data-testid="input-email" />
                </div>
                <p className="text-xs text-muted-foreground">{t("member.settings.emailNote")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              {t("member.settings.security")}
            </CardTitle>
            <CardDescription>{t("member.settings.securityDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("member.settings.loginMethod")}</p>
                  <p className="text-sm text-muted-foreground">{t("member.settings.loginMethodDesc")}</p>
                </div>
              </div>
              <Button variant="outline" size="sm">{t("member.settings.manage")}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              {t("member.settings.notifications")}
            </CardTitle>
            <CardDescription>{t("member.settings.notificationsDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("member.settings.orderNotify")}</p>
                <p className="text-sm text-muted-foreground">{t("member.settings.orderNotifyDesc")}</p>
              </div>
              <Switch defaultChecked data-testid="switch-order-notify" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("member.settings.promoNotify")}</p>
                <p className="text-sm text-muted-foreground">{t("member.settings.promoNotifyDesc")}</p>
              </div>
              <Switch defaultChecked data-testid="switch-promo-notify" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{t("member.settings.earningNotify")}</p>
                <p className="text-sm text-muted-foreground">{t("member.settings.earningNotifyDesc")}</p>
              </div>
              <Switch defaultChecked data-testid="switch-earning-notify" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              {t("member.settings.display")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{t("member.settings.darkMode")}</p>
                  <p className="text-sm text-muted-foreground">{t("member.settings.darkModeDesc")}</p>
                </div>
              </div>
              <Switch data-testid="switch-dark-mode" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            className="gap-2 bg-secondary text-secondary-foreground" 
            onClick={handleSave}
            disabled={isSaving}
            data-testid="button-save"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {t("member.settings.saveChanges")}
          </Button>
        </div>
      </div>
    </MemberLayout>
  );
}
