import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; 

// --- FUNCIONES DE UTILIDAD (Pueden ir en /lib/calculos.ts si ya lo creaste) ---
const generarIDVenta = (): string => {
    // Generación de ID de Venta único (ej: V-20251130-1234)
    const random = Math.floor(Math.random() * 9000) + 1000;
    return 'V-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + random;
}

// --- DATOS DE REFERENCIA (SIMULANDO LA HOJA 'PRODUCTOS') ---
// EN ENTORNO REAL: Estos datos deben ser cargados de la tabla 'productos' en Supabase
const PRODUCTOS_DATA = [
    // La columna 5 de tu hoja Productos es 'Precio Definitivo (G$)'
    { 'SKU (Clave)': 'P1', 'Precio Definitivo (G$)': 40000.00 },
    { 'SKU (Clave)': 'P2', 'Precio Definitivo (G$)': 40000.00 },
    { 'SKU (Clave)': 'P3', 'Precio Definitivo (G$)': 160000.00 },
    // AÑADE AQUÍ TODOS TUS DATOS DE PRODUCTOS
];

// --- Tipos de Datos Iniciales para el Formulario ---
const initialFormData = {
    'Fecha': new Date().toISOString().split('T')[0],
    'SKU Vendido': '',
    'Cantidad Vendida': 0,
    'Cliente': '',
    'Número de comprobante de transferencia': '',
    'Notas': '',
};


// --- LÓGICA DE CÁLCULO (Simplificada) ---

/**
 * Simula el BUSCARV: Busca el precio de venta en la lista de productos
 */
const buscarPrecioVenta = (sku: string): number => {
    const producto = PRODUCTOS_DATA.find(p => p['SKU (Clave)'] === sku);
    return producto ? producto['Precio Definitivo (G$)'] : 0;
};

/**
 * Calcula los campos derivados (ID y Precio) para el registro de venta.
 */
const calcularRegistroVenta = (venta: typeof initialFormData) => {
    const id_venta_clave = generarIDVenta();
    const precio_venta_pyg = buscarPrecioVenta(venta['SKU Vendido']);
    
    return {
        ...venta,
        id_venta_clave,
        precio_venta_pyg,
        // Ganancia ya no se calcula aquí
    };
};

const SalesTab = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['Cantidad Vendida'].includes(name)
                ? parseFloat(value) || 0
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 3. LLAMADA AL CÁLCULO:
            const calculatedSale = calcularRegistroVenta(formData);
            
            // 4. MAPEO Y GUARDADO EN SUPABASE
            const dataToInsert = {
                id_venta_clave: calculatedSale.id_venta_clave,
                fecha: calculatedSale.Fecha,
                sku_vendido: calculatedSale['SKU Vendido'],
                cantidad_vendida: calculatedSale['Cantidad Vendida'],
                cliente: calculatedSale.Cliente,
                numero_comprobante: calculatedSale['Número de comprobante de transferencia'],
                notas: calculatedSale.Notas,
                
                // --- CAMPO CALCULADO ---
                precio_venta_pyg: calculatedSale.precio_venta_pyg,
                // Ganancia eliminada
            };

            const { error } = await supabase
                .from('ventas') // Usamos la tabla 'ventas'
                .insert([dataToInsert]); 

            if (error) throw error;

            toast.success("Venta registrada y Precio de Venta calculado exitosamente.");
            setFormData(initialFormData); // Limpia el formulario
            
        } catch (error: any) {
            console.error("Error al registrar la venta:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="min-h-[60vh] flex flex-col">
            <CardHeader>
                <CardTitle>Gestión de Ventas</CardTitle>
                <CardDescription>
                    Registra una venta y calcula el precio de venta automáticamente.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Fila 1: Fecha, SKU, Cantidad */}
                    <div className="space-y-2">
                        <Label htmlFor="Fecha">Fecha de Venta</Label>
                        <Input id="Fecha" name="Fecha" type="date" value={formData.Fecha} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="SKU Vendido">SKU Vendido</Label>
                        <Input id="SKU Vendido" name="SKU Vendido" value={formData['SKU Vendido']} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="Cantidad Vendida">Cantidad Vendida</Label>
                        <Input id="Cantidad Vendida" name="Cantidad Vendida" type="number" step="1" value={formData['Cantidad Vendida']} onChange={handleChange} min="1" required />
                    </div>
                    
                    {/* Fila 2: Cliente, Comprobante */}
                    <div className="space-y-2">
                        <Label htmlFor="Cliente">Cliente</Label>
                        <Input id="Cliente" name="Cliente" value={formData.Cliente} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="Número de comprobante de transferencia">Nº Comprobante</Label>
                        <Input id="Número de comprobante de transferencia" name="Número de comprobante de transferencia" value={formData['Número de comprobante de transferencia']} onChange={handleChange} />
                    </div>

                    {/* Fila 3: Notas */}
                    <div className="space-y-2 md:col-span-3">
                        <Label htmlFor="Notas">Notas (Opcional)</Label>
                        <Textarea id="Notas" name="Notas" value={formData.Notas} onChange={handleChange} />
                    </div>
                    
                    {/* Botón de Guardado */}
                    <div className="md:col-span-3 pt-4">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Registrando Venta..." : "Registrar Venta"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default SalesTab;
