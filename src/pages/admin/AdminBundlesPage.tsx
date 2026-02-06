import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Package, Search, Plus, Edit, Trash2, Star, Flame, Sparkles,
  Loader2, Check, X, Upload, Image as ImageIcon
} from "lucide-react";

interface BundleItem {
  flavor: string;
  quantity: number;
  productId?: string;
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

interface Product {
  id: string;
  name: string;
  price: number;
  image: string | null;
  category: string;
}

const emptyBundle: Omit<Bundle, 'id' | 'created_at'> = {
  name: "",
  name_en: null,
  name_ms: null,
  description: null,
  description_en: null,
  description_ms: null,
  target_audience: null,
  target_audience_en: null,
  target_audience_ms: null,
  keywords: null,
  keywords_en: null,
  keywords_ms: null,
  price: 0,
  original_price: null,
  image: null,
  items: [],
  sort_order: 0,
  is_active: true,
  is_featured: false,
  is_hot: false,
  is_new: true,
};

export default function AdminBundlesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Omit<Bundle, 'id' | 'created_at'>>(emptyBundle);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch bundles
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

  // Fetch products for selection
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image, category")
        .eq("is_active", true)
        .order("name");
      if (error) {
        console.error("Error fetching products:", error);
        return [];
      }
      return data as Product[];
    },
  });

  const filteredBundles = bundles.filter(b =>
    searchQuery === "" ||
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: Omit<Bundle, 'id' | 'created_at'>) => {
      const { error } = await supabase.from("product_bundles").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast({ title: "套装已创建" });
      setEditOpen(false);
      setFormData(emptyBundle);
    },
    onError: (e: Error) => {
      toast({ title: "创建失败", description: e.message, variant: "destructive" });
    },
  });

  // Update mutation
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

  // Delete mutation
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

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "请上传 JPG、PNG 或 WebP 格式的图片", variant: "destructive" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "图片大小不能超过 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `bundles/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(path);

      setFormData({ ...formData, image: publicUrl });
      toast({ title: "图片已上传" });
    } catch (error) {
      toast({ title: "上传失败", description: String(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // Handle product selection for bundle items
  const handleProductToggle = (product: Product, checked: boolean) => {
    if (checked) {
      // Add product to items
      setFormData({
        ...formData,
        items: [...formData.items, { flavor: product.name, quantity: 1, productId: product.id }]
      });
    } else {
      // Remove product from items
      setFormData({
        ...formData,
        items: formData.items.filter(item => item.productId !== product.id && item.flavor !== product.name)
      });
    }
  };

  // Update item quantity
  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], quantity: Math.max(1, quantity) };
    setFormData({ ...formData, items: newItems });
  };

  // Remove item
  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  // Open create dialog
  const handleCreate = () => {
    setIsCreating(true);
    setFormData(emptyBundle);
    setEditOpen(true);
  };

  // Open edit dialog
  const handleEdit = (bundle: Bundle) => {
    setIsCreating(false);
    setSelectedBundle(bundle);
    setFormData({
      name: bundle.name,
      name_en: bundle.name_en,
      name_ms: bundle.name_ms,
      description: bundle.description,
      description_en: bundle.description_en,
      description_ms: bundle.description_ms,
      target_audience: bundle.target_audience,
      target_audience_en: bundle.target_audience_en,
      target_audience_ms: bundle.target_audience_ms,
      keywords: bundle.keywords,
      keywords_en: bundle.keywords_en,
      keywords_ms: bundle.keywords_ms,
      price: bundle.price,
      original_price: bundle.original_price,
      image: bundle.image,
      items: bundle.items,
      sort_order: bundle.sort_order,
      is_active: bundle.is_active,
      is_featured: bundle.is_featured,
      is_hot: bundle.is_hot,
      is_new: bundle.is_new,
    });
    setEditOpen(true);
  };

  // Save bundle
  const handleSave = () => {
    if (!formData.name) {
      toast({ title: "请输入套装名称", variant: "destructive" });
      return;
    }
    if (formData.items.length === 0) {
      toast({ title: "请至少选择一个产品", variant: "destructive" });
      return;
    }
    if (formData.price <= 0) {
      toast({ title: "请输入有效的价格", variant: "destructive" });
      return;
    }

    if (isCreating) {
      createMutation.mutate(formData);
    } else if (selectedBundle) {
      updateMutation.mutate({ id: selectedBundle.id, ...formData });
    }
  };

  const stats = {
    total: bundles.length,
    active: bundles.filter(b => b.is_active).length,
    featured: bundles.filter(b => b.is_featured).length,
  };

  // Check if product is selected
  const isProductSelected = (productId: string, productName: string) => {
    return formData.items.some(item => item.productId === productId || item.flavor === productName);
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
          <Button className="gap-2 w-full sm:w-auto" onClick={handleCreate}>
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
          {filteredBundles.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                暂无套装，点击"添加套装"创建新的产品套装
              </CardContent>
            </Card>
          ) : (
            filteredBundles.map((bundle) => (
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
                        onClick={() => handleEdit(bundle)}
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 sm:h-8 px-2 text-xs text-red-500"
                        onClick={() => { setSelectedBundle(bundle); setDeleteOpen(true); }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[90dvh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">{isCreating ? "添加套装" : "编辑套装"}</DialogTitle>
              <DialogDescription className="text-sm">配置套装信息和包含的产品</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium mb-2 block">套装封面图</label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {formData.image ? (
                      <img src={formData.image} alt="Bundle" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="w-full sm:w-auto"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4 mr-2" />
                      )}
                      上传图片
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">支持 JPG、PNG、WebP，最大 5MB</p>
                    {formData.image && (
                      <Input
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="或输入图片URL"
                        className="mt-2 h-8 text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <label className="text-sm font-medium">套装名称 (中文) *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：孕期养生套装"
                  className="h-9"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">英文名称</label>
                  <Input
                    value={formData.name_en || ""}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value || null })}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">马来文名称</label>
                  <Input
                    value={formData.name_ms || ""}
                    onChange={(e) => setFormData({ ...formData, name_ms: e.target.value || null })}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">适用人群</label>
                <Input
                  value={formData.target_audience || ""}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value || null })}
                  placeholder="例如：孕妈妈、产后妈妈"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-sm font-medium">关键词</label>
                <Input
                  value={formData.keywords || ""}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value || null })}
                  placeholder="稳胎｜补血｜温和不刺激"
                  className="h-9"
                />
              </div>
              <div>
                <label className="text-sm font-medium">描述</label>
                <Textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value || null })}
                  placeholder="套装描述..."
                  rows={2}
                />
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">售价 (RM) *</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price / 100}
                    onChange={(e) => setFormData({ ...formData, price: Math.round(parseFloat(e.target.value) * 100) || 0 })}
                    className="h-9"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">原价 (RM，可选)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.original_price ? formData.original_price / 100 : ""}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null })}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">选择产品 *</label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">暂无产品</p>
                  ) : (
                    products.map((product) => (
                      <label
                        key={product.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={isProductSelected(product.id, product.name)}
                          onCheckedChange={(checked) => handleProductToggle(product, !!checked)}
                        />
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">RM {(product.price / 100).toFixed(2)}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Selected Items with Quantity */}
              {formData.items.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">已选产品数量</label>
                  <div className="space-y-2">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <span className="flex-1 text-sm truncate">{item.flavor}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateItemQuantity(index, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                            className="w-14 h-7 text-center text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => updateItemQuantity(index, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-red-500"
                          onClick={() => removeItem(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flags */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                  />
                  <span className="text-sm">上架</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_featured}
                    onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                  />
                  <span className="text-sm">首页优选</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_hot}
                    onCheckedChange={(v) => setFormData({ ...formData, is_hot: v })}
                  />
                  <span className="text-sm">热卖</span>
                </label>
                <label className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_new}
                    onCheckedChange={(v) => setFormData({ ...formData, is_new: v })}
                  />
                  <span className="text-sm">新品</span>
                </label>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditOpen(false)} className="w-full sm:w-auto">取消</Button>
                <Button
                  onClick={handleSave}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  {isCreating ? "创建" : "保存"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
              <DialogDescription>
                确定要删除套装 "{selectedBundle?.name}" 吗？此操作不可撤销。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)} className="w-full sm:w-auto">取消</Button>
              <Button
                variant="destructive"
                onClick={() => selectedBundle && deleteMutation.mutate(selectedBundle.id)}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto"
              >
                {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                删除
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
