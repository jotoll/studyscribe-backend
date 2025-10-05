// Script para probar el endpoint de diagnóstico después del deploy
const axios = require('axios');

async function testDeployDiagnostic() {
  try {
    console.log('🔍 Probando endpoint de diagnóstico...');
    
    const response = await axios.get('https://studyscribe.zingyzong.com/api/deploy-diagnostic', {
      timeout: 10000
    });
    
    console.log('✅ Endpoint de diagnóstico funcionando:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.middleware.usesRealAuth) {
      console.log('🎉 ¡AUTENTICACIÓN REAL ACTIVADA!');
      console.log('✅ El backend ahora requiere token válido');
      console.log('✅ Cada usuario verá solo sus transcripciones');
    } else if (response.data.middleware.usesSimplifiedAuth) {
      console.log('❌ ¡PROBLEMA! Autenticación simplificada todavía activa');
      console.log('❌ El deploy no se completó correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error probando endpoint de diagnóstico:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 El servidor puede estar reiniciando, espera 1-2 minutos más');
    } else if (error.response) {
      console.log('📊 Estado HTTP:', error.response.status);
      console.log('📄 Respuesta:', error.response.data);
    }
  }
}

testDeployDiagnostic();
