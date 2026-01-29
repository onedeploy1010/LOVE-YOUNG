import { useState, useEffect } from "react";
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
  MapPin, Plus, Edit, Trash2, Home, Building2, CheckCircle, Loader2
} from "lucide-react";

interface Address {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
  state: string;
  is_default: boolean;
  type: "home" | "office";
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
    name: "",
    phone: "",
    address: "",
    city: "",
    postcode: "",
    state: "",
    type: "home" as "home" | "office",
  });

  const storageKey = `addresses_${user?.id || "guest"}`;

  // Try to fetch from Supabase, fallback to localStorage
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ["member-addresses", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Try Supabase first
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });

      if (!error && data) {
        return data as Address[];
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored) as Address[];
      }

      return [];
    },
    enabled: !!user?.id,
  });

  // Save to localStorage whenever addresses change (as backup)
  useEffect(() => {
    if (addresses.length > 0 && user?.id) {
      localStorage.setItem(storageKey, JSON.stringify(addresses));
    }
  }, [addresses, storageKey, user?.id]);

  const saveAddressMutation = useMutation({
    mutationFn: async (address: Omit<Address, "id"> & { id?: string }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Try Supabase first
      if (address.id) {
        const { error } = await supabase
          .from("addresses")
          .update(address)
          .eq("id", address.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("addresses")
          .insert({ ...address, user_id: user.id });

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
      // Fallback to localStorage
      const newAddress: Address = {
        id: editingAddress?.id || crypto.randomUUID(),
        ...formData,
        is_default: addresses.length === 0,
      };

      const updatedAddresses = editingAddress
        ? addresses.map(a => a.id === editingAddress.id ? newAddress : a)
        : [...addresses, newAddress];

      localStorage.setItem(storageKey, JSON.stringify(updatedAddresses));
      queryClient.setQueryData(["member-addresses", user?.id], updatedAddresses);
      setIsDialogOpen(false);
      setEditingAddress(null);
      resetForm();
      toast({ title: editingAddress ? "地址已更新" : "地址已添加" });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("addresses")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
      toast({ title: "地址已删除" });
    },
    onError: (error, id) => {
      // Fallback to localStorage
      const updatedAddresses = addresses.filter(a => a.id !== id);
      localStorage.setItem(storageKey, JSON.stringify(updatedAddresses));
      queryClient.setQueryData(["member-addresses", user?.id], updatedAddresses);
      toast({ title: "地址已删除" });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => {
      // First, unset all defaults
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("user_id", user?.id);

      // Then set the new default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-addresses"] });
      toast({ title: "默认地址已更新" });
    },
    onError: (error, id) => {
      // Fallback to localStorage
      const updatedAddresses = addresses.map(a => ({
        ...a,
        is_default: a.id === id,
      }));
      localStorage.setItem(storageKey, JSON.stringify(updatedAddresses));
      queryClient.setQueryData(["member-addresses", user?.id], updatedAddresses);
      toast({ title: "默认地址已更新" });
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      address: "",
      city: "",
      postcode: "",
      state: "",
      type: "home",
    });
  };

  const handleEdit = (address: Address) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      postcode: address.postcode,
      state: address.state,
      type: address.type,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.address) {
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
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${addr.type === "home" ? "bg-primary/10" : "bg-secondary/10"}`}>
                      {addr.type === "home" ? (
                        <Home className="w-5 h-5 text-primary" />
                      ) : (
                        <Building2 className="w-5 h-5 text-secondary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold">{addr.name}</span>
                        <span className="text-sm text-muted-foreground">{addr.phone}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {addr.address}<br />
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
