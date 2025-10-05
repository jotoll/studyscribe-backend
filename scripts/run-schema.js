require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase no configurado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSchema() {
  console.log('🚀 Ejecutando schema de base de datos...');
  
  try {
    // Leer el archivo de schema
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, 'supabase-schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    
    // Dividir el SQL en consultas individuales
    const queries = schemaSQL.split(';').filter(query => query.trim());
    
    console.log(`📋 Ejecutando ${queries.length} consultas...`);
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i] + ';';
      if (query.trim()) {
        console.log(`🔧 Ejecutando consulta ${i + 1}/${queries.length}...`);
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: query });
          if (error) {
            console.log(`⚠️  Error en consulta ${i + 1}:`, error.message);
            // Intentar ejecutar directamente si la función exec_sql no existe
            const { error: directError } = await supabase.from('pg_proc').insert({}); // Esto fallará pero probará conexión
            if (directError) {
              console.log('ℹ️  La función exec_sql no existe, ejecutando manualmente en Supabase Dashboard');
              break;
            }
          }
        } catch (err) {
          console.log(`⚠️  Error ejecutando consulta ${i + 1}:`, err.message);
        }
      }
    }
    
    console.log('✅ Schema ejecutado. Para completar:');
    console.log('1. Ve a https://sspkltkalkcwwfapfjuy.supabase.co');
    console.log('2. SQL Editor > Ejecuta el contenido de backend/scripts/supabase-schema.sql');
    console.log('3. Las tablas se crearán automáticamente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

runSchema();