import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Package, Search, Plus, Edit, Eye, Trash2, Star, Flame, Sparkles,
  Loader2, GripVertical, Check, X, Image as ImageIcon
} from "lucide-react";

interface BundleItem {
  flavor: string;
  quantity: number;
}

interface Bundle {
  id: string;
  name: string;
  name_en: string | null;
  name_ms: string | null;
  description: string | null;
  description_en: string | null;
  description_ms: string | null;
  target_audience: string | null;
  target_audience_en: string | null;
  target_audience_ms: string | null;
  keywords: string | null;
  keywords_en: string | null;
  keywords_ms: string | null;
  price: number;
  original_price: number | null;
  image: string | null;
  items: BundleItem[];
  sort_order: number;
  is_active: boolean;
  is_featured: boolean;
  is_hot: boolean;
  is_new: boolean;
  created_at: string;
}

export default function AdminBundlesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: bundles = [], isLoading } = useQuery({
    queryKey: ["admin-bundles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_bundles")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) {
        console.error("Error fetching bundles:", error);
        return [];
      }
      return data as Bundle[];
    },
  });

  const filteredBundles = bundles.filter(b =>
    searchQuery === "" ||
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateMutation = useMutation({
    mutationFn: async (bundle: Partial<Bundle> & { id: string }) => {
      const { error } = await supabase
        .from("product_bundles")
        .update({ ...bundle, updated_at: new Date().toISOString() })
        .eq("id", bundle.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast({ title: "套装已更新" });
      setEditOpen(false);
    },
    onError: (e: Error) => {
      toast({ title: "更新失败", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_bundles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast({ title: "套装已删除" });
      setDeleteOpen(false);
      setSelectedBundle(null);
    },
    onError: (e: Error) => {
      toast({ title: "删除失败", description: e.message, variant: "destructive" });
    },
  });

  const toggleField = (bundle: Bundle, field: "is_active" | "is_featured" | "is_hot" | "is_new") => {
    updateMutation.mutate({ id: bundle.id, [field]: !bundle[field] });
  };

  const stats = {
    total: bundles.length,
    active: bundles.filter(b => b.is_active).length,
    featured: bundles.filter(b => b.is_featured).length,
  };

  if (isLoading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif text-primary">套装配套管理</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">管理产品套装组合和展示设置</p>
          </div>
          <Button className="gap-2 w-full sm:w-auto" disabled>
            <Plus className="w-4 h-4" />
            添加套装
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Package className="w-4 h-4 text-primary" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">全部套装</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">已上架</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-green-500">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">首页优选</span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-amber-500">{stats.featured}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索套装名称..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Bundle List */}
        <div className="space-y-3">
          {filteredBundles.map((bundle) => (
            <Card key={bundle.id} className={!bundle.is_active ? "opacity-60" : ""}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {bundle.image ? (
                      <img src={bundle.image} alt={bundle.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground/50" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-medium text-sm sm:text-base">{bundle.name}</span>
                      {bundle.is_featured && <Badge className="bg-amber-500 text-[10px] sm:text-xs"><Star className="w-2.5 h-2.5 mr-0.5" />优选</Badge>}
                      {bundle.is_hot && <Badge className="bg-red-500 text-[10px] sm:text-xs"><Flame className="w-2.5 h-2.5 mr-0.5" />热卖</Badge>}
                      {bundle.is_new && <Badge className="bg-green-500 text-[10px] sm:text-xs"><Sparkles className="w-2.5 h-2.5 mr-0.5" />新品</Badge>}
                      {!bundle.is_active && <Badge variant="outline" className="text-[10px] sm:text-xs">已下架</Badge>}
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 truncate">{bundle.target_audience}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{bundle.keywords}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-bold text-sm sm:text-base text-primary">RM {(bundle.price / 100).toFixed(2)}</span>
                      {bundle.original_price && bundle.original_price > bundle.price && (
                        <span className="text-xs text-muted-foreground line-through">RM {(bundle.original_price / 100).toFixed(2)}</span>
                      )}
                    </div>
                    {/* Items preview */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bundle.items.slice(0, 4).map((item, i) => (
                        <Badge key={i} variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0">
                          {item.flavor} ×{item.quantity}
                        </Badge>
                      ))}
                      {bundle.items.length > 4 && (
                        <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0">+{bundle.items.length - 4}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 sm:h-8 px-2 text-xs"
                      onClick={() => { setSelectedBundle(bundle); setEditOpen(true); }}
                    >
                      <Edit className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">编辑</span>
                    </Button>
                    <Button
                      variant={bundle.is_featured ? "default" : "outline"}
                      size="sm"
                      className="h-7 sm:h-8 px-2 text-xs"
                      onClick={() => toggleField(bundle, "is_featured")}
                    >
                      <Star className="w-3 h-3 sm:mr-1" />
                      <span className="hidden sm:inline">优选</span>
                    </Button>
                    <Button
                      variant={bundle.is_active ? "outline" : "destructive"}
                      size="sm"
                      className="h-7 sm:h-8 px-2 text-xs"
                      onClick={() => toggleField(bundle, "is_active")}
                    >
                      {bundle.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">编辑套装</DialogTitle>
            </DialogHeader>
            {selectedBundle && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">套装名称 (中文)</label>
                  <Input
                    value={selectedBundle.name}
                    onChange={(e) => setSelectedBundle({ ...selectedBundle, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">英文名称</label>
                    <Input
                      value={selectedBundle.name_en || ""}
                      onChange={(e) => setSelectedBundle({ ...selectedBundle, name_en: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">马来文名称</label>
                    <Input
                      value={selectedBundle.name_ms || ""}
                      onChange={(e) => setSelectedBundle({ ...selectedBundle, name_ms: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">适用人群</label>
                  <Input
                    value={selectedBundle.target_audience || ""}
                    onChange={(e) => setSelectedBundle({ ...selectedBundle, target_audience: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">关键词</label>
                  <Input
                    value={selectedBundle.keywords || ""}
                    onChange={(e) => setSelectedBundle({ ...selectedBundle, keywords: e.target.value })}
                    placeholder="稳胎｜补血｜温和不刺激"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">售价 (分)</label>
                    <Input
                      type="number"
                      value={selectedBundle.price}
                      onChange={(e) => setSelectedBundle({ ...selectedBundle, price: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">原价 (分，可选)</label>
                    <Input
                      type="number"
                      value={selectedBundle.original_price || ""}
                      onChange={(e) => setSelectedBundle({ ...selectedBundle, original_price: parseInt(e.target.value) || null })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">封面图片URL</label>
                  <Input
                    value={selectedBundle.image || ""}
                    onChange={(e) => setSelectedBundle({ ...selectedBundle, image: e.target.value })}
                    placeholder="/pics/bundle-image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">口味组合 (JSON)</label>
                  <Textarea
                    rows={4}
                    value={JSON.stringify(selectedBundle.items, null, 2)}
                    onChange={(e) => {
                      try {
                        const items = JSON.parse(e.target.value);
                        setSelectedBundle({ ...selectedBundle, items });
                      } catch {}
                    }}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={selectedBundle.is_active}
                      onCheckedChange={(v) => setSelectedBundle({ ...selectedBundle, is_active: v })}
                    />
                    <span className="text-sm">上架</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={selectedBundle.is_featured}
                      onCheckedChange={(v) => setSelectedBundle({ ...selectedBundle, is_featured: v })}
                    />
                    <span className="text-sm">首页优选</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={selectedBundle.is_hot}
                      onCheckedChange={(v) => setSelectedBundle({ ...selectedBundle, is_hot: v })}
                    />
                    <span className="text-sm">热卖</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={selectedBundle.is_new}
                      onCheckedChange={(v) => setSelectedBundle({ ...selectedBundle, is_new: v })}
                    />
                    <span className="text-sm">新品</span>
                  </label>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
                  <Button
                    onClick={() => updateMutation.mutate(selectedBundle)}
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                    保存
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
