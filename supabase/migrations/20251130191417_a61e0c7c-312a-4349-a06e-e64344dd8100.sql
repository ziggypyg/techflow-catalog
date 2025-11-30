-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  brand TEXT,
  purchase_price NUMERIC(10, 2),
  shipping_miami NUMERIC(10, 2) DEFAULT 0,
  shipping_paraguay NUMERIC(10, 2) DEFAULT 0,
  additional_costs NUMERIC(10, 2) DEFAULT 0,
  profit_margin NUMERIC(10, 2) DEFAULT 0,
  sale_price NUMERIC(10, 2) NOT NULL,
  stock_quantity INTEGER DEFAULT 0,
  units_per_package INTEGER DEFAULT 1,
  image_url TEXT,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view visible products
CREATE POLICY "Anyone can view visible products"
  ON public.products FOR SELECT
  USING (is_visible = true);

-- Authenticated users (admins) can do everything
CREATE POLICY "Authenticated users can manage products"
  ON public.products FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create purchases table (compras desde China/USA)
CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  tracking_number TEXT,
  purchase_date DATE NOT NULL,
  exchange_rate NUMERIC(10, 4) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  shipping_miami NUMERIC(10, 2) DEFAULT 0,
  shipping_paraguay NUMERIC(10, 2) DEFAULT 0,
  additional_costs NUMERIC(10, 2) DEFAULT 0,
  discounts NUMERIC(10, 2) DEFAULT 0,
  total_cost NUMERIC(10, 2) GENERATED ALWAYS AS (
    (unit_price * quantity) + shipping_miami + shipping_paraguay + additional_costs - discounts
  ) STORED,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage purchases"
  ON public.purchases FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create sales table
CREATE TABLE public.sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  sale_price NUMERIC(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  total NUMERIC(10, 2) GENERATED ALWAYS AS (sale_price * quantity) STORED,
  payment_method TEXT,
  acquisition_method TEXT,
  receipt_number TEXT,
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sales"
  ON public.sales FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create expenses table (egresos adicionales)
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  category TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage expenses"
  ON public.expenses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();