// Script para hacer commit y push final de la configuración de idiomas
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Haciendo commit y push final de configuración de idiomas...');

try {
  // Verificar que estamos en un repositorio Git
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    throw new Error('No se encuentra un repositorio Git en el directorio actual');
  }

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

  // Añadir archivos de OAuth restaurados
  console.log('📝 Añadiendo archivos de OAuth restaurados...');
  const oauthFiles = [
    'check-oauth-propagation.js',
    'test-new-oauth-credentials.js',
    'wait-for-oauth-propagation.js'
  ];

  oauthFiles.forEach(file => {
    if (fs.existsSync(file)) {
      execSync(`git add "${file}"`, { stdio: 'inherit' });
      console.log(`   ✅ Añadido: ${file}`);
    }
  });

  // Verificar el estado del staging area
  console.log('🔍 Verificando estado del staging area...');
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  console.log('Estado actual:');
  console.log(status);

  // Crear commit
  console.log('💾 Creando commit...');
  execSync('git commit -m "feat: implement configuration of transcription and translation languages\n\n- Update transcription endpoint to accept language and translation_language parameters\n- Update transcription service to use specified languages in Groq and DeepSeek\n- Add translation_language column support in database operations\n- Add comprehensive documentation and test scripts\n\n- Restore OAuth files without secrets\n\nReady for backend redeploy"', { stdio: 'inherit' });

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

} catch (error) {
  console.error('❌ Error durante el proceso de Git:', error.message);
  process.exit(1);
}