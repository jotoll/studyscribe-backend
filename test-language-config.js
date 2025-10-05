// Script para probar la configuración de idiomas en la aplicación móvil
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// URL base de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Función para probar la configuración de idiomas
async function testLanguageConfig() {
  console.log('🧪 Probando configuración de idiomas...\n');
  
  try {
    // 1. Probar transcripción con idioma español (predeterminado)
    console.log('1️⃣ Probando transcripción con idioma español (predeterminado)');
    const spanishResponse = await testTranscriptionWithLanguage('es', 'es');
    console.log('✅ Transcripción en español exitosa\n');
    
    // 2. Probar transcripción con idioma inglés
    console.log('2️⃣ Probando transcripción con idioma inglés');
    const englishResponse = await testTranscriptionWithLanguage('en', 'en');
    console.log('✅ Transcripción en inglés exitosa\n');
    
    // 3. Probar transcripción con idioma francés
    console.log('3️⃣ Probando transcripción con idioma francés');
    const frenchResponse = await testTranscriptionWithLanguage('fr', 'fr');
    console.log('✅ Transcripción en francés exitosa\n');
    
    // 4. Probar transcripción con idioma de transcripción en español y traducción en inglés
    console.log('4️⃣ Probando transcripción en español con traducción a inglés');
    const mixedResponse = await testTranscriptionWithLanguage('es', 'en');
    console.log('✅ Transcripción mixta exitosa\n');
    
    console.log('🎉 Todas las pruebas de configuración de idiomas pasaron correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas de configuración de idiomas:', error.message);
    console.error(error.stack);
  }
}

// Función para probar la transcripción con idiomas específicos
async function testTranscriptionWithLanguage(transcriptionLanguage, translationLanguage) {
  try {
    // Crear un archivo de audio de prueba (simulado)
    const testAudioPath = path.join(__dirname, 'test-audio.m4a');
    
    // Si el archivo no existe, crear uno vacío para la prueba
    if (!fs.existsSync(testAudioPath)) {
      console.log('📝 Creando archivo de audio de prueba...');
      // Crear un archivo binario simple para simular audio
      const buffer = Buffer.alloc(1000); // 1KB de datos vacíos
      fs.writeFileSync(testAudioPath, buffer);
    }
    
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('audio', fs.createReadStream(testAudioPath));
    formData.append('subject', 'Prueba de configuración de idiomas');
    formData.append('transcription_language', transcriptionLanguage);
    formData.append('translation_language', translationLanguage);
    
    // Enviar la solicitud a la API
    const response = await axios.post(`${API_BASE_URL}/transcription/upload-file`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer test-token' // Token de prueba
      },
      timeout: 60000 // 60 segundos de timeout
    });
    
    // Verificar la respuesta
    if (response.data.success) {
      console.log(`📊 Respuesta para ${transcriptionLanguage}->${translationLanguage}:`);
      console.log(`   - ID: ${response.data.id || 'N/A'}`);
      console.log(`   - Asunto: ${response.data.subject || 'N/A'}`);
      
      if (response.data.transcription) {
        console.log(`   - Transcripción original: ${response.data.transcription.original ? 'Presente' : 'Ausente'}`);
        console.log(`   - Transcripción mejorada: ${response.data.transcription.enhanced ? 'Presente' : 'Ausente'}`);
      }
    } else {
      throw new Error(`La API devolvió un error: ${response.data.message || 'Error desconocido'}`);
    }
    
    return response.data;
    
  } catch (error) {
    // Si es un error de la API, mostrar el mensaje
    if (error.response && error.response.data) {
      throw new Error(`Error de la API: ${error.response.data.error || error.response.data.message || 'Error desconocido'}`);
    }
    throw error;
  }
}

// Función para probar el endpoint de generación de material con idiomas
async function testMaterialGenerationWithLanguage() {
  console.log('🧪 Probando generación de material con idiomas...\n');
  
  try {
    // Texto de prueba
    const testText = "Este es un texto de prueba para generar material de estudio en diferentes idiomas.";
    
    // 1. Probar generación de resumen en español
    console.log('1️⃣ Probando generación de resumen en español');
    const spanishSummary = await generateMaterial(testText, 'summary', 'es');
    console.log('✅ Resumen en español generado\n');
    
    // 2. Probar generación de resumen en inglés
    console.log('2️⃣ Probando generación de resumen en inglés');
    const englishSummary = await generateMaterial(testText, 'summary', 'en');
    console.log('✅ Resumen en inglés generado\n');
    
    console.log('🎉 Todas las pruebas de generación de material con idiomas pasaron correctamente');
    
  } catch (error) {
    console.error('❌ Error en las pruebas de generación de material con idiomas:', error.message);
  }
}

// Función para generar material de estudio
async function generateMaterial(text, type, language) {
  try {
    const response = await axios.post(`${API_BASE_URL}/transcription/generate-material`, {
      text,
      type,
      language
    }, {
      headers: {
        'Authorization': 'Bearer test-token', // Token de prueba
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 segundos de timeout
    });
    
    if (response.data.success) {
      console.log(`📊 Material generado (${type} en ${language}):`);
      console.log(`   - Tipo: ${response.data.type}`);
      console.log(`   - Contenido: ${response.data.content.substring(0, 100)}...`);
    } else {
      throw new Error(`La API devolvió un error: ${response.data.message || 'Error desconocido'}`);
    }
    
    return response.data;
    
  } catch (error) {
    if (error.response && error.response.data) {
      throw new Error(`Error de la API: ${error.response.data.error || error.response.data.message || 'Error desconocido'}`);
    }
    throw error;
  }
}

// Ejecutar las pruebas
async function runTests() {
  console.log('🚀 Iniciando pruebas de configuración de idiomas para Dicttr Mobile\n');
  
  // Probar configuración de idiomas en transcripción
  await testLanguageConfig();
  
  // Probar configuración de idiomas en generación de material
  await testMaterialGenerationWithLanguage();
  
  console.log('\n✨ Todas las pruebas completadas');
}

// Manejar errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Error no manejado:', reason);
});

// Ejecutar el script
runTests().catch(console.error);