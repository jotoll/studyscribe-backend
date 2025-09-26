-- Script para corregir únicamente la clave foránea de la tabla tags
-- Ejecutar este script en la consola SQL de Supabase

-- 1. Primero eliminar la clave foránea existente
ALTER TABLE tags 
DROP CONSTRAINT IF EXISTS tags_user_id_fkey;

-- 2. Crear la nueva clave foránea que referencia users(id) en lugar de auth.users(id)
ALTER TABLE tags 
ADD CONSTRAINT tags_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 3. Verificar que la corrección se aplicó correctamente
SELECT '✅ Clave foránea de tags corregida correctamente' as status;
