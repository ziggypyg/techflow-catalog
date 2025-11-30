import { Edit, Trash2, Eye, EyeOff, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ProductsListProps {
  products: any[];
  onEdit: (product: any) => void;
  onDelete: (id: string) => void;
}

const ProductsList = ({ products, onEdit, onDelete }: ProductsListProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-PY", {
      style: "currency",
      currency: "PYG",
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">
          No hay productos registrados
        </h3>
        <p className="text-sm text-muted-foreground">
          Comienza agregando tu primer producto
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Precio</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="font-mono text-xs">{product.sku}</TableCell>
              <TableCell className="font-medium">{product.name}</TableCell>
              <TableCell>
                {product.category ? (
                  <Badge variant="secondary">{product.category}</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                )}
              </TableCell>
              <TableCell>{formatPrice(product.sale_price)}</TableCell>
              <TableCell>
                <Badge
                  variant={product.stock_quantity > 5 ? "default" : "destructive"}
                >
                  {product.stock_quantity}
                </Badge>
              </TableCell>
              <TableCell>
                {product.is_visible ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">Visible</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <EyeOff className="h-4 w-4" />
                    <span className="text-xs">Oculto</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(product)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          "¿Estás seguro de eliminar este producto?"
                        )
                      ) {
                        onDelete(product.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsList;
