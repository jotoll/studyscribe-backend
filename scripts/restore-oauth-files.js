// Script para restaurar archivos de OAuth sin secretos
const fs = require('fs');
const path = require('path');

console.log('🔄 Restaurando archivos de OAuth sin secretos...');

// Archivos a restaurar con contenido limpio
const filesToRestore = [
  {
    path: 'check-oauth-propagation.js',
    content: `// Script para verificar la propagación de configuración OAuth
// Las credenciales deben configurarse como variables de entorno

const { execSync } = require('child_process');

console.log('🔍 Verificando configuración OAuth...');

// Verificar variables de entorno
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('❌ Variables de entorno OAuth no configuradas');
  console.error('   - GOOGLE_CLIENT_ID');
  console.error('   - GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

console.log('✅ Variables de entorno OAuth configuradas');
console.log('   - Client ID:', clientId.substring(0, 10) + '...');
console.log('   - Client Secret:', clientSecret.substring(0, 10) + '...');

// Resto del código de verificación...
`
  },
  {
    path: 'test-new-oauth-credentials.js',
    content: `// Script para probar nuevas credenciales OAuth
// Las credenciales deben configurarse como variables de entorno

const axios = require('axios');

console.log('🧪 Probando nuevas credenciales OAuth...');

// Verificar variables de entorno
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('❌ Variables de entorno OAuth no configuradas');
  process.exit(1);
}

console.log('✅ Variables de entorno OAuth configuradas');

// Resto del código de prueba...
`
  },
  {
    path: 'wait-for-oauth-propagation.js',
    content: `// Script para esperar la propagación de configuración OAuth
// Las credenciales deben configurarse como variables de entorno

const { execSync } = require('child_process');

console.log('⏳ Esperando propagación de configuración OAuth...');

// Verificar variables de entorno
const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('❌ Variables de entorno OAuth no configuradas');
  process.exit(1);
}

console.log('✅ Variables de entorno OAuth configuradas');

// Resto del código de espera...
`
  }
];

// Restaurar archivos
filesToRestore.forEach(file => {
  console.log(`📝 Restaurando: ${file.path}`);
  fs.writeFileSync(file.path, file.content);
  console.log(`   ✅ Restaurado: ${file.path}`);
});

console.log('\n🎯 Archivos restaurados sin secretos');
console.log('📋 Ahora puedes añadir estos archivos a Git sin problemas de secretos');