# Usar Node.js 18 como imagen base
FROM node:18-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Instalar dependencias del sistema para compilar módulos nativos
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    giflib-dev \
    libjpeg-turbo-dev \
    librsvg-dev

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el código fuente
COPY . .

# Crear directorios necesarios
RUN mkdir -p uploads exports temp

# Establecer permisos
RUN chmod -R 755 uploads exports temp

# Exponer el puerto
EXPOSE 3001

# Copiar archivo de entorno de producción
COPY .env.production .env

# Comando para iniciar la aplicación
CMD ["sh", "-c", "cp .env.production .env && node src/server.js"]
