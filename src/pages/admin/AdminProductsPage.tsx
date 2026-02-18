import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminLayout } from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Package, Search, Plus, Edit, Eye, Trash2, Settings,
  Image as ImageIcon, Loader2, FolderPlus, MoreHorizontal,
  Tag, DollarSign, Box, Star, Flame, Sparkles, Check, X, Gift, Layers
} from "lucide-react";

// Variant type
interface BundleVariant {
  id: string;
  bundle_id: string;
  name: string;
  name_en: string | null;
  name_ms: string | null;
  image: string | null;
  price_adjustment: number;
  sku: string | null;
  stock: number;
  is_available: boolean;
  sort_order: number;
}
import type { Product } from "@shared/types";

// Bundle types
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

const productFormSchema = z.object({
  name: z.string().min(1, "请输入产品名称"),
  nameEn: z.string().optional(),
  description: z.string().min(1, "请输入产品描述"),
  price: z.coerce.number().min(1, "价格必须大于0"),
  priceUnit: z.string().default("份"),
  image: z.string().default("/pics/product-placeholder.jpg"),
  category: z.string().min(1, "请选择分类"),
  featured: z.boolean().default(false),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

const categoryFormSchema = z.object({
  name: z.string().min(1, "请输入分类名称"),
  nameEn: z.string().optional(),
  description: z.string().optional(),
  color: z.string().default("emerald"),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

type ProductCategory = {
  id: string;
  name: string;
  nameEn?: string;
  name_en?: string;
  description?: string;
  color: string;
};

export default function AdminProductsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bundleFileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [bundleUploading, setBundleUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [activeTab, setActiveTab] = useState<"bundles" | "products">("bundles");

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Bundle states
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [bundleEditOpen, setBundleEditOpen] = useState(false);
  const [bundleCreateOpen, setBundleCreateOpen] = useState(false);
  const [bundleDeleteOpen, setBundleDeleteOpen] = useState(false);

  // Variant states
  const [variants, setVariants] = useState<BundleVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [editingVariant, setEditingVariant] = useState<BundleVariant | null>(null);
  const [newVariant, setNewVariant] = useState({ name: "", name_en: "", name_ms: "", image: "", stock: 0 });
  const [variantUploading, setVariantUploading] = useState(false);
  const variantFileInputRef = useRef<HTMLInputElement>(null);
  const [newBundle, setNewBundle] = useState({
    name: "", name_en: "", name_ms: "",
    description: "", target_audience: "", target_audience_en: "", target_audience_ms: "",
    keywords: "", keywords_en: "", keywords_ms: "",
    price: 0, original_price: null as number | null,
    image: "", items: [] as BundleItem[],
    sort_order: 0, is_active: true, is_featured: false, is_hot: false, is_new: true,
  });

  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  // Fetch bundles
  const { data: bundles = [], isLoading: bundlesLoading } = useQuery({
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

  // Fetch all bundle variants for list display (first variant image)
  const { data: allVariants = [] } = useQuery<BundleVariant[]>({
    queryKey: ["admin-bundle-variants-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bundle_variants")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) return [];
      return data as BundleVariant[];
    },
  });
  const variantsByBundle = allVariants.reduce<Record<string, BundleVariant[]>>((acc, v) => {
    if (!acc[v.bundle_id]) acc[v.bundle_id] = [];
    acc[v.bundle_id].push(v);
    return acc;
  }, {});

  const filteredBundles = bundles.filter(b =>
    searchQuery === "" ||
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bundleUpdateMutation = useMutation({
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
      setBundleEditOpen(false);
    },
    onError: (e: Error) => {
      toast({ title: "更新失败", description: e.message, variant: "destructive" });
    },
  });

  const toggleBundleField = (bundle: Bundle, field: "is_active" | "is_featured" | "is_hot" | "is_new") => {
    bundleUpdateMutation.mutate({ id: bundle.id, [field]: !bundle[field] });
  };

  const bundleCreateMutation = useMutation({
    mutationFn: async (bundle: typeof newBundle) => {
      const { error } = await supabase
        .from("product_bundles")
        .insert({
          name: bundle.name,
          name_en: bundle.name_en || null,
          name_ms: bundle.name_ms || null,
          description: bundle.description || null,
          target_audience: bundle.target_audience || null,
          target_audience_en: bundle.target_audience_en || null,
          target_audience_ms: bundle.target_audience_ms || null,
          keywords: bundle.keywords || null,
          keywords_en: bundle.keywords_en || null,
          keywords_ms: bundle.keywords_ms || null,
          price: bundle.price,
          original_price: bundle.original_price,
          image: bundle.image || null,
          items: bundle.items,
          sort_order: bundle.sort_order,
          is_active: bundle.is_active,
          is_featured: bundle.is_featured,
          is_hot: bundle.is_hot,
          is_new: bundle.is_new,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast({ title: "配套创建成功" });
      setBundleCreateOpen(false);
      setNewBundle({
        name: "", name_en: "", name_ms: "",
        description: "", target_audience: "", target_audience_en: "", target_audience_ms: "",
        keywords: "", keywords_en: "", keywords_ms: "",
        price: 0, original_price: null,
        image: "", items: [],
        sort_order: 0, is_active: true, is_featured: false, is_hot: false, is_new: true,
      });
    },
    onError: (e: Error) => {
      toast({ title: "创建失败", description: e.message, variant: "destructive" });
    },
  });

  const bundleDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("product_bundles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast({ title: "配套已删除" });
      setBundleDeleteOpen(false);
      setBundleEditOpen(false);
      setSelectedBundle(null);
    },
    onError: (e: Error) => {
      toast({ title: "删除失败", description: e.message, variant: "destructive" });
    },
  });

  const bundleStats = {
    total: bundles.length,
    active: bundles.filter(b => b.is_active).length,
    featured: bundles.filter(b => b.is_featured).length,
    heroBundle: bundles.find(b => b.is_hot),
  };

  // Set bundle as Hero (exclusive - only one can be hero)
  const setAsHeroMutation = useMutation({
    mutationFn: async (bundleId: string) => {
      // First, unset all is_hot
      await supabase
        .from("product_bundles")
        .update({ is_hot: false, updated_at: new Date().toISOString() })
        .eq("is_hot", true);
      // Then set the selected one as hot
      const { error } = await supabase
        .from("product_bundles")
        .update({ is_hot: true, updated_at: new Date().toISOString() })
        .eq("id", bundleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bundles"] });
      toast({ title: "已设为首页主推", description: "该套装将显示在首页Hero位置" });
    },
    onError: (e: Error) => {
      toast({ title: "设置失败", description: e.message, variant: "destructive" });
    },
  });

  // Load variants when bundle is selected
  const loadVariants = async (bundleId: string) => {
    setVariantsLoading(true);
    const { data, error } = await supabase
      .from("bundle_variants")
      .select("*")
      .eq("bundle_id", bundleId)
      .order("sort_order", { ascending: true });
    if (!error && data) {
      setVariants(data as BundleVariant[]);
    }
    setVariantsLoading(false);
  };

  // Add variant
  const addVariant = async () => {
    if (!selectedBundle || !newVariant.name) return;
    const { error } = await supabase
      .from("bundle_variants")
      .insert({
        bundle_id: selectedBundle.id,
        name: newVariant.name,
        name_en: newVariant.name_en || null,
        name_ms: newVariant.name_ms || null,
        image: newVariant.image || null,
        stock: newVariant.stock,
        sort_order: variants.length,
      });
    if (error) {
      toast({ title: "添加失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "规格已添加" });
      loadVariants(selectedBundle.id);
      setNewVariant({ name: "", name_en: "", name_ms: "", image: "", stock: 0 });
    }
  };

  // Update variant
  const updateVariant = async (variant: BundleVariant) => {
    const { error } = await supabase
      .from("bundle_variants")
      .update({
        name: variant.name,
        name_en: variant.name_en,
        name_ms: variant.name_ms,
        image: variant.image,
        stock: variant.stock,
        is_available: variant.is_available,
        updated_at: new Date().toISOString(),
      })
      .eq("id", variant.id);
    if (error) {
      toast({ title: "更新失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "规格已更新" });
      if (selectedBundle) loadVariants(selectedBundle.id);
      setEditingVariant(null);
    }
  };

  // Delete variant
  const deleteVariant = async (variantId: string) => {
    const { error } = await supabase
      .from("bundle_variants")
      .delete()
      .eq("id", variantId);
    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "规格已删除" });
      if (selectedBundle) loadVariants(selectedBundle.id);
    }
  };

  // Upload variant image
  const handleVariantImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, variantId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "请上传 JPG/PNG/WebP 格式的图片", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "图片大小不能超过 5MB", variant: "destructive" });
      return;
    }

    setVariantUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `variants/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "上传失败", description: uploadError.message, variant: "destructive" });
      setVariantUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    if (variantId && editingVariant) {
      setEditingVariant({ ...editingVariant, image: publicUrl });
    } else {
      setNewVariant({ ...newVariant, image: publicUrl });
    }
    setVariantUploading(false);
    toast({ title: "图片上传成功" });
  };

  const { data: categories = [] } = useQuery<ProductCategory[]>({
    queryKey: ["product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) { console.error("Error fetching categories:", error); return []; }
      return (data || []).map((c): ProductCategory => ({
        id: c.id,
        name: c.name,
        nameEn: c.name_en,
        description: c.description,
        color: c.color || "emerald",
      }));
    },
  });

  const productForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      nameEn: "",
      description: "",
      price: 0,
      priceUnit: "份",
      image: "/pics/product-placeholder.jpg",
      category: "",
      featured: false,
    },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      nameEn: "",
      description: "",
      color: "emerald",
    },
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching products:", error);
        return [];
      }

      return (data || []).map((p): Product => ({
        id: p.id,
        name: p.name,
        nameEn: p.name_en,
        description: p.description,
        price: p.price,
        priceUnit: p.price_unit,
        image: p.image,
        category: p.category,
        featured: p.featured,
        erpnextItemCode: p.erpnext_item_code || null,
      }));
    },
  });

  const filteredProducts = products?.filter(p => {
    const matchesSearch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  const getCategoryLabel = (cat: string) => {
    const category = categories.find(c => c.id === cat);
    return category?.name || cat;
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
      amber: "bg-amber-500/10 text-amber-600 border-amber-200",
      rose: "bg-rose-500/10 text-rose-600 border-rose-200",
      blue: "bg-blue-500/10 text-blue-600 border-blue-200",
    };
    return colors[color] || colors.emerald;
  };

  const handleEditCategory = (category: ProductCategory) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      nameEn: category.nameEn,
      description: category.description,
      color: category.color,
    });
    setShowCategoryModal(true);
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({
      name: "",
      nameEn: "",
      description: "",
      color: "emerald",
    });
    setShowCategoryModal(true);
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    productForm.reset({
      name: "",
      nameEn: "",
      description: "",
      price: 0,
      priceUnit: "份",
      image: "/pics/product-placeholder.jpg",
      category: "",
      featured: false,
    });
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      nameEn: product.nameEn || "",
      description: product.description,
      price: product.price,
      priceUnit: product.priceUnit || "份",
      image: product.image,
      category: product.category,
      featured: product.featured || false,
    });
    setShowProductModal(true);
  };

  const handleViewProduct = (product: Product) => {
    setEditingProduct(product);
    setShowViewModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setEditingProduct(product);
    setShowDeleteConfirm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "文件类型不支持", description: "请上传 JPG, PNG 或 WebP 格式的图片", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "文件过大", description: "图片大小不能超过 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `products/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      productForm.setValue("image", urlData.publicUrl);
      toast({ title: "图片上传成功" });
    } catch (err) {
      toast({ title: "上传失败", description: String(err), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBundleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "文件类型不支持", description: "请上传 JPG, PNG 或 WebP 格式的图片", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "文件过大", description: "图片大小不能超过 5MB", variant: "destructive" });
      return;
    }

    setBundleUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `bundles/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(filePath);
      if (isEdit && selectedBundle) {
        setSelectedBundle({ ...selectedBundle, image: urlData.publicUrl });
      } else {
        setNewBundle({ ...newBundle, image: urlData.publicUrl });
      }
      toast({ title: "图片上传成功" });
    } catch (err) {
      toast({ title: "上传失败", description: String(err), variant: "destructive" });
    } finally {
      setBundleUploading(false);
      if (bundleFileInputRef.current) bundleFileInputRef.current.value = "";
    }
  };

  // Toggle product in bundle items
  const toggleProductInBundle = (product: Product, isEdit: boolean) => {
    if (isEdit && selectedBundle) {
      const exists = selectedBundle.items.find(item => item.flavor === product.name);
      if (exists) {
        setSelectedBundle({
          ...selectedBundle,
          items: selectedBundle.items.filter(item => item.flavor !== product.name)
        });
      } else {
        setSelectedBundle({
          ...selectedBundle,
          items: [...selectedBundle.items, { flavor: product.name, quantity: 1 }]
        });
      }
    } else {
      const exists = newBundle.items.find(item => item.flavor === product.name);
      if (exists) {
        setNewBundle({
          ...newBundle,
          items: newBundle.items.filter(item => item.flavor !== product.name)
        });
      } else {
        setNewBundle({
          ...newBundle,
          items: [...newBundle.items, { flavor: product.name, quantity: 1 }]
        });
      }
    }
  };

  // Update product quantity in bundle
  const updateProductQuantity = (productName: string, quantity: number, isEdit: boolean) => {
    if (isEdit && selectedBundle) {
      setSelectedBundle({
        ...selectedBundle,
        items: selectedBundle.items.map(item =>
          item.flavor === productName ? { ...item, quantity: Math.max(1, quantity) } : item
        )
      });
    } else {
      setNewBundle({
        ...newBundle,
        items: newBundle.items.map(item =>
          item.flavor === productName ? { ...item, quantity: Math.max(1, quantity) } : item
        )
      });
    }
  };

  const productSaveMutation = useMutation({
    mutationFn: async (data: ProductFormValues) => {
      const payload = {
        name: data.name,
        name_en: data.nameEn || null,
        description: data.description,
        price: data.price,
        price_unit: data.priceUnit,
        image: data.image,
        category: data.category,
        featured: data.featured,
      };
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("products")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setShowProductModal(false);
      setEditingProduct(null);
      productForm.reset();
    },
    onError: (err) => {
      console.error("Error saving product:", err);
    },
  });

  const onSubmitProduct = (data: ProductFormValues) => {
    productSaveMutation.mutate(data);
  };

  const categorySaveMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      if (editingCategory) {
        await supabase
          .from("product_categories")
          .update({ name: data.name, name_en: data.nameEn, description: data.description, color: data.color })
          .eq("id", editingCategory.id);
      } else {
        const newId = data.name.toLowerCase().replace(/\s+/g, '-');
        await supabase
          .from("product_categories")
          .insert({ id: newId, name: data.name, name_en: data.nameEn, description: data.description, color: data.color });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setShowCategoryModal(false);
      categoryForm.reset();
    },
  });

  const onSubmitCategory = (data: CategoryFormValues) => {
    categorySaveMutation.mutate(data);
  };

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setShowDeleteConfirm(false);
      setEditingProduct(null);
    },
    onError: (err) => {
      console.error("Error deleting product:", err);
    },
  });

  const handleConfirmDelete = () => {
    if (editingProduct?.id) {
      deleteMutation.mutate(editingProduct.id);
    }
  };

  const stats = {
    total: products?.length || 0,
    active: products?.length || 0,
    birdNest: products?.filter(p => p.category === "bird-nest").length || 0,
    fishMaw: products?.filter(p => p.category === "fish-maw").length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif" data-testid="text-products-title">{t("admin.productsPage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.productsPage.subtitle")}</p>
          </div>
        </div>

        {/* Main Tabs: Bundles vs Products */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "bundles" | "products")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="bundles" className="gap-2">
              <Gift className="w-4 h-4" />
              套装配套
            </TabsTrigger>
            <TabsTrigger value="products" className="gap-2">
              <Package className="w-4 h-4" />
              单品管理
            </TabsTrigger>
          </TabsList>

          {/* Bundles Tab */}
          <TabsContent value="bundles" className="space-y-4">
            <div className="flex justify-end">
              <Button className="gap-2 bg-secondary text-secondary-foreground" onClick={() => setBundleCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                新增配套
              </Button>
            </div>
            {/* Bundle Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="w-4 h-4 text-primary" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">全部套装</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold">{bundleStats.total}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">已上架</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-green-500">{bundleStats.active}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">首页优选</span>
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-amber-500">{bundleStats.featured}</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Flame className="w-4 h-4 text-red-500" />
                    <span className="text-[10px] sm:text-xs text-muted-foreground">Hero主推</span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-red-600 truncate">
                    {bundleStats.heroBundle?.name || "未设置"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Bundle Search */}
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
            {bundlesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBundles.map((bundle) => {
                  const bundleVars = variantsByBundle[bundle.id] || [];
                  const firstVarImage = bundleVars.find(v => v.image)?.image;
                  return (
                  <Card key={bundle.id} className={!bundle.is_active ? "opacity-60" : ""}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        {/* Image from variants */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                          {firstVarImage ? (
                            <img src={firstVarImage} alt={bundle.name} className="w-full h-full object-cover" />
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
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-sm sm:text-base text-primary">RM {(bundle.price / 100).toFixed(0)}</span>
                            {bundle.original_price && bundle.original_price > bundle.price && (
                              <span className="text-xs text-muted-foreground line-through">RM {(bundle.original_price / 100).toFixed(0)}</span>
                            )}
                          </div>
                          {/* Items preview */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {bundle.items.slice(0, 3).map((item, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0">
                                {item.flavor} ×{item.quantity}
                              </Badge>
                            ))}
                            {bundle.items.length > 3 && (
                              <Badge variant="outline" className="text-[9px] sm:text-[10px] px-1 py-0">+{bundle.items.length - 3}</Badge>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 sm:h-8 px-2 text-xs"
                            onClick={() => { setSelectedBundle(bundle); loadVariants(bundle.id); setBundleEditOpen(true); }}
                          >
                            <Edit className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">编辑</span>
                          </Button>
                          <Button
                            variant={bundle.is_hot ? "default" : "outline"}
                            size="sm"
                            className={`h-7 sm:h-8 px-2 text-xs ${bundle.is_hot ? "bg-red-500 hover:bg-red-600" : ""}`}
                            onClick={() => setAsHeroMutation.mutate(bundle.id)}
                            disabled={bundle.is_hot || setAsHeroMutation.isPending}
                          >
                            <Flame className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">{bundle.is_hot ? "主推中" : "设为Hero"}</span>
                          </Button>
                          <Button
                            variant={bundle.is_featured ? "default" : "outline"}
                            size="sm"
                            className="h-7 sm:h-8 px-2 text-xs"
                            onClick={() => toggleBundleField(bundle, "is_featured")}
                          >
                            <Star className="w-3 h-3 sm:mr-1" />
                            <span className="hidden sm:inline">优选</span>
                          </Button>
                          <Button
                            variant={bundle.is_active ? "outline" : "destructive"}
                            size="sm"
                            className="h-7 sm:h-8 px-2 text-xs"
                            onClick={() => toggleBundleField(bundle, "is_active")}
                          >
                            {bundle.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="gap-2" onClick={handleNewCategory} data-testid="button-manage-categories">
                <FolderPlus className="w-4 h-4" />
                {t("admin.productsPage.manageCategories")}
              </Button>
              <Button className="gap-2 bg-secondary text-secondary-foreground" onClick={handleNewProduct} data-testid="button-add-product">
                <Plus className="w-4 h-4" />
                {t("admin.productsPage.addProduct")}
              </Button>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">{t("admin.productsPage.totalProducts")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">{stats.active}</p>
                <p className="text-sm text-muted-foreground">{t("admin.productsPage.activeProducts")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Box className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.birdNest}</p>
                <p className="text-sm text-muted-foreground">{t("admin.productsPage.categoryBirdNest")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Box className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.fishMaw}</p>
                <p className="text-sm text-muted-foreground">{t("admin.productsPage.categoryFishMaw")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground mr-2">{t("admin.productsPage.categories")}:</span>
          <Badge 
            variant={activeCategory === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory("all")}
            data-testid="category-all"
          >
            {t("admin.productsPage.allCategories")}
          </Badge>
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className={`cursor-pointer ${activeCategory === cat.id ? getCategoryColor(cat.color) : ""}`}
              onClick={() => setActiveCategory(cat.id)}
              data-testid={`category-${cat.id}`}
            >
              {cat.name}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-4 w-4 ml-1 p-0"
                onClick={(e) => { e.stopPropagation(); handleEditCategory(cat); }}
              >
                <Settings className="w-3 h-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                {t("admin.productsPage.productList")} ({filteredProducts.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={t("admin.productsPage.searchPlaceholder")}
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
                <div className="flex border rounded-md">
                  <Button 
                    variant={viewMode === "grid" ? "secondary" : "ghost"} 
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    data-testid="button-view-grid"
                  >
                    <Box className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant={viewMode === "table" ? "secondary" : "ghost"} 
                    size="icon"
                    onClick={() => setViewMode("table")}
                    data-testid="button-view-table"
                  >
                    <Package className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">{t("admin.productsPage.noProducts")}</p>
                <Button className="mt-4" onClick={handleNewProduct}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("admin.productsPage.addFirstProduct")}
                </Button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const category = categories.find(c => c.id === product.category);
                  return (
                    <Card key={product.id} className="overflow-hidden hover-elevate" data-testid={`product-${product.id}`}>
                      <div className="aspect-video bg-muted flex items-center justify-center relative">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                        )}
                        {!product.featured && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Badge variant="destructive">{t("admin.productsPage.unavailable")}</Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.nameEn}</p>
                          </div>
                          {category && (
                            <Badge variant="outline" className={getCategoryColor(category.color)}>
                              {category.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">RM {product.price}</span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleViewProduct(product)} data-testid={`button-view-${product.id}`}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)} data-testid={`button-edit-${product.id}`}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProduct(product)} data-testid={`button-delete-${product.id}`}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.productsPage.image")}</TableHead>
                    <TableHead>{t("admin.productsPage.productName")}</TableHead>
                    <TableHead>{t("admin.productsPage.category")}</TableHead>
                    <TableHead className="text-right">{t("admin.productsPage.price")}</TableHead>
                    <TableHead>{t("admin.productsPage.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.productsPage.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const category = categories.find(c => c.id === product.category);
                    return (
                      <TableRow key={product.id} data-testid={`product-row-${product.id}`}>
                        <TableCell>
                          <div className="w-16 h-12 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {product.image ? (
                              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-muted-foreground/50" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.nameEn}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {category && (
                            <Badge variant="outline" className={getCategoryColor(category.color)}>
                              {category.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">RM {product.price}</TableCell>
                        <TableCell>
                          <Badge className={product.featured !== false ? "bg-green-500" : "bg-red-500"}>
                            {product.featured !== false ? t("admin.productsPage.available") : t("admin.productsPage.unavailable")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${product.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewProduct(product)}>
                                <Eye className="w-4 h-4 mr-2" />
                                {t("admin.productsPage.view")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t("admin.productsPage.edit")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteProduct(product)} className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t("admin.productsPage.delete")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bundle Edit Dialog */}
      <Dialog open={bundleEditOpen} onOpenChange={setBundleEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-2">
                <label className="text-sm font-medium">选择产品组合</label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {products?.map((product) => {
                    const isSelected = selectedBundle.items.some(item => item.flavor === product.name);
                    const item = selectedBundle.items.find(item => item.flavor === product.name);
                    return (
                      <div key={product.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleProductInBundle(product, true)}
                          className={`flex-1 flex items-center gap-2 p-2 rounded border text-left transition-colors ${
                            isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                          }`}
                        >
                          {isSelected ? <Check className="w-4 h-4 text-primary" /> : <div className="w-4 h-4" />}
                          <span className="text-sm truncate">{product.name}</span>
                        </button>
                        {isSelected && (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateProductQuantity(product.name, (item?.quantity || 1) - 1, true)}
                            >
                              -
                            </Button>
                            <span className="w-6 text-center text-sm">{item?.quantity || 1}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateProductQuantity(product.name, (item?.quantity || 1) + 1, true)}
                            >
                              +
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {(!products || products.length === 0) && (
                    <p className="text-sm text-muted-foreground text-center py-2">暂无产品</p>
                  )}
                </div>
                {selectedBundle.items.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    已选: {selectedBundle.items.map(i => `${i.flavor}×${i.quantity}`).join(", ")}
                  </p>
                )}
              </div>

              {/* Variant Management */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    规格款式管理
                  </label>
                  <span className="text-xs text-muted-foreground">{variants.length} 个规格</span>
                </div>

                {/* Existing Variants */}
                {variantsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {variants.map((v) => (
                      <div key={v.id} className="flex items-center gap-2 p-2 border rounded-lg">
                        {editingVariant?.id === v.id ? (
                          <>
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {editingVariant.image ? (
                                <img src={editingVariant.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <Input
                                value={editingVariant.name}
                                onChange={(e) => setEditingVariant({ ...editingVariant, name: e.target.value })}
                                placeholder="规格名称"
                                className="h-7 text-sm"
                              />
                              <div className="flex gap-1">
                                <Input
                                  value={editingVariant.name_en || ""}
                                  onChange={(e) => setEditingVariant({ ...editingVariant, name_en: e.target.value })}
                                  placeholder="English"
                                  className="h-6 text-xs"
                                />
                                <Input
                                  type="number"
                                  value={editingVariant.stock}
                                  onChange={(e) => setEditingVariant({ ...editingVariant, stock: parseInt(e.target.value) || 0 })}
                                  placeholder="库存"
                                  className="h-6 text-xs w-16"
                                />
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <input
                                type="file"
                                className="hidden"
                                id={`variant-upload-${v.id}`}
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) => handleVariantImageUpload(e, v.id)}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                disabled={variantUploading}
                                onClick={() => document.getElementById(`variant-upload-${v.id}`)?.click()}
                              >
                                {variantUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                              </Button>
                              <Button
                                type="button"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => updateVariant(editingVariant)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setEditingVariant(null)}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                              {v.image ? (
                                <img src={v.image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{v.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {v.name_en && <span>{v.name_en} · </span>}
                                库存: {v.stock}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditingVariant(v)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => deleteVariant(v.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Variant */}
                <div className="flex items-center gap-2 p-2 border border-dashed rounded-lg">
                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {newVariant.image ? (
                      <img src={newVariant.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Plus className="w-5 h-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <Input
                      value={newVariant.name}
                      onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                      placeholder="新规格名称（如：来财款）"
                      className="h-7 text-sm"
                    />
                    <div className="flex gap-1">
                      <Input
                        value={newVariant.name_en}
                        onChange={(e) => setNewVariant({ ...newVariant, name_en: e.target.value })}
                        placeholder="English name"
                        className="h-6 text-xs"
                      />
                      <Input
                        type="number"
                        value={newVariant.stock || ""}
                        onChange={(e) => setNewVariant({ ...newVariant, stock: parseInt(e.target.value) || 0 })}
                        placeholder="库存"
                        className="h-6 text-xs w-16"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <input
                      type="file"
                      ref={variantFileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleVariantImageUpload(e)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-6 w-6"
                      disabled={variantUploading}
                      onClick={() => variantFileInputRef.current?.click()}
                    >
                      {variantUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      className="h-6 w-6"
                      onClick={addVariant}
                      disabled={!newVariant.name}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
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
                <Button variant="destructive" onClick={() => setBundleDeleteOpen(true)} className="sm:mr-auto">
                  <Trash2 className="w-4 h-4 mr-1" />
                  删除
                </Button>
                <Button variant="outline" onClick={() => setBundleEditOpen(false)}>取消</Button>
                <Button
                  onClick={() => bundleUpdateMutation.mutate(selectedBundle)}
                  disabled={bundleUpdateMutation.isPending}
                >
                  {bundleUpdateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  保存
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bundle Create Dialog */}
      <Dialog open={bundleCreateOpen} onOpenChange={setBundleCreateOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">新增配套</DialogTitle>
            <DialogDescription>创建新的套装配套</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">套装名称 (中文) *</label>
              <Input
                value={newBundle.name}
                onChange={(e) => setNewBundle({ ...newBundle, name: e.target.value })}
                placeholder="例如：孕妈专属滋补礼盒"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">英文名称</label>
                <Input
                  value={newBundle.name_en}
                  onChange={(e) => setNewBundle({ ...newBundle, name_en: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">马来文名称</label>
                <Input
                  value={newBundle.name_ms}
                  onChange={(e) => setNewBundle({ ...newBundle, name_ms: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">适用人群</label>
              <Input
                value={newBundle.target_audience}
                onChange={(e) => setNewBundle({ ...newBundle, target_audience: e.target.value })}
                placeholder="例如：孕期补养、产后恢复"
              />
            </div>
            <div>
              <label className="text-sm font-medium">关键词</label>
              <Input
                value={newBundle.keywords}
                onChange={(e) => setNewBundle({ ...newBundle, keywords: e.target.value })}
                placeholder="稳胎｜补血｜温和不刺激"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">售价 (分) *</label>
                <Input
                  type="number"
                  value={newBundle.price}
                  onChange={(e) => setNewBundle({ ...newBundle, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">原价 (分，可选)</label>
                <Input
                  type="number"
                  value={newBundle.original_price || ""}
                  onChange={(e) => setNewBundle({ ...newBundle, original_price: parseInt(e.target.value) || null })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">选择产品组合 *</label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {products?.map((product) => {
                  const isSelected = newBundle.items.some(item => item.flavor === product.name);
                  const item = newBundle.items.find(item => item.flavor === product.name);
                  return (
                    <div key={product.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleProductInBundle(product, false)}
                        className={`flex-1 flex items-center gap-2 p-2 rounded border text-left transition-colors ${
                          isSelected ? "bg-primary/10 border-primary" : "hover:bg-muted"
                        }`}
                      >
                        {isSelected ? <Check className="w-4 h-4 text-primary" /> : <div className="w-4 h-4" />}
                        <span className="text-sm truncate">{product.name}</span>
                      </button>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateProductQuantity(product.name, (item?.quantity || 1) - 1, false)}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center text-sm">{item?.quantity || 1}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateProductQuantity(product.name, (item?.quantity || 1) + 1, false)}
                          >
                            +
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {(!products || products.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-2">暂无产品</p>
                )}
              </div>
              {newBundle.items.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  已选: {newBundle.items.map(i => `${i.flavor}×${i.quantity}`).join(", ")}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">排序</label>
              <Input
                type="number"
                value={newBundle.sort_order}
                onChange={(e) => setNewBundle({ ...newBundle, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <Switch
                  checked={newBundle.is_active}
                  onCheckedChange={(v) => setNewBundle({ ...newBundle, is_active: v })}
                />
                <span className="text-sm">上架</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={newBundle.is_featured}
                  onCheckedChange={(v) => setNewBundle({ ...newBundle, is_featured: v })}
                />
                <span className="text-sm">首页优选</span>
              </label>
              <label className="flex items-center gap-2">
                <Switch
                  checked={newBundle.is_new}
                  onCheckedChange={(v) => setNewBundle({ ...newBundle, is_new: v })}
                />
                <span className="text-sm">新品</span>
              </label>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setBundleCreateOpen(false)}>取消</Button>
              <Button
                onClick={() => bundleCreateMutation.mutate(newBundle)}
                disabled={!newBundle.name || !newBundle.price || newBundle.items.length === 0 || bundleCreateMutation.isPending}
              >
                {bundleCreateMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                创建
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bundle Delete Confirm Dialog */}
      <Dialog open={bundleDeleteOpen} onOpenChange={setBundleDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除配套「{selectedBundle?.name}」吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setBundleDeleteOpen(false)}>取消</Button>
            <Button
              variant="destructive"
              onClick={() => selectedBundle && bundleDeleteMutation.mutate(selectedBundle.id)}
              disabled={bundleDeleteMutation.isPending}
            >
              {bundleDeleteMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t("admin.productsPage.editCategory") : t("admin.productsPage.addCategory")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.productsPage.categoryModalDesc")}
            </DialogDescription>
          </DialogHeader>
          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onSubmitCategory)} className="space-y-4 py-4">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productsPage.categoryName")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder={t("admin.productsPage.categoryNamePlaceholder")}
                        data-testid="input-category-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productsPage.categoryNameEn")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder={t("admin.productsPage.categoryNameEnPlaceholder")}
                        data-testid="input-category-name-en"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productsPage.categoryDescription")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder={t("admin.productsPage.categoryDescPlaceholder")}
                        data-testid="input-category-desc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={categoryForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productsPage.categoryColor")}</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        {["emerald", "amber", "rose", "blue"].map((color) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => field.onChange(color)}
                            className={`w-8 h-8 rounded-full border-2 ${
                              color === "emerald" ? "bg-emerald-500" :
                              color === "amber" ? "bg-amber-500" :
                              color === "rose" ? "bg-rose-500" : "bg-blue-500"
                            } ${field.value === color ? "border-foreground" : "border-transparent"}`}
                            data-testid={`color-${color}`}
                          />
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCategoryModal(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" data-testid="button-save-category">
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? t("admin.productsPage.editProduct") : t("admin.productsPage.addProduct")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.productsPage.productModalDesc")}
            </DialogDescription>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(onSubmitProduct)} className="space-y-4 py-4">
              <FormField
                control={productForm.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productsPage.productImage")}</FormLabel>
                    <FormControl>
                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        {field.value && field.value !== "/pics/product-placeholder.jpg" ? (
                          <img src={field.value} alt="" className="w-32 h-32 object-cover mx-auto rounded-lg mb-2" />
                        ) : (
                          <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          data-testid="button-upload-image"
                        >
                          {uploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 上传中...</>
                          ) : (
                            t("admin.productsPage.uploadImage")
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.productsPage.productNameZh")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder={t("admin.productsPage.productNameZhPlaceholder")}
                          data-testid="input-product-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="nameEn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.productsPage.productNameEn")}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder={t("admin.productsPage.productNameEnPlaceholder")}
                          data-testid="input-product-name-en"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productsPage.productDescription")}</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        placeholder={t("admin.productsPage.productDescPlaceholder")}
                        rows={3}
                        data-testid="input-product-desc"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.productsPage.category")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-product-category">
                            <SelectValue placeholder={t("admin.productsPage.selectCategory")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("admin.productsPage.price")} (RM)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          placeholder="0.00"
                          data-testid="input-product-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={productForm.control}
                name="priceUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("admin.productsPage.weight")}</FormLabel>
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="份 / 盒 / 罐"
                        data-testid="input-product-unit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={productForm.control}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t("admin.productsPage.isFeatured")}</FormLabel>
                      <FormDescription>{t("admin.productsPage.isFeaturedDesc")}</FormDescription>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-featured"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" data-testid="button-save-product">
                  {t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              {t("admin.productsPage.productDetails")}
            </DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 py-4">
              {editingProduct.image && (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img src={editingProduct.image} alt={editingProduct.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.productsPage.productNameZh")}</p>
                  <p className="font-medium">{editingProduct.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.productsPage.productNameEn")}</p>
                  <p className="font-medium">{editingProduct.nameEn || "-"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("admin.productsPage.productDescription")}</p>
                <p>{editingProduct.description || "-"}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.productsPage.category")}</p>
                  <Badge variant="outline">{getCategoryLabel(editingProduct.category)}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.productsPage.price")}</p>
                  <p className="font-bold text-primary">RM {editingProduct.price}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t("admin.productsPage.weight")}</p>
                  <p>{editingProduct.priceUnit || "-"}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Badge className="bg-green-500">
                  {t("admin.productsPage.available")}
                </Badge>
                {editingProduct.featured && (
                  <Badge className="bg-amber-500">
                    <Star className="w-3 h-3 mr-1" />
                    {t("admin.productsPage.featured")}
                  </Badge>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              {t("common.close")}
            </Button>
            <Button onClick={() => { setShowViewModal(false); handleEditProduct(editingProduct!); }}>
              <Edit className="w-4 h-4 mr-2" />
              {t("admin.productsPage.edit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              {t("admin.productsPage.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.productsPage.deleteConfirmDesc")} "{editingProduct?.name}"
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} data-testid="button-confirm-delete">
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
