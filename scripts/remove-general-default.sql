-- Script para eliminar el valor por defecto 'general' de la columna subject en la tabla transcriptions
ALTER TABLE transcriptions ALTER COLUMN subject DROP DEFAULT;

-- Opcional: Actualizar las transcripciones existentes que tienen 'general' a NULL
-- UPDATE transcriptions SET subject = NULL WHERE subject = 'general';