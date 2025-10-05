// Script para probar la funcionalidad de idiomas en el endpoint de transcripción
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

console.log('🧪 Probando funcionalidad de idiomas en el endpoint de transcripción...');

// URL del servidor desplegado
const SERVER_URL = 'https://studyscribe.zingyzong.com';

// Función para probar la configuración de idiomas en el endpoint de transcripción
async function testTranscriptionLanguages() {
  try {
    console.log('📤 Enviando solicitud para verificar configuración de idiomas en transcripción...');
    
    // Crear un archivo de texto simple para simular audio
    const testText = 'Hola, esto es una prueba de transcripción con traducción.';
    const buffer = Buffer.from(testText, 'utf8');
    
    // Crear formulario con archivo de texto y parámetros de idioma
    const form = new FormData();
    form.append('audio', buffer, { filename: 'test.txt', contentType: 'text/plain' });
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
      
      // Verificar si los idiomas se guardaron correctamente
      if (language === 'es' && translation_language === 'en') {
        console.log('🎉 ¡Configuración de idiomas guardada correctamente!');
        return true;
      } else {
        console.log('⚠️  La configuración de idiomas puede no estar funcionando correctamente');
        return false;
      }
    } else {
      console.error('❌ Error en la respuesta:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error durante la prueba de transcripción:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return false;
  }
}

// Función para verificar si la columna translation_language existe en la base de datos
async function testDatabaseSchema() {
  try {
    console.log('📤 Enviando solicitud para verificar esquema de base de datos...');
    
    // Enviar solicitud para verificar el esquema
    const response = await axios.get(`${SERVER_URL}/api/check-schema`, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Respuesta de esquema recibida:');
    console.log('   - Estado:', response.status);
    
    if (response.data && response.data.success) {
      const { tables } = response.data.data;
      const transcriptionsTable = tables.find(table => table.name === 'transcriptions');
      
      if (transcriptionsTable) {
        const hasTranslationLanguage = transcriptionsTable.columns.some(column => column.name === 'translation_language');
        
        if (hasTranslationLanguage) {
          console.log('🎉 ¡Columna translation_language encontrada en la base de datos!');
          return true;
        } else {
          console.log('⚠️  Columna translation_language no encontrada en la base de datos');
          return false;
        }
      } else {
        console.log('⚠️  Tabla transcriptions no encontrada en la base de datos');
        return false;
      }
    } else {
      console.error('❌ Error en la respuesta de esquema:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error durante la verificación del esquema:', error.message);
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
  console.log('Pruebas de funcionalidad de idiomas');
  console.log('=====================================');
  console.log('');
  
  // Probar esquema de base de datos
  const schemaTest = await testDatabaseSchema();
  console.log('');
  
  // Probar configuración de idiomas en transcripción
  const transcriptionTest = await testTranscriptionLanguages();
  console.log('');
  
  // Resumen de resultados
  console.log('=====================================');
  console.log('Resumen de resultados');
  console.log('=====================================');
  console.log(`   - Prueba de esquema de base de datos: ${schemaTest ? '✅ Exitosa' : '❌ Fallida'}`);
  console.log(`   - Prueba de configuración de idiomas: ${transcriptionTest ? '✅ Exitosa' : '❌ Fallida'}`);
  
  if (schemaTest || transcriptionTest) {
    console.log('🎉 ¡Al menos una de las pruebas de idiomas funcionó correctamente!');
  } else {
    console.log('❌ Ninguna de las pruebas de idiomas funcionó correctamente');
  }
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error('❌ Error general durante las pruebas:', error);
  process.exit(1);
});