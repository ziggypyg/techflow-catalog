// ====================================================================================
// --- TIPOS DE DATOS ---
// ====================================================================================

// Estructura de un registro de compra para entrada y cálculo
interface PurchaseInput {
    'Nro. de Pedido': string;
    'SKU (ID Producto)': string;
    'Cantidad adquirida': number;
    'Unidades por paquete': number;
    'Costo Unitario (USD)': number;
    'TC Fijo (Usado)': number;
    'Peso (KG)': number;
    // ... más columnas de entrada (Fecha, Proveedor, Tracking USA, Tracking PY)
}

// Estructura de una compra existente (usada para SUMAR.SI y COUNT.SI)
interface ExistingPurchase {
    'Nro. de Pedido': string;
    'SKU (ID Producto)': string;
    'Cantidad adquirida': number;
    'Unidades por paquete': number;
    'Costo Unitario (USD)': number;
    'Costo Total Lote (USD)': number; // Campo calculado que necesitamos
    'Costo Total Lote (PYG)': number; // Campo calculado que necesitamos
    'costo_retiro_distribuido_pyg': number; // Campo calculado que necesitamos
    'Peso (KG)': number;
    'Tracking PY': string;
    'unidades_totales': number; // Campo calculado
}

interface TotalPedido {
    nro_de_pedido: string;
    total_factura_usd: number;
}
interface LogisticaPy {
    nro_de_tracking_py: string;
    factor_distribucion_gs_kg: number; 
}

// ====================================================================================
// --- FUNCIONES DE UTILIDAD ---
// ====================================================================================

/**
 * Genera un ID de Clave único (ID Compra, ID Venta, ID Retiro).
 */
export const generarIDClave = (prefijo: string): string => {
    const random = Math.floor(Math.random() * 9000) + 1000;
    // Formato: PREFIJO-AAAAMMDD-RAND
    return prefijo + '-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + random;
}


// ====================================================================================
// --- CÁLCULO DE LOGÍSTICA (Referencia para Compras) ---
// ====================================================================================

interface LogisticaForm {
    nro_de_tracking_py: string;
    costo_total_retiro_pyg: number;
}

/**
 * LOGÍSTICA_PY: Calcula la Suma de Peso y el Factor de Distribución.
 */
export function calcularLogisticaRetiro(
    retiroData: LogisticaForm, 
    allCompras: ExistingPurchase[] // Necesitamos todas las compras para el SUMAR.SI del Peso
) {
    
    const tracking_py = retiroData.nro_de_tracking_py;
    
    // SUMAR.SI: Suma de Peso (KG) del Tracking
    const sumaPesoKg = allCompras
        .filter(compra => compra['Tracking PY'] === tracking_py)
        .reduce((sum, compra) => sum + (compra['Peso (KG)'] || 0), 0);
        
    const costoTotalPyG = retiroData.costo_total_retiro_pyg;
    
    // Factor de Distribución (PYG/KG)
    let factorDistribucion = 0;
    if (sumaPesoKg > 0) {
        factorDistribucion = costoTotalPyG / sumaPesoKg;
    }

    return {
        id_retiro_clave: generarIDClave('R'), 
        suma_peso_kg: parseFloat(sumaPesoKg.toFixed(3)),
        factor_distribucion_gs_kg: parseFloat(factorDistribucion.toFixed(4)),
    };
}


// ====================================================================================
// --- CÁLCULO DE COMPRAS (Distribución de Costos) ---
// ====================================================================================

/**
 * COMPRAS: Calcula todos los campos derivados para un registro de compra.
 */
export function calcularRegistrosDeCompras(
    input: PurchaseInput, 
    totalesPedidosData: TotalPedido[],
    logisticaPyData: LogisticaPy[],
    allCompras: ExistingPurchase[] // TODAS las compras, incluyendo la actual, para los cálculos de grupo
) {
    const nroPedido = input['Nro. de Pedido'];
    const costoUnitarioUSD = input['Costo Unitario (USD)'];
    const cantidadAdquirida = input['Cantidad adquirida'];
    const tcFijo = input['TC Fijo (Usado)'];

    // 1. Unidades Totales
    const unidadesTotales = cantidadAdquirida * input['Unidades por paquete'];

    // 2. Costo Total Lote (USD)
    const costoTotalLoteUSD = cantidadAdquirida * costoUnitarioUSD;

    // 3. Costo Total Lote (PYG)
    const costoTotalLotePYG = costoTotalLoteUSD * tcFijo;
    
    // --- Cálculo del Costo Extra Distribuido (USD) ---
    
    // a) BUSCARV: Obtener el Total Factura (USD)
    const totalPedido = totalesPedidosData.find(t => t.nro_de_pedido === nroPedido);
    const totalFacturaUSD = totalPedido ? totalPedido.total_factura_usd : 0;
    
    // b) SUMAPRODUCTO: Suma de Costos de Productos (USD) para TODAS las líneas de ese pedido
    const comprasDelMismoPedido = allCompras.filter(compra => compra['Nro. de Pedido'] === nroPedido);
    
    const sumaCostosLoteUSDDelPedido = comprasDelMismoPedido.reduce((sum, compra) => {
        return sum + (compra['Costo Unitario (USD)'] * compra['Cantidad adquirida']);
    }, 0);

    // c) Costo Extra Total (Residual): Total Factura - Suma de Costos de Productos
    const costoExtraTotalUSD = totalFacturaUSD - sumaCostosLoteUSDDelPedido;
    
    // d) CONTAR.SI: Contar las líneas de producto para ese pedido
    const countLineItems = comprasDelMismoPedido.length;

    // e) Costo Extra Distribuido (USD) = Costo Extra Total / CONTAR.SI
    let costoExtraDistribuidoUSD = 0;
    if (countLineItems > 0) {
        costoExtraDistribuidoUSD = costoExtraTotalUSD / countLineItems;
    }

    // --- Cálculo del Costo Retiro Distribuido (PYG) ---
    
    // a) INDICE/COINCIDIR: Buscar el Factor de Distribución (PYG/KG)
    const logisticaRetiro = logisticaPyData.find(log => log.nro_de_tracking_py === input['Tracking PY']);
    const factorDistribucion = logisticaRetiro ? logisticaRetiro.factor_distribucion_gs_kg : 0;
    
    // b) Calcular: Factor de Distribución * Peso (KG)
    const costoRetiroDistribuidoPYG = factorDistribucion * input['Peso (KG)'];
    
    return {
        id_compra_clave: generarIDClave('C'), 
        unidades_totales: unidadesTotales,
        costo_total_lote_usd: parseFloat(costoTotalLoteUSD.toFixed(4)),
        costo_total_lote_pyg: parseFloat(costoTotalLotePYG.toFixed(0)), 
        costo_extra_distribuido_usd: parseFloat(costoExtraDistribuidoUSD.toFixed(4)),
        costo_retiro_distribuido_pyg: parseFloat(costoRetiroDistribuidoPYG.toFixed(0)), 
    };
}


// ====================================================================================
// --- CÁLCULO DE PRODUCTOS (Inventario y Costo Promedio) ---
// ====================================================================================

/**
 * PRODUCTOS: Calcula el STOCK REAL y el COSTO PROMEDIO para un SKU.
 */
export function calcularStockYCostoPromedio(
    allCompras: ExistingPurchase[], 
    allVentas: any[], // Asumimos que tiene 'sku_vendido' y 'cantidad_vendida'
    sku: string
) {
    
    // 1. Unidades Adquiridas
    const totalUnidadesAdquiridas = allCompras
        .filter(compra => compra['SKU (ID Producto)'] === sku)
        .reduce((sum, compra) => sum + (compra.unidades_totales || 0), 0);
        
    // 2. Unidades Vendidas
    const totalUnidadesVendidas = allVentas
        .filter(venta => venta.sku_vendido === sku)
        .reduce((sum, venta) => sum + (venta.cantidad_vendida || 0), 0);

    // 3. Stock Real (Unidades Adquiridas - Unidades Vendidas)
    const stockReal = totalUnidadesAdquiridas - totalUnidadesVendidas;

    // 4. Costo Total para el Promedio (Numerador)
    // Formula: SUMAR.SI(SKU, current_SKU, Costo Total Lote (PYG))
    const costoTotalLoteAgregado = allCompras
        .filter(compra => compra['SKU (ID Producto)'] === sku)
        .reduce((sum,
