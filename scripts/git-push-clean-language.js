// Script para hacer commit y push de los cambios de configuración de idiomas después de limpiar secretos
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Preparando commit y push para cambios de configuración de idiomas (sin secretos)...');

try {
  // Verificar que estamos en un repositorio Git
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    throw new Error('No se encuentra un repositorio Git en el directorio actual');
  }

  // Añadir archivos modificados (incluyendo los archivos limpiados)
  console.log('📝 Añadiendo archivos modificados al staging area...');
  
  // Añadir archivos de configuración de idiomas
  const languageFiles = [
    'scripts/add-translation-language-column.sql',
    'IMPLEMENT_LANGUAGE_CONFIG.md',
    'README-language-config.md',
    'test-language-config-backend.js',
    'src/routes/transcription.js',
    'src/services/transcriptionService.js'
  ];
  
  // Añadir archivos limpiados
  const cleanedFiles = [
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
    'check-supabase-credentials.js',
    'scripts/clean-oauth-secrets.js'
  ];
  
  const allFiles = [...languageFiles, ...cleanedFiles];
  
  // Verificar qué archivos existen antes de añadirlos
  const existingFiles = allFiles.filter(file => fs.existsSync(file));
  
  if (existingFiles.length === 0) {
    console.log('⚠️  No se encontraron archivos para añadir');
  } else {
    existingFiles.forEach(file => {
      console.log(`   - Añadiendo: ${file}`);
      execSync(`git add "${file}"`, { stdio: 'inherit' });
    });
  }

  // Verificar el estado del staging area
  console.log('🔍 Verificando estado del staging area...');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  console.log('Estado actual:');
  console.log(status);

  // Crear commit
  console.log('💾 Creando commit...');
  execSync('git commit -m "feat: implement configuration of transcription and translation languages in backend\n\n- Update transcription endpoint to accept language and translation_language parameters\n- Update transcription service to use specified languages in Groq and DeepSeek\n- Add translation_language column support in database operations\n- Add comprehensive documentation and test scripts\n\n- Clean OAuth secrets from files and replace with environment variables\n\nReady for backend redeploy"', { stdio: 'inherit' });

  console.log('✅ Commit creado exitosamente!');

  // Obtener el nombre de la rama actual
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  console.log(`🌿 Rama actual: ${currentBranch}`);

  // Hacer push de la rama actual
  console.log('🚀 Haciendo push de la rama al repositorio remoto...');
  execSync(`git push -u origin ${currentBranch}`, { stdio: 'inherit' });

  console.log('✅ Push completado!');
  console.log(`🎯 Cambios guardados en la rama ${currentBranch} y subidos al repositorio remoto!`);
  console.log('\n📋 Ahora puedes:');
  console.log(`1. Hacer el redeploy del backend desde la rama ${currentBranch} en Coolify`);
  console.log('2. Configurar las variables de entorno en Coolify:');
  console.log('   - GOOGLE_CLIENT_ID');
  console.log('   - GOOGLE_CLIENT_SECRET');
  console.log('   - GROQ_API_KEY');
  console.log('   - DEEPSEEK_API_KEY');
  console.log('\n📝 Nota: Los cambios de la aplicación móvil (carpeta mobile) están en .gitignore y no se han subido.');

} catch (error) {
  console.error('❌ Error durante el proceso de Git:', error.message);
  process.exit(1);
}