import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  sale_price: number;
  stock_quantity: number;
  image_url: string | null;
  sku: string;
}

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_visible", true)
        .gt("stock_quantity", 0)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary via-accent to-primary/90 text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
              <Package className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">TechStore</h1>
              <p className="text-primary-foreground/90 text-sm">Tecnología de calidad</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/95 backdrop-blur-sm border-0 shadow-sm"
            />
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              No se encontraron productos
            </h3>
            <p className="text-muted-foreground">
              {searchTerm
                ? "Intenta con otra búsqueda"
                : "No hay productos disponibles en este momento"}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-secondary text-secondary-foreground py-8 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm opacity-90">
            © 2024 TechStore. Todos los derechos reservados.
          </p>
          <p className="text-xs mt-2 opacity-75">
            Tecnología importada de calidad
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Catalog;
