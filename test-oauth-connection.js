const axios = require('axios');

// URL del backend
const API_BASE_URL = 'https://studyscribe.zingyzong.com/api';

async function testOAuthConnection() {
  console.log('🔍 Probando conexión de OAuth con Supabase...');
  
  try {
    // Probar el endpoint de prueba de OAuth
    console.log('\n📍 Probando /auth/oauth/test');
    
    const response = await axios.get(`${API_BASE_URL}/auth/oauth/test`);
    
    console.log('✅ Respuesta del servidor:');
    console.log('   Status:', response.status);
    console.log('   Success:', response.data.success);
    console.log('   Message:', response.data.message);
    console.log('   Timestamp:', response.data.timestamp);
    
    if (response.data.success) {
      console.log('\n✅ La conexión con Supabase funciona correctamente');
      console.log('   El problema está específicamente en el flujo de OAuth');
      console.log('   Posibles causas:');
      console.log('   1. El proveedor de Google no está configurado en Supabase');
      console.log('   2. Las credenciales de OAuth de Google son inválidas');
      console.log('   3. La URL de callback no está registrada en Google Cloud Console');
    } else {
      console.log('\n❌ Error en la conexión con Supabase');
      console.log('   Error:', response.data.error);
      console.log('   Details:', response.data.details);
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
testOAuthConnection();