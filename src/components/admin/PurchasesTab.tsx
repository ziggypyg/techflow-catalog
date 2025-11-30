import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // Cliente de Supabase

// 1. Importa la función de cálculo
import { calcularRegistrosDeCompras } from "@/lib/calculos"; 

// --- 2. DATOS DE REFERENCIA (SIMULANDO LAS OTRAS HOJAS: ¡DEBES RELLENAR ESTO!) ---
// En una aplicación real, estos datos deben ser cargados dinámicamente de Supabase o una API.
// POR AHORA, ÚSALOS COMO DATOS DE PRUEBA:
const TOTALES_PEDIDOS_DATA = [
    { 'Nro. de Pedido': '8202528917484740', 'Total Factura (USD)': 5.07 },
    { 'Nro. de Pedido': '8202528917454740', 'Total Factura (USD)': 8.23 },
    // AÑADE AQUÍ TODOS TUS DATOS DE TOTALES_PEDIDOS
];

const LOGISTICA_PY_DATA = [
    { 'Nº de Tracking PY': 'FX1010001555484', 'Costo Total Retiro (G$)': 615000.00 },
    { 'Nº de Tracking PY': 'FX1010001569827', 'Costo Total Retiro (G$)': 950000.00 },
    // AÑADE AQUÍ TODOS TUS DATOS DE LOGÍSTICA_PY
];

// --- Tipos de Datos Iniciales para el Formulario ---
const initialFormData = {
    'Nro. de Pedido': '',
    'SKU (ID Producto)': '',
    'Fecha de Compra': new Date().toISOString().split('T')[0], // Fecha actual
    'Proveedor': '',
    'Cantidad adquirida': 0,
    'Unidades por paquete': 0,
    'Costo Unitario (USD)': 0,
    'TC Fijo (Usado)': 0,
    'Tracking USA': '',
    'Tracking PY': '',
    'Peso (KG)': 0,
};

const PurchasesTab = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // NOTA: Se necesita cargar todas las compras existentes para el cálculo de Costo Extra Distribuido.
    // Esto es un placeholder. Debes implementar la carga de tu tabla 'compras'.
    const [allExistingPurchases, setAllExistingPurchases] = useState([]); 

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['Cantidad adquirida', 'Unidades por paquete', 'Costo Unitario (USD)', 'TC Fijo (Usado)', 'Peso (KG)', 'TC Fijo (Usado)'].includes(name)
                ? parseFloat(value) || 0 // Convertir a número para campos numéricos
                : value, // Mantener como texto para otros
        }));
    };

    // --- FUNCIÓN DE GUARDADO CON LÓGICA DE CÁLCULO ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 3. LLAMADA AL CÁLCULO:
            
            // Llama a la función de cálculo con la nueva compra (en un arreglo) y los datos de referencia
            const [calculatedNewPurchase] = calcularRegistrosDeCompras(
                [formData], 
                TOTALES_PEDIDOS_DATA, 
                LOGISTICA_PY_DATA
            );
            
            // 4. MAPEO Y GUARDADO EN SUPABASE
            
            // Mapea los campos del objeto calculado a tu esquema de Supabase.
            // **¡Asegúrate que los nombres de las columnas coincidan con tu DB!**
            const dataToInsert = {
                id_compra_clave: calculatedNewPurchase['ID Compra (Clave)'],
                nro_de_pedido: calculatedNewPurchase['Nro. de Pedido'],
                sku_id_producto: calculatedNewPurchase['SKU (ID Producto)'],
                fecha_de_compra: calculatedNewPurchase['Fecha de Compra'],
                proveedor: calculatedNewPurchase['Proveedor'],
                cantidad_adquirida: calculatedNewPurchase['Cantidad adquirida'],
                unidades_por_paquete: calculatedNewPurchase['Unidades por paquete'],
                costo_unitario_usd: calculatedNewPurchase['Costo Unitario (USD)'],
                tc_fijo_usado: calculatedNewPurchase['TC Fijo (Usado)'],
                tracking_usa: calculatedNewPurchase['Tracking USA'],
                tracking_py: calculatedNewPurchase['Tracking PY'],
                peso_kg: calculatedNewPurchase['Peso (KG)'],
                
                // --- CAMPOS CALCULADOS ---
                unidades_totales: calculatedNewPurchase['Un. totales'],
                costo_total_lote_usd: calculatedNewPurchase['Costo Total Lote (USD)'],
                costo_total_lote_pyg: calculatedNewPurchase['Costo Total Lote (PYG)'],
                costo_extra_distribuido_usd: calculatedNewPurchase['Costo Extra Distribuido (USD)'],
                costo_retiro_distribuido_pyg: calculatedNewPurchase['Costo Retiro Distribuido (PYG)'],
            };

            const { error } = await supabase
                .from('compras') // <-- ¡Verifica el nombre de tu tabla!
                .insert([dataToInsert]); 

            if (error) throw error;

            toast.success("Compra registrada y cálculos aplicados exitosamente.");
            setFormData(initialFormData); // Limpia el formulario
            
        } catch (error: any) {
            console.error("Error al registrar la compra:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Opcional: useEffect para cargar los datos existentes si es necesario para cálculos futuros.
    // useEffect(() => { /* Lógica para cargar allExistingPurchases de Supabase */ }, []); 

    return (
        <Card className="min-h-[60vh] flex flex-col">
            <CardHeader>
                <CardTitle>Gestión de Compras</CardTitle>
                <CardDescription>
                    Registra una nueva compra y calcula automáticamente costos, unidades e impuestos.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {/* Formulario de Registro */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Fila 1: Pedido, SKU, Proveedor, Fecha */}
                    <div className="space-y-2">
                        <Label htmlFor="Nro. de Pedido">Nro. de Pedido</Label>
                        <Input id="Nro. de Pedido" name="Nro. de Pedido" value={formData['Nro. de Pedido']} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="SKU">SKU (ID Producto)</Label>
                        <Input id="SKU" name="SKU (ID Producto)" value={formData['SKU (ID Producto)']} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="Proveedor">Proveedor</Label>
                        <Input id="Proveedor" name="Proveedor" value={formData['Proveedor']} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="Fecha de Compra">Fecha de Compra</Label>
                        <Input id="Fecha de Compra" name="Fecha de Compra" type="date" value={formData['Fecha de Compra']} onChange={handleChange} required />
                    </div>
                    
                    {/* Fila 2: Cantidades y Costos */}
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
                        <Input id="Costo Unitario (USD)" name="Costo Unitario (USD)" type="number" step="0.01" value={formData['Costo Unitario (USD)']} onChange={handleChange} min="0" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="TC Fijo (Usado)">TC Fijo (Usado)</Label>
                        <Input id="TC Fijo (Usado)" name="TC Fijo (Usado)" type="number" step="0.01" value={formData['TC Fijo (Usado)']} onChange={handleChange} min="0" required />
                    </div>

                    {/* Fila 3: Tracking y Peso */}
                    <div className="space-y-2">
                        <Label htmlFor="Tracking PY">Tracking PY</Label>
                        <Input id="Tracking PY" name="Tracking PY" value={formData['Tracking PY']} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="Peso (KG)">Peso (KG)</Label>
                        <Input id="Peso (KG)" name="Peso (KG)" type="number" step="0.001" value={formData['Peso (KG)']} onChange={handleChange} min="0" required />
                    </div>
                    
                    {/* Botón de Guardado */}
                    <div className="md:col-span-3 pt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Registrando Compra..." : "Registrar Compra y Calcular"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default PurchasesTab;
