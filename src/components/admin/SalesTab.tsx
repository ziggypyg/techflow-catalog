import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calcularPrecioDeVenta } from "@/lib/calculos";

const initialFormData = {
    'sku_vendido': '',
    'fecha': new Date().toISOString().slice(0, 10), 
    'cantidad_vendida': 0,
    'cliente': '',
    'numero_comprobante_transferencia': '',
    'notas': '',
};

interface ProductData {
    sku_clave: string;
    nombre_producto: string;
    precio_definitivo_pyg: number;
    costo_promedio_gs: number;
}

const SalesTab = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<ProductData[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // --- Carga de Productos y Costos Promedio ---
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                // Seleccionamos SKU, Nombre, Precio de Venta (ENTRADA) y Costo Promedio (CALCULADO)
                const { data, error } = await supabase
                    .from('productos')
                    .select('sku_clave, nombre_producto, precio_definitivo_pyg, costo_promedio_gs'); 
                
                if (error) throw error;
                setProducts(data as ProductData[]);
            } catch (error) {
                toast.error("Error al cargar la lista de productos.");
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

        // 1. Obtener datos calculados (ID Venta y Precio de Venta por BUSCARV)
        const calculated = calcularPrecioDeVenta(formData.sku_vendido, products);
        
        const precioVentaPyG = calculated.precio_de_venta_pyg;
        const costoPromedioGs = selectedProduct.costo_promedio_gs || 0;
        
        // Calcular Ganancia
        const gananciaGs = (precioVentaPyG - costoPromedioGs) * formData.cantidad_vendida;

        try {
            const dataToInsert = {
                id_venta: calculated.id_venta_clave,
                fecha: formData.fecha,
                sku_vendido: formData.sku_vendido,
                cantidad_vendida: formData.cantidad_vendida,
                cliente: formData.cliente,
                numero_comprobante_transferencia: formData.numero_comprobante_transferencia,
                notas: formData.notas,
                // Datos calculados
                precio_venta_pyg: precioVentaPyG,
                ganancia_gs: parseFloat(gananciaGs.toFixed(0)), 
            };

            const { error } = await supabase
                .from('ventas')
                .insert([dataToInsert]);

            if (error) throw error;

            toast.success(`Venta ${calculated.id_venta_clave} registrada. Ganancia: G$ ${gananciaGs.toLocaleString('es-PY')}`);
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
                <CardTitle>💰 Registro de Ventas</CardTitle>
                <CardDescription>
                    Registra una venta. El Precio de Venta se carga automáticamente del inventario.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loadingProducts ? (
                    <div className="flex justify-center items-center h-20"><p className="animate-pulse">Cargando productos...</p></div>
                ) : (
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Fila 1 */}
                        <div className="space-y-2">
                            <Label htmlFor="sku_vendido">Producto (SKU)</Label>
                            <Select onValueChange={handleSelectChange} value={formData.sku_vendido} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona el Producto" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(product => (
                                        <SelectItem key={product.sku_clave} value={product.sku_clave}>
                                            {`${product.nombre_producto} (G$ ${product.precio_definitivo_pyg?.toLocaleString('es-PY') || '0'})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="cantidad_vendida">Cantidad Vendida</Label>
                            <Input id="cantidad_vendida" name="cantidad_vendida" type="number" step="1" value={formData.cantidad_vendida} onChange={handleChange} min="1" required />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="fecha">Fecha</Label>
                            <Input id="fecha" name="fecha" type="date" value={formData.fecha} onChange={handleChange} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="cliente">Cliente</Label>
                            <Input id="cliente" name="cliente" value={formData.cliente} onChange={handleChange} />
                        </div>
                        
                        {/* Fila 2 */}
                        <div className="space-y-2">
                            <Label htmlFor="numero_comprobante_transferencia">Nº de Comprobante</Label>
                            <Input id="numero_comprobante_transferencia" name="numero_comprobante_transferencia" value={formData.numero_comprobante_transferencia} onChange={handleChange} />
                        </div>
                        
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="notas">Notas (Opcional)</Label>
                            <Input id="notas" name="notas" value={formData.notas} onChange={handleChange} />
                        </div>
                        
                        <div className="flex items-end pt-2">
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
