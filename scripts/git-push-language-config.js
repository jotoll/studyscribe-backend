// Script para hacer commit y push de los cambios de configuración de idiomas
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Preparando commit y push para configuración de idiomas...');

try {
  // Verificar que estamos en un repositorio Git
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    throw new Error('No se encuentra un repositorio Git en el directorio actual');
  }

  // Añadir archivos modificados y nuevos
  console.log('📝 Añadiendo archivos al staging area...');
  const filesToAdd = [
    'scripts/add-translation-language-column.sql',
    'IMPLEMENT_LANGUAGE_CONFIG.md',
    'README-language-config.md',
    'test-language-config-backend.js',
    'src/routes/transcription.js',
    'src/services/transcriptionService.js',
    'mobile/DicttrMobile/App.tsx',
    'mobile/DicttrMobile/components/ConfigMenu.tsx',
    'mobile/DicttrMobile/components/ConfigButton.tsx',
    'mobile/DicttrMobile/hooks/useConfig.ts',
    'mobile/DicttrMobile/services/api.ts',
    'mobile/DicttrMobile/components/RecordingProcessor.tsx',
    'scripts/git-commit-language-config.sh'
  ];

  // Verificar qué archivos existen antes de añadirlos
  const existingFiles = filesToAdd.filter(file => fs.existsSync(file));
  
  if (existingFiles.length === 0) {
    console.log('⚠️  No se encontraron archivos para añadir');
  } else {
    existingFiles.forEach(file => {
      console.log(`   - Añadiendo: ${file}`);
      execSync(`git add "${file}"`, { stdio: 'inherit' });
    });
  }

  // Crear commit
  console.log('💾 Creando commit...');
  execSync('git commit -m "feat: implement configuration of transcription and translation languages\n\n- Add language selection UI components in mobile app\n- Add ConfigMenu and ConfigButton components with flag indicators\n- Add useConfig hook for managing language preferences\n- Update backend to accept language and translation_language parameters\n- Update transcription service to use specified languages in Groq and DeepSeek\n- Add translation_language column to transcriptions table in Supabase\n- Add comprehensive documentation and test scripts"', { stdio: 'inherit' });

  console.log('✅ Commit creado exitosamente!');

  // Hacer push
  console.log('🚀 Haciendo push al repositorio remoto...');
  execSync('git push', { stdio: 'inherit' });

  console.log('✅ Push completado!');
  console.log('🎯 Configuración de idiomas guardada en Git y subida al repositorio remoto!');
  console.log('\n📋 Ahora puedes hacer el redeploy del backend en Coolify con estos cambios.');

} catch (error) {
  console.error('❌ Error durante el proceso de Git:', error.message);
  process.exit(1);
}