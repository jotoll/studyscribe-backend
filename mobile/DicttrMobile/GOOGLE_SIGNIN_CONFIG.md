# Configuración de Google Sign-In para DicttrMobile

## Información obtenida de EAS Build

### SHA-1 Fingerprint (Development)
```
13:02:BE:CE:A9:8E:9E:AF:E8:AD:F5:5F:E8:84:21:C3:50:DC:D2:6C
```

### Package Name
```
com.dicttr.mobile
```

## Pasos para completar la configuración

### 1. Crear Cliente OAuth Android en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Navega a **APIs y servicios** → **Credenciales**
3. Haz clic en **Crear credenciales** → **ID de cliente de OAuth**
4. Selecciona **Android**
5. Configura:
   - **Nombre**: DicttrMobile Android
   - **Nombre del paquete**: `com.dicttr.mobile`
   - **Huella digital SHA-1**: `13:02:BE:CE:A9:8E:9E:AF:E8:AD:F5:5F:E8:84:21:C3:50:DC:D2:6C`

### 2. Crear Cliente OAuth Web en Google Cloud Console

1. En el mismo menú, haz clic en **Crear credenciales** → **ID de cliente de OAuth**
2. Selecciona **Aplicación web**
3. Configura:
   - **Nombre**: DicttrMobile Web
   - **Orígenes autorizados de JavaScript**: (dejar vacío por ahora)
   - **URI de redirección autorizados**: (dejar vacío por ahora)

4. **Guarda el Client ID y Client Secret** del cliente Web - estos se usarán en el código

### 3. Configurar Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard/)
2. Selecciona tu proyecto
3. Ve a **Authentication** → **Providers** → **Google**
4. Activa Google y configura:
   - **Client ID**: (el Client ID del cliente Web)
   - **Client Secret**: (el Client Secret del cliente Web)

### 4. Configurar variables de entorno

Asegúrate de que tu archivo `.env` tenga:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=tu_client_id_del_cliente_web_aqui
EXPO_PUBLIC_SUPABASE_URL=tu_url_de_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
EXPO_PUBLIC_API_URL=tu_url_de_api
```

### 5. Código de Google Sign-In

El código ya está implementado en:
- `services/googleAuth.ts`
- `screens/LoginScreen.tsx`
- `components/OAuthButtons.tsx`

### 6. Próximos pasos

Una vez que tengas el Development Build funcionando:

1. **Instala el APK** en tu dispositivo/emulador
2. **Prueba el login con Google**
3. Si funciona, considera crear un **build de release** para obtener la SHA-1 de release
4. Añade la SHA-1 de release al cliente OAuth Android en Google Cloud Console

## Solución de problemas comunes

### DEVELOPER_ERROR (10)
- Verifica que `android.package` en `app.json` coincida exactamente
- Verifica que la SHA-1 esté correctamente añadida en Google Cloud Console

### idToken viene null
- Asegúrate de usar el **Client ID del cliente Web** en `GoogleSignin.configure()`

### Supabase responde "invalid token"
- Verifica que Client ID y Secret estén correctamente configurados en Supabase
- Asegúrate de obtener el idToken justo antes de llamar a Supabase

### Solo entran algunas cuentas
- Añade usuarios de prueba en Google Cloud Console o pasa a "In production"
