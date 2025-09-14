require('dotenv').config();
const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

async function testOldEndpoint() {
  console.log('🔊 Probando endpoint antiguo /api/transcription/upload...\n');

  try {
    const formData = new FormData();
    formData.append('audio', fs.createReadStream('test_audio.wav'));
    formData.append('subject', 'general');

    console.log('📤 Enviando audio al endpoint antiguo...');
    
    const response = await axios.post('http://localhost:3001/api/transcription/upload', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 60000
    });

    console.log('✅ Respuesta del endpoint antiguo:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.transcription) {
      console.log('\n📊 Transcripción mejorada (IA):');
      console.log(response.data.data.transcription.enhanced);
    }

  } catch (error) {
    console.error('❌ Error en endpoint antiguo:', error.response?.data || error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Sugerencia: Asegúrate de que el servidor esté ejecutándose');
    }
  }
}

if (require.main === module) {
  testOldEndpoint();
}
