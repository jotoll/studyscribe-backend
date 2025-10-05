// Script para crear una rama limpia sin el historial de commits con secretos
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Creando rama limpia sin historial de secretos...');

try {
  // Verificar que estamos en un repositorio Git
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    throw new Error('No se encuentra un repositorio Git en el directorio actual');
  }

  // Crear una nueva rama desde main sin historial
  const branchName = `feature/language-config-clean-${Date.now()}`;
  console.log(`🌿 Creando nueva rama limpia: ${branchName}`);
  
  // Cambiar a main
  console.log('📂 Cambiando a rama main...');
  execSync('git checkout main', { stdio: 'inherit' });
  
  // Crear nueva rama desde main
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

  // Añadir solo los archivos de configuración de idiomas
  console.log('📝 Añadiendo archivos de configuración de idiomas...');
  const languageFiles = [
    'scripts/add-translation-language-column.sql',
    'IMPLEMENT_LANGUAGE_CONFIG.md',
    'README-language-config.md',
    'test-language-config-backend.js',
    'src/routes/transcription.js',
    'src/services/transcriptionService.js'
  ];

  // Verificar qué archivos existen antes de añadirlos
  const existingFiles = languageFiles.filter(file => fs.existsSync(file));
  
  if (existingFiles.length === 0) {
    console.log('⚠️  No se encontraron archivos de configuración de idiomas');
  } else {
    existingFiles.forEach(file => {
      console.log(`   - Añadiendo: ${file}`);
      execSync(`git add "${file}"`, { stdio: 'inherit' });
    });
  }

  // Crear commit
  console.log('💾 Creando commit...');
  execSync('git commit -m "feat: implement configuration of transcription and translation languages in backend\n\n- Update transcription endpoint to accept language and translation_language parameters\n- Update transcription service to use specified languages in Groq and DeepSeek\n- Add translation_language column support in database operations\n- Add comprehensive documentation and test scripts\n\nReady for backend redeploy"', { stdio: 'inherit' });

  console.log('✅ Commit creado exitosamente!');

  // Hacer push de la nueva rama
  console.log('🚀 Haciendo push de la rama limpia al repositorio remoto...');
  execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });

  console.log('✅ Push completado!');
  console.log(`🎯 Cambios guardados en la rama limpia ${branchName} y subidos al repositorio remoto!`);
  console.log('\n📋 Ahora puedes:');
  console.log(`1. Hacer el redeploy del backend desde la rama ${branchName} en Coolify`);
  console.log('2. Configurar las variables de entorno en Coolify:');
  console.log('   - GOOGLE_CLIENT_ID');
  console.log('   - GOOGLE_CLIENT_SECRET');
  console.log('   - GROQ_API_KEY');
  console.log('   - DEEPSEEK_API_KEY');
  console.log('\n📝 Nota: Esta rama no contiene el historial con secretos.');

} catch (error) {
  console.error('❌ Error durante el proceso de Git:', error.message);
  process.exit(1);
}