# Guía de Deploy en Coolify

## Configuración Optimizada

He creado una configuración optimizada específicamente para Coolify que resuelve el problema del health check que estaba fallando.

### Archivos Modificados

1. **`docker-compose.coolify.yml`** - Configuración optimizada con health check funcional usando `wget`
2. **`Dockerfile`** - Ahora incluye `wget` para el health check
3. **`coolify.json`** - Actualizado para usar la nueva configuración

### Pasos para el Deploy en Coolify

#### 1. Configurar Variables de Entorno en Coolify

Asegúrate de configurar las siguientes variables de entorno en Coolify:

- `NODE_ENV=production`
- `PORT=3001`
- `BASE_URL=https://studyscribe.zingyzong.com`
- `DEEPSEEK_API_KEY` (tu clave API de DeepSeek)
- `GROQ_API_KEY` (tu clave API de Groq)
- `SUPABASE_URL` (tu URL de Supabase)
- `SUPABASE_SERVICE_KEY` (tu clave de servicio de Supabase)
- `JWT_SECRET` (una clave secreta para JWT)
- `ALLOWED_ORIGINS=*`

#### 2. Configurar el Proyecto en Coolify

1. Ve a tu instancia de Coolify
2. Crea un nuevo proyecto o selecciona el existente
3. Configura la fuente como "Git Repository" con tu repositorio
4. Coolify detectará automáticamente el archivo `coolify.json`

#### 3. Verificar la Configuración

Asegúrate de que Coolify esté usando:
- **Docker Compose File:** `docker-compose.coolify.yml`
- **Puerto:** `3001`
- **Health Check:** Configurado correctamente con `wget`

#### 4. Realizar el Deploy

1. Inicia el proceso de deploy
2. Monitorea los logs durante el despliegue
3. Verifica que el health check pase correctamente

### Solución de Problemas Comunes

#### Si el health check falla:
- Verifica que `wget` esté instalado (ya está incluido en el Dockerfile actualizado)
- Revisa los logs del contenedor para ver errores de inicio

#### Si no puedes acceder al servidor:
- Verifica que el puerto 3001 esté expuesto correctamente
- Revisa las reglas de firewall en Hetzner
- Comprueba que las variables de entorno estén configuradas correctamente

#### Si hay errores de conexión con APIs externas:
- Verifica que las claves API estén correctas
- Asegúrate de que el servidor tenga acceso a internet
- Revisa los logs para errores específicos de conexión

### Verificación del Deploy Exitoso

Una vez desplegado, puedes verificar que el servidor esté funcionando:

1. **Health Check:** `https://studyscribe.zingyzong.com/health` debería devolver `{"status":"OK"}`
2. **API Base:** `https://studyscribe.zingyzong.com/` debería devolver `{"message":"Dicttr API v1.0"}`

### Cambios Realizados

- **Health Check:** Cambiado de `nc` (netcat) a `wget` que funciona en Alpine Linux
- **Dockerfile:** Agregado `wget` a las dependencias
- **Configuración:** Simplificada y optimizada para Coolify

Esta configuración debería resolver los problemas de acceso al servidor que estabas experimentando.
