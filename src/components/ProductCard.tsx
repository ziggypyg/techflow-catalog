import { ShoppingCart, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string | null;
    category: string | null;
    brand: string | null;
    sale_price: number;
    stock_quantity: number;
    image_url: string | null;
    sku: string;
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-card">
      <div className="relative aspect-square overflow-hidden bg-muted/30">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-muted to-muted/50">
            <Package className="h-20 w-20 text-muted-foreground/40" />
          </div>
        )}
        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <Badge className="absolute top-3 right-3 bg-accent/90 backdrop-blur-sm">
            ¡Últimas unidades!
          </Badge>
        )}
        {product.category && (
          <Badge variant="secondary" className="absolute top-3 left-3 backdrop-blur-sm">
            {product.category}
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div>
          {product.brand && (
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {product.brand}
            </p>
          )}
          <h3 className="font-semibold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-2xl font-bold text-primary">
              {formatPrice(product.sale_price)}
            </p>
            <p className="text-xs text-muted-foreground">
              Stock: {product.stock_quantity} unidades
            </p>
          </div>
          <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            <ShoppingCart className="h-5 w-5" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground/70">SKU: {product.sku}</p>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
