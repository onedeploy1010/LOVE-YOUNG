import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MemberLayout } from "@/components/MemberLayout";
import { useTranslation } from "@/lib/i18n";
import {
  MapPin, Plus, Edit, Trash2, Home, Building2, CheckCircle
} from "lucide-react";

const mockAddresses = [
  { 
    id: 1, 
    name: "John Doe", 
    phone: "+60 12-345 6789",
    address: "No. 123, Jalan Bukit Bintang, Bukit Bintang",
    city: "Kuala Lumpur",
    postcode: "55100",
    state: "Wilayah Persekutuan",
    isDefault: true,
    type: "home"
  },
  { 
    id: 2, 
    name: "John Doe", 
    phone: "+60 12-345 6789",
    address: "Level 10, Menara XYZ, Jalan Sultan Ismail",
    city: "Kuala Lumpur",
    postcode: "50250",
    state: "Wilayah Persekutuan",
    isDefault: false,
    type: "office"
  },
];

export default function MemberAddressesPage() {
  const { t } = useTranslation();
  const [addresses, setAddresses] = useState(mockAddresses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const setDefault = (id: number) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const deleteAddress = (id: number) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  return (
    <MemberLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-addresses-title">{t("member.addresses.title")}</h1>
            <p className="text-muted-foreground">{t("member.addresses.subtitle")}</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-add-address">
                <Plus className="w-4 h-4" />
                {t("member.addresses.addAddress")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{t("member.addresses.addAddressTitle")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("member.addresses.form.name")}</Label>
                    <Input id="name" placeholder={t("member.addresses.form.namePlaceholder")} data-testid="input-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("member.addresses.form.phone")}</Label>
                    <Input id="phone" placeholder="+60 12-345 6789" data-testid="input-phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">{t("member.addresses.form.address")}</Label>
                  <Textarea id="address" placeholder={t("member.addresses.form.addressPlaceholder")} data-testid="input-address" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">{t("member.addresses.form.city")}</Label>
                    <Input id="city" placeholder="Kuala Lumpur" data-testid="input-city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">{t("member.addresses.form.postcode")}</Label>
                    <Input id="postcode" placeholder="50000" data-testid="input-postcode" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">{t("member.addresses.form.state")}</Label>
                    <Input id="state" placeholder="Selangor" data-testid="input-state" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{t("member.addresses.cancel")}</Button>
                  <Button className="bg-secondary text-secondary-foreground" onClick={() => setIsDialogOpen(false)} data-testid="button-save-address">
                    {t("member.addresses.save")}
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
                className={`relative ${addr.isDefault ? "border-secondary" : ""}`}
                data-testid={`address-${addr.id}`}
              >
                {addr.isDefault && (
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
                    {!addr.isDefault && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDefault(addr.id)}
                        data-testid={`button-default-${addr.id}`}
                      >
                        {t("member.addresses.setDefault")}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-edit-${addr.id}`}>
                      <Edit className="w-4 h-4" />
                      {t("member.addresses.edit")}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 text-red-500 hover:text-red-600"
                      onClick={() => deleteAddress(addr.id)}
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
