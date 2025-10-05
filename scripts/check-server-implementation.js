// Script para verificar la implementación del servidor
const axios = require('axios');

console.log('🔍 Verificando implementación del servidor...');

// URL del servidor desplegado
const SERVER_URL = 'https://studyscribe.zingyzong.com';

// Función para verificar la página principal
async function checkMainPage() {
  try {
    console.log('📤 Verificando página principal...');
    
    // Enviar solicitud a la página principal
    const response = await axios.get(SERVER_URL, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Página principal respondiendo:');
    console.log('   - Estado:', response.status);
    console.log('   - Tipo de contenido:', response.headers['content-type']);
    
    // Verificar si la página principal contiene información sobre la API
    if (response.data && typeof response.data === 'string') {
      if (response.data.includes('transcribe') || response.data.includes('API')) {
        console.log('   ✅ La página principal menciona la API o transcripción');
      } else {
        console.log('   ⚠️  La página principal no menciona la API o transcripción');
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar la página principal:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
      console.error('   - Datos:', error.response.data);
    }
    return null;
  }
}

// Función para verificar si hay un archivo de configuración disponible
async function checkConfigFile() {
  try {
    console.log('📤 Verificando archivo de configuración...');
    
    // Enviar solicitud para verificar el archivo de configuración
    const response = await axios.get(`${SERVER_URL}/config.json`, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Archivo de configuración disponible:');
    console.log('   - Estado:', response.status);
    console.log('   - Datos:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar el archivo de configuración:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
    }
    return null;
  }
}

// Función para verificar si hay un archivo de manifiesto disponible
async function checkManifestFile() {
  try {
    console.log('📤 Verificando archivo de manifiesto...');
    
    // Enviar solicitud para verificar el archivo de manifiesto
    const response = await axios.get(`${SERVER_URL}/manifest.json`, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Archivo de manifiesto disponible:');
    console.log('   - Estado:', response.status);
    console.log('   - Datos:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar el archivo de manifiesto:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
    }
    return null;
  }
}

// Función para verificar si hay un archivo de robots.txt disponible
async function checkRobotsFile() {
  try {
    console.log('📤 Verificando archivo robots.txt...');
    
    // Enviar solicitud para verificar el archivo robots.txt
    const response = await axios.get(`${SERVER_URL}/robots.txt`, {
      timeout: 10000 // 10 segundos de timeout
    });
    
    console.log('✅ Archivo robots.txt disponible:');
    console.log('   - Estado:', response.status);
    console.log('   - Datos:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('❌ Error al verificar el archivo robots.txt:', error.message);
    if (error.response) {
      console.error('   - Estado:', error.response.status);
    }
    return null;
  }
}

// Ejecutar verificaciones
async function runChecks() {
  console.log('=====================================');
  console.log('Verificación de implementación del servidor');
  console.log('=====================================');
  console.log('');
  
  // Verificar página principal
  const mainPageData = await checkMainPage();
  console.log('');
  
  // Verificar archivo de configuración
  const configData = await checkConfigFile();
  console.log('');
  
  // Verificar archivo de manifiesto
  const manifestData = await checkManifestFile();
  console.log('');
  
  // Verificar archivo robots.txt
  const robotsData = await checkRobotsFile();
  console.log('');
  
  // Resumen de resultados
  console.log('=====================================');
  console.log('Resumen de verificación');
  console.log('=====================================');
  console.log(`   - Página principal: ${mainPageData ? '✅ Disponible' : '❌ No disponible'}`);
  console.log(`   - Archivo de configuración: ${configData ? '✅ Disponible' : '❌ No disponible'}`);
  console.log(`   - Archivo de manifiesto: ${manifestData ? '✅ Disponible' : '❌ No disponible'}`);
  console.log(`   - Archivo robots.txt: ${robotsData ? '✅ Disponible' : '❌ No disponible'}`);
  
  if (mainPageData) {
    console.log('🎉 ¡El servidor está funcionando!');
    console.log('   Sin embargo, el endpoint de transcripción no está disponible.');
    console.log('   Esto podría deberse a:');
    console.log('   1. El endpoint no se ha implementado correctamente');
    console.log('   2. Hay un problema con el despliegue');
    console.log('   3. El endpoint tiene una ruta diferente');
    console.log('   4. El endpoint requiere autenticación');
  } else {
    console.log('❌ No se pudo obtener información del servidor');
  }
}

// Ejecutar verificaciones
runChecks().catch(error => {
  console.error('❌ Error general durante las verificaciones:', error);
  process.exit(1);
});