require('dotenv').config();
const { deepseekFormatV2 } = require('./src/services/deepseek-structurer');

async function debugDeepSeekOutput() {
  console.log('🐛 Debug: Verificando qué devuelve DeepSeek...\n');

  const testText = "Hola, esto es una prueba simple.";

  const meta = {
    curso: 'Test',
    asignatura: 'Debug',
    idioma: 'es'
  };

  const doc_id = 'debug_doc_' + Date.now();

  try {
    console.log('📝 Texto de prueba:', testText);
    console.log('🎯 Meta:', meta);
    console.log('🆔 Doc ID:', doc_id, '\n');

    const result = await deepseekFormatV2(testText, meta, doc_id);

    console.log('✅ Resultado RAW de DeepSeek:');
    console.log(JSON.stringify(result, null, 2));

    // Verificar estructura detallada
    console.log('\n🔍 Análisis detallado:');
    console.log('- doc_id:', result.doc_id);
    console.log('- meta:', result.meta);
    console.log('- blocks length:', result.blocks.length);
    console.log('- version:', result.version);
    
    result.blocks.forEach((block, index) => {
      console.log(`\n📦 Bloque ${index + 1}:`);
      console.log('  - id:', block.id);
      console.log('  - type:', block.type);
      console.log('  - has text:', !!block.text);
      console.log('  - has items:', !!block.items);
      console.log('  - items type:', Array.isArray(block.items) ? 'array' : typeof block.items);
      console.log('  - text value:', block.text);
      console.log('  - items value:', block.items);
    });

  } catch (error) {
    console.error('❌ Error en debug:', error);
    console.error('Stack:', error.stack);
  }
}

if (require.main === module) {
  debugDeepSeekOutput();
}

module.exports = { debugDeepSeekOutput };
