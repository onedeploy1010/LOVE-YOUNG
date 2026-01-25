import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { MemberLayout } from "@/components/MemberLayout";
import { useQuery } from "@tanstack/react-query";
import {
  User, Camera, Phone, Mail, Lock, Shield,
  Bell, Globe, Moon, Save, Loader2
} from "lucide-react";
import type { User as UserType, Member } from "@shared/schema";

interface UserResponse {
  user: UserType | null;
  member: Member | null;
}

export default function MemberSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  
  const { data } = useQuery<UserResponse>({
    queryKey: ["/api/auth/state"],
  });

  const user = data?.user;
  const member = data?.member;

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1000);
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif text-primary" data-testid="text-settings-title">账户设置</h1>
          <p className="text-muted-foreground">管理您的个人信息和偏好设置</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              个人信息
            </CardTitle>
            <CardDescription>更新您的个人资料和联系方式</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 border-2 border-secondary">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xl">
                  {user?.firstName?.charAt(0) || member?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" className="gap-2">
                <Camera className="w-4 h-4" />
                更换头像
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input id="name" defaultValue={member?.name || user?.firstName || ""} data-testid="input-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">手机号码</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="phone" className="pl-10" defaultValue={member?.phone || ""} data-testid="input-phone" />
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="email">电子邮箱</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="email" className="pl-10" defaultValue={user?.email || ""} disabled data-testid="input-email" />
                </div>
                <p className="text-xs text-muted-foreground">邮箱绑定Replit账户，暂不支持修改</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              安全设置
            </CardTitle>
            <CardDescription>保护您的账户安全</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">登录方式</p>
                  <p className="text-sm text-muted-foreground">通过Replit账户登录</p>
                </div>
              </div>
              <Button variant="outline" size="sm">管理</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              通知偏好
            </CardTitle>
            <CardDescription>管理您的通知设置</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">订单更新通知</p>
                <p className="text-sm text-muted-foreground">订单状态变更时发送通知</p>
              </div>
              <Switch defaultChecked data-testid="switch-order-notify" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">促销活动通知</p>
                <p className="text-sm text-muted-foreground">接收优惠和促销信息</p>
              </div>
              <Switch defaultChecked data-testid="switch-promo-notify" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">收益提醒</p>
                <p className="text-sm text-muted-foreground">分红到账时发送通知</p>
              </div>
              <Switch defaultChecked data-testid="switch-earning-notify" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              显示偏好
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">深色模式</p>
                  <p className="text-sm text-muted-foreground">跟随系统设置</p>
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
            保存更改
          </Button>
        </div>
      </div>
    </MemberLayout>
  );
}
