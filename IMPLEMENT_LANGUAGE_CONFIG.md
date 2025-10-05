# Implementación de Configuración de Idiomas en Dicttr

Este documento describe los pasos necesarios para implementar la configuración de idiomas en la aplicación móvil Dicttr.

## Resumen de la Implementación

La configuración de idiomas permite a los usuarios seleccionar:
1. **Idioma de transcripción**: El idioma en el que Groq transcribirá el audio.
2. **Idioma de traducción**: El idioma al que DeepSeek traducirá el texto mejorado.

## Cambios Realizados

### 1. Aplicación Móvil (React Native)

#### Componentes Creados:
- `mobile/DicttrMobile/components/ConfigMenu.tsx` - Menú flotante para seleccionar idiomas.
- `mobile/DicttrMobile/components/ConfigButton.tsx` - Botón circular para acceder a la configuración.
- `mobile/DicttrMobile/hooks/useConfig.ts` - Hook para gestionar la configuración de idiomas.

#### Componentes Modificados:
- `mobile/DicttrMobile/App.tsx` - Integración del menú de configuración y envío de idiomas al backend.
- `mobile/DicttrMobile/components/RecordingProcessor.tsx` - Obtención y envío de configuración de idiomas.
- `mobile/DicttrMobile/services/api.ts` - Modificación del método `uploadAudio` para aceptar opciones de idioma.

### 2. Backend (Node.js)

#### Archivos de Referencia:
- `src/routes/transcription-updated.js` - Muestra las modificaciones necesarias en `transcription.js`.
- `src/services/transcriptionService-updated.js` - Muestra las modificaciones necesarias en `transcriptionService.js`.

#### Cambios Requeridos:
1. Modificar `src/routes/transcription.js` para aceptar parámetros de idioma.
2. Modificar `src/services/transcriptionService.js` para usar los idiomas en Groq y DeepSeek.

### 3. Base de Datos (Supabase)

#### Script SQL:
- `scripts/add-translation-language-column.sql` - Agrega la columna `translation_language` a la tabla `transcriptions`.

## Pasos de Implementación

### Paso 1: Ejecutar Script SQL en Supabase

Ejecuta el siguiente script en la consola SQL de Supabase:

```sql
-- Agregar columna para el idioma de traducción
ALTER TABLE transcriptions 
ADD COLUMN IF NOT EXISTS translation_language VARCHAR(10) DEFAULT 'es';

-- Crear índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_transcriptions_translation_language 
ON transcriptions(translation_language);
```

### Paso 2: Modificar Backend

#### 2.1 Modificar `src/routes/transcription.js`

```javascript
// En la línea 66, cambiar:
const { subject = null, format } = req.body;
// Por:
const { subject = null, format, language = 'es', translation_language = 'es' } = req.body;

// En la línea 69, cambiar:
const transcription = await transcriptionService.transcribeAudio(req.file.path);
// Por:
const transcription = await transcriptionService.transcribeAudio(req.file.path, language);

// En las líneas 72-75, cambiar:
const enhanced = await transcriptionService.enhanceTranscription(
  transcription.text, 
  subject
);
// Por:
const enhanced = await transcriptionService.enhanceTranscription(
  transcription.text, 
  subject,
  translation_language
);

// En las líneas 88-92, cambiar:
saveResult = await transcriptionService.saveTranscriptionToDB(
  enhanced,
  userId,
  fileInfo
);
// Por:
saveResult = await transcriptionService.saveTranscriptionToDB(
  enhanced,
  userId,
  fileInfo,
  {
    language,           // Usar la columna existente 'language'
    translation_language  // Usar la nueva columna 'translation_language'
  }
);
```

#### 2.2 Modificar `src/services/transcriptionService.js`

```javascript
// En la línea 10, cambiar:
async transcribeAudio(audioFile) {
// Por:
async transcribeAudio(audioFile, language = 'es') {

// En la línea 50, cambiar:
language: "es",
// Por:
language: language, // Usar el idioma especificado

// En la línea 149, cambiar:
async enhanceTranscription(rawText, subject = 'general') {
// Por:
async enhanceTranscription(rawText, subject = 'general', translationLanguage = 'es') {

// En la línea 167, cambiar:
const systemPrompt = this.getSystemPrompt(subject);
// Por:
const systemPrompt = this.getSystemPrompt(subject, translationLanguage);

// En la línea 728, cambiar:
getSystemPrompt(subject) {
// Por:
getSystemPrompt(subject, translationLanguage = 'es') {

// Añadir al systemPrompt la instrucción de idioma:
IMPORTANTE: Genera el contenido mejorado en el idioma "${translationLanguage}". Todo el contenido debe estar en este idioma.

// En la línea 475, cambiar:
async saveTranscriptionToDB(transcriptionData, userId, fileInfo = null) {
// Por:
async saveTranscriptionToDB(transcriptionData, userId, fileInfo = null, languageOptions = {}) {

// En la línea 499, cambiar:
language: transcriptionData.language || 'es',
// Por:
language: languageOptions.language || transcriptionData.language || 'es',
translation_language: languageOptions.translation_language || 'es',
```

### Paso 3: Desplegar Backend

Despliega los cambios del backend en tu servidor Coolify.

### Paso 4: Probar la Implementación

1. Abre la aplicación móvil.
2. Presiona el botón de configuración en la esquina superior derecha.
3. Selecciona los idiomas deseados para transcripción y traducción.
4. Graba un audio y verifica que se procese con los idiomas seleccionados.
5. Verifica en la base de datos que los idiomas se guarden correctamente.

## Idiomas Soportados

### Idiomas de Transcripción (Groq)
- Español (es) 🇪🇸
- Inglés (en) 🇬🇧
- Francés (fr) 🇫🇷
- Alemán (de) 🇩🇪
- Italiano (it) 🇮🇹
- Portugués (pt) 🇵🇹
- Ruso (ru) 🇷🇺
- Japonés (ja) 🇯🇵
- Chino (zh) 🇨🇳
- Árabe (ar) 🇸🇦

### Idiomas de Traducción (DeepSeek)
- Español (es) 🇪🇸
- Inglés (en) 🇬🇧
- Francés (fr) 🇫🇷
- Alemán (de) 🇩🇪
- Italiano (it) 🇮🇹
- Portugués (pt) 🇵🇹
- Ruso (ru) 🇷🇺
- Japonés (ja) 🇯🇵
- Chino (zh) 🇨🇳
- Árabe (ar) 🇸🇦

## Consideraciones Adicionales

1. **Valores Predeterminados**: Si no se seleccionan idiomas, se usarán 'es' (español) para ambos.
2. **Persistencia**: La configuración se guarda localmente en el dispositivo usando AsyncStorage.
3. **Retrocompatibilidad**: Las transcripciones existentes seguirán funcionando con el idioma predeterminado.
4. **Validación**: Los idiomas se validan en el backend antes de procesar el audio.

## Solución de Problemas

### Problema: La transcripción no se realiza en el idioma seleccionado
**Solución**: Verifica que el backend esté recibiendo correctamente el parámetro `language` en la solicitud.

### Problema: La traducción no se realiza en el idioma seleccionado
**Solución**: Verifica que el backend esté recibiendo correctamente el parámetro `translation_language` y que se esté pasando a DeepSeek.

### Problema: Los idiomas no se guardan en la base de datos
**Solución**: Asegúrate de haber ejecutado el script SQL para agregar la columna `translation_language`.

## Pruebas

Para probar la configuración de idiomas, puedes ejecutar:

```bash
node test-language-config.js
```

Este script verificará que el backend acepte correctamente los parámetros de idioma.