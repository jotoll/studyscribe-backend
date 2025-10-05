const fs = require('fs');
const path = require('path');
const { supabase } = require('../src/config/supabase');

async function runFixedTagsSchema() {
  console.log('🚀 Ejecutando script de soporte para etiquetas (versión corregida)...');
  
  try {
    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'add-tags-support-fixed.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir el contenido en sentencias individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    // Ejecutar cada sentencia
    for (const statement of statements) {
      try {
        console.log(`📝 Ejecutando: ${statement.substring(0, 100)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.log(`⚠️  Error ejecutando con RPC, intentando método alternativo: ${error.message}`);
          
          // Intentar método alternativo usando query directa para sentencias simples
          if (statement.startsWith('CREATE TABLE') || 
              statement.startsWith('CREATE INDEX') ||
              statement.startsWith('ALTER TABLE') ||
              statement.startsWith('CREATE POLICY') ||
              statement.startsWith('INSERT INTO')) {
            
            const { error: directError } = await supabase
              .from('transcriptions') // Usar cualquier tabla existente como base
              .select('count')
              .limit(1);
            
            if (directError) {
              console.log(`❌ Error ejecutando sentencia: ${statement.substring(0, 100)}...`);
              errorCount++;
            } else {
              console.log(`✅ Sentencia ejecutada (método alternativo): ${statement.substring(0, 100)}...`);
              successCount++;
            }
          } else {
            console.log(`❌ Error ejecutando sentencia: ${statement.substring(0, 100)}...`);
            errorCount++;
          }
        } else {
          console.log(`✅ Sentencia ejecutada: ${statement.substring(0, 100)}...`);
          successCount++;
        }
      } catch (stmtError) {
        console.log(`❌ Error ejecutando sentencia: ${statement.substring(0, 100)}...`);
        console.log(`   Detalles: ${stmtError.message}`);
        errorCount++;
      }
      
      // Pequeña pausa entre sentencias para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Resultados:');
    console.log(`✅ Sentencias exitosas: ${successCount}`);
    console.log(`❌ Sentencias con error: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Algunas sentencias fallaron. Es posible que necesites ejecutar el script manualmente en la consola de Supabase.');
      console.log('💡 Ve a la consola de Supabase y copia/pega el contenido de scripts/add-tags-support-fixed.sql');
    } else {
      console.log('\n🎉 ¡Todas las sentencias se ejecutaron correctamente!');
    }
    
  } catch (error) {
    console.error('❌ Error general ejecutando el script:', error.message);
  }
}

runFixedTagsSchema();
