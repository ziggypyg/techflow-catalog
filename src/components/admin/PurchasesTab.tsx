import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { calcularRegistrosDeCompras } from "@/lib/calculos"; // USANDO EL CÁLCULO CORREGIDO

// Tipos de Datos Iniciales para el Formulario
const initialFormData = {
    'Nro. de Pedido': '',
    'SKU (ID Producto)': '',
    'Fecha de Compra': new Date().toISOString().split('T')[0],
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
    const [loading, setLoading] = useState(true);
    
    // ESTADOS PARA DATOS DINÁMICOS DE REFERENCIA
    const [totalesPedidosData, setTotalesPedidosData] = useState([]); 
    const [logisticaPyData, setLogisticaPyData] = useState([]); 

    // FUNCIÓN DE CARGA DE DATOS DE REFERENCIA
    const fetchReferenceData = async () => {
        setLoading(true);
        try {
            // Cargar Totales de Pedido
            const { data: totalesData, error: totalesError } = await supabase
                .from('totales_pedidos')
                .select('nro_de_pedido, total_factura_usd');
            if (totalesError) throw totalesError;
            
            // Cargar Logística PY (Necesitamos el Factor de Distribución)
            const { data: logisticaData, error: logisticaError } = await supabase
                .from('logistica_py')
                .select('nro_de_tracking_py, factor_distribucion_gs_kg'); // OJO: Usamos el campo calculado

            if (logisticaError) throw logisticaError;

            // Mapear los datos al formato que espera la función de cálculo
            const mappedTotales = totalesData.map(item => ({
                'Nro. de Pedido': item.nro_de_pedido,
                'Total Factura (USD)': item.total_factura_usd,
            }));

            const mappedLogistica = logisticaData.map(item => ({
                'Nº de Tracking PY': item.nro_de_tracking_py,
                'Factor de Distribución (G$/KG)': item.factor_distribucion_gs_kg, // Mapeo del campo calculado
            }));

            setTotalesPedidosData(mappedTotales);
            setLogisticaPyData(mappedLogistica);

        } catch (error: any) {
            toast.error("Error al cargar datos de referencia (Totales/Logística): " + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchReferenceData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['Cantidad adquirida', 'Unidades por paquete', 'Costo Unitario (USD)', 'TC Fijo (Usado)', 'Peso (KG)'].includes(name)
                ? parseFloat(value) || 0 
                : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        if (loading) {
            toast.warning("Datos de referencia aún cargando.");
            setIsSubmitting(false);
            return;
        }

        try {
            // 3. LLAMADA AL CÁLCULO:
            const [calculatedNewPurchase] = calcularRegistrosDeCompras(
                [formData], 
                totalesPedidosData, 
                logisticaPyData
            );
            
            // 4. MAPEO Y GUARDADO EN SUPABASE (Asegúrate de que los nombres de las columnas coincidan)
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
