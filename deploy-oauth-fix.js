const axios = require('axios');

// Configuración de Coolify
const COOLIFY_API_URL = 'https://coolify.zingyzong.com/api/v1';
const COOLIFY_API_TOKEN = process.env.COOLIFY_API_TOKEN || 'your_coolify_api_token';

// ID del servicio backend en Coolify
const SERVICE_ID = 'your_service_id';

async function triggerDeploy() {
  console.log('🚀 Iniciando deploy del backend para arreglar OAuth...');
  
  try {
    // Verificar si tenemos el token de API
    if (!COOLIFY_API_TOKEN || COOLIFY_API_TOKEN === 'your_coolify_api_token') {
      console.log('❌ Token de API de Coolify no configurado');
      console.log('💡 Para configurar el token:');
      console.log('   1. Ve al panel de Coolify');
      console.log('   2. Navega a Settings > API Tokens');
      console.log('   3. Crea un nuevo token');
      console.log('   4. Configura la variable de entorno COOLIFY_API_TOKEN');
      return;
    }
    
    // Obtener información del servicio
    console.log('\n📍 Obteniendo información del servicio...');
    const serviceResponse = await axios.get(`${COOLIFY_API_URL}/services/${SERVICE_ID}`, {
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`
      }
    });
    
    console.log('✅ Información del servicio obtenida');
    console.log('   Nombre:', serviceResponse.data.name);
    console.log('   Estado:', serviceResponse.data.status);
    
    // Activar el deploy
    console.log('\n🔄 Activando deploy...');
    const deployResponse = await axios.post(`${COOLIFY_API_URL}/services/${SERVICE_ID}/deploy`, {}, {
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`
      }
    });
    
    console.log('✅ Deploy activado');
    console.log('   ID del deploy:', deployResponse.data.id);
    console.log('   Estado:', deployResponse.data.status);
    
    // Esperar un momento y verificar el estado
    console.log('\n⏳ Esperando 10 segundos antes de verificar el estado...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Verificar el estado del deploy
    console.log('\n📍 Verificando estado del deploy...');
    const statusResponse = await axios.get(`${COOLIFY_API_URL}/deploys/${deployResponse.data.id}`, {
      headers: {
        'Authorization': `Bearer ${COOLIFY_API_TOKEN}`
      }
    });
    
    console.log('✅ Estado del deploy verificado');
    console.log('   Estado:', statusResponse.data.status);
    console.log('   Progreso:', statusResponse.data.progress);
    
    if (statusResponse.data.status === 'finished') {
      console.log('\n🎉 Deploy completado exitosamente');
      console.log('💡 El backend debería estar actualizado en unos minutos');
      console.log('📝 Puedes probar el OAuth de nuevo después de que el deploy esté completo');
    } else if (statusResponse.data.status === 'failed') {
      console.log('\n❌ El deploy ha fallado');
      console.log('   Error:', statusResponse.data.error);
    } else {
      console.log('\n⏳ El deploy está en progreso');
      console.log('   Estado:', statusResponse.data.status);
      console.log('💡 Puedes verificar el estado más tarde en el panel de Coolify');
    }
    
  } catch (error) {
    console.error('\n❌ Error durante el deploy:');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    } else {
      console.log('   Message:', error.message);
    }
    
    console.log('\n💡 Alternativas:');
    console.log('   1. Verifica el token de API de Coolify');
    console.log('   2. Verifica el ID del servicio');
    console.log('   3. Activa el deploy manualmente desde el panel de Coolify');
  }
}

// Función para verificar si el endpoint de OAuth está funcionando
async function verifyOAuthEndpoint() {
  console.log('\n🔍 Verificando endpoint de OAuth...');
  
  try {
    const response = await axios.get('https://studyscribe.zingyzong.com/api/auth/oauth/test');
    
    console.log('✅ Endpoint de OAuth funcionando');
    console.log('   Estado:', response.data.success);
    console.log('   Mensaje:', response.data.message);
    
    if (response.data.success) {
      console.log('\n🎉 El backend está actualizado y el endpoint de OAuth funciona');
      console.log('💡 Ahora puedes probar el login con Google en la app móvil');
    }
    
  } catch (error) {
    console.log('\n❌ El endpoint de OAuth aún no está disponible');
    if (error.response) {
      console.log('   Status:', error.response.status);
    }
    console.log('💡 Esto puede deberse a que el deploy aún está en progreso');
  }
}

// Ejecutar el deploy y verificar
async function main() {
  await triggerDeploy();
  
  // Esperar un momento antes de verificar
  console.log('\n⏳ Esperando 30 segundos antes de verificar el endpoint...');
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  await verifyOAuthEndpoint();
}

// Ejecutar el script
main();