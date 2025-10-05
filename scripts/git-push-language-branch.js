// Script para crear una rama temporal con solo los cambios de idiomas y hacer push
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Creando rama temporal para cambios de configuración de idiomas...');

try {
  // Verificar que estamos en un repositorio Git
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    throw new Error('No se encuentra un repositorio Git en el directorio actual');
  }

  // Crear una nueva rama para nuestros cambios
  const branchName = `feature/language-config-${Date.now()}`;
  console.log(`🌿 Creando nueva rama: ${branchName}`);
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

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

  // Hacer push de la nueva rama
  console.log('🚀 Haciendo push de la rama al repositorio remoto...');
  execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });

  console.log('✅ Push completado!');
  console.log(`🎯 Cambios del backend guardados en la rama ${branchName} y subidos al repositorio remoto!`);
  console.log('\n📋 Ahora puedes:');
  console.log(`1. Hacer el redeploy del backend desde la rama ${branchName} en Coolify`);
  console.log('2. O fusionar esta rama con main cuando resuelvas los problemas de secretos');
  console.log('\n📝 Nota: Los cambios de la aplicación móvil (carpeta mobile) están en .gitignore y no se han subido.');

} catch (error) {
  console.error('❌ Error durante el proceso de Git:', error.message);
  process.exit(1);
}