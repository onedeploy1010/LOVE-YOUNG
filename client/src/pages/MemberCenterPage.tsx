import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Gift, ShoppingBag, Plus, Trash2, Star, LogOut, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "wouter";
import type { Member, MemberAddress, PointsLedger, Order } from "@shared/schema";

const malaysianStatesMap: Record<string, { zh: string; en: string; ms: string }> = {
  johor: { zh: "柔佛", en: "Johor", ms: "Johor" },
  kedah: { zh: "吉打", en: "Kedah", ms: "Kedah" },
  kelantan: { zh: "吉兰丹", en: "Kelantan", ms: "Kelantan" },
  melaka: { zh: "马六甲", en: "Melaka", ms: "Melaka" },
  negeri_sembilan: { zh: "森美兰", en: "Negeri Sembilan", ms: "Negeri Sembilan" },
  pahang: { zh: "彭亨", en: "Pahang", ms: "Pahang" },
  penang: { zh: "槟城", en: "Penang", ms: "Pulau Pinang" },
  perak: { zh: "霹雳", en: "Perak", ms: "Perak" },
  perlis: { zh: "玻璃市", en: "Perlis", ms: "Perlis" },
  sabah: { zh: "沙巴", en: "Sabah", ms: "Sabah" },
  sarawak: { zh: "砂拉越", en: "Sarawak", ms: "Sarawak" },
  selangor: { zh: "雪兰莪", en: "Selangor", ms: "Selangor" },
  terengganu: { zh: "登嘉楼", en: "Terengganu", ms: "Terengganu" },
  kuala_lumpur: { zh: "吉隆坡", en: "Kuala Lumpur", ms: "Kuala Lumpur" },
  labuan: { zh: "纳闽", en: "Labuan", ms: "Labuan" },
  putrajaya: { zh: "布城", en: "Putrajaya", ms: "Putrajaya" },
};

function ProfileTab({ member, onUpdate }: { member: Member | null; onUpdate: () => void }) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(!member);
  const [formData, setFormData] = useState({
    name: member?.name || "",
    phone: member?.phone || "",
    email: member?.email || "",
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/members/me", data),
    onSuccess: () => {
      toast({ title: language === "zh" ? "创建成功" : "Profile created" });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      setIsEditing(false);
      onUpdate();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("PUT", "/api/members/me", data),
    onSuccess: () => {
      toast({ title: language === "zh" ? "保存成功" : "Profile saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      setIsEditing(false);
      onUpdate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (member) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("member.profile")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!member && !isEditing ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t("member.createProfile")}</p>
            <Button onClick={() => setIsEditing(true)} data-testid="button-create-profile">
              <Plus className="h-4 w-4 mr-2" />
              {t("member.createProfile")}
            </Button>
          </div>
        ) : isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("member.name")}</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                data-testid="input-profile-name"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("member.phone")}</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                data-testid="input-profile-phone"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("member.email")}</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-profile-email"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending} data-testid="button-save-profile">
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("member.save")}
              </Button>
              {member && (
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  {language === "zh" ? "取消" : "Cancel"}
                </Button>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">{t("member.name")}</Label>
              <p className="text-lg" data-testid="text-profile-name">{member?.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("member.phone")}</Label>
              <p className="text-lg" data-testid="text-profile-phone">{member?.phone}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{t("member.email")}</Label>
              <p className="text-lg" data-testid="text-profile-email">{member?.email || "-"}</p>
            </div>
            <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
              {t("member.edit")}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddressesTab({ memberId }: { memberId: string | null }) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: "home",
    recipientName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postcode: "",
  });

  const { data: addresses = [] } = useQuery<MemberAddress[]>({
    queryKey: ["/api/members/me/addresses"],
    enabled: !!memberId,
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof formData) => apiRequest("POST", "/api/members/me/addresses", data),
    onSuccess: () => {
      toast({ title: language === "zh" ? "添加成功" : "Address added" });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/addresses"] });
      setIsAdding(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      apiRequest("PUT", `/api/members/me/addresses/${id}`, data),
    onSuccess: () => {
      toast({ title: language === "zh" ? "更新成功" : "Address updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/addresses"] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/members/me/addresses/${id}`),
    onSuccess: () => {
      toast({ title: language === "zh" ? "删除成功" : "Address deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/addresses"] });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/members/me/addresses/${id}/default`),
    onSuccess: () => {
      toast({ title: language === "zh" ? "设为默认成功" : "Set as default" });
      queryClient.invalidateQueries({ queryKey: ["/api/members/me/addresses"] });
    },
  });

  const resetForm = () => {
    setFormData({
      label: "home",
      recipientName: "",
      phone: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postcode: "",
    });
  };

  const handleEdit = (address: MemberAddress) => {
    setEditingId(address.id);
    setFormData({
      label: address.label || "home",
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      city: address.city,
      state: address.state,
      postcode: address.postcode,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      addMutation.mutate(formData);
    }
  };

  const getStateName = (stateKey: string) => {
    const state = malaysianStatesMap[stateKey];
    return state ? state[language] : stateKey;
  };

  if (!memberId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("member.createProfile")}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          {t("member.addresses")}
        </CardTitle>
        {!isAdding && !editingId && (
          <Button size="sm" onClick={() => setIsAdding(true)} data-testid="button-add-address">
            <Plus className="h-4 w-4 mr-2" />
            {t("member.addAddress")}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {(isAdding || editingId) && (
          <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 border rounded-md">
            <h4 className="font-medium">{editingId ? t("member.editAddress") : t("member.addAddress")}</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("member.name")}</Label>
                <Input
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  required
                  data-testid="input-address-name"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("member.phone")}</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  data-testid="input-address-phone"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("order.address")}</Label>
              <Input
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                required
                data-testid="input-address-line1"
              />
            </div>
            <Input
              value={formData.addressLine2}
              onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
              placeholder={language === "zh" ? "地址第二行（可选）" : "Address line 2 (optional)"}
              data-testid="input-address-line2"
            />
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>{t("order.city")}</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  data-testid="input-address-city"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("order.state")}</Label>
                <Select
                  value={formData.state}
                  onValueChange={(val) => setFormData({ ...formData, state: val })}
                >
                  <SelectTrigger data-testid="select-address-state">
                    <SelectValue placeholder={t("order.selectState")} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(malaysianStatesMap).map(([key, names]) => (
                      <SelectItem key={key} value={key}>
                        {names[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("order.postcode")}</Label>
                <Input
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  required
                  data-testid="input-address-postcode"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={addMutation.isPending || updateMutation.isPending} data-testid="button-save-address">
                {(addMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t("member.save")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  resetForm();
                }}
              >
                {language === "zh" ? "取消" : "Cancel"}
              </Button>
            </div>
          </form>
        )}

        {addresses.length === 0 && !isAdding ? (
          <p className="text-center text-muted-foreground py-8">{t("member.noAddresses")}</p>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="p-4 border rounded-md space-y-2"
                data-testid={`card-address-${address.id}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{address.recipientName}</span>
                    {address.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {t("member.default")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!address.isDefault && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDefaultMutation.mutate(address.id)}
                        data-testid={`button-set-default-${address.id}`}
                      >
                        {t("member.setDefault")}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(address)}
                      data-testid={`button-edit-address-${address.id}`}
                    >
                      {t("member.edit")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(address.id)}
                      data-testid={`button-delete-address-${address.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{address.phone}</p>
                <p className="text-sm">
                  {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}
                </p>
                <p className="text-sm">
                  {address.city}, {getStateName(address.state)} {address.postcode}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PointsTab({ memberId, pointsBalance }: { memberId: string | null; pointsBalance: number }) {
  const { t, language } = useLanguage();

  const { data: pointsData } = useQuery<{ balance: number; history: PointsLedger[] }>({
    queryKey: ["/api/members/me/points"],
    enabled: !!memberId,
  });

  if (!memberId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("member.createProfile")}
        </CardContent>
      </Card>
    );
  }

  const history = pointsData?.history || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          {t("member.points")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center p-6 bg-primary/10 rounded-lg">
          <p className="text-muted-foreground mb-2">{t("member.pointsBalance")}</p>
          <p className="text-4xl font-bold text-primary" data-testid="text-points-balance">
            {pointsBalance}
          </p>
        </div>

        <div>
          <h4 className="font-medium mb-4">{t("member.pointsHistory")}</h4>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">{t("member.noPoints")}</p>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                  data-testid={`row-points-${entry.id}`}
                >
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt || "").toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`font-bold ${entry.type === "earn" || entry.type === "bonus" ? "text-green-600" : "text-red-600"}`}
                  >
                    {entry.type === "earn" || entry.type === "bonus" ? "+" : "-"}
                    {Math.abs(entry.points)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OrdersTab({ memberId }: { memberId: string | null }) {
  const { t, language } = useLanguage();

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ["/api/members/me/orders"],
    enabled: !!memberId,
  });

  if (!memberId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("member.createProfile")}
        </CardContent>
      </Card>
    );
  }

  const statusLabels: Record<string, { zh: string; en: string; ms: string }> = {
    pending: { zh: "待确认", en: "Pending", ms: "Menunggu" },
    confirmed: { zh: "已确认", en: "Confirmed", ms: "Disahkan" },
    processing: { zh: "准备中", en: "Processing", ms: "Memproses" },
    shipped: { zh: "已发货", en: "Shipped", ms: "Dihantar" },
    delivered: { zh: "已送达", en: "Delivered", ms: "Dihantar" },
    cancelled: { zh: "已取消", en: "Cancelled", ms: "Dibatalkan" },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          {t("member.orders")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">{t("member.noOrders")}</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 border rounded-md space-y-2"
                data-testid={`card-order-${order.id}`}
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-mono font-medium" data-testid={`text-order-number-${order.id}`}>
                    {order.orderNumber}
                  </span>
                  <Badge variant={order.status === "delivered" ? "default" : "secondary"}>
                    {statusLabels[order.status]?.[language] || order.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(order.createdAt || "").toLocaleDateString()}
                </p>
                <p className="text-sm">{order.items}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold">RM{order.totalAmount}</span>
                  {order.pointsEarned && order.pointsEarned > 0 && (
                    <Badge variant="outline" className="text-green-600">
                      +{order.pointsEarned} {language === "zh" ? "积分" : "points"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function MemberCenterPage() {
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: member, isLoading: memberLoading, refetch: refetchMember } = useQuery<Member>({
    queryKey: ["/api/members/me"],
    enabled: isAuthenticated && !authLoading,
    retry: false,
  });

  const handleLogout = async () => {
    window.location.href = "/api/auth/logout";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <User className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{t("member.notLoggedIn")}</h2>
            <p className="text-muted-foreground">{t("member.loginToAccess")}</p>
            <Button asChild data-testid="button-login">
              <a href="/api/auth/login">{t("member.login")}</a>
            </Button>
            <Link href="/">
              <Button variant="ghost" className="mt-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === "zh" ? "返回首页" : "Back to Home"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="button-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === "zh" ? "返回首页" : "Back to Home"}
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">{t("member.title")}</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-2" />
            {t("member.logout")}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {memberLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" data-testid="tab-profile">
                <User className="h-4 w-4 mr-2 hidden sm:inline" />
                {t("member.profile")}
              </TabsTrigger>
              <TabsTrigger value="addresses" data-testid="tab-addresses">
                <MapPin className="h-4 w-4 mr-2 hidden sm:inline" />
                {t("member.addresses")}
              </TabsTrigger>
              <TabsTrigger value="points" data-testid="tab-points">
                <Gift className="h-4 w-4 mr-2 hidden sm:inline" />
                {t("member.points")}
              </TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders">
                <ShoppingBag className="h-4 w-4 mr-2 hidden sm:inline" />
                {t("member.orders")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <ProfileTab member={member || null} onUpdate={() => refetchMember()} />
            </TabsContent>

            <TabsContent value="addresses">
              <AddressesTab memberId={member?.id || null} />
            </TabsContent>

            <TabsContent value="points">
              <PointsTab memberId={member?.id || null} pointsBalance={member?.pointsBalance || 0} />
            </TabsContent>

            <TabsContent value="orders">
              <OrdersTab memberId={member?.id || null} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
