// Script de depuración para identificar por qué el servidor está bloqueado
const http = require('http');
const { supabase } = require('./config/supabase');

console.log('🔍 INICIANDO DEPURACIÓN COMPLETA DEL SERVIDOR...');

// Función para probar el servidor HTTP básico
function testBasicServer() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Probando servidor HTTP básico...');
    
    const server = http.createServer((req, res) => {
      console.log('📡 Petición recibida:', req.url);
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Servidor HTTP básico funcionando\n');
    });
    
    server.listen(3002, '0.0.0.0', () => {
      console.log('✅ Servidor básico escuchando en puerto 3002');
      resolve(server);
    });
    
    server.on('error', (error) => {
      console.error('❌ Error en servidor básico:', error);
      reject(error);
    });
  });
}

// Función para probar Supabase
async function testSupabase() {
  console.log('🔄 Probando conexión Supabase...');
  try {
    const { data, error } = await supabase.from('transcriptions').select('id').limit(1);
    if (error) {
      console.log('❌ Error Supabase:', error.message);
      return false;
    }
    console.log('✅ Supabase conectado exitosamente');
    return true;
  } catch (error) {
    console.log('❌ Error conectando Supabase:', error.message);
    return false;
  }
}

// Función principal de depuración
async function debugServer() {
  console.log('\n=== INICIANDO DEPURACIÓN ===\n');
  
  // 1. Probar Supabase primero
  const supabaseOk = await testSupabase();
  if (!supabaseOk) {
    console.log('⚠️  Supabase falló - pero continuamos...');
  }
  
  // 2. Probar servidor HTTP básico
  try {
    await testBasicServer();
    console.log('✅ Servidor HTTP básico funciona correctamente');
  } catch (error) {
    console.error('❌ Servidor HTTP básico falló:', error);
  }
  
  // 3. Verificar variables de entorno
  console.log('\n📋 Variables de entorno:');
  console.log('- PORT:', process.env.PORT);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
  
  // 4. Probar conexión local
  console.log('\n🔄 Probando conexión local...');
  setTimeout(() => {
    http.get('http://localhost:3002', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('✅ Conexión local exitosa:', data);
        process.exit(0);
      });
    }).on('error', (err) => {
      console.log('❌ Conexión local falló:', err.message);
      process.exit(1);
    });
  }, 1000);
}

// Ejecutar depuración
debugServer().catch(error => {
  console.error('❌ Error en depuración:', error);
  process.exit(1);
});
