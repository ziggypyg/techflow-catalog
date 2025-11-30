import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ProductForm from "./ProductForm";
import ProductsList from "./ProductsList";
import { toast } from "sonner";

const ProductsTab = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);

      if (error) throw error;
      toast.success("Producto eliminado");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Error al eliminar producto");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestión de Productos</CardTitle>
              <CardDescription>Administra tu catálogo de productos</CardDescription>
            </div>
            {!showForm && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Producto
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <ProductForm
              product={editingProduct}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          ) : (
            <ProductsList
              products={products}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductsTab;
