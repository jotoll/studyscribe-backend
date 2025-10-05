const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const supabaseUrl = 'https://sspkltkalkcwwfapfjuy.supabase.co';
const supabaseKey = 'sb_secret_2agCyjiQouC6OOuk_xn6vQ_3MwkC9Hd';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseOAuth() {
  console.log('🔍 Probando configuración de OAuth en Supabase...');
  
  try {
    // Probar generar URL de OAuth para Google
    console.log('\n📍 Probando signInWithOAuth con Google...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://studyscribe.zingyzong.com/api/auth/oauth/callback'
      }
    });
    
    if (error) {
      console.error('❌ Error de Supabase:');
      console.error('   Message:', error.message);
      console.error('   Status:', error.status);
      console.error('   Code:', error.code);
      
      // Analizar el error
      if (error.message.includes('not configured')) {
        console.log('\n🔧 Solución: El proveedor OAuth de Google no está configurado en Supabase');
        console.log('   1. Ve al panel de Supabase');
        console.log('   2. Navega a Authentication > Providers');
        console.log('   3. Habilita el proveedor de Google');
        console.log('   4. Configura las credenciales de OAuth de Google');
      } else if (error.message.includes('invalid')) {
        console.log('\n🔧 Solución: Las credenciales de OAuth de Google son inválidas');
        console.log('   1. Verifica las credenciales en el panel de Supabase');
        console.log('   2. Asegúrate de que el Client ID y Client Secret son correctos');
      }
    } else {
      console.log('✅ URL de OAuth generada correctamente:');
      console.log('   URL:', data.url);
      
      // Verificar que la URL contiene los parámetros correctos
      if (data.url.includes('google.com')) {
        console.log('✅ URL contiene el dominio de Google');
      } else {
        console.log('❌ URL no contiene el dominio de Google');
      }
      
      if (data.url.includes('redirect_to')) {
        console.log('✅ URL contiene el parámetro de redirección');
      } else {
        console.log('❌ URL no contiene el parámetro de redirección');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error inesperado:');
    console.error(error);
  }
}

// Ejecutar la prueba
testSupabaseOAuth();