import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MemberLayout } from "@/components/MemberLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import {
  MapPin, Plus, Edit, Trash2, Home, CheckCircle, Loader2
} from "lucide-react";

interface Address {
  id: string;
  member_id: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  postcode: string;
  state: string;
  is_default: boolean;
  label: string | null;
}

export default function MemberAddressesPage() {
  const { t } = useTranslation();
  const { user, member } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    recipient_name: "",
    phone: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    postcode: "",
    state: "",
  });

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["member-addresses", member?.id],
    queryFn: async () => {
      if (!member?.id) return [];

      const { data, error } = await supabase
        .from("member_addresses")
        .select("*")
        .eq("member_id", member.id)
        .order("is_default", { ascending: false });

      if (error) {
        console.error("Error fetching addresses:", error);
        return [];
      }

      return (data || []) as Address[];
    },
    enabled: !!member?.id,
  });

  const saveAddressMutation = useMutation({
    mutationFn: async (address: { id?: string; recipient_name: string; phone: string; address_line_1: string; address_line_2: string; city: string; postcode: string; state: string; is_default: boolean }) => {
      if (!member?.id) throw new Error("Not authenticated");

      const payload = {
        recipient_name: address.recipient_name,
        phone: address.phone,
        address_line_1: address.address_line_1,
        address_line_2: address.address_line_2 || null,
        city: address.city,
        postcode: address.postcode,
        state: address.state,
        is_default: address.is_default,
      };

      if (address.id) {
        const { error } = await supabase
          .from("member_addresses")
          .update(payload)
          .eq("id", address.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("member_addresses")
          .insert({ ...payload, member_id: member.id });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
      setIsDialogOpen(false);
      setEditingAddress(null);
      resetForm();
      toast({ title: editingAddress ? "地址已更新" : "地址已添加" });
    },
    onError: (error) => {
      console.error("Error saving address:", error);
      toast({ title: "保存失败，请重试", variant: "destructive" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("member_addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
      toast({ title: "地址已删除" });
    },
    onError: () => {
      toast({ title: "删除失败，请重试", variant: "destructive" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!member?.id) throw new Error("Not authenticated");

      // First, unset all defaults for this member
      await supabase
        .from("member_addresses")
        .update({ is_default: false })
        .eq("member_id", member.id);

      // Then set the new default
      const { error } = await supabase
        .from("member_addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
      toast({ title: "默认地址已更新" });
    },
    onError: () => {
      toast({ title: "设置失败，请重试", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      recipient_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      postcode: "",
      state: "",
    });
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      recipient_name: address.recipient_name,
      phone: address.phone,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || "",
      city: address.city,
      postcode: address.postcode,
      state: address.state,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.recipient_name || !formData.phone || !formData.address_line_1) {
      toast({ title: "请填写必填字段", variant: "destructive" });
      return;
    }

    saveAddressMutation.mutate({
      id: editingAddress?.id,
      ...formData,
      is_default: editingAddress?.is_default || addresses.length === 0,
    });
  };

  if (isLoading) {
    return (
      <MemberLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MemberLayout>
    );
  }

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-addresses-title">{t("member.addresses.title")}</h1>
            <p className="text-muted-foreground">{t("member.addresses.subtitle")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAddress(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-add-address">
                <Plus className="w-4 h-4" />
                {t("member.addresses.addAddress")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingAddress ? "编辑地址" : t("member.addresses.addAddressTitle")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("member.addresses.form.name")}</Label>
                    <Input
                      id="name"
                      placeholder={t("member.addresses.form.namePlaceholder")}
                      value={formData.recipient_name}
                      onChange={(e) => setFormData({ ...formData, recipient_name: e.target.value })}
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("member.addresses.form.phone")}</Label>
                    <Input
                      id="phone"
                      placeholder="+60 12-345 6789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      data-testid="input-phone"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("member.addresses.form.address")}</Label>
                  <Textarea
                    id="address"
                    placeholder={t("member.addresses.form.addressPlaceholder")}
                    value={formData.address_line_1}
                    onChange={(e) => setFormData({ ...formData, address_line_1: e.target.value })}
                    data-testid="input-address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("member.addresses.form.city")}</Label>
                    <Input
                      id="city"
                      placeholder="Kuala Lumpur"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      data-testid="input-city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">{t("member.addresses.form.postcode")}</Label>
                    <Input
                      id="postcode"
                      placeholder="50000"
                      value={formData.postcode}
                      onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                      data-testid="input-postcode"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">{t("member.addresses.form.state")}</Label>
                    <Input
                      id="state"
                      placeholder="Selangor"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      data-testid="input-state"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("member.addresses.cancel")}</Button>
                  <Button
                    className="bg-secondary text-secondary-foreground"
                    onClick={handleSubmit}
                    disabled={saveAddressMutation.isPending}
                    data-testid="button-save-address"
                  >
                    {saveAddressMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : t("member.addresses.save")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {addresses.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">{t("member.addresses.noAddresses")}</p>
              <Button className="bg-secondary text-secondary-foreground" onClick={() => setIsDialogOpen(true)}>
                {t("member.addresses.addFirst")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <Card
                key={addr.id}
                className={`relative ${addr.is_default ? "border-secondary" : ""}`}
                data-testid={`address-${addr.id}`}
              >
                {addr.is_default && (
                  <Badge className="absolute top-4 right-4 bg-secondary text-secondary-foreground gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {t("member.addresses.defaultBadge")}
                  </Badge>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold">{addr.recipient_name}</span>
                        <span className="text-sm text-muted-foreground">{addr.phone}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {addr.address_line_1}
                        {addr.address_line_2 && <><br />{addr.address_line_2}</>}<br />
                        {addr.postcode} {addr.city}, {addr.state}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    {!addr.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDefaultMutation.mutate(addr.id)}
                        disabled={setDefaultMutation.isPending}
                        data-testid={`button-default-${addr.id}`}
                      >
                        {t("member.addresses.setDefault")}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleEdit(addr)}
                      data-testid={`button-edit-${addr.id}`}
                    >
                      <Edit className="w-4 h-4" />
                      {t("member.addresses.edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-red-500 hover:text-red-600"
                      onClick={() => deleteAddressMutation.mutate(addr.id)}
                      disabled={deleteAddressMutation.isPending}
                      data-testid={`button-delete-${addr.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      {t("member.addresses.delete")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MemberLayout>
  );
}
