// Script para hacer commit y push solo de los cambios del backend
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Preparando commit y push para cambios del backend (configuración de idiomas)...');

try {
  // Verificar que estamos en un repositorio Git
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    throw new Error('No se encuentra un repositorio Git en el directorio actual');
  }

  // Añadir solo archivos del backend
  console.log('📝 Añadiendo archivos del backend al staging area...');
  const backendFilesToAdd = [
    'scripts/add-translation-language-column.sql',
    'IMPLEMENT_LANGUAGE_CONFIG.md',
    'README-language-config.md',
    'test-language-config-backend.js',
    'src/routes/transcription.js',
    'src/services/transcriptionService.js'
  ];

  // Verificar qué archivos existen antes de añadirlos
  const existingFiles = backendFilesToAdd.filter(file => fs.existsSync(file));
  
  if (existingFiles.length === 0) {
    console.log('⚠️  No se encontraron archivos del backend para añadir');
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

  // Hacer push
  console.log('🚀 Haciendo push al repositorio remoto...');
  execSync('git push', { stdio: 'inherit' });

  console.log('✅ Push completado!');
  console.log('🎯 Cambios del backend guardados en Git y subidos al repositorio remoto!');
  console.log('\n📋 Ahora puedes hacer el redeploy del backend en Coolify con estos cambios.');
  console.log('\n📝 Nota: Los cambios de la aplicación móvil (carpeta mobile) están en .gitignore y no se han subido.');

} catch (error) {
  console.error('❌ Error durante el proceso de Git:', error.message);
  process.exit(1);
}