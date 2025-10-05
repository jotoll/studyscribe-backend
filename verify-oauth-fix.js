const axios = require('axios');

// URL del backend
const API_BASE_URL = 'https://studyscribe.zingyzong.com/api';

async function verifyOAuthFix() {
  console.log('🔍 Verificando si el problema de OAuth está resuelto...');
  
  try {
    // 1. Probar el endpoint de prueba
    console.log('\n📍 1. Probando conexión con Supabase...');
    const testResponse = await axios.get(`${API_BASE_URL}/auth/oauth/test`);
    
    if (testResponse.data.success) {
      console.log('✅ Conexión con Supabase funcionando correctamente');
    } else {
      console.log('❌ Error en la conexión con Supabase');
      console.log('   Error:', testResponse.data.error);
      return false;
    }
    
    // 2. Probar el endpoint de OAuth
    console.log('\n📍 2. Probando endpoint de OAuth...');
    const oauthResponse = await axios.get(`${API_BASE_URL}/auth/oauth/google/url`, {
      params: {
        redirectTo: 'https://studyscribe.zingyzong.com/api/auth/oauth/callback'
      }
    });
    
    if (oauthResponse.data.success && oauthResponse.data.data?.url) {
      console.log('✅ URL de OAuth generada correctamente');
      console.log('   URL:', oauthResponse.data.data.url);
      
      // Verificar si la URL contiene el dominio de Google
      if (oauthResponse.data.data.url.includes('google.com')) {
        console.log('✅ URL contiene el dominio de Google');
        console.log('🎉 El problema de OAuth está resuelto');
        return true;
      } else {
        console.log('❌ URL no contiene el dominio de Google');
        console.log('   Esto indica que el proveedor de Google no está configurado en Supabase');
        console.log('\n🔧 Pasos para configurar OAuth en Supabase:');
        console.log('   1. Ir a https://supabase.com/dashboard');
        console.log('   2. Seleccionar el proyecto: sspkltkalkcwwfapfjuy');
        console.log('   3. Navegar a Authentication > Providers');
        console.log('   4. Habilitar el proveedor de Google');
        console.log('   5. Configurar las credenciales:');
        console.log('      - Client ID: 566515736319-3djnh9odh9hao9r6pp5hgkq6icqm8v43.apps.googleusercontent.com');
        console.log('      - Client Secret: (obtener de Google Cloud Console)');
        console.log('   6. Añadir URL de callback: https://studyscribe.zingyzong.com/api/auth/oauth/callback');
        console.log('   7. Guardar los cambios');
        console.log('   8. Esperar unos minutos y probar de nuevo');
        return false;
      }
    } else {
      console.log('❌ Error al generar URL de OAuth');
      console.log('   Error:', oauthResponse.data.error || 'Unknown error');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Error al verificar OAuth:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    } else {
      console.log('   Message:', error.message);
    }
    return false;
  }
}

// Función para verificar si el backend está actualizado
async function checkBackendVersion() {
  console.log('\n📍 3. Verificando si el backend está actualizado...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/oauth/test`);
    
    if (response.data.timestamp) {
      const deployTime = new Date(response.data.timestamp);
      const currentTime = new Date();
      const timeDiff = currentTime - deployTime;
      
      console.log(`✅ Backend actualizado hace ${Math.floor(timeDiff / 60000)} minutos`);
      return true;
    } else {
      console.log('❌ No se pudo verificar la versión del backend');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error al verificar la versión del backend:', error.message);
    return false;
  }
}

// Ejecutar la verificación
async function main() {
  console.log('==========================================');
  console.log('  Verificación de la Solución de OAuth');
  console.log('==========================================');
  
  const backendUpdated = await checkBackendVersion();
  const oauthFixed = await verifyOAuthFix();
  
  console.log('\n==========================================');
  console.log('  Resumen de la Verificación');
  console.log('==========================================');
  console.log(`Backend actualizado: ${backendUpdated ? '✅' : '❌'}`);
  console.log(`OAuth funcionando: ${oauthFixed ? '✅' : '❌'}`);
  
  if (oauthFixed) {
    console.log('\n🎉 ¡El problema de OAuth está resuelto!');
    console.log('💡 Ahora puedes probar el login con Google en la app móvil');
  } else {
    console.log('\n❌ El problema de OAuth aún no está resuelto');
    console.log('💡 Sigue los pasos de configuración en Supabase');
  }
  
  console.log('\n📝 Comandos útiles:');
  console.log('   - Verificar configuración de OAuth: node check-supabase-oauth-config.js');
  console.log('   - Probar endpoint de OAuth: node test-oauth-endpoint.js');
  console.log('   - Probar conexión con Supabase: node test-oauth-connection.js');
}

// Ejecutar la verificación
main();