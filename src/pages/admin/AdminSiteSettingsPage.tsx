import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Home, Image as ImageIcon, Type, Link2, Loader2, Save, Star, Package, Check
} from "lucide-react";

interface HeroSettings {
  bundle_id: string | null;
  title: string;
  title_en: string;
  title_ms: string;
  subtitle: string;
  subtitle_en: string;
  subtitle_ms: string;
  button_text: string;
  button_text_en: string;
  button_text_ms: string;
  button_link: string;
  background_image: string;
}

interface FeaturedSettings {
  title: string;
  title_en: string;
  title_ms: string;
  bundle_ids: string[];
}

interface Bundle {
  id: string;
  name: string;
  is_active: boolean;
  is_featured: boolean;
}

export default function AdminSiteSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch site settings
  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      for (const row of data || []) {
        map[row.id] = row.value;
      }
      return map as { hero: HeroSettings; featured_bundles: FeaturedSettings };
    },
  });

  // Fetch bundles for selection
  const { data: bundles = [] } = useQuery({
    queryKey: ["admin-bundles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("id, name, is_active, is_featured")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data as Bundle[];
    },
  });

  const [heroForm, setHeroForm] = useState<HeroSettings | null>(null);
  const [featuredForm, setFeaturedForm] = useState<FeaturedSettings | null>(null);
  const [heroOpen, setHeroOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(false);

  // Initialize forms when settings load
  const initHeroForm = () => {
    if (settings?.hero) {
      setHeroForm({ ...settings.hero });
      setHeroOpen(true);
    }
  };

  const initFeaturedForm = () => {
    if (settings?.featured_bundles) {
      setFeaturedForm({ ...settings.featured_bundles });
      setFeaturedOpen(true);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: any }) => {
      const { error } = await supabase
        .from("site_settings")
        .update({ value, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "设置已保存" });
      setHeroOpen(false);
      setFeaturedOpen(false);
    },
    onError: (e: Error) => {
      toast({ title: "保存失败", description: e.message, variant: "destructive" });
    },
  });

  const toggleBundleFeatured = (bundleId: string) => {
    if (!featuredForm) return;
    const ids = featuredForm.bundle_ids || [];
    if (ids.includes(bundleId)) {
      setFeaturedForm({ ...featuredForm, bundle_ids: ids.filter(id => id !== bundleId) });
    } else {
      setFeaturedForm({ ...featuredForm, bundle_ids: [...ids, bundleId] });
    }
  };

  if (loadingSettings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif text-primary">首页设置</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">管理首页Hero区域和优选产品展示</p>
        </div>

        {/* Hero Settings Card */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Home className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Hero 区域设置
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">首页顶部大图和文案配置</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {settings?.hero && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">标题</p>
                    <p className="font-medium text-sm">{settings.hero.title}</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">按钮文字</p>
                    <p className="font-medium text-sm">{settings.hero.button_text}</p>
                  </div>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">副标题</p>
                  <p className="text-sm">{settings.hero.subtitle}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">背景图片</p>
                  <p className="text-xs font-mono truncate">{settings.hero.background_image}</p>
                </div>
                <Button onClick={initHeroForm} className="w-full sm:w-auto">
                  <Type className="w-4 h-4 mr-1.5" />
                  编辑 Hero 设置
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Products Card */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
              优选产品展示
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">设置首页展示的推荐套装</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {settings?.featured_bundles && (
              <div className="space-y-3">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">当前展示的套装</p>
                  <div className="flex flex-wrap gap-2">
                    {bundles.filter(b => b.is_featured).map(b => (
                      <Badge key={b.id} className="bg-amber-500">
                        <Star className="w-3 h-3 mr-1" />
                        {b.name}
                      </Badge>
                    ))}
                    {bundles.filter(b => b.is_featured).length === 0 && (
                      <span className="text-sm text-muted-foreground">暂未设置优选套装</span>
                    )}
                  </div>
                </div>
                <Button onClick={initFeaturedForm} className="w-full sm:w-auto">
                  <Package className="w-4 h-4 mr-1.5" />
                  管理优选套装
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card className="bg-gradient-to-br from-emerald-900/10 to-emerald-950/10 border-emerald-500/20">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">首页预览</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="aspect-video bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-lg overflow-hidden relative">
              {settings?.hero?.background_image && (
                <img
                  src={settings.hero.background_image}
                  alt="Hero"
                  className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4 text-center">
                <p className="text-amber-400 text-xs sm:text-sm mb-1">LOVE YOUNG</p>
                <h2 className="text-lg sm:text-2xl font-bold mb-2">{settings?.hero?.title}</h2>
                <p className="text-xs sm:text-sm opacity-80 mb-4">{settings?.hero?.subtitle}</p>
                <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-xs">
                  {settings?.hero?.button_text}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hero Edit Dialog */}
        <Dialog open={heroOpen} onOpenChange={setHeroOpen}>
          <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>编辑 Hero 设置</DialogTitle>
            </DialogHeader>
            {heroForm && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">标题 (中文)</label>
                  <Input
                    value={heroForm.title}
                    onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">标题 (英文)</label>
                    <Input
                      value={heroForm.title_en}
                      onChange={(e) => setHeroForm({ ...heroForm, title_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">标题 (马来文)</label>
                    <Input
                      value={heroForm.title_ms}
                      onChange={(e) => setHeroForm({ ...heroForm, title_ms: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">副标题 (中文)</label>
                  <Textarea
                    value={heroForm.subtitle}
                    onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">副标题 (英文)</label>
                    <Textarea
                      value={heroForm.subtitle_en}
                      onChange={(e) => setHeroForm({ ...heroForm, subtitle_en: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">副标题 (马来文)</label>
                    <Textarea
                      value={heroForm.subtitle_ms}
                      onChange={(e) => setHeroForm({ ...heroForm, subtitle_ms: e.target.value })}
                      rows={2}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">按钮文字 (中文)</label>
                  <Input
                    value={heroForm.button_text}
                    onChange={(e) => setHeroForm({ ...heroForm, button_text: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">按钮文字 (英文)</label>
                    <Input
                      value={heroForm.button_text_en}
                      onChange={(e) => setHeroForm({ ...heroForm, button_text_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">按钮文字 (马来文)</label>
                    <Input
                      value={heroForm.button_text_ms}
                      onChange={(e) => setHeroForm({ ...heroForm, button_text_ms: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">按钮链接</label>
                  <Input
                    value={heroForm.button_link}
                    onChange={(e) => setHeroForm({ ...heroForm, button_link: e.target.value })}
                    placeholder="/#products"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">背景图片 URL</label>
                  <Input
                    value={heroForm.background_image}
                    onChange={(e) => setHeroForm({ ...heroForm, background_image: e.target.value })}
                    placeholder="/pics/hero-background.jpg"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setHeroOpen(false)}>取消</Button>
                  <Button
                    onClick={() => saveMutation.mutate({ id: "hero", value: heroForm })}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    保存
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Featured Edit Dialog */}
        <Dialog open={featuredOpen} onOpenChange={setFeaturedOpen}>
          <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>管理优选套装</DialogTitle>
            </DialogHeader>
            {featuredForm && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">点击套装切换优选状态（直接在套装管理中设置is_featured）</p>
                <div className="space-y-2">
                  {bundles.map(bundle => (
                    <div
                      key={bundle.id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        bundle.is_featured ? "bg-amber-500/10 border-amber-500/30" : "bg-muted/30"
                      }`}
                    >
                      <span className="text-sm font-medium">{bundle.name}</span>
                      {bundle.is_featured ? (
                        <Badge className="bg-amber-500"><Star className="w-3 h-3 mr-1" />优选</Badge>
                      ) : (
                        <Badge variant="outline">未选</Badge>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  提示：套装的优选状态在"套装管理"页面中设置，本页面仅作展示。
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setFeaturedOpen(false)}>关闭</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
