import { transcriptionAPI } from './services/api';

async function testConnection() {
  console.log('🔗 Probando conexión con el backend...');

  try {
    // Probar conexión básica
    const response = await fetch('http://localhost:3001/health');
    const health = await response.json();
    console.log('✅ Health check:', health);

    // Probar endpoint de transcripción
    console.log('📤 Probando endpoint de transcripción...');
    const testResult = await transcriptionAPI.enhanceText('Hola, esto es una prueba', 'general');
    console.log('✅ Respuesta de enhanceText:', testResult);

  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('Detalles:', error);
    
    if (error.message.includes('Network Error')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('1. Verifica que el servidor backend esté ejecutándose en puerto 3001');
      console.log('2. Asegúrate de que la IP 192.168.1.140 sea correcta para tu red');
      console.log('3. Verifica que no haya firewalls bloqueando la conexión');
      console.log('4. Prueba con "localhost" en lugar de la IP en desarrollo');
    }
  }
}

// Ejecutar prueba
testConnection();
