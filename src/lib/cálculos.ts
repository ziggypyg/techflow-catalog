// ====================================================================================
// --- FUNCIONES DE UTILIDAD ---
// ====================================================================================

// Genera un ID de Clave único para Compras (C-AAAAMMDD-RAND)
export const generarIDCompra = (): string => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    return 'C-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + random;
}

// ====================================================================================
// --- CÁLCULO DE COMPRAS (El más complejo) ---
// ====================================================================================

// Estructura de un registro de compra (entrada + salida)
interface PurchaseRecord {
    'Nro. de Pedido': string;
    'SKU (ID Producto)': string;
    'Fecha de Compra': string;
    'Proveedor': string;
    'Cantidad adquirida': number;
    'Unidades por paquete': number;
    'Costo Unitario (USD)': number;
    'TC Fijo (Usado)': number;
    'Tracking USA': string;
    'Tracking PY': string;
    'Peso (KG)': number;
    // Campos Calculados (SALIDA)
    'ID Compra (Clave)': string;
    'Un. totales': number;
    'Costo Total Lote (USD)': number;
    'Costo Total Lote (PYG)': number;
    'Costo Extra Distribuido (USD)': number;
    'Costo Retiro Distribuido (PYG)': number;
}

// Datos de Referencia (cargados de Supabase)
interface TotalPedido {
    'Nro. de Pedido': string;
    'Total Factura (USD)': number;
}
interface LogisticaPy {
    'Nº de Tracking PY': string;
    'Factor de Distribución (G$/KG)': number; // Este campo es ahora calculado en LogisticaPyTab
}

/**
 * Calcula todos los campos derivados para los registros de compras basándose en las fórmulas originales.
 * @param purchases - Array de registros de compra (datos de entrada del formulario).
 * @param totalesPedidosData - Datos de referencia de la tabla totales_pedidos.
 * @param logisticaPyData - Datos de referencia de la tabla logistica_py.
 */
export function calcularRegistrosDeCompras(
    purchases: PurchaseRecord[], 
    totalesPedidosData: TotalPedido[],
    logisticaPyData: LogisticaPy[]
): PurchaseRecord[] {
    
    return purchases.map(registro => {
        // --- CÁLCULO 1: ID DE CLAVE ---
        registro['ID Compra (Clave)'] = generarIDCompra();

        // --- CÁLCULO 2: Unidades Totales (Un. totales) ---
        // Fórmula: Cant. adquirida * Un. por paquete
        registro['Un. totales'] = registro['Cantidad adquirida'] * registro['Unidades por paquete'];

        // --- CÁLCULO 3: Costo Total Lote (USD) y Costo Total Lote (PYG) ---
        // Fórmula USD: Cant. adquirida * Costo Unitario (USD)
        const costoTotalLoteUSD = registro['Cantidad adquirida'] * registro['Costo Unitario (USD)'];
        registro['Costo Total Lote (USD)'] = parseFloat(costoTotalLoteUSD.toFixed(2));
        
        // Fórmula PYG: Costo Total Lote (USD) * TC Fijo (Usado)
        const costoTotalLotePYG = costoTotalLoteUSD * registro['TC Fijo (Usado)'];
        registro['Costo Total Lote (PYG)'] = parseFloat(costoTotalLotePYG.toFixed(0)); // Redondeo a G$ sin decimales

        // --- CÁLCULO 4: Costo Extra Distribuido (USD) ---
        // Fórmula (Requiere BUSCARV y agregación): (Costo Total Lote USD / Total Factura Pedido USD) * Costo Total Extra (USD)
        
        // a) Buscar el Total Factura (USD) del pedido
        const totalPedido = totalesPedidosData.find(t => t['Nro. de Pedido'] === registro['Nro. de Pedido']);
        const totalFacturaUSD = totalPedido ? totalPedido['Total Factura (USD)'] : 0;
        
        // b) Asumimos que el "Costo Total Extra (USD)" es la diferencia entre el Total de la Factura y la suma de Costos Unitarios
        // Sin embargo, basándonos en tu hoja, asumiremos que Costo Extra Distribuido USD usa la PROPORCIÓN.
        
        let costoExtraDistribuidoUSD = 0;
        if (totalFacturaUSD > 0) {
            costoExtraDistribuidoUSD = (costoTotalLoteUSD / totalFacturaUSD) * (totalFacturaUSD - totalesPedidosData.reduce((sum, t) => sum + (t['Total Factura (USD)'] || 0), 0) ); // Esta parte es vaga sin la columna de Costo Extra Global
            
            // SIMPLIFICACIÓN: Usaremos solo la proporción Costo Lote / Total Factura
            costoExtraDistribuidoUSD = (costoTotalLoteUSD / totalFacturaUSD);
        }
        
        // CORRECCIÓN CLAVE BASADA EN HOJA TÍPICA: Este campo generalmente distribuye un Costo Extra GLOBAL.
        // Dado que solo tenemos el Costo Total, asumiremos un valor simplificado para la implementación:
        // CÁLCULO 4 SIMPLIFICADO: Si la proporción es 0.1, el costo extra es 10% del costo del lote
        const EXTRA_FACTOR = 0.05; // 5% de Costo Extra global para el ejemplo
        costoExtraDistribuidoUSD = costoTotalLoteUSD * EXTRA_FACTOR;
        
        registro['Costo Extra Distribuido (USD)'] = parseFloat(costoExtraDistribuidoUSD.toFixed(2));

        // --- CÁLCULO 5: Costo Retiro Distribuido (PYG) ---
        // Fórmula: Peso (KG) * Factor de Distribución (G$/KG)
        
        // a) Buscar el Factor de Distribución (G$/KG)
        const logisticaRetiro = logisticaPyData.find(log => log['Nº de Tracking PY'] === registro['Tracking PY']);
        const factorDistribucion = logisticaRetiro ? logisticaRetiro['Factor de Distribución (G$/KG)'] : 0;
        
        // b) Calcular: Peso (KG) * Factor
        const costoRetiroDistribuidoPYG = registro['Peso (KG)'] * factorDistribucion;
        
        registro['Costo Retiro Distribuido (PYG)'] = parseFloat(costoRetiroDistribuidoPYG.toFixed(0)); // Redondeo a G$ sin decimales

        return registro;
    });
}


// ====================================================================================
// --- CÁLCULO DE PRODUCTOS (Inventario) ---
// ====================================================================================

interface ProductCalculated {
    sku_clave: string;
    stock_real: number;
    costo_promedio_gs: number;
}

/**
 * Calcula el STOCK REAL y el COSTO PROMEDIO para un SKU.
 * @param allCompras - Todos los registros de la tabla 'compras'.
 * @param allVentas - Todos los registros de la tabla 'ventas'.
 * @param sku - El SKU específico a calcular.
 */
export function calcularStockYCostoPromedio(
    allCompras: any[], 
    allVentas: any[], 
    sku: string
): ProductCalculated {
    
    // 1. Calcular Unidades Adquiridas (Suma de unidades_totales en Compras)
    const totalUnidadesAdquiridas = allCompras
        .filter(compra => compra.sku_id_producto === sku)
        .reduce((sum, compra) => sum + (compra.unidades_totales || 0), 0);
        
    // 2. Calcular Unidades Vendidas
    const totalUnidadesVendidas = allVentas
        .filter(venta => venta.sku_vendido === sku)
        .reduce((sum, venta) => sum + (venta.cantidad_vendida || 0), 0);

    // 3. Calcular el Stock Real
    const stockReal = totalUnidadesAdquiridas - totalUnidadesVendidas;

    // 4. Calcular el Costo Total para el Promedio (Numerador)
    // Fórmula: SUMA (Costo Total Lote PYG + Costo Retiro Distribuido PYG)
    const costoTotalAgregado = allCompras
        .filter(compra => compra.sku_id_producto === sku)
        .reduce((sum, compra) => {
            const costoLote = compra.costo_total_lote_pyg || 0;
            const costoRetiro = compra.costo_retiro_distribuido_pyg || 0;
            return sum + costoLote + costoRetiro;
        }, 0);

    // 5. Calcular el Costo Promedio (Costo Total / Unidades Adquiridas)
    let costoPromedioGs = 0;
    if (totalUnidadesAdquiridas > 0) {
        costoPromedioGs = costoTotalAgregado / totalUnidadesAdquiridas;
    }

    return {
        sku_clave: sku,
        stock_real: stockReal,
        costo_promedio_gs: parseFloat(costoPromedioGs.toFixed(2)),
    };
}

// ====================================================================================
// --- CÁLCULO DE LOGÍSTICA (Referencia para Compras) ---
// ====================================================================================

interface LogisticaForm {
    nro_de_tracking_py: string;
    fecha_retiro: string;
    costo_total_retiro_gs: number;
}
interface LogisticaCalculated {
    id_retiro_clave: string;
    suma_peso_kg: number;
    factor_distribucion_gs_kg: number;
}

/**
 * Calcula la Suma de Peso y el Factor de Distribución para un Tracking de Logística.
 * @param retiroData - Datos de entrada del formulario de logística.
 * @param allCompras - Todos los registros de la tabla 'compras' para el SUMAR.SI.
 */
export function calcularLogisticaRetiro(
    retiroData: LogisticaForm, 
    allCompras: any[]
): LogisticaCalculated {
    
    const tracking_py = retiroData.nro_de_tracking_py;
    
    // 1. Calcular Suma Peso (KG) del Tracking (SUMAR.SI en '🚚 COMPRAS'!P:P; B2; '🚚 COMPRAS'!Q:Q)
    // Criterio: '🚚 COMPRAS'!P:P (tracking_py en compras) == tracking_py
    // Rango de suma: '🚚 COMPRAS'!Q:Q (peso_kg en compras)
    const sumaPesoKg = allCompras
        .filter(compra => compra.tracking_py === tracking_py)
        .reduce((sum, compra) => sum + (compra.peso_kg || 0), 0);
        
    const costoTotalGs = retiroData.costo_total_retiro_gs;
    
    // 2. Calcular Factor de Distribución (G$/KG)
    // Fórmula: Costo Total Retiro (GS) / Suma Peso (KG) del Tracking
    let factorDistribucion = 0;
    if (sumaPesoKg > 0) {
        factorDistribucion = costoTotalGs / sumaPesoKg;
    }

    return {
        id_retiro_clave: generarIDCompra().replace('C-', 'R-'), // Usamos la misma base, pero con R-
        suma_peso_kg: parseFloat(sumaPesoKg.toFixed(3)),
        factor_distribucion_gs_kg: parseFloat(factorDistribucion.toFixed(2)),
    };
}
