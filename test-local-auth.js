// Script para probar la autenticación en servidor local
const axios = require('axios');

async function testLocalAuth() {
  try {
    console.log('🔍 Probando autenticación en servidor LOCAL...');
    
    // Probar endpoint de diagnóstico local
    console.log('\n1. Probando endpoint de diagnóstico local:');
    try {
      const response = await axios.get('http://localhost:3001/api/deploy-diagnostic', {
        timeout: 5000
      });
      console.log('✅ Endpoint de diagnóstico funcionando:');
      console.log(JSON.stringify(response.data, null, 2));
      
      if (response.data.middleware.usesRealAuth) {
        console.log('🎉 ¡AUTENTICACIÓN REAL ACTIVADA en local!');
      } else {
        console.log('❌ ¡PROBLEMA! Autenticación simplificada todavía activa en local');
      }
    } catch (error) {
      console.log('❌ Servidor local no disponible:', error.message);
      console.log('💡 Ejecuta: npm run dev o node src/server.js');
    }
    
    // Probar transcripciones sin token (debería fallar)
    console.log('\n2. Probando transcripciones SIN token (debería fallar):');
    try {
      const response = await axios.get('http://localhost:3001/api/transcriptions', {
        timeout: 5000
      });
      console.log('❌ ¡PROBLEMA! La petición sin token funcionó:', response.status);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ ¡CORRECTO! La petición sin token falló con 401');
      } else {
        console.log('❌ Error inesperado:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testLocalAuth();
