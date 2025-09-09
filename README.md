# 📚 StudyScribe

**Sistema completo para procesamiento y mejora de transcripciones con IA** - Herramienta definitiva para estudiantes que quieren optimizar su aprendizaje con inteligencia artificial.

## 🏗️ Nueva Estructura del Proyecto

```
studyscribe/
├── backend/                 # API Node.js + Express
│   ├── src/
│   │   ├── routes/         # Endpoints de la API
│   │   ├── services/       # Lógica de negocio
│   │   ├── models/         # Modelos de datos
│   │   └── config/         # Configuración
│   ├── package.json
│   └── .env
├── frontend/                # Aplicación web React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── services/       # Clientes API
│   │   └── App.tsx
│   └── package.json
├── mobile/                  # Aplicación móvil React Native
│   └── StudyScribeMobile/
│       ├── components/     # Componentes móviles
│       ├── screens/        # Pantallas
│       ├── services/       # Clientes API
│       └── App.tsx
├── shared/                  # Recursos compartidos
│   ├── types/              # Tipos TypeScript
│   └── utils/              # Utilidades comunes
├── docs/                   # Documentación
│   └── architecture/       # Diagramas de arquitectura
├── archive/                # Archivos históricos/debug
│   ├── debug/              # Scripts de debugging
│   └── test/               # Archivos de prueba
└── README.md
```

## 🎯 Flujo Principal

1. **📱 Graba tu clase** en tiempo real con tu móvil
2. **🎤 Transcripción automática** del audio grabado  
3. **🤖 Mejora con IA (DeepSeek)** - estructura, definiciones y ejemplos
4. **📚 Material de estudio** - resúmenes, flashcards, conceptos y quizzes

## 🚀 Características

### App Móvil (React Native/Expo)
- **Grabación en tiempo real** durante las clases
- **Interfaz intuitiva** con timer y controles grandes
- **Selector de materias** para IA especializada
- **Procesamiento automático** al finalizar grabación
- **Vista de resultados** con transcripción mejorada

### Backend Inteligente  
- **DeepSeek API** para mejora de contenido educativo
- **Prompts especializados** por materia (medicina, ingeniería, etc.)
- **Generación de material** de estudio automático
- **API REST** escalable y moderna

### Web Dashboard
- **Interfaz complementaria** para revisión detallada
- **Gestión de transcripciones** y material generado
- **Exportación** a diferentes formatos

## 🏗️ Arquitectura

### Backend (Node.js + Express)
- **API REST** para transcripción y mejora de contenido
- **Integración con DeepSeek API** para procesamiento de IA
- **Subida de archivos** de audio con Multer
- **Base para expansión** con PostgreSQL

### Frontend (React + TypeScript)
- **Interfaz moderna** y responsive
- **Subida de archivos** drag & drop
- **Visualización mejorada** de contenido
- **Generación interactiva** de material de estudio

## 🛠️ Instalación y Uso

### Prerrequisitos
- Node.js 18+
- NPM o Yarn
- Cuenta en DeepSeek AI

### 1. Clonar y configurar
```bash
git clone <repo-url>
cd estudio-activo
```

### 2. Configurar Backend
```bash
cd backend
npm install

# Crear archivo .env con tu API key de DeepSeek
echo "DEEPSEEK_API_KEY=sk-your-api-key" > .env
echo "PORT=3001" >> .env

# Iniciar servidor backend
npm run dev
```

### 3. Configurar Frontend
```bash
cd ../frontend
npm install

# Iniciar servidor frontend
npm start
```

### 4. Usar la aplicación
1. Abre http://localhost:3000 en tu navegador
2. Selecciona la materia de tu clase
3. **Opción A**: Sube un archivo de audio (.mp3, .wav, .m4a)
4. **Opción B**: Pega el texto de tu transcripción
5. Haz clic en "Mejorar con IA"
6. Genera material de estudio (resúmenes, flashcards, etc.)

## 📋 Endpoints API

### POST `/api/transcription/enhance`
Mejora una transcripción existente
```json
{
  "text": "Texto de la transcripción original",
  "subject": "medicina"
}
```

### POST `/api/transcription/upload`
Sube y transcribe archivo de audio
```json
FormData: {
  "audio": file,
  "subject": "ciencias"
}
```

### POST `/api/transcription/generate-material`
Genera material de estudio
```json
{
  "text": "Texto base para generar material",
  "type": "summary|flashcards|concepts|quiz"
}
```

## 🤖 Integración con DeepSeek

La aplicación utiliza la API de DeepSeek para:

### Mejora de Transcripciones
- **Corrección de errores** de transcripción automática
- **Eliminación de muletillas** y repeticiones
- **Estructuración clara** con formato Markdown
- **Definiciones de conceptos** clave identificados

### Generación de Material
- **Resúmenes estructurados** por secciones
- **Flashcards** en formato JSON con preguntas/respuestas
- **Conceptos clave** con definiciones y ejemplos
- **Quizzes** de opción múltiple para autoevaluación

### Prompts Especializados
```javascript
// Ejemplo para medicina
"Enfócate en terminología médica, procesos fisiológicos y casos clínicos"

// Ejemplo para ingeniería  
"Prioriza fórmulas, procesos técnicos y aplicaciones prácticas"
```

## 📊 Ejemplo de Uso

### Entrada (transcripción básica):
```
"Hoy vamos a ver fotosintesis. Es un proceso muy importante para las plantas"
```

### Salida (mejorada por IA):
```markdown
# Clase: Introducción a la Fotosíntesis

## 📘 Definición y Relevancia
La **fotosíntesis** es un proceso bioquímico fundamental mediante el cual las plantas, algas y algunas bacterias convierten la energía lumínica en energía química...

## 🔬 Ecuación general simplificada
**6CO₂ + 6H₂O + energía lumínica → C₆H₁₂O₆ + 6O₂**
```

## 🔄 Próximos Pasos

### Fase 2 (Funcionalidades Avanzadas)
- [ ] Búsqueda semántica en transcripciones
- [ ] Base de datos PostgreSQL para persistencia
- [ ] Autenticación de usuarios
- [ ] Dashboard con métricas de progreso

### Fase 3 (Escalabilidad)
- [ ] App móvil React Native
- [ ] Modo offline con sincronización
- [ ] Integración con LMS (Moodle, Canvas)
- [ ] API pública para terceros

## 📝 Licencia

MIT License - Ver archivo `LICENSE` para más detalles.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**Desarrollado con ❤️ para estudiantes universitarios**