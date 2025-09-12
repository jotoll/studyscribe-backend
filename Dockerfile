# Usar Node.js 18 como imagen base
FROM node:18-alpine

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
