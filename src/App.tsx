import React from 'react';
import ProductsTab from "@/components/admin/ProductsTab";
import PurchasesTab from "@/components/admin/PurchasesTab";
import SalesTab from "@/components/admin/SalesTab";
import TotalPedidosTab from "@/components/admin/TotalPedidosTab";
import LogisticaPyTab from "@/components/admin/LogisticaPyTab"; 
import FinancesTab from "@/components/admin/FinancesTab"; 
import { Separator } from "@/components/ui/separator"; // Asume que tienes un Separator simple.

const AdminLayout = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <header className="mb-8 border-b pb-4">
                <h1 className="text-4xl font-extrabold text-gray-900">
                    Panel de Gestión de Costos
                </h1>
                <p className="text-gray-600 mt-2">
                    Todos los módulos cargados secuencialmente para una fácil gestión.
                </p>
            </header>

            <div className="space-y-12">
                {/* 5. Totales Pedidos (Datos de Referencia) - Primero, ya que Compras lo necesita */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">📄 1. Totales Pedidos (Costo Total Factura USD)</h2>
                    <TotalPedidosTab />
                </section>
                
                <Separator orientation="horizontal" className="h-1 bg-blue-200" />

                {/* 4. Logística PY (Datos de Referencia) - Segundo, ya que Compras lo necesita */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">🚛 2. Logística (Cálculo de Factor G$/KG)</h2>
                    <LogisticaPyTab />
                </section>
                
                <Separator orientation="horizontal" className="h-1 bg-blue-200" />
                
                {/* 2. Compras (Módulo de Transacción Principal) - Tercero */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">🚚 3. Registro de Compras</h2>
                    <PurchasesTab />
                </section>
                
                <Separator orientation="horizontal" className="h-1 bg-blue-200" />
                
                {/* 1. Inventario y Costos (El módulo maestro) - Cuarto (muestra cálculos) */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">📦 4. Inventario / Costos (Cálculos Finales)</h2>
                    <ProductsTab />
                </section>

                <Separator orientation="horizontal" className="h-1 bg-blue-200" />
                
                {/* 3. Ventas - Quinto */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">💰 5. Registro de Ventas</h2>
                    <SalesTab />
                </section>
                
                <Separator orientation="horizontal" className="h-1 bg-blue-200" />

                {/* 6. Finanzas - Último */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">💵 6. Finanzas</h2>
                    <FinancesTab />
                </section>
            </div>
        </div>
    );
};

export default AdminLayout;
