# Configuración de Google Sign-In para Dicttr Mobile

Esta documentación contiene la configuración completa de Google Sign-In para la aplicación móvil.

## ✅ Configuración Completada

### 1. **Configuración de Google Cloud Console**

- **Package Name**: `com.dicttr.mobile`
- **SHA-1 Fingerprint**: `13:02:BE:CE:A9:8E:9E:AF:E8:AD:F5:5F:E8:84:21:C3:50:DC:D2:6C`
- **Cliente OAuth Android**: Creado
- **Cliente OAuth Web**: Creado con Client ID: `566515736319-sdiamlgig97o7l2r1s1qli96cerur61m.apps.googleusercontent.com`

### 2. **Configuración de Supabase**

- **URL**: `https://sspkltkalkcwwfapfjuy.supabase.co`
- **Service Key**: Configurado
- **Callback URL**: `https://sspkltkalkcwwfapfjuy.supabase.co/auth/v1/callback`

### 3. **Configuración de la Aplicación Móvil**

Los archivos de configuración se encuentran en `mobile/DicttrMobile/`:

- `services/googleAuth.ts` - Servicio de autenticación completo
- `screens/LoginScreen.tsx` - Pantalla de login funcional
- `.env.example` - Plantilla de variables de entorno
- `eas.json` - Configuración de EAS Build
- `GOOGLE_SIGNIN_SETUP.md` - Documentación detallada

### 4. **Variables de Entorno Requeridas**

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=566515736319-sdiamlgig97o7l2r1s1qli96cerur61m.apps.googleusercontent.com
EXPO_PUBLIC_SUPABASE_URL=https://sspkltkalkcwwfapfjuy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_UhOoidt4esTgihItpipCpw_-wDXgOL_
EXPO_PUBLIC_API_URL=https://studyscribe.zingyzong.com
```

## 📋 Próximos Pasos

### 1. **Configurar Supabase Auth**
- Ve a Supabase Dashboard → Authentication → Providers → Google
- Activa Google con el Client ID y Client Secret del cliente OAuth Web

### 2. **Añadir Usuarios de Prueba**
- Google Cloud Console → Pantalla de consentimiento → Pestaña "Público"
- Añade emails de prueba en "Usuarios de prueba"

### 3. **Crear Development Build**
```bash
cd mobile/DicttrMobile
npx eas-cli build -p android --profile development
```

## 🚀 Para Despliegue

La aplicación está configurada para usar EAS Build. Para crear builds de producción:

```bash
npx eas-cli build -p android --profile production
```

## 📞 Soporte

Si encuentras problemas:
1. Revisa la documentación en `mobile/DicttrMobile/GOOGLE_SIGNIN_SETUP.md`
2. Verifica las credenciales en Google Cloud Console
3. Confirma la configuración en Supabase Dashboard
