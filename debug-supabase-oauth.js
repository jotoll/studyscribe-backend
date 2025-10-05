const { createClient } = require('@supabase/supabase-js');

// Credenciales de Supabase
const supabaseUrl = 'https://sspkltkalkcwwfapfjuy.supabase.co';
const supabaseKey = 'sb_secret_2agCyjiQouC6OOuk_xn6vQ_3MwkC9Hd';

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSupabaseOAuth() {
  console.log('🔍 Depurando configuración de OAuth en Supabase...');
  
  try {
    // Probar signInWithOAuth con diferentes configuraciones
    console.log('\n📍 1. Probando con configuración por defecto...');
    
    const { data: data1, error: error1 } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://studyscribe.zingyzong.com/api/auth/oauth/callback',
        skipBrowserRedirect: true
      }
    });
    
    if (error1) {
      console.error('❌ Error con configuración por defecto:', error1.message);
    } else {
      console.log('✅ Respuesta con configuración por defecto:');
      console.log('   URL:', data1.url);
      
      // Verificar si la URL contiene el dominio de Google
      if (data1.url && data1.url.includes('google.com')) {
        console.log('✅ URL contiene el dominio de Google');
        console.log('🎉 ¡El problema de OAuth está resuelto!');
        return true;
      } else {
        console.log('❌ URL no contiene el dominio de Google');
      }
    }
    
    console.log('\n📍 2. Probando con queryParams adicionales...');
    
    const { data: data2, error: error2 } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'https://studyscribe.zingyzong.com/api/auth/oauth/callback',
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error2) {
      console.error('❌ Error con queryParams adicionales:', error2.message);
    } else {
      console.log('✅ Respuesta con queryParams adicionales:');
      console.log('   URL:', data2.url);
      
      // Verificar si la URL contiene el dominio de Google
      if (data2.url && data2.url.includes('google.com')) {
        console.log('✅ URL contiene el dominio de Google');
        console.log('🎉 ¡El problema de OAuth está resuelto!');
        return true;
      } else {
        console.log('❌ URL no contiene el dominio de Google');
      }
    }
    
    console.log('\n📍 3. Analizando la URL generada...');
    
    if (data1.url) {
      console.log('   URL:', data1.url);
      
      // Extraer parámetros de la URL
      const url = new URL(data1.url);
      const params = url.searchParams;
      
      console.log('\n   Parámetros de la URL:');
      for (const [key, value] of params) {
        console.log(`   ${key}: ${value}`);
      }
      
      // Verificar si hay un parámetro de error
      if (params.has('error')) {
        console.log('\n   ❌ Error en la URL:', params.get('error'));
        console.log('   Descripción:', params.get('error_description'));
      }
      
      // Verificar si hay un parámetro de provider
      if (params.has('provider')) {
        console.log('\n   ✅ Provider:', params.get('provider'));
      }
    }
    
    console.log('\n📍 4. Verificando configuración del proveedor en Supabase...');
    
    // Intentar obtener información del proveedor
    try {
      const { data: providers, error: providersError } = await supabase
        .from('auth.providers')
        .select('*');
      
      if (providersError) {
        console.log('   No se pudo obtener información de los proveedores (esto es normal)');
      } else {
        console.log('   Proveedores configurados:', providers);
      }
    } catch (e) {
      console.log('   No se pudo obtener información de los proveedores (esto es normal)');
    }
    
    console.log('\n🔧 Posibles soluciones:');
    console.log('   1. Verifica que el proveedor de Google esté habilitado en Supabase');
    console.log('   2. Asegúrate de que las credenciales sean correctas');
    console.log('   3. Verifica que la URL de callback esté configurada correctamente');
    console.log('   4. Espera unos minutos y prueba de nuevo (puede tardar en propagarse)');
    console.log('   5. Intenta deshabilitar y volver a habilitar el proveedor de Google');
    
    return false;
    
  } catch (error) {
    console.error('\n❌ Error inesperado:', error);
    return false;
  }
}

// Función para verificar si el backend está actualizado
async function checkBackendStatus() {
  console.log('\n📍 Verificando estado del backend...');
  
  try {
    const response = await fetch('https://studyscribe.zingyzong.com/api/auth/oauth/test');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Backend funcionando correctamente');
      console.log('   Timestamp:', data.timestamp);
      return true;
    } else {
      console.log('❌ Error en el backend');
      console.log('   Error:', data.error);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error al verificar el estado del backend:', error.message);
    return false;
  }
}

// Ejecutar la depuración
async function main() {
  console.log('==========================================');
  console.log('  Depuración de OAuth en Supabase');
  console.log('==========================================');
  
  const backendStatus = await checkBackendStatus();
  const oauthStatus = await debugSupabaseOAuth();
  
  console.log('\n==========================================');
  console.log('  Resumen de la Depuración');
  console.log('==========================================');
  console.log(`Backend funcionando: ${backendStatus ? '✅' : '❌'}`);
  console.log(`OAuth funcionando: ${oauthStatus ? '✅' : '❌'}`);
  
  if (oauthStatus) {
    console.log('\n🎉 ¡El problema de OAuth está resuelto!');
    console.log('💡 Ahora puedes probar el login con Google en la app móvil');
  } else {
    console.log('\n❌ El problema de OAuth aún no está resuelto');
    console.log('💡 Revisa la configuración en el panel de Supabase');
  }
}

// Ejecutar la depuración
main();