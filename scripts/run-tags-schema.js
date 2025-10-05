const { supabase } = require('../src/config/supabase');
const fs = require('fs');
const path = require('path');

async function runTagsSchema() {
  try {
    console.log('🚀 Ejecutando script de soporte para etiquetas...');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'add-tags-support.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Dividir el SQL en sentencias individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    let successCount = 0;
    let errorCount = 0;

    // Ejecutar cada sentencia SQL
    for (const statement of statements) {
      if (statement.startsWith('--') || statement === '') continue;

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // Si falla, intentar ejecutar directamente (para desarrollo)
          console.warn(`⚠️  Error ejecutando con RPC, intentando método alternativo: ${error.message}`);
          
          // Para desarrollo, podríamos usar una conexión directa a PostgreSQL
          // Pero por ahora solo mostramos el error
          console.error(`❌ Error ejecutando sentencia: ${statement.substring(0, 100)}...`);
          errorCount++;
        } else {
          console.log(`✅ Sentencia ejecutada: ${statement.substring(0, 50)}...`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Error ejecutando sentencia: ${err.message}`);
        console.error(`Sentencia: ${statement.substring(0, 100)}...`);
        errorCount++;
      }
    }

    console.log('\n📊 Resultados:');
    console.log(`✅ Sentencias exitosas: ${successCount}`);
    console.log(`❌ Sentencias con error: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 ¡Script de etiquetas ejecutado correctamente!');
      console.log('📋 Las tablas de etiquetas han sido creadas y configuradas.');
    } else {
      console.log('\n⚠️  Algunas sentencias fallaron. Es posible que necesites ejecutar el script manualmente en la consola de Supabase.');
      console.log('💡 Ve a la consola de Supabase y copia/pega el contenido de scripts/add-tags-support.sql');
    }

  } catch (error) {
    console.error('❌ Error ejecutando script de etiquetas:', error.message);
    console.log('\n💡 Para ejecutar el script manualmente:');
    console.log('1. Ve a la consola de Supabase (https://app.supabase.com)');
    console.log('2. Selecciona tu proyecto y ve a "SQL Editor"');
    console.log('3. Copia y pega el contenido de scripts/add-tags-support.sql');
    console.log('4. Ejecuta el script completo');
  }
}

// Si se ejecuta directamente desde la línea de comandos
if (require.main === module) {
  runTagsSchema();
}

module.exports = { runTagsSchema };
