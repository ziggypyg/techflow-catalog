import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Genera un ID de Venta (V-AAAAMMDD-RAND)
const generarIDVenta = (): string => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    return 'V-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + random;
}

const initialFormData = {
    'sku_vendido': '',
    'fecha_hora': new Date().toISOString().slice(0, 16), // Formato YYYY-MM-DDTHH:MM
    'cantidad_vendida': 0,
    'cliente': '',
};

const SalesTab = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // --- Carga de Productos para el Select ---
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                // Seleccionamos SKU, Nombre y Precio de Venta
                const { data, error } = await supabase
                    .from('productos')
                    .select('sku_clave, nombre_producto, precio_definitivo_gs, costo_promedio_gs'); 
                
                if (error) throw error;
                setProducts(data);
            } catch (error) {
                toast.error("Error al cargar la lista de productos.");
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'cantidad_vendida'
                ? parseInt(value) || 0
                : value,
        }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, sku_vendido: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const selectedProduct = products.find(p => p.sku_clave === formData.sku_vendido);
        if (!selectedProduct) {
            toast.error("Producto no válido seleccionado.");
            setIsSubmitting(false);
            return;
        }

        const idVenta = generarIDVenta();
        const precioVentaGs = selectedProduct.precio_definitivo_gs || 0;
        const costoPromedioGs = selectedProduct.costo_promedio_gs || 0;
        const gananciaGs = (precioVentaGs - costoPromedioGs) * formData.cantidad_vendida;

        try {
            const dataToInsert = {
                id_venta: idVenta,
                fecha_hora: formData.fecha_hora,
                sku_vendido: formData.sku_vendido,
                cantidad_vendida: formData.cantidad_vendida,
                cliente: formData.cliente,
                // Datos calculados (o referenciados)
                precio_venta_gs: precioVentaGs,
                ganancia_gs: parseFloat(gananciaGs.toFixed(0)), // Redondeo a G$ sin decimales
            };

            const { error } = await supabase
                .from('ventas')
                .insert([dataToInsert]);

            if (error) throw error;

            toast.success(`Venta ${idVenta} registrada. Ganancia calculada: G$ ${gananciaGs.toLocaleString('es-PY')}`);
            setFormData(initialFormData);
            
        } catch (error: any) {
            console.error("Error al registrar Venta:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Ventas</CardTitle>
                <CardDescription>
                    Registra una venta. El Precio de Venta se carga automáticamente del inventario.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loadingProducts ? (
                    <div className="flex justify-center items-center h-20">
                         <p className="animate-pulse">Cargando productos...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="sku_vendido">Producto (SKU)</Label>
                            <Select onValueChange={handleSelectChange} value={formData.sku_vendido} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el Producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(product => (
                                        <SelectItem key={product.sku_clave} value={product.sku_clave}>
                                            {`${product.nombre_producto} (G$ ${product.precio_definitivo_gs?.toLocaleString('es-PY') || '0'})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground mt-1">
                                Precio Venta: G$ {products.find(p => p.sku_clave === formData.sku_vendido)?.precio_definitivo_gs?.toLocaleString('es-PY') || '0'}
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="cantidad_vendida">Cantidad Vendida</Label>
                            <Input id="cantidad_vendida" name="cantidad_vendida" type="number" step="1" value={formData.cantidad_vendida} onChange={handleChange} min="1" required />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="fecha_hora">Fecha y Hora</Label>
                            <Input id="fecha_hora" name="fecha_hora" type="datetime-local" value={formData.fecha_hora} onChange={handleChange} required />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="cliente">Cliente</Label>
                            <Input id="cliente" name="cliente" value={formData.cliente} onChange={handleChange} />
                        </div>
                        
                        <div className="md:col-span-3 pt-4">
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? "Registrando Venta..." : "Registrar Venta"}
                            </Button>
                        </div>
                    </form>
                )}
            </CardContent>
        </Card>
    );
};

export default SalesTab;
