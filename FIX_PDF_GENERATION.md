# Solución para Generación de PDFs en Servidor

## Problema
La generación de PDFs funcionaba correctamente en entorno local pero fallaba en el servidor debido a que la librería `html-pdf-node` (que utiliza Puppeteer internamente) requiere Chromium y dependencias del sistema que no estaban disponibles en la imagen base Alpine Linux.

## Solución Implementada

### 1. Actualización de Dockerfiles
Se modificaron todos los Dockerfiles para incluir las dependencias necesarias de Chromium:

```dockerfile
# Instalar Chromium y dependencias necesarias para html-pdf-node
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Establecer variables de entorno para Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 2. Dependencias Instaladas
- **chromium**: El navegador Chromium necesario para la generación de PDFs
- **nss**: Network Security Services para SSL/TLS
- **freetype**: Biblioteca para renderizado de fuentes
- **harfbuzz**: Motor de shaping de texto
- **ca-certificates**: Certificados SSL
- **ttf-freefont**: Fuentes TrueType gratuitas

### 3. Variables de Entorno Configuradas
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`: Evita que Puppeteer descargue Chromium (ya lo tenemos instalado)
- `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser`: Especifica la ruta del ejecutable de Chromium

## Dockerfiles Actualizados
- `Dockerfile` - Versión principal
- `Dockerfile.production` - Para producción
- `Dockerfile.final` - Versión final

## Pruebas de Verificación

### Test Rápido
```bash
cd backend
node quick-pdf-test.js
```

### Test Completo
```bash
cd backend
node test-pdf-generation.js
```

### Test Endpoint
También se puede probar el endpoint directamente:
```bash
curl -X POST http://localhost:3001/api/transcription/export-pdf \
  -H "Content-Type: application/json" \
  -d '{"content":"Contenido de prueba para PDF"}'
```

## Resultados Esperados
- ✅ PDF generado exitosamente
- ✅ Tamaño del buffer mayor a 0 bytes
- ✅ Archivo PDF guardado en directorio `exports/`
- ✅ Sin errores relacionados con Chromium

## Consideraciones para Despliegue

### 1. Reconstruir la Imagen Docker
Es necesario reconstruir la imagen Docker para incluir las nuevas dependencias:

```bash
docker build -t studyscribe-backend .
```

### 2. Variables de Entorno
Asegurarse de que las variables de entorno estén configuradas correctamente en el servidor:

```bash
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

### 3. Permisos
Verificar que el directorio `exports/` tenga permisos de escritura:

```bash
chmod -R 755 exports/
```

## Solución Alternativa (Si persisten problemas)
Si aún hay problemas, se puede considerar cambiar la imagen base de Alpine a una distribución más completa:

```dockerfile
FROM node:18-bullseye  # En lugar de node:18-alpine
```

## Archivos Modificados
- `Dockerfile`
- `Dockerfile.production` 
- `Dockerfile.final`
- `test-pdf-generation.js` (nuevo)
- `quick-pdf-test.js` (nuevo)

## Estado Actual
La generación de PDFs debería funcionar correctamente tanto en entorno local como en servidor después de reconstruir las imágenes Docker con las nuevas dependencias.
