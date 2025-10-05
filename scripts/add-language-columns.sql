-- Script para agregar columnas de idioma a la tabla de transcripciones en Supabase
-- Ejecutar este script en la consola SQL de Supabase

-- Agregar columna para el idioma de transcripción
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS transcription_language VARCHAR(10) DEFAULT 'es';

-- Agregar columna para el idioma de traducción
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS translation_language VARCHAR(10) DEFAULT 'es';

-- Crear un índice para mejorar el rendimiento de consultas por idioma
CREATE INDEX IF NOT EXISTS idx_transcriptions_transcription_language 
ON transcriptions(transcription_language);

CREATE INDEX IF NOT EXISTS idx_transcriptions_translation_language 
ON transcriptions(translation_language);

-- Comentario sobre las nuevas columnas
COMMENT ON COLUMN transcriptions.transcription_language IS 'Idioma utilizado para la transcripción del audio (código ISO 639-1)';
COMMENT ON COLUMN transcriptions.translation_language IS 'Idioma utilizado para la traducción del texto mejorado (código ISO 639-1)';

-- Opcional: Crear una política de RLS (Row Level Security) si es necesario
-- Esto depende de tu configuración existente de RLS

-- Verificar que las columnas se han agregado correctamente
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'transcriptions' 
AND column_name IN ('transcription_language', 'translation_language');