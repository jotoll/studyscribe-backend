// Script para probar la configuración de idiomas en el backend
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

// Configuración del servidor
const SERVER_URL = 'http://localhost:3001';
const API_ENDPOINT = '/api/transcription/upload-file';

// Archivo de audio de prueba
const AUDIO_FILE = 'test-audio.m4a';

// Idiomas a probar
const LANGUAGE_TESTS = [
  { transcription: 'es', translation: 'es', description: 'Español a Español' },
  { transcription: 'en', translation: 'en', description: 'Inglés a Inglés' },
  { transcription: 'fr', translation: 'es', description: 'Francés a Español' },
  { transcription: 'es', translation: 'en', description: 'Español a Inglés' }
];

async function testLanguageConfig() {
  console.log('🧪 Iniciando pruebas de configuración de idiomas en el backend...');
  
  // Verificar que el archivo de audio exista
  if (!fs.existsSync(AUDIO_FILE)) {
    console.error(`❌ Error: El archivo de audio ${AUDIO_FILE} no existe`);
    process.exit(1);
  }
  
  // Probar cada configuración de idioma
  for (const test of LANGUAGE_TESTS) {
    console.log(`\n🔄 Probando configuración: ${test.description}`);
    console.log(`   - Transcripción: ${test.transcription}`);
    console.log(`   - Traducción: ${test.translation}`);
    
    try {
      // Crear formulario para la solicitud
      const form = new FormData();
      form.append('audio', fs.createReadStream(AUDIO_FILE));
      form.append('subject', 'test');
      form.append('language', test.transcription);
      form.append('translation_language', test.translation);
      
      // Enviar solicitud al servidor
      const response = await axios.post(`${SERVER_URL}${API_ENDPOINT}`, form, {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer test-token' // Token de prueba
        },
        timeout: 120000 // 2 minutos de timeout
      });
      
      // Verificar respuesta
      if (response.data.success) {
        console.log(`✅ Prueba exitosa: ${test.description}`);
        console.log(`   - ID de transcripción: ${response.data.data.id}`);
        console.log(`   - Idioma de transcripción: ${response.data.data.language}`);
        console.log(`   - Idioma de traducción: ${response.data.data.translation_language}`);
      } else {
        console.error(`❌ Prueba fallida: ${test.description}`);
        console.error(`   - Error: ${response.data.error}`);
      }
    } catch (error) {
      console.error(`❌ Error en prueba: ${test.description}`);
      console.error(`   - Mensaje: ${error.message}`);
      if (error.response) {
        console.error(`   - Estado: ${error.response.status}`);
        console.error(`   - Datos: ${JSON.stringify(error.response.data, null, 2)}`);
      }
    }
  }
  
  console.log('\n🎯 Pruebas completadas');
}

// Ejecutar pruebas
testLanguageConfig().catch(error => {
  console.error('❌ Error ejecutando pruebas:', error.message);
  process.exit(1);
});