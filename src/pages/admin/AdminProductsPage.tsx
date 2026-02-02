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
  Tag, DollarSign, Box, Star
} from "lucide-react";
import type { Product } from "@shared/types";

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
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif" data-testid="text-products-title">{t("admin.productsPage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.productsPage.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleNewCategory} data-testid="button-manage-categories">
              <FolderPlus className="w-4 h-4" />
              {t("admin.productsPage.manageCategories")}
            </Button>
            <Button className="gap-2 bg-secondary text-secondary-foreground" onClick={handleNewProduct} data-testid="button-add-product">
              <Plus className="w-4 h-4" />
              {t("admin.productsPage.addProduct")}
            </Button>
          </div>
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
      </div>

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
