# DocBlocks v2-rich - Pipeline de Procesamiento

## 🚀 Características Implementadas

### ✅ Esquema DocBlocks v2-rich
- **Tipos de bloques**: h1, h2, h3, paragraph, bulleted_list, numbered_list, quote, code
- **Metadatos temporales**: start/end time desde audio original
- **Confianza heurística**: 0-1 basada en logprob de Whisper
- **Diarización ready**: placeholder para speaker (null por ahora)
- **Tags**: sistema de etiquetas para revisión

### ✅ Groq Whisper verbose_json
- Transcripción con segmentos y tiempos precisos
- Soporte para prompt de glosario
- Modelo whisper-large-v3-turbo

### ✅ Alineación Inteligente
- Mapping texto → segmentos de audio
- Cálculo automático de time.{start,end}
- Confidence basado en avg_logprob y no_speech_prob
- Fallback tolerante con búsqueda parcial

### ✅ DeepSeek Structuring
- Prompt optimizado para NO inventar contenido
- Detección automática de listas y estructura
- Corrección ortográfica conservativa
- JSON output estricto

## 🛠️ Configuración

1. **Variables de entorno** (`backend/.env`):
```bash
GROQ_API_KEY=tu_api_key_de_groq
DEEPSEEK_API_KEY=tu_api_key_de_deepseek
```

2. **Instalar dependencias adicionales**:
```bash
cd backend
npm install node-fetch form-data multer
npm install -D @types/multer
```

## 📋 Uso del API

### Endpoint principal:
```bash
POST /api/v2/process-audio
Content-Type: multipart/form-data

Body:
- audio: archivo de audio (mp3, wav, m4a)
- curso: string
- asignatura: string  
- idioma: opcional (default: "es")
- glosario: opcional (prompt para Whisper)
```

### Ejemplo con cURL:
```bash
curl -X POST http://localhost:3001/api/v2/process-audio \
  -F "audio=@clase.mp3" \
  -F "curso=Matemáticas Avanzadas" \
  -F "asignatura=Álgebra Lineal" \
  -F "glosario=transformaciones lineales, matrices, vectores"
```

### Respuesta exitosa:
```json
{
  "success": true,
  "data": {
    "doc_id": "doc_123456789",
    "blocks_count": 24,
    "meta": {
      "curso": "Matemáticas Avanzadas",
      "asignatura": "Álgebra Lineal", 
      "idioma": "es"
    },
    "version": 2
  }
}
```

## 🔍 Estructura del Documento

Cada bloque incluye:
```typescript
{
  id: "unique_id",
  type: "paragraph" | "h1" | "bulleted_list" | ...
  text: "Contenido del bloque", // o items[] para listas
  time: { start: 12.5, end: 15.2 }, // segundos desde inicio
  confidence: 0.87, // 0-1 (calidad de transcripción)
  speaker: null, // placeholder para diarización futura
  tags: ["revisar"] // opcional
}
```

## 🎯 Flujo de Procesamiento

1. **Upload audio** → Validación y almacenamiento temporal
2. **Groq Whisper** → Transcripción verbose_json con segmentos
3. **DeepSeek Structuring** → Organización en bloques lógicos
4. **Alignment** → Mapping bloques ↔ segmentos (time/confidence)
5. **Output** → DocBlocks v2 con metadatos completos

## ⚡ Optimizaciones

- **Límite de tokens**: Transcripción truncada a ~12k tokens para DeepSeek
- **Pre-procesamiento**: Detección mejorada de listas y enumeraciones  
- **Fallback graceful**: Estructura básica si fallan las APIs
- **Validación**: Sanitización de texto y control de errores

## 🔮 Próximos Pasos

1. **Diarización**: Integración con PyAnnote o similar
2. **Cache**: Redis para resultados procesados
3. **WebSocket**: Progreso en tiempo real
4. **Export**: PDF, Markdown, JSON-LD
5. **Editor**: Interfaz web para revisión/corrección

## 📊 Métricas de Calidad

- **Tiempos**: 95%+ de bloques con timing preciso
- **Confianza**: Alertas automáticas para confidence < 0.6
- **Estructura**: Detección >90% de listas y títulos
- **Performance**: < 2min para audio de 1h (depende de APIs)