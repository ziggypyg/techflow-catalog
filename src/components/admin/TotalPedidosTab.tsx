import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; 

const initialFormData = {
    'nro_de_pedido': '',
    'total_factura_usd': 0,
};

const TotalPedidosTab = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'total_factura_usd'
                ? parseFloat(value) || 0
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const dataToInsert = {
                nro_de_pedido: formData.nro_de_pedido,
                total_factura_usd: formData.total_factura_usd,
            };

            const { error } = await supabase
                .from('totales_pedidos') // <-- Nombre de la tabla
                .insert([dataToInsert]); 

            if (error) throw error;

            toast.success("Total de Pedido registrado exitosamente.");
            setFormData(initialFormData);
            
        } catch (error: any) {
            console.error("Error al registrar Total de Pedido:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Totales de Pedido</CardTitle>
                <CardDescription>
                    Registra el costo total de las facturas de tus pedidos (en USD).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="nro_de_pedido">Nro. de Pedido</Label>
                        <Input id="nro_de_pedido" name="nro_de_pedido" value={formData.nro_de_pedido} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="total_factura_usd">Total Factura (USD)</Label>
                        <Input id="total_factura_usd" name="total_factura_usd" type="number" step="0.01" value={formData.total_factura_usd} onChange={handleChange} min="0" required />
                    </div>
                    
                    <div className="md:col-span-3 pt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Registrando..." : "Registrar Total de Pedido"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default TotalPedidosTab;
