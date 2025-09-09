require('dotenv').config();
const { deepseekFormatV2 } = require('./src/services/deepseek-structurer');

async function testDeepSeekFormat() {
  console.log('🧪 Probando formato DeepSeek v2...\n');

  const testText = `
  Introducción a los algoritmos de ordenamiento

  Hoy vamos a estudiar diferentes métodos para ordenar datos.

  Los algoritmos más importantes son:
  1. Bubble sort
  2. Quick sort 
  3. Merge sort

  El bubble sort es el más simple pero también el menos eficiente.
  Tiene una complejidad temporal de O(n²).

  Por otro lado, quick sort es mucho más rápido en promedio.
  Su complejidad es O(n log n).

  Los puntos clave a recordar:
  • Elegir el algoritmo según el tamaño de datos
  • Considerar la complejidad temporal
  • Evaluar el uso de memoria
  `;

  const meta = {
    curso: 'Algoritmos y Estructuras de Datos',
    asignatura: 'Informática',
    idioma: 'es'
  };

  const doc_id = 'test_doc_' + Date.now();

  try {
    console.log('📝 Texto de prueba:', testText.substring(0, 100) + '...\n');
    console.log('🎯 Meta:', meta);
    console.log('🆔 Doc ID:', doc_id, '\n');

    const result = await deepseekFormatV2(testText, meta, doc_id);

    console.log('✅ Resultado de DeepSeek:');
    console.log(JSON.stringify(result, null, 2));

    // Validar estructura
    console.log('\n🔍 Validando estructura...');
    
    const validations = [
      { check: 'doc_id existe', value: !!result.doc_id },
      { check: 'doc_id coincide', value: result.doc_id === doc_id },
      { check: 'meta existe', value: !!result.meta },
      { check: 'meta.curso coincide', value: result.meta.curso === meta.curso },
      { check: 'meta.asignatura coincide', value: result.meta.asignatura === meta.asignatura },
      { check: 'meta.idioma coincide', value: result.meta.idioma === meta.idioma },
      { check: 'blocks es array', value: Array.isArray(result.blocks) },
      { check: 'tiene bloques', value: result.blocks.length > 0 },
      { check: 'version es 2', value: result.version === 2 }
    ];

    validations.forEach(v => {
      console.log(`${v.value ? '✅' : '❌'} ${v.check}`);
    });

    // Validar estructura de bloques
    console.log('\n📋 Validando bloques:');
    result.blocks.forEach((block, index) => {
      console.log(`\nBloque ${index + 1}:`);
      console.log(`  - ID: ${block.id}`);
      console.log(`  - Tipo: ${block.type}`);
      console.log(`  - Contenido: ${block.type.includes('list') ? JSON.stringify(block.items) : block.text}`);
      
      // Validar estructura del bloque
      const hasId = !!block.id;
      const hasValidType = ['h1', 'h2', 'h3', 'paragraph', 'bulleted_list', 'numbered_list', 'quote', 'code'].includes(block.type);
      const hasContent = block.type.includes('list') ? Array.isArray(block.items) : typeof block.text === 'string';
      
      console.log(`  - ✅ ID válido: ${hasId}`);
      console.log(`  - ✅ Tipo válido: ${hasValidType}`);
      console.log(`  - ✅ Contenido válido: ${hasContent}`);
    });

    const allValid = validations.every(v => v.value);
    console.log(`\n${allValid ? '🎉' : '💥'} Formato ${allValid ? 'CORRECTO' : 'INCORRECTO'}`);

    return result;

  } catch (error) {
    console.error('❌ Error en test:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar test
if (require.main === module) {
  testDeepSeekFormat();
}

module.exports = { testDeepSeekFormat };
