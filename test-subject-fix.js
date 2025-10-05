const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Test para verificar que el servidor devuelve el subject actualizado
async function testSubjectFix() {
  try {
    console.log('🧪 Probando fix del subject...');
    
    // Crear un archivo de audio de prueba pequeño
    const testAudioPath = 'test-audio.m4a';
    
    // Si no existe el archivo de prueba, crear uno pequeño
    if (!fs.existsSync(testAudioPath)) {
      console.log('⚠️ No hay archivo de prueba, creando uno pequeño...');
      // Crear un archivo vacío pequeño para la prueba
      fs.writeFileSync(testAudioPath, Buffer.alloc(1000));
    }

    const formData = new FormData();
    formData.append('audio', fs.createReadStream(testAudioPath));
    formData.append('subject', 'Nueva grabación');

    console.log('📤 Enviando petición al servidor...');
    
    // Usar el endpoint de prueba sin autenticación
    const response = await axios.post('https://studyscribe.zingyzong.com/api/transcription/test-save', {
      enhanced_text: {
        title: "Transcripción de prueba",
        sections: [
          {
            type: "heading",
            level: 1,
            content: "Título de prueba"
          },
          {
            type: "paragraph",
            content: "Este es un párrafo de prueba para verificar el guardado en Supabase."
          }
        ]
      },
      original_text: "Texto original de prueba",
      subject: "Nueva grabación",
      processed_at: new Date().toISOString()
    }, {
      timeout: 30000
    });

    console.log('✅ Respuesta del servidor:');
    console.log('Status:', response.status);
    console.log('Subject devuelto:', response.data.data.subject);
    console.log('Respuesta completa:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data.subject && response.data.data.subject !== 'Nueva grabación') {
      console.log('🎉 ¡ÉXITO! El servidor está devolviendo el subject actualizado:', response.data.data.subject);
    } else {
      console.log('❌ El servidor aún devuelve "Nueva grabación"');
    }

  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
    if (error.response) {
      console.error('Respuesta de error:', error.response.data);
    }
  }
}

testSubjectFix();
