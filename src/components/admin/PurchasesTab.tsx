import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

const PurchasesTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gestión de Compras</CardTitle>
        <CardDescription>
          Registra tus compras desde China/USA con tracking y costos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            Próximamente disponible
          </h3>
          <p className="text-sm text-muted-foreground">
            Esta funcionalidad estará lista en la próxima iteración
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PurchasesTab;
