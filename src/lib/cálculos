// src/lib/calculos.ts

// --- Definiciones de Tipos (Esenciales para TypeScript) ---
interface Compra {
    'ID Compra (Clave)': string;
    'Nro. de Pedido': string;
    'Cantidad adquirida': number;
    'Unidades por paquete': number;
    'Costo Unitario (USD)': number;
    'TC Fijo (Usado)': number;
    'Tracking PY': string;
    'Peso (KG)': number;
    // Campos calculados:
    'Un. totales'?: number;
    'Costo Total Lote (USD)'?: number;
    'Costo Total Lote (PYG)'?: number;
    'Costo Retiro Distribuido (PYG)'?: number;
    'Costo Extra Distribuido (USD)'?: number;
}

interface TotalPedido {
    'Nro. de Pedido': string;
    'Total Factura (USD)': number;
}

interface LogisticaPY {
    'Nº de Tracking PY': string;
    'Costo Total Retiro (G$)': number;
}

// --- FUNCIONES DE UTILIDAD ---

const generarIDCompra = (): string => {
    // Generación de ID de Compra (Clave) automático
    const random = Math.floor(Math.random() * 9000) + 1000;
    return 'C-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + random;
}

/**
 * Aplica la lógica de cálculo de la hoja de COMPRAS a un conjunto de registros.
 */
export function calcularRegistrosDeCompras(
    compras: Compra[], 
    totalesPedidosData: TotalPedido[], 
    logisticaPyData: LogisticaPY[]
): Compra[] {
    // 1. PREPARACIÓN DE MAPAS DE BÚSQUEDA (Simula BUSCARV)
    
    const totalesMap = new Map<string, number>();
    totalesPedidosData.forEach(item => {
        totalesMap.set(item['Nro. de Pedido'], item['Total Factura (USD)']);
    });

    const logisticaMap = new Map<string, number>();
    logisticaPyData.forEach(item => {
        logisticaMap.set(item['Nº de Tracking PY'], item['Costo Total Retiro (G$)']);
    });
    
    // 2. PRE-CÁLCULOS PARA CÁLCULOS COMPLEJOS
    
    const pedidosResumen: { [key: string]: { sumaCostoLote: number; conteoLotes: number; } } = {};

    const comprasConIntermedios = compras.map(compra => {
        const nroPedido = compra['Nro. de Pedido'];
        
        // Generar ID si es un registro nuevo
        if (!compra['ID Compra (Clave)']) {
            compra['ID Compra (Clave)'] = generarIDCompra();
        }

        // CÁLCULOS INTERMEDIOS
        compra['Un. totales'] = compra['Unidades por paquete'] * compra['Cantidad adquirida'];
        compra['Costo Total Lote (USD)'] = compra['Cantidad adquirida'] * compra['Costo Unitario (USD)'];

        if (!pedidosResumen[nroPedido]) {
            pedidosResumen[nroPedido] = { sumaCostoLote: 0, conteoLotes: 0 };
        }
        
        pedidosResumen[nroPedido].sumaCostoLote += compra['Costo Total Lote (USD)'];
        pedidosResumen[nroPedido].conteoLotes += 1;
        
        return compra;
    });

    // 3. CÁLCULOS FINALES
    
    return comprasConIntermedios.map(compra => {
        const nroPedido = compra['Nro. de Pedido'];
        const trackingPy = compra['Tracking PY'];

        // CÁLCULO: Costo Total Lote (PYG)
        compra['Costo Total Lote (PYG)'] = compra['Costo Total Lote (USD)'] * compra['TC Fijo (Usado)'];
        
        // CÁLCULO: Costo Retiro Distribuido (PYG)
        const costoRetiro = logisticaMap.get(trackingPy) || 0;
        compra['Costo Retiro Distribuido (PYG)'] = costoRetiro * compra['Peso (KG)'];

        // CÁLCULO COMPLEJO: Costo Extra Distribuido (USD)
        const totalFactura = totalesMap.get(nroPedido) || 0;
        const { sumaCostoLote, conteoLotes } = pedidosResumen[nroPedido];
        
        let costoExtraDistribuido = 0;
        
        if (conteoLotes > 0) {
            const costoExtraTotal = totalFactura - sumaCostoLote;
            costoExtraDistribuido = costoExtraTotal / conteoLotes;
        }

        compra['Costo Extra Distribuido (USD)'] = costoExtraDistribuido;

        return compra;
    });
}
