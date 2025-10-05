-- Script para agregar columna de idioma de traducción a la tabla de transcripciones en Supabase
-- Ejecutar este script en la consola SQL de Supabase

-- Agregar columna para el idioma de traducción
-- La columna 'language' ya existe para el idioma de transcripción
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS translation_language VARCHAR(10) DEFAULT 'es';

-- Crear un índice para mejorar el rendimiento de consultas por idioma de traducción
CREATE INDEX IF NOT EXISTS idx_transcriptions_translation_language 
ON transcriptions(translation_language);

-- Comentario sobre la nueva columna
COMMENT ON COLUMN transcriptions.translation_language IS 'Idioma utilizado para la traducción del texto mejorado (código ISO 639-1)';

-- Verificar que la columna se ha agregado correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'transcriptions' 
AND column_name = 'translation_language';