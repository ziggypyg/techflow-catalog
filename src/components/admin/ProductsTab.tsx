import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; 
import { calcularStockYCostoPromedio } from "@/lib/calculos"; // Importamos la función de cálculo
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Asume que tienes este componente UI

const initialNewProductData = {
    'sku_clave': '',
    'nombre_producto': '',
    'precio_definitivo_gs': 0,
};

const ProductsTab = () => {
    const [newProductData, setNewProductData] = useState(initialNewProductData);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado para guardar TODAS las compras y ventas (necesario para calcular Stock y Costo)
    const [allCompras, setAllCompras] = useState([]);
    const [allVentas, setAllVentas] = useState([]);

    // --- FUNCIÓN PARA CARGAR TODOS LOS DATOS (PRODUCTOS, COMPRAS, VENTAS) ---
    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Cargar Productos existentes
            const { data: productsData, error: productsError } = await supabase.from('productos').select('*');
            if (productsError) throw productsError;
            
            // 2. Cargar Compras (para Costo Promedio y Stock)
            const { data: comprasData, error: comprasError } = await supabase.from('compras').select('*');
            if (comprasError) throw comprasError;

            // 3. Cargar Ventas (para Stock)
            const { data: ventasData, error: ventasError } = await supabase.from('ventas').select('*');
            if (ventasError) throw ventasError;

            setAllCompras(comprasData);
            setAllVentas(ventasData);

            // 4. Calcular y actualizar los datos de la tabla (Costo Promedio y Stock)
            const updatedProducts = productsData.map(product => {
                const calculated = calcularStockYCostoPromedio(
                    comprasData,
                    ventasData,
                    product.sku_clave
                );
                
                // Retorna el producto con los campos calculados actualizados
                return {
                    ...product,
                    stock_real: calculated.stock_real,
                    costo_promedio_gs: calculated.costo_promedio_gs,
                };
            });

            setProducts(updatedProducts);

        } catch (error: any) {
            console.error("Error cargando datos:", error.message);
            toast.error("Error al cargar datos del inventario: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllData();
    }, []); 

    // --- FUNCIÓN PARA AÑADIR NUEVO PRODUCTO ---
    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Simular el cálculo para el producto nuevo (Stock será 0, Costo Promedio será 0)
            const calculatedInitialData = calcularStockYCostoPromedio(
                allCompras, // Usamos los datos existentes
                allVentas, // Usamos los datos existentes
                newProductData.sku_clave
            );

            // Objeto a insertar en la DB
            const dataToInsert = {
                sku_clave: newProductData.sku_clave,
                nombre_producto: newProductData.nombre_producto,
                precio_definitivo_gs: newProductData.precio_definitivo_gs,
                // Insertamos los valores iniciales (0) calculados
                stock_real: calculatedInitialData.stock_real,
                costo_promedio_gs: calculatedInitialData.costo_promedio_gs,
            };

            const { error } = await supabase
                .from('productos') 
                .insert([dataToInsert]); 

            if (error) throw error;

            toast.success(`Producto ${newProductData.nombre_producto} añadido y cálculos inicializados.`);
            setNewProductData(initialNewProductData); // Limpia el formulario
            fetchAllData(); // Recarga los datos para actualizar la tabla

        } catch (error: any) {
            console.error("Error al añadir producto:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... (Manejo de cambios y JSX para el formulario)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewProductData(prev => ({
            ...prev,
            [name]: ['precio_definitivo_gs'].includes(name)
                ? parseFloat(value) || 0
                : value,
        }));
    };


    if (loading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Añadir Nuevo Producto</CardTitle>
                    <CardDescription>
                        Define el SKU y el precio de venta para un nuevo producto.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="sku_clave">SKU (Clave)</Label>
                            <Input id="sku_clave" name="sku_clave" value={newProductData.sku_clave} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nombre_producto">Nombre del Producto</Label>
                            <Input id="nombre_producto" name="nombre_producto" value={newProductData.nombre_producto} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="precio_definitivo_gs">Precio Definitivo (G$)</Label>
                            <Input id="precio_definitivo_gs" name="precio_definitivo_gs" type="number" step="0.01" value={newProductData.precio_definitivo_gs} onChange={handleChange} required />
                        </div>
                        <div className="md:col-span-3 pt-4">
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? "Añadiendo..." : "Añadir Producto"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Inventario y Costos</CardTitle>
                    <CardDescription>
                        Vista de inventario, stock real y costo promedio calculado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>SKU</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead className="text-right">STOCK REAL</TableHead>
                                <TableHead className="text-right">Costo Promedio (G$)</TableHead>
                                <TableHead className="text-right">Precio Venta (G$)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product: any) => (
                                <TableRow key={product.sku_clave}>
                                    <TableCell className="font-medium">{product.sku_clave}</TableCell>
                                    <TableCell>{product.nombre_producto}</TableCell>
                                    <TableCell className={`text-right font-bold ${product.stock_real <= 0 ? 'text-red-500' : 'text-green-500'}`}>
                                        {product.stock_real}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ₲ {product.costo_promedio_gs.toLocaleString('es-PY')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        ₲ {product.precio_definitivo_gs.toLocaleString('es-PY')}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProductsTab;
