// Script para probar solo la funcionalidad de traducción después del redeploy
const axios = require('axios');

console.log('🧪 Probando funcionalidad de traducción después del redeploy...');

// URL del servidor desplegado
const SERVER_URL = 'https://studyscribe.zingyzong.com';

// Función para probar la traducción directa
async function testTranslation() {
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
        return true;
      } else {
        console.log('⚠️  La traducción directa puede no estar funcionando correctamente');
        return false;
      }
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

// Función para probar la configuración de idiomas en el endpoint de transcripción
async function testLanguageConfig() {
  try {
    console.log('📤 Enviando solicitud para verificar configuración de idiomas...');
    
    // Enviar solicitud para verificar la configuración de idiomas
    const response = await axios.post(`${SERVER_URL}/api/check-language-config`, {
      language: 'es',
      translation_language: 'en'
    }, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Respuesta de configuración recibida:');
    console.log('   - Estado:', response.status);
    
    if (response.data && response.data.success) {
      const { language, translation_language } = response.data.data;
      console.log('   - Idioma de transcripción:', language);
      console.log('   - Idioma de traducción:', translation_language);
      
      if (language === 'es' && translation_language === 'en') {
        console.log('🎉 ¡Configuración de idiomas funcionando correctamente!');
        return true;
      } else {
        console.log('⚠️  La configuración de idiomas puede no estar funcionando correctamente');
        return false;
      }
    } else {
      console.error('❌ Error en la respuesta de configuración:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error durante la prueba de configuración:', error.message);
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
  console.log('Pruebas de funcionalidad de traducción');
  console.log('=====================================');
  console.log('');
  
  // Probar configuración de idiomas
  const configTest = await testLanguageConfig();
  console.log('');
  
  // Probar traducción directa
  const translationTest = await testTranslation();
  console.log('');
  
  // Resumen de resultados
  console.log('=====================================');
  console.log('Resumen de resultados');
  console.log('=====================================');
  console.log(`   - Prueba de configuración de idiomas: ${configTest ? '✅ Exitosa' : '❌ Fallida'}`);
  console.log(`   - Prueba de traducción directa: ${translationTest ? '✅ Exitosa' : '❌ Fallida'}`);
  
  if (configTest || translationTest) {
    console.log('🎉 ¡Al menos una de las pruebas de traducción funcionó correctamente!');
  } else {
    console.log('❌ Ninguna de las pruebas de traducción funcionó correctamente');
  }
}

// Ejecutar pruebas
runTests().catch(error => {
  console.error('❌ Error general durante las pruebas:', error);
  process.exit(1);
});