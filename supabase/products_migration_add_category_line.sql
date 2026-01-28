-- Ejecutar en SQL Editor si ya tenías la tabla products sin categoria/linea.

ALTER TABLE products ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS line text NOT NULL DEFAULT '';
