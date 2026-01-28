import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { AdminLayout } from "@/components/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Boxes, Search, Plus, AlertTriangle, CheckCircle,
  ArrowUpRight, ArrowDownRight, Package,
  Edit, Trash2, FolderPlus, MoreHorizontal, Settings
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/lib/i18n";

const stockInSchema = z.object({
  productId: z.string().min(1, "请选择产品"),
  quantity: z.coerce.number().min(1, "数量必须大于0"),
  type: z.string().min(1, "请选择入库类型"),
  note: z.string().optional(),
});

const stockOutSchema = z.object({
  productId: z.string().min(1, "请选择产品"),
  quantity: z.coerce.number().min(1, "数量必须大于0"),
  type: z.string().min(1, "请选择出库类型"),
  note: z.string().optional(),
});

const editItemSchema = z.object({
  name: z.string().min(1, "请输入名称"),
  sku: z.string().min(1, "请输入SKU"),
  category: z.string().min(1, "请选择分类"),
  quantity: z.coerce.number().min(0, "库存不能为负"),
  minStock: z.coerce.number().min(0, "最低库存不能为负"),
  unit: z.string().min(1, "请输入单位"),
});

const categorySchema = z.object({
  name: z.string().min(1, "请输入分类名称"),
  nameEn: z.string().optional(),
  color: z.string().default("blue"),
  permissions: z.array(z.string()).default([]),
});

type StockInFormValues = z.infer<typeof stockInSchema>;
type StockOutFormValues = z.infer<typeof stockOutSchema>;
type EditItemFormValues = z.infer<typeof editItemSchema>;
type CategoryFormValues = z.infer<typeof categorySchema>;

const mockCategories = [
  { id: "raw", name: "原料库", nameEn: "Raw Materials", permissions: ["production"], color: "blue" },
  { id: "finished", name: "成品库", nameEn: "Finished Goods", permissions: ["sales", "orders"], color: "green" },
  { id: "packaging", name: "包装材料", nameEn: "Packaging", permissions: ["production"], color: "purple" },
  { id: "gift", name: "礼品库", nameEn: "Gift Items", permissions: ["sales", "marketing"], color: "amber" },
];

const mockInventory = [
  { id: "1", name: "原味红枣燕窝", sku: "BN-001", stock: 150, minStock: 50, status: "normal", category: "finished", unit: "罐" },
  { id: "2", name: "可可燕麦燕窝", sku: "BN-002", stock: 80, minStock: 50, status: "normal", category: "finished", unit: "罐" },
  { id: "3", name: "抹茶燕麦燕窝", sku: "BN-003", stock: 25, minStock: 50, status: "low", category: "finished", unit: "罐" },
  { id: "4", name: "鲜炖花胶", sku: "FM-001", stock: 200, minStock: 80, status: "normal", category: "finished", unit: "罐" },
  { id: "5", name: "燕窝礼盒套装", sku: "GS-001", stock: 10, minStock: 20, status: "critical", category: "gift", unit: "盒" },
  { id: "6", name: "燕窝原料", sku: "RAW-001", stock: 5000, minStock: 2000, status: "normal", category: "raw", unit: "克" },
  { id: "7", name: "红枣", sku: "RAW-002", stock: 3000, minStock: 1000, status: "normal", category: "raw", unit: "克" },
  { id: "8", name: "玻璃瓶 120ml", sku: "PKG-001", stock: 500, minStock: 200, status: "normal", category: "packaging", unit: "个" },
];

const mockLedger = [
  { id: "1", date: "2026-01-25", type: "in", product: "原味红枣燕窝", qty: 100, note: "生产入库", operator: "张经理" },
  { id: "2", date: "2026-01-24", type: "out", product: "可可燕麦燕窝", qty: 30, note: "销售出库", operator: "李主管" },
  { id: "3", date: "2026-01-23", type: "in", product: "鲜炖花胶", qty: 50, note: "采购入库", operator: "王助理" },
];

const permissionOptions = [
  { id: "production", label: "生产线", labelEn: "Production" },
  { id: "sales", label: "销售", labelEn: "Sales" },
  { id: "orders", label: "订单", labelEn: "Orders" },
  { id: "marketing", label: "市场", labelEn: "Marketing" },
  { id: "finance", label: "财务", labelEn: "Finance" },
];

export default function AdminInventoryPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [editingCategory, setEditingCategory] = useState<typeof mockCategories[0] | null>(null);
  const [editingItem, setEditingItem] = useState<typeof mockInventory[0] | null>(null);
  const [categories, setCategories] = useState(mockCategories);
  const [inventoryItems, setInventoryItems] = useState(mockInventory);
  const [ledger, setLedger] = useState(mockLedger);

  const stockInForm = useForm<StockInFormValues>({
    resolver: zodResolver(stockInSchema),
    defaultValues: { productId: "", quantity: 0, type: "", note: "" },
  });

  const stockOutForm = useForm<StockOutFormValues>({
    resolver: zodResolver(stockOutSchema),
    defaultValues: { productId: "", quantity: 0, type: "", note: "" },
  });

  const editItemForm = useForm<EditItemFormValues>({
    resolver: zodResolver(editItemSchema),
    defaultValues: { name: "", sku: "", category: "", quantity: 0, minStock: 0, unit: "" },
  });

  const categoryForm = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", nameEn: "", color: "blue", permissions: [] },
  });

  const filteredInventory = inventoryItems.filter(item => {
    const matchesSearch = searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalSku: inventoryItems.length,
    lowStock: inventoryItems.filter(i => i.status === "low").length,
    critical: inventoryItems.filter(i => i.status === "critical").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal": return <Badge className="bg-green-500">{t("admin.inventoryPage.statusNormal")}</Badge>;
      case "low": return <Badge className="bg-yellow-500">{t("admin.inventoryPage.statusLow")}</Badge>;
      case "critical": return <Badge className="bg-red-500">{t("admin.inventoryPage.statusCritical")}</Badge>;
      default: return <Badge variant="outline">{t("admin.inventoryPage.statusUnknown")}</Badge>;
    }
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      blue: "bg-blue-500/10 text-blue-600 border-blue-200",
      green: "bg-green-500/10 text-green-600 border-green-200",
      purple: "bg-purple-500/10 text-purple-600 border-purple-200",
      amber: "bg-amber-500/10 text-amber-600 border-amber-200",
    };
    return colors[color] || colors.blue;
  };

  const handleEditCategory = (category: typeof mockCategories[0]) => {
    setEditingCategory(category);
    categoryForm.reset({
      name: category.name,
      nameEn: category.nameEn,
      color: category.color,
      permissions: category.permissions,
    });
    setShowCategoryModal(true);
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    categoryForm.reset({ name: "", nameEn: "", color: "blue", permissions: [] });
    setShowCategoryModal(true);
  };

  const handleEditItem = (item: typeof mockInventory[0]) => {
    setEditingItem(item);
    editItemForm.reset({
      name: item.name,
      sku: item.sku,
      category: item.category,
      quantity: item.stock,
      minStock: item.minStock,
      unit: item.unit,
    });
    setShowEditItemModal(true);
  };

  const handleDeleteItem = (item: typeof mockInventory[0]) => {
    setEditingItem(item);
    setShowDeleteConfirm(true);
  };

  const handleOpenStockIn = () => {
    stockInForm.reset({ productId: "", quantity: 0, type: "", note: "" });
    setShowStockInModal(true);
  };

  const handleOpenStockOut = () => {
    stockOutForm.reset({ productId: "", quantity: 0, type: "", note: "" });
    setShowStockOutModal(true);
  };

  const onSubmitStockIn = (data: StockInFormValues) => {
    const item = inventoryItems.find(i => i.id === data.productId);
    if (item) {
      setInventoryItems(prev => prev.map(i => 
        i.id === data.productId 
          ? { ...i, stock: i.stock + data.quantity } 
          : i
      ));
      setLedger(prev => [{
        id: String(Date.now()),
        date: new Date().toISOString().split('T')[0],
        type: "in",
        product: item.name,
        qty: data.quantity,
        note: data.note || data.type,
        operator: "当前用户",
      }, ...prev]);
    }
    setShowStockInModal(false);
    stockInForm.reset();
  };

  const onSubmitStockOut = (data: StockOutFormValues) => {
    const item = inventoryItems.find(i => i.id === data.productId);
    if (item) {
      setInventoryItems(prev => prev.map(i => 
        i.id === data.productId 
          ? { ...i, stock: Math.max(0, i.stock - data.quantity) } 
          : i
      ));
      setLedger(prev => [{
        id: String(Date.now()),
        date: new Date().toISOString().split('T')[0],
        type: "out",
        product: item.name,
        qty: data.quantity,
        note: data.note || data.type,
        operator: "当前用户",
      }, ...prev]);
    }
    setShowStockOutModal(false);
    stockOutForm.reset();
  };

  const onSubmitEditItem = (data: EditItemFormValues) => {
    if (editingItem) {
      setInventoryItems(prev => prev.map(i => 
        i.id === editingItem.id
          ? { ...i, name: data.name, sku: data.sku, category: data.category, stock: data.quantity, minStock: data.minStock, unit: data.unit }
          : i
      ));
    }
    setShowEditItemModal(false);
    editItemForm.reset();
  };

  const onSubmitCategory = (data: CategoryFormValues) => {
    if (editingCategory) {
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id
          ? { ...c, name: data.name, nameEn: data.nameEn || "", color: data.color, permissions: data.permissions }
          : c
      ));
    } else {
      const newId = data.name.toLowerCase().replace(/\s+/g, '-');
      setCategories(prev => [...prev, { id: newId, name: data.name, nameEn: data.nameEn || "", color: data.color, permissions: data.permissions }]);
    }
    setShowCategoryModal(false);
    categoryForm.reset();
  };

  const handleConfirmDelete = () => {
    if (editingItem) {
      setInventoryItems(prev => prev.filter(i => i.id !== editingItem.id));
    }
    setShowDeleteConfirm(false);
    setEditingItem(null);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif" data-testid="text-inventory-title">{t("admin.inventoryPage.title")}</h1>
            <p className="text-muted-foreground">{t("admin.inventoryPage.subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleNewCategory} data-testid="button-manage-categories">
              <FolderPlus className="w-4 h-4" />
              {t("admin.inventoryPage.manageCategories")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-add-stock">
                  <Plus className="w-4 h-4" />
                  {t("admin.inventoryPage.addStock")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleOpenStockIn} data-testid="menu-stock-in">
                  <ArrowUpRight className="w-4 h-4 mr-2 text-green-500" />
                  {t("admin.inventoryPage.stockIn")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenStockOut} data-testid="menu-stock-out">
                  <ArrowDownRight className="w-4 h-4 mr-2 text-red-500" />
                  {t("admin.inventoryPage.stockOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Boxes className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSku}</p>
                <p className="text-sm text-muted-foreground">{t("admin.inventoryPage.productSku")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-500">{stats.lowStock}</p>
                <p className="text-sm text-muted-foreground">{t("admin.inventoryPage.lowStock")}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
                <p className="text-sm text-muted-foreground">{t("admin.inventoryPage.criticalStock")}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground mr-2">{t("admin.inventoryPage.categories")}:</span>
          <Badge 
            variant={activeCategory === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveCategory("all")}
            data-testid="category-all"
          >
            {t("admin.inventoryPage.allCategories")}
          </Badge>
          {mockCategories.map((cat) => (
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
                {t("admin.inventoryPage.inventoryStatus")}
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t("admin.inventoryPage.searchPlaceholder")}
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.inventoryPage.itemName")}</TableHead>
                  <TableHead>{t("admin.inventoryPage.sku")}</TableHead>
                  <TableHead>{t("admin.inventoryPage.category")}</TableHead>
                  <TableHead className="text-center">{t("admin.inventoryPage.currentStock")}</TableHead>
                  <TableHead className="text-center">{t("admin.inventoryPage.minStock")}</TableHead>
                  <TableHead>{t("admin.inventoryPage.status")}</TableHead>
                  <TableHead className="text-right">{t("admin.inventoryPage.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => {
                  const category = mockCategories.find(c => c.id === item.category);
                  return (
                    <TableRow key={item.id} data-testid={`inventory-row-${item.id}`}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                      <TableCell>
                        {category && (
                          <Badge variant="outline" className={getCategoryColor(category.color)}>
                            {category.name}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold">{item.stock} {item.unit}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{item.minStock} {item.unit}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${item.id}`}>
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditItem(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              {t("admin.inventoryPage.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingItem(item); setShowStockInModal(true); }}>
                              <ArrowUpRight className="w-4 h-4 mr-2 text-green-500" />
                              {t("admin.inventoryPage.stockIn")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { setEditingItem(item); setShowStockOutModal(true); }}>
                              <ArrowDownRight className="w-4 h-4 mr-2 text-red-500" />
                              {t("admin.inventoryPage.stockOut")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteItem(item)} className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              {t("admin.inventoryPage.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-primary" />
              {t("admin.inventoryPage.recentChanges")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.inventoryPage.date")}</TableHead>
                  <TableHead>{t("admin.inventoryPage.type")}</TableHead>
                  <TableHead>{t("admin.inventoryPage.product")}</TableHead>
                  <TableHead className="text-center">{t("admin.inventoryPage.quantity")}</TableHead>
                  <TableHead>{t("admin.inventoryPage.note")}</TableHead>
                  <TableHead>{t("admin.inventoryPage.operator")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((record) => (
                  <TableRow key={record.id} data-testid={`ledger-row-${record.id}`}>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Badge className={record.type === "in" ? "bg-green-500" : "bg-red-500"}>
                        {record.type === "in" ? t("admin.inventoryPage.stockIn") : t("admin.inventoryPage.stockOut")}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{record.product}</TableCell>
                    <TableCell className={`text-center font-bold ${record.type === "in" ? "text-green-500" : "text-red-500"}`}>
                      {record.type === "in" ? "+" : "-"}{record.qty}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{record.note}</TableCell>
                    <TableCell>{record.operator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? t("admin.inventoryPage.editCategory") : t("admin.inventoryPage.addCategory")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.inventoryPage.categoryModalDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">{t("admin.inventoryPage.categoryName")}</Label>
              <Input 
                id="cat-name" 
                defaultValue={editingCategory?.name || ""} 
                placeholder={t("admin.inventoryPage.categoryNamePlaceholder")}
                data-testid="input-category-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-name-en">{t("admin.inventoryPage.categoryNameEn")}</Label>
              <Input 
                id="cat-name-en" 
                defaultValue={editingCategory?.nameEn || ""} 
                placeholder={t("admin.inventoryPage.categoryNameEnPlaceholder")}
                data-testid="input-category-name-en"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.inventoryPage.categoryColor")}</Label>
              <div className="flex gap-2">
                {["blue", "green", "purple", "amber"].map((color) => (
                  <button
                    key={color}
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === "blue" ? "bg-blue-500" :
                      color === "green" ? "bg-green-500" :
                      color === "purple" ? "bg-purple-500" : "bg-amber-500"
                    } ${editingCategory?.color === color ? "border-foreground" : "border-transparent"}`}
                    data-testid={`color-${color}`}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                {t("admin.inventoryPage.permissions")}
              </Label>
              <p className="text-sm text-muted-foreground">{t("admin.inventoryPage.permissionsDesc")}</p>
              <div className="space-y-2">
                {permissionOptions.map((perm) => (
                  <div key={perm.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{perm.label}</p>
                      <p className="text-sm text-muted-foreground">{perm.labelEn}</p>
                    </div>
                    <Switch 
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={() => togglePermission(perm.id)}
                      data-testid={`switch-perm-${perm.id}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setShowCategoryModal(false)} data-testid="button-save-category">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStockInModal} onOpenChange={setShowStockInModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-green-500" />
              {t("admin.inventoryPage.stockIn")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.inventoryPage.stockInDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.inventoryPage.selectProduct")}</Label>
              <Select defaultValue={editingItem?.id}>
                <SelectTrigger data-testid="select-product-in">
                  <SelectValue placeholder={t("admin.inventoryPage.selectProductPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {mockInventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name} ({item.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty-in">{t("admin.inventoryPage.quantity")}</Label>
              <Input id="qty-in" type="number" placeholder="0" data-testid="input-qty-in" />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.inventoryPage.stockInType")}</Label>
              <Select>
                <SelectTrigger data-testid="select-in-type">
                  <SelectValue placeholder={t("admin.inventoryPage.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">{t("admin.inventoryPage.typeProduction")}</SelectItem>
                  <SelectItem value="purchase">{t("admin.inventoryPage.typePurchase")}</SelectItem>
                  <SelectItem value="return">{t("admin.inventoryPage.typeReturn")}</SelectItem>
                  <SelectItem value="adjust">{t("admin.inventoryPage.typeAdjust")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-in">{t("admin.inventoryPage.note")}</Label>
              <Textarea id="note-in" placeholder={t("admin.inventoryPage.notePlaceholder")} data-testid="input-note-in" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockInModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setShowStockInModal(false)} className="bg-green-500 hover:bg-green-600" data-testid="button-confirm-in">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              {t("admin.inventoryPage.confirmStockIn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStockOutModal} onOpenChange={setShowStockOutModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownRight className="w-5 h-5 text-red-500" />
              {t("admin.inventoryPage.stockOut")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.inventoryPage.stockOutDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("admin.inventoryPage.selectProduct")}</Label>
              <Select defaultValue={editingItem?.id}>
                <SelectTrigger data-testid="select-product-out">
                  <SelectValue placeholder={t("admin.inventoryPage.selectProductPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {mockInventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name} ({item.sku}) - {t("admin.inventoryPage.currentStock")}: {item.stock}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty-out">{t("admin.inventoryPage.quantity")}</Label>
              <Input id="qty-out" type="number" placeholder="0" data-testid="input-qty-out" />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.inventoryPage.stockOutType")}</Label>
              <Select>
                <SelectTrigger data-testid="select-out-type">
                  <SelectValue placeholder={t("admin.inventoryPage.selectType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">{t("admin.inventoryPage.typeSales")}</SelectItem>
                  <SelectItem value="production">{t("admin.inventoryPage.typeProductionUse")}</SelectItem>
                  <SelectItem value="damage">{t("admin.inventoryPage.typeDamage")}</SelectItem>
                  <SelectItem value="adjust">{t("admin.inventoryPage.typeAdjust")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="note-out">{t("admin.inventoryPage.note")}</Label>
              <Textarea id="note-out" placeholder={t("admin.inventoryPage.notePlaceholder")} data-testid="input-note-out" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockOutModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setShowStockOutModal(false)} className="bg-red-500 hover:bg-red-600" data-testid="button-confirm-out">
              <ArrowDownRight className="w-4 h-4 mr-2" />
              {t("admin.inventoryPage.confirmStockOut")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditItemModal} onOpenChange={setShowEditItemModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("admin.inventoryPage.editItem")}</DialogTitle>
            <DialogDescription>
              {t("admin.inventoryPage.editItemDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">{t("admin.inventoryPage.itemName")}</Label>
              <Input id="item-name" defaultValue={editingItem?.name || ""} data-testid="input-item-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-sku">{t("admin.inventoryPage.sku")}</Label>
              <Input id="item-sku" defaultValue={editingItem?.sku || ""} data-testid="input-item-sku" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("admin.inventoryPage.category")}</Label>
                <Select defaultValue={editingItem?.category}>
                  <SelectTrigger data-testid="select-item-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {mockCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-unit">{t("admin.inventoryPage.unit")}</Label>
                <Input id="item-unit" defaultValue={editingItem?.unit || ""} data-testid="input-item-unit" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-stock">{t("admin.inventoryPage.currentStock")}</Label>
                <Input id="item-stock" type="number" defaultValue={editingItem?.stock || 0} data-testid="input-item-stock" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-min">{t("admin.inventoryPage.minStock")}</Label>
                <Input id="item-min" type="number" defaultValue={editingItem?.minStock || 0} data-testid="input-item-min" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditItemModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => setShowEditItemModal(false)} data-testid="button-save-item">
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              {t("admin.inventoryPage.deleteConfirmTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.inventoryPage.deleteConfirmDesc")} "{editingItem?.name}"
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
