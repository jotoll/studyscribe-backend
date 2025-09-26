-- Script simplificado para agregar soporte de etiquetas al sistema Dicttr
-- Ejecutar este script completo en el SQL Editor de Supabase

-- 1. Crear tabla de etiquetas
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#666666',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restricciones
    CONSTRAINT tags_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
    CONSTRAINT tags_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    
    -- Índices para mejor rendimiento
    CONSTRAINT unique_user_tag_name UNIQUE (user_id, name)
);

-- 2. Crear tabla de relación muchos-a-muchos entre transcripciones y etiquetas
CREATE TABLE IF NOT EXISTS transcription_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transcription_id UUID NOT NULL REFERENCES transcriptions(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Restricción para evitar duplicados
    CONSTRAINT unique_transcription_tag UNIQUE (transcription_id, tag_id)
);

-- 3. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_transcription_tags_transcription_id ON transcription_tags(transcription_id);
CREATE INDEX IF NOT EXISTS idx_transcription_tags_tag_id ON transcription_tags(tag_id);

-- 4. Crear políticas RLS para la tabla tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias etiquetas
CREATE POLICY "Users can view own tags" ON tags
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias etiquetas
CREATE POLICY "Users can insert own tags" ON tags
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias etiquetas
CREATE POLICY "Users can update own tags" ON tags
    FOR UPDATE USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias etiquetas
CREATE POLICY "Users can delete own tags" ON tags
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Crear políticas RLS para la tabla transcription_tags
ALTER TABLE transcription_tags ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver relaciones de sus propias transcripciones
CREATE POLICY "Users can view own transcription tags" ON transcription_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM transcriptions t
            WHERE t.id = transcription_tags.transcription_id
            AND t.user_id = auth.uid()
        )
    );

-- Política: Los usuarios solo pueden insertar relaciones para sus propias transcripciones
CREATE POLICY "Users can insert own transcription tags" ON transcription_tags
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM transcriptions t
            WHERE t.id = transcription_tags.transcription_id
            AND t.user_id = auth.uid()
        ) AND
        EXISTS (
            SELECT 1 FROM tags tag
            WHERE tag.id = transcription_tags.tag_id
            AND tag.user_id = auth.uid()
        )
    );

-- Política: Los usuarios solo pueden eliminar relaciones de sus propias transcripciones
CREATE POLICY "Users can delete own transcription tags" ON transcription_tags
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM transcriptions t
            WHERE t.id = transcription_tags.transcription_id
            AND t.user_id = auth.uid()
        )
    );

-- 6. Crear función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Crear trigger para actualizar automáticamente updated_at en tags
DROP TRIGGER IF EXISTS update_tags_updated_at ON tags;
CREATE TRIGGER update_tags_updated_at
    BEFORE UPDATE ON tags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Insertar etiqueta por defecto "general" para usuarios existentes
INSERT INTO tags (user_id, name, color)
SELECT DISTINCT t.user_id, 'general', '#666666'
FROM transcriptions t
WHERE t.user_id IS NOT NULL
AND EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = t.user_id
)
AND NOT EXISTS (
    SELECT 1 FROM tags 
    WHERE tags.user_id = t.user_id 
    AND tags.name = 'general'
);

-- 9. Asignar etiqueta "general" a todas las transcripciones existentes
INSERT INTO transcription_tags (transcription_id, tag_id)
SELECT t.id, tag.id
FROM transcriptions t
JOIN tags tag ON tag.user_id = t.user_id AND tag.name = 'general'
WHERE EXISTS (
    SELECT 1 FROM auth.users u 
    WHERE u.id = t.user_id
)
AND NOT EXISTS (
    SELECT 1 FROM transcription_tags tt
    WHERE tt.transcription_id = t.id
    AND tt.tag_id = tag.id
);

-- 10. Crear vista para obtener transcripciones con sus etiquetas
CREATE OR REPLACE VIEW transcriptions_with_tags AS
SELECT 
    t.*,
    COALESCE(
        json_agg(
            DISTINCT jsonb_build_object(
                'id', tag.id,
                'name', tag.name,
                'color', tag.color
            )
        ) FILTER (WHERE tag.id IS NOT NULL),
        '[]'
    ) as tags
FROM transcriptions t
LEFT JOIN transcription_tags tt ON t.id = tt.transcription_id
LEFT JOIN tags tag ON tt.tag_id = tag.id
GROUP BY t.id;

-- Mensaje de confirmación
SELECT '✅ Sistema de etiquetas configurado correctamente' as status;
