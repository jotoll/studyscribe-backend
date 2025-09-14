// Script de prueba para diagnóstico de conexión móvil
const API_BASE_URL = 'http://192.168.1.140:3001/api';

async function testMobileConnection() {
  console.log('📱 Probando conexión móvil con endpoints de debug...');
  console.log('URL base:', API_BASE_URL);

  try {
    // Prueba 1: Endpoint simple GET
    console.log('\n1. Probando endpoint simple GET...');
    const response1 = await fetch(`${API_BASE_URL}/debug/test-connection`);
    const data1 = await response1.json();
    console.log('✅ Simple GET exitoso:', data1);

    // Prueba 2: Endpoint simple POST (simulando FormData)
    console.log('\n2. Probando endpoint POST (simulando FormData)...');
    const response2 = await fetch(`${API_BASE_URL}/debug/test-formdata`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: new URLSearchParams({
        test: 'value',
        audio: 'simulated-file'
      })
    });
    const data2 = await response2.json();
    console.log('✅ POST con headers de FormData exitoso:', data2);

    // Prueba 3: Endpoint de upload simulado
    console.log('\n3. Probando endpoint de upload simulado...');
    const response3 = await fetch(`${API_BASE_URL}/debug/simple-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'audio upload simulation' })
    });
    const data3 = await response3.json();
    console.log('✅ Upload simulado exitoso:', data3);

    console.log('\n🎉 ¡Todas las pruebas de debug pasaron!');
    console.log('La conectividad de red está funcionando correctamente.');
    console.log('El problema debe estar en la implementación específica de FormData en React Native.');

  } catch (error) {
    console.error('\n❌ Error en prueba de debug:', error.message);
    
    if (error.message.includes('Network request failed')) {
      console.log('💡 Error de red - el dispositivo no puede alcanzar el servidor');
      console.log('Verifica que:');
      console.log('- Ambos dispositivos estén en la misma red WiFi');
      console.log('- La IP 192.168.1.140 sea correcta para esta red');
      console.log('- No haya firewalls bloqueando la conexión');
    } else {
      console.log('💡 Error específico:', error);
    }
  }
}

// Ejecutar prueba
testMobileConnection();
