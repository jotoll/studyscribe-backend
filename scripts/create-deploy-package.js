// Script para crear un paquete de despliegue con solo los archivos necesarios
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { execSync } = require('child_process');

console.log('📦 Creando paquete de despliegue para configuración de idiomas...');

// Crear directorio para el paquete
const packageDir = 'deploy-package';
if (!fs.existsSync(packageDir)) {
  fs.mkdirSync(packageDir);
}

// Archivos necesarios para el despliegue
const requiredFiles = [
  'src/routes/transcription.js',
  'src/services/transcriptionService.js',
  'scripts/add-translation-language-column.sql',
  'IMPLEMENT_LANGUAGE_CONFIG.md',
  'README-language-config.md',
  'test-language-config-backend.js'
];

// Copiar archivos necesarios
console.log('📋 Copiando archivos necesarios...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const destPath = path.join(packageDir, file);
    const destDir = path.dirname(destPath);
    
    // Crear directorio si no existe
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copiar archivo
    fs.copyFileSync(file, destPath);
    console.log(`   ✅ Copiado: ${file}`);
  } else {
    console.log(`   ⚠️  No encontrado: ${file}`);
  }
});

// Crear archivo de instrucciones
const instructions = `# Instrucciones de Despliegue - Configuración de Idiomas

## Pasos para el despliegue en Coolify:

1. **Subir los archivos a tu servidor en Coolify**
   - Reemplaza los archivos existentes con los de este paquete
   - Asegúrate de que los archivos se coloquen en las mismas rutas

2. **Ejecutar el script SQL en Supabase**
   - Ejecuta el contenido del archivo: scripts/add-translation-language-column.sql
   - Esto agregará la columna translation_language a la tabla transcriptions

3. **Configurar variables de entorno en Coolify**
   - Asegúrate de que las siguientes variables de entorno estén configuradas:
     - GOOGLE_CLIENT_ID
     - GOOGLE_CLIENT_SECRET
     - GROQ_API_KEY
     - DEEPSEEK_API_KEY

4. **Reiniciar el servidor**
   - Reinicia el servidor en Coolify para que los cambios surtan efecto

5. **Probar la configuración**
   - Puedes usar el script test-language-config-backend.js para verificar que todo funciona correctamente

## Resumen de los cambios:

- Se ha modificado el endpoint de transcripción para aceptar los parámetros:
  - language: idioma de transcripción (ej. 'es', 'en', 'fr')
  - translation_language: idioma de traducción (ej. 'es', 'en', 'fr')

- Se ha actualizado el servicio de transcripción para usar estos idiomas en:
  - Groq Whisper API (para transcripción)
  - DeepSeek API (para traducción y mejora)

- Se ha agregado soporte para guardar ambos idiomas en la base de datos

## Idiomas soportados:

- Español (es) 🇪🇸
- Inglés (en) 🇬🇧
- Francés (fr) 🇫🇷
- Alemán (de) 🇩🇪
- Italiano (it) 🇮🇹
- Portugués (pt) 🇵🇹
- Ruso (ru) 🇷🇺
- Japonés (ja) 🇯🇵
- Chino (zh) 🇨🇳
- Árabe (ar) 🇸🇦

## Notas:

- Los cambios en la aplicación móvil (carpeta mobile) están en .gitignore y no se incluyen en este paquete
- Si necesitas los cambios de la aplicación móvil, cópialos manualmente de la carpeta mobile
`;

fs.writeFileSync(path.join(packageDir, 'INSTRUCCIONES_DESPLEGUE.md'), instructions);

// Crear archivo ZIP
console.log('\n🗜️  Creando archivo ZIP...');
const output = fs.createWriteStream('language-config-deploy.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
  console.log(`✅ Paquete de despliegue creado: language-config-deploy.zip (${archive.pointer()} bytes)`);
  console.log('\n📋 Pasos siguientes:');
  console.log('1. Sube el archivo language-config-deploy.zip a tu servidor');
  console.log('2. Descomprime el archivo en el directorio del proyecto');
  console.log('3. Sigue las instrucciones en INSTRUCCIONES_DESPLEGUE.md');
  console.log('4. Configura las variables de entorno en Coolify');
  console.log('5. Reinicia el servidor');
});

archive.on('error', (err) => {
  throw err;
});

archive.pipe(output);
archive.directory(packageDir, false);
archive.finalize();