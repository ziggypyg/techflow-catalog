import { Edit, Trash2, Package } from "lucide-react";
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

interface ProductRow {
  id: string; // Para la key de React
  sku_clave: string;
  nombre_producto: string;
  precio_definitivo_gs: number;
  // Campos calculados
  stock_real: number;
  costo_promedio_gs: number;
}

interface ProductsListProps {
  products: ProductRow[]; // Usamos la interfaz adaptada
  onEdit: (product: ProductRow) => void;
  onDelete: (id: string) => void;
}

const ProductsList = ({ products, onEdit, onDelete }: ProductsListProps) => {
  // Formatea precios a G$, sin decimales
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
            <TableHead className="text-right">STOCK REAL</TableHead>
            <TableHead className="text-right">Costo Promedio</TableHead>
            <TableHead className="text-right">Precio Venta</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              {/* 1. SKU y Nombre */}
              <TableCell className="font-mono text-xs">{product.sku_clave}</TableCell>
              <TableCell className="font-medium">{product.nombre_producto}</TableCell>
              
              {/* 2. Stock Real */}
              <TableCell className="text-right">
                <Badge
                  variant={product.stock_real > 5 ? "default" : (product.stock_real > 0 ? "secondary" : "destructive")}
                >
                  {product.stock_real}
                </Badge>
              </TableCell>
              
              {/* 3. Costo Promedio (G$) */}
              <TableCell className="text-right">
                {formatPrice(product.costo_promedio_gs)}
              </TableCell>
              
              {/* 4. Precio Venta (G$) */}
              <TableCell className="text-right font-semibold">
                {formatPrice(product.precio_definitivo_gs)}
              </TableCell>
              
              {/* Acciones */}
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
