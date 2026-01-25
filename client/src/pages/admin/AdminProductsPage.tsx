import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminLayout } from "@/components/AdminLayout";
import {
  Package, Search, Plus, Edit, Eye, Trash2,
  Image as ImageIcon, Loader2
} from "lucide-react";
import type { Product } from "@shared/schema";

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = products?.filter(p => 
    searchQuery === "" || 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nameEn?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case "bird-nest": return "燕窝";
      case "fish-maw": return "花胶";
      case "gift-set": return "礼盒";
      default: return cat;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif text-primary" data-testid="text-products-title">产品管理</h1>
            <p className="text-muted-foreground">管理产品目录与定价</p>
          </div>
          <Button className="gap-2 bg-secondary text-secondary-foreground" data-testid="button-add-product">
            <Plus className="w-4 h-4" />
            新增产品
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                产品列表 ({products?.length || 0})
              </CardTitle>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="搜索产品名称..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search"
                />
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
                <p className="text-muted-foreground">暂无产品</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden" data-testid={`product-${product.id}`}>
                    <div className="aspect-video bg-muted flex items-center justify-center">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.nameEn}</p>
                        </div>
                        <Badge variant="outline">{categoryLabel(product.category)}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">RM {product.price}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" data-testid={`button-edit-${product.id}`}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" data-testid={`button-delete-${product.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
