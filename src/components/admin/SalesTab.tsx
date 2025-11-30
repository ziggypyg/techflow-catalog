import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

const SalesTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Registro de Ventas</CardTitle>
        <CardDescription>
          Gestiona todas tus ventas y métodos de pago
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
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

export default SalesTab;
