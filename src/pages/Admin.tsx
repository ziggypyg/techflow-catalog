import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LogOut, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import ProductsTab from "@/components/admin/ProductsTab";
import PurchasesTab from "@/components/admin/PurchasesTab";
import SalesTab from "@/components/admin/SalesTab";
import FinancesTab from "@/components/admin/FinancesTab";

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Sesión cerrada exitosamente");
      navigate("/auth");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-accent to-primary/90 text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
                <Package className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Panel de Administración</h1>
                <p className="text-sm text-primary-foreground/80">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate("/")}
                className="hidden md:flex"
              >
                Ver Catálogo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="products" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Productos</span>
            </TabsTrigger>
            <TabsTrigger value="purchases" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Compras</span>
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Ventas</span>
            </TabsTrigger>
            <TabsTrigger value="finances" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Finanzas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductsTab />
          </TabsContent>

          <TabsContent value="purchases">
            <PurchasesTab />
          </TabsContent>

          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>

          <TabsContent value="finances">
            <FinancesTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
