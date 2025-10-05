// Script para probar directamente si la autenticación está funcionando
const axios = require('axios');

async function testTranscriptionsAuth() {
  try {
    console.log('🔍 Probando autenticación en endpoint de transcripciones...');
    
    // Probar sin token (debería fallar con autenticación real)
    console.log('\n1. Probando SIN token (debería fallar):');
    try {
      const responseWithoutToken = await axios.get('https://studyscribe.zingyzong.com/api/transcriptions', {
        timeout: 10000
      });
      console.log('❌ ¡PROBLEMA! La petición sin token funcionó:', responseWithoutToken.status);
      console.log('Esto significa que la autenticación NO está funcionando correctamente');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ ¡CORRECTO! La petición sin token falló con 401 (No autorizado)');
      } else {
        console.log('❌ Error inesperado:', error.message);
      }
    }
    
    // Probar con token falso (debería fallar)
    console.log('\n2. Probando con token falso (debería fallar):');
    try {
      const responseWithFakeToken = await axios.get('https://studyscribe.zingyzong.com/api/transcriptions', {
        headers: {
          'Authorization': 'Bearer fake-token-123'
        },
        timeout: 10000
      });
      console.log('❌ ¡PROBLEMA! La petición con token falso funcionó:', responseWithFakeToken.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ ¡CORRECTO! La petición con token falso falló con 401');
      } else {
        console.log('❌ Error inesperado:', error.message);
      }
    }
    
    console.log('\n🔍 CONCLUSIÓN:');
    console.log('Si ambas peticiones fallan con 401, la autenticación está funcionando correctamente.');
    console.log('Si alguna petición funciona, hay un problema grave con la autenticación.');
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testTranscriptionsAuth();
