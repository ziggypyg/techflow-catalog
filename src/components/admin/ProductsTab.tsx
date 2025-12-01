import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calcularStockYCostoPromedio } from "@/lib/calculos"; 
import ProductsList from "./ProductsList"; // Componente para mostrar la tabla (asumido)

// --- Tipos de Datos ---
const initialFormData = {
    'sku_clave': '',
    'nombre_producto': '',
    'precio_definitivo_pyg': 0, // Ajustado a PYG
};

interface ProductRow {
    id: string; 
    sku_clave: string;
    nombre_producto: string;
    precio_definitivo_pyg: number;
    stock_real: number;
    costo_promedio_gs: number;
}

const ProductsTab = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productsData, setProductsData] = useState<ProductRow[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProductData = async () => {
        setLoading(true);
        try {
            // 1. Cargar datos base de la tabla 'productos'
            const { data: baseProducts, error: prodError } = await supabase
                .from('productos')
                .select('*');
            if (prodError) throw prodError;

            // 2. Cargar todas las 'compras' y 'ventas' para el cálculo
            const { data: allCompras, error: compError } = await supabase.from('compras').select('*');
            if (compError) throw compError;
            
            const { data: allVentas, error: ventaError } = await supabase.from('ventas').select('sku_vendido, cantidad_vendida');
            if (ventaError) throw ventaError;

            // 3. Aplicar el cálculo de Stock y Costo Promedio a cada producto
            const calculatedProducts: ProductRow[] = baseProducts.map((prod) => {
                const calculated = calcularStockYCostoPromedio(
                    allCompras as any[],
                    allVentas as any[],
                    prod.sku_clave
                );
                
                return {
                    id: prod.id,
                    sku_clave: prod.sku_clave,
                    nombre_producto: prod.nombre_producto,
                    precio_definitivo_pyg: prod.precio_definitivo_pyg,
                    stock_real: calculated.stock_real,
                    costo_promedio_gs: calculated.costo_promedio_gs,
                };
            });

            setProductsData(calculatedProducts);

        } catch (error: any) {
            toast.error("Error al cargar datos y realizar cálculos: " + error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchProductData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'precio_definitivo_pyg'
                ? parseFloat(value) || 0
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const dataToInsert = {
                sku_clave: formData.sku_clave,
                nombre_producto: formData.nombre_producto,
                precio_definitivo_pyg: formData.precio_definitivo_pyg,
            };

            const { error } = await supabase
                .from('productos')
                .upsert([dataToInsert], { onConflict: 'sku_clave' }); // Usamos UPSERT para actualizar si el SKU existe

            if (error) throw error;

            toast.success("Producto base registrado/actualizado. Calculando inventario...");
            setFormData(initialFormData);
            fetchProductData(); // Recargar datos para ver el nuevo producto
            
        } catch (error: any) {
            console.error("Error al registrar Producto:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Funciones de mantenimiento simples para la lista (asumidas)
    const handleEdit = (product: ProductRow) => toast.info(`Función de edición para ${product.sku_clave} no implementada.`);
    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('productos').delete().eq('id', id);
        if (error) {
            toast.error("Error al eliminar producto: " + error.message);
        } else {
            toast.success("Producto eliminado.");
            fetchProductData(); 
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>📦 Gestión de Inventario y Costos</CardTitle>
                <CardDescription>
                    Registra nuevos productos base y visualiza el stock y el costo promedio calculado.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {/* Formulario de registro de producto base */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 p-4 border rounded-lg bg-secondary/10">
                    <div className="space-y-2">
                        <Label htmlFor="sku_clave">SKU (Clave)</Label>
                        <Input id="sku_clave" name="sku_clave" value={formData.sku_clave} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="nombre_producto">Nombre del Producto</Label>
                        <Input id="nombre_producto" name="nombre_producto" value={formData.nombre_producto} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="precio_definitivo_pyg">Precio de Venta (PYG)</Label>
                        <Input id="precio_definitivo_pyg" name="precio_definitivo_pyg" type="number" step="1" value={formData.precio_definitivo_pyg} onChange={handleChange} min="0" required />
                    </div>
                    
                    <div className="space-y-2 flex items-end">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Guardando..." : "Registrar/Actualizar Producto"}
                        </Button>
                    </div>
                </form>

                {/* Lista de Inventario Actual */}
                <h3 className="text-xl font-semibold mb-4">Inventario Actual (Stock y Costo Calculado)</h3>
                {loading ? (
                    <div className="text-center py-12">Cargando y calculando datos...</div>
                ) : (
                    <ProductsList 
                        products={productsData} 
                        onEdit={handleEdit} 
                        onDelete={handleDelete} 
                    />
                )}
            </CardContent>
        </Card>
    );
};

export default ProductsTab;
