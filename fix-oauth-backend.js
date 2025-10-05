const fs = require('fs');
const path = require('path');

// Función para verificar y actualizar la configuración de OAuth
function fixOAuthConfiguration() {
  console.log('🔧 Analizando configuración de OAuth...');
  
  // Leer el archivo de rutas de autenticación
  const authPath = path.join(__dirname, 'src', 'routes', 'auth.js');
  
  try {
    let authContent = fs.readFileSync(authPath, 'utf8');
    
    // Verificar si ya tiene el logging mejorado
    if (authContent.includes('[OAuth] Generating URL for provider')) {
      console.log('✅ El logging de OAuth ya está actualizado');
    } else {
      console.log('❌ El logging de OAuth necesita actualización');
    }
    
    // Verificar si hay algún problema con el manejo de errores
    if (authContent.includes('details: error.message')) {
      console.log('✅ El manejo de errores ya está mejorado');
    } else {
      console.log('❌ El manejo de errores necesita actualización');
    }
    
    console.log('\n📋 Diagnóstico completado');
    console.log('🔍 Posibles causas del error:');
    console.log('   1. El proveedor de Google no está configurado en Supabase');
    console.log('   2. Las credenciales de OAuth de Google son inválidas');
    console.log('   3. La URL de callback no está registrada en Google Cloud Console');
    console.log('   4. Problema de red o firewall bloqueando la conexión');
    
    console.log('\n🛠️  Soluciones recomendadas:');
    console.log('   1. Verificar la configuración en el panel de Supabase');
    console.log('   2. Configurar las credenciales de OAuth en Google Cloud Console');
    console.log('   3. Registrar la URL de callback en Google Cloud Console');
    console.log('   4. Verificar que el servidor pueda conectarse a Supabase');
    
    console.log('\n📝 Pasos para configurar OAuth en Supabase:');
    console.log('   1. Ir a https://supabase.com/dashboard');
    console.log('   2. Seleccionar el proyecto');
    console.log('   3. Navegar a Authentication > Providers');
    console.log('   4. Habilitar el proveedor de Google');
    console.log('   5. Configurar Client ID y Client Secret');
    console.log('   6. Añadir URL de callback: https://studyscribe.zingyzong.com/api/auth/oauth/callback');
    
  } catch (error) {
    console.error('❌ Error al leer el archivo de autenticación:', error);
  }
}

// Función para crear un endpoint de prueba
function createTestEndpoint() {
  console.log('\n🔧 Creando endpoint de prueba para OAuth...');
  
  const testEndpointCode = `
// Endpoint de prueba para OAuth
router.get('/oauth/test', (req, res) => {
  try {
    console.log('[OAuth Test] Verificando configuración de Supabase...');
    
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    // Probar una operación simple con Supabase
    const { data, error } = supabase.auth.getSession();
    
    if (error) {
      console.error('[OAuth Test] Error de Supabase:', error);
      return res.status(500).json({ 
        error: 'Supabase connection error', 
        details: error.message 
      });
    }
    
    console.log('[OAuth Test] Conexión con Supabase exitosa');
    res.json({ 
      success: true, 
      message: 'Supabase connection working',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('[OAuth Test] Error:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});
`;
  
  console.log('📄 Código para el endpoint de prueba:');
  console.log(testEndpointCode);
  console.log('\n💡 Para usar este endpoint:');
  console.log('   1. Añade el código al archivo src/routes/auth.js');
  console.log('   2. Reinicia el servidor');
  console.log('   3. Prueba con: GET https://studyscribe.zingyzong.com/api/auth/oauth/test');
}

// Ejecutar las funciones
fixOAuthConfiguration();
createTestEndpoint();