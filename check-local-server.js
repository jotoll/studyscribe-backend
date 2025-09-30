// Script para verificar qué servidor está corriendo en local
const axios = require('axios');

async function checkLocalServer() {
  console.log('🔍 Verificando estado del servidor local...\n');
  
  // Probar diferentes endpoints para identificar qué servidor está corriendo
  const endpoints = [
    { path: '/', description: 'Endpoint raíz' },
    { path: '/health', description: 'Health check' },
    { path: '/api/health', description: 'API Health check' },
    { path: '/api/transcriptions', description: 'Transcripciones (con auth)' },
    { path: '/api/deploy-diagnostic', description: 'Diagnóstico de deploy' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`http://localhost:3001${endpoint.path}`, {
        timeout: 3000
      });
      
      console.log(`✅ ${endpoint.description}: ${response.status}`);
      
      // Si es el endpoint raíz, mostrar el mensaje
      if (endpoint.path === '/' && response.data) {
        console.log(`   Mensaje: ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint.description}: Servidor no disponible`);
        console.log('💡 Ejecuta: npm run dev o node src/server.js');
        break;
      } else if (error.response) {
        console.log(`⚠️ ${endpoint.description}: ${error.response.status} - ${error.response.statusText}`);
      } else {
        console.log(`❌ ${endpoint.description}: ${error.message}`);
      }
    }
  }
  
  console.log('\n💡 CONCLUSIÓN:');
  console.log('- Si los endpoints /api/* devuelven 401: Autenticación funcionando ✅');
  console.log('- Si los endpoints /api/* devuelven 200 sin token: Problema de auth ❌');
  console.log('- Si el servidor no está disponible: Ejecuta npm run dev');
}

checkLocalServer();
