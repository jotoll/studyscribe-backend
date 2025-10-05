// Script para verificar diferentes rutas posibles para el endpoint de transcripción
const axios = require('axios');

console.log('🔍 Verificando rutas posibles para el endpoint de transcripción...');

// URL del servidor desplegado
const SERVER_URL = 'https://studyscribe.zingyzong.com';

// Función para verificar diferentes rutas de transcripción
async function checkTranscribeRoutes() {
  const routes = [
    '/api/transcribe',
    '/api/transcription',
    '/transcribe',
    '/transcription',
    '/api/transcribe/audio',
    '/api/transcription/audio'
  ];
  
  console.log('📤 Verificando rutas de transcripción con GET...');
  
  for (const route of routes) {
    try {
      const response = await axios.get(`${SERVER_URL}${route}`, {
        timeout: 5000 // 5 segundos de timeout
      });
      
      console.log(`✅ ${route} (GET) - Estado: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${route} (GET) - Estado: ${error.response.status}`);
      } else {
        console.log(`❌ ${route} (GET) - Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n📤 Verificando rutas de transcripción con POST...');
  
  for (const route of routes) {
    try {
      const response = await axios.post(`${SERVER_URL}${route}`, {}, {
        timeout: 5000 // 5 segundos de timeout
      });
      
      console.log(`✅ ${route} (POST) - Estado: ${response.status}`);
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${route} (POST) - Estado: ${error.response.status}`);
        
        // Si el error es 400 o 422, el endpoint existe pero espera datos
        if (error.response.status === 400 || error.response.status === 422) {
          console.log(`   ✅ ${route} - El endpoint existe pero espera datos válidos`);
        }
      } else {
        console.log(`❌ ${route} (POST) - Error: ${error.message}`);
      }
    }
  }
}

// Función para verificar si hay documentación disponible
async function checkDocumentation() {
  const docRoutes = [
    '/',
    '/docs',
    '/api/docs',
    '/documentation',
    '/api/documentation'
  ];
  
  console.log('\n📤 Verificando rutas de documentación...');
  
  for (const route of docRoutes) {
    try {
      const response = await axios.get(`${SERVER_URL}${route}`, {
        timeout: 5000 // 5 segundos de timeout
      });
      
      console.log(`✅ ${route} - Estado: ${response.status}`);
      
      // Si la respuesta contiene HTML, podría ser documentación
      if (response.headers['content-type'] && response.headers['content-type'].includes('text/html')) {
        console.log(`   📄 ${route} - Posible documentación HTML`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${route} - Estado: ${error.response.status}`);
      } else {
        console.log(`❌ ${route} - Error: ${error.message}`);
      }
    }
  }
}

// Ejecutar verificaciones
async function runChecks() {
  console.log('=====================================');
  console.log('Verificación de rutas de transcripción');
  console.log('=====================================');
  console.log('');
  
  // Verificar rutas de transcripción
  await checkTranscribeRoutes();
  
  // Verificar documentación
  await checkDocumentation();
  
  console.log('\n=====================================');
  console.log('Resumen de verificación');
  console.log('=====================================');
  console.log('   Si alguna ruta de transcripción mostró un error 400 o 422 con POST,');
  console.log('   esa es probablemente la ruta correcta y solo necesita datos válidos.');
  console.log('   Si hay documentación disponible, revísala para encontrar las rutas correctas.');
}

// Ejecutar verificaciones
runChecks().catch(error => {
  console.error('❌ Error general durante las verificaciones:', error);
  process.exit(1);
});