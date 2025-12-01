import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calcularLogisticaRetiro } from "@/lib/calculos"; 

const initialFormData = {
    'nro_de_tracking_py': '',
    'fecha_retiro': new Date().toISOString().slice(0, 10), 
    'costo_total_retiro_pyg': 0,
};

const LogisticaPyTab = () => {
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'costo_total_retiro_pyg'
                ? parseFloat(value) || 0
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Cargar TODAS las compras para el SUMAR.SI del Peso
            const { data: allCompras, error: compError } = await supabase.from('compras').select('Tracking PY, Peso (KG)');
            if (compError) throw compError;
            
            // 2. Ejecutar el cálculo del Factor de Distribución
            const calculated = calcularLogisticaRetiro(
                {
                    nro_de_tracking_py: formData.nro_de_tracking_py,
                    costo_total_retiro_pyg: formData.costo_total_retiro_pyg,
                }, 
                allCompras as any[] 
            );

            // 3. Preparar e insertar datos
            const dataToInsert = {
                id_retiro_clave: calculated.id_retiro_clave,
                nro_de_tracking_py: formData.nro_de_tracking_py,
                fecha_retiro: formData.fecha_retiro,
                costo_total_retiro_pyg: formData.costo_total_retiro_pyg,
                suma_peso_kg: calculated.suma_peso_kg,
                factor_distribucion_gs_kg: calculated.factor_distribucion_gs_kg,
            };

            const { error: insertError } = await supabase
                .from('logistica_py')
                .upsert([dataToInsert], { onConflict: 'nro_de_tracking_py' }); // Usamos UPSERT

            if (insertError) throw insertError;

            toast.success(`Logística registrada. Factor de Distribución (G$/KG): ${calculated.factor_distribucion_gs_kg.toFixed(2)}`);
            setFormData(initialFormData);
            
        } catch (error: any) {
            console.error("Error al registrar Logística:", error);
            toast.error("Error al guardar: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>🚛 Logística (PY)</CardTitle>
                <CardDescription>
                    Ingresa el costo total del retiro local. El Factor de Distribución se calcula automáticamente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="nro_de_tracking_py">Nº de Tracking PY</Label>
                        <Input id="nro_de_tracking_py" name="nro_de_tracking_py" value={formData.nro_de_tracking_py} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fecha_retiro">Fecha Retiro</Label>
                        <Input id="fecha_retiro" name="fecha_retiro" type="date" value={formData.fecha_retiro} onChange={handleChange} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="costo_total_retiro_pyg">Costo Total Retiro (PYG)</Label>
                        <Input id="costo_total_retiro_pyg" name="costo_total_retiro_pyg" type="number" step="1" value={formData.costo_total_retiro_pyg} onChange={handleChange} min="0" required />
                    </div>
                    
                    <div className="flex items-end pt-2">
                        <Button type="submit" disabled={isSubmitting} className="w-full">
                            {isSubmitting ? "Calculando y Guardando..." : "Registrar Logística"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default LogisticaPyTab;
