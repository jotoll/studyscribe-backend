// Script para verificar qué versión del middleware está corriendo en Coolify
const fs = require('fs');
const path = require('path');

function checkDeployedVersion() {
  console.log('🔍 Verificando versión del middleware en producción...');
  
  const authMiddlewarePath = path.join(__dirname, 'src/middleware/auth.js');
  
  if (fs.existsSync(authMiddlewarePath)) {
    const content = fs.readFileSync(authMiddlewarePath, 'utf8');
    
    if (content.includes('f1bd3a53-8faf-4aa5-928c-048c3e056342')) {
      console.log('❌ VERSIÓN ANTIGUA: Middleware todavía usa autenticación simplificada');
      console.log('💡 El cambio no se ha desplegado en Coolify');
    } else if (content.includes('No token provided, returning 401')) {
      console.log('✅ VERSIÓN CORRECTA: Middleware usa autenticación real');
      console.log('💡 El cambio está listo pero necesita redeploy');
    } else {
      console.log('⚠️  VERSIÓN DESCONOCIDA: No se puede determinar la versión');
    }
    
    // Verificar si el archivo tiene los cambios recientes
    const hasNewAuth = content.includes('Token de acceso requerido');
    const hasOldAuth = content.includes('Using simplified auth for development');
    
    console.log('\n📋 Estado del middleware:');
    console.log(`- Autenticación real: ${hasNewAuth ? '✅' : '❌'}`);
    console.log(`- Autenticación simplificada: ${hasOldAuth ? '❌ (debería estar eliminada)' : '✅'}`);
    
  } else {
    console.log('❌ No se pudo encontrar el archivo del middleware');
  }
}

checkDeployedVersion();
