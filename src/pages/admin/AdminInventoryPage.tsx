import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/AdminLayout";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
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
  Boxes, Search, Plus, AlertTriangle, Package,
  ArrowUpRight, ArrowDownRight, Edit, Trash2, MoreHorizontal, Loader2
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface InventoryCategory {
  id: string;
  name: string;
  name_en: string | null;
  color: string;
  permissions: string[];
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category_id: string | null;
  stock: number;
  min_stock: number;
  unit: string;
  status: string;
  created_at: string;
}

interface InventoryLedger {
  id: string;
  item_id: string;
  type: string;
  quantity: number;
  movement_type: string;
  note: string | null;
  operator: string | null;
  created_at: string;
  item?: InventoryItem;
}

export default function AdminInventoryPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockQty, setStockQty] = useState("");
  const [stockType, setStockType] = useState("");
  const [stockNote, setStockNote] = useState("");

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["inventory-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_categories")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching categories:", error);
        return [];
      }

      return (data || []) as InventoryCategory[];
    },
  });

  // Fetch inventory items
  const { data: inventoryItems = [], isLoading: loadingItems } = useQuery({
    queryKey: ["inventory-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_items")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching inventory:", error);
        return [];
      }

      return (data || []) as InventoryItem[];
    },
  });

  // Fetch recent ledger
  const { data: ledger = [], isLoading: loadingLedger } = useQuery({
    queryKey: ["inventory-ledger"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_ledger")
        .select("*, item:inventory_items(name)")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching ledger:", error);
        return [];
      }

      return (data || []).map((l: any) => ({
        ...l,
        item_name: l.item?.name || "未知",
      })) as (InventoryLedger & { item_name: string })[];
    },
  });

  // Stock movement mutation
  const stockMovement = useMutation({
    mutationFn: async ({ itemId, type, quantity, movementType, note }: {
      itemId: string;
      type: "in" | "out";
      quantity: number;
      movementType: string;
      note: string;
    }) => {
      // Insert ledger record
      const { error: ledgerError } = await supabase
        .from("inventory_ledger")
        .insert({
          item_id: itemId,
          type,
          quantity,
          movement_type: movementType,
          note,
          operator: "当前用户",
        });

      if (ledgerError) throw ledgerError;

      // Update item stock
      const item = inventoryItems.find(i => i.id === itemId);
      if (!item) throw new Error("Item not found");

      const newStock = type === "in" ? item.stock + quantity : Math.max(0, item.stock - quantity);

      const { error: updateError } = await supabase
        .from("inventory_items")
        .update({ stock: newStock })
        .eq("id", itemId);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-items"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-ledger"] });
      setShowStockInModal(false);
      setShowStockOutModal(false);
      setSelectedItem(null);
      setStockQty("");
      setStockType("");
      setStockNote("");
      toast({ title: "库存已更新" });
    },
    onError: (error) => {
      toast({ title: "操作失败", description: String(error), variant: "destructive" });
    },
  });

  const handleStockIn = () => {
    if (!selectedItem || !stockQty || !stockType) return;
    stockMovement.mutate({
      itemId: selectedItem.id,
      type: "in",
      quantity: parseInt(stockQty),
      movementType: stockType,
      note: stockNote,
    });
  };

  const handleStockOut = () => {
    if (!selectedItem || !stockQty || !stockType) return;
    stockMovement.mutate({
      itemId: selectedItem.id,
      type: "out",
      quantity: parseInt(stockQty),
      movementType: stockType,
      note: stockNote,
    });
  };

  const filteredInventory = inventoryItems.filter(item => {
    const matchesSearch = searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalSku: inventoryItems.length,
    lowStock: inventoryItems.filter(i => i.status === "low").length,
    critical: inventoryItems.filter(i => i.status === "critical" || i.status === "out_of_stock").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "normal": return <Badge className="bg-green-500">{t("admin.inventoryPage.statusNormal")}</Badge>;
      case "low": return <Badge className="bg-yellow-500">{t("admin.inventoryPage.statusLow")}</Badge>;
      case "critical": return <Badge className="bg-red-500">{t("admin.inventoryPage.statusCritical")}</Badge>;
      case "out_of_stock": return <Badge className="bg-red-700">缺货</Badge>;
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const isLoading = loadingItems || loadingLedger;

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
      <div className="space-y-6">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif" data-testid="text-inventory-title">{t("admin.inventoryPage.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.inventoryPage.subtitle")}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-add-stock">
                <Plus className="w-4 h-4" />
                {t("admin.inventoryPage.addStock")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => { setSelectedItem(null); setShowStockInModal(true); }} data-testid="menu-stock-in">
                <ArrowUpRight className="w-4 h-4 mr-2 text-green-500" />
                {t("admin.inventoryPage.stockIn")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSelectedItem(null); setShowStockOutModal(true); }} data-testid="menu-stock-out">
                <ArrowDownRight className="w-4 h-4 mr-2 text-red-500" />
                {t("admin.inventoryPage.stockOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant="outline"
              className={`cursor-pointer ${activeCategory === cat.id ? getCategoryColor(cat.color) : ""}`}
              onClick={() => setActiveCategory(cat.id)}
              data-testid={`category-${cat.id}`}
            >
              {cat.name}
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
            {filteredInventory.length === 0 ? (
              <div className="text-center py-12">
                <Boxes className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">暂无库存数据</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table className="min-w-[640px]">
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
                    const category = categories.find(c => c.id === item.category_id);
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
                        <TableCell className="text-center text-muted-foreground">{item.min_stock} {item.unit}</TableCell>
                        <TableCell>{getStatusBadge(item.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`button-actions-${item.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setSelectedItem(item); setShowStockInModal(true); }}>
                                <ArrowUpRight className="w-4 h-4 mr-2 text-green-500" />
                                {t("admin.inventoryPage.stockIn")}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setSelectedItem(item); setShowStockOutModal(true); }}>
                                <ArrowDownRight className="w-4 h-4 mr-2 text-red-500" />
                                {t("admin.inventoryPage.stockOut")}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            )}
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
            {ledger.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无库存变动记录</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
              <Table className="min-w-[600px]">
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
                  {ledger.map((record: any) => (
                    <TableRow key={record.id} data-testid={`ledger-row-${record.id}`}>
                      <TableCell>{formatDate(record.created_at)}</TableCell>
                      <TableCell>
                        <Badge className={record.type === "in" ? "bg-green-500" : "bg-red-500"}>
                          {record.type === "in" ? t("admin.inventoryPage.stockIn") : t("admin.inventoryPage.stockOut")}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{record.item_name}</TableCell>
                      <TableCell className={`text-center font-bold ${record.type === "in" ? "text-green-500" : "text-red-500"}`}>
                        {record.type === "in" ? "+" : "-"}{record.quantity}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{record.note || record.movement_type}</TableCell>
                      <TableCell>{record.operator || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Stock In Modal */}
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
              <Select value={selectedItem?.id || ""} onValueChange={(v) => setSelectedItem(inventoryItems.find(i => i.id === v) || null)}>
                <SelectTrigger data-testid="select-product-in">
                  <SelectValue placeholder={t("admin.inventoryPage.selectProductPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name} ({item.sku})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty-in">{t("admin.inventoryPage.quantity")}</Label>
              <Input id="qty-in" type="number" placeholder="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} data-testid="input-qty-in" />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.inventoryPage.stockInType")}</Label>
              <Select value={stockType} onValueChange={setStockType}>
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
              <Textarea id="note-in" placeholder={t("admin.inventoryPage.notePlaceholder")} value={stockNote} onChange={(e) => setStockNote(e.target.value)} data-testid="input-note-in" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockInModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleStockIn} className="bg-green-500 hover:bg-green-600" disabled={stockMovement.isPending} data-testid="button-confirm-in">
              <ArrowUpRight className="w-4 h-4 mr-2" />
              {t("admin.inventoryPage.confirmStockIn")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Out Modal */}
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
              <Select value={selectedItem?.id || ""} onValueChange={(v) => setSelectedItem(inventoryItems.find(i => i.id === v) || null)}>
                <SelectTrigger data-testid="select-product-out">
                  <SelectValue placeholder={t("admin.inventoryPage.selectProductPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name} ({item.sku}) - {t("admin.inventoryPage.currentStock")}: {item.stock}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty-out">{t("admin.inventoryPage.quantity")}</Label>
              <Input id="qty-out" type="number" placeholder="0" value={stockQty} onChange={(e) => setStockQty(e.target.value)} data-testid="input-qty-out" />
            </div>
            <div className="space-y-2">
              <Label>{t("admin.inventoryPage.stockOutType")}</Label>
              <Select value={stockType} onValueChange={setStockType}>
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
              <Textarea id="note-out" placeholder={t("admin.inventoryPage.notePlaceholder")} value={stockNote} onChange={(e) => setStockNote(e.target.value)} data-testid="input-note-out" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockOutModal(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleStockOut} className="bg-red-500 hover:bg-red-600" disabled={stockMovement.isPending} data-testid="button-confirm-out">
              <ArrowDownRight className="w-4 h-4 mr-2" />
              {t("admin.inventoryPage.confirmStockOut")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
