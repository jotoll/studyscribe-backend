// Script para verificar el endpoint de health del servidor
const axios = require('axios');

console.log('🔍 Verificando endpoint de health del servidor...');

// URL del servidor desplegado
const SERVER_URL = 'https://studyscribe.zingyzong.com';

// Función para verificar el endpoint de health
async function checkHealthEndpoint() {
  try {
    console.log('📤 Verificando endpoint de health...');
    
    // Enviar solicitud al endpoint de health
    const response = await axios.get(`${SERVER_URL}/api/health`, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Endpoint de health respondiendo:');
    console.log('   - Estado:', response.status);
    console.log('   - Datos:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar el endpoint de health:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return null;
  }
}

// Función para verificar la versión del servidor
async function checkServerVersion() {
  try {
    console.log('📤 Verificando versión del servidor...');
    
    // Enviar solicitud para verificar la versión
    const response = await axios.get(`${SERVER_URL}/api/version`, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Versión del servidor:');
    console.log('   - Estado:', response.status);
    console.log('   - Datos:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar la versión del servidor:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return null;
  }
}

// Función para verificar las rutas disponibles
async function checkAvailableRoutes() {
  try {
    console.log('📤 Verificando rutas disponibles...');
    
    // Enviar solicitud para verificar las rutas
    const response = await axios.get(`${SERVER_URL}/api/routes`, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Rutas disponibles:');
    console.log('   - Estado:', response.status);
    console.log('   - Datos:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar las rutas disponibles:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return null;
  }
}

// Ejecutar verificaciones
async function runChecks() {
  console.log('=====================================');
  console.log('Verificación detallada del servidor');
  console.log('=====================================');
  console.log('');
  
  // Verificar endpoint de health
  const healthData = await checkHealthEndpoint();
  console.log('');
  
  // Verificar versión del servidor
  const versionData = await checkServerVersion();
  console.log('');
  
  // Verificar rutas disponibles
  const routesData = await checkAvailableRoutes();
  console.log('');
  
  // Resumen de resultados
  console.log('=====================================');
  console.log('Resumen de resultados');
  console.log('=====================================');
  console.log(`   - Endpoint de health: ${healthData ? '✅ Disponible' : '❌ No disponible'}`);
  console.log(`   - Versión del servidor: ${versionData ? '✅ Disponible' : '❌ No disponible'}`);
  console.log(`   - Rutas disponibles: ${routesData ? '✅ Disponibles' : '❌ No disponibles'}`);
  
  if (healthData) {
    console.log('🎉 ¡El servidor está funcionando correctamente!');
    
    if (healthData.transcription_endpoint) {
      console.log(`   - Endpoint de transcripción: ${healthData.transcription_endpoint}`);
    }
    
    if (healthData.language_support) {
      console.log(`   - Soporte de idiomas: ${healthData.language_support ? '✅ Disponible' : '❌ No disponible'}`);
    }
  } else {
    console.log('❌ No se pudo obtener información detallada del servidor');
  }
}

// Ejecutar verificaciones
runChecks().catch(error => {
  console.error('❌ Error general durante las verificaciones:', error);
  process.exit(1);
});