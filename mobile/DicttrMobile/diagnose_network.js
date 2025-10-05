// Script de diagnóstico de red para React Native
const TEST_URL = 'http://192.168.1.140:3001/health';

async function diagnoseNetwork() {
  console.log('🔍 Diagnóstico de conectividad de red...');
  console.log('URL de prueba:', TEST_URL);

  try {
    // Prueba 1: Fetch básico
    console.log('\n1. Probando fetch básico...');
    const response = await fetch(TEST_URL);
    const data = await response.json();
    console.log('✅ Fetch exitoso:', data);

    // Prueba 2: Probando con timeout
    console.log('\n2. Probando con timeout...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response2 = await fetch(TEST_URL, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data2 = await response2.json();
    console.log('✅ Fetch con timeout exitoso:', data2);

    // Prueba 3: Probando endpoint de API
    console.log('\n3. Probando endpoint de API...');
    const apiResponse = await fetch('http://192.168.1.140:3001/api/transcription/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: 'test', subject: 'general' })
    });
    const apiData = await apiResponse.json();
    console.log('✅ API endpoint exitoso:', apiData.success);

    console.log('\n🎉 Todas las pruebas de red pasaron!');
    console.log('La conectividad está bien configurada.');

  } catch (error) {
    console.error('\n❌ Error en diagnóstico:', error.message);
    
    if (error.name === 'AbortError') {
      console.log('💡 El servidor no responde dentro del timeout (5 segundos)');
      console.log('Posibles causas:');
      console.log('- Firewall bloqueando conexiones');
      console.log('- El servidor no está ejecutándose');
      console.log('- Problema de red entre dispositivos');
    } else if (error.message.includes('Network request failed')) {
      console.log('💡 Error de red - el dispositivo no puede alcanzar la IP');
      console.log('Verifica que:');
      console.log('- Ambos dispositivos estén en la misma red WiFi');
      console.log('- La IP 192.168.1.140 sea correcta');
      console.log('- No haya firewalls bloqueando');
    } else {
      console.log('💡 Error desconocido:', error);
    }
  }
}

// Ejecutar diagnóstico
diagnoseNetwork();
