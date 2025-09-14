# Usar Node.js 18 como imagen base
FROM node:18-alpine

# Instalar dependencias del sistema necesarias para Puppeteer/Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Establecer variable de entorno para Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar solo los archivos esenciales primero
COPY package.json package-lock.json* ./

# Instalar dependencias de producción
RUN npm ci --only=production --ignore-scripts

# Copiar el código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p uploads exports temp

# Exponer el puerto
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["node", "src/server.js"]
