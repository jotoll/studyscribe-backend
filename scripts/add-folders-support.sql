-- Script para añadir soporte de carpetas a Dicttr
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Crear tabla de carpetas
CREATE TABLE IF NOT EXISTS folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#4A00E0',
    icon TEXT DEFAULT 'folder',
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    position INTEGER DEFAULT 0,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Añadir campo folder_id a la tabla transcriptions
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- 3. Añadir campo is_favorite a la tabla transcriptions (si no existe)
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;

-- 4. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_folder_id ON transcriptions(folder_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_is_favorite ON transcriptions(is_favorite);

-- 5. Crear políticas RLS para la tabla folders
CREATE POLICY "Users can view own folders" ON folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON folders FOR DELETE USING (auth.uid() = user_id);

-- 6. Crear trigger para updated_at en folders
CREATE TRIGGER update_folders_updated_at 
    BEFORE UPDATE ON folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Crear carpetas por defecto para usuarios existentes
-- Esta función se ejecutará cuando un usuario se registre
CREATE OR REPLACE FUNCTION create_default_folders()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear carpeta "Todas" (sistema)
    INSERT INTO folders (user_id, name, color, icon, is_system, position)
    VALUES (NEW.id, 'Todas', '#4A00E0', 'document-text', true, 0);
    
    -- Crear carpeta "Favoritas" (sistema)
    INSERT INTO folders (user_id, name, color, icon, is_system, position)
    VALUES (NEW.id, 'Favoritas', '#FFD700', 'star', true, 1);
    
    -- Crear carpeta "General" por defecto
    INSERT INTO folders (user_id, name, color, icon, position)
    VALUES (NEW.id, 'General', '#666666', 'folder', 2);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Crear trigger para crear carpetas por defecto al registrar usuario
DROP TRIGGER IF EXISTS create_default_folders_trigger ON users;
CREATE TRIGGER create_default_folders_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_folders();

-- 9. Función para obtener el path completo de una carpeta
CREATE OR REPLACE FUNCTION get_folder_path(folder_uuid UUID)
RETURNS TABLE(path TEXT[]) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE folder_path AS (
        SELECT id, name, parent_id, ARRAY[name] as path
        FROM folders 
        WHERE id = folder_uuid
        
        UNION ALL
        
        SELECT f.id, f.name, f.parent_id, ARRAY[f.name] || fp.path
        FROM folders f
        INNER JOIN folder_path fp ON f.id = fp.parent_id
    )
    SELECT path FROM folder_path WHERE parent_id IS NULL;
END;
$$ LANGUAGE plpgsql;

-- 10. Actualizar función para obtener estadísticas con soporte de carpetas
CREATE OR REPLACE FUNCTION get_transcription_stats(user_uuid UUID)
RETURNS TABLE(
    total INTEGER,
    favorites INTEGER,
    with_folder INTEGER,
    without_folder INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total,
        COUNT(*) FILTER (WHERE is_favorite = true)::INTEGER as favorites,
        COUNT(*) FILTER (WHERE folder_id IS NOT NULL)::INTEGER as with_folder,
        COUNT(*) FILTER (WHERE folder_id IS NULL)::INTEGER as without_folder
    FROM transcriptions 
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Mensaje de éxito
SELECT '✅ Soporte de carpetas añadido correctamente!' as status;
