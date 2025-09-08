// Test específico para DeepSeek sin depender de Groq
require('dotenv').config({ path: '.env' });
const { deepseekFormatV2 } = require('./src/services/deepseek-structurer');

async function testDeepSeekOnly() {
  console.log('🧪 Probando solo DeepSeek (sin Groq)...\n');

  const testTranscription = "Hoy vamos a estudiar álgebra lineal. Primero, matrices. Segundo, determinantes. Tercero, sistemas de ecuaciones.";

  try {
    console.log('📝 Texto de prueba:', testTranscription);
    console.log('🚀 Ejecutando deepseekFormatV2...');
    
    const result = await deepseekFormatV2(
      testTranscription,
      {
        curso: 'Matemáticas',
        asignatura: 'Álgebra Lineal', 
        idioma: 'es'
      },
      'test_deepseek_only_001'
    );

    console.log('\n🎉 DeepSeek completado exitosamente!');
    console.log('Doc ID:', result.doc_id);
    console.log('Número de bloques:', result.blocks.length);
    console.log('Versión:', result.version);
    
    console.log('\n📋 Bloques generados por DeepSeek:');
    result.blocks.forEach((block, index) => {
      console.log(`${index + 1}. [${block.type}] ${block.text || block.items?.join(', ')}`);
    });

    console.log('\n🔍 Verificando estructura JSON:');
    console.log('Tiene doc_id:', !!result.doc_id);
    console.log('Tiene meta:', !!result.meta);
    console.log('Tiene blocks array:', Array.isArray(result.blocks));
    console.log('Versión correcta:', result.version === 2);
    
    // Verificar que los bloques tienen la estructura correcta
    const validBlocks = result.blocks.every(block => 
      block.id && block.type && (block.text !== undefined || block.items !== undefined)
    );
    console.log('Bloques válidos:', validBlocks);

    console.log('\n📊 Meta información:');
    console.log('Curso:', result.meta.curso);
    console.log('Asignatura:', result.meta.asignatura);
    console.log('Idioma:', result.meta.idioma);

    if (validBlocks && result.version === 2) {
      console.log('\n✅ ¡DeepSeek está devolviendo JSON DocBlocksV2 perfectamente!');
      console.log('El problema NO es que DeepSeek devuelva markdown.');
      console.log('DeepSeek está respetando response_format: json_object correctamente.');
    } else {
      console.log('\n❌ Hay problemas con la estructura devuelta por DeepSeek.');
    }

  } catch (error) {
    console.error('❌ Error en DeepSeek:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.message.includes('DEEPSEEK_API_KEY')) {
      console.log('\n💡 Solución: Configura DEEPSEEK_API_KEY en backend/.env');
    }
  }
}

// Ejecutar test
testDeepSeekOnly();
