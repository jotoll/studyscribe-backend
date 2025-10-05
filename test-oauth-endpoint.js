const axios = require('axios');

// URL del backend
const API_BASE_URL = 'https://studyscribe.zingyzong.com/api';

async function testOAuthEndpoint() {
  console.log('🔍 Probando endpoint de OAuth...');
  
  try {
    // Probar el endpoint de OAuth para Google
    console.log('\n📍 Probando /auth/oauth/google/url');
    
    const response = await axios.get(`${API_BASE_URL}/auth/oauth/google/url`, {
      params: {
        redirectTo: 'https://studyscribe.zingyzong.com/api/auth/oauth/callback'
      }
    });
    
    console.log('✅ Respuesta del servidor:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   URL:', response.data.data?.url ? '✅ URL generada' : '❌ No hay URL');
    
    if (response.data.success && response.data.data?.url) {
      console.log('\n🔗 URL de OAuth generada correctamente:');
      console.log(response.data.data.url);
    } else {
      console.log('\n❌ Error en la respuesta del servidor');
      console.log(response.data);
    }
    
  } catch (error) {
    console.error('\n❌ Error al probar el endpoint:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    } else {
      console.log('   Message:', error.message);
    }
  }
}

// Ejecutar la prueba
testOAuthEndpoint();