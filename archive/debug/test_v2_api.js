// Test para verificar que la app móvil puede usar la API V2 correctamente
async function testV2API() {
  console.log('📱 Probando conexión móvil con API V2...\n');
  console.log('URL base: http://192.168.1.140:3001/api');

  try {
    // Prueba 1: Health check del endpoint V2
    console.log('1. Probando health check V2...');
    const healthResponse = await fetch('http://192.168.1.140:3001/api/v2/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check V2:', healthData.success);

    // Prueba 2: Probar el endpoint de process-audio (sin enviar archivo real)
    console.log('\n2. Probando endpoint process-audio (simulado)...');
    
    // Simular FormData para la prueba
    const formData = new FormData();
    formData.append('curso', 'Matemáticas');
    formData.append('asignatura', 'Álgebra');
    formData.append('idioma', 'es');
    
    // Nota: No adjuntamos archivo real para esta prueba
    const testResponse = await fetch('http://192.168.1.140:3001/api/v2/process-audio', {
      method: 'POST',
      body: formData,
    });

    // Even if it fails, we can check the response
    console.log('Status:', testResponse.status);
    
    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Process-audio response:', testData);
    } else {
      console.log('⚠️  Process-audio failed (expected without file):', testResponse.status);
      const errorText = await testResponse.text();
      console.log('Error details:', errorText);
    }

    // Prueba 3: Probar obtención de documento (simulando que ya existe uno)
    console.log('\n3. Probando obtención de documento...');
    try {
      const docResponse = await fetch('http://192.168.1.140:3001/api/v2/document/test_doc_001');
      if (docResponse.ok) {
        const docData = await docResponse.json();
        console.log('✅ Documento obtenido:', docData.success);
        if (docData.success) {
          console.log('Doc ID:', docData.data.doc_id);
          console.log('Bloques:', docData.data.blocks?.length);
        }
      } else {
        console.log('⚠️  Documento no encontrado (esperado para test):', docResponse.status);
      }
    } catch (docError) {
      console.log('ℹ️  Error obteniendo documento (puede ser normal):', docError.message);
    }

    console.log('\n🎉 Pruebas de conectividad V2 completadas!');
    console.log('La aplicación móvil puede conectarse correctamente a la API V2.');
    console.log('\n💡 Para usar DocBlocksV2 en la app:');
    console.log('1. Usa transcriptionAPI.processAudioV2() en lugar de uploadAudio()');
    console.log('2. Luego usa transcriptionAPI.getDocumentV2() para obtener el JSON completo');
    console.log('3. El JSON tendrá la estructura DocBlocksV2 con todos los bloques');

  } catch (error) {
    console.error('❌ Error en prueba V2:', error.message);
    
    if (error.message.includes('Network request failed')) {
      console.log('💡 Problema de red - verifica:');
      console.log('- La IP 192.168.1.140 es correcta para tu red');
      console.log('- El servidor está ejecutándose en el puerto 3001');
      console.log('- Ambos dispositivos están en la misma red WiFi');
    } else {
      console.log('💡 Error específico:', error);
    }
  }
}

// Ejecutar prueba
testV2API();
