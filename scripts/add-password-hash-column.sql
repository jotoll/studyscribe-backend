-- Migración para agregar columna password_hash a la tabla users
-- Ejecutar en Supabase Dashboard > SQL Editor

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT 'temp_password';

-- Actualizar el valor por defecto después de agregar la columna
ALTER TABLE users 
ALTER COLUMN password_hash DROP DEFAULT;

SELECT '✅ Columna password_hash agregada exitosamente a la tabla users' as status;