-- Tabla para guardar la configuración de la calculadora por dispositivo.
-- Cada dispositivo usa un device_key (UUID en localStorage) para identificar su fila.

CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_key text NOT NULL UNIQUE,
  config jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índice para buscar por device_key rápido
CREATE INDEX IF NOT EXISTS idx_app_config_device_key ON app_config(device_key);

-- Actualizar updated_at al modificar
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_config_updated_at ON app_config;
CREATE TRIGGER app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Políticas RLS: permitir que la app (anon) lea e inserte/actualice usando la clave anon.
-- La app solo consulta/actualiza la fila de su device_key; no hay datos sensibles.
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read" ON app_config;
CREATE POLICY "Allow anon read" ON app_config FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Allow anon insert" ON app_config;
CREATE POLICY "Allow anon insert" ON app_config FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon update" ON app_config;
CREATE POLICY "Allow anon update" ON app_config FOR UPDATE TO anon USING (true) WITH CHECK (true);
