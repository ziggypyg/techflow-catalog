import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface ProductFormProps {
  product?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

const ProductForm = ({ product, onSuccess, onCancel }: ProductFormProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: product?.sku || "",
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    brand: product?.brand || "",
    purchase_price: product?.purchase_price || "",
    shipping_miami: product?.shipping_miami || "",
    shipping_paraguay: product?.shipping_paraguay || "",
    additional_costs: product?.additional_costs || "",
    profit_margin: product?.profit_margin || "",
    sale_price: product?.sale_price || "",
    stock_quantity: product?.stock_quantity || "",
    units_per_package: product?.units_per_package || "1",
    image_url: product?.image_url || "",
    is_visible: product?.is_visible ?? true,
  });

  useEffect(() => {
    if (!product) {
      generateSKU();
    }
  }, []);

  const generateSKU = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setFormData((prev) => ({ ...prev, sku: `PRD-${timestamp}-${random}` }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        ...formData,
        purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price.toString()) : null,
        shipping_miami: parseFloat(formData.shipping_miami.toString()) || 0,
        shipping_paraguay: parseFloat(formData.shipping_paraguay.toString()) || 0,
        additional_costs: parseFloat(formData.additional_costs.toString()) || 0,
        profit_margin: parseFloat(formData.profit_margin.toString()) || 0,
        sale_price: parseFloat(formData.sale_price.toString()),
        stock_quantity: parseInt(formData.stock_quantity.toString()) || 0,
        units_per_package: parseInt(formData.units_per_package.toString()) || 1,
      };

      if (product) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", product.id);

        if (error) throw error;
        toast.success("Producto actualizado");
      } else {
        const { error } = await supabase.from("products").insert([productData]);

        if (error) throw error;
        toast.success("Producto creado");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error.message || "Error al guardar producto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU</Label>
          <Input
            id="sku"
            value={formData.sku}
            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
            required
            readOnly={!!product}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Nombre del Producto *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand">Marca</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="purchase_price">Precio de Compra</Label>
          <Input
            id="purchase_price"
            type="number"
            step="0.01"
            value={formData.purchase_price}
            onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sale_price">Precio de Venta *</Label>
          <Input
            id="sale_price"
            type="number"
            step="0.01"
            value={formData.sale_price}
            onChange={(e) => setFormData({ ...formData, sale_price: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stock_quantity">Cantidad en Stock</Label>
          <Input
            id="stock_quantity"
            type="number"
            value={formData.stock_quantity}
            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="units_per_package">Unidades por Paquete</Label>
          <Input
            id="units_per_package"
            type="number"
            value={formData.units_per_package}
            onChange={(e) => setFormData({ ...formData, units_per_package: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="image_url">URL de Imagen</Label>
          <Input
            id="image_url"
            type="url"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div className="flex items-center space-x-2 md:col-span-2">
          <Switch
            id="is_visible"
            checked={formData.is_visible}
            onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
          />
          <Label htmlFor="is_visible" className="cursor-pointer">
            Visible en el catálogo público
          </Label>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : product ? "Actualizar" : "Crear Producto"}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;
