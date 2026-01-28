-- Lista global de productos (misma para todos los usuarios).
-- Importación desde Excel (columnas: CÓDIGO, PRODUCTO, COSTO UNI., PRECIO UNI., CATEGORIA, LINEA).
-- P. venta con IVA se calcula en la app: sale_price * 1.16.

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  description text NOT NULL DEFAULT '',
  cost numeric NOT NULL DEFAULT 0,
  sale_price numeric NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT '',
  line text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);

DROP TRIGGER IF EXISTS products_updated_at ON products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read products" ON products;
CREATE POLICY "Allow anon read products" ON products FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert products" ON products;
CREATE POLICY "Allow anon insert products" ON products FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update products" ON products;
CREATE POLICY "Allow anon update products" ON products FOR UPDATE TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon delete products" ON products;
CREATE POLICY "Allow anon delete products" ON products FOR DELETE TO anon USING (true);
