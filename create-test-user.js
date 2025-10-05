require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase no configurado');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  console.log('🔍 Probando conexión y creando usuario de prueba...');
  
  try {
    // Crear usuario de prueba
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email: 'test@example.com',
        password_hash: 'demo123', // Contraseña simple para testing
        full_name: 'Usuario Demo',
        subscription_status: 'free',
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select();

    if (error) {
      console.log('⚠️ Error creando usuario (puede que ya exista):', error.message);
    } else {
      console.log('✅ Usuario de prueba creado:', data[0]);
    }

    // Verificar usuarios existentes
    const { data: users } = await supabase
      .from('users')
      .select('id, email, full_name, subscription_status');

    console.log('📋 Usuarios en la base de datos:');
    console.log(users);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

testAuth();