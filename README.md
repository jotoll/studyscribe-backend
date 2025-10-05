# Dicttr Backend

Backend API para la aplicación Dicttr - Sistema de transcripción y gestión de apuntes.

## Características

- ✅ Transcripción de audio a texto con Whisper
- ✅ Estructuración de contenido con DeepSeek/Groq
- ✅ Gestión de carpetas y etiquetas
- ✅ Exportación a PDF
- ✅ Autenticación con Supabase
- ✅ API RESTful completa

## Despliegue en Coolify

### Configuración requerida

1. **Variables de entorno necesarias:**
   - `DEEPSEEK_API_KEY`: Clave API de DeepSeek
   - `GROQ_API_KEY`: Clave API de Groq
   - `SUPABASE_URL`: URL de tu proyecto Supabase
   - `SUPABASE_SERVICE_KEY`: Clave de servicio de Supabase
   - `JWT_SECRET`: Secreto para JWT (puede ser cualquier string seguro)

2. **Configuración en Coolify:**
   - Usar el archivo `coolify.json` para importar automáticamente
   - Puerto: 3001
   - Volúmenes: uploads, exports, temp

### Pasos para desplegar

1. Conectar el repositorio en Coolify
2. Configurar las variables de entorno
3. Desplegar automáticamente

## Pruebas desde móvil

### Para probar con Expo desde otro móvil:

1. **Configurar la app móvil:**
   ```javascript
   // En mobile/DicttrMobile/services/config.ts
   export const API_BASE_URL = 'https://tu-dominio-en-coolify.com';
   ```

2. **Ejecutar la app móvil:**
   ```bash
   cd mobile/DicttrMobile
   npx expo start --tunnel
   ```

3. **Escanear el código QR** desde el otro móvil con la app Expo Go

### Variables de entorno para desarrollo móvil

```bash
# En el archivo .env del backend (para desarrollo local)
BASE_URL=http://localhost:3001
ALLOWED_ORIGINS=exp://*
```

## Estructura del proyecto

```
src/
├── app.js              # Aplicación principal Express
├── server.js           # Servidor HTTP
├── config/             # Configuraciones
├── middleware/         # Middlewares de autenticación
├── routes/             # Rutas de la API
├── services/           # Servicios de negocio
└── types/              # Definiciones de tipos
```

## API Endpoints

### Transcripciones
- `POST /api/transcribe` - Subir y transcribir audio
- `GET /api/transcriptions` - Listar transcripciones
- `GET /api/transcriptions/:id` - Obtener transcripción
- `PUT /api/transcriptions/:id` - Actualizar transcripción
- `DELETE /api/transcriptions/:id` - Eliminar transcripción

### Carpetas
- `GET /api/folders` - Listar carpetas
- `POST /api/folders` - Crear carpeta
- `PUT /api/folders/:id` - Actualizar carpeta
- `DELETE /api/folders/:id` - Eliminar carpeta

### Etiquetas
- `GET /api/tags` - Listar etiquetas
- `POST /api/tags` - Crear etiqueta
- `PUT /api/tags/:id` - Actualizar etiqueta
- `DELETE /api/tags/:id` - Eliminar etiqueta

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## Scripts de base de datos

Los scripts para configurar la base de datos se encuentran en `scripts/`:

- `add-folders-support.sql` - Soporte para carpetas
- `add-tags-support.sql` - Soporte para etiquetas
- `run-schema.js` - Ejecutar esquemas automáticamente

## Volúmenes Docker

El backend requiere los siguientes volúmenes:
- `uploads/` - Archivos de audio subidos
- `exports/` - Archivos PDF generados
- `temp/` - Archivos temporales

## Troubleshooting

### Problemas comunes

1. **Error de CORS:** Verificar `ALLOWED_ORIGINS` incluye el dominio de la app móvil
2. **Error de autenticación:** Verificar claves de Supabase
3. **Error de transcripción:** Verificar claves API de DeepSeek/Groq

### Logs

Los logs están disponibles en:
- Desarrollo: Consola
- Producción: Logs de Coolify

## Licencia

MIT License
