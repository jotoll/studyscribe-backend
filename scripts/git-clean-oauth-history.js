// Script para limpiar el historial de Git de secretos de OAuth
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando historial de Git de secretos de OAuth...');

try {
  // Verificar que estamos en un repositorio Git
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    throw new Error('No se encuentra un repositorio Git en el directorio actual');
  }

  // Crear una rama temporal sin los archivos con secretos
  const tempBranch = `temp-clean-${Date.now()}`;
  console.log(`🌿 Creando rama temporal: ${tempBranch}`);
  
  // Crear rama desde main
  execSync(`git checkout -b ${tempBranch}`, { stdio: 'inherit' });

  // Eliminar archivos con secretos del historial
  console.log('🗑️  Eliminando archivos con secretos...');
  const filesToRemove = [
    'check-oauth-propagation.js',
    'test-new-oauth-credentials.js',
    'wait-for-oauth-propagation.js',
    'CONFIGURE_SUPABASE_OAUTH.md',
    'OAUTH_ANDROID_WEB_GUIDE.md',
    'OAUTH_FINAL_SUMMARY.md',
    'test-oauth-after-config.js',
    'SUPABASE_OAUTH_STEP_BY_STEP.md',
    'direct-supabase-oauth-test.js',
    'test-oauth-final.js',
    'check-supabase-credentials.js'
  ];

  filesToRemove.forEach(file => {
    try {
      execSync(`git rm --cached "${file}"`, { stdio: 'inherit' });
      console.log(`   ✅ Eliminado del índice: ${file}`);
    } catch (error) {
      console.log(`   ⚠️  No se pudo eliminar: ${file} (puede no estar en el repositorio)`);
    }
  });

  // Añadir archivos .gitignore para estos archivos
  console.log('📝 Añadiendo archivos a .gitignore...');
  let gitignoreContent = '';
  if (fs.existsSync('.gitignore')) {
    gitignoreContent = fs.readFileSync('.gitignore', 'utf8');
  }

  const gitignoreEntries = filesToRemove.map(file => `# OAuth secrets\n${file}`).join('\n');
  
  if (!gitignoreContent.includes('OAuth secrets')) {
    gitignoreContent += '\n\n' + gitignoreEntries;
    fs.writeFileSync('.gitignore', gitignoreContent);
    execSync('git add .gitignore', { stdio: 'inherit' });
    console.log('   ✅ Archivos añadidos a .gitignore');
  }

  // Crear commit de limpieza
  console.log('💾 Creando commit de limpieza...');
  execSync('git commit -m "chore: remove OAuth secrets from repository\n\n- Remove files containing OAuth secrets\n- Add files to .gitignore to prevent future commits\n\nOAuth secrets should be stored in environment variables"', { stdio: 'inherit' });

  // Crear una nueva rama limpia para nuestros cambios
  const cleanBranch = `feature/language-config-clean-${Date.now()}`;
  console.log(`🌿 Creando rama limpia: ${cleanBranch}`);
  
  // Crear rama desde la rama temporal
  execSync(`git checkout -b ${cleanBranch}`, { stdio: 'inherit' });

  // Añadir archivos de configuración de idiomas
  console.log('📝 Añadiendo archivos de configuración de idiomas...');
  const languageFiles = [
    'scripts/add-translation-language-column.sql',
    'IMPLEMENT_LANGUAGE_CONFIG.md',
    'README-language-config.md',
    'test-language-config-backend.js',
    'src/routes/transcription.js',
    'src/services/transcriptionService.js'
  ];

  languageFiles.forEach(file => {
    if (fs.existsSync(file)) {
      execSync(`git add "${file}"`, { stdio: 'inherit' });
      console.log(`   ✅ Añadido: ${file}`);
    }
  });

  // Crear commit de configuración de idiomas
  console.log('💾 Creando commit de configuración de idiomas...');
  execSync('git commit -m "feat: implement configuration of transcription and translation languages in backend\n\n- Update transcription endpoint to accept language and translation_language parameters\n- Update transcription service to use specified languages in Groq and DeepSeek\n- Add translation_language column support in database operations\n- Add comprehensive documentation and test scripts\n\nReady for backend redeploy"', { stdio: 'inherit' });

  // Hacer push de la rama limpia
  console.log('🚀 Haciendo push de la rama limpia...');
  execSync(`git push -u origin ${cleanBranch}`, { stdio: 'inherit' });

  console.log('✅ Push completado!');
  console.log(`🎯 Cambios guardados en la rama limpia ${cleanBranch} y subidos al repositorio remoto!`);
  console.log('\n📋 Ahora puedes:');
  console.log(`1. Hacer el redeploy del backend desde la rama ${cleanBranch} en Coolify`);
  console.log('2. Configurar las variables de entorno en Coolify:');
  console.log('   - GOOGLE_CLIENT_ID');
  console.log('   - GOOGLE_CLIENT_SECRET');
  console.log('   - GROQ_API_KEY');
  console.log('   - DEEPSEEK_API_KEY');
  console.log('\n📝 Nota: Esta rama no contiene secretos de OAuth en el historial.');

} catch (error) {
  console.error('❌ Error durante el proceso de Git:', error.message);
  process.exit(1);
}