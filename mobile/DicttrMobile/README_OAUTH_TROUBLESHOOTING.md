# Solución de Problemas de OAuth con Google

## Problema Identificado

El login con Google en la app móvil DicttrMobile muestra el error "Internal server error" cuando se intenta autenticar con OAuth.

## Diagnóstico

### 1. Problema en el Backend
- El endpoint `/auth/oauth/google/url` devuelve un error 500
- El problema está relacionado con la configuración de OAuth en Supabase

### 2. Causas Posibles
1. **Proveedor de Google no configurado en Supabase**
2. **Credenciales de OAuth inválidas**
3. **URL de callback no registrada en Google Cloud Console**
4. **Problemas de red o firewall**

## Soluciones Implementadas

### 1. Mejoras en el Backend

#### Logging Mejorado
Se añadió logging detallado en el endpoint de OAuth para facilitar la depuración:

```javascript
console.log(`[OAuth] Generating URL for provider: ${provider}`);
console.log(`[OAuth] Redirect to: ${redirectTo}`);
console.log(`[OAuth] Calling Supabase signInWithOAuth for ${provider}`);
console.log(`[OAuth] URL generated successfully: ${data.url}`);
```

#### Manejo de Errores Mejorado
Se mejoró el manejo de errores para incluir detalles específicos:

```javascript
res.status(500).json({ 
  error: 'Internal server error', 
  details: error.message 
});
```

#### Endpoint de Prueba
Se añadió un endpoint de prueba para verificar la conexión con Supabase:

```javascript
// GET /auth/oauth/test
router.get('/oauth/test', (req, res) => {
  // Verifica la conexión con Supabase
});
```

### 2. Mejoras en el Frontend

#### Manejo de Errores
Se mejoró el manejo de errores en el componente OAuthButtons:

```javascript
if (error.message?.includes('Internal server error')) {
  Alert.alert(
    'Servicio No Disponible', 
    'El servicio de autenticación con Google está en mantenimiento. Por favor, usa el email y contraseña para iniciar sesión.',
    [{ text: 'OK' }]
  );
}
```

#### Feedback Visual
Se añadió un indicador de carga durante el proceso de OAuth:

```javascript
{loading ? (
  <ActivityIndicator color="#ffffff" size="small" />
) : (
  <Text style={styles.buttonText}>Continuar con Google</Text>
)}
```

## Pasos para Solucionar el Problema

### 1. Configurar OAuth en Supabase

1. **Ir al panel de Supabase**: https://supabase.com/dashboard
2. **Seleccionar el proyecto**
3. **Navegar a Authentication > Providers**
4. **Habilitar el proveedor de Google**
5. **Configurar Client ID y Client Secret**
6. **Añadir URL de callback**: `https://studyscribe.zingyzong.com/api/auth/oauth/callback`

### 2. Configurar OAuth en Google Cloud Console

1. **Ir a Google Cloud Console**: https://console.cloud.google.com
2. **Seleccionar el proyecto**
3. **Navegar a APIs & Services > Credentials**
4. **Crear o configurar las credenciales de OAuth 2.0**
5. **Añadir URL de callback**: `https://studyscribe.zingyzong.com/api/auth/oauth/callback`

### 3. Deploy del Backend

1. **Hacer commit de los cambios**:
   ```bash
   git add src/routes/auth.js
   git commit -m "Fix OAuth Google login - Add logging and test endpoint"
   git push origin main
   ```

2. **Activar deploy en Coolify**:
   - Ir al panel de Coolify
   - Seleccionar el servicio backend
   - Activar deploy manual o esperar a que se active automáticamente

### 4. Verificar el Funcionamiento

1. **Probar el endpoint de prueba**:
   ```bash
   curl https://studyscribe.zingyzong.com/api/auth/oauth/test
   ```

2. **Probar el endpoint de OAuth**:
   ```bash
   curl "https://studyscribe.zingyzong.com/api/auth/oauth/google/url?redirectTo=https://studyscribe.zingyzong.com/api/auth/oauth/callback"
   ```

3. **Probar en la app móvil**:
   - Abrir la app
   - Intentar login con Google
   - Verificar que funciona correctamente

## Scripts de Diagnóstico

### 1. Test de Endpoint de OAuth
```bash
node test-oauth-endpoint.js
```

### 2. Test de Conexión con Supabase
```bash
node test-supabase-oauth.js
```

### 3. Test de Conexión con Backend
```bash
node test-oauth-connection.js
```

### 4. Deploy Automático
```bash
node deploy-oauth-fix.js
```

## Solución Temporal

Mientras se soluciona el problema de OAuth, la app mostrará un mensaje claro indicando que el servicio no está disponible y sugiriendo usar el login con email y contraseña.

## Próximos Pasos

1. **Configurar OAuth en Supabase y Google Cloud Console**
2. **Hacer deploy del backend con los cambios**
3. **Verificar que el login con Google funciona**
4. **Monitorear los logs para detectar problemas futuros**

## Contacto

Si el problema persiste después de seguir estos pasos, contacta al equipo de desarrollo con:

- Logs del servidor
- Capturas de pantalla de los errores
- Detalles de la configuración de OAuth