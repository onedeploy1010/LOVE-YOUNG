import React from 'react';
import { ShoppingBag, ChevronRight, Check } from 'lucide-react';
import { Product } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PRODUCT_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden border-border/50 bg-white luxury-shadow flex flex-col">
        <CardHeader className="p-0 relative group overflow-hidden">
          <div className="aspect-[4/5] overflow-hidden bg-muted">
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          </div>
          <Badge className="absolute top-4 left-4 bg-primary text-white border-none px-3 py-1">
            {PRODUCT_CONFIG.CATEGORIES.find(c => c.id === product.category)?.label || '精选'}
          </Badge>
          {product.stock <= 5 && (
            <Badge variant="destructive" className="absolute top-4 right-4">
              仅剩 {product.stock} 件
            </Badge>
          )}
        </CardHeader>

        <CardContent className="flex-1 p-6">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground line-clamp-1">{product.name}</h3>
            <div className="text-right">
              <span className="text-xl font-serif font-bold text-primary">
                {PRODUCT_CONFIG.CURRENCY}{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/50">
                  {PRODUCT_CONFIG.CURRENCY}{product.originalPrice.toLocaleString()}
                </p>
              )}
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
            {product.description}
          </p>

          <ul className="space-y-2 mb-4">
            {product.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="text-xs text-foreground/70 flex items-center gap-2">
                <Check className="w-3 h-3 text-secondary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex gap-2">
          <Button
            variant="outline"
            className="flex-1 border-primary/20 hover:border-primary hover:bg-primary/5 text-primary"
          >
            查看详情
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-white gap-2"
            onClick={() => onAddToCart?.(product)}
          >
            <ShoppingBag className="w-4 h-4" />
            加入清单
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
