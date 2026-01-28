import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { Product } from "@shared/types";

interface ProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
}

export function ProductCard({ product, onViewDetails }: ProductCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className="group overflow-visible transition-all duration-300 hover:-translate-y-1"
      data-testid={`card-product-${product.id}`}
    >
      <div className="aspect-[4/3] overflow-hidden rounded-t-md">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-5 md:p-6">
        <h3
          className="text-lg md:text-xl font-semibold text-foreground mb-2 line-clamp-1"
          data-testid={`text-product-name-${product.id}`}
        >
          {product.name}
        </h3>
        <p
          className="text-sm md:text-base text-muted-foreground mb-4 line-clamp-2 min-h-[2.5rem] md:min-h-[3rem]"
          data-testid={`text-product-description-${product.id}`}
        >
          {product.description}
        </p>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span
            className="text-lg font-semibold text-foreground"
            data-testid={`text-product-price-${product.id}`}
          >
            ¥{product.price}
            <span className="text-sm font-normal text-muted-foreground">
              /{product.priceUnit}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => onViewDetails?.(product)}
            data-testid={`button-view-product-${product.id}`}
          >
            <Eye className="w-4 h-4" />
            {t("common.viewDetails")}
          </Button>
        </div>
      </div>
    </Card>
  );
}
