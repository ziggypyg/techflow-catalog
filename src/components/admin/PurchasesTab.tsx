import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calcularRegistrosDeCompras } from "@/lib/calculos";

const initialFormData = {
    'Nro. de Pedido': '',
    'SKU (ID Producto)': '',
    'Fecha de Compra': new Date().toISOString().slice(0, 10),
    'Proveedor': '',
    'Cantidad adquirida': 0,
    'Unidades por paquete': 1,
    'Costo Unitario (USD)': 0,
    'TC Fijo (Usado)': 0,
    'Tracking USA': '',
    'Tracking PY': '',
    'Peso (KG)': 0,
};

// TIPOS SIMPLIFICADOS para la carga de datos
interface TotalPedido { nro_de_pedido: string; total_factura_usd: number; }
interface LogisticaPy { nro_de_tracking_py: string; factor_distribucion_gs_kg: number; }

const PurchasesTab = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [referenceData, setReferenceData] = useState<{ pedidos: TotalPedido[], logistica: LogisticaPy[], products: any[] }>({
        pedidos: [], logistica: [], products: []
    });
    const [loadingRefData, setLoadingRefData] = useState(true);

    // --- Carga de Datos de Referencia (Total Pedidos, Logística, Productos) ---
    useEffect(() => {
        const fetchReferenceData = async () => {
            setLoadingRefData(true);
            try {
                const { data: pedidos } = await supabase.from('totales_pedidos').select('nro_de_pedido, total_factura_usd');
                const { data: logistica } = await supabase.from('logistica_py').select('nro_de_tracking_py, factor_distribucion_gs_kg');
                const { data: products } = await supabase.from('productos').select('sku_clave, nombre_producto');

                setReferenceData({ 
                    pedidos: pedidos || [], 
                    logistica: logistica || [], 
                    products: products || [] 
                });
            } catch (error) {
                toast.error("Error al cargar datos de referencia.");
            } finally {
                setLoadingRefData(false);
            }
        };
        fetchReferenceData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericFields = ['Cantidad adquirida', 'Unidades por paquete', 'Costo Unitario (USD)', 'TC Fijo (Usado)', 'Peso (KG)'];

        setFormData(prev => ({
            ...prev,
            [name]: numericFields.includes(name)
                ? parseFloat(value) || 0
                : value,
        }));
    };
    
    const handleSelectChange = (value: string, name: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Cargar TODAS las compras existentes para el cálculo de Costo Extra Distribuido
            const { data: allCompras } = await supabase.from('compras').select('*');
            
            // 2. Ejecutar el Cálculo (requiere todos los datos, incluyendo la compra actual, para el SUMAPRODUCTO)
            const inputData = { 
                ...formData, 
                // Simulamos que ya tiene el Costo Total Lote (USD) para el SUMAPRODUCTO
                'Costo Total Lote (USD)': formData['Costo Unitario (USD)'] * formData['Cantidad adquirida'] 
            };
            
            // Simular la inclusión de la compra actual en allCompras para el cálculo
            const tempAllCompras = [...(allCompras || []), inputData];

            const calculated = calcularRegistrosDeCompras(
                formData as any, 
                referenceData.pedidos, 
                referenceData.logistica,
                tempAllCompras as any[] // Pasamos el array temporal
            );

            // 3. Preparar e insertar datos
            const dataToInsert = {
                'id_compra_clave': calculated.id_compra_clave,
                ...formData,
                // Columnas calculadas
                'unidades_totales': calculated.unidades_totales,
                'costo_total_lote_usd': calculated.costo_total_lote_usd,
                'costo_total_lote_pyg': calculated.costo_total_lote_pyg,
                'costo_extra_distribuido_usd': calculated.costo_extra_distribuido_usd,
                'costo_retiro_distribuido_pyg': calculated.costo_retiro_distribuido_pyg,
            };

            const { error: insertError } = await supabase
                .from('compras')
                .insert([dataToInsert]); 

            if (insertError) throw insertError;

            toast.success(`Compra registrada. SKU: ${formData['SKU (ID Producto)']}`);
            setFormData(initialFormData);
            
        } catch (error: any) {
            console.error("Error al registrar Compra:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loadingRefData) {
        return <Card><CardContent className="py-8 text-center">Cargando datos de referencia...</CardContent></Card>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>🚚 Registro de Compras</CardTitle>
                <CardDescription>
                    Ingresa los detalles de la compra. Los costos de distribución se calculan automáticamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Fila 1 */}
                    <div className="space-y-2">
                        <Label htmlFor="Nro. de Pedido">Nro. de Pedido</Label>
                        <Select onValueChange={(val) => handleSelectChange(val, 'Nro. de Pedido')} value={formData['Nro. de Pedido']} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona Nro. Pedido (Factura total)" />
                            </SelectTrigger>
                            <SelectContent>
                                {referenceData.pedidos.map(p => (
                                    <SelectItem key={p.nro_de_pedido} value={p.nro_de_pedido}>
                                        {`${p.nro_de_pedido} (Factura USD ${p.total_factura_usd})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="SKU (ID Producto)">SKU (ID Producto)</Label>
                         <Select onValueChange={(val) => handleSelectChange(val, 'SKU (ID Producto)')} value={formData['SKU (ID Producto)']} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona SKU" />
                            </SelectTrigger>
                            <SelectContent>
                                {referenceData.products.map(p => (
                                    <SelectItem key={p.sku_clave} value={p.sku_clave}>
                                        {`${p.sku_clave} - ${p.nombre_producto}`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="Fecha de Compra">Fecha de Compra</Label>
                        <Input id="Fecha de Compra" name="Fecha de Compra" type="date" value={formData['Fecha de Compra']} onChange={handleChange} required />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="Proveedor">Proveedor</Label>
                        <Input id="Proveedor" name="Proveedor" value={formData['Proveedor']} onChange={handleChange} required />
                    </div>
                    
                    {/* Fila 2 */}
                    <div className="space-y-2">
                        <Label htmlFor="Cantidad adquirida">Cantidad adquirida</Label>
                        <Input id="Cantidad adquirida" name="Cantidad adquirida" type="number" step="1" value={formData['Cantidad adquirida']} onChange={handleChange} min="0" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="Unidades por paquete">Unidades por paquete</Label>
                        <Input id="Unidades por paquete" name="Unidades por paquete" type="number" step="1" value={formData['Unidades por paquete']} onChange={handleChange} min="1" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="Costo Unitario (USD)">Costo Unitario (USD)</Label>
                        <Input id="Costo Unitario (USD)" name="Costo Unitario (USD)" type="number" step="0.0001" value={formData['Costo Unitario (USD)']} onChange={handleChange} min="0" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="TC Fijo (Usado)">TC Fijo (Usado)</Label>
                        <Input id="TC Fijo (Usado)" name="TC Fijo (Usado)" type="number" step="1" value={formData['TC Fijo (Usado)']} onChange={handleChange} min="1" required />
                    </div>
                    
                    {/* Fila 3 */}
                    <div className="space-y-2">
                        <Label htmlFor="Tracking USA">Tracking USA</Label>
                        <Input id="Tracking USA" name="Tracking USA" value={formData['Tracking USA']} onChange={handleChange} />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="Tracking PY">Tracking PY</Label>
                        <Select onValueChange={(val) => handleSelectChange(val, 'Tracking PY')} value={formData['Tracking PY']} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona Tracking PY (Logística)" />
                            </SelectTrigger>
                            <SelectContent>
                                {referenceData.logistica.map(l => (
                                    <SelectItem key={l.nro_de_tracking_py} value={l.nro_de_tracking_py}>
                                        {`${l.nro_de_tracking_py} (Factor G$ ${l.factor_distribucion_gs_kg?.toFixed(2)})`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="Peso (KG)">Peso (KG)</Label>
                        <Input id="Peso (KG)" name="Peso (KG)" type="number" step="0.001" value={formData['Peso (KG)']} onChange={handleChange} min="0" required />
                    </div>
                    
                    <div className="flex items-end pt-2">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Calculando Costos..." : "Registrar Compra"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default PurchasesTab;
