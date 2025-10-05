// Script para verificar la respuesta JSON del servidor
const axios = require('axios');

console.log('🔍 Verificando respuesta JSON del servidor...');

// URL del servidor desplegado
const SERVER_URL = 'https://studyscribe.zingyzong.com';

// Función para verificar la respuesta JSON del servidor
async function checkServerResponse() {
  try {
    console.log('📤 Verificando respuesta JSON del servidor...');
    
    // Enviar solicitud a la página principal
    const response = await axios.get(SERVER_URL, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Respuesta JSON recibida:');
    console.log('   - Estado:', response.status);
    console.log('   - Tipo de contenido:', response.headers['content-type']);
    console.log('   - Datos:', JSON.stringify(response.data, null, 2));
    
    // Verificar si la respuesta contiene información sobre los endpoints
    if (response.data && typeof response.data === 'object') {
      if (response.data.endpoints) {
        console.log('   ✅ La respuesta contiene información sobre endpoints:');
        console.log('      ', JSON.stringify(response.data.endpoints, null, 4));
      }
      
      if (response.data.api) {
        console.log('   ✅ La respuesta contiene información sobre la API:');
        console.log('      ', JSON.stringify(response.data.api, null, 4));
      }
      
      if (response.data.routes) {
        console.log('   ✅ La respuesta contiene información sobre rutas:');
        console.log('      ', JSON.stringify(response.data.routes, null, 4));
      }
      
      if (response.data.transcription) {
        console.log('   ✅ La respuesta contiene información sobre transcripción:');
        console.log('      ', JSON.stringify(response.data.transcription, null, 4));
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar la respuesta JSON:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return null;
  }
}

// Ejecutar verificación
async function runCheck() {
  console.log('=====================================');
  console.log('Verificación de respuesta JSON del servidor');
  console.log('=====================================');
  console.log('');
  
  // Verificar respuesta JSON
  const responseData = await checkServerResponse();
  console.log('');
  
  // Resumen de resultados
  console.log('=====================================');
  console.log('Resumen de verificación');
  console.log('=====================================');
  
  if (responseData) {
    console.log('🎉 ¡Se recibió una respuesta JSON del servidor!');
    
    if (responseData.endpoints || responseData.api || responseData.routes || responseData.transcription) {
      console.log('   ✅ La respuesta contiene información sobre endpoints o rutas');
    } else {
      console.log('   ⚠️  La respuesta no contiene información explícita sobre endpoints o rutas');
    }
  } else {
    console.log('❌ No se pudo obtener la respuesta JSON del servidor');
  }
}

// Ejecutar verificación
runCheck().catch(error => {
  console.error('❌ Error general durante la verificación:', error);
  process.exit(1);
});