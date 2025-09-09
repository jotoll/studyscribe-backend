# 📁 File Reference Guide - StudyScribe

Esta guía describe el propósito y funcionalidad de cada archivo en el proyecto StudyScribe.

## 🏗️ Estructura General del Proyecto

```
studyscribe/
├── backend/          # Servidor API Node.js + Express
├── frontend/         # Aplicación web React
├── mobile/           # Aplicación móvil React Native  
├── shared/           # Recursos compartidos
├── docs/            # Documentación
└── archive/         # Archivos históricos/debug
```

## 🔧 Backend (API Server)

### 📁 `backend/src/` - Código Principal

#### 🛣️ **Routes** - Endpoints de la API
- `transcription.js` - **Endpoints principales**:
  - `POST /api/transcription/enhance` - Mejora texto con IA
  - `POST /api/transcription/upload` - Sube y transcribe audio
  - `POST /api/transcription/generate-material` - Genera material de estudio
  - `POST /v2/process-audio` - Procesamiento avanzado V2
  - `GET /v2/document/:id` - Obtiene documento estructurado
  - `PUT /v2/document/:id` - Actualiza documento

#### ⚙️ **Services** - Lógica de Negocio
- `transcriptionService.js` - **Servicio principal**:
  - Procesamiento de audio con Whisper
  - Integración con DeepSeek AI
  - Generación de bloques estructurados
  - Creación de flujogramas con Mermaid

#### 🗃️ **Models** - Modelos de Datos
- `Transcription.js` - Modelo de transcripción (si se usa DB)
- `DocumentV2.js` - Modelo de documentos estructurados

#### ⚙️ **Config** - Configuración
- `deepseek.js` - Configuración de la API de DeepSeek
- `whisper.js` - Configuración de transcripción de audio

### 📄 Archivos de Configuración Backend
- `.env` - Variables de entorno (API keys, puertos)
- `package.json` - Dependencias del backend
- `README-v2.md` - Documentación específica de V2

## 🌐 Frontend Web (React)

### 📁 `frontend/src/` - Código de la App Web

#### 🎨 **Components** - Componentes React
- `BlockEditor.tsx` - **Editor principal de bloques**:
  - Edición visual de bloques de contenido
  - Soporte para múltiples tipos de bloques
  - Funciones de guardado y cancelación
  - Logging de eventos de edición
  
- `MermaidFlowchart.js` - **Visualizador de flujogramas**:
  - Renderizado de diagramas Mermaid
  - Integración con la API de flujogramas

#### 🔌 **Services** - Clientes API
- `api.ts` - **Cliente de la API backend**:
  - Configuración de Axios
  - Todos los endpoints del backend
  - Tipos TypeScript para requests/responses

#### 📱 **App Principal**
- `App.tsx` - **Componente principal**:
  - Estado global de la aplicación
  - Manejo de subida de archivos
  - Gestión de transcripciones
  - Interfaz de usuario completa
  - Integración con BlockEditor

- `App.css` - Estilos principales de la aplicación

## 📱 Mobile (React Native)

### 📁 `mobile/StudyScribeMobile/` - App Móvil

#### 🎨 **Components** - Componentes Móviles
- `JSONEditor.tsx` - Editor de documentos JSON estructurados
- `JSONRenderer.tsx` - Renderizador de documentos para mobile
- `JSONRendererPreview.tsx` - Vista previa de documentos
- `AIBlockEditor.tsx` - Editor de bloques con IA
- `MermaidView.tsx` - Visualizador de flujogramas móvil
- `ModalEditor.tsx` - Editor modal para contenido

#### 📺 **Screens** - Pantallas de la App
- Pantallas de navegación principal
- Vista de grabación de audio
- Visualización de resultados
- Gestión de documentos

#### 🔌 **Services** - Clientes API Mobile
- `api.ts` - Cliente de API adaptado para React Native

#### 📱 **App Principal Mobile**
- `App.tsx` - Componente principal de la app móvil
- `AppNavigator.tsx` - Navegación principal

## 🔄 Shared - Recursos Compartidos

### 📁 `shared/types/` - Tipos TypeScript Compartidos
- `api.ts` - Interfaces de la API (original)
- `doc-blocks.ts` - **Tipos de bloques de contenido**:
  - `DocBlocksV2` - Estructura principal de documentos
  - Tipos para bloques específicos (conceptos, resúmenes, etc.)
- `index.ts` - **Exportaciones principales**:
  - `ApiResponse` - Interface estándar de respuestas
  - `API_BASE_URL` - URL base de la API
  - `SUPPORTED_SUBJECTS` - Materias soportadas

## 📚 Docs - Documentación

### 📁 `docs/architecture/` - Arquitectura del Sistema
- `file-reference.md` - Esta guía de referencia de archivos
- (Futuro) Diagramas de arquitectura y flujos de datos

## 🗃️ Archive - Archivos Históricos

### 📁 `archive/debug/` - Scripts de Debugging
- Scripts para testing de API
- Debug de procesamiento de audio
- Pruebas de integración con DeepSeek

### 📁 `archive/test/` - Archivos de Prueba
- Archivos de audio de prueba
- Scripts de testing antiguos
- PDFs generados de prueba

## 🔄 Flujo de Datos Principal

### 1. **Procesamiento de Audio**
```
Audio File → backend/src/routes/transcription.js → 
backend/src/services/transcriptionService.js → 
DeepSeek API → Texto Mejorado
```

### 2. **Estructuración V2**
```
Texto Mejorado → Procesamiento V2 → 
Generación de Bloques → Documento Estructurado
```

### 3. **Edición Frontend**
```
Documento → frontend/src/components/BlockEditor.tsx → 
Edición Usuario → frontend/src/services/api.ts → 
Actualización Backend
```

### 4. **Visualización Mobile**
```
Documento → mobile/components/JSONRenderer.tsx → 
Renderizado Mobile → Interacción Usuario
```

## 🎯 Tipos de Bloques Soportados

### Bloques Básicos
- `h1`, `h2`, `h3` - Encabezados
- `paragraph` - Párrafos de texto
- `bulleted_list`, `numbered_list` - Listas
- `quote` - Citas
- `code` - Bloques de código

### Bloques de IA Avanzados
- `concept_block` - Conceptos con definición y ejemplos
- `summary_block` - Resúmenes de contenido
- `key_concepts_block` - Lista de conceptos clave

## 🔧 Configuración y Variables de Entorno

### Backend (.env)
```env
DEEPSEEK_API_KEY=sk-...          # API Key de DeepSeek
PORT=3001                        # Puerto del servidor
WHISPER_API_KEY=...              # Key para transcripción
```

### Frontend
- Configuración en `shared/types/index.ts`
- URL base de la API compartida

## 🚀 Scripts y Comandos Importantes

### Backend
```bash
npm run dev          # Desarrollo con hot reload
npm start           # Producción
npm test           # Tests
```

### Frontend Web
```bash
npm start           # Servidor de desarrollo
npm run build       # Build de producción
npm test           # Tests
```

### Mobile
```bash
expo start          # Servidor de Expo
npm run android     # Build Android
npm run ios         # Build iOS
```

## 📊 Estructura de Datos

### Documento V2 (DocBlocksV2)
```typescript
interface DocBlocksV2 {
  doc_id: string;
  meta: {
    curso: string;
    asignatura: string;
    idioma: string;
  };
  blocks: Array<{
    id: string;
    type: string;           // Tipo de bloque
    text?: string;          // Texto para bloques simples
    items?: string[];       // Items para listas
    concepts?: string[];    // Conceptos para key_concepts_block
    term?: string;          // Término para concept_block
    definition?: string;    // Definición para concept_block
    examples?: string[];    // Ejemplos para concept_block
    content?: string;       // Contenido para summary_block
  }>;
}
```

## 🔮 Próximos Pasos de Desarrollo

### Mejoras Planeadas
1. **Base de datos persistente** para documentos
2. **Autenticación de usuarios**
3. **Sincronización entre web y mobile**
4. **Exportación a más formatos** (PDF, Word, etc.)
5. **Búsqueda semántica** en transcripciones

### Optimizaciones
- Mejorar gestión de estado en frontend
- Optimizar procesamiento de audio en backend
- Mejorar UI/UX en mobile
- Añadir testing automatizado

---

**Última actualización**: 2024-09-09
**Mantenedor**: [Tu nombre aquí]
**Estado**: En desarrollo activo