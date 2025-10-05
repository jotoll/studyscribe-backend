// Script para probar la funcionalidad del traductor después del redeploy
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

console.log('🧪 Probando funcionalidad del traductor después del redeploy...');

// URL del servidor desplegado
const SERVER_URL = 'https://studyscribe.zingyzong.com';

// Función para probar la transcripción y traducción
async function testTranscriptionAndTranslation() {
  try {
    console.log('📤 Enviando solicitud de transcripción con traducción...');
    
    // Crear formulario con archivo de audio y parámetros de idioma
    const form = new FormData();
    form.append('audio', fs.createReadStream('test-audio.m4a'));
    form.append('language', 'es'); // Español para transcripción
    form.append('translation_language', 'en'); // Inglés para traducción
    
    // Enviar solicitud
    const response = await axios.post(`${SERVER_URL}/api/transcribe`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 60000 // 60 segundos de timeout
    });
    
    console.log('✅ Respuesta recibida:');
    console.log('   - Estado:', response.status);
    
    if (response.data && response.data.success) {
      const { transcription, enhanced_transcription, language, translation_language } = response.data.data;
      
      console.log('   - Transcripción:', transcription ? transcription.substring(0, 100) + '...' : 'N/A');
      console.log('   - Transcripción mejorada:', enhanced_transcription ? enhanced_transcription.substring(0, 100) + '...' : 'N/A');
      console.log('   - Idioma de transcripción:', language || 'No especificado');
      console.log('   - Idioma de traducción:', translation_language || 'No especificado');
      
      // Verificar si la traducción está presente
      if (enhanced_transcription && enhanced_transcription.includes('English:')) {
        console.log('🎉 ¡Traducción detectada en la transcripción mejorada!');
      } else {
        console.log('⚠️  No se detectó traducción en la transcripción mejorada');
      }
      
      return true;
    } else {
      console.error('❌ Error en la respuesta:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return false;
  }
}

// Función para probar solo la traducción
async function testTranslationOnly() {
  try {
    console.log('📤 Enviando solicitud de traducción directa...');
    
    // Enviar solicitud de traducción directa
    const response = await axios.post(`${SERVER_URL}/api/translate`, {
      text: 'Hola, esto es una prueba de traducción.',
      source_language: 'es',
      target_language: 'en'
    }, {
      timeout: 30000 // 30 segundos de timeout
    });
    
    console.log('✅ Respuesta de traducción recibida:');
    console.log('   - Estado:', response.status);
    
    if (response.data && response.data.success) {
      const { translated_text } = response.data.data;
      console.log('   - Texto traducido:', translated_text);
      
      // Verificar si la traducción es correcta
      if (translated_text && translated_text.toLowerCase().includes('hello')) {
        console.log('🎉 ¡Traducción directa funcionando correctamente!');
      } else {
        console.log('⚠️  La traducción directa puede no estar funcionando correctamente');
      }
      
      return true;
    } else {
      console.error('❌ Error en la respuesta de traducción:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error durante la prueba de traducción:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return false;
  }
}

// Ejecutar pruebas
async function runTests() {
  console.log('=====================================');
  console.log('Pruebas de funcionalidad del traductor');
  console.log('=====================================');
  console.log('');
  
  // Probar transcripción y traducción
  const transcriptionTest = await testTranscriptionAndTranslation();
  console.log('');
  
  // Probar traducción directa
  const translationTest = await testTranslationOnly();
  console.log('');
  
  // Resumen de resultados
  console.log('=====================================');
  console.log('Resumen de resultados');
  console.log('=====================================');
  console.log(`   - Prueba de transcripción con traducción: ${transcriptionTest ? '✅ Exitosa' : '❌ Fallida'}`);
  console.log(`   - Prueba de traducción directa: ${translationTest ? '✅ Exitosa' : '❌ Fallida'}`);
  
  if (transcriptionTest || translationTest) {
    console.log('🎉 ¡Al menos una de las pruebas de traducción funcionó correctamente!');
  } else {
    console.log('❌ Ninguna de las pruebas de traducción funcionó correctamente');
  }
}

// Verificar si el archivo de audio existe
if (!fs.existsSync('test-audio.m4a')) {
  console.error('❌ Archivo de prueba test-audio.m4a no encontrado');
  console.log('   Asegúrate de que el archivo de audio de prueba exista en el directorio actual');
  process.exit(1);
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error('❌ Error general durante las pruebas:', error);
  process.exit(1);
});