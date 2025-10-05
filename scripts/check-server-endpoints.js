// Script para verificar los endpoints disponibles en el servidor
const axios = require('axios');

console.log('🔍 Verificando endpoints disponibles en el servidor...');

// URL del servidor desplegado
const SERVER_URL = 'https://studyscribe.zingyzong.com';

// Función para verificar el estado del servidor
async function checkServerStatus() {
  try {
    console.log('📤 Verificando estado del servidor...');
    
    // Enviar solicitud al endpoint raíz
    const response = await axios.get(SERVER_URL, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Servidor respondiendo:');
    console.log('   - Estado:', response.status);
    console.log('   - Datos:', response.data ? 'Datos recibidos' : 'Sin datos');
    
    return true;
  } catch (error) {
    console.error('❌ Error al verificar el servidor:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return false;
  }
}

// Función para verificar endpoints comunes
async function checkCommonEndpoints() {
  const endpoints = [
    '/api',
    '/api/health',
    '/api/status',
    '/api/transcribe',
    '/api/auth',
    '/api/users'
  ];
  
  console.log('📤 Verificando endpoints comunes...');
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${SERVER_URL}${endpoint}`, {
        timeout: 5000 // 5 segundos de timeout
      });
      
      console.log(`✅ ${endpoint} - Estado: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint} - Estado: ${error.response.status}`);
      } else {
        console.log(`❌ ${endpoint} - Error: ${error.message}`);
      }
    }
  }
}

// Función para verificar el endpoint de transcripción con POST
async function checkTranscribeEndpoint() {
  try {
    console.log('📤 Verificando endpoint de transcripción con POST...');
    
    // Enviar solicitud POST vacía
    const response = await axios.post(`${SERVER_URL}/api/transcribe`, {}, {
      timeout: 5000 // 5 segundos de timeout
    });
    
    console.log(`✅ /api/transcribe (POST) - Estado: ${response.status}`);
    return true;
  } catch (error) {
    if (error.response) {
      console.log(`❌ /api/transcribe (POST) - Estado: ${error.response.status}`);
      
      // Si el error es 400 o 422, el endpoint existe pero espera datos
      if (error.response.status === 400 || error.response.status === 422) {
        console.log('   ✅ El endpoint existe pero espera datos válidos');
        return true;
      }
    } else {
      console.log(`❌ /api/transcribe (POST) - Error: ${error.message}`);
    }
    return false;
  }
}

// Ejecutar verificaciones
async function runChecks() {
  console.log('=====================================');
  console.log('Verificación de endpoints del servidor');
  console.log('=====================================');
  console.log('');
  
  // Verificar estado del servidor
  const serverStatus = await checkServerStatus();
  console.log('');
  
  if (serverStatus) {
    // Verificar endpoints comunes
    await checkCommonEndpoints();
    console.log('');
    
    // Verificar endpoint de transcripción
    const transcribeStatus = await checkTranscribeEndpoint();
    console.log('');
    
    // Resumen de resultados
    console.log('=====================================');
    console.log('Resumen de resultados');
    console.log('=====================================');
    console.log(`   - Estado del servidor: ${serverStatus ? '✅ En línea' : '❌ Fuera de línea'}`);
    console.log(`   - Endpoint de transcripción: ${transcribeStatus ? '✅ Disponible' : '❌ No disponible'}`);
    
    if (serverStatus && transcribeStatus) {
      console.log('🎉 ¡El servidor está funcionando y el endpoint de transcripción está disponible!');
      console.log('   Puedes probar la funcionalidad de idiomas con una solicitud válida al endpoint /api/transcribe');
    } else {
      console.log('❌ El servidor o el endpoint de transcripción no están funcionando correctamente');
    }
  } else {
    console.log('❌ El servidor no está respondiendo');
  }
}

// Ejecutar verificaciones
runChecks().catch(error => {
  console.error('❌ Error general durante las verificaciones:', error);
  process.exit(1);
});