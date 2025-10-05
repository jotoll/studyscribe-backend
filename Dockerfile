# Usar Node.js 18 como imagen base con Chromium para generación de PDFs
FROM node:20-alpine

# Instalar Chromium, wget y dependencias necesarias para html-pdf-node
RUN apk add --no-cache \
    chromium \
    wget \
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

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar solo los archivos esenciales primero
COPY package.json package-lock.json* ./

# Instalar todas las dependencias (incluyendo devDependencies para build)
RUN npm ci --ignore-scripts

# Copiar el código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p uploads exports temp

# Ejecutar npm audit fix para resolver vulnerabilidades
RUN npm audit fix --force || true

# Limpiar cache de npm para reducir tamaño de imagen
RUN npm cache clean --force

# Exponer el puerto
EXPOSE 3001

# Comando para iniciar la aplicación
CMD ["node", "src/server.js"]
