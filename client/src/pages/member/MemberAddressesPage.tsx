import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MemberLayout } from "@/components/MemberLayout";
import {
  MapPin, Plus, Edit, Trash2, Home, Building2, CheckCircle
} from "lucide-react";

const mockAddresses = [
  { 
    id: 1, 
    name: "张三", 
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
    name: "张三", 
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
            <h1 className="text-2xl font-serif text-primary" data-testid="text-addresses-title">地址管理</h1>
            <p className="text-muted-foreground">管理您的收货地址</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-add-address">
                <Plus className="w-4 h-4" />
                新增地址
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>新增收货地址</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">收件人姓名</Label>
                    <Input id="name" placeholder="请输入姓名" data-testid="input-name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">联系电话</Label>
                    <Input id="phone" placeholder="+60 12-345 6789" data-testid="input-phone" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">详细地址</Label>
                  <Textarea id="address" placeholder="街道、门牌号、楼层等" data-testid="input-address" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">城市</Label>
                    <Input id="city" placeholder="Kuala Lumpur" data-testid="input-city" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">邮编</Label>
                    <Input id="postcode" placeholder="50000" data-testid="input-postcode" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">州属</Label>
                    <Input id="state" placeholder="Selangor" data-testid="input-state" />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                  <Button className="bg-secondary text-secondary-foreground" onClick={() => setIsDialogOpen(false)} data-testid="button-save-address">
                    保存地址
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
              <p className="text-muted-foreground mb-4">您还没有添加收货地址</p>
              <Button className="bg-secondary text-secondary-foreground" onClick={() => setIsDialogOpen(true)}>
                添加第一个地址
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
                    默认地址
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
                        设为默认
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1" data-testid={`button-edit-${addr.id}`}>
                      <Edit className="w-4 h-4" />
                      编辑
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="gap-1 text-red-500 hover:text-red-600"
                      onClick={() => deleteAddress(addr.id)}
                      data-testid={`button-delete-${addr.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
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
