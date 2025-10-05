const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const supabaseUrl = 'https://sspkltkalkcwwfapfjuy.supabase.co';
const supabaseKey = 'sb_secret_2agCyjiQouC6OOuk_xn6vQ_3MwkC9Hd';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSupabaseOAuthConfig() {
  console.log('🔍 Verificando configuración de OAuth en Supabase...');
  
  try {
    // Verificar si el proveedor de Google está configurado
    console.log('\n📍 Probando signInWithOAuth con Google...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://studyscribe.zingyzong.com/api/auth/oauth/callback',
        skipBrowserRedirect: true // No redirigir automáticamente
      }
    });
    
    if (error) {
      console.error('❌ Error de Supabase:');
      console.error('   Message:', error.message);
      console.error('   Status:', error.status);
      
      // Analizar el error
      if (error.message.includes('not configured')) {
        console.log('\n🔧 Solución: El proveedor de Google no está configurado en Supabase');
        console.log('   1. Ve al panel de Supabase: https://supabase.com/dashboard');
        console.log('   2. Selecciona el proyecto: sspkltkalkcwwfapfjuy');
        console.log('   3. Navega a Authentication > Providers');
        console.log('   4. Habilita el proveedor de Google');
        console.log('   5. Configura las credenciales de OAuth de Google');
        console.log('   6. Añade URL de callback: https://studyscribe.zingyzong.com/api/auth/oauth/callback');
      } else if (error.message.includes('invalid')) {
        console.log('\n🔧 Solución: Las credenciales de OAuth de Google son inválidas');
        console.log('   1. Verifica las credenciales en el panel de Supabase');
        console.log('   2. Asegúrate de que el Client ID y Client Secret son correctos');
      }
      
      return false;
    } else {
      console.log('✅ Respuesta de Supabase recibida');
      console.log('   Data:', data);
      
      // Verificar que la URL contiene los parámetros correctos
      if (data.url && data.url.includes('google.com')) {
        console.log('✅ URL contiene el dominio de Google');
        console.log('   URL:', data.url);
        return true;
      } else {
        console.log('❌ URL no contiene el dominio de Google');
        console.log('   URL:', data.url);
        return false;
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error inesperado:');
    console.error(error);
    return false;
  }
}

// Función para verificar la configuración del proyecto
async function checkProjectConfig() {
  console.log('\n🔍 Verificando configuración del proyecto...');
  
  try {
    // Obtener información del proyecto
    const { data, error } = await supabase
      .from('_realtime')
      .select('*')
      .limit(1);
    
    if (error && !error.message.includes('does not exist')) {
      console.error('❌ Error al verificar la configuración del proyecto:', error);
      return false;
    }
    
    console.log('✅ Configuración del proyecto verificada');
    return true;
    
  } catch (error) {
    console.error('\n❌ Error inesperado al verificar la configuración:', error);
    return false;
  }
}

// Ejecutar las verificaciones
async function main() {
  const oauthConfigured = await checkSupabaseOAuthConfig();
  const projectConfigured = await checkProjectConfig();
  
  console.log('\n📋 Resumen:');
  console.log('   Configuración de OAuth:', oauthConfigured ? '✅ Configurada' : '❌ No configurada');
  console.log('   Configuración del proyecto:', projectConfigured ? '✅ Configurada' : '❌ No configurada');
  
  if (!oauthConfigured) {
    console.log('\n🔧 Pasos para configurar OAuth en Supabase:');
    console.log('   1. Ir a https://supabase.com/dashboard');
    console.log('   2. Seleccionar el proyecto: sspkltkalkcwwfapfjuy');
    console.log('   3. Navegar a Authentication > Providers');
    console.log('   4. Habilitar el proveedor de Google');
    console.log('   5. Configurar Client ID y Client Secret de Google');
    console.log('   6. Añadir URL de callback: https://studyscribe.zingyzong.com/api/auth/oauth/callback');
    console.log('   7. Guardar los cambios');
    console.log('   8. Esperar unos minutos y probar de nuevo');
  } else {
    console.log('\n✅ OAuth parece estar configurado correctamente');
    console.log('💡 Si el problema persiste, puede estar relacionado con:');
    console.log('   1. Las credenciales de Google son inválidas');
    console.log('   2. La URL de callback no está registrada en Google Cloud Console');
    console.log('   3. Problemas de red o firewall');
  }
}

// Ejecutar la verificación
main();