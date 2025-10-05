# Configuración de Google Sign-In para Dicttr Mobile

Esta guía te ayudará a configurar Google Sign-In para tu aplicación Expo con Supabase.

## ✅ Pasos Completados

1. **app.json configurado** - Añadido `"android.package": "com.dicttr.mobile"`
2. **EAS CLI instalado** - Configurado correctamente en el proyecto
3. **expo-updates instalado** - Dependencia necesaria para builds de desarrollo
4. **SHA-1 obtenida** - De las credenciales de EAS: `13:02:BE:CE:A9:8E:9E:AF:E8:AD:F5:5F:E8:84:21:C3:50:DC:D2:6C`
5. **Google Sign-In instalado** - `@react-native-google-signin/google-signin`
6. **Código implementado** - Servicio de autenticación y pantalla de login

## 📋 Próximos Pasos Manuales

### 3) Crear el cliente OAuth Android en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Navega a **APIs y servicios** → **Credenciales**
3. Haz clic en **Crear credenciales** → **ID de cliente de OAuth** → **Android**
4. Configura:
   - **Nombre del paquete:** `com.dicttr.mobile`
   - **Huella digital SHA-1:** `13:02:BE:CE:A9:8E:9E:AF:E8:AD:F5:5F:E8:84:21:C3:50:DC:D2:6C`

### 4) Crear el cliente OAuth Web

1. En el mismo menú → **Crear credenciales** → **ID de cliente de OAuth** → **Aplicación web**
2. Guarda estos valores:
   - **Client ID (WEB_CLIENT_ID)**
   - **Client Secret**

### 5) Activar Google en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/)
2. Selecciona tu proyecto
3. Navega a **Authentication** → **Providers** → **Google**
4. Activa Google y configura:
   - **Client ID:** (el WEB_CLIENT_ID del paso 4)
   - **Client Secret:** (el secreto del cliente Web)
5. Guarda los cambios

### 6) Configurar Variables de Entorno

1. Copia el archivo `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edita el archivo `.env` y rellena los valores:
   ```
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu_google_web_client_id_aqui
   EXPO_PUBLIC_SUPABASE_URL=tu_supabase_url_aqui
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_supabase_anon_key_aqui
   ```

### 7) Probar la Autenticación

1. **Para desarrollo:** Usa un Development Build de Expo
   ```bash
   npx eas-cli build -p android --profile development
   ```

2. **Para producción:** Crea un build de producción
   ```bash
   npx eas-cli build -p android --profile production
   ```

## 🛠️ Código Implementado

### Servicio de Autenticación (`services/googleAuth.ts`)
- `signInWithGoogle()` - Inicia sesión con Google
- `signOutFromGoogle()` - Cierra sesión
- `getCurrentUser()` - Obtiene usuario actual
- `isSignedIn()` - Verifica si hay sesión activa

### Pantalla de Login (`screens/LoginScreen.tsx`)
- Interfaz de usuario para autenticación
- Manejo de estados de carga
- Verificación de estado de autenticación

## 🔧 Solución de Problemas Comunes

### DEVELOPER_ERROR (10) al hacer signIn
- **Causa:** android.package no coincide o SHA-1 no cargada
- **Solución:** Revisa app.json y la SHA-1 del build que estás usando

### idToken viene null
- **Causa:** No estás usando el WEB_CLIENT_ID
- **Solución:** Usa el client id del cliente Web (no el Android)

### Supabase responde "invalid token"
- **Causa:** Token caducado o credenciales mal configuradas
- **Solución:** Revisa Client ID/Secret en Supabase

### Solo entran algunas cuentas
- **Causa:** Pantalla de consentimiento en modo Testing
- **Solución:** Añade usuarios de prueba o pasa a "In production"

## 📱 Uso en la Aplicación

```typescript
import { signInWithGoogle, signOutFromGoogle } from '../services/googleAuth';

// Iniciar sesión
const user = await signInWithGoogle();

// Cerrar sesión
await signOutFromGoogle();

// Verificar estado
const signedIn = await isSignedIn();
```

## 🔒 Consideraciones de Seguridad

- Nunca commits el archivo `.env` real
- Usa variables de entorno para credenciales
- Configura correctamente las restricciones en Google Cloud Console
- Mantén actualizadas las huellas digitales SHA-1

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs de la aplicación
2. Verifica las credenciales en Google Cloud Console
3. Confirma la configuración en Supabase Dashboard
4. Consulta la documentación oficial de [Expo Google Sign-In](https://docs.expo.dev/versions/latest/sdk/google-sign-in/)
