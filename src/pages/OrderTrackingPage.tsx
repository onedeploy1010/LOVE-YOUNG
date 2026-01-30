import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Search, Package, Truck, CheckCircle, Clock, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import type { Order } from "@shared/types";
import { apiRequest } from "@/lib/queryClient";

const WHATSAPP_PHONE = "60178228658";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent("您好，我想查询我的订单状态。")}`;
const META_SHOP_LINK = "https://www.facebook.com/loveyoung.birdnest/shop";

const statusConfig: Record<string, { label: string; icon: typeof Package; color: string }> = {
  pending: { label: "待确认", icon: Clock, color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  confirmed: { label: "已确认", icon: CheckCircle, color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  processing: { label: "处理中", icon: Package, color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  shipped: { label: "已发货", icon: Truck, color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  delivered: { label: "已送达", icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  cancelled: { label: "已取消", icon: XCircle, color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export default function OrderTrackingPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      toast({
        title: "请输入查询信息",
        description: "请输入订单号或手机号码",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await fetch(`/api/orders/track?q=${encodeURIComponent(query.trim())}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("未找到订单，请检查您输入的订单号或手机号码是否正确。");
        } else {
          setError("查询失败，请稍后重试。");
        }
        return;
      }
      const data = await response.json();
      setOrder(data);
    } catch (err) {
      setError("网络错误，请检查您的网络连接。");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "未知";
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const parseItems = (itemsStr: string) => {
    try {
      return JSON.parse(itemsStr) as Array<{ name: string; quantity: number; price: number }>;
    } catch {
      return [];
    }
  };

  const statusInfo = order ? statusConfig[order.status] || statusConfig.pending : null;

  return (
    <div className="min-h-screen bg-background">
      <Header whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />

      <main className="py-12 md:py-20">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <Link href="/">
            <Button variant="ghost" className="mb-6 gap-2" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
              返回首页
            </Button>
          </Link>

          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-3" data-testid="text-page-title">
              订单查询
            </h1>
            <p className="text-muted-foreground">
              输入您的订单号或手机号码查询订单状态
            </p>
          </div>

          <Card className="mb-8" data-testid="card-search">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="订单号 或 手机号码"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-query"
                  />
                </div>
                <Button type="submit" disabled={isLoading} data-testid="button-search">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "查询"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {error && (
            <Card className="border-destructive/50 mb-8" data-testid="card-error">
              <CardContent className="pt-6">
                <div className="text-center">
                  <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                  <p className="text-destructive font-medium mb-4">{error}</p>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => window.open(WHATSAPP_LINK, "_blank")}
                    data-testid="button-error-whatsapp"
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    联系客服
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {order && statusInfo && (
            <Card data-testid="card-order-result">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg mb-1" data-testid="text-order-number">
                      订单号: {order.orderNumber}
                    </CardTitle>
                    <CardDescription>
                      下单时间: {formatDate(order.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge className={`${statusInfo.color} gap-1`} data-testid="badge-order-status">
                    <statusInfo.icon className="w-3 h-3" />
                    {statusInfo.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">客户信息</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">姓名:</span> {order.customerName}</p>
                    <p><span className="text-muted-foreground">手机:</span> {order.customerPhone}</p>
                    {order.shippingAddress && (
                      <p><span className="text-muted-foreground">地址:</span> {order.shippingAddress}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-2">订单商品</h3>
                  <div className="space-y-2">
                    {parseItems(order.items).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.name} x {item.quantity}</span>
                        <span className="text-muted-foreground">RM {item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-medium">
                      <span>总计</span>
                      <span data-testid="text-order-total">RM {order.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {order.trackingNumber && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-2">物流信息</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4 text-primary" />
                      <span>运单号: {order.trackingNumber}</span>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => {
                      const message = encodeURIComponent(`您好，我想咨询订单 ${order.orderNumber} 的状态。`);
                      window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${message}`, "_blank");
                    }}
                    data-testid="button-contact-about-order"
                  >
                    <SiWhatsapp className="w-4 h-4" />
                    咨询此订单
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!order && !error && !isLoading && (
            <div className="text-center text-muted-foreground py-8">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="mb-2">输入订单号或手机号码开始查询</p>
              <p className="text-sm">例如: LY20241201001 或 60123456789</p>
            </div>
          )}
        </div>
      </main>

      <Footer whatsappLink={WHATSAPP_LINK} metaShopLink={META_SHOP_LINK} />
    </div>
  );
}
